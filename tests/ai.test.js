/* Pruebas de IA y continuidad, Node sin dependencias externas. */
'use strict';
var assert = require('assert'), fs = require('fs'), vm = require('vm'), path = require('path');
var base = path.join(__dirname, '..');
var ctx = { Date: Date, Math: Math, console: console, setTimeout: setTimeout, clearTimeout: clearTimeout };
ctx.window = ctx;
vm.createContext(ctx);
function load(file) { vm.runInContext(fs.readFileSync(path.join(base,file), 'utf8'),ctx,{filename:file}); }
load('lib/chess.js');
ctx.Xake = {I18n:{t:function(key){return key;}}};
load('js/game.js');
load('js/ai.js');
var count=0;
function test(name,fn){fn();count++;console.log('✓ '+name);}
function legal(fen,move){var chess=new ctx.Chess(fen);return !!chess.move(move);}
var initial='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
test('Los cuatro niveles devuelven movimientos legales desde la posición inicial',function(){
 for(var n=1;n<=4;n++){
   var move=ctx.Xake.AI.compute(initial,n,null,n>=3?600:200);
   assert(move,'nivel '+n+' sin movimiento');assert(legal(initial,move),'nivel '+n+' ilegal: '+JSON.stringify(move));
 }
});
test('El motor de búsqueda no altera FEN ni pila del tablero del jugador',function(){
 var chess=new ctx.Chess(initial),fen=chess.fen(),moves=chess.search_moves();
 chess.search_play(moves[0]);assert.notEqual(chess.fen(),fen);
 chess.search_undo();assert.equal(chess.fen(),fen);assert.equal(chess.history().length,0);
});
test('Posición de mate en una jugada (niveles normal y difícil)',function(){
 var fen='7k/5Q2/6K1/8/8/8/8/8 w - - 0 1';
 for(var n=3;n<=4;n++){
   var move=ctx.Xake.AI.compute(fen,n,null,1500), chess=new ctx.Chess(fen);
   assert(move && chess.move(move), 'jugada ilegal nivel '+n);
   assert(chess.in_checkmate(), 'el nivel '+n+' no encuentra mate: '+JSON.stringify(move));
 }
});
test('La IA puede jugar con negras o blancas usando un FEN de turno válido',function(){
 var m=ctx.Xake.AI.compute(initial,2),chess=new ctx.Chess(initial);
 assert(chess.move(m));
 var reply=ctx.Xake.AI.compute(chess.fen(),2);
 assert(reply && chess.move(reply));
});
test('Partida local conserva el deshacer de una jugada',function(){
 var g=new ctx.Xake.Game();g.move('e2','e4');assert(g.canUndo());
 assert(g.undoTurn());assert.equal(g.history().length,0);
});
test('Contra IA blanca: deshacer retrocede el turno humano y la respuesta',function(){
 var g=new ctx.Xake.Game({mode:'vs-computer',difficulty:3,humanColor:'w'});
 g.move('e2','e4');g.move('e7','e5');assert(g.canUndo());
 assert(g.undoTurn());assert.equal(g.engine.fen(),initial);
});
test('Contra IA negra: no deshacer la apertura de la máquina hasta mover el humano',function(){
 var g=new ctx.Xake.Game({mode:'vs-computer',difficulty:3,humanColor:'b'});
 assert(!g.canUndo());g.move('e2','e4');assert(!g.canUndo());
 g.move('e7','e5');g.move('g1','f3');assert(g.canUndo());
 assert(g.undoTurn());assert.equal(g.history().length,1);assert.equal(g.engine.turn(),'b');
});
test('Continuación de partida IA mantiene color, dificultad y jugadas',function(){
 var g=new ctx.Xake.Game({mode:'vs-computer',difficulty:4,humanColor:'b'});
 g.move('e2','e4');var snapshot=JSON.parse(JSON.stringify(g.snapshot()));
 var loaded=new ctx.Xake.Game();assert(loaded.restore(snapshot));
 assert.equal(loaded.mode,'vs-computer');assert.equal(loaded.humanColor,'b');
 assert.equal(loaded.difficulty,4);assert.equal(loaded.engine.fen(),g.engine.fen());
});
test('Restauración del formato anterior de dos jugadores no se rompe',function(){
 var old={initialFen:initial,mode:'local-two-players',difficulty:null,humanColor:null,moves:[]};
 var g=new ctx.Xake.Game({mode:'vs-computer',difficulty:3});assert(g.restore(old));
 assert.equal(g.mode,'local-two-players');assert.equal(g.difficulty,null);
});
test('Se rechazan guardados corruptos de la máquina',function(){
 var g=new ctx.Xake.Game(),bad={initialFen:initial,mode:'vs-computer',humanColor:'x',difficulty:99,moves:[]};
 assert(!g.restore(bad));
 bad.humanColor='w';bad.difficulty=3.5;assert(!g.restore(bad));
 bad.difficulty=3;assert(g.restore(bad));
});
test('La búsqueda admite ejército no tradicional sin lanzar errores',function(){
 var fen='4k3/pppppppp/8/8/8/8/QQQQQQQQ/4K3 w - - 0 1';
 var chess=new ctx.Chess(fen),move=ctx.Xake.AI.compute(fen,3,null,150);
 assert(move && chess.move(move),'movimiento inválido en posición personalizada');
});

test('Worker ES5 importa el motor y comunica progreso y resultado',function(){
 var responses=[];
 ctx.postMessage=function(m){responses.push(m);};
 ctx.importScripts=function(){for(var i=0;i<arguments.length;i++){
   var rel=arguments[i] === '../lib/chess.js' ? 'lib/chess.js' : 'js/'+arguments[i];
   load(rel);
 }};
 load('js/ai-worker.js');
 ctx.onmessage({data:{type:'find',fen:initial,level:3,budget:120}});
 assert(responses.length>=2);
 assert(responses.some(function(x){return x.type==='progress' && legal(initial,x.move);}));
 assert(responses[responses.length-1].type==='result');
 assert(legal(initial,responses[responses.length-1].move));
});
test('Una respuesta atrasada del Worker no puede aplicar una jugada cancelada',function(){
 var instances=[],called=false;
 ctx.Worker=function(){this.terminate=function(){this.closed=true;};this.postMessage=function(){};instances.push(this);};
 ctx.Xake.AI.find(initial,3,function(){called=true;});
 assert.equal(instances.length,1);
 var old=instances[0];
 ctx.Xake.AI.cancel();
 old.onmessage({data:{type:'result',move:{from:'e2',to:'e4'}}});
 assert(!called);assert(old.closed);
 delete ctx.Worker;
});
test('localStorage acepta los guardados clásicos y contra la máquina',function(){
 var bag={};ctx.localStorage={getItem:function(k){return bag[k]||null;},
 setItem:function(k,v){bag[k]=v;},removeItem:function(k){delete bag[k];}};
 load('js/storage.js');
 var game=new ctx.Xake.Game({mode:'vs-computer',difficulty:2,humanColor:'w'});
 assert(ctx.Xake.Storage.saveGame(game.snapshot()));
 assert.equal(ctx.Xake.Storage.savedGame().mode,'vs-computer');
 assert(ctx.Xake.Storage.saveGame(new ctx.Xake.Game().snapshot()));
 assert.equal(ctx.Xake.Storage.savedGame().mode,'local-two-players');
});

console.log('\n'+count+' pruebas de IA superadas.');
