/* global window, document */
/* Xake Hito 7: ayudas visuales y piezas capturadas. ES5; sin bibliotecas. */
(function (root) {
  'use strict';
  var Xake = root.Xake = root.Xake || {};
  var TYPES = ['q', 'r', 'b', 'n', 'p'];
  var OPTIONS = [
    { key: 'showDestinations', css: 'xake-hide-destinations', label: 'ux.destinations' },
    { key: 'showLastMove', css: 'xake-hide-last', label: 'ux.lastMove' },
    { key: 'showCoordinates', css: 'xake-hide-coordinates', label: 'ux.coordinates' }
  ];
  var lastGame = null, lastSignature = null;
  var whiteContainer = null, blackContainer = null;

  function id(name) { return document.getElementById(name); }
  function t(key) { return Xake.I18n.t(key); }
  function create(tag, className, text) {
    var el = document.createElement(tag);
    if (className) { el.className = className; }
    if (typeof text === 'string') { el.textContent = text; }
    return el;
  }
  function translated(tag, className, key) {
    var el = create(tag, className, t(key));
    el.setAttribute('data-i18n', key);
    return el;
  }
  function enabled(name) {
    var prefs = Xake.Storage.preferences();
    return prefs[name] !== false; // Las partidas antiguas conservan las ayudas activadas.
  }
  function setOption(name, value) {
    var valid = false, i, prefs;
    for (i = 0; i < OPTIONS.length; i++) { if (OPTIONS[i].key === name) { valid = true; break; } }
    if (!valid) { return false; }
    prefs = Xake.Storage.preferences();
    prefs[name] = value === true;
    var ok = Xake.Storage.savePreferences(prefs);
    applyOptions();
    return ok;
  }
  function setClass(node, name, active) {
    if (!node) { return; }
    var css = (' ' + (node.className || '') + ' ').replace(new RegExp(' ' + name + ' ', 'g'), ' ');
    css = css.replace(/^\s+|\s+$/g, '');
    node.className = css + (active ? (css ? ' ' : '') + name : '');
  }
  function applyOptions() {
    var ids = ['board', 'challenge-board', 'editor-board'];
    var i, j, container;
    for (i = 0; i < ids.length; i++) {
      container = id(ids[i]);
      if (!container) { continue; }
      for (j = 0; j < OPTIONS.length; j++) {
        setClass(container, OPTIONS[j].css, !enabled(OPTIONS[j].key));
      }
    }
  }
  function emptyCounts() { return { q: 0, r: 0, b: 0, n: 0, p: 0 }; }
  function captured(history) {
    var out = { w: emptyCounts(), b: emptyCounts() }, i, m;
    if (!history || Object.prototype.toString.call(history) !== '[object Array]') { return out; }
    for (i = 0; i < history.length; i++) {
      m = history[i];
      if (m && (m.color === 'w' || m.color === 'b') && TYPES.indexOf(m.captured) !== -1) {
        out[m.color][m.captured]++;
      }
    }
    return out;
  }
  function fillCaptureRow(container, counts, captor, theme) {
    var opponent = captor === 'w' ? 'b' : 'w', i, type, pair, pic, qty, total = 0;
    while (container.firstChild) { container.removeChild(container.firstChild); }
    for (i = 0; i < TYPES.length; i++) {
      type = TYPES[i];
      if (!counts[type]) { continue; }
      total += counts[type];
      pair = create('span', 'ux-capture-pair');
      pair.setAttribute('aria-label', t(Xake.Board.names[type]) + ' × ' + counts[type]);
      pic = create('span', 'ux-capture-icon' + (opponent === 'w' ? ' is-white' : ' is-black'));
      pic.setAttribute('aria-hidden', 'true');
      if (theme !== 'classic' && Xake.Appearance) {
        pic.style.backgroundImage = 'url("' + Xake.Appearance.iconUrl(theme, opponent, type) + '")';
        pic.className += ' is-image';
      } else {
        pic.textContent = Xake.Board.glyphs[opponent + type];
      }
      qty = create('span', 'ux-capture-amount', counts[type] > 1 ? '×' + counts[type] : '');
      pair.appendChild(pic); pair.appendChild(qty);
      container.appendChild(pair);
    }
    if (!total) { container.appendChild(translated('span', 'ux-capture-empty', 'ux.none')); }
  }
  function renderCaptured(game) {
    if (!game || !whiteContainer || !blackContainer || !game.history) { return; }
    var c = captured(game.history());
    var wt = Xake.Appearance ? Xake.Appearance.safe(game.whiteAppearance) : 'classic';
    var bt = Xake.Appearance ? Xake.Appearance.safe(game.blackAppearance) : 'classic';
    var signature = JSON.stringify([c.w, c.b, wt, bt, Xake.I18n.language()]);
    if (game === lastGame && signature === lastSignature) { return; }
    lastGame = game; lastSignature = signature;
    // Las blancas capturan piezas negras: se dibujan con el aspecto de las negras.
    fillCaptureRow(whiteContainer, c.w, 'w', bt);
    fillCaptureRow(blackContainer, c.b, 'b', wt);
  }
  function buildControls() {
    var sidebar = document.querySelector('#screen-game .game-sidebar');
    if (!sidebar || id('ux-aids')) { return; }
    var panel = create('section', 'panel ux-panel');
    var capturePanel = create('section', 'panel ux-panel');
    var i, row, check, key, text;
    panel.id = 'ux-aids';
    panel.appendChild(translated('h2', '', 'ux.title'));
    for (i = 0; i < OPTIONS.length; i++) {
      row = create('label', 'ux-option');
      check = create('input'); check.type = 'checkbox'; check.checked = enabled(OPTIONS[i].key);
      key = OPTIONS[i].key;
      check.id = 'ux-' + key;
      (function (optionName) {
        check.onchange = function () {
          if (!setOption(optionName, this.checked)) {
            this.checked = enabled(optionName);
            root.alert(t('storage.failed'));
          }
        };
      }(key));
      text = translated('span', '', OPTIONS[i].label);
      row.appendChild(check); row.appendChild(text); panel.appendChild(row);
    }
    capturePanel.id = 'ux-captures';
    capturePanel.appendChild(translated('h2', '', 'ux.captures'));
    capturePanel.appendChild(translated('h3', 'ux-capture-heading', 'ux.byWhite'));
    whiteContainer = create('div', 'ux-capture-row'); whiteContainer.id = 'ux-captured-by-white';
    capturePanel.appendChild(whiteContainer);
    capturePanel.appendChild(translated('h3', 'ux-capture-heading', 'ux.byBlack'));
    blackContainer = create('div', 'ux-capture-row'); blackContainer.id = 'ux-captured-by-black';
    capturePanel.appendChild(blackContainer);
    var moves = sidebar.querySelector('.moves-panel');
    sidebar.insertBefore(panel, moves || null);
    sidebar.insertBefore(capturePanel, moves || null);
    fillCaptureRow(whiteContainer, emptyCounts(), 'w', 'classic');
    fillCaptureRow(blackContainer, emptyCounts(), 'b', 'classic');
    applyOptions();
  }

  // Decorar el render ya existente: no intervenir en el motor ni en el editor.
  if (Xake.Board) {
    var previousRender = Xake.Board.prototype.render;
    Xake.Board.prototype.render = function (game, selected, targets, lastMove) {
      var ret = previousRender.apply(this, arguments);
      if (this.container && this.container.id === 'board') { renderCaptured(game); }
      return ret;
    };
  }
  Xake.Usability = { captured: captured, enabled: enabled, setOption: setOption,
    applyOptions: applyOptions, renderCaptured: renderCaptured, init: buildControls };
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', buildControls); }
  else { buildControls(); }
}(window));
