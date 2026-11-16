/* global window, document */
/* Xake Hito 4 - apariencias independientes por bando, JavaScript ES5. */
(function (root) {
  'use strict';
  var Xake = root.Xake = root.Xake || {};
  var THEMES = ['classic', 'medallas', 'emblemas'];
  var TYPES = ['k', 'q', 'r', 'b', 'n', 'p'];
  var activeGame = null, activeBoard = null, previousRender = null;
  /* Respaldo español también si fallase la carga de los JSON. */
  var spanishFallback = {
    'appearance.title': 'Apariencia de las piezas',
    'appearance.white': 'Piezas blancas', 'appearance.black': 'Piezas negras',
    'appearance.classic': 'Clásico', 'appearance.medallas': 'Medallas',
    'appearance.emblemas': 'Emblemas',
    'backup.title': 'Copia de seguridad',
    'backup.description': 'Exporta o importa tus ejércitos y tableros en JSON. No incluye partidas en curso.',
    'backup.export': 'Preparar copia JSON', 'backup.importLabel': 'Pega aquí tu copia JSON:',
    'backup.import': 'Importar copia',
    'backup.importConfirm': '¿Importar los ejércitos y tableros? Se añadirán como copias nuevas sin sustituir los existentes.',
    'backup.imported': 'Importados {armies} ejércitos y {scenarios} tableros.',
    'backup.copyInstruction': 'Texto seleccionado. Utiliza Copiar y guárdalo en un lugar seguro.',
    'backup.exportFailed': 'No se ha podido preparar la copia. Revisa las configuraciones guardadas.',
    'backup.error.json': 'El texto no contiene un JSON válido.',
    'backup.error.format': 'El archivo no es una copia de Xake compatible.',
    'backup.error.size': 'La copia es demasiado grande para este dispositivo.',
    'backup.error.army': 'La copia contiene un ejército no válido o duplicado.',
    'backup.error.scenario': 'La copia contiene un tablero inválido o duplicado.',
    'backup.error.storage': 'No se ha podido importar: falta espacio o el almacenamiento está bloqueado.'
  };
  var originalTranslate = Xake.I18n.t;
  Xake.I18n.t = function (key, values) {
    var found = originalTranslate(key, values), result, template;
    if (found !== key || !Object.prototype.hasOwnProperty.call(spanishFallback, key)) { return found; }
    template = spanishFallback[key];
    result = template.replace(/\{([a-zA-Z]+)\}/g, function (match, name) {
      return values && values[name] !== undefined ? String(values[name]) : match;
    });
    return result;
  };
  function id(name) { return document.getElementById(name); }
  function valid(name) { return THEMES.indexOf(name) >= 0; }
  function safe(name) { return valid(name) ? name : 'classic'; }
  function preference(color) {
    var p = Xake.Storage.preferences();
    return safe(p[color === 'w' ? 'whiteAppearance' : 'blackAppearance']);
  }
  function savedPreferences(color, theme) {
    var p = Xake.Storage.preferences();
    p[color === 'w' ? 'whiteAppearance' : 'blackAppearance'] = safe(theme);
    return Xake.Storage.savePreferences(p);
  }
  function iconUrl(theme, color, type) {
    if (theme === 'classic') { return ''; }
    return 'assets/pieces/' + theme + '/' + color + type + '.png';
  }
  function themeFor(game, color) {
    return game ? safe(color === 'w' ? game.whiteAppearance : game.blackAppearance) : preference(color);
  }
  function drawPiece(element, theme, color, type) {
    theme = safe(theme);
    if (theme === 'classic' || !type) {
      // Una casilla vacía puede conservar el fondo PNG de una jugada anterior.
      if (!type) { element.textContent = ''; }
      element.style.backgroundImage = 'none';
      element.style.backgroundPosition = '';
      element.style.backgroundRepeat = '';
      element.style.backgroundSize = '';
      element.className = element.className.replace(/ xake-piece-image/g, '');
      return;
    }
    element.textContent = '';
    element.style.backgroundImage = 'url("' + iconUrl(theme, color, type) + '")';
    element.style.backgroundPosition = 'center center';
    element.style.backgroundRepeat = 'no-repeat';
    element.style.backgroundSize = '90% 90%';
    if (element.className.indexOf('xake-piece-image') < 0) { element.className += ' xake-piece-image'; }
  }
  function decorateBoard(board, game) {
    var row, col, square, cell, piece, color, t;
    for (row = 0; row < 8; row++) {
      for (col = 0; col < 8; col++) {
        square = board.squareFor(row, col);
        cell = board.squares[row * 8 + col];
        piece = game ? game.engine.get(square) : null;
        if (!cell) { continue; }
        // Procesar las 64 casillas, incluidas las vacías: el render base no
        // restablece backgroundImage al borrar una pieza.
        color = piece ? piece.color : null;
        t = piece ? themeFor(game, color) : 'classic';
        drawPiece(cell.piece, t, color, piece ? piece.type : null);
      }
    }
  }
  function decorateEditor(board, editor) {
    var row, col, square, cell, piece;
    for (row = 0; row < 8; row++) {
      for (col = 0; col < 8; col++) {
        square = board.squareFor(row, col);
        cell = board.squares[row * 8 + col];
        piece = editor.get(square);
        if (!cell) { continue; }
        drawPiece(cell.piece, piece ? preference(piece.color) : 'classic',
          piece ? piece.color : null, piece ? piece.type : null);
      }
    }
  }
  function decoratePalette(container, selector, color) {
    if (!container) { return; }
    var children = container.querySelectorAll(selector), i, type, node, theme = preference(color);
    for (i = 0; i < TYPES.length && i < children.length; i++) {
      type = TYPES[i]; node = children[i];
      if (theme === 'classic') { continue; }
      drawPiece(node, theme, color, type);
    }
  }
  /* El tablero original sigue controlando movimientos y accesibilidad. */
  var Board = Xake.Board;
  var baseRender = Board.prototype.render;
  var baseEditorRender = Board.prototype.renderEditor;
  Board.prototype.render = function (game, selected, targets, lastMove) {
    var result = baseRender.apply(this, arguments);
    activeGame = game; activeBoard = this;
    previousRender = [game, selected, targets, lastMove];
    decorateBoard(this, game);
    refreshGameSelectors();
    return result;
  };
  Board.prototype.renderEditor = function (editor, selectedSquare) {
    var result = baseEditorRender.apply(this, arguments);
    decorateEditor(this, editor);
    return result;
  };
  /* Los inventarios del editor también respetan la apariencia elegida. */
  if (Xake.EditorUI) {
    var basePalette = Xake.EditorUI.prototype.renderPalette;
    Xake.EditorUI.prototype.renderPalette = function () {
      var result = basePalette.apply(this, arguments);
      decoratePalette(id('editor-palette'), '.palette-symbol', this.color);
      return result;
    };
    var baseCounts = Xake.EditorUI.prototype.renderCounts;
    Xake.EditorUI.prototype.renderCounts = function () {
      var result = baseCounts.apply(this, arguments);
      decoratePalette(id('editor-army-counts'), '.army-glyph', this.color);
      return result;
    };
  }
  /* No se modifica la API pública ni el formato de las partidas anteriores. */
  var BaseGame = Xake.Game;
  function GameWithAppearance(options) {
    var game = new BaseGame(options);
    game.whiteAppearance = preference('w');
    game.blackAppearance = preference('b');
    return game;
  }
  GameWithAppearance.prototype = BaseGame.prototype;
  GameWithAppearance.prototype.constructor = GameWithAppearance;
  var baseSnapshot = BaseGame.prototype.snapshot;
  BaseGame.prototype.snapshot = function () {
    var snapshot = baseSnapshot.apply(this, arguments);
    snapshot.whiteAppearance = safe(this.whiteAppearance);
    snapshot.blackAppearance = safe(this.blackAppearance);
    return snapshot;
  };
  var baseRestore = BaseGame.prototype.restore;
  BaseGame.prototype.restore = function (saved) {
    var restored = baseRestore.apply(this, arguments);
    if (restored) {
      this.whiteAppearance = safe(saved.whiteAppearance);
      this.blackAppearance = safe(saved.blackAppearance);
    }
    return restored;
  };
  Xake.Game = GameWithAppearance;
  function textNode(tag, key, fallback) {
    var n = document.createElement(tag);
    n.setAttribute('data-i18n', key);
    n.textContent = fallback;
    return n;
  }
  function choice(color, prefix) {
    var select = document.createElement('select'), themes = [
      { value: 'classic', key: 'appearance.classic', text: 'Clásico' },
      { value: 'medallas', key: 'appearance.medallas', text: 'Medallas' },
      { value: 'emblemas', key: 'appearance.emblemas', text: 'Emblemas' }
    ], i, option;
    select.id = prefix + '-' + color;
    select.setAttribute('aria-label', color === 'w' ? 'Apariencia de las blancas' : 'Apariencia de las negras');
    for (i = 0; i < themes.length; i++) {
      option = textNode('option', themes[i].key, themes[i].text);
      option.value = themes[i].value; select.appendChild(option);
    }
    return select;
  }
  function makePanel(prefix, isGame) {
    var div = document.createElement('div');
    div.className = isGame ? 'panel xake-appearance-panel' : 'xake-appearance-panel';
    div.id = prefix + '-appearance-panel';
    div.appendChild(textNode('h2', 'appearance.title', 'Apariencia de las piezas'));
    ['w', 'b'].forEach(function (color) {
      var label = textNode('label', color === 'w' ? 'appearance.white' : 'appearance.black', color === 'w' ? 'Blancas' : 'Negras');
      var select = choice(color, prefix), row = document.createElement('div');
      row.className = 'xake-theme-row'; label.htmlFor = select.id;
      row.appendChild(label); row.appendChild(select); div.appendChild(row);
      select.onchange = function () {
        var theme = safe(this.value), ok = true;
        if (!isGame) {
          ok = savedPreferences(color, theme);
          if (!ok) { root.alert(Xake.I18n.t('storage.failed')); }
        }
        if (isGame && activeGame) {
          if (color === 'w') { activeGame.whiteAppearance = theme; }
          else { activeGame.blackAppearance = theme; }
          if (activeBoard && previousRender) { activeBoard.render.apply(activeBoard, previousRender); }
          if (!Xake.Storage.saveGame(activeGame.snapshot())) { root.alert(Xake.I18n.t('storage.failed')); }
        }
        if (!isGame) { syncMenuSelectors(); }
      };
    });
    return div;
  }
  function syncMenuSelectors() {
    var colors = ['w', 'b'], i, el1;
    for (i = 0; i < colors.length; i++) {
      el1 = id('xake-menu-' + colors[i]);
      if (el1) { el1.value = preference(colors[i]); }
    }
  }
  function refreshGameSelectors() {
    if (!activeGame) { return; }
    var a = id('xake-game-w'), b = id('xake-game-b');
    if (a) { a.value = themeFor(activeGame, 'w'); }
    if (b) { b.value = themeFor(activeGame, 'b'); }
  }
  function initUI() {
    var menu = document.querySelector('#screen-menu .welcome');
    var sidebar = document.querySelector('#screen-game .game-sidebar');
    var lang = document.querySelector('#screen-menu .language-row');
    if (menu) { menu.insertBefore(makePanel('xake-menu', false), lang || null); }
    if (sidebar) { sidebar.insertBefore(makePanel('xake-game', true), sidebar.firstChild); }
    syncMenuSelectors();
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initUI); }
  else { initUI(); }
  Xake.Appearance = { themes: THEMES, valid: valid, safe: safe, iconUrl: iconUrl,
    preference: preference, getActiveGame: function () { return activeGame; } };
}(window));
