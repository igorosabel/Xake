/* global window, document */
/* Xake - interfaz del editor y biblioteca. ES5 y pulsaciones táctiles. */
(function (root) {
  'use strict';
  var Xake = root.Xake = root.Xake || {};
  var TYPES = ['k', 'q', 'r', 'b', 'n', 'p'];
  function el(id) { return document.getElementById(id); }
  function t(key, vars) { return Xake.I18n.t(key, vars); }
  function make(tag, text, className) {
    var n = document.createElement(tag);
    if (text !== undefined && text !== null) { n.textContent = text; }
    if (className) { n.className = className; }
    return n;
  }
  function button(label, callback, className) {
    var b = make('button', label, className || 'btn'); b.type = 'button'; b.onclick = callback; return b;
  }
  function trim(s) { return String(s || '').replace(/^\s+|\s+$/g, ''); }
  function EditorUI(navigate, onPlay) {
    this.navigate = navigate;
    this.onPlay = onPlay;
    this.editor = new Xake.Editor();
    this.board = new Xake.Board(el('editor-board'), this.squareClicked.bind(this));
    this.color = 'w'; this.palette = 'q'; this.selectedSquare = null; this.step = 1;
    this.armyEdit = { w: null, b: null };
    this.aiScenario = null;
    this.bind();
  }
  EditorUI.prototype.say = function (key) { el('editor-message').textContent = t(key); };
  EditorUI.prototype.open = function (scenario) {
    this.editor = new Xake.Editor();
    if (scenario && !this.editor.loadScenario(scenario)) {
      this.say('editor.invalidPosition'); return false;
    }
    this.color = 'w'; this.palette = 'q'; this.selectedSquare = null;
    this.armyEdit = { w: null, b: null };
    el('editor-scenario-name').value = scenario ? scenario.name : '';
    el('editor-first').value = this.editor.turn;
    el('editor-message').textContent = '';
    this.navigate('screen-editor');
    this.showStep(scenario ? 2 : 1);
    return true;
  };
  EditorUI.prototype.showStep = function (step) {
    var i;
    this.step = step;
    for (i = 1; i <= 3; i++) { el('editor-step-' + i).className = 'editor-step' + (step === i ? '' : ' is-hidden'); }
    el('editor-step-label').textContent = t('editor.step' + step + 'Label');
    if (step === 1) { this.renderCounts(); this.renderArmies(); }
    if (step === 2) { this.selectedSquare = null; this.renderPlacement(); this.board.size(); }
    if (step === 3) { this.renderValidation(); }
  };
  EditorUI.prototype.languageChanged = function () {
    if (this.step === 1) { this.renderCounts(); this.renderArmies(); }
    if (this.step === 2) { this.renderPlacement(); }
    if (this.step === 3) { this.renderValidation(); }
    this.renderLibrary();
  };
  EditorUI.prototype.renderCounts = function () {
    var that = this, c = this.color, counts = this.editor.armies[c];
    var box = el('editor-army-counts'), i, typ, row, name, minus, amount, plus;
    box.innerHTML = '';
    el('btn-editor-white').className = 'btn' + (c === 'w' ? ' is-active' : '');
    el('btn-editor-black').className = 'btn' + (c === 'b' ? ' is-active' : '');
    for (i = 0; i < TYPES.length; i++) {
      typ = TYPES[i];
      row = make('div', null, 'army-count-row');
      row.appendChild(make('span', Xake.Board.glyphs[c + typ], 'army-glyph'));
      row.appendChild(make('span', t(Xake.Board.names[typ]), 'army-piece-name'));
      (function (p) {
        minus = button('−', function () { that.changeCount(p, -1); }, 'editor-count-btn');
        minus.setAttribute('aria-label', t('editor.less') + ' ' + t(Xake.Board.names[p]));
        minus.disabled = counts[p] <= (p === 'k' ? 1 : 0);
        plus = button('+', function () { that.changeCount(p, 1); }, 'editor-count-btn');
        plus.setAttribute('aria-label', t('editor.more') + ' ' + t(Xake.Board.names[p]));
        plus.disabled = p === 'k';
      }(typ));
      amount = make('span', String(counts[typ]), 'army-amount');
      row.appendChild(minus); row.appendChild(amount); row.appendChild(plus);
      box.appendChild(row);
    }
    el('editor-army-total').textContent = t('editor.armyTotal', {
      white: this.editor.total('w'), black: this.editor.total('b'),
      total: this.editor.total('w') + this.editor.total('b') });
  };
  EditorUI.prototype.changeCount = function (type, change) {
    var c = this.color, error = this.editor.setCount(c, type, this.editor.armies[c][type] + change);
    if (error) { this.say(error === 'placed' ? 'editor.removeFirst' : error === 'capacity' ? 'editor.invalidCapacity' : 'editor.invalidCount'); }
    else { this.say('editor.countChanged'); }
    this.renderCounts();
  };
  EditorUI.prototype.renderArmies = function () {
    var items = Xake.Storage.armies(), select = el('editor-army-saved'), current = select.value, i, opt;
    select.innerHTML = ''; select.appendChild(make('option', t('editor.chooseArmy'))).value = '';
    for (i = 0; i < items.length; i++) {
      opt = make('option', items[i].name); opt.value = items[i].id; select.appendChild(opt);
    }
    if (Xake.Storage.army(current)) { select.value = current; }
    else if (this.armyEdit[this.color]) { select.value = this.armyEdit[this.color]; }
  };
  EditorUI.prototype.loadArmy = function () {
    var a = Xake.Storage.army(el('editor-army-saved').value);
    if (!a) { this.say('editor.chooseArmy'); return; }
    if (!root.confirm(t('editor.replaceBoardConfirm'))) { return; }
    if (!this.editor.setArmy(this.color, a.pieces)) { this.say('editor.invalidCapacity'); return; }
    this.armyEdit[this.color] = a.id; this.say('editor.armyLoaded'); this.renderCounts();
  };
  EditorUI.prototype.saveArmy = function (copy) {
    var id = copy ? null : this.armyEdit[this.color], existing = id ? Xake.Storage.army(id) : null;
    var name = root.prompt(t('editor.armyName'), existing ? existing.name : '');
    if (name === null) { return; }
    name = trim(name);
    if (!name || name.length > 60) { this.say('editor.nameRequired'); return; }
    var now = new Date().toISOString();
    var item = { id: id || 'army-' + Date.now() + '-' + Math.floor(Math.random() * 1000000),
      name: name, pieces: Xake.EditorTools.copyCounts(this.editor.armies[this.color]),
      createdAt: existing ? existing.createdAt : now, updatedAt: now };
    if (!Xake.Storage.saveArmy(item)) { this.say('storage.failed'); return; }
    this.armyEdit[this.color] = item.id;
    this.renderArmies(); el('editor-army-saved').value = item.id; this.say('editor.armySaved');
  };
  EditorUI.prototype.deleteArmy = function () {
    var id = el('editor-army-saved').value, a = Xake.Storage.army(id);
    if (!a) { this.say('editor.chooseArmy'); return; }
    if (!root.confirm(t('editor.deleteConfirm', { name: a.name }))) { return; }
    if (!Xake.Storage.removeArmy(id)) { this.say('storage.failed'); return; }
    if (this.armyEdit[this.color] === id) { this.armyEdit[this.color] = null; }
    this.renderArmies(); this.say('editor.armyDeleted');
  };
  EditorUI.prototype.renderPalette = function () {
    var box = el('editor-palette'), color = this.color, i, type, that = this;
    box.innerHTML = '';
    el('btn-place-white').className = 'btn' + (color === 'w' ? ' is-active' : '');
    el('btn-place-black').className = 'btn' + (color === 'b' ? ' is-active' : '');
    for (i = 0; i < TYPES.length; i++) {
      type = TYPES[i];
      (function (p) {
        var remaining = that.editor.remaining(color, p);
        var b = button('', function () { that.palette = p; that.selectedSquare = null; that.renderPlacement(); },
          'editor-palette-piece' + (that.palette === p && !that.selectedSquare ? ' is-active' : ''));
        b.appendChild(make('span', Xake.Board.glyphs[color + p], 'palette-symbol'));
        b.appendChild(make('span', t(Xake.Board.names[p]), 'palette-label'));
        b.appendChild(make('span', String(remaining), 'palette-remaining'));
        b.disabled = remaining <= 0;
        box.appendChild(b);
      }(type));
    }
    var remainingTotal = 0;
    for (i = 0; i < TYPES.length; i++) { remainingTotal += this.editor.remaining('w', TYPES[i]) + this.editor.remaining('b', TYPES[i]); }
    el('editor-left-count').textContent = t('editor.remaining', { count: remainingTotal });
    el('btn-editor-remove').disabled = !this.selectedSquare;
    el('btn-editor-undo').disabled = !this.editor._undo.length;
    el('btn-editor-redo').disabled = !this.editor._redo.length;
  };
  EditorUI.prototype.renderPlacement = function () {
    this.board.renderEditor(this.editor, this.selectedSquare);
    this.renderPalette();
  };
  EditorUI.prototype.squareClicked = function (square) {
    if (this.step !== 2) { return; }
    var p = this.editor.get(square), selected = this.selectedSquare;
    if (selected === square) { this.selectedSquare = null; this.renderPlacement(); return; }
    if (selected && !p) {
      if (!this.editor.movePiece(selected, square)) { this.say('editor.cannotMove'); return; }
      this.selectedSquare = null; this.renderPlacement(); this.say('editor.pieceMoved'); return;
    }
    if (p) {
      this.selectedSquare = square; this.color = p.color; this.palette = p.type;
      this.renderPlacement(); this.say('editor.selectedPlaced'); return;
    }
    if (this.editor.place(square, this.color, this.palette)) {
      this.renderPlacement(); this.say('editor.piecePlaced');
    } else { this.say('editor.cannotPlace'); }
  };
  EditorUI.prototype.renderValidation = function () {
    var v = this.editor.validate(), status = el('editor-validation');
    status.className = 'editor-validation is-' + v.state;
    status.textContent = t(v.key);
    el('editor-scenario-summary').textContent = t('editor.summary', {
      white: this.editor.total('w'), black: this.editor.total('b') });
    el('btn-editor-save').disabled = v.state === 'error';
    el('btn-editor-save-play').disabled = v.state === 'error' || v.state === 'terminal';
  };
  EditorUI.prototype.saveScenario = function (play) {
    this.editor.name = trim(el('editor-scenario-name').value);
    if (!this.editor.name || this.editor.name.length > 60) { this.say('editor.nameRequired'); return; }
    var v = this.editor.validate(), data;
    if (v.state === 'error' || (play && v.state === 'terminal')) { this.say(v.key); return; }
    data = this.editor.serialize(this.editor.name);
    if (!data || !Xake.Storage.saveScenario(data)) { this.say('storage.failed'); return; }
    this.editor.id = data.id; this.editor.createdAt = data.createdAt;
    this.say('editor.scenarioSaved');
    if (play) { this.onPlay(data, { mode: 'local-two-players' }); }
    else { this.openLibrary(); }
  };
  EditorUI.prototype.openLibrary = function () {
    this.aiScenario = null; el('library-ai-setup').className = 'panel is-hidden';
    this.navigate('screen-library'); this.renderLibrary();
  };
  EditorUI.prototype.validScenario = function (scenario) {
    var e = new Xake.Editor();
    if (!e.loadScenario(scenario)) { return null; }
    var validation = e.validate();
    return validation.state === 'error' ? null : validation;
  };
  EditorUI.prototype.renderLibrary = function () {
    var scenarios = Xake.Storage.scenarios(), list = el('library-scenarios');
    var i, s, row, title, detail, buttons, that = this, result;
    list.innerHTML = '';
    if (!scenarios.length) { list.appendChild(make('p', t('library.empty'), 'editor-subtext')); return; }
    for (i = 0; i < scenarios.length; i++) {
      s = scenarios[i]; result = this.validScenario(s);
      row = make('div', null, 'scenario-item');
      title = make('h2', s.name); row.appendChild(title);
      detail = make('p', result ? t(result.key) : t('editor.invalidPosition'), 'editor-subtext');
      row.appendChild(detail);
      buttons = make('div', null, 'scenario-actions');
      (function (sc, valid) {
        var local = button(t('library.playTwo'), function () { that.playSaved(sc, 'local-two-players'); }, 'btn btn-primary');
        var ai = button(t('ai.menu'), function () { that.aiSetup(sc); }, 'btn');
        local.disabled = !valid || valid.state === 'terminal';
        ai.disabled = !valid || valid.state === 'terminal';
        buttons.appendChild(local); buttons.appendChild(ai);
        buttons.appendChild(button(t('editor.edit'), function () { that.open(sc); }, 'btn'));
        buttons.appendChild(button(t('editor.duplicate'), function () {
          var original = new Xake.Editor();
          if (!original.loadScenario(sc)) { return; }
          original.id = null; original.createdAt = null;
          var copy = original.serialize(t('editor.copyOf', { name: sc.name }).slice(0, 60));
          if (copy && Xake.Storage.saveScenario(copy)) { that.renderLibrary(); }
          else { root.alert(t('storage.failed')); }
        }, 'btn'));
        buttons.appendChild(button(t('editor.delete'), function () {
          if (!root.confirm(t('editor.deleteConfirm', { name: sc.name }))) { return; }
          if (!Xake.Storage.removeScenario(sc.id)) { root.alert(t('storage.failed')); return; }
          that.renderLibrary();
        }, 'btn'));
      }(s, result));
      row.appendChild(buttons); list.appendChild(row);
    }
  };
  EditorUI.prototype.playSaved = function (scenario, mode, level, color) {
    var v = this.validScenario(scenario);
    if (!v || v.state === 'terminal') { root.alert(t('editor.invalidPosition')); return; }
    this.onPlay(scenario, { mode: mode, difficulty: level, humanColor: color });
  };
  EditorUI.prototype.aiSetup = function (scenario) {
    this.aiScenario = scenario;
    var prefs = Xake.Storage.preferences();
    el('library-ai-level').value = prefs.aiDifficulty >= 1 && prefs.aiDifficulty <= 4 ? String(prefs.aiDifficulty) : '1';
    el('library-ai-color').value = prefs.humanColor === 'b' ? 'b' : 'w';
    el('library-ai-scenario').textContent = scenario.name;
    el('library-ai-setup').className = 'panel';
  };
  EditorUI.prototype.bind = function () {
    var that = this;
    el('btn-editor-menu').onclick = function () { that.navigate('screen-menu'); };
    el('btn-editor-white').onclick = function () { that.color = 'w'; el('editor-army-saved').value = ''; that.renderCounts(); that.renderArmies(); };
    el('btn-editor-black').onclick = function () { that.color = 'b'; el('editor-army-saved').value = ''; that.renderCounts(); that.renderArmies(); };
    el('btn-army-classic').onclick = function () {
      if (!root.confirm(t('editor.replaceBoardConfirm'))) { return; }
      if (!that.editor.setArmy(that.color, Xake.EditorTools.classic)) { that.say('editor.invalidCapacity'); return; }
      that.armyEdit[that.color] = null; that.renderCounts();
    };
    el('btn-army-empty').onclick = function () {
      if (!root.confirm(t('editor.replaceBoardConfirm'))) { return; }
      if (!that.editor.setArmy(that.color, Xake.EditorTools.emptyCounts())) { that.say('editor.invalidCapacity'); return; }
      that.armyEdit[that.color] = null; that.renderCounts();
    };
    el('btn-army-save').onclick = function () { that.saveArmy(false); };
    el('btn-army-duplicate').onclick = function () { that.saveArmy(true); };
    el('btn-army-load').onclick = function () { that.loadArmy(); };
    el('btn-army-delete').onclick = function () { that.deleteArmy(); };
    el('btn-editor-next-1').onclick = function () { that.showStep(2); };
    el('btn-place-white').onclick = function () { that.color = 'w'; that.selectedSquare = null; that.renderPlacement(); };
    el('btn-place-black').onclick = function () { that.color = 'b'; that.selectedSquare = null; that.renderPlacement(); };
    el('btn-editor-remove').onclick = function () {
      if (that.selectedSquare && that.editor.remove(that.selectedSquare)) {
        that.selectedSquare = null; that.renderPlacement(); that.say('editor.pieceRemoved');
      }
    };
    el('btn-editor-undo').onclick = function () {
      if (that.editor.undo()) { that.selectedSquare = null; that.renderPlacement(); }
    };
    el('btn-editor-redo').onclick = function () {
      if (that.editor.redo()) { that.selectedSquare = null; that.renderPlacement(); }
    };
    el('btn-editor-clear').onclick = function () {
      if (!root.confirm(t('editor.clearConfirm'))) { return; }
      that.editor.clear(); that.selectedSquare = null; that.renderPlacement();
    };
    el('btn-editor-auto').onclick = function () {
      if (that.editor.board.some(function (v) { return v !== '.'; }) && !root.confirm(t('editor.replaceBoardConfirm'))) { return; }
      if (!that.editor.autoPlace()) { that.say('editor.autoFailed'); }
      else { that.selectedSquare = null; that.renderPlacement(); that.say('editor.autoDone'); }
    };
    el('btn-editor-back-2').onclick = function () { that.showStep(1); };
    el('btn-editor-next-2').onclick = function () { that.showStep(3); };
    el('btn-editor-back-3').onclick = function () { that.showStep(2); };
    el('editor-first').onchange = function () { that.editor.setTurn(this.value); that.renderValidation(); };
    el('btn-editor-save').onclick = function () { that.saveScenario(false); };
    el('btn-editor-save-play').onclick = function () { that.saveScenario(true); };
    el('btn-library-menu').onclick = function () { that.navigate('screen-menu'); };
    el('btn-library-create').onclick = function () { that.open(); };
    el('btn-library-ai-cancel').onclick = function () { el('library-ai-setup').className = 'panel is-hidden'; };
    el('btn-library-ai-start').onclick = function () {
      if (!that.aiScenario) { return; }
      var n = Number(el('library-ai-level').value), c = el('library-ai-color').value;
      var prefs = Xake.Storage.preferences(); prefs.aiDifficulty = n; prefs.humanColor = c;
      Xake.Storage.savePreferences(prefs);
      that.playSaved(that.aiScenario, 'vs-computer', n, c);
    };
  };
  Xake.EditorUI = EditorUI;
}(window));
