/* global window */
(function (root) {
  'use strict';
  var Xake = root.Xake = root.Xake || {};
  var KEY_GAME = 'xake:v1:games';
  var KEY_PREFS = 'xake:v1:preferences';
  var KEY_ARMIES = 'xake:v1:armies';
  var KEY_SCENARIOS = 'xake:v1:scenarios';
  function read(key) {
    try { var s = root.localStorage.getItem(key); return s ? JSON.parse(s) : null; }
    catch (e) { return null; }
  }
  function write(key, data) {
    try { root.localStorage.setItem(key, JSON.stringify(data)); return true; }
    catch (e) { return false; }
  }
  function savedGame() {
    var data = read(KEY_GAME);
    if (!data || data.schemaVersion !== 1 || !data.current ||
      (data.current.mode !== 'local-two-players' && data.current.mode !== 'vs-computer') ||
      typeof data.current.initialFen !== 'string' || !Array.isArray(data.current.moves)) { return null; }
    return data.current;
  }
  function saveGame(game) {
    return write(KEY_GAME, { schemaVersion: 1, current: game });
  }
  function clearGame() {
    try { root.localStorage.removeItem(KEY_GAME); return true; }
    catch (e) { return false; }
  }
  function preferences() {
    var data = read(KEY_PREFS);
    return data && data.schemaVersion === 1 && data.data && typeof data.data === 'object' ? data.data : {};
  }
  function savePreferences(prefs) { return write(KEY_PREFS, { schemaVersion: 1, data: prefs }); }
  function collection(key) {
    var v = read(key);
    return v && v.schemaVersion === 1 && Array.isArray(v.items) ? v.items : [];
  }
  function safeId(id) { return typeof id === 'string' && /^[a-z0-9-]{1,80}$/.test(id); }
  function safeName(name) { return typeof name === 'string' && name.replace(/^\s+|\s+$/g, '').length > 0 && name.length <= 60; }
  function armies() {
    var raw = collection(KEY_ARMIES), result = [], i, a, p, j, ok, names = ['k', 'q', 'r', 'b', 'n', 'p'];
    for (i = 0; i < raw.length; i++) {
      a = raw[i];
      if (!a || !safeId(a.id) || !safeName(a.name) || !a.pieces || a.pieces.k !== 1) { continue; }
      ok = true;
      for (j = 0; j < names.length; j++) {
        p = a.pieces[names[j]];
        if (typeof p !== 'number' || Math.floor(p) !== p || p < 0 || p > 63) { ok = false; break; }
      }
      if (ok) { result.push(a); }
    }
    return result;
  }
  function scenarios() {
    var raw = collection(KEY_SCENARIOS), result = [], i, s;
    for (i = 0; i < raw.length; i++) {
      s = raw[i];
      if (s && safeId(s.id) && safeName(s.name) && typeof s.initialFen === 'string' &&
        s.initialFen.length < 160 && s.whiteArmySnapshot && s.blackArmySnapshot) { result.push(s); }
    }
    return result;
  }
  function upsert(key, data, validate, getter) {
    if (!data || !safeId(data.id) || !safeName(data.name) || !validate(data)) { return false; }
    var items = getter(), out = [], i, replaced = false;
    for (i = 0; i < items.length; i++) {
      if (items[i].id === data.id) { if (!replaced) { out.push(data); replaced = true; } }
      else { out.push(items[i]); }
    }
    if (!replaced) { out.push(data); }
    return write(key, { schemaVersion: 1, items: out });
  }
  function remove(key, id, getter) {
    var items = getter(), out = [], i;
    for (i = 0; i < items.length; i++) { if (items[i].id !== id) { out.push(items[i]); } }
    return write(key, { schemaVersion: 1, items: out });
  }
  function saveArmy(a) {
    return upsert(KEY_ARMIES, a, function (v) {
      return Xake.EditorTools && Xake.EditorTools.countsValid(v.pieces) &&
        Xake.EditorTools.sum(v.pieces) <= 64;
    }, armies);
  }
  function saveScenario(s) {
    return upsert(KEY_SCENARIOS, s, function (v) {
      return Xake.EditorTools && Xake.EditorTools.countsValid(v.whiteArmySnapshot) &&
        Xake.EditorTools.countsValid(v.blackArmySnapshot);
    }, scenarios);
  }
  function findById(items, id) {
    var i;
    for (i = 0; i < items.length; i++) { if (items[i].id === id) { return items[i]; } }
    return null;
  }
  Xake.Storage = {
    savedGame: savedGame, saveGame: saveGame, clearGame: clearGame,
    preferences: preferences, savePreferences: savePreferences,
    armies: armies, scenarios: scenarios, saveArmy: saveArmy, saveScenario: saveScenario,
    removeArmy: function (id) { return remove(KEY_ARMIES, id, armies); },
    removeScenario: function (id) { return remove(KEY_SCENARIOS, id, scenarios); },
    army: function (id) { return findById(armies(), id); },
    scenario: function (id) { return findById(scenarios(), id); }
  };
}(window));
