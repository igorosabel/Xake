/* Hito 8 - partidas múltiples y migración segura; motor real y sin dependencias. */
'use strict';
var assert = require('assert'), fs = require('fs'), vm = require('vm'), path = require('path');
var rootDir = path.resolve(__dirname, '..'), source = {};
var V1 = 'xake:v1:games', V2 = 'xake:v2:games', blocked = null, count = 0;
var localStorage = {
  getItem: function (k) { return source.hasOwnProperty(k) ? source[k] : null; },
  setItem: function (k, v) { if (blocked === k) { throw Error('quota'); } source[k] = String(v); },
  removeItem: function (k) { if (blocked === k) { throw Error('quota'); } delete source[k]; }
};
var context = { Date: Date, Math: Math, Object: Object, JSON: JSON, Array: Array,
  localStorage: localStorage, isFinite: isFinite };
context.window = context;
vm.createContext(context);
function load(file) { vm.runInContext(fs.readFileSync(path.join(rootDir, file), 'utf8'), context, {filename:file}); }
load('lib/chess.js');
context.Xake = { I18n: { t: function (k) { return k; } } };
load('js/game.js');
load('js/storage.js');
var S = context.Xake.Storage, Game = context.Xake.Game;
function test(title, action) { action(); count++; console.log('✓ ' + title); }
function reset() { source = {}; blocked = null; }
function data() { return JSON.parse(source[V2]); }
function original() { return new Game().snapshot(); }
function moveSnapshot(from, to) {
  var g = new Game();
  assert(g.move(from || 'e2', to || 'e4'));
  return g.snapshot();
}
function createTwo() {
  reset(); assert(S.saveGame(moveSnapshot()));
  var first = S.currentGameRecord().id;
  S.beginGame(); assert(S.saveGame(original()));
  return [first, S.currentGameRecord().id];
}
test('Sin guardados crea una colección vacía de versión 2', function () {
  reset(); assert.strictEqual(S.savedGame(), null);
  assert.equal(S.gameRecords().length, 0); assert.equal(data().schemaVersion, 2);
});
test('Migración automática copia la partida antigua sin borrar el original', function () {
  reset(); var snap = moveSnapshot();
  source[V1] = JSON.stringify({schemaVersion:1,current:snap});
  var old = source[V1];
  assert.equal(S.savedGame().moves.length, 1);
  assert.equal(S.gameRecords().length, 1);
  assert.strictEqual(source[V1], old);
  assert(data().activeId);
});
test('Migrar dos veces no duplica una partida aunque cambie la clave antigua', function () {
  var id = S.currentGameRecord().id;
  source[V1] = JSON.stringify({schemaVersion:1,current:original()});
  assert.equal(S.gameRecords().length, 1);
  assert.equal(S.currentGameRecord().id, id);
});
test('Crear partida nueva añade una segunda sin sustituir la original', function () {
  var old = S.savedGame().moves.length;
  S.beginGame(); assert(S.saveGame(original()));
  assert.equal(S.gameRecords().length, 2);
  assert.equal(S.savedGame().moves.length, 0);
  assert.equal(S.gameRecords().filter(function (x) { return x.game.moves.length === old; }).length, 1);
});
test('Guardado automático actualiza la misma partida, no crea duplicados', function () {
  var id = S.currentGameRecord().id;
  assert(S.saveGame(moveSnapshot()));
  assert.equal(S.gameRecords().length, 2);
  assert.equal(S.currentGameRecord().id, id);
  assert.equal(S.savedGame().moves.length, 1);
});
test('Alternar partidas conserva dos historiales independientes', function () {
  var ids = createTwo();
  assert(S.activateGame(ids[0]));
  assert.equal(S.savedGame().moves.length, 1);
  var second = new Game(); assert(second.restore(S.savedGame()));
  assert(second.move('e7','e5'));
  assert(S.saveGame(second.snapshot()));
  assert(S.activateGame(ids[1]));
  assert.equal(S.savedGame().moves.length, 0);
  assert(S.activateGame(ids[0]));
  assert.equal(S.savedGame().moves.length, 2);
});
test('Se puede renombrar una partida con espacios exteriores', function () {
  var id = S.currentGameRecord().id;
  assert(S.renameGame(id,'  Partida de Eneko  '));
  assert.equal(S.currentGameRecord().name, 'Partida de Eneko');
});
test('Nombres vacíos o mayores de 60 caracteres no alteran los datos', function () {
  var id = S.currentGameRecord().id, old = source[V2];
  assert(!S.renameGame(id,' ')); assert(!S.renameGame(id,new Array(62).join('x')));
  assert.strictEqual(source[V2], old);
});
test('Eliminar una partida inactiva conserva la activa', function () {
  var ids = createTwo();
  assert(S.deleteGame(ids[0]));
  assert.equal(S.gameRecords().length, 1);
  assert.equal(S.currentGameRecord().id, ids[1]);
});
test('Eliminar la activa selecciona otra conservada', function () {
  var ids = createTwo();
  assert(S.deleteGame(ids[1]));
  assert.equal(S.currentGameRecord().id, ids[0]);
});
test('Eliminar la última deja la biblioteca vacía sin reimportar la clave antigua', function () {
  var id = S.currentGameRecord().id;
  source[V1] = JSON.stringify({schemaVersion:1,current:moveSnapshot()});
  assert(S.deleteGame(id)); assert.equal(S.gameRecords().length,0);
  assert.strictEqual(S.savedGame(),null);
  assert(source[V1]);
});
test('La siguiente partida después de borrar todo se guarda normalmente', function () {
  S.beginGame(); assert(S.saveGame(original())); assert.equal(S.gameRecords().length,1);
});
test('El estado finalizado se mantiene al actualizar solo las apariencias', function () {
  assert(S.saveGame(original(), true));
  var id = S.currentGameRecord().id;
  assert(S.currentGameRecord().finished);
  assert(S.saveGame(original()));
  assert(S.currentGameRecord().finished);
  assert.equal(S.currentGameRecord().id,id);
});
test('El estado de partida finalizada puede volver a en curso al deshacer', function () {
  assert(S.saveGame(original(), false));
  assert.strictEqual(S.currentGameRecord().finished, false);
});
test('Partida personalizada conserva escenario y FEN aunque se elimine el escenario', function () {
  reset(); var fen='4k3/8/8/8/4q3/8/4R3/K7 w - - 0 1';
  var g=new Game({initialFen:fen,scenarioId:'scenario-123',scenarioName:'Reto familiar'});
  assert(S.saveGame(g.snapshot()));
  var saved=S.savedGame(), loaded=new Game();
  assert(loaded.restore(saved));assert.equal(saved.initialFen,fen);
  assert.equal(saved.scenarioName,'Reto familiar');
});
test('Se preservan las apariencias y modalidad de cada partida independiente',function(){
  var g=new Game({mode:'vs-computer',difficulty:3,humanColor:'b'});
  var snap=g.snapshot();snap.whiteAppearance='medallas';snap.blackAppearance='emblemas';
  S.beginGame();assert(S.saveGame(snap));
  assert.equal(S.savedGame().humanColor,'b');assert.equal(S.savedGame().difficulty,3);
  assert.equal(S.savedGame().whiteAppearance,'medallas');
});
test('No se guarda un snapshot estructuralmente incorrecto',function(){
  var before=source[V2];
  assert(!S.saveGame({mode:'unknown',initialFen:'test',moves:[]}));
  assert.strictEqual(source[V2],before);
});
test('JSON corrupto en v2 se conserva sin sobrescribir', function () {
  reset(); source[V2] = '{mal-formado';
  assert.equal(S.savedGame(),null);
  assert(!S.saveGame(original()));
  assert.equal(source[V2],'{mal-formado');
});
test('Fallo de cuota durante migración conserva intacta la partida original',function(){
  reset();var snap=moveSnapshot();source[V1]=JSON.stringify({schemaVersion:1,current:snap});
  blocked=V2;assert.strictEqual(S.savedGame(),null);assert(!S.saveGame(original()));
  assert.equal(JSON.parse(source[V1]).current.moves.length,1);
  blocked=null;assert.equal(S.savedGame().moves.length,1);
});
test('Fallo de cuota tras comenzar otra partida NO pisa la activa anterior',function(){
  reset(); assert(S.saveGame(moveSnapshot()));var first=S.currentGameRecord().id;
  var old=source[V2];S.beginGame(); blocked=V2;
  assert(!S.saveGame(original())); assert.strictEqual(source[V2],old);
  blocked=null;assert(S.saveGame(original()));
  assert.equal(S.gameRecords().length,2);
  assert.notEqual(S.currentGameRecord().id,first);
  assert(S.activateGame(first));assert.equal(S.savedGame().moves.length,1);
});
test('Fallo de cuota al renombrar o eliminar no modifica la colección',function(){
  var id=S.currentGameRecord().id, old=source[V2];blocked=V2;
  assert(!S.renameGame(id,'Otro'));assert(!S.deleteGame(id));
  assert.strictEqual(source[V2],old);blocked=null;
});
test('Cambio de partida sin poder persistir no altera cuál está activa',function(){
  var ids=createTwo(), old=source[V2];blocked=V2;
  assert(!S.activateGame(ids[0]));assert.strictEqual(source[V2],old);
  blocked=null;assert.equal(S.currentGameRecord().id,ids[1]);
});
test('Nombres predeterminados se distinguen y nunca superan 60 caracteres',function(){
  reset(); var snap=original();snap.scenarioName=new Array(90).join('a');
  assert(S.saveGame(snap));S.beginGame();assert(S.saveGame(snap));
  var names=S.gameRecords().map(function(x){return x.name;});
  assert(names[0].length<=60);assert(names[1].length<=60);assert.notEqual(names[0],names[1]);
});
test('Colecciones de ejércitos, tableros y preferencias no se alteran',function(){
  reset();source['xake:v1:preferences']='{"schemaVersion":1,"data":{"language":"eu"}}';
  var before=source['xake:v1:preferences'];S.beginGame();assert(S.saveGame(original()));
  assert.strictEqual(source['xake:v1:preferences'],before);
  assert.equal(S.preferences().language,'eu');
});
console.log('Hito 8: ' + count + ' pruebas superadas.');
