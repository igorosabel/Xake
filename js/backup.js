/* global window, document */
/* Xake Hito 4 - copia e importación de ejércitos y tableros; ES5. */
(function (root) {
  'use strict';
  var Xake = root.Xake = root.Xake || {};
  var FORMAT = 'xake-config';
  var TYPES = ['k', 'q', 'r', 'b', 'n', 'p'];
  var ARMY_KEY = 'xake:v1:armies', SCENARIO_KEY = 'xake:v1:scenarios';
  function t(key, vars) { return Xake.I18n.t(key, vars); }
  function isArray(a) { return Object.prototype.toString.call(a) === '[object Array]'; }
  function text(value) { return typeof value === 'string' ? value : ''; }
  function nameOk(s) { return typeof s === 'string' && s.replace(/^\s+|\s+$/g, '').length > 0 && s.length <= 60; }
  function idOk(s) { return typeof s === 'string' && /^[a-z0-9-]{1,80}$/.test(s); }
  function countsValid(counts) {
    var i, v, total = 0;
    if (!Xake.EditorTools.countsValid(counts)) { return false; }
    for (i = 0; i < TYPES.length; i++) { v = counts[TYPES[i]]; total += v; }
    return total <= 64 && counts.p <= 48;
  }
  function countsCopy(source) { return Xake.EditorTools.copyCounts(source); }
  function matchingCounts(a, b) {
    var i;
    for (i = 0; i < TYPES.length; i++) { if (a[TYPES[i]] !== b[TYPES[i]]) { return false; } }
    return true;
  }
  function scenarioValid(s) {
    if (!s || !idOk(s.id) || !nameOk(s.name) || typeof s.initialFen !== 'string' || s.initialFen.length > 160 ||
      !countsValid(s.whiteArmySnapshot) || !countsValid(s.blackArmySnapshot)) { return false; }
    var board = Xake.EditorTools.boardFromFen(s.initialFen);
    if (!board) { return false; }
    var wc = Xake.EditorTools.pieceCounts(board, 'w');
    var bc = Xake.EditorTools.pieceCounts(board, 'b');
    if (!matchingCounts(wc, s.whiteArmySnapshot) || !matchingCounts(bc, s.blackArmySnapshot)) { return false; }
    try {
      var e = new Xake.Editor();
      return !!(e.loadScenario(s) && e.validate().state !== 'error');
    } catch (error) { return false; }
  }
  function armyValid(a) {
    return !!(a && idOk(a.id) && nameOk(a.name) && countsValid(a.pieces));
  }
  function exportData() {
    var a = Xake.Storage.armies(), s = Xake.Storage.scenarios(), i;
    for (i = 0; i < a.length; i++) { if (!armyValid(a[i])) { throw Error('invalid-army'); } }
    for (i = 0; i < s.length; i++) { if (!scenarioValid(s[i])) { throw Error('invalid-scenario'); } }
    var data = { format: FORMAT, schemaVersion: 1, exportedAt: new Date().toISOString(), armies: a, scenarios: s };
    return JSON.stringify(data, null, 2);
  }
  function has(items, id) {
    var i;
    for (i = 0; i < items.length; i++) { if (items[i].id === id) { return true; } }
    return false;
  }
  function uniqueId(prefix, target, counter) {
    var id, suffix = counter;
    do { id = prefix + '-import-' + Date.now() + '-' + suffix++; } while (has(target, id));
    return id;
  }
  function importData(jsonText) {
    if (typeof jsonText !== 'string' || jsonText.length > 524288) { throw Error('size'); }
    var payload;
    try { payload = JSON.parse(jsonText); } catch (e) { throw Error('json'); }
    if (!payload || payload.format !== FORMAT || payload.schemaVersion !== 1 || !isArray(payload.armies) || !isArray(payload.scenarios)) { throw Error('format'); }
    if (payload.armies.length > 250 || payload.scenarios.length > 250) { throw Error('size'); }
    var i, a, s, now = new Date().toISOString();
    var existingArmies = Xake.Storage.armies(), existingScenarios = Xake.Storage.scenarios();
    var nextArmies = existingArmies.slice(), nextScenarios = existingScenarios.slice();
    var remap = Object.create(null), inputIds = Object.create(null), newArmy, newScenario;
    /* Validar el paquete completo antes de escribir una sola clave. */
    for (i = 0; i < payload.armies.length; i++) {
      a = payload.armies[i];
      if (!armyValid(a) || inputIds[a.id]) { throw Error('army'); }
      inputIds[a.id] = true;
      newArmy = { id: uniqueId('army', nextArmies, i + 1), name: a.name,
        pieces: countsCopy(a.pieces), createdAt: now, updatedAt: now };
      remap[a.id] = newArmy.id;
      nextArmies.push(newArmy);
    }
    inputIds = Object.create(null);
    for (i = 0; i < payload.scenarios.length; i++) {
      s = payload.scenarios[i];
      if (!scenarioValid(s) || inputIds[s.id]) { throw Error('scenario'); }
      inputIds[s.id] = true;
      newScenario = {
        id: uniqueId('scenario', nextScenarios, i + 1), name: s.name,
        initialFen: s.initialFen, whiteArmySnapshot: countsCopy(s.whiteArmySnapshot),
        blackArmySnapshot: countsCopy(s.blackArmySnapshot), createdAt: now, updatedAt: now
      };
      if (idOk(s.whiteArmyId) && remap[s.whiteArmyId]) { newScenario.whiteArmyId = remap[s.whiteArmyId]; }
      if (idOk(s.blackArmyId) && remap[s.blackArmyId]) { newScenario.blackArmyId = remap[s.blackArmyId]; }
      nextScenarios.push(newScenario);
    }
    /* Una escritura por colección; ante errores se intenta restaurar ambas. */
    var oldArmies, oldScenarios;
    try {
      oldArmies = root.localStorage.getItem(ARMY_KEY);
      oldScenarios = root.localStorage.getItem(SCENARIO_KEY);
      root.localStorage.setItem(ARMY_KEY, JSON.stringify({ schemaVersion: 1, items: nextArmies }));
      root.localStorage.setItem(SCENARIO_KEY, JSON.stringify({ schemaVersion: 1, items: nextScenarios }));
    } catch (e2) {
      try {
        if (oldArmies === null) { root.localStorage.removeItem(ARMY_KEY); }
        else if (oldArmies !== undefined) { root.localStorage.setItem(ARMY_KEY, oldArmies); }
        if (oldScenarios === null) { root.localStorage.removeItem(SCENARIO_KEY); }
        else if (oldScenarios !== undefined) { root.localStorage.setItem(SCENARIO_KEY, oldScenarios); }
      } catch (rollbackError) { /* Mostrar fallo; nunca anunciar éxito. */ }
      throw Error('storage');
    }
    return { armies: payload.armies.length, scenarios: payload.scenarios.length };
  }
  function el(tag, className, key, fallback) {
    var n = document.createElement(tag);
    if (className) { n.className = className; }
    if (key) { n.setAttribute('data-i18n', key); }
    if (fallback) { n.textContent = fallback; }
    return n;
  }
  function btn(key, fallback, action) {
    var b = el('button', 'btn', key, fallback); b.type = 'button'; b.onclick = action; return b;
  }
  function message(panel, value, bad) {
    var n = panel.querySelector('.xake-backup-message');
    n.textContent = value; n.className = 'xake-backup-message' + (bad ? ' is-error' : '');
  }
  function initUI() {
    var parent = document.getElementById('screen-library');
    if (!parent) { return; }
    var section = el('div', 'panel xake-backup-panel');
    section.appendChild(el('h2', '', 'backup.title', 'Copia de seguridad'));
    section.appendChild(el('p', '', 'backup.description', 'Guarda o recupera tus ejércitos y tableros mediante texto JSON.'));
    var exportArea = el('textarea'); exportArea.readOnly = true;
    exportArea.id = 'xake-backup-export';
    exportArea.setAttribute('aria-label', 'Copia de seguridad JSON');
    exportArea.style.display = 'none';
    section.appendChild(btn('backup.export', 'Preparar copia JSON', function () {
      try {
        exportArea.value = exportData(); exportArea.style.display = 'block';
        exportArea.focus(); exportArea.select();
        message(section, t('backup.copyInstruction'), false);
      } catch (e) { message(section, t('backup.exportFailed'), true); }
    }));
    section.appendChild(exportArea);
    section.appendChild(el('label', '', 'backup.importLabel', 'Pega aquí una copia JSON para importarla:'));
    var importArea = el('textarea'); importArea.id = 'xake-backup-import';
    importArea.setAttribute('aria-label', 'Texto JSON para importar');
    section.appendChild(importArea);
    section.appendChild(btn('backup.import', 'Importar copia', function () {
      if (!root.confirm(t('backup.importConfirm'))) { return; }
      try {
        var result = importData(importArea.value);
        message(section, t('backup.imported', { armies: result.armies, scenarios: result.scenarios }), false);
        var open = document.getElementById('btn-open-library');
        if (open) { open.click(); }
      } catch (e) {
        var code = /^(json|format|size|army|scenario|storage)$/.test(e.message) ? e.message : 'format';
        message(section, t('backup.error.' + code), true);
      }
    }));
    section.appendChild(el('p', 'xake-backup-message'));
    parent.appendChild(section);
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initUI); }
  else { initUI(); }
  Xake.Backup = { exportData: exportData, importData: importData, scenarioValid: scenarioValid, armyValid: armyValid };
}(window));
