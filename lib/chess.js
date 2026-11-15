/* Xake Chess Engine 0.1 — motor de reglas ligero, ES5.
 * API reducida y compatible con los métodos de chess.js utilizados por Xake.
 * No es el proyecto externo chess.js de Jeff Hlywa.
 * Sin dependencias ni conexión de red. Se podrá sustituir por chess.js 0.10.3
 * tras las pruebas de compatibilidad en el iPad de referencia.
 */
(function (root) {
  'use strict';
  var START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  var FILES = 'abcdefgh';
  var DIRS = { n: [-33, -31, -18, -14, 14, 18, 31, 33],
    b: [-17, -15, 15, 17], r: [-16, -1, 1, 16],
    k: [-17, -16, -15, -1, 1, 15, 16, 17] };
  function on(i) { return i >= 0 && i < 128 && !(i & 0x88); }
  function color(p) { return !p || p === '.' ? 0 : p === p.toUpperCase() ? 1 : -1; }
  function name(i) { return FILES.charAt(i & 7) + (8 - (i >> 4)); }
  function idx(s) {
    if (typeof s !== 'string' || !/^[a-h][1-8]$/.test(s)) { return -1; }
    return (8 - Number(s.charAt(1))) * 16 + FILES.indexOf(s.charAt(0));
  }
  function parse(fen) {
    if (typeof fen !== 'string') { return null; }
    var fields = fen.trim().split(/\s+/), rows, b, r, c, i, p, v, castles, ep, half, full;
    if (fields.length !== 6 || !/^[wb]$/.test(fields[1]) ||
      !/^(?:-|K?Q?k?q?)$/.test(fields[2]) || !/^(?:-|[a-h][36])$/.test(fields[3])) { return null; }
    half = Number(fields[4]); full = Number(fields[5]);
    if (!/^\d+$/.test(fields[4]) || !/^[1-9]\d*$/.test(fields[5]) || !isFinite(half) || !isFinite(full)) { return null; }
    rows = fields[0].split('/'); if (rows.length !== 8) { return null; }
    b = []; for (i = 0; i < 128; i++) { b[i] = '.'; }
    for (r = 0; r < 8; r++) {
      c = 0;
      for (i = 0; i < rows[r].length; i++) {
        p = rows[r].charAt(i);
        if (/^[1-8]$/.test(p)) { c += Number(p); }
        else if (/^[prnbqkPRNBQK]$/.test(p) && c < 8) { b[r * 16 + c] = p; c++; }
        else { return null; }
        if (c > 8) { return null; }
      }
      if (c !== 8) { return null; }
    }
    v = 0; for (i = 0; i < 128; i++) { if (on(i) && b[i] === 'K') { v++; } }
    if (v !== 1) { return null; }
    v = 0; for (i = 0; i < 128; i++) { if (on(i) && b[i] === 'k') { v++; } }
    if (v !== 1) { return null; }
    castles = (fields[2].indexOf('K') !== -1 ? 1 : 0) |
      (fields[2].indexOf('Q') !== -1 ? 2 : 0) |
      (fields[2].indexOf('k') !== -1 ? 4 : 0) |
      (fields[2].indexOf('q') !== -1 ? 8 : 0);
    ep = fields[3] === '-' ? -1 : idx(fields[3]);
    return { b: b, t: fields[1] === 'w' ? 1 : -1, c: castles, ep: ep, half: half, full: full };
  }
  function toFen(s) {
    var rows = [], r, f, count, out, p, castling = '';
    for (r = 0; r < 8; r++) {
      out = ''; count = 0;
      for (f = 0; f < 8; f++) {
        p = s.b[r * 16 + f];
        if (p === '.') { count++; }
        else { if (count) { out += count; count = 0; } out += p; }
      }
      if (count) { out += count; }
      rows.push(out);
    }
    if (s.c & 1) { castling += 'K'; } if (s.c & 2) { castling += 'Q'; }
    if (s.c & 4) { castling += 'k'; } if (s.c & 8) { castling += 'q'; }
    return rows.join('/') + ' ' + (s.t === 1 ? 'w' : 'b') + ' ' + (castling || '-') + ' ' +
      (s.ep < 0 ? '-' : name(s.ep)) + ' ' + s.half + ' ' + s.full;
  }
  function attacked(s, target, by) {
    var f, p, ds, d, t, j;
    for (f = 0; f < 128; f++) {
      if (!on(f) || color(s.b[f]) !== by) { continue; }
      p = s.b[f].toLowerCase();
      if (p === 'p') {
        if (target === f - 16 * by - 1 || target === f - 16 * by + 1) { return true; }
        continue;
      }
      ds = DIRS[p] || DIRS.k;
      for (j = 0; j < ds.length; j++) {
        d = ds[j];
        for (t = f + d; on(t); t += d) {
          if (t === target) { return true; }
          if (s.b[t] !== '.' || p === 'n' || p === 'k') { break; }
        }
      }
    }
    return false;
  }
  function checked(s, side) {
    var target, i, king = (side === 1 ? 'K' : 'k');
    target = -1;
    for (i = 0; i < 128; i++) { if (on(i) && s.b[i] === king) { target = i; break; } }
    return target >= 0 ? attacked(s, target, -side) : true;
  }
  function apply(s, m) {
    var f = m.f, t = m.t, board = s.b.slice(), p = board[f], captured = board[t];
    var rights = s.c, rookFrom, rookTo, bit;
    board[f] = '.';
    board[t] = m.promo ? (s.t === 1 ? m.promo.toUpperCase() : m.promo) : p;
    if (m.flag === 'e') { board[t + 16 * s.t] = '.'; }
    if (m.flag === 'c') {
      rookFrom = t > f ? f + 3 : f - 4;
      rookTo = t > f ? f + 1 : f - 1;
      board[rookTo] = board[rookFrom]; board[rookFrom] = '.';
    }
    if (p === 'K') { rights &= ~3; } else if (p === 'k') { rights &= ~12; }
    bit = { 119: 1, 112: 2, 7: 4, 0: 8 };
    if (p.toLowerCase() === 'r') { rights &= ~(bit[f] || 0); }
    if (captured.toLowerCase() === 'r') { rights &= ~(bit[t] || 0); }
    return { b: board, t: -s.t, c: rights,
      ep: p.toLowerCase() === 'p' && Math.abs(t - f) === 32 ? (t + f) / 2 : -1,
      half: p.toLowerCase() === 'p' || captured !== '.' || m.flag === 'e' ? 0 : s.half + 1,
      full: s.full + (s.t === -1 ? 1 : 0) };
  }
  function pseudo(s) {
    var result = [], f, t, u, p, ds, j, d, home, rook, bits, forward;
    function add(f, t, flag) {
      var promote, k, promotions = ['q', 'r', 'b', 'n'];
      if (s.b[t].toLowerCase() === 'k') { return; }
      promote = s.b[f].toLowerCase() === 'p' && ((t >> 4) === 0 || (t >> 4) === 7);
      if (promote) {
        for (k = 0; k < promotions.length; k++) { result.push({ f: f, t: t, promo: promotions[k], flag: flag || '' }); }
      } else { result.push({ f: f, t: t, promo: '', flag: flag || '' }); }
    }
    for (f = 0; f < 128; f++) {
      if (!on(f) || color(s.b[f]) !== s.t) { continue; }
      p = s.b[f].toLowerCase();
      if (p === 'p') {
        forward = f - 16 * s.t;
        if (on(forward) && s.b[forward] === '.') {
          add(f, forward, ''); u = forward - 16 * s.t;
          if ((f >> 4) === (s.t === 1 ? 6 : 1) && s.b[u] === '.') { add(f, u, 'b'); }
        }
        for (j = -1; j <= 1; j += 2) {
          u = forward + j;
          if (!on(u)) { continue; }
          if (color(s.b[u]) === -s.t) { add(f, u, 'x'); }
          else if (u === s.ep && s.b[u] === '.' && s.b[u + 16 * s.t] === (s.t === 1 ? 'p' : 'P')) { add(f, u, 'e'); }
        }
      } else {
        ds = DIRS[p] || DIRS.k;
        for (j = 0; j < ds.length; j++) {
          d = ds[j];
          for (t = f + d; on(t); t += d) {
            if (color(s.b[t]) === s.t) { break; }
            add(f, t, s.b[t] === '.' ? '' : 'x');
            if (s.b[t] !== '.' || p === 'n' || p === 'k') { break; }
          }
        }
        home = s.t === 1 ? 116 : 4;
        rook = s.t === 1 ? 'R' : 'r'; bits = s.t === 1 ? [1, 2] : [4, 8];
        if (p === 'k' && f === home && !checked(s, s.t)) {
          if ((s.c & bits[0]) && s.b[f + 3] === rook && s.b[f + 1] === '.' && s.b[f + 2] === '.' &&
            !attacked(s, f + 1, -s.t) && !attacked(s, f + 2, -s.t)) { add(f, f + 2, 'c'); }
          if ((s.c & bits[1]) && s.b[f - 4] === rook && s.b[f - 1] === '.' && s.b[f - 2] === '.' && s.b[f - 3] === '.' &&
            !attacked(s, f - 1, -s.t) && !attacked(s, f - 2, -s.t)) { add(f, f - 2, 'c'); }
        }
      }
    }
    return result;
  }
  function legal(s) {
    var options = pseudo(s), out = [], i;
    for (i = 0; i < options.length; i++) {
      if (!checked(apply(s, options[i]), s.t)) { out.push(options[i]); }
    }
    return out;
  }
  function san(s, m, options) {
    var piece = s.b[m.f].toUpperCase(), text = '', captured = s.b[m.t] !== '.' || m.flag === 'e';
    var i, other = [], fileMatch = false, rankMatch = false, p, next;
    if (m.flag === 'c') { text = m.t > m.f ? 'O-O' : 'O-O-O'; }
    else {
      if (piece !== 'P') {
        text = piece;
        for (i = 0; i < options.length; i++) {
          p = options[i];
          if (p.f !== m.f && p.t === m.t && s.b[p.f] === s.b[m.f]) { other.push(p); }
        }
        if (other.length) {
          for (i = 0; i < other.length; i++) {
            if ((other[i].f & 7) === (m.f & 7)) { fileMatch = true; }
            if ((other[i].f >> 4) === (m.f >> 4)) { rankMatch = true; }
          }
          text += !fileMatch ? name(m.f).charAt(0) : !rankMatch ? name(m.f).charAt(1) : name(m.f);
        }
      } else if (captured) { text = name(m.f).charAt(0); }
      text += (captured ? 'x' : '') + name(m.t) + (m.promo ? '=' + m.promo.toUpperCase() : '');
    }
    next = apply(s, m);
    if (checked(next, next.t)) { text += legal(next).length ? '+' : '#'; }
    return text;
  }
  function verbose(s, m, options) {
    var p = s.b[m.f], captured = m.flag === 'e' ? 'p' : s.b[m.t].toLowerCase();
    var res = { color: s.t === 1 ? 'w' : 'b', from: name(m.f), to: name(m.t),
      piece: p.toLowerCase(), flags: m.flag === 'c' ? (m.t > m.f ? 'k' : 'q') : m.flag || 'n',
      san: san(s, m, options) };
    if (captured !== '.') { res.captured = captured; }
    if (m.promo) { res.promotion = m.promo; }
    return res;
  }
  function repeatedKey(s) {
    var fen = toFen(s).split(' '), ep = s.ep, options, i, found = false;
    if (ep >= 0) {
      options = legal(s);
      for (i = 0; i < options.length; i++) { if (options[i].flag === 'e') { found = true; break; } }
      if (!found) { fen[3] = '-'; }
    }
    return fen.slice(0, 4).join(' ');
  }
  function insufficient(s) {
    var i, p, minor = [], bishopColor = null;
    for (i = 0; i < 128; i++) {
      if (!on(i) || s.b[i] === '.') { continue; }
      p = s.b[i].toLowerCase(); if (p === 'k') { continue; }
      if (p === 'p' || p === 'q' || p === 'r') { return false; }
      minor.push({ type: p, squareColor: ((i >> 4) + (i & 7)) % 2 });
    }
    if (minor.length <= 1) { return true; }
    for (i = 0; i < minor.length; i++) {
      if (minor[i].type !== 'b') { return false; }
      if (bishopColor !== null && bishopColor !== minor[i].squareColor) { return false; }
      bishopColor = minor[i].squareColor;
    }
    return true;
  }
  function Chess(fen) {
    this._state = parse(START);
    this._history = [];
    if (fen) { this.load(fen); }
  }
  Chess.prototype.load = function (fen) {
    var s = parse(fen);
    if (!s) { return false; }
    this._state = s; this._history = []; return true;
  };
  Chess.prototype.reset = function () { this.load(START); };
  Chess.prototype.fen = function () { return toFen(this._state); };
  Chess.prototype.turn = function () { return this._state.t === 1 ? 'w' : 'b'; };
  Chess.prototype.get = function (square) {
    var i = idx(square), p = i >= 0 ? this._state.b[i] : '.';
    return p === '.' ? null : { type: p.toLowerCase(), color: color(p) === 1 ? 'w' : 'b' };
  };
  Chess.prototype.moves = function (options) {
    var s = this._state, list = legal(s), out = [], i, m, filter = options && options.square, full = options && options.verbose;
    for (i = 0; i < list.length; i++) {
      m = list[i];
      if (filter && name(m.f) !== filter) { continue; }
      out.push(full ? verbose(s, m, list) : san(s, m, list));
    }
    return out;
  };
  Chess.prototype.move = function (input) {
    if (!input || !input.from || !input.to) { return null; }
    var s = this._state, list = legal(s), from = idx(input.from), to = idx(input.to), i, m, entry;
    for (i = 0; i < list.length; i++) {
      m = list[i];
      if (m.f === from && m.t === to && (!m.promo || m.promo === (input.promotion || 'q').toLowerCase())) {
        entry = verbose(s, m, list);
        this._history.push({ state: s, move: entry });
        this._state = apply(s, m);
        return entry;
      }
    }
    return null;
  };
  Chess.prototype.undo = function () {
    if (!this._history.length) { return null; }
    var last = this._history.pop(); this._state = last.state;
    return last.move;
  };
  Chess.prototype.history = function (opts) {
    var out = [], i, m;
    for (i = 0; i < this._history.length; i++) {
      m = this._history[i].move;
      out.push(opts && opts.verbose ? {
        from: m.from, to: m.to, promotion: m.promotion,
        san: m.san, color: m.color, piece: m.piece,
        captured: m.captured, flags: m.flags
      } : m.san);
    }
    return out;
  };
  Chess.prototype.in_check = function () { return checked(this._state, this._state.t); };
  Chess.prototype.in_checkmate = function () { return this.in_check() && legal(this._state).length === 0; };
  Chess.prototype.in_stalemate = function () { return !this.in_check() && legal(this._state).length === 0; };
  Chess.prototype.insufficient_material = function () { return insufficient(this._state); };
  Chess.prototype.in_threefold_repetition = function () {
    var key = repeatedKey(this._state), count = 1, i;
    for (i = 0; i < this._history.length; i++) {
      if (repeatedKey(this._history[i].state) === key) { count++; }
    }
    return count >= 3;
  };
  Chess.prototype.in_draw = function () {
    return this.in_stalemate() || this.insufficient_material() ||
      this.in_threefold_repetition() || this._state.half >= 100;
  };
  /* API de búsqueda interna para la IA. Evita calcular SAN en cada nodo.
   * Los movimientos son objetos 0x88 del motor; nunca se exponen a la interfaz.
   * Se mantiene separada de move()/undo() para no alterar la partida visible.
   */
  Chess.prototype.search_moves = function () { return legal(this._state); };
  Chess.prototype.search_play = function (move) {
    this._history.push({ state: this._state, move: null });
    this._state = apply(this._state, move);
  };
  Chess.prototype.search_undo = function () {
    if (!this._history.length) { return false; }
    this._state = this._history.pop().state;
    return true;
  };
  Chess.prototype.search_state = function () { return this._state; };
  Chess.prototype.game_over = function () { return this.in_checkmate() || this.in_draw(); };
  root.Chess = Chess;
  if (typeof module !== 'undefined' && module.exports) { module.exports = { Chess: Chess }; }
}(typeof window !== 'undefined' ? window : this));
