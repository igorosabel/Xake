/* global window, document */
/* Xake Hito 8: biblioteca de partidas. Sin frameworks, JavaScript ES5. */
(function (root) {
  'use strict';
  var Xake = root.Xake = root.Xake || {};
  function byId(id) { return document.getElementById(id); }
  function t(key, values) { return Xake.I18n.t(key, values); }
  function make(tag, text, className) {
    var e = document.createElement(tag);
    if (typeof text === 'string') { e.textContent = text; }
    if (className) { e.className = className; }
    return e;
  }
  function button(text, action, className) {
    var e = make('button', text, className || 'btn');
    e.type = 'button'; e.onclick = action; return e;
  }
  function message(key, bad) {
    var node = byId('saved-games-message');
    node.textContent = key ? t(key) : '';
    node.className = bad ? 'saved-games-error' : '';
  }
  function formatDate(value) {
    var d = new Date(value);
    if (!value || isNaN(d.getTime())) { return ''; }
    try { return d.toLocaleString(Xake.I18n.language() === 'eu' ? 'eu-ES' : 'es-ES'); }
    catch (e) { return d.toLocaleString(); }
  }
  function safeName(name) {
    return typeof name === 'string' && name.replace(/^\s+|\s+$/g, '').length > 0 && name.replace(/^\s+|\s+$/g, '').length <= 60;
  }
  function syncContinue() {
    var node = byId('btn-continue');
    if (node) { node.className = 'btn btn-large' + (Xake.Storage.savedGame() ? '' : ' is-hidden'); }
  }
  function updateCurrentName() {
    var box = byId('game-saved-name'), item = Xake.Storage.currentGameRecord();
    if (box) { box.textContent = item ? t('saved.current', { name: item.name }) : ''; }
  }
  function rename(item) {
    var value = root.prompt(t('saved.renamePrompt'), item.name);
    if (value === null) { return; }
    if (!safeName(value)) { message('saved.nameInvalid', true); return; }
    if (!Xake.Storage.renameGame(item.id, value)) { message('saved.failed', true); return; }
    render(); updateCurrentName(); message('saved.renamed', false);
  }
  function renameActive() {
    var item = Xake.Storage.currentGameRecord(), value;
    if (!item) { return; }
    value = root.prompt(t('saved.renamePrompt'), item.name);
    if (value === null) { return; }
    if (!safeName(value)) { root.alert(t('saved.nameInvalid')); return; }
    if (!Xake.Storage.renameGame(item.id, value)) { root.alert(t('saved.failed')); return; }
    updateCurrentName();
  }
  function remove(item) {
    if (!root.confirm(t('saved.deleteConfirm', { name: item.name }))) { return; }
    if (!Xake.Storage.deleteGame(item.id)) { message('saved.failed', true); return; }
    render(); syncContinue(); updateCurrentName(); message('saved.deleted', false);
  }
  function resume(item) {
    // No seleccionar una partida manipulada/corrupta hasta que su historial pase
    // por el validador completo del motor; se conserva para poder revisarla.
    var check = new Xake.Game();
    if (!check.restore(item.game)) { message('saved.corrupt', true); return; }
    if (!Xake.Storage.activateGame(item.id)) { message('saved.failed', true); return; }
    syncContinue();
    byId('btn-continue').click();
  }
  function render() {
    var box = byId('saved-games-list');
    if (!box) { return; }
    var items = Xake.Storage.gameRecords(), current = Xake.Storage.currentGameRecord();
    var i, item, row, header, subtitle, actions, meta, mode, status, date;
    box.innerHTML = '';
    if (!items.length) { box.appendChild(make('p', t('saved.empty'), 'panel')); return; }
    for (i = 0; i < items.length; i++) {
      item = items[i];
      row = make('div', null, 'panel saved-game-item');
      header = make('div', null, 'saved-game-heading');
      header.appendChild(make('h2', item.name));
      if (current && current.id === item.id) { header.appendChild(make('span', t('saved.active'), 'saved-game-current')); }
      row.appendChild(header);
      mode = t(item.game.mode === 'vs-computer' ? 'saved.modeAI' : 'saved.modeTwo');
      if (item.game.mode === 'vs-computer' && item.game.difficulty) {
        mode += ' · ' + t('ai.level' + item.game.difficulty);
      }
      if (item.game.scenarioName) { mode += ' · ' + item.game.scenarioName; }
      status = t(item.finished ? 'saved.finished' : 'saved.inProgress');
      subtitle = make('p', mode + ' · ' + status, 'saved-game-description');
      row.appendChild(subtitle);
      date = formatDate(item.updatedAt);
      meta = t('saved.moves', { count: item.game.moves.length });
      if (date) { meta += ' · ' + t('saved.updated', { date: date }); }
      row.appendChild(make('p', meta, 'saved-game-meta'));
      actions = make('div', null, 'saved-game-actions');
      (function (entry) {
        actions.appendChild(button(t('saved.continue'), function () { resume(entry); }, 'btn btn-primary'));
        actions.appendChild(button(t('saved.rename'), function () { rename(entry); }, 'btn'));
        actions.appendChild(button(t('saved.delete'), function () { remove(entry); }, 'btn'));
      }(item));
      row.appendChild(actions);
      box.appendChild(row);
    }
  }
  function open() {
    render(); message('', false);
    Xake.navigate('screen-saved-games');
  }
  function languageChanged() {
    if (byId('screen-saved-games') && byId('screen-saved-games').className.indexOf('is-hidden') < 0) { render(); }
    updateCurrentName();
  }
  function init() {
    if (!Xake.Storage || !byId('btn-open-saved-games')) { return; }
    // Se ejecuta también la migración de la partida antigua antes de renderizar.
    Xake.Storage.gameRecords();
    byId('btn-open-saved-games').onclick = open;
    byId('btn-saved-games-back').onclick = function () { Xake.navigate('screen-menu'); syncContinue(); };
    byId('btn-game-rename').onclick = renameActive;
    syncContinue(); updateCurrentName();
  }
  Xake.SavedGamesUI = {
    open: open, render: render, languageChanged: languageChanged,
    updateCurrentName: updateCurrentName
  };
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
}(window));
