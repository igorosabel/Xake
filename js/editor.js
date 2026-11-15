/* global window, Chess */
/* Xake - modelo del editor. ES5, sin dependencias del DOM ni de APIs modernas. */
(function (root) {
  'use strict';
  var Xake = root.Xake = root.Xake || {};
  var TYPES = ['k', 'q', 'r', 'b', 'n', 'p'];
  var FILES = 'abcdefgh';
  var CLASSIC_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  var CLASSIC = { k: 1, q: 1, r: 2, b: 2, n: 2, p: 8 };
  function copyCounts(source) {
    var dst = {}, i, key, n;
    for (i = 0; i < TYPES.length; i++) {
      key = TYPES[i]; n = source && source[key];
      dst[key] = typeof n === 'number' && isFinite(n) && Math.floor(n) === n && n >= 0 && n <= 63 ? n : 0;
    }
    return dst;
  }
  function emptyCounts() { return { k: 1, q: 0, r: 0, b: 0, n: 0, p: 0 }; }
  function countsValid(c) {
    var i, key;
    if (!c || typeof c !== 'object' || c.k !== 1) { return false; }
    for (i = 0; i < TYPES.length; i++) {
      key = TYPES[i];
      if (typeof c[key] !== 'number' || !isFinite(c[key]) || Math.floor(c[key]) !== c[key] || c[key] < 0 || c[key] > 63) { return false; }
    }
    return true;
  }
  function emptyBoard() {
    var b = [], i;
    for (i = 0; i < 64; i++) { b.push('.'); }
    return b;
  }
  function boardFromFen(fen) {
    var rows = typeof fen === 'string' ? fen.split(' ')[0].split('/') : [], b = [], i, j, c, n;
    if (rows.length !== 8) { return null; }
    for (i = 0; i < 8; i++) {
      n = 0;
      for (j = 0; j < rows[i].length; j++) {
        c = rows[i].charAt(j);
        if (/^[1-8]$/.test(c)) {
          for (var k = 0; k < Number(c); k++) { b.push('.'); n++; }
        } else if (/^[kqrbnpKQRBNP]$/.test(c)) { b.push(c); n++; }
        else { return null; }
      }
      if (n !== 8) { return null; }
    }
    return b.length === 64 ? b : null;
  }
  function fenFromBoard(board, turn) {
    var rows = [], row, missing, i, f, piece;
    for (i = 0; i < 8; i++) {
      row = ''; missing = 0;
      for (f = 0; f < 8; f++) {
        piece = board[i * 8 + f];
        if (piece === '.') { missing++; }
        else { if (missing) { row += missing; missing = 0; } row += piece; }
      }
      if (missing) { row += missing; }
      rows.push(row);
    }
    return rows.join('/') + ' ' + (turn === 'b' ? 'b' : 'w') + ' - - 0 1';
  }
  function sqIndex(square) {
    if (!/^[a-h][1-8]$/.test(square || '')) { return -1; }
    return (8 - Number(square.charAt(1))) * 8 + FILES.indexOf(square.charAt(0));
  }
  function pieceCounts(board, color) {
    var result = { k: 0, q: 0, r: 0, b: 0, n: 0, p: 0 }, i, p;
    for (i = 0; i < 64; i++) {
      p = board[i];
      if (p !== '.' && (color === 'w' ? p === p.toUpperCase() : p === p.toLowerCase())) { result[p.toLowerCase()]++; }
    }
    return result;
  }
  function sum(counts) { var n = 0, i; for (i = 0; i < TYPES.length; i++) { n += counts[TYPES[i]]; } return n; }
  function sameCounts(a, b) { var i; for (i = 0; i < TYPES.length; i++) { if (a[TYPES[i]] !== b[TYPES[i]]) { return false; } } return true; }
  function queenTouchKings(board) {
    var a = board.indexOf('K'), b = board.indexOf('k');
    return a >= 0 && b >= 0 && Math.abs(a % 8 - b % 8) <= 1 && Math.abs(Math.floor(a / 8) - Math.floor(b / 8)) <= 1;
  }
  function shuffled(array) {
    var a = array.slice(), i, j, tmp;
    for (i = a.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); tmp = a[i]; a[i] = a[j]; a[j] = tmp; }
    return a;
  }
  function Editor() {
    this.armies = { w: copyCounts(CLASSIC), b: copyCounts(CLASSIC) };
    this.board = emptyBoard();
    this.turn = 'w';
    this.name = '';
    this.id = null;
    this.createdAt = null;
    this._undo = [];
    this._redo = [];
  }
  Editor.prototype.state = function () {
    return { armies: { w: copyCounts(this.armies.w), b: copyCounts(this.armies.b) },
      board: this.board.slice(), turn: this.turn };
  };
  Editor.prototype.commit = function () {
    this._undo.push(this.state());
    if (this._undo.length > 80) { this._undo.shift(); }
    this._redo = [];
  };
  Editor.prototype.undo = function () {
    if (!this._undo.length) { return false; }
    this._redo.push(this.state()); this.recover(this._undo.pop()); return true;
  };
  Editor.prototype.redo = function () {
    if (!this._redo.length) { return false; }
    this._undo.push(this.state()); this.recover(this._redo.pop()); return true;
  };
  Editor.prototype.recover = function (s) {
    this.armies = { w: copyCounts(s.armies.w), b: copyCounts(s.armies.b) };
    this.board = s.board.slice(); this.turn = s.turn;
  };
  Editor.prototype.total = function (color) { return sum(this.armies[color]); };
  Editor.prototype.placed = function (color) { return pieceCounts(this.board, color); };
  Editor.prototype.remaining = function (color, type) { return this.armies[color][type] - this.placed(color)[type]; };
  Editor.prototype.get = function (square) {
    var n = sqIndex(square), c = n < 0 ? '.' : this.board[n];
    return c === '.' ? null : { type: c.toLowerCase(), color: c === c.toUpperCase() ? 'w' : 'b' };
  };
  Editor.prototype.setCount = function (color, type, value) {
    var other, placed;
    if ((color !== 'w' && color !== 'b') || TYPES.indexOf(type) < 0 || !isFinite(value) || Math.floor(value) !== value || value < (type === 'k' ? 1 : 0) || (type === 'k' && value !== 1) || value > 63) { return 'invalid'; }
    if (value === this.armies[color][type]) { return null; }
    placed = this.placed(color)[type];
    if (value < placed) { return 'placed'; }
    other = color === 'w' ? 'b' : 'w';
    if (this.total(other) + this.total(color) - this.armies[color][type] + value > 64 ||
      (type === 'p' && this.armies[other].p + value > 48)) { return 'capacity'; }
    this.commit(); this.armies[color][type] = value; return null;
  };
  Editor.prototype.setArmy = function (color, counts) {
    var clean, other;
    if ((color !== 'w' && color !== 'b') || !countsValid(counts)) { return false; }
    clean = copyCounts(counts); other = color === 'w' ? 'b' : 'w';
    if (sum(clean) + sum(this.armies[other]) > 64 || clean.p + this.armies[other].p > 48) { return false; }
    this.commit(); this.armies[color] = clean; this.board = emptyBoard(); return true;
  };
  Editor.prototype.setBoth = function (a, b) {
    if (!countsValid(a) || !countsValid(b) || sum(a) + sum(b) > 64 || a.p + b.p > 48) { return false; }
    this.commit(); this.armies = { w: copyCounts(a), b: copyCounts(b) }; this.board = emptyBoard(); return true;
  };
  Editor.prototype.setTurn = function (turn) {
    if (turn === this.turn || (turn !== 'w' && turn !== 'b')) { return; }
    this.commit(); this.turn = turn;
  };
  Editor.prototype.place = function (square, color, type) {
    var i = sqIndex(square), c, used;
    if (i < 0 || this.board[i] !== '.' || (color !== 'w' && color !== 'b') || TYPES.indexOf(type) < 0) { return false; }
    if (type === 'p' && (i < 8 || i >= 56)) { return false; }
    used = this.placed(color)[type]; if (used >= this.armies[color][type]) { return false; }
    c = color === 'w' ? type.toUpperCase() : type;
    this.commit(); this.board[i] = c; return true;
  };
  Editor.prototype.movePiece = function (from, to) {
    var i = sqIndex(from), j = sqIndex(to), p;
    if (i < 0 || j < 0 || i === j || this.board[i] === '.' || this.board[j] !== '.') { return false; }
    p = this.board[i]; if (p.toLowerCase() === 'p' && (j < 8 || j >= 56)) { return false; }
    this.commit(); this.board[j] = p; this.board[i] = '.'; return true;
  };
  Editor.prototype.remove = function (square) {
    var i = sqIndex(square);
    if (i < 0 || this.board[i] === '.') { return false; }
    this.commit(); this.board[i] = '.'; return true;
  };
  Editor.prototype.clear = function () { this.commit(); this.board = emptyBoard(); };
  Editor.prototype.validate = function () {
    var board = this.board, w = pieceCounts(board, 'w'), b = pieceCounts(board, 'b');
    var i, p, fen, c, opposing, key;
    if (sum(this.armies.w) + sum(this.armies.b) > 64 || this.armies.w.p + this.armies.b.p > 48) { return { state: 'error', key: 'editor.invalidCapacity' }; }
    if (w.k !== 1 || b.k !== 1) { return { state: 'error', key: 'editor.needKings' }; }
    for (i = 0; i < 8; i++) { if (board[i].toLowerCase() === 'p' || board[56 + i].toLowerCase() === 'p') { return { state: 'error', key: 'editor.badPawn' }; } }
    if (queenTouchKings(board)) { return { state: 'error', key: 'editor.adjacentKings' }; }
    if (!sameCounts(w, this.armies.w) || !sameCounts(b, this.armies.b)) { return { state: 'error', key: 'editor.missingPieces' }; }
    fen = fenFromBoard(board, this.turn); c = new root.Chess();
    if (!c.load(fen)) { return { state: 'error', key: 'editor.invalidPosition' }; }
    opposing = new root.Chess(); opposing.load(fenFromBoard(board, this.turn === 'w' ? 'b' : 'w'));
    if (opposing.in_check()) { return { state: 'error', key: 'editor.otherKingCheck' }; }
    if (c.in_checkmate()) { key = 'editor.checkmate'; }
    else if (c.in_stalemate()) { key = 'editor.stalemate'; }
    else if (c.insufficient_material()) { key = 'editor.insufficient'; }
    if (key) { return { state: 'terminal', key: key, fen: fen }; }
    if (c.in_check()) { return { state: 'warning', key: 'editor.turnCheck', fen: fen }; }
    return { state: 'valid', key: 'editor.valid', fen: fen };
  };
  Editor.prototype.loadScenario = function (scenario) {
    var c = new root.Chess(), b, w, bk;
    if (!scenario || !scenario.initialFen || !c.load(scenario.initialFen)) { return false; }
    b = boardFromFen(scenario.initialFen);
    w = pieceCounts(b, 'w'); bk = pieceCounts(b, 'b');
    if (!countsValid(w) || !countsValid(bk) || sum(w) + sum(bk) > 64 || w.p + bk.p > 48) { return false; }
    this.armies = { w: w, b: bk }; this.board = b; this.turn = c.turn();
    this.id = scenario.id; this.name = scenario.name; this.createdAt = scenario.createdAt;
    this._undo = []; this._redo = [];
    return this.validate().state !== 'error';
  };
  Editor.prototype.serialize = function (name) {
    var v = this.validate(), date = new Date().toISOString();
    if (v.state === 'error') { return null; }
    return { id: this.id || 'scenario-' + Date.now() + '-' + Math.floor(Math.random() * 1000000),
      name: name, initialFen: v.fen,
      whiteArmySnapshot: copyCounts(this.armies.w), blackArmySnapshot: copyCounts(this.armies.b),
      createdAt: this.createdAt || date, updatedAt: date };
  };
  Editor.prototype.autoPlace = function () {
    var i, j, k, side, type, positions, slots, work, possible, valid, begin = Date.now();
    var isClassic = sameCounts(this.armies.w, CLASSIC) && sameCounts(this.armies.b, CLASSIC);
    var oldBoard = this.board, attempts = 12;
    if (isClassic) {
      this.commit(); this.board = boardFromFen(CLASSIC_FEN); return true;
    }
    function candidates(color, typ) {
      var a = [], row, col, n;
      // Orden inicial cercano a cada jugador; aleatorizado entre intentos.
      for (row = 0; row < 8; row++) {
        for (col = 0; col < 8; col++) {
          n = row * 8 + col;
          if (typ === 'p' && (row === 0 || row === 7)) { continue; }
          a.push(n);
        }
      }
      a.sort(function (x, y) {
        var rx = Math.floor(x / 8), ry = Math.floor(y / 8);
        var ax = typ === 'p' ? (color === 'w' ? 6 : 1) : (color === 'w' ? 7 : 0);
        return Math.abs(rx - ax) - Math.abs(ry - ax);
      });
      return a;
    }
    for (i = 0; i < attempts && Date.now() - begin < 180; i++) {
      work = emptyBoard();
      // Proteger los reyes con piezas propias cuando sea posible.
      work[60] = 'K'; work[4] = 'k';
      for (j = 0; j < 2; j++) {
        side = j === 0 ? 'b' : 'w';
        for (k = 0; k < TYPES.length; k++) {
          type = ['p', 'n', 'b', 'r', 'q'][k];
          if (!type) { continue; }
          positions = candidates(side, type);
          // Elegimos un candidato entre los más próximos, sin perder capacidad.
          slots = positions.slice();
          if (i > 0) {
            for (var z = 0; z < slots.length - 1; z += 8) {
              var group = shuffled(slots.slice(z, z + 8));
              for (var h = 0; h < group.length; h++) { slots[z + h] = group[h]; }
            }
          }
          var count = this.armies[side][type], assigned = 0, pindex;
          for (pindex = 0; pindex < slots.length && assigned < count; pindex++) {
            if (work[slots[pindex]] !== '.') { continue; }
            work[slots[pindex]] = side === 'w' ? type.toUpperCase() : type; assigned++;
          }
          if (assigned < count) { break; }
        }
      }
      // No modificar el tablero hasta lograr una configuración válida.
      this.board = work; valid = this.validate(); this.board = oldBoard;
      if (valid.state === 'valid' || valid.state === 'warning' || valid.state === 'terminal') {
        this.commit(); this.board = work; return true;
      }
    }
    return false;
  };
  Xake.Editor = Editor;
  Xake.EditorTools = { countsValid: countsValid, copyCounts: copyCounts, pieceCounts: pieceCounts,
    fenFromBoard: fenFromBoard, boardFromFen: boardFromFen, emptyCounts: emptyCounts, classic: copyCounts(CLASSIC), sum: sum };
}(typeof window !== 'undefined' ? window : this));
