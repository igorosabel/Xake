/* global window */
(function (root) {
  'use strict';
  var Xake = root.Xake = root.Xake || {};
  var KEY_GAME = 'xake:v1:games'; // Copia histórica: NO se borra durante la migración.
  var KEY_GAMES_V2 = 'xake:v2:games';
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
  /* Hito 8: partidas múltiples. La clave antigua se conserva como copia.
   * Las escrituras son atómicas por colección: no se guarda un estado parcial.
   * newGamePending evita que una cuota llena sobrescriba la partida anterior.
   */
  var newGamePending = false;
  function validSnapshot(snapshot) {
    return !!(snapshot && (snapshot.mode === 'local-two-players' || snapshot.mode === 'vs-computer') &&
      typeof snapshot.initialFen === 'string' && Array.isArray(snapshot.moves) && snapshot.moves.length <= 10000);
  }
  function originalGame() {
    var old = read(KEY_GAME);
    return old && old.schemaVersion === 1 && validSnapshot(old.current) ? old.current : null;
  }
  function defaultGameName(snapshot, items) {
    var defaultKey = snapshot.mode === 'vs-computer' ? 'saved.defaultAI' : 'saved.defaultClassic';
    var base = snapshot.scenarioName;
    var translated = Xake.I18n && Xake.I18n.t ? Xake.I18n.t(defaultKey) : defaultKey;
    var index = 1, i, taken = true, candidate;
    if (typeof base !== 'string' || !base) {
      base = translated !== defaultKey ? translated :
        (snapshot.mode === 'vs-computer' ? 'Contra la máquina' : 'Partida clásica');
    }
    base = base.slice(0, 48);
    while (taken) {
      candidate = (base + ' ' + index).slice(0, 60);
      taken = false;
      for (i = 0; i < items.length; i++) { if (items[i].name === candidate) { taken = true; break; } }
      if (taken) { index++; }
    }
    return candidate;
  }
  function uniqueGameId(items) {
    var id, found, i;
    do {
      id = 'game-' + Date.now() + '-' + Math.floor(Math.random() * 1000000000);
      found = false;
      for (i = 0; i < items.length; i++) { if (items[i].id === id) { found = true; break; } }
    } while (found);
    return id;
  }
  function gameCollection() {
    var raw, data, old, date, item;
    try { raw = root.localStorage.getItem(KEY_GAMES_V2); }
    catch (e) { return null; }
    if (raw !== null) {
      try { data = JSON.parse(raw); }
      catch (e2) { return null; }
      if (!data || data.schemaVersion !== 2 || !Array.isArray(data.items) ||
          (data.activeId !== null && typeof data.activeId !== 'string')) { return null; }
      var i, entry, seen = {};
      for (i = 0; i < data.items.length; i++) {
        entry = data.items[i];
        if (!entry || !safeId(entry.id) || seen[entry.id] || !safeName(entry.name) ||
            !validSnapshot(entry.game) || typeof entry.createdAt !== 'string' ||
            typeof entry.updatedAt !== 'string') { return null; }
        seen[entry.id] = true;
      }
      if (data.activeId !== null && !seen[data.activeId]) { return null; }
      return data;
    }
    old = originalGame();
    data = { schemaVersion: 2, activeId: null, items: [] };
    if (old) {
      date = new Date().toISOString();
      item = { id: uniqueGameId([]), name: defaultGameName(old, []),
        createdAt: date, updatedAt: date, finished: false, game: old };
      data.items.push(item);
      data.activeId = item.id;
    }
    // No sustituir jamás la partida única antigua; solo se copia al formato v2.
    return write(KEY_GAMES_V2, data) ? data : null;
  }
  function findGame(data, id) {
    var i;
    if (!data) { return null; }
    for (i = 0; i < data.items.length; i++) {
      if (data.items[i] && data.items[i].id === id) { return data.items[i]; }
    }
    return null;
  }
  function currentGameRecord() {
    var data = gameCollection();
    return data && !newGamePending ? findGame(data, data.activeId) : null;
  }
  function savedGame() {
    var item = currentGameRecord();
    return item && validSnapshot(item.game) ? item.game : null;
  }
  function gameRecords() {
    var data = gameCollection(), items = data ? data.items.slice() : [];
    return items.sort(function (a, b) {
      var aa = a.updatedAt || '', bb = b.updatedAt || '';
      return aa < bb ? 1 : aa > bb ? -1 : 0;
    });
  }
  function beginGame() {
    newGamePending = true;
  }
  function saveGame(snapshot, finished) {
    if (!validSnapshot(snapshot)) { return false; }
    var data = gameCollection(), item, now;
    if (!data) { return false; }
    now = new Date().toISOString();
    item = newGamePending ? null : findGame(data, data.activeId);
    if (!item) {
      item = { id: uniqueGameId(data.items), name: defaultGameName(snapshot, data.items),
        createdAt: now, updatedAt: now, finished: !!finished, game: snapshot };
      data.items.push(item);
      data.activeId = item.id;
    } else {
      item.game = snapshot;
      item.updatedAt = now;
      if (typeof finished === 'boolean') { item.finished = finished; }
    }
    if (!write(KEY_GAMES_V2, data)) { return false; }
    newGamePending = false;
    return true;
  }
  function activateGame(id) {
    var data = gameCollection(), item = findGame(data, id);
    if (!item || !validSnapshot(item.game)) { return false; }
    data.activeId = id;
    if (!write(KEY_GAMES_V2, data)) { return false; }
    newGamePending = false;
    return true;
  }
  function renameGame(id, name) {
    var data = gameCollection(), item = findGame(data, id), clean;
    if (typeof name !== 'string' || !item) { return false; }
    clean = name.replace(/^\s+|\s+$/g, '');
    if (!clean || clean.length > 60) { return false; }
    item.name = clean;
    return write(KEY_GAMES_V2, data);
  }
  function deleteGame(id) {
    var data = gameCollection(), i, next = [], found = false;
    if (!data) { return false; }
    for (i = 0; i < data.items.length; i++) {
      if (data.items[i].id === id) { found = true; }
      else { next.push(data.items[i]); }
    }
    if (!found) { return false; }
    data.items = next;
    if (data.activeId === id) {
      next.sort(function (a, b) { return (a.updatedAt || '') < (b.updatedAt || '') ? 1 : -1; });
      data.activeId = next.length ? next[0].id : null;
    }
    return write(KEY_GAMES_V2, data);
  }
  function clearGame() {
    var current = currentGameRecord();
    return current ? deleteGame(current.id) : true;
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
    gameRecords: gameRecords, currentGameRecord: currentGameRecord,
    beginGame: beginGame, activateGame: activateGame, renameGame: renameGame, deleteGame: deleteGame,
    preferences: preferences, savePreferences: savePreferences,
    armies: armies, scenarios: scenarios, saveArmy: saveArmy, saveScenario: saveScenario,
    removeArmy: function (id) { return remove(KEY_ARMIES, id, armies); },
    removeScenario: function (id) { return remove(KEY_SCENARIOS, id, scenarios); },
    army: function (id) { return findById(armies(), id); },
    scenario: function (id) { return findById(scenarios(), id); }
  };
}(window));
