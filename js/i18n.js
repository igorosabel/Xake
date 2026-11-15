/* global window, XMLHttpRequest */
(function (root) {
  'use strict';
  var Xake = root.Xake = root.Xake || {};
  var base = {
    'app.subtitle': 'Ajedrez a tu manera', 'menu.title': '¿Jugamos al ajedrez?',
    'menu.intro': 'Dos jugadores en el mismo dispositivo o contra la máquina.',
    'menu.new': 'Dos jugadores', 'menu.continue': 'Continuar partida',
    'menu.future': 'Próximamente: ejércitos y tableros personalizados.',
    'settings.language': 'Idioma', 'game.title': 'Partida clásica',
    'game.menu': 'Menú', 'game.controls': 'Controles', 'game.undo': 'Deshacer jugada',
    'game.flip': 'Girar tablero', 'game.restart': 'Reiniciar partida',
    'game.saveExit': 'Guardar y salir', 'game.moves': 'Últimos movimientos',
    'game.instruction': 'Toca una pieza y después una casilla marcada.',
    'game.promote': '¿En qué pieza se convierte el peón?', 'common.cancel': 'Cancelar',
    'game.whiteTurn': 'Turno de las blancas', 'game.blackTurn': 'Turno de las negras',
    'game.whiteCheck': '¡Jaque a las blancas!', 'game.blackCheck': '¡Jaque a las negras!',
    'game.whiteWins': '¡Jaque mate! Ganan las blancas.',
    'game.blackWins': '¡Jaque mate! Ganan las negras.',
    'game.stalemate': 'Tablas por ahogado.', 'game.insufficient': 'Tablas por material insuficiente.',
    'game.repetition': 'Tablas por repetición de posición.',
    'game.fiftyMoves': 'Tablas por 50 movimientos sin capturas ni avances de peón.',
    'game.draw': 'Partida terminada en tablas.', 'game.noMoves': 'Aún no hay movimientos.',
    'game.restartConfirm': '¿Reiniciar la partida actual?',
    'game.newConfirm': '¿Empezar una nueva partida? Se sustituirá la partida guardada.',
    'common.queen': 'Reina', 'common.rook': 'Torre', 'common.bishop': 'Alfil',
    'common.knight': 'Caballo', 'common.king': 'Rey', 'common.pawn': 'Peón',
    'common.empty': 'vacía', 'common.white': 'blanco', 'common.black': 'negro',
    'game.square': 'Casilla {square}: {piece}', 'storage.failed': 'No se pudo guardar en este dispositivo.',
    'storage.badGame': 'La partida guardada no es válida y no se ha cargado.',
    'ai.menu': 'Contra la máquina',
    'ai.setupTitle': 'Nueva partida contra la máquina',
    'ai.difficulty': 'Dificultad',
    'ai.level1': 'Principiante',
    'ai.level2': 'Fácil',
    'ai.level3': 'Normal',
    'ai.level4': 'Difícil',
    'ai.yourColor': 'Jugar con',
    'ai.white': 'Blancas (empiezas tú)',
    'ai.black': 'Negras (empieza la máquina)',
    'ai.start': 'Empezar partida',
    'ai.gameTitle': 'Contra la máquina',
    'ai.thinking': 'La máquina está pensando…',
    'ai.failed': 'La máquina no ha podido completar la jugada.',
    'app.unavailable': 'No se ha podido iniciar el motor de ajedrez.'
  };
  var spanish = base;
  var translated = {};
  var language = 'es';
  function request(url, callback) {
    var xhr = new XMLHttpRequest(), settled = false;
    function done(value) { if (!settled) { settled = true; callback(value); } }
    try {
      xhr.open('GET', url, true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) { return; }
        if ((xhr.status >= 200 && xhr.status < 300) || (xhr.status === 0 && xhr.responseText)) {
          try { done(JSON.parse(xhr.responseText)); return; } catch (e) { /* fallback */ }
        }
        done(null);
      };
      xhr.onerror = function () { done(null); };
      xhr.send(null);
    } catch (e) { done(null); }
  }
  function validObject(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
  function init(code, callback) {
    language = code === 'eu' ? 'eu' : 'es';
    request('i18n/es.json', function (es) {
      if (validObject(es)) { spanish = es; }
      if (language === 'es') { translated = {}; callback(); return; }
      request('i18n/eu.json', function (eu) { translated = validObject(eu) ? eu : {}; callback(); });
    });
  }
  function change(code, callback) {
    language = code === 'eu' ? 'eu' : 'es';
    if (language === 'es') { translated = {}; callback(); return; }
    request('i18n/eu.json', function (eu) { translated = validObject(eu) ? eu : {}; callback(); });
  }
  function t(key, values) {
    var template = translated[key] || spanish[key] || base[key] || key;
    if (typeof template !== 'string') { template = base[key] || key; }
    return template.replace(/\{([a-zA-Z]+)\}/g, function (m, name) {
      return values && values[name] !== undefined ? String(values[name]) : m;
    });
  }
  Xake.I18n = { init: init, change: change, t: t, language: function () { return language; } };
}(window));
