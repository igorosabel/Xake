/* global window, Chess */
(function (root) {
  'use strict';
  var Xake = root.Xake = root.Xake || {};
  var DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  function Game(options) {
    options = options || {};
    this.mode = options.mode === 'vs-computer' ? 'vs-computer' : 'local-two-players';
    this.difficulty = this.mode === 'vs-computer' ? Math.max(1, Math.min(4, Number(options.difficulty) || 1)) : null;
    this.humanColor = this.mode === 'vs-computer' && options.humanColor === 'b' ? 'b' : 'w';
    this.engine = new Chess();
    this.initialFen = DEFAULT_FEN;
    if (typeof options.initialFen === 'string' && this.engine.load(options.initialFen)) {
      this.initialFen = this.engine.fen();
    }
    this.scenarioId = typeof options.scenarioId === 'string' ? options.scenarioId : null;
    this.scenarioName = typeof options.scenarioName === 'string' ? options.scenarioName.slice(0, 60) : null;
  }
  Game.prototype.reset = function () {
    this.engine = new Chess();
    this.engine.load(this.initialFen);
  };
  Game.prototype.legalFrom = function (square) {
    return this.engine.moves({ square: square, verbose: true });
  };
  Game.prototype.move = function (from, to, promotion) {
    return this.engine.move({ from: from, to: to, promotion: promotion || 'q' });
  };
  Game.prototype.undo = function () { return this.engine.undo(); };
  Game.prototype.history = function () { return this.engine.history({ verbose: true }); };
  Game.prototype.isComputerTurn = function () {
    return this.mode === 'vs-computer' && this.engine.turn() !== this.humanColor && !this.status().ended;
  };
  Game.prototype.canUndo = function () {
    var hist = this.history(), i;
    if (this.mode !== 'vs-computer') { return hist.length > 0; }
    for (i = 0; i < hist.length; i++) { if (hist[i].color === this.humanColor) { return true; } }
    return false;
  };
  Game.prototype.undoTurn = function () {
    if (!this.canUndo()) { return false; }
    if (this.mode !== 'vs-computer') { return !!this.undo(); }
    do { this.undo(); }
    while (this.history().length && this.engine.turn() !== this.humanColor);
    return true;
  };
  Game.prototype.snapshot = function () {
    var hist = this.history(), moves = [], i;
    for (i = 0; i < hist.length; i++) {
      moves.push({ from: hist[i].from, to: hist[i].to, promotion: hist[i].promotion || null });
    }
    return { initialFen: this.initialFen, scenarioId: this.scenarioId,
      scenarioName: this.scenarioName, mode: this.mode, difficulty: this.difficulty,
      humanColor: this.mode === 'vs-computer' ? this.humanColor : null,
      whiteAppearance: 'classic', blackAppearance: 'classic', moves: moves };
  };
  Game.prototype.restore = function (saved) {
    if (!saved || typeof saved.initialFen !== 'string' || !Array.isArray(saved.moves) || saved.moves.length > 10000) { return false; }
    if (saved.mode !== 'local-two-players' && saved.mode !== 'vs-computer') { return false; }
    if (saved.mode === 'vs-computer' &&
      (saved.humanColor !== 'w' && saved.humanColor !== 'b' ||
        typeof saved.difficulty !== 'number' || !isFinite(saved.difficulty) || Math.floor(saved.difficulty) !== saved.difficulty || saved.difficulty < 1 || saved.difficulty > 4)) { return false; }
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
    this.mode = saved.mode;
    this.difficulty = saved.mode === 'vs-computer' ? saved.difficulty : null;
    this.humanColor = saved.mode === 'vs-computer' ? saved.humanColor : 'w';
    this.initialFen = saved.initialFen;
    this.scenarioId = typeof saved.scenarioId === 'string' ? saved.scenarioId : null;
    this.scenarioName = typeof saved.scenarioName === 'string' ? saved.scenarioName.slice(0, 60) : null;
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
