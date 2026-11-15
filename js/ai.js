/* global window, Worker, Chess */
/* Xake - búsqueda de ajedrez. JavaScript ES5; también ejecutable en un Web Worker. */
(function (root) {
  'use strict';
  var Xake = root.Xake = root.Xake || {};
  var FILES = 'abcdefgh';
  var VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
  var MATE = 100000;
  var TIMEOUT = { cancelled: true };
  var controller = null;
  var requestId = 0;

  function square(i) { return FILES.charAt(i & 7) + (8 - (i >> 4)); }
  function publicMove(m) { return { from: square(m.f), to: square(m.t), promotion: m.promo || null }; }
  function isOn(i) { return i >= 0 && i < 128 && !(i & 0x88); }
  function countPieces(s) {
    var total = 0, i;
    for (i = 0; i < 128; i++) { if (isOn(i) && s.b[i] !== '.') { total++; } }
    return total;
  }
  function evaluate(chess) {
    var s = chess.search_state(), b = s.b, value = 0, i, p, v, file, rank, center, advancement;
    var late = countPieces(s) <= 12;
    for (i = 0; i < 128; i++) {
      if (!isOn(i) || b[i] === '.') { continue; }
      p = b[i].toLowerCase();
      file = i & 7; rank = i >> 4;
      center = 7 - Math.abs(3.5 - file) - Math.abs(3.5 - rank);
      v = VALUES[p] || 0;
      if (p === 'p') {
        advancement = (b[i] === 'P' ? 6 - rank : rank - 1);
        v += advancement * 6 + center * 2;
      } else if (p === 'n') { v += center * 9; }
      else if (p === 'b') { v += center * 4; }
      else if (p === 'q') { v += center * 2; }
      else if (p === 'k' && late) { v += center * 6; }
      if (b[i] === b[i].toUpperCase()) { value += v; }
      else { value -= v; }
    }
    return (s.t === 1 ? value : -value);
  }
  function moveValue(state, move, pv) {
    var taken = state.b[move.t], moving = state.b[move.f].toLowerCase(), val = 0;
    if (taken !== '.') { val += (VALUES[taken.toLowerCase()] || 0) * 16 - (VALUES[moving] || 0); }
    if (move.flag === 'e') { val += 1500; }
    if (move.promo) { val += (VALUES[move.promo] || 0) * 16; }
    if (pv && pv.f === move.f && pv.t === move.t && pv.promo === move.promo) { val += 20000; }
    return val;
  }
  function ordered(state, moves, pv) {
    var scored = [], i;
    for (i = 0; i < moves.length; i++) { scored.push({ move: moves[i], value: moveValue(state, moves[i], pv) }); }
    scored.sort(function (a, b) { return b.value - a.value; });
    for (i = 0; i < moves.length; i++) { moves[i] = scored[i].move; }
    return moves;
  }
  function checkDeadline(ctx) {
    ctx.nodes++;
    if ((ctx.nodes & 63) === 0 && Date.now() > ctx.deadline) { throw TIMEOUT; }
  }
  function negamax(chess, depth, alpha, beta, ply, ctx) {
    var moves, i, m, score, best = -MATE - 500;
    checkDeadline(ctx);
    if (chess.search_state().half >= 100 || chess.insufficient_material()) { return 0; }
    if (depth <= 0) {
      if (chess.in_check() && !chess.search_moves().length) { return -MATE + ply; }
      return evaluate(chess);
    }
    moves = chess.search_moves();
    if (!moves.length) { return chess.in_check() ? -MATE + ply : 0; }
    ordered(chess.search_state(), moves, null);
    for (i = 0; i < moves.length; i++) {
      m = moves[i];
      chess.search_play(m);
      try { score = -negamax(chess, depth - 1, -beta, -alpha, ply + 1, ctx); }
      finally { chess.search_undo(); }
      if (score > best) { best = score; }
      if (score > alpha) { alpha = score; }
      if (alpha >= beta) { break; }
    }
    return best;
  }
  function rootSearch(chess, depth, ctx, previous) {
    var moves = ordered(chess.search_state(), chess.search_moves(), previous), best = null;
    var bestScore = -MATE - 500, alpha = -MATE - 500, i, score, m;
    for (i = 0; i < moves.length; i++) {
      checkDeadline(ctx);
      m = moves[i];
      chess.search_play(m);
      try { score = -negamax(chess, depth - 1, -MATE - 500, -alpha, 1, ctx); }
      finally { chess.search_undo(); }
      if (score > bestScore) { bestScore = score; best = m; }
      if (score > alpha) { alpha = score; }
    }
    return best;
  }
  function shallow(chess, level) {
    var moves = chess.search_moves(), best = null, bestScore = -Infinity, i, m, score;
    if (!moves.length) { return null; }
    if (level === 1) { return moves[Math.floor(Math.random() * moves.length)]; }
    for (i = 0; i < moves.length; i++) {
      m = moves[i];
      chess.search_play(m);
      try {
        score = -evaluate(chess);
        if (chess.in_check()) { score += 12; }
        if (chess.in_checkmate()) { score += MATE; }
        if (chess.in_stalemate()) { score = 0; }
        // En Fácil hay errores y variedad deliberados.
        score += (Math.random() - 0.5) * (level === 2 ? 270 : 12);
      } finally { chess.search_undo(); }
      if (score > bestScore) { bestScore = score; best = m; }
    }
    return best;
  }
  /* Calcula y devuelve una jugada legal. onDepth recibe resultados COMPLETADOS
     a cada profundidad; el hilo principal puede conservarlos si hay que cortar. */
  function compute(fen, level, onDepth, budget) {
    var chess = new root.Chess(), best, depth, target, ctx;
    level = Math.max(1, Math.min(4, Number(level) || 1));
    if (!chess.load(fen) || chess.game_over()) { return null; }
    best = shallow(chess, level === 1 ? 1 : 2);
    if (!best) { return null; }
    if (onDepth) { onDepth(publicMove(best), 0); }
    if (level <= 2) { return publicMove(best); }
    ctx = { deadline: Date.now() + (budget || (level === 3 ? 1300 : 3000)), nodes: 0 };
    target = level === 3 ? 2 : 3;
    for (depth = 1; depth <= target; depth++) {
      try {
        best = rootSearch(chess, depth, ctx, best);
        if (onDepth && best) { onDepth(publicMove(best), depth); }
      } catch (e) {
        if (e !== TIMEOUT) { throw e; }
        break;
      }
    }
    return best ? publicMove(best) : null;
  }
  function cancel() {
    requestId++;
    if (controller && controller.worker) { controller.worker.terminate(); }
    if (controller && controller.timer) { root.clearTimeout(controller.timer); }
    controller = null;
  }
  /* El controlador solo se utiliza en la ventana, no dentro del worker. */
  function find(fen, level, callback) {
    cancel();
    var myId = requestId, worker, current = null, finished = false;
    var limit = level >= 4 ? 3600 : level === 3 ? 1800 : 950;
    function done(move) {
      if (finished || myId !== requestId) { return; }
      finished = true;
      cancel();
      callback(move);
    }
    function fallback() {
      // Sin Web Worker no hacemos una búsqueda profunda en el hilo del iPad.
      root.setTimeout(function () {
        if (myId !== requestId) { return; }
        var result = null;
        try { result = compute(fen, Math.min(2, level), null, 100); } catch (e) { result = null; }
        done(result);
      }, 0);
    }
    if (typeof root.Worker !== 'function') { fallback(); return; }
    try { worker = new root.Worker('js/ai-worker.js'); }
    catch (e) { fallback(); return; }
    controller = { worker: worker, timer: null };
    worker.onmessage = function (event) {
      if (myId !== requestId || finished || !event.data) { return; }
      if (event.data.type === 'progress' && event.data.move) { current = event.data.move; }
      if (event.data.type === 'result') { done(event.data.move || current); }
    };
    worker.onerror = function () {
      if (myId !== requestId) { return; }
      worker.terminate(); controller = null;
      if (current) { done(current); } else { fallback(); }
    };
    controller.timer = root.setTimeout(function () { done(current); }, limit);
    worker.postMessage({ type: 'find', fen: fen, level: level, budget: limit - 300 });
  }
  Xake.AI = { compute: compute, find: find, cancel: cancel };
}(typeof window !== 'undefined' ? window : this));
