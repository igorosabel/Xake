/* Pruebas sin paquetes externos. Ejecutar: node tests/chess.test.js */
'use strict';
var assert = require('assert');
var Chess = require('../lib/chess.js').Chess;
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var tests = 0;
function test(name, f) { try { f(); tests++; console.log('✓ ' + name); } catch (e) { console.error('✗ ' + name); throw e; } }
function play(chess, line) {
  for (var i = 0; i < line.length; i++) {
    var m = line[i];
    assert(chess.move({from:m.slice(0,2),to:m.slice(2,4),promotion:m.slice(4)||'q'}), 'Jugada ilegal: '+m);
  }
}
test('Posición inicial y 20 jugadas legales', function () {
  var c = new Chess(); assert.strictEqual(c.turn(), 'w'); assert.strictEqual(c.moves().length, 20);
  assert.strictEqual(c.get('e1').type, 'k'); assert.strictEqual(c.get('d1').type, 'q');
  assert.strictEqual(c.get('h1').type, 'r'); assert.strictEqual(c.get('e4'), null);
  assert.strictEqual(c.fen(), 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
});
test('Movimientos, turnos, capturas y deshacer exacto', function () {
  var c = new Chess(), fen = c.fen();
  assert.strictEqual(c.move({from:'e2',to:'e5'}), null);
  play(c,['e2e4','d7d5','e4d5']);
  assert.strictEqual(c.get('d5').color, 'w'); assert.strictEqual(c.get('e4'), null);
  assert.strictEqual(c.turn(), 'b');
  c.undo(); c.undo(); c.undo(); assert.strictEqual(c.fen(),fen);
  assert.strictEqual(c.undo(),null);
});
test('Mate del pastor y mate del loco', function () {
  var c=new Chess(); play(c,['f2f3','e7e5','g2g4','d8h4']);
  assert(c.in_checkmate()); assert(c.game_over()); assert(c.history()[3].indexOf('#')!==-1);
  c.undo(); assert(!c.game_over());
  c.reset(); play(c,['e2e4','e7e5','d1h5','b8c6','f1c4','g8f6','h5f7']);
  assert(c.in_checkmate());
});
test('Enroque corto y largo, con deshacer de derechos', function () {
  var c=new Chess(), initial='r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
  assert(c.load(initial));
  assert(c.moves({square:'e1'}).indexOf('O-O')!==-1);
  assert(c.moves({square:'e1'}).indexOf('O-O-O')!==-1);
  play(c,['e1g1']); assert.strictEqual(c.get('f1').type,'r'); assert.strictEqual(c.get('h1'),null);
  assert.strictEqual(c.fen().split(' ')[2],'kq');
  c.undo(); assert.strictEqual(c.fen(),initial);
  play(c,['e1c1']); assert.strictEqual(c.get('d1').type,'r'); assert.strictEqual(c.get('a1'),null);
});
test('Enroque prohibido al atravesar jaque', function () {
  var c=new Chess('4kr2/8/8/8/8/8/8/4K2R w K - 0 1');
  assert(c.moves({square:'e1'}).indexOf('O-O')===-1);
});
test('Enroque desaparece tras mover torre, incluso si regresa', function () {
  var c = new Chess('4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1');
  play(c,['h1h2','e8d8','h2h1','d8e8']);
  assert(c.moves({square:'e1'}).indexOf('O-O')===-1);
  assert(c.moves({square:'e1'}).indexOf('O-O-O')!==-1);
});
test('Captura al paso y retirada de peón', function () {
  var c = new Chess(); play(c,['e2e4','a7a6','e4e5','d7d5']);
  assert(c.moves({square:'e5',verbose:true}).some(function(x){return x.to==='d6' && x.flags==='e';}));
  play(c,['e5d6']); assert.strictEqual(c.get('d5'),null); assert.strictEqual(c.get('d6').type,'p');
  c.undo(); assert.strictEqual(c.get('d5').color,'b');
});
test('Captura al paso ilegal por descubrir jaque', function () {
  var c=new Chess('k3r3/8/8/3pP3/8/8/8/4K3 w - d6 0 1');
  assert(!c.moves({square:'e5',verbose:true}).some(function(x){return x.to==='d6';}));
});
test('Promoción a dama o caballo', function () {
  var c=new Chess('7k/P7/8/8/8/8/8/K7 w - - 0 1');
  assert.strictEqual(c.moves({square:'a7',verbose:true}).filter(function(x){return x.to==='a8';}).length,4);
  play(c,['a7a8n']); assert.strictEqual(c.get('a8').type,'n');
  c.undo(); play(c,['a7a8q']); assert.strictEqual(c.get('a8').type,'q');
  assert.strictEqual(c.history({verbose:true})[0].promotion,'q');
});
test('Ahogado y material insuficiente', function () {
  var c=new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
  assert(c.in_stalemate()); assert(c.game_over()); assert(!c.in_check());
  c.load('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
  assert(c.insufficient_material()); assert(c.game_over());
});
test('Triple repetición', function () {
  var c=new Chess(), cycle=['g1f3','g8f6','f3g1','f6g8'];
  play(c,cycle); assert(!c.in_threefold_repetition());
  play(c,cycle); assert(c.in_threefold_repetition()); assert(c.game_over());
});
test('Regla de 50 movimientos y reinicio de contador', function () {
  var c=new Chess('7k/8/8/8/8/8/R7/K7 w - - 99 50');
  play(c,['a2a3']); assert.strictEqual(c.fen().split(' ')[4],'100'); assert(c.in_draw());
  c.load('7k/8/8/8/8/8/P7/K7 w - - 99 50');
  play(c,['a2a3']); assert.strictEqual(c.fen().split(' ')[4],'0');
});
test('FEN rechazado cuando formato y reyes son incorrectos',function(){
  var c = new Chess(), orig = c.fen();
  assert.strictEqual(c.load('8/8/8/8/8/8/8/8 w - - 0 1'),false);
  assert.strictEqual(c.load('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0'),false);
  assert.strictEqual(c.fen(),orig);
});
test('Serialización de partida guardada: jugadas y restauración',function(){
  var ctx={window:{},Chess:Chess}, dir=path.join(__dirname,'../js');
  ctx.window.Xake={I18n:{t:function(key){return key;}}};
  vm.runInNewContext(fs.readFileSync(path.join(dir,'game.js'),'utf8'),ctx);
  var Game=ctx.window.Xake.Game, g=new Game();
  assert(g.move('e2','e4')); assert(g.move('e7','e5')); assert(g.move('g1','f3'));
  var snap=g.snapshot(), g2=new Game();
  assert(g2.restore(snap)); assert.strictEqual(g2.engine.fen(),g.engine.fen());
  assert.strictEqual(g2.history().length,3); g2.undo(); assert.strictEqual(g2.history().length,2);
  var bad=JSON.parse(JSON.stringify(snap)); bad.moves[1].to='e4';
  assert.strictEqual(g2.restore(bad),false);
});
test('Perft clásico: 20, 400 y 8902 posiciones a profundidad 1–3',function(){
  var c=new Chess();
  function perft(depth) {
    if(depth===0){return 1;}
    var options=c.moves({verbose:true}), total=0, i, m;
    for(i=0;i<options.length;i++){
      m=options[i];
      assert(c.move({from:m.from,to:m.to,promotion:m.promotion||'q'}));
      total+=perft(depth-1);
      c.undo();
    }
    return total;
  }
  assert.strictEqual(perft(1),20);
  assert.strictEqual(perft(2),400);
  assert.strictEqual(perft(3),8902);
});
test('Traducciones con mismas claves',function(){
  var es=JSON.parse(fs.readFileSync(path.join(__dirname,'../i18n/es.json'),'utf8'));
  var eu=JSON.parse(fs.readFileSync(path.join(__dirname,'../i18n/eu.json'),'utf8'));
  assert.deepStrictEqual(Object.keys(es).sort(),Object.keys(eu).sort());
});
console.log('\n'+tests+' pruebas superadas.');
