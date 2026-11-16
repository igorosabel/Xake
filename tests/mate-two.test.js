/* Xake - Hito 6: motor de retos mate en dos y persistencia. Node.js sin dependencias. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const Chess = require('../lib/chess.js').Chess;
const dir = path.join(__dirname, '..');
let memory = {}, tests = 0;
const localStorage = {
  getItem(k) { return Object.prototype.hasOwnProperty.call(memory, k) ? memory[k] : null; },
  setItem(k,v) { memory[k] = String(v); },
  removeItem(k) { delete memory[k]; }
};
const window = { Chess, localStorage };
const document = { readyState: 'loading', addEventListener() {} };
window.Xake = { I18n: { t: key => key } };
const ctx = vm.createContext({ window, document, Chess, Date, Math, Object, JSON, String, Array, Number, Error, isFinite });
for (const file of ['js/editor.js','js/storage.js','js/mate-two.js','js/challenges.js','js/backup.js']) {
  vm.runInContext(fs.readFileSync(path.join(dir,file),'utf8'),ctx,{filename:file});
}
const X = window.Xake, M=X.MateTwo, C=X.Challenges;
function test(label, fn) { fn();tests++;console.log('✓ '+label); }
function scenario(fen, id) {
  const b = X.EditorTools.boardFromFen(fen);
  return {id:id || 'scenario-mate-two',name:'Mate en dos',initialFen:fen,
    whiteArmySnapshot:X.EditorTools.pieceCounts(b,'w'),
    blackArmySnapshot:X.EditorTools.pieceCounts(b,'b')};
}
function chooseMove(c, m) { const played=c.move(m);assert(played,JSON.stringify(m));return played; }
const preset=C.multiBuiltins[0];
test('Los seis retos de una jugada siguen intactos', () => { assert.strictEqual(C.builtins.length,6);assert.strictEqual(C.multiBuiltins.length,3); });
test('Los tres nuevos retos tienen solución de mate forzado en dos y no mate inmediato',()=>{
  for(const p of C.multiBuiltins) {
    const a=M.analysis(p.initialFen);
    assert.strictEqual(a.status,'ok',p.id); assert.strictEqual(a.branches.length,1,p.id);
    const c=new Chess(p.initialFen);
    chooseMove(c,a.branches[0].first);
    assert(!c.in_checkmate(),p.id+' no puede empezar con mate en una');
    for(const reply of a.branches[0].replies){
      const d=new Chess(c.fen());chooseMove(d,reply.move);
      assert(reply.mateMoves.length > 0);
      for(const mate of reply.mateMoves){const e=new Chess(d.fen()); chooseMove(e,mate); assert(e.in_checkmate());}
    }
  }
});
test('Se analizan todas las respuestas legales, no una línea cooperativa',()=>{
  const a=M.analysis(preset.initialFen);
  const c=new Chess(preset.initialFen);chooseMove(c,a.branches[0].first);
  const expected=c.moves({verbose:true});
  assert.strictEqual(a.branches[0].replies.length,expected.length);
  assert(a.branches[0].replies.length>=2);
});
test('Una primera jugada no forzada no se acepta aunque sea legal',()=>{
  const c=new Chess(preset.initialFen);const bad={from:'d7',to:'d6'};
  assert(c.move(bad));assert.strictEqual(M.replyFor(preset.initialFen,bad),null);
});
test('La defensa automática es legal y deja una oportunidad de mate',()=>{
  const a=M.analysis(preset.initialFen),first=a.branches[0].first;
  const defense=M.replyFor(preset.initialFen,first);
  assert(defense);const c=new Chess(preset.initialFen);chooseMove(c,first);chooseMove(c,defense.move);
  assert(defense.mateMoves.length);
  chooseMove(c,defense.mateMoves[0]);assert(c.in_checkmate());
});
test('La defensa elige el menor número de mates alternativos',()=>{
  const a=M.analysis(preset.initialFen),first=a.branches[0].first,reply=M.replyFor(preset.initialFen,first);
  assert.strictEqual(reply.mateMoves.length,Math.min(...a.branches[0].replies.map(x=>x.mateMoves.length)));
});
test('El ejemplo de negras se resuelve sin cambiar el turno artificialmente',()=>{
  const p=C.multiBuiltins[2],first=M.firstMoves(p.initialFen)[0];
  assert.strictEqual(new Chess(p.initialFen).turn(),'b');
  assert.strictEqual(first.from,'d2');assert.strictEqual(first.to,'c3');
  const c=new Chess(p.initialFen);chooseMove(c,first);const r=M.replyFor(p.initialFen,first);
  chooseMove(c,r.move);chooseMove(c,r.mateMoves[0]);assert(c.in_checkmate());
});
test('Los mates en una jugada no se convierten en mates en dos',()=>{
  const m1=C.builtins[4].initialFen;
  const instant=C.solutions(m1,'mate')[0];
  assert(instant);assert.strictEqual(M.replyFor(m1,instant),null);
});
test('Tableros enormes se rechazan rápidamente sin perder los ya guardados',()=>{
  const huge=new Chess().fen();const start=Date.now(),a=M.analysis(huge);
  assert.strictEqual(a.status,'too-complex');assert(Date.now()-start<1000);
});
test('Los retos sin solución se rechazan al crearlos',()=>{
  const s=scenario(C.builtins[2].initialFen);
  assert.strictEqual(C.createFromScenario(s,'mate2','No vale'),null);
});
test('Crear y guardar un mate en dos conserva su FEN y la autonomía',()=>{
  const s=scenario(preset.initialFen);assert(X.Storage.saveScenario(s));
  const item=C.createFromScenario(s,'mate2','  Mate preparado  ');
  assert(item);assert.strictEqual(item.name,'Mate preparado');assert(C.save(item));
  assert(C.custom().some(x=>x.goal==='mate2'));
  assert(X.Storage.removeScenario(s.id));assert(C.custom().some(x=>x.id===item.id));
});
test('Exportar e importar no pierde objetivos mate2 ni modifica los anteriores',()=>{
  const json=X.Backup.exportData(),payload=JSON.parse(json);
  assert(payload.challenges.some(x=>x.goal==='mate2'));
  const nBefore=C.custom().length;const result=X.Backup.importData(json);
  assert.strictEqual(result.challenges,1);
  assert.strictEqual(C.custom().length,nBefore+1);
  assert.strictEqual(C.custom().filter(x=>x.goal==='mate2').length,nBefore+1);
});
test('La importación anterior al hito 6 sigue funcionando',()=>{
  const data=JSON.parse(X.Backup.exportData());data.challenges=[];
  assert.doesNotThrow(()=>X.Backup.importData(JSON.stringify(data)));
});
test('Se rechazan retos falsificados cuyo objetivo mate2 no se puede garantizar',()=>{
  const item={id:'challenge-fake',name:'Truco',goal:'mate2',initialFen:C.builtins[2].initialFen};
  assert.strictEqual(C.valid(item),false);
});
test('El progreso anterior y sus estrellas siguen siendo válidos',()=>{
  assert(C.markSolved(preset.id,3));assert(C.markSolved(preset.id,1));
  assert.strictEqual(C.progress()[preset.id].bestStars,3);
  assert.strictEqual(C.stars(2,false),2);
});
console.log('Hito 6: '+tests+' pruebas superadas.');
