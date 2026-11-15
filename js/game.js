/* global window, Chess */
(function (root) {
  'use strict';
  var Xake = root.Xake = root.Xake || {};
  var DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  function Game() {
    this.initialFen = DEFAULT_FEN;
    this.engine = new Chess();
  }
  Game.prototype.reset = function () {
    this.initialFen = DEFAULT_FEN;
    this.engine = new Chess();
  };
  Game.prototype.legalFrom = function (square) {
    return this.engine.moves({ square: square, verbose: true });
  };
  Game.prototype.move = function (from, to, promotion) {
    return this.engine.move({ from: from, to: to, promotion: promotion || 'q' });
  };
  Game.prototype.undo = function () { return this.engine.undo(); };
  Game.prototype.history = function () { return this.engine.history({ verbose: true }); };
  Game.prototype.snapshot = function () {
    var hist = this.history(), moves = [], i;
    for (i = 0; i < hist.length; i++) {
      moves.push({ from: hist[i].from, to: hist[i].to, promotion: hist[i].promotion || null });
    }
    return { initialFen: this.initialFen, mode: 'local-two-players', difficulty: null,
      humanColor: null, whiteAppearance: 'classic', blackAppearance: 'classic', moves: moves };
  };
  Game.prototype.restore = function (saved) {
    if (!saved || typeof saved.initialFen !== 'string' || !Array.isArray(saved.moves) || saved.moves.length > 10000) { return false; }
    var chess, i, m, replay;
    try {
      chess = new Chess();
      if (!chess.load(saved.initialFen)) { return false; }
      for (i = 0; i < saved.moves.length; i++) {
        m = saved.moves[i];
        if (!m || typeof m.from !== 'string' || typeof m.to !== 'string') { return false; }
        if (chess.game_over()) { return false; }
        replay = chess.move({ from: m.from, to: m.to, promotion: m.promotion || 'q' });
        if (!replay) { return false; }
      }
    } catch (e) { return false; }
    this.initialFen = saved.initialFen;
    this.engine = chess;
    return true;
  };
  Game.prototype.status = function () {
    var c = this.engine, turn = c.turn(), t = Xake.I18n.t;
    if (c.in_checkmate()) { return { ended: true, key: turn === 'w' ? 'game.blackWins' : 'game.whiteWins', text: t(turn === 'w' ? 'game.blackWins' : 'game.whiteWins') }; }
    if (c.in_stalemate()) { return { ended: true, key: 'game.stalemate', text: t('game.stalemate') }; }
    if (c.insufficient_material()) { return { ended: true, key: 'game.insufficient', text: t('game.insufficient') }; }
    if (c.in_threefold_repetition()) { return { ended: true, key: 'game.repetition', text: t('game.repetition') }; }
    if (Number(c.fen().split(' ')[4]) >= 100) { return { ended: true, key: 'game.fiftyMoves', text: t('game.fiftyMoves') }; }
    if (c.in_draw()) { return { ended: true, key: 'game.draw', text: t('game.draw') }; }
    var key = c.in_check() ? (turn === 'w' ? 'game.whiteCheck' : 'game.blackCheck') : (turn === 'w' ? 'game.whiteTurn' : 'game.blackTurn');
    return { ended: false, key: key, text: t(key) };
  };
  Xake.Game = Game;
}(window));
