/* global window, document, MutationObserver */
/* Xake - Pulido de interfaz: ajustes, pestañas y acciones compactas. ES5, iOS 9. */
(function (root) {
  'use strict';
  var Xake = root.Xake = root.Xake || {};
  var TABS = [
    { id: 'controls', key: 'game.controls', icon: 'controls' },
    { id: 'appearance', key: 'appearance.title', icon: 'palette' },
    { id: 'settings', key: 'polish.tabSettings', icon: 'settings' },
    { id: 'captures', key: 'ux.captures', icon: 'captures', pref: 'showCapturedTab' },
    { id: 'moves', key: 'game.moves', icon: 'moves', pref: 'showMovesTab' }
  ];
  var ICONS = {
    controls: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="17" r="2"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18h2a2 2 0 0 0 2-2 2 2 0 0 0-.5-1.3 2 2 0 0 1 1.5-3.3h1a3 3 0 0 0 3-3A9 9 0 0 0 12 3Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="11" cy="7" r="1"/><circle cx="16" cy="8.5" r="1"/>',
    settings: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="18" r="2"/>',
    captures: '<path d="M8 21h8M10 17v4m4-4v4M8 17h8l1-4-2-2 2-3-5-5-5 5 2 3-2 2z"/>',
    moves: '<path d="M4 6h14M4 11h14M4 16h9"/><path d="m16 15 4 3-4 3"/>' ,
    edit: '<path d="M12 20h9M16 4l4 4L9 19l-5 1 1-5z"/>',
    duplicate: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    delete: '<path d="M4 7h16M10 7V4h4v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>'
  };
  var selectedTab = 'controls';
  var tabs = {}, panels = {}, lastGame = null;
  function id(name) { return document.getElementById(name); }
  function t(key) { return Xake.I18n.t(key); }
  function create(tag, cls) {
    var el = document.createElement(tag);
    if (cls) { el.className = cls; }
    return el;
  }
  function label(key, tag) {
    var el = create(tag || 'span'); el.setAttribute('data-i18n', key); el.textContent = t(key); return el;
  }
  function svgIcon(icon) {
    var holder = create('span', 'xake-svg-icon');
    holder.setAttribute('aria-hidden', 'true');
    holder.innerHTML = '<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true">' + ICONS[icon] + '</svg>';
    return holder;
  }
  function pref(key) { return Xake.Storage.preferences()[key] === true; }
  function enabledTab(tab) { return !tab.pref || pref(tab.pref); }
  function setPreference(key, value) {
    if (key !== 'showCapturedTab' && key !== 'showMovesTab') { return false; }
    var p = Xake.Storage.preferences(); p[key] = !!value;
    return Xake.Storage.savePreferences(p);
  }
  function selectTab(which) {
    var i, def;
    for (i = 0; i < TABS.length; i++) {
      def = TABS[i];
      if (tabs[def.id] && panels[def.id]) {
        tabs[def.id].setAttribute('aria-selected', def.id === which ? 'true' : 'false');
        tabs[def.id].tabIndex = def.id === which ? 0 : -1;
        panels[def.id].className = 'xake-tab-panel' + (def.id === which ? '' : ' is-hidden');
      }
    }
    selectedTab = which;
  }
  function updateOptionalTabs() {
    var i, tab;
    for (i = 0; i < TABS.length; i++) {
      tab = TABS[i];
      if (tabs[tab.id]) { tabs[tab.id].className = 'xake-tab' + (enabledTab(tab) ? '' : ' is-hidden'); }
    }
    if ((selectedTab === 'captures' && !pref('showCapturedTab')) || (selectedTab === 'moves' && !pref('showMovesTab'))) {
      selectTab('settings');
    }
  }
  function addVisibilityOption(parent, key, textKey) {
    var row = create('label', 'ux-option'), input = create('input');
    input.type = 'checkbox'; input.id = 'ux-' + key; input.checked = pref(key);
    input.onchange = function () {
      if (!setPreference(key, this.checked)) {
        this.checked = pref(key); root.alert(t('storage.failed')); return;
      }
      updateOptionalTabs();
    };
    row.appendChild(input); row.appendChild(label(textKey)); parent.appendChild(row);
  }
  function buildTabs() {
    var sidebar = document.querySelector('#screen-game .game-sidebar');
    if (!sidebar || id('xake-tab-navigation')) { return; }
    var oldControls = id('btn-undo') && id('btn-undo').parentNode.parentNode;
    var oldAppearance = id('xake-game-appearance-panel');
    var oldSettings = id('ux-aids');
    var oldCaptures = id('ux-captures');
    var oldMoves = sidebar.querySelector('.moves-panel');
    if (!oldControls || !oldAppearance || !oldSettings || !oldCaptures || !oldMoves) { return; }
    // Comprobar que los cinco elementos se mantienen antes de reubicarlos.
    var sources = [oldControls, oldAppearance, oldSettings, oldCaptures, oldMoves];
    var nav = create('div', 'xake-tabs'), body = create('div', 'xake-tabs-body');
    var i, tab, button, panel, source;
    nav.id = 'xake-tab-navigation'; nav.setAttribute('role', 'tablist');
    nav.setAttribute('aria-label', t('polish.tabList'));
    for (i = 0; i < TABS.length; i++) {
      tab = TABS[i]; source = sources[i];
      button = create('button', 'xake-tab'); button.type = 'button';
      button.id = 'xake-tab-' + tab.id;
      button.setAttribute('role', 'tab'); button.setAttribute('aria-controls', 'xake-panel-' + tab.id);
      button.appendChild(svgIcon(tab.icon));
      (function (value) { button.onclick = function () { selectTab(value); }; }(tab.id));
      panel = create('section', 'xake-tab-panel'); panel.id = 'xake-panel-' + tab.id;
      panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', button.id);
      panel.appendChild(source); nav.appendChild(button); body.appendChild(panel);
      tabs[tab.id] = button; panels[tab.id] = panel;
    }
    addVisibilityOption(oldSettings, 'showCapturedTab', 'polish.showCaptured');
    addVisibilityOption(oldSettings, 'showMovesTab', 'polish.showMoves');
    sidebar.insertBefore(nav, sidebar.firstChild);
    sidebar.appendChild(body);
    selectTab('controls'); updateOptionalTabs(); updateLabels();
  }
  function hideElement(el) { if (el && el.parentNode) { el.parentNode.removeChild(el); } }
  function openSettings() {
    var screen = id('screen-settings');
    if (!screen) { return; }
    Xake.navigate('screen-menu');
    id('screen-menu').className = 'screen is-hidden';
    screen.className = 'screen';
  }
  function closeSettings() {
    var screen = id('screen-settings');
    if (screen) { screen.className = 'screen is-hidden'; }
    Xake.navigate('screen-menu');
  }
  function resetProgress() {
    if (!root.confirm(t('polish.resetConfirm'))) { return false; }
    try { root.localStorage.removeItem(Xake.Challenges.storageKeys.progress); }
    catch (e) { root.alert(t('storage.failed')); return false; }
    var msg = id('polish-reset-message'); if (msg) { msg.textContent = t('polish.resetDone'); }
    return true;
  }
  function resetLearnProgress() {
    if (!Xake.Learn || !Xake.Learn.storageKey) { return false; }
    if (!root.confirm(t('polish.resetLearnConfirm'))) { return false; }
    try { root.localStorage.removeItem(Xake.Learn.storageKey); }
    catch (e) { root.alert(t('storage.failed')); return false; }
    var msg = id('polish-learn-reset-message');
    if (msg) { msg.textContent = t('polish.resetLearnDone'); }
    return true;
  }
  function buildSettingsScreen() {
    if (id('screen-settings')) { return; }
    var home = document.querySelector('#screen-menu .welcome');
    var main = document.querySelector('main');
    var appearance = id('xake-menu-appearance-panel');
    var lang = document.querySelector('#screen-menu .language-row');
    if (!home || !main || !appearance || !lang) { return; }
    var section = create('section', 'screen is-hidden'); section.id = 'screen-settings';
    var heading = create('div', 'game-heading');
    var title = label('polish.settingsTitle', 'h1');
    var back = create('button', 'btn btn-quiet'); back.type = 'button'; back.id = 'polish-settings-back';
    back.appendChild(label('game.menu'));
    back.onclick = closeSettings; heading.appendChild(title); heading.appendChild(back);
    var content = create('div', 'panel xake-settings-content');
    content.appendChild(appearance); content.appendChild(lang);
    var reset = create('div', 'xake-reset-section');
    reset.appendChild(label('polish.resetTitle', 'h2'));
    reset.appendChild(label('polish.resetDescription', 'p'));
    var resetButton = create('button', 'btn'); resetButton.type = 'button';
    resetButton.appendChild(label('polish.resetButton')); resetButton.onclick = resetProgress;
    reset.appendChild(resetButton);
    var msg = create('p', 'xake-reset-message'); msg.id = 'polish-reset-message';
    msg.setAttribute('role', 'status'); reset.appendChild(msg);
    content.appendChild(reset);
    var resetLearn = create('div', 'xake-reset-section');
    resetLearn.appendChild(label('polish.resetLearnTitle', 'h2'));
    resetLearn.appendChild(label('polish.resetLearnDescription', 'p'));
    var resetLearnButton = create('button', 'btn'); resetLearnButton.type = 'button';
    resetLearnButton.id = 'polish-reset-learn-button';
    resetLearnButton.appendChild(label('polish.resetLearnButton'));
    resetLearnButton.onclick = resetLearnProgress;
    resetLearn.appendChild(resetLearnButton);
    var learnMsg = create('p', 'xake-reset-message'); learnMsg.id = 'polish-learn-reset-message';
    learnMsg.setAttribute('role', 'status'); resetLearn.appendChild(learnMsg);
    content.appendChild(resetLearn);
    section.appendChild(heading); section.appendChild(content);
    main.appendChild(section);
    var open = create('button', 'btn btn-large'); open.type = 'button'; open.id = 'btn-settings';
    open.appendChild(label('polish.settingsTitle')); open.onclick = openSettings;
    home.appendChild(open);
    hideElement(home.querySelector('h1[data-i18n="menu.title"]'));
    hideElement(home.querySelector('p[data-i18n="menu.intro"]'));
    // El aviso del Hito 1 también ha quedado obsoleto.
    hideElement(home.querySelector('.small-print[data-i18n="menu.future"]'));
  }
  function iconButton(button, icon) {
    if (!button || button.className.indexOf('xake-icon-action') >= 0) { return; }
    var description = button.getAttribute('aria-label') || button.textContent;
    button.className = 'btn xake-icon-action';
    button.title = description; button.setAttribute('aria-label', description);
    button.textContent = ''; button.appendChild(svgIcon(icon));
  }
  function formatActionRow(row, numberLeft, icons) {
    if (!row || row.querySelector('.xake-action-left')) { return; }
    var children = [], i, left, right;
    for (i = 0; i < row.children.length; i++) { children.push(row.children[i]); }
    if (children.length !== numberLeft + icons.length) { return; }
    left = create('div', 'xake-action-left'); right = create('div', 'xake-action-right');
    for (i = 0; i < children.length; i++) {
      if (i < numberLeft) { left.appendChild(children[i]); }
      else { iconButton(children[i], icons[i - numberLeft]); right.appendChild(children[i]); }
    }
    row.appendChild(left); row.appendChild(right);
  }
  function formatScenarios() {
    var rows = document.querySelectorAll('#library-scenarios .scenario-actions'), i;
    for (i = 0; i < rows.length; i++) { formatActionRow(rows[i], 2, ['edit', 'duplicate', 'delete']); }
  }
  function formatSavedGames() {
    var rows = document.querySelectorAll('#saved-games-list .saved-game-actions'), i;
    for (i = 0; i < rows.length; i++) { formatActionRow(rows[i], 1, ['edit', 'delete']); }
  }
  function armyButtons() {
    var select = id('editor-army-saved'); if (!select) { return; }
    var chosen = !!Xake.Storage.army(select.value);
    id('btn-army-load').disabled = !chosen;
    id('btn-army-delete').disabled = !chosen;
  }
  function readyChallenge() {
    var name = id('challenge-name'), scenario = id('challenge-scenario'), goal = id('challenge-goal');
    if (!name || !scenario || !goal || !Xake.Challenges) { return false; }
    var n = name.value.replace(/^\s+|\s+$/g, '');
    return n.length > 0 && n.length <= 60 && !!Xake.Storage.scenario(scenario.value) && Xake.Challenges.goals.indexOf(goal.value) !== -1;
  }
  function readyImport(value) { return typeof value === 'string' && !!value.replace(/^\s+|\s+$/g, ''); }
  function syncChallenge() { var save = id('challenge-create'); if (save) { save.disabled = !readyChallenge(); } }
  function syncImport() {
    var textarea = id('xake-backup-import');
    var buttons = document.querySelectorAll('.xake-backup-panel button');
    if (textarea && buttons.length >= 2) { buttons[1].disabled = !readyImport(textarea.value); }
  }
  function installInputs() {
    var army = id('editor-army-saved'), chName = id('challenge-name'), chScenario = id('challenge-scenario');
    var chGoal = id('challenge-goal'), chButton = id('challenge-create'), importArea = id('xake-backup-import');
    if (army) { army.addEventListener('change', armyButtons); armyButtons(); }
    if (chName) { chName.addEventListener('input', syncChallenge); chName.addEventListener('change', syncChallenge); }
    if (chScenario) { chScenario.addEventListener('change', syncChallenge); }
    if (chGoal) { chGoal.addEventListener('change', syncChallenge); }
    if (chButton) { chButton.addEventListener('click', function () { root.setTimeout(syncChallenge, 0); }); }
    if (importArea) { importArea.addEventListener('input', syncImport); importArea.addEventListener('change', syncImport); }
    syncChallenge(); syncImport();
    if (root.MutationObserver) {
      var saved = id('saved-games-list'), scenarioList = id('library-scenarios');
      if (saved) { new root.MutationObserver(formatSavedGames).observe(saved, { childList: true }); }
      if (scenarioList) { new root.MutationObserver(formatScenarios).observe(scenarioList, { childList: true }); }
      if (chScenario) { new root.MutationObserver(syncChallenge).observe(chScenario, { childList: true }); }
      if (army) { new root.MutationObserver(armyButtons).observe(army, { childList: true }); }
    }
  }
  function updateLabels() {
    var i, def, button;
    for (i = 0; i < TABS.length; i++) {
      def = TABS[i]; button = tabs[def.id];
      if (button) { button.title = t(def.key); button.setAttribute('aria-label', t(def.key)); }
    }
    var nav = id('xake-tab-navigation'); if (nav) { nav.setAttribute('aria-label', t('polish.tabList')); }
  }
  function patchTranslations() {
    var originalInit = Xake.I18n.init, originalChange = Xake.I18n.change;
    Xake.I18n.init = function (lang, callback) {
      return originalInit(lang, function () { callback(); updateLabels(); });
    };
    Xake.I18n.change = function (lang, callback) {
      return originalChange(lang, function () { callback(); updateLabels(); });
    };
  }
  function init() {
    buildSettingsScreen(); buildTabs(); installInputs();
    // El editor se vuelve a dibujar tras seleccionar bando o cargar un ejército.
    if (Xake.EditorUI) {
      var renderArmies = Xake.EditorUI.prototype.renderArmies;
      Xake.EditorUI.prototype.renderArmies = function () {
        var result = renderArmies.apply(this, arguments); armyButtons(); return result;
      };
      var renderLibrary = Xake.EditorUI.prototype.renderLibrary;
      Xake.EditorUI.prototype.renderLibrary = function () {
        var result = renderLibrary.apply(this, arguments); formatScenarios(); return result;
      };
    }
    if (Xake.Board) {
      var oldRender = Xake.Board.prototype.render;
      Xake.Board.prototype.render = function (game) {
        if (this.container && this.container.id === 'board' && game !== lastGame) {
          lastGame = game; selectTab('controls');
        }
        return oldRender.apply(this, arguments);
      };
    }
    formatSavedGames(); formatScenarios();
  }
  Xake.UIPolish = { init: init, readyChallenge: readyChallenge, readyImport: readyImport,
    enabledTab: enabledTab, resetProgress: resetProgress, resetLearnProgress: resetLearnProgress,
    setPreference: setPreference,
    selectTab: selectTab, updateOptionalTabs: updateOptionalTabs, formatActionRow: formatActionRow,
    armyButtons: armyButtons, syncChallenge: syncChallenge, syncImport: syncImport };
  patchTranslations();
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
}(window));
