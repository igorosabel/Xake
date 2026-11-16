/* global window, document */
/* Xake Hito 9: interfaz educativa táctil, ES5. */
(function (root) {
  'use strict';
  var Xake = root.Xake = root.Xake || {};
  var lesson = null, game = null, board = null, selected = null, hint = false;
  var solved = false, pending = false, feedback = '', feedbackStatus = '';
  var TYPES = { p: 'pawn', r: 'rook', b: 'bishop', n: 'knight', q: 'queen', k: 'king' };
  function id(name) { return document.getElementById(name); }
  function t(key, vars) { return Xake.I18n.t(key, vars); }
  function el(tag, text, cls) {
    var node = document.createElement(tag);
    if (text !== null && text !== undefined) { node.textContent = text; }
    if (cls) { node.className = cls; }
    return node;
  }
  function button(text, action, cls) {
    var b = el('button', text, cls || 'btn'); b.type = 'button'; b.onclick = action; return b;
  }
  function name(item) {
    if (item.group === 'special') { return t('learn.special.' + item.kind); }
    return t('common.' + TYPES[item.piece]) + ' · ' + t('learn.type.' + item.kind);
  }
  function goal(item) {
    return t('learn.goal.' + item.kind, { from: item.from, to: item.to });
  }
  function renderCards(box, items, completed) {
    var i, item, card, head, body, title, info, symbol, state;
    box.innerHTML = '';
    for (i = 0; i < items.length; i++) {
      item = items[i];
      card = el('div', null, 'learn-card');
      head = el('div', null, 'learn-card-heading');
      symbol = el('span', Xake.Board.glyphs['w' + item.piece], 'learn-card-symbol');
      head.appendChild(symbol);
      body = el('div', null, 'learn-card-body');
      title = el('strong', name(item)); body.appendChild(title);
      info = el('span', goal(item), 'learn-card-description'); body.appendChild(info);
      head.appendChild(body); card.appendChild(head);
      state = el('span', completed[item.id] ? t('learn.done') : t('learn.pending'),
        'learn-card-state' + (completed[item.id] ? ' is-done' : ''));
      card.appendChild(state);
      (function (l) { card.appendChild(button(t('learn.practice'), function () { open(l); }, 'btn btn-primary')); }(item));
      box.appendChild(card);
    }
  }
  function list() {
    var all = Xake.Learn.lessons, pieces = [], special = [], i, saved = Xake.Learn.progress();
    for (i = 0; i < all.length; i++) { (all[i].group === 'special' ? special : pieces).push(all[i]); }
    renderCards(id('learn-pieces'), pieces, saved);
    renderCards(id('learn-special'), special, saved);
    id('learn-progress').textContent = t('learn.progress', { count: Xake.Learn.count(), total: all.length });
  }
  function openList() {
    lesson = null; game = null; selected = null; pending = false;
    id('learn-list').className = '';
    id('learn-play').className = 'is-hidden';
    list();
    Xake.navigate('screen-learn');
  }
  function reset() {
    if (!lesson) { return; }
    game = new Xake.Game({ mode: 'local-two-players', initialFen: Xake.Learn.fenFor(lesson) });
    selected = null; hint = false; solved = false; pending = false; feedback = ''; feedbackStatus = '';
    if (board) { board.flipped = false; }
    id('learn-promotion').className = 'is-hidden';
    render();
  }
  function open(l) {
    lesson = l; id('learn-list').className = 'is-hidden'; id('learn-play').className = '';
    reset(); Xake.navigate('screen-learn'); board.size(); render();
  }
  function showResult(text, status) {
    feedback = text; feedbackStatus = status || '';
    id('learn-feedback').className = 'learn-feedback ' + (status || '');
    id('learn-feedback').textContent = text;
  }
  function render() {
    if (!board || !game || !lesson) { return; }
    var moves = [], targets = [], i, r, f, square, squareNode;
    if (selected && !solved) {
      moves = game.legalFrom(selected);
      for (i = 0; i < moves.length; i++) {
        if (targets.indexOf(moves[i].to) < 0) { targets.push(moves[i].to); }
      }
    }
    board.render(game, selected, targets, solved ? game.history().slice(-1)[0] : null);
    if (hint && !solved) {
      for (r = 0; r < 8; r++) {
        for (f = 0; f < 8; f++) {
          square = board.squareFor(r, f);
          squareNode = board.squares[r * 8 + f].button;
          if (square === lesson.from) { squareNode.className += ' learn-hint-from'; }
          if (square === lesson.to) { squareNode.className += ' learn-hint-to'; }
        }
      }
    }
    id('learn-current-title').textContent = name(lesson);
    id('learn-explanation').textContent = t(lesson.group === 'special' ?
      'learn.explain.' + lesson.kind : 'learn.about.' + lesson.piece);
    id('learn-objective').textContent = goal(lesson);
    id('learn-hint').disabled = hint || solved;
    id('learn-next').className = 'btn btn-primary' + (solved ? '' : ' is-hidden');
    id('learn-next').textContent = lesson.id === 'special-promote' ? t('learn.finish') : t('learn.next');
    id('learn-restart').disabled = !lesson;
    id('learn-feedback').textContent = feedback;
    id('learn-feedback').className = 'learn-feedback ' + feedbackStatus;
  }
  function finish(from, to, promotion) {
    if (!lesson || solved || pending) { return; }
    if (!Xake.Learn.correct(lesson, game.engine.fen(), from, to, promotion)) {
      selected = lesson.from;
      showResult(t('learn.tryAgain'), 'is-error');
      render(); return;
    }
    var move = game.move(from, to, promotion);
    if (!move) { showResult(t('learn.illegal'), 'is-error'); render(); return; }
    selected = null; solved = true; hint = false;
    var saved = Xake.Learn.mark(lesson.id);
    showResult(t('learn.success') + (saved ? '' : ' ' + t('storage.failed')), 'is-success');
    render();
  }
  function showPromotion(from, to) {
    var box = id('learn-promotion'), options = ['q', 'r', 'b', 'n'], i;
    pending = true; box.innerHTML = '';
    box.appendChild(el('p', t('learn.choosePromotion')));
    for (i = 0; i < options.length; i++) {
      (function (type) {
        box.appendChild(button(t('common.' + TYPES[type]), function () {
          box.className = 'is-hidden'; pending = false; finish(from, to, type);
        }));
      }(options[i]));
    }
    box.appendChild(button(t('common.cancel'), function () {
      pending = false; box.className = 'is-hidden'; render();
    }));
    box.className = 'learn-promotion';
  }
  function squareClicked(square) {
    if (!lesson || solved || pending) { return; }
    var piece = game.engine.get(square), moves, i, found = false, count = 0;
    if (square === lesson.from) {
      selected = selected === square ? null : square;
      showResult('', ''); render(); return;
    }
    if (!selected) {
      showResult(t('learn.selectPiece'), 'is-error'); return;
    }
    moves = game.legalFrom(selected);
    for (i = 0; i < moves.length; i++) {
      if (moves[i].to === square) { found = true; count++; }
    }
    if (!found) { showResult(t('learn.illegal'), 'is-error'); return; }
    if (square !== lesson.to) { showResult(t('learn.tryAgain'), 'is-error'); return; }
    if (lesson.kind === 'promotion' && count > 1) { showPromotion(selected, square); return; }
    finish(selected, square, null);
  }
  function next() {
    if (!solved || !lesson) { return; }
    var all = Xake.Learn.lessons, i;
    for (i = 0; i < all.length; i++) {
      if (all[i].id === lesson.id && i + 1 < all.length) { open(all[i + 1]); return; }
    }
    openList();
  }
  function languageChanged() {
    if (!id('screen-learn')) { return; }
    if (lesson) { render(); }
    else { list(); }
  }
  function init() {
    if (!Xake.Learn || !Xake.Board || !Xake.navigate || !id('learn-board')) { return; }
    board = new Xake.Board(id('learn-board'), squareClicked);
    id('btn-open-learn').onclick = openList;
    id('learn-back-menu').onclick = function () { Xake.navigate('screen-menu'); };
    id('learn-back-list').onclick = openList;
    id('learn-hint').onclick = function () {
      if (!lesson || solved) { return; }
      hint = true; selected = lesson.from;
      render();
    };
    id('learn-restart').onclick = function () { reset(); };
    id('learn-next').onclick = next;
  }
  Xake.LearnUI = { openList: openList, languageChanged: languageChanged };
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
}(window));
