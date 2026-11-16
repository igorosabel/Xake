/* global window, Chess */
/* Xake Hito 6 - mate en dos forzado (ES5). Sin motor externo ni WebAssembly. */
(function (root) {
  'use strict';
  var Xake = root.Xake = root.Xake || {};
  var FILES = 'abcdefgh';
  var MAX_PIECES = 6; // Evita congelar el iPad 3 al analizar ejércitos enormes.
  var MAX_ROOT = 48, MAX_REPLIES = 16, MAX_VISITS = 1600;
  var MAX_MS = 1600, CACHE_LIMIT = 16;
  var cache = {}, cacheOrder = [];
  function square(i) { return FILES.charAt(i & 7) + String(8 - (i >> 4)); }
  function plain(m) { return { from: square(m.f), to: square(m.t), promotion: m.promo || null }; }
  function key(m) { return m.from + m.to + (m.promotion || ''); }
  function same(a, b) { return !!a && !!b && key(a) === key(b); }
  function pieceCount(c) {
    var b = c.search_state().b, i, total = 0;
    for (i = 0; i < 128; i++) { if (!(i & 0x88) && b[i] !== '.') { total++; } }
    return total;
  }
  function safeLoad(fen) {
    if (typeof fen !== 'string' || fen.length > 160) { return null; }
    var c = new root.Chess();
    if (!c.load(fen) || c.game_over()) { return null; }
    return c;
  }
  function remember(fen, result) {
    if (!Object.prototype.hasOwnProperty.call(cache, fen)) {
      cacheOrder.push(fen);
      if (cacheOrder.length > CACHE_LIMIT) { delete cache[cacheOrder.shift()]; }
    }
    cache[fen] = result;
    return result;
  }
  function analysis(fen) {
    if (typeof fen !== 'string') { return { status: 'invalid', branches: [] }; }
    if (Object.prototype.hasOwnProperty.call(cache, fen)) { return cache[fen]; }
    var c = safeLoad(fen), first, reply, finalMoves, result = [], i, j, k, m, response, mateMoves;
    var visits = 0, start = Date.now(), valid, replies;
    if (!c) { return remember(fen, { status: 'invalid', branches: [] }); }
    if (pieceCount(c) > MAX_PIECES) { return remember(fen, { status: 'too-complex', branches: [] }); }
    first = c.search_moves();
    if (first.length > MAX_ROOT) { return remember(fen, { status: 'too-complex', branches: [] }); }
    for (i = 0; i < first.length; i++) {
      if (Date.now() - start > MAX_MS) { return remember(fen, { status: 'too-complex', branches: [] }); }
      m = first[i]; valid = true; replies = [];
      c.search_play(m);
      try {
        // Mate en una jugada o ahogado no cuentan como mate en dos.
        if (c.in_checkmate() || c.in_stalemate() || c.in_draw()) { continue; }
        reply = c.search_moves();
        if (!reply.length) { continue; }
        if (reply.length > MAX_REPLIES) { return remember(fen, { status: 'too-complex', branches: [] }); }
        for (j = 0; j < reply.length; j++) {
          if (Date.now() - start > MAX_MS) { return remember(fen, { status: 'too-complex', branches: [] }); }
          response = reply[j]; mateMoves = [];
          c.search_play(response);
          try {
            if (c.in_draw()) { valid = false; break; }
            finalMoves = c.search_moves();
            for (k = 0; k < finalMoves.length; k++) {
              visits++;
              if (visits > MAX_VISITS) { return remember(fen, { status: 'too-complex', branches: [] }); }
              c.search_play(finalMoves[k]);
              try { if (c.in_checkmate()) { mateMoves.push(plain(finalMoves[k])); } }
              finally { c.search_undo(); }
            }
          } finally { c.search_undo(); }
          if (!mateMoves.length) { valid = false; break; }
          replies.push({ move: plain(response), mateMoves: mateMoves });
        }
        if (valid && replies.length === reply.length) { result.push({ first: plain(m), replies: replies }); }
      } finally { c.search_undo(); }
    }
    return remember(fen, { status: 'ok', branches: result });
  }
  function firstMoves(fen) {
    var a = analysis(fen), out = [], i;
    for (i = 0; i < a.branches.length; i++) { out.push(a.branches[i].first); }
    return out;
  }
  function replyFor(fen, first) {
    var branches = analysis(fen).branches, i, j, choices, best = null;
    for (i = 0; i < branches.length; i++) {
      if (!same(branches[i].first, first)) { continue; }
      choices = branches[i].replies;
      // El rival elige la defensa que deja menos mates posibles.
      for (j = 0; j < choices.length; j++) {
        if (!best || choices[j].mateMoves.length < best.mateMoves.length ||
          (choices[j].mateMoves.length === best.mateMoves.length &&
            key(choices[j].move) < key(best.move))) { best = choices[j]; }
      }
      return best;
    }
    return null;
  }
  Xake.MateTwo = {
    analysis: analysis, firstMoves: firstMoves, replyFor: replyFor, same: same,
    maxPieces: MAX_PIECES
  };
}(typeof window !== 'undefined' ? window : this));
