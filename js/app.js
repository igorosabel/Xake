/* global window, document, Chess */
(function (root) {
  'use strict';
  var Xake = root.Xake = root.Xake || {};
  var game = null, board = null, selected = null, modalMove = null;
  var ID = function (id) { return document.getElementById(id); };
  function t(key) { return Xake.I18n.t(key); }
  function show(id) {
    ID('screen-menu').className = 'screen' + (id === 'screen-menu' ? '' : ' is-hidden');
    ID('screen-game').className = 'screen' + (id === 'screen-game' ? '' : ' is-hidden');
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
    var targets = [], legal, i, list, item, html, status = game.status();
    if (selected && !status.ended) {
      legal = game.legalFrom(selected);
      for (i = 0; i < legal.length; i++) {
        if (targets.indexOf(legal[i].to) === -1) { targets.push(legal[i].to); }
      }
    }
    board.render(game, selected, targets, last);
    ID('game-status').textContent = status.text;
    ID('btn-undo').disabled = moves.length === 0;
    list = ID('moves-list'); list.innerHTML = '';
    for (i = Math.max(0, 2 * Math.ceil((moves.length - 16) / 2)); i < moves.length; i += 2) {
      item = document.createElement('li');
      html = (moves[i] ? moves[i].san : '') + (moves[i + 1] ? '  ' + moves[i + 1].san : '');
      item.textContent = html;
      item.value = Math.floor(i / 2) + 1;
      list.appendChild(item);
    }
    if (!moves.length) {
      item = document.createElement('li'); item.textContent = t('game.noMoves'); list.appendChild(item);
    }
  }
  function start(newGame) {
    if (newGame) {
      if (Xake.Storage.savedGame() && !root.confirm(t('game.newConfirm'))) { return; }
      game = new Xake.Game();
    } else {
      game = new Xake.Game();
      if (!game.restore(Xake.Storage.savedGame())) { notice(t('storage.badGame')); saved(); return; }
    }
    selected = null; modalMove = null;
    closePromotion();
    board.flipped = false;
    show('screen-game');
    board.size();
    render();
    if (newGame) { store(); }
    else { notice(''); }
  }
  function afterMove(from, to, promotion) {
    var result = game.move(from, to, promotion);
    if (result) { selected = null; render(); store(); }
  }
  function chooseSquare(square) {
    if (!game || modalMove || game.status().ended) { return; }
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
  function bind() {
    ID('btn-new').onclick = function () { start(true); };
    ID('btn-continue').onclick = function () { start(false); };
    ID('btn-menu').onclick = function () { selected = null; closePromotion(); store(); saved(); show('screen-menu'); };
    ID('btn-save-exit').onclick = function () { selected = null; closePromotion(); store(); saved(); show('screen-menu'); };
    ID('btn-undo').onclick = function () {
      if (game.undo()) { selected = null; closePromotion(); render(); store(); }
    };
    ID('btn-flip').onclick = function () { board.flip(); render(); };
    ID('btn-restart').onclick = function () {
      if (root.confirm(t('game.restartConfirm'))) { game.reset(); selected = null; closePromotion(); render(); store(); }
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
      translations(); bind(); saved();
      show('screen-menu');
    });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
}(window));
