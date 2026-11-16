/* global window, Chess */
/* Xake Hito 9: lecciones educativas y progreso local. JavaScript ES5. */
(function (root) {
  'use strict';
  var Xake = root.Xake = root.Xake || {};
  var KEY = 'xake:v1:learnProgress';
  var FILES = 'abcdefgh';
  var LESSONS = [
    { id: 'pawn-move', group: 'pieces', piece: 'p', kind: 'move', from: 'e2', to: 'e4', setup: { a1: 'K', h8: 'k', e2: 'P' } },
    { id: 'pawn-capture', group: 'pieces', piece: 'p', kind: 'capture', from: 'e4', to: 'd5', setup: { a1: 'K', h8: 'k', e4: 'P', d5: 'p' } },
    { id: 'rook-move', group: 'pieces', piece: 'r', kind: 'move', from: 'a4', to: 'a7', setup: { e1: 'K', h8: 'k', a4: 'R' } },
    { id: 'rook-capture', group: 'pieces', piece: 'r', kind: 'capture', from: 'a4', to: 'a7', setup: { e1: 'K', h8: 'k', a4: 'R', a7: 'p' } },
    { id: 'bishop-move', group: 'pieces', piece: 'b', kind: 'move', from: 'c4', to: 'f7', setup: { e1: 'K', h8: 'k', c4: 'B' } },
    { id: 'bishop-capture', group: 'pieces', piece: 'b', kind: 'capture', from: 'c4', to: 'f7', setup: { e1: 'K', h8: 'k', c4: 'B', f7: 'p' } },
    { id: 'knight-move', group: 'pieces', piece: 'n', kind: 'move', from: 'b1', to: 'c3', setup: { e1: 'K', h8: 'k', b1: 'N' } },
    { id: 'knight-capture', group: 'pieces', piece: 'n', kind: 'capture', from: 'b1', to: 'c3', setup: { e1: 'K', h8: 'k', b1: 'N', c3: 'p' } },
    { id: 'queen-move', group: 'pieces', piece: 'q', kind: 'move', from: 'd4', to: 'd7', setup: { g1: 'K', a8: 'k', d4: 'Q' } },
    { id: 'queen-capture', group: 'pieces', piece: 'q', kind: 'capture', from: 'd4', to: 'd7', setup: { g1: 'K', a8: 'k', d4: 'Q', d7: 'p' } },
    { id: 'king-move', group: 'pieces', piece: 'k', kind: 'move', from: 'e4', to: 'e5', setup: { e4: 'K', h8: 'k' } },
    { id: 'king-capture', group: 'pieces', piece: 'k', kind: 'capture', from: 'e4', to: 'd5', setup: { e4: 'K', h8: 'k', d5: 'r' } },
    { id: 'special-check', group: 'special', piece: 'r', kind: 'check', from: 'a7', to: 'e7', setup: { b1: 'K', e8: 'k', a7: 'R' } },
    { id: 'special-castle', group: 'special', piece: 'k', kind: 'castle', from: 'e1', to: 'g1', setup: { e1: 'K', h1: 'R', e8: 'k' }, castling: 'K' },
    { id: 'special-promote', group: 'special', piece: 'p', kind: 'promotion', from: 'g7', to: 'g8', setup: { h1: 'K', a8: 'k', g7: 'P' } }
  ];
  function goodSquare(square) { return typeof square === 'string' && /^[a-h][1-8]$/.test(square); }
  function fenFor(lesson) {
    if (!lesson || !lesson.setup) { return null; }
    var squares = {}, key, i, r, f, empty, line, rows = [], code;
    for (key in lesson.setup) {
      if (Object.prototype.hasOwnProperty.call(lesson.setup, key)) {
        if (!goodSquare(key) || !/^[KQRBNPkqrbnp]$/.test(lesson.setup[key])) { return null; }
        squares[key] = lesson.setup[key];
      }
    }
    for (r = 8; r >= 1; r--) {
      line = ''; empty = 0;
      for (f = 0; f < 8; f++) {
        code = squares[FILES.charAt(f) + r];
        if (!code) { empty++; }
        else {
          if (empty) { line += empty; empty = 0; }
          line += code;
        }
      }
      if (empty) { line += empty; }
      rows.push(line);
    }
    return rows.join('/') + ' w ' + (lesson.castling || '-') + ' - 0 1';
  }
  function find(id) {
    var i;
    for (i = 0; i < LESSONS.length; i++) { if (LESSONS[i].id === id) { return LESSONS[i]; } }
    return null;
  }
  function legal(lesson) {
    if (!lesson || !root.Chess) { return false; }
    try {
      var chess = new root.Chess(), moves, i, fen = fenFor(lesson);
      if (!fen || !chess.load(fen)) { return false; }
      if (chess.in_check()) { return false; }
      moves = chess.moves({ square: lesson.from, verbose: true });
      for (i = 0; i < moves.length; i++) {
        if (moves[i].to === lesson.to && (lesson.kind !== 'promotion' || moves[i].promotion === 'q')) {
          return true;
        }
      }
    } catch (e) { return false; }
    return false;
  }
  function correct(lesson, before, from, to, promotion) {
    if (!lesson || from !== lesson.from || to !== lesson.to || !root.Chess) { return false; }
    var chess = new root.Chess(), move, fen = typeof before === 'string' ? before : fenFor(lesson);
    try {
      if (!chess.load(fen) || chess.in_check()) { return false; }
      move = chess.move({ from: from, to: to, promotion: promotion || 'q' });
      if (!move) { return false; }
      if (lesson.kind === 'capture' && !move.captured) { return false; }
      if (lesson.kind === 'move' && !!move.captured) { return false; }
      if (lesson.kind === 'check' && !chess.in_check()) { return false; }
      if (lesson.kind === 'castle' && (!chess.get('g1') || chess.get('g1').type !== 'k' ||
        !chess.get('f1') || chess.get('f1').type !== 'r')) { return false; }
      if (lesson.kind === 'promotion' && !move.promotion) { return false; }
      return true;
    } catch (e) { return false; }
  }
  function read() {
    var data;
    try {
      data = JSON.parse(root.localStorage.getItem(KEY) || 'null');
      if (!data || data.schemaVersion !== 1 || !data.completed || typeof data.completed !== 'object' ||
        Object.prototype.toString.call(data.completed) === '[object Array]') { return {}; }
      var out = {}, i, key;
      for (i = 0; i < LESSONS.length; i++) {
        key = LESSONS[i].id;
        if (data.completed[key] === true) { out[key] = true; }
      }
      return out;
    } catch (e) { return {}; }
  }
  function mark(id) {
    if (!find(id)) { return false; }
    var completed = read();
    completed[id] = true;
    try { root.localStorage.setItem(KEY, JSON.stringify({ schemaVersion: 1, completed: completed })); return true; }
    catch (e) { return false; }
  }
  function count() {
    var completed = read(), n = 0, i;
    for (i = 0; i < LESSONS.length; i++) { if (completed[LESSONS[i].id]) { n++; } }
    return n;
  }
  Xake.Learn = {
    lessons: LESSONS, find: find, fenFor: fenFor, legal: legal, correct: correct,
    progress: read, mark: mark, count: count, storageKey: KEY
  };
}(typeof window !== 'undefined' ? window : this));
