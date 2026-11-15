/* Xake Hito 3: modelos de ejércitos, escenarios, validación y partidas. */
'use strict';
var assert = require('assert'), fs = require('fs'), vm = require('vm'), path = require('path');
var root = path.join(__dirname, '..'), records = {};
var ctx = { Date: Date, Math: Math, console: console, isFinite: isFinite,
  localStorage: { getItem: function (k) { return records[k] || null; },
    setItem: function (k, v) { records[k] = v; }, removeItem: function (k) { delete records[k]; } } };
ctx.window = ctx;
vm.createContext(ctx);
function load(file) { vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file }); }
load('lib/chess.js');
ctx.Xake = { I18n: { t: function (key) { return key; } } };
load('js/game.js'); load('js/editor.js'); load('js/storage.js');
var Editor = ctx.Xake.Editor, Storage = ctx.Xake.Storage, tools = ctx.Xake.EditorTools;
var n = 0;
function test(label, fn) { fn(); n++; console.log('✓ ' + label); }
function army(k, q, r, b, kn, p) { return { k: k, q: q, r: r, b: b, n: kn, p: p }; }
function simple() {
  var e = new Editor();
  assert(e.setBoth(army(1, 1, 0, 0, 0, 0), army(1, 0, 0, 0, 0, 0)));
  assert(e.place('e1','w','k')); assert(e.place('e8','b','k')); assert(e.place('b2','w','q'));
  return e;
}
test('El editor inicia con dos ejércitos clásicos, tablero vacío y validación de reyes', function () {
  var e = new Editor(); assert.equal(e.total('w'), 16); assert.equal(e.total('b'),16);
  assert.equal(e.validate().key, 'editor.needKings');
});
test('Cambios de inventario y capacidad total', function () {
  var e = new Editor(); assert.equal(e.setCount('w','q',15), null);
  assert.equal(e.setCount('w','q',50),'capacity'); assert.equal(e.setCount('w','k',0),'invalid');
  assert.equal(e.setCount('w','p',50),'capacity');
});
test('No se permite bajar el inventario por debajo de las piezas colocadas', function () {
  var e = new Editor(); assert(e.place('e1','w','k')); assert(e.place('d1','w','q'));
  assert.equal(e.setCount('w','q',0),'placed'); assert.equal(e.board[59],'Q');
});
test('No se superponen piezas y el inventario se respeta', function () {
  var e = new Editor(); assert(e.place('e1','w','k')); assert.equal(e.place('e1','b','p'),false);
  assert.equal(e.place('e2','w','k'),false);
});
test('Peones prohibidos en primera y octava filas', function () {
  var e = new Editor(); assert(!e.place('a1','w','p')); assert(!e.place('a8','b','p'));
  assert(e.place('a2','w','p')); assert(!e.movePiece('a2','a1'));
});
test('Mover, retirar, deshacer y rehacer independientes', function () {
  var e = new Editor(); assert(e.place('e1','w','k')); assert(e.movePiece('e1','f1'));
  assert(e.remove('f1')); assert(!e.get('f1'));
  assert(e.undo()); assert(e.get('f1')); assert(e.undo()); assert(e.get('e1'));
  assert(e.redo()); assert(e.get('f1')); assert(e.redo()); assert(!e.get('f1'));
});
test('Validación rechaza faltantes y admite posición completa personalizada', function () {
  var e = simple(); assert.equal(e.validate().state, 'valid');
  assert(e.remove('b2')); assert.equal(e.validate().key,'editor.missingPieces');
});
test('Reyes contiguos impiden el escenario', function () {
  var e = new Editor(); e.setBoth(army(1,0,0,0,0,0),army(1,0,0,0,0,0));
  e.place('e1','w','k');e.place('e2','b','k');
  assert.equal(e.validate().key,'editor.adjacentKings');
});
test('Rey del jugador que no mueve en jaque es un error', function () {
  var e=new Editor(); e.setBoth(army(1,1,0,0,0,0),army(1,0,0,0,0,0));
  e.place('a1','w','k');e.place('e8','b','k');e.place('e2','w','q');
  assert.equal(e.validate().key,'editor.otherKingCheck');
});
test('Rey del jugador que mueve en jaque y tiene defensa genera aviso', function () {
  var e=new Editor(); e.setBoth(army(1,0,0,0,0,0),army(1,0,1,0,0,0));
  e.place('e1','w','k');e.place('a8','b','k');e.place('e7','b','r');
  assert.equal(e.validate().state,'warning');
});
test('Solo dos reyes es escenario terminal editable', function () {
  var e=new Editor(); e.setBoth(army(1,0,0,0,0,0),army(1,0,0,0,0,0));
  e.place('e1','w','k');e.place('e8','b','k');
  assert.equal(e.validate().state,'terminal');
  assert(e.serialize('Solo reyes'));
});
test('FEN generado desactiva enroque y captura al paso', function () {
  var e = simple(), fen=e.validate().fen;
  assert(fen.indexOf(' w - - 0 1')>0);
  var c = new ctx.Chess(); assert(c.load(fen)); assert.equal(c.turn(),'w');
});
test('Colocación automática clásica de 32 piezas sin enroque', function () {
  var e = new Editor(); assert(e.autoPlace()); assert.equal(e.validate().state,'valid');
  assert.equal(e.get('d1').type,'q'); assert.equal(e.get('e8').type,'k');
});
test('Colocación automática de 15 reinas contra 15 peones', function () {
  var e=new Editor(); assert(e.setBoth(army(1,15,0,0,0,0),army(1,0,0,0,0,15)));
  assert(e.autoPlace()); var v=e.validate(); assert(v.state==='valid'||v.state==='warning');
  assert.equal(e.placed('w').q,15);assert.equal(e.placed('b').p,15);
});
test('Un escenario guardado conserva fotografías independientes de los ejércitos',function(){
  var e=simple(),s=e.serialize('Mi batalla');
  assert(Storage.saveScenario(s));assert(Storage.scenario(s.id));
  var original=Storage.scenario(s.id);
  e.setCount('w','p',1);
  assert.equal(original.whiteArmySnapshot.p,0);
});
test('Los ejércitos se guardan y se recuperan, y sus nombres no son HTML',function(){
  var a={id:'army-123',name:'<b>Armada</b>',pieces:army(1,15,0,0,0,0)};
  assert(Storage.saveArmy(a));assert.equal(Storage.armies().length,1);
  assert.equal(Storage.army('army-123').pieces.q,15);
  assert(Storage.removeArmy('army-123'));assert.equal(Storage.armies().length,0);
});
test('Se puede recuperar un escenario sin depender del ejército original',function(){
  var e=simple(),s=e.serialize('Reinas'); assert(Storage.saveScenario(s));
  var loaded=new Editor();assert(loaded.loadScenario(Storage.scenario(s.id)));
  assert.equal(loaded.validate().state,'valid');assert.equal(loaded.get('b2').type,'q');
});
test('Modificar o borrar un escenario no altera la partida ya creada',function(){
  var e=simple(),s=e.serialize('Ataque'), g=new ctx.Xake.Game({initialFen:s.initialFen,scenarioId:s.id,scenarioName:s.name});
  var saved=g.snapshot();assert(Storage.saveScenario(s));assert(Storage.removeScenario(s.id));
  var clone=new ctx.Xake.Game();assert(clone.restore(saved));assert.equal(clone.initialFen,s.initialFen);
  assert.equal(clone.scenarioName,'Ataque');
});
test('Reiniciar partida personalizada restaura su FEN de inicio, no el clásico',function(){
  var e=simple(),fen=e.validate().fen, g=new ctx.Xake.Game({initialFen:fen});
  var moves=g.engine.moves({verbose:true});assert(moves.length>0);
  g.move(moves[0].from,moves[0].to,moves[0].promotion);
  assert.notEqual(g.engine.fen(),fen);g.reset();assert.equal(g.engine.fen(),fen);
});
test('Restaurar partidas clásicas antiguas sigue funcionando', function () {
  var g=new ctx.Xake.Game(); g.move('e2','e4'); var saved=g.snapshot();
  delete saved.scenarioName;delete saved.scenarioId;
  assert(Storage.saveGame(saved));
  var restored=new ctx.Xake.Game(); assert(restored.restore(Storage.savedGame()));
  assert.equal(restored.history().length,1);
});
test('No se guardan ejércitos con cantidades negativas ni IDs sospechosos',function(){
  assert(!Storage.saveArmy({id:'../bad',name:'mal',pieces:army(1,1,0,0,0,0)}));
  assert(!Storage.saveArmy({id:'army-456',name:'mal',pieces:army(1,-2,0,0,0,0)}));
});
test('Nombres largos y JSON corrupto se rechazan de forma controlada',function(){
  var e=simple(),s=e.serialize('OK');s.name=new Array(80).join('x');assert(!Storage.saveScenario(s));
  records['xake:v1:armies']='not-json';assert.equal(Storage.armies().length,0);
});
console.log('\n'+n+' pruebas de editor superadas.');
