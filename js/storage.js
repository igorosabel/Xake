/* global window */
(function (root) {
  'use strict';
  var Xake = root.Xake = root.Xake || {};
  var KEY_GAME = 'xake:v1:games';
  var KEY_PREFS = 'xake:v1:preferences';
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
      data.current.mode !== 'local-two-players' ||
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
  Xake.Storage = {
    savedGame: savedGame, saveGame: saveGame, clearGame: clearGame,
    preferences: preferences, savePreferences: savePreferences
  };
}(window));
