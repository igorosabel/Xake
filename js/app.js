/* global window, document, Chess */
(function (root) {
  'use strict';
  var Xake = root.Xake = root.Xake || {};
  var game = null, board = null, editorUI = null, selected = null, modalMove = null;
  var ID = function (id) { return document.getElementById(id); };
  function t(key) { return Xake.I18n.t(key); }
  function show(id) {
    var screens = ['screen-menu', 'screen-game', 'screen-editor', 'screen-library'], i;
    for (i = 0; i < screens.length; i++) {
      ID(screens[i]).className = 'screen' + (id === screens[i] ? '' : ' is-hidden');
    }
  }
  function notice(text) { ID('notice').textContent = text || ''; }
  function translations() {
    var nodes = document.querySelectorAll('[data-i18n]'), i, key;
    for (i = 0; i < nodes.length; i++) {
      key = nodes[i].getAttribute('data-i18n'); nodes[i].textContent = t(key);
    }
    document.documentElement.lang = Xake.I18n.language();
    ID('language').value = Xake.I18n.language();
    if (game && board) { render(); }
    if (editorUI) { editorUI.languageChanged(); }
  }
  function saved() {
    ID('btn-continue').className = 'btn btn-large' + (Xake.Storage.savedGame() ? '' : ' is-hidden');
  }
  function store() {
    if (!game) { return; }
    if (!Xake.Storage.saveGame(game.snapshot())) { notice(t('storage.failed')); }
    else { notice(''); }
    saved();
  }
  function render() {
    if (!game || !board) { return; }
    var moves = game.history(), last = moves.length ? moves[moves.length - 1] : null;
    var targets = [], legal, i, list, item, html, startIndex, blackStart;
    var status = game.status(), thinking = game.isComputerTurn();
    if (selected && !status.ended && !thinking) {
      legal = game.legalFrom(selected);
      for (i = 0; i < legal.length; i++) {
        if (targets.indexOf(legal[i].to) === -1) { targets.push(legal[i].to); }
      }
    }
    board.render(game, selected, targets, last);
    ID('game-status').textContent = thinking ? t('ai.thinking') : status.text;
    ID('game-mode-label').textContent = (game.scenarioName || (game.mode === 'vs-computer' ? t('ai.gameTitle') : t('game.title'))) + (game.mode === 'vs-computer' ? ' · ' + t('ai.level' + game.difficulty) : '');
    ID('btn-undo').disabled = !game.canUndo();
    list = ID('moves-list'); list.innerHTML = '';
    blackStart = game.initialFen.split(' ')[1] === 'b';
    startIndex = Math.max(0, moves.length - 16);
    if (blackStart && startIndex > 0 && startIndex % 2 === 0) { startIndex++; }
    if (!blackStart && startIndex % 2 !== 0) { startIndex++; }
    if (blackStart && startIndex === 0 && moves.length) {
      item = document.createElement('li'); item.value = 1;
      item.textContent = '... ' + moves[0].san; list.appendChild(item);
      startIndex = 1;
    }
    for (i = startIndex; i < moves.length; i += 2) {
      item = document.createElement('li');
      html = moves[i].san + (moves[i + 1] ? '  ' + moves[i + 1].san : '');
      item.textContent = html;
      item.value = blackStart ? Math.floor((i + 1) / 2) + 1 : Math.floor(i / 2) + 1;
      list.appendChild(item);
    }
    if (!moves.length) {
      item = document.createElement('li'); item.textContent = t('game.noMoves'); list.appendChild(item);
    }
  }
  function start(newGame, options) {
    if (newGame && Xake.Storage.savedGame() && !root.confirm(t('game.newConfirm'))) { return; }
    Xake.AI.cancel();
    if (newGame) { game = new Xake.Game(options); }
    else {
      var restored = new Xake.Game();
      if (!restored.restore(Xake.Storage.savedGame())) { notice(t('storage.badGame')); saved(); return; }
      game = restored;
    }
    selected = null; modalMove = null;
    closePromotion();
    board.flipped = game.mode === 'vs-computer' && game.humanColor === 'b';
    ID('ai-setup').className = 'setup-panel is-hidden';
    show('screen-game');
    board.size(); render();
    if (newGame) { store(); }
    else { notice(''); }
    maybeComputer();
  }
  function computerMove(move, expectedGame, expectedFen) {
    if (!game || game !== expectedGame || !game.isComputerTurn() || game.engine.fen() !== expectedFen) { return; }
    if (!move) {
      // Respaldo legal para un Worker que no haya respondido a tiempo.
      var options = game.engine.moves({ verbose: true });
      if (options.length) { move = options[Math.floor(Math.random() * options.length)]; }
    }
    if (move && game.move(move.from, move.to, move.promotion)) {
      selected = null; render(); store();
    } else { notice(t('ai.failed')); render(); }
  }
  function maybeComputer() {
    if (!game || !game.isComputerTurn()) { return; }
    var expectedGame = game, expectedFen = game.engine.fen();
    render();
    Xake.AI.find(expectedFen, game.difficulty, function (move) {
      computerMove(move, expectedGame, expectedFen);
    });
  }
  function afterMove(from, to, promotion) {
    var result = game.move(from, to, promotion);
    if (result) { selected = null; render(); store(); maybeComputer(); }
  }
  function chooseSquare(square) {
    if (!game || modalMove || game.status().ended || game.isComputerTurn()) { return; }
    var p = game.engine.get(square), turn = game.engine.turn(), moves, choices = [], i;
    if (p && p.color === turn) {
      selected = selected === square ? null : square;
      render(); return;
    }
    if (!selected) { return; }
    moves = game.legalFrom(selected);
    for (i = 0; i < moves.length; i++) { if (moves[i].to === square) { choices.push(moves[i]); } }
    if (!choices.length) { selected = null; render(); return; }
    if (choices.length > 1) { openPromotion(selected, square); return; }
    afterMove(selected, square, choices[0].promotion || null);
  }
  function closePromotion() { modalMove = null; ID('promotion-modal').className = 'modal is-hidden'; }
  function openPromotion(from, to) {
    var types = ['q', 'r', 'b', 'n'], symbols = { w: ['♕', '♖', '♗', '♘'], b: ['♛', '♜', '♝', '♞'] };
    var names = { q: 'common.queen', r: 'common.rook', b: 'common.bishop', n: 'common.knight' };
    var choices = ID('promotion-choices'), i, button, small, span, color = game.engine.turn();
    choices.innerHTML = ''; modalMove = { from: from, to: to };
    for (i = 0; i < types.length; i++) {
      button = document.createElement('button'); button.type = 'button'; button.className = 'promotion-choice';
      button.setAttribute('aria-label', t(names[types[i]]));
      span = document.createElement('span'); span.textContent = symbols[color][i];
      small = document.createElement('small'); small.textContent = t(names[types[i]]);
      button.appendChild(span); button.appendChild(small);
      (function (promotion) {
        button.onclick = function () {
          var pending = modalMove;
          closePromotion();
          if (pending) { afterMove(pending.from, pending.to, promotion); }
        };
      }(types[i]));
      choices.appendChild(button);
    }
    ID('promotion-modal').className = 'modal';
    if (choices.firstChild) { choices.firstChild.focus(); }
  }
  function exitGame() {
    Xake.AI.cancel(); selected = null; closePromotion(); store(); saved(); show('screen-menu');
  }
  function bind() {
    ID('btn-new').onclick = function () { start(true, { mode: 'local-two-players' }); };
    ID('btn-open-editor').onclick = function () { editorUI.open(); };
    ID('btn-open-library').onclick = function () { editorUI.openLibrary(); };
    ID('btn-new-ai').onclick = function () { ID('ai-setup').className = 'setup-panel'; };
    ID('btn-ai-cancel').onclick = function () { ID('ai-setup').className = 'setup-panel is-hidden'; };
    ID('btn-ai-start').onclick = function () {
      var difficulty = Number(ID('ai-level').value), humanColor = ID('ai-color').value;
      var prefs = Xake.Storage.preferences();
      prefs.aiDifficulty = difficulty; prefs.humanColor = humanColor;
      Xake.Storage.savePreferences(prefs);
      start(true, { mode: 'vs-computer', difficulty: difficulty, humanColor: humanColor });
    };
    ID('btn-continue').onclick = function () { start(false); };
    ID('btn-menu').onclick = exitGame;
    ID('btn-save-exit').onclick = exitGame;
    ID('btn-undo').onclick = function () {
      if (!game || !game.canUndo()) { return; }
      Xake.AI.cancel();
      if (game.undoTurn()) { selected = null; closePromotion(); render(); store(); maybeComputer(); }
    };
    ID('btn-flip').onclick = function () { board.flip(); render(); };
    ID('btn-restart').onclick = function () {
      if (!game || !root.confirm(t('game.restartConfirm'))) { return; }
      Xake.AI.cancel(); game.reset(); selected = null; closePromotion();
      board.flipped = game.mode === 'vs-computer' && game.humanColor === 'b';
      render(); store(); maybeComputer();
    };
    ID('btn-promotion-cancel').onclick = function () { closePromotion(); render(); };
    ID('language').onchange = function () {
      var lang = this.value;
      Xake.I18n.change(lang, function () {
        var prefs = Xake.Storage.preferences(); prefs.language = lang;
        if (!Xake.Storage.savePreferences(prefs)) { notice(t('storage.failed')); }
        translations();
      });
    };
  }
  function init() {
    if (typeof Chess !== 'function') { ID('notice').textContent = 'No se ha podido iniciar el motor de ajedrez.'; return; }
    var prefs = Xake.Storage.preferences();
    Xake.I18n.init(prefs.language === 'eu' ? 'eu' : 'es', function () {
      board = new Xake.Board(ID('board'), chooseSquare);
      editorUI = new Xake.EditorUI(show, function (scenario, settings) {
        start(true, { mode: settings.mode, humanColor: settings.humanColor,
          difficulty: settings.difficulty, initialFen: scenario.initialFen,
          scenarioId: scenario.id, scenarioName: scenario.name });
      });
      ID('ai-level').value = prefs.aiDifficulty >= 1 && prefs.aiDifficulty <= 4 ? String(prefs.aiDifficulty) : '1';
      ID('ai-color').value = prefs.humanColor === 'b' ? 'b' : 'w';
      translations(); bind(); saved(); show('screen-menu');
    });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
}(window));
