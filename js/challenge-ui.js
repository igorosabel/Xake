/* global window, document */
/* Xake Hito 5: interfaz de retos de una jugada. JavaScript ES5, solo pulsaciones. */
(function (root) {
  'use strict';
  var Xake = root.Xake = root.Xake || {};
  var current = null, game = null, board = null, selected = null, hint = false;
  var attempts = 0, finished = false, result = null, pending = null;
  function id(name) { return document.getElementById(name); }
  function t(key, vars) { return Xake.I18n.t(key, vars); }
  function el(tag, text, cls) {
    var node = document.createElement(tag);
    if (typeof text === 'string') { node.textContent = text; }
    if (cls) { node.className = cls; }
    return node;
  }
  function btn(text, action, cls) {
    var node = el('button', text, cls || 'btn');
    node.type = 'button'; node.onclick = action;
    return node;
  }
  function trim(str) { return String(str || '').replace(/^\s+|\s+$/g, ''); }
  function goalName(goal) { return t('challenge.goal.' + goal); }
  function title(item) { return item.nameKey ? t(item.nameKey) : item.name; }
  function message(text, failed) {
    var n = id('challenge-message'); n.textContent = text;
    n.className = 'challenge-message' + (failed ? ' is-error' : '');
  }
  function createItem(item, personal, progress) {
    var row = el('div', null, 'challenge-item'), top = el('div', null, 'challenge-item-heading');
    top.appendChild(el('strong', title(item)));
    top.appendChild(el('span', progress[item.id] ? '★ ' + progress[item.id].bestStars + '/3' : '☆', 'challenge-stars'));
    row.appendChild(top);
    row.appendChild(el('p', goalName(item.goal), 'challenge-subtitle'));
    var controls = el('div', null, 'challenge-actions');
    controls.appendChild(btn(t('challenge.play'), function () { open(item); }, 'btn btn-primary'));
    if (personal) {
      controls.appendChild(btn(t('challenge.delete'), function () {
        if (!root.confirm(t('challenge.deleteConfirm', { name: title(item) }))) { return; }
        if (!Xake.Challenges.remove(item.id)) { message(t('storage.failed'), true); return; }
        list(); message(t('challenge.deleted'), false);
      }));
    }
    row.appendChild(controls);
    return row;
  }
  function list() {
    var built = id('challenge-builtins'), custom = id('challenge-custom'), saved = Xake.Challenges.custom();
    var progress = Xake.Challenges.progress(), i;
    built.innerHTML = ''; custom.innerHTML = '';
    for (i = 0; i < Xake.Challenges.builtins.length; i++) {
      built.appendChild(createItem(Xake.Challenges.builtins[i], false, progress));
    }
    if (!saved.length) { custom.appendChild(el('p', t('challenge.noCustom'), 'challenge-subtitle')); }
    for (i = 0; i < saved.length; i++) { custom.appendChild(createItem(saved[i], true, progress)); }
    var scenarios = Xake.Storage.scenarios(), select = id('challenge-scenario'), last = select.value;
    select.innerHTML = '';
    var option = el('option', t('challenge.chooseScenario')); option.value = ''; select.appendChild(option);
    for (i = 0; i < scenarios.length; i++) {
      option = el('option', scenarios[i].name); option.value = scenarios[i].id; select.appendChild(option);
    }
    if (Xake.Storage.scenario(last)) { select.value = last; }
    id('challenge-no-scenarios').className = scenarios.length ? 'is-hidden' : 'challenge-subtitle';
  }
  function openList() {
    current = null; game = null; selected = null; finished = false; result = null;
    id('challenge-list').className = '';
    id('challenge-play').className = 'is-hidden';
    list(); message('', false);
    Xake.navigate('screen-challenges');
  }
  function open(item) {
    current = item; attempts = 0; hint = false;
    id('challenge-list').className = 'is-hidden';
    id('challenge-play').className = '';
    reset();
    Xake.navigate('screen-challenges');
    board.size();
    render();
  }
  function reset() {
    if (!current) { return; }
    game = new Xake.Game({ mode: 'local-two-players', initialFen: current.initialFen });
    selected = null; finished = false; result = null; pending = null;
    id('challenge-promotion').className = 'is-hidden';
    if (board) { board.flipped = game.engine.turn() === 'b'; }
    render();
  }
  function render() {
    if (!current || !game || !board) { return; }
    var legal = [], all = [], i;
    if (selected && !finished) {
      all = game.legalFrom(selected);
      for (i = 0; i < all.length; i++) {
        if (legal.indexOf(all[i].to) < 0) { legal.push(all[i].to); }
      }
    }
    if (!selected && hint && !finished) {
      var solutions = Xake.Challenges.solutions(current.initialFen, current.goal);
      if (solutions.length) { selected = solutions[0].from; legal = [solutions[0].to]; }
    }
    var moves = game.history(), last = moves.length ? moves[moves.length - 1] : null;
    board.render(game, selected, legal, last);
    id('challenge-current-name').textContent = title(current);
    id('challenge-current-goal').textContent = goalName(current.goal);
    id('challenge-turn').textContent = t(game.engine.turn() === 'w' ? 'challenge.white' : 'challenge.black');
    id('challenge-instructions').textContent = t('challenge.instructions');
    id('challenge-hint').disabled = finished || hint;
    id('challenge-retry').disabled = !finished && attempts === 0 && !hint;
    id('challenge-result').textContent = result || '';
    id('challenge-result').className = 'challenge-result' + (finished && result && !game.engine.game_over() ? ' is-success' : '');
  }
  function perform(from, to, promotion) {
    if (!current || finished) { return; }
    var played = game.move(from, to, promotion);
    if (!played) { return; }
    selected = null; attempts++;
    finished = true;
    if (Xake.Challenges.success(game.engine, played, current.goal)) {
      var earned = Xake.Challenges.stars(attempts, hint);
      if (!Xake.Challenges.markSolved(current.id, earned)) {
        result = t('challenge.solved') + ' ' + t('storage.failed');
      } else {
        result = t('challenge.solved') + '  ' + new Array(earned + 1).join('★');
      }
    } else { result = t('challenge.tryAgain'); }
    render();
    id('challenge-result').className = 'challenge-result ' +
      (Xake.Challenges.success(game.engine, played, current.goal) ? 'is-success' : 'is-error');
  }
  function promotion(choices, from, to) {
    var list = id('challenge-promotion'), options = ['q', 'r', 'b', 'n'], names = { q: 'common.queen', r: 'common.rook', b: 'common.bishop', n: 'common.knight' }, i;
    list.innerHTML = '';
    list.className = 'challenge-promotion';
    list.appendChild(el('p', t('game.promote')));
    for (i = 0; i < options.length; i++) {
      (function (which) {
        list.appendChild(btn(t(names[which]), function () {
          list.className = 'is-hidden';
          pending = null;
          perform(from, to, which);
        }));
      }(options[i]));
    }
    list.appendChild(btn(t('common.cancel'), function () {
      pending = null; list.className = 'is-hidden'; render();
    }));
  }
  function squareClicked(square) {
    if (!current || finished || pending) { return; }
    var piece = game.engine.get(square), turn = game.engine.turn(), all, ways = [], i;
    if (piece && piece.color === turn) { selected = selected === square ? null : square; render(); return; }
    if (!selected) { return; }
    all = game.legalFrom(selected);
    for (i = 0; i < all.length; i++) { if (all[i].to === square) { ways.push(all[i]); } }
    if (!ways.length) { selected = null; render(); return; }
    if (ways.length > 1) { pending = { from: selected, to: square }; promotion(ways, selected, square); return; }
    perform(selected, square, ways[0].promotion || null);
  }
  function create() {
    var name = trim(id('challenge-name').value), scenario = Xake.Storage.scenario(id('challenge-scenario').value);
    var goal = id('challenge-goal').value;
    if (!name || name.length > 60) { message(t('challenge.invalidName'), true); return; }
    if (!scenario) { message(t('challenge.chooseScenario'), true); return; }
    var item = Xake.Challenges.createFromScenario(scenario, goal, name);
    if (!item) { message(t('challenge.noSolution'), true); return; }
    if (!Xake.Challenges.save(item)) { message(t('storage.failed'), true); return; }
    id('challenge-name').value = '';
    list(); message(t('challenge.saved'), false);
  }
  function languageChanged() {
    if (id('screen-challenges') && id('screen-challenges').className.indexOf('is-hidden') < 0) {
      if (current) { render(); } else { list(); }
    }
  }
  function init() {
    if (!Xake.Challenges || !Xake.Board || !Xake.navigate || !id('challenge-board')) { return; }
    board = new Xake.Board(id('challenge-board'), squareClicked);
    id('btn-open-challenges').onclick = openList;
    id('challenge-back-menu').onclick = function () { Xake.navigate('screen-menu'); };
    id('challenge-back-list').onclick = openList;
    id('challenge-hint').onclick = function () { hint = true; selected = null; render(); };
    id('challenge-retry').onclick = function () { reset(); };
    id('challenge-create').onclick = create;
    // Si cambia el tablero elegido, sugerir su nombre como nombre del reto.
    id('challenge-scenario').onchange = function () {
      var sc = Xake.Storage.scenario(this.value);
      if (sc && !trim(id('challenge-name').value)) { id('challenge-name').value = sc.name; }
    };
  }
  Xake.ChallengeUI = { openList: openList, languageChanged: languageChanged };
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
}(window));
