/* global window, document */
(function (root) {
  'use strict';
  var Xake = root.Xake = root.Xake || {};
  var glyphs = { wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙',
    bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟︎' };
  var names = { k: 'common.king', q: 'common.queen', r: 'common.rook', b: 'common.bishop', n: 'common.knight', p: 'common.pawn' };
  function Board(container, onSquare) {
    this.container = container;
    this.onSquare = onSquare;
    this.flipped = false;
    this.squares = {};
    this.renderedPieces = {};
    this.build();
  }
  Board.prototype.build = function () {
    var r, f, row, b, label, sp, sq, that = this;
    this.container.innerHTML = '';
    for (r = 0; r < 8; r++) {
      row = document.createElement('div'); row.className = 'board-row';
      for (f = 0; f < 8; f++) {
        b = document.createElement('button'); b.type = 'button'; b.className = 'board-square';
        sp = document.createElement('span'); sp.className = 'board-piece'; sp.setAttribute('aria-hidden', 'true');
        label = document.createElement('span'); label.className = 'board-label'; label.setAttribute('aria-hidden', 'true');
        b.appendChild(sp); b.appendChild(label); row.appendChild(b);
        (function (button, rank, file) {
          button.onclick = function () { that.onSquare(that.squareFor(rank, file)); };
        }(b, r, f));
        sq = r * 8 + f;
        this.squares[sq] = { button: b, piece: sp, label: label };
      }
      this.container.appendChild(row);
    }
    this.size();
    // iOS 9 no soporta aspect-ratio CSS. Usamos el ancho real para fijar altura.
    root.addEventListener('resize', function () { that.size(); });
    root.addEventListener('orientationchange', function () { root.setTimeout(function () { that.size(); }, 250); });
  };
  Board.prototype.size = function () {
    var width = this.container.clientWidth;
    var px = Math.floor((width - 10) / 8);
    var r, f, s;
    if (px < 1) { return; }
    for (r = 0; r < 8; r++) {
      for (f = 0; f < 8; f++) {
        s = this.squares[r * 8 + f];
        s.button.style.height = px + 'px';
        s.piece.style.fontSize = Math.floor(px * 0.82) + 'px';
        s.piece.style.lineHeight = px + 'px';
      }
    }
    this.container.style.height = (px * 8 + 10) + 'px';
  };
  Board.prototype.squareFor = function (r, f) {
    return 'abcdefgh'.charAt(this.flipped ? 7 - f : f) + String(this.flipped ? r + 1 : 8 - r);
  };
  Board.prototype.flip = function () { this.flipped = !this.flipped; };
  Board.prototype.render = function (game, selected, targets, lastMove) {
    var i, r, f, square, cell, piece, className, target, j, checkSquare = null, c = game.engine;
    if (c.in_check()) {
      for (i = 0; i < 64; i++) {
        square = 'abcdefgh'.charAt(i % 8) + String(1 + Math.floor(i / 8));
        piece = c.get(square);
        if (piece && piece.type === 'k' && piece.color === c.turn()) { checkSquare = square; break; }
      }
    }
    for (r = 0; r < 8; r++) {
      for (f = 0; f < 8; f++) {
        i = r * 8 + f; square = this.squareFor(r, f); cell = this.squares[i]; piece = c.get(square);
        className = 'board-square ' + ((r + f) % 2 === 0 ? 'light' : 'dark');
        if (piece) { className += ' occupied'; }
        if (lastMove && (lastMove.from === square || lastMove.to === square)) { className += ' last-move'; }
        if (square === selected) { className += ' selected'; }
        if (square === checkSquare) { className += ' in-check'; }
        target = false;
        for (j = 0; j < targets.length; j++) { if (targets[j] === square) { target = true; break; } }
        if (target) { className += ' possible'; }
        cell.button.className = className;
        cell.piece.className = 'board-piece ' + (piece && piece.color === 'w' ? 'white' : 'black');
        cell.piece.textContent = piece ? glyphs[piece.color + piece.type] : '';
        cell.label.textContent = (r === 7 ? square.charAt(0) : '') + (f === 0 ? square.charAt(1) : '');
        cell.button.setAttribute('aria-label', Xake.I18n.t('game.square', { square: square,
          piece: piece ? Xake.I18n.t(names[piece.type]) + ' ' + Xake.I18n.t(piece.color === 'w' ? 'common.white' : 'common.black') : Xake.I18n.t('common.empty') }));
      }
    }
  };
  /* Render del editor: acepta tableros incompletos sin construir un Game. */
  Board.prototype.renderEditor = function (editor, selectedSquare) {
    var r, f, i, square, cell, piece, className;
    for (r = 0; r < 8; r++) {
      for (f = 0; f < 8; f++) {
        i = r * 8 + f; square = this.squareFor(r, f);
        cell = this.squares[i]; piece = editor.get(square);
        className = 'board-square ' + ((r + f) % 2 === 0 ? 'light' : 'dark');
        if (piece) { className += ' occupied'; }
        if (square === selectedSquare) { className += ' selected'; }
        cell.button.className = className;
        cell.piece.className = 'board-piece ' + (piece && piece.color === 'w' ? 'white' : 'black');
        cell.piece.textContent = piece ? glyphs[piece.color + piece.type] : '';
        cell.label.textContent = (r === 7 ? square.charAt(0) : '') + (f === 0 ? square.charAt(1) : '');
        cell.button.setAttribute('aria-label', Xake.I18n.t('game.square', { square: square,
          piece: piece ? Xake.I18n.t(names[piece.type]) + ' ' + Xake.I18n.t(piece.color === 'w' ? 'common.white' : 'common.black') : Xake.I18n.t('common.empty') }));
      }
    }
  };
  Board.glyphs = glyphs;
  Board.names = names;
  Xake.Board = Board;
}(window));
