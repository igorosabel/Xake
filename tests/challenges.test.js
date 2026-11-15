/* Hito 5 - pruebas sin dependencias externas, utilizando el motor real de Xake. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const Chess = require('../lib/chess.js').Chess;
const rootDir = path.join(__dirname, '..');
let store = {}, failKey = null, n = 0;
const localStorage = {
  getItem: k => Object.prototype.hasOwnProperty.call(store,k) ? store[k] : null,
  setItem: (k,v) => { if (failKey === k) throw Error('quota'); store[k]=String(v); },
  removeItem: k => { delete store[k]; }
};
const window = { Chess, localStorage };
const document = { readyState: 'loading', addEventListener(){} };
const ctx = vm.createContext({ window, document, Chess, Date, Math, Object, JSON, String, Array, Number, Error, isFinite });
window.Xake = { I18n: { t:key=>key } };
for (const file of ['js/editor.js','js/storage.js','js/challenges.js','js/backup.js']) {
  vm.runInContext(fs.readFileSync(path.join(rootDir,file),'utf8'),ctx,{filename:file});
}
const X = window.Xake, C = X.Challenges;
function test(name, fn) { fn(); n++; console.log('✓ ' + name); }
function reset() { store={}; failKey=null; }
function scenario(fen, id) {
  const board=X.EditorTools.boardFromFen(fen);
  return {id:id||'scenario-1',name:'Mi tablero',initialFen:fen,
    whiteArmySnapshot:X.EditorTools.pieceCounts(board,'w'),
    blackArmySnapshot:X.EditorTools.pieceCounts(board,'b')};
}
function items(key) { return JSON.parse(store[key]||'{"items":[]}').items||[]; }
function sample() {
  const s=scenario('4k3/8/8/8/4q3/8/4R3/K7 w - - 0 1');
  assert(X.Storage.saveScenario(s)); return s;
}
test('Los seis retos preinstalados tienen una única jugada que cumple su objetivo',()=>{
  assert.strictEqual(C.builtins.length,6);
  for (const p of C.builtins) {
    const moves=C.solutions(p.initialFen,p.goal);
    assert.strictEqual(moves.length,1,p.id);
    const c=new Chess(p.initialFen),m=c.move(moves[0]);
    assert(m && C.success(c,m,p.goal));
  }
});
test('Pista y solución de mate no se confunden con un jaque normal',()=>{
  const p=C.builtins[4],c=new Chess(p.initialFen);
  assert(C.solutions(p.initialFen,'mate').length===1);
  const checkMove=c.move({from:'g6',to:'g8'});
  assert(checkMove);
  assert.strictEqual(C.success(c,checkMove,'mate'),false);
});
test('Una jugada legal equivocada no supera el reto de captura',()=>{
  const c=new Chess(C.builtins[2].initialFen);
  const m=c.move({from:'e2',to:'e3'});
  assert(m); assert.strictEqual(C.success(c,m,'queen'),false);
});
test('Se rechazan posiciones terminadas, objetivo inexistente y FEN malformado',()=>{
  assert.strictEqual(C.solutions('8/8/8/8/8/8/8/8 w - - 0 1','check').length,0);
  assert.strictEqual(C.solutions('4k3/8/8/8/8/8/8/4K3 w - - 0 1','check').length,0);
  assert.strictEqual(C.solutions(C.builtins[0].initialFen,'wrong').length,0);
});
test('Creación de reto desde escenario legal y copia autónoma del FEN',()=>{
  reset(); const sc=sample(); const p=C.createFromScenario(sc,'queen','  Comer reina  ');
  assert(p);assert.strictEqual(p.name,'Comer reina');
  assert.strictEqual(p.initialFen,sc.initialFen);assert.strictEqual(p.sourceScenarioId,sc.id);
  assert(C.save(p)); assert.strictEqual(C.custom().length,1);
  assert(X.Storage.removeScenario(sc.id));assert.strictEqual(C.custom()[0].initialFen,sc.initialFen);
});
test('No se crea un reto sin solución a una jugada',()=>{
  const sc=scenario('4k3/8/8/8/4q3/8/4R3/K7 w - - 0 1');
  assert.strictEqual(C.createFromScenario(sc,'mate','Mate imposible'),null);
});
test('No se admiten nombres vacíos, objetivos desconocidos ni datos falsificados',()=>{
  reset();const sc=sample();assert.strictEqual(C.createFromScenario(sc,'queen','   '),null);
  assert.strictEqual(C.createFromScenario(sc,'unknown','Reto'),null);
  assert.strictEqual(C.save({id:'bad',name:'Truco',initialFen:'invalid',goal:'queen'}),false);
});
test('También se puede crear un reto cuando empiezan las negras',()=>{
  reset();const sc=scenario('4k3/8/8/8/4Q3/8/4r3/K7 b - - 0 1');
  assert(X.Storage.saveScenario(sc));
  const item=C.createFromScenario(sc,'queen','Reto de negras');
  assert(item);assert.strictEqual(C.solutions(item.initialFen,item.goal).length,1);
  assert.strictEqual(C.solutions(item.initialFen,item.goal)[0].from,'e2');
});
test('Se rechazan FEN con el rey contrario en jaque aunque haya solución',()=>{
  const illegal='4k3/8/8/8/8/8/4R3/4K2q w - - 0 1';
  // El rey negro ya está atacado por la torre en e2 mientras mueven las blancas.
  assert.strictEqual(C.valid({id:'challenge-illegal',name:'Ilegal',goal:'check',initialFen:illegal}),false);
});
test('Eliminación de reto y bloqueo de borrado de los preinstalados',()=>{
  reset();const p=C.createFromScenario(sample(),'queen','Mi reto');assert(C.save(p));
  assert.strictEqual(C.remove('builtin-check-1'),false);
  assert(C.remove(p.id));assert.strictEqual(C.custom().length,0);
});
test('Tres estrellas en primer intento, dos en el segundo y una con pista',()=>{
  assert.strictEqual(C.stars(1,false),3);
  assert.strictEqual(C.stars(3,false),2);
  assert.strictEqual(C.stars(1,true),1);
});
test('El progreso conserva la mejor puntuación y registra repeticiones',()=>{
  reset();const id='builtin-mate-1';
  assert(C.markSolved(id,3)); assert(C.markSolved(id,1));
  assert.strictEqual(C.progress()[id].bestStars,3);
  assert.strictEqual(C.progress()[id].completed,2);
});
test('Fallo de cuota no anuncia que se ha guardado el reto o el progreso',()=>{
  reset();const p=C.createFromScenario(sample(),'queen','Reto');
  failKey=C.storageKeys.challenges;assert.strictEqual(C.save(p),false);
  failKey=C.storageKeys.progress;assert.strictEqual(C.markSolved('builtin-mate-1',3),false);
  failKey=null;
});
test('La copia JSON incluye los retos creados, pero no las puntuaciones',()=>{
  reset();const p=C.createFromScenario(sample(),'queen','Reto');assert(C.save(p));
  assert(C.markSolved(p.id,2));
  const data=JSON.parse(X.Backup.exportData());
  assert.strictEqual(data.challenges.length,1);
  assert.strictEqual(data.challenges[0].id,p.id);
  assert(!Object.prototype.hasOwnProperty.call(data,'challengeProgress'));
});
test('Importar copia genera IDs nuevos y reubica el origen del reto',()=>{
  reset();const sc=sample(),p=C.createFromScenario(sc,'queen','Reto original');assert(C.save(p));
  const original=X.Backup.exportData(),info=X.Backup.importData(original);
  assert.strictEqual(info.scenarios,1);assert.strictEqual(info.challenges,1);
  const loaded=C.custom();assert.strictEqual(loaded.length,2);
  const copy=loaded.filter(x=>x.id!==p.id)[0];
  assert.notStrictEqual(copy.id,p.id);
  assert(X.Storage.scenario(copy.sourceScenarioId));
  assert.notStrictEqual(copy.sourceScenarioId,sc.id);
});
test('Importación antigua sin challenges sigue siendo compatible',()=>{
  reset();sample();const data=JSON.parse(X.Backup.exportData());delete data.challenges;
  const result=X.Backup.importData(JSON.stringify(data));
  assert.strictEqual(result.challenges,0);
});
test('Importar un reto inválido se rechaza sin escribir datos',()=>{
  reset();const p=C.createFromScenario(sample(),'queen','Reto');assert(C.save(p));
  const data=JSON.parse(X.Backup.exportData());data.challenges[0].goal='unavailable';
  const before=JSON.stringify(store);
  assert.throws(()=>X.Backup.importData(JSON.stringify(data)),/challenge/);
  assert.strictEqual(JSON.stringify(store),before);
});
test('Fallo al escribir retos importados revierte ejércitos y tableros',()=>{
  reset();const p=C.createFromScenario(sample(),'queen','Reto');assert(C.save(p));
  const dump=X.Backup.exportData(),before=JSON.stringify(store);
  failKey=C.storageKeys.challenges;
  assert.throws(()=>X.Backup.importData(dump),/storage/);
  failKey=null;assert.strictEqual(JSON.stringify(store),before);
});
console.log('Hito 5: '+n+' pruebas superadas.');
