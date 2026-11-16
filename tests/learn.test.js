/* Hito 9: modo Aprender, probado con el motor real de Xake y sin dependencias. */
'use strict';
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var Chess = require('../lib/chess.js').Chess;
var raw = {}, broken = false, tests = 0;
var store = {
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(raw, k) ? raw[k] : null; },
  setItem: function (k,v) { if (broken) { throw Error('quota'); } raw[k] = String(v); }
};
var window = { Chess: Chess, localStorage: store }, ctx=vm.createContext({ window:window, Chess:Chess, Date:Date, Math:Math, JSON:JSON, Object:Object, Array:Array, String:String });
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/learn.js'), 'utf8'),ctx);
var L = window.Xake.Learn;
function test(name,fn) {fn(); tests++; console.log('✓ '+name);}
test('Se incluyen 15 lecciones distintas', function () {
  assert.strictEqual(L.lessons.length,15);
  assert.strictEqual(new Set(L.lessons.map(function(v){return v.id;})).size,15);
});
L.lessons.forEach(function (p) {
  test('Movimiento correcto: '+p.id, function () {
    assert(L.legal(p), 'Movimiento ilegal: '+p.id+' '+L.fenFor(p));
    assert(L.correct(p,L.fenFor(p),p.from,p.to, p.kind==='promotion'?'q':null));
  });
});
test('La lección de enroque usa torre y rey', function () {
  var p=L.find('special-castle'), chess=new Chess(L.fenFor(p));
  assert(chess.move({from:'e1',to:'g1'}));
  assert.strictEqual(chess.get('f1').type,'r');
});
test('La captura de peón no es un avance hacia delante',function(){
  var p=L.find('pawn-capture');
  assert.strictEqual(L.correct(p,L.fenFor(p),'e4','e5'),false);
});
test('Una jugada diferente no completa el ejercicio',function(){
  var p=L.find('knight-move');
  assert.strictEqual(L.correct(p,L.fenFor(p),'b1','a3'),false);
});
test('La captura exige una pieza objetivo',function(){
  var p=L.find('rook-capture');var x={};Object.keys(p.setup).forEach(function (k) {if(k!=='a7')x[k]=p.setup[k];});
  var another={setup:x};assert.strictEqual(L.correct(p,L.fenFor(another),'a4','a7'),false);
});
test('Un jaque incorrecto no se considera correcto',function(){
  var p=L.find('special-check');assert.strictEqual(L.correct(p,L.fenFor(p),'a7','a4'),false);
});
test('Los IDs desconocidos no se guardan',function(){assert.strictEqual(L.mark('unlisted'),false);});
test('Progreso independiente, persistente y sin duplicados',function(){
  assert.strictEqual(L.count(),0);assert(L.mark('pawn-move'));assert(L.mark('pawn-move'));assert(L.mark('king-capture'));
  assert.strictEqual(L.count(),2);assert.strictEqual(L.progress()['pawn-move'],true);
  assert.strictEqual(JSON.parse(raw[L.storageKey]).schemaVersion,1);
});
test('Claves arbitrarias del storage no se aceptan como progreso',function(){
  raw[L.storageKey]=JSON.stringify({schemaVersion:1,completed:{'pawn-move':true,'malicious':true}});
  assert.strictEqual(L.count(),1);assert.strictEqual(L.progress().malicious,undefined);
});
test('Almacenamiento corrupto devuelve progreso vacío',function(){
  raw[L.storageKey]='not-json';assert.strictEqual(L.count(),0);
});
test('Errores de cuota no anuncian guardado',function(){ broken=true;assert.strictEqual(L.mark('pawn-move'),false);broken=false;});
console.log('Aprender: '+tests+' pruebas superadas.');
