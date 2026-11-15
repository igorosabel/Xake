/* Tests autocontenidos del Hito 4 (Node.js, sin instalar dependencias).
 * Los tests del motor y editor real del repositorio deben ejecutarse también. */
'use strict';
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');
let cases = 0;
function test(name, fn) { fn(); cases++; console.log('✓ ' + name); }
let storage = {};
let failScenarioWrite = false;
let localStorage = {
  getItem(k) { return storage[k] === undefined ? null : storage[k]; },
  setItem(k, value) { if (failScenarioWrite && k === 'xake:v1:scenarios') { throw Error('quota'); } storage[k] = value; },
  removeItem(k) { delete storage[k]; }
};
function records(key) { let x=JSON.parse(localStorage.getItem(key)||'{"items":[]}'); return x.items||[]; }
function counts(c) { return c && c.k===1 && 'kqrbnp'.split('').every(x=>Number.isInteger(c[x]) && c[x]>=0 && c[x]<=63); }
function fromFen(fen) {
  let rows = fen.split(' ')[0].split('/');if(rows.length!==8) return null;
  let b=[];for(let row of rows){let n=0;for(let ch of row){if(/[1-8]/.test(ch)){n+=Number(ch);for(let i=0;i<Number(ch);i++)b.push('.');}
  else if(/[kqrbnpKQRBNP]/.test(ch)){n++;b.push(ch);}else return null;}if(n!==8)return null;}return b;
}
function pieceCounts(b,color){let out={k:0,q:0,r:0,b:0,n:0,p:0};for(let p of b)if(p!=='.'&&(color==='w'?p===p.toUpperCase():p===p.toLowerCase()))out[p.toLowerCase()]++;return out;}
function Editor(){}
Editor.prototype.loadScenario = function(sc){this.sc=sc;let b=fromFen(sc.initialFen);return !!(b && b.filter(x=>x==='K').length===1 && b.filter(x=>x==='k').length===1 && /^[wb]$/.test(sc.initialFen.split(' ')[1]));};
Editor.prototype.validate=function(){return {state:'valid'};};
function Board(){this.squares={};for(let i=0;i<64;i++)this.squares[i]={piece:{className:'board-piece',style:{},textContent:''}};}
Board.prototype.squareFor=function(r,f){return 'abcdefgh'[f]+(8-r);};
Board.prototype.render=function(game){for(let i=0;i<64;i++){let sq=this.squareFor(Math.floor(i/8),i%8),p=game.engine.get(sq);let e=this.squares[i].piece;e.textContent=p?'♜':'';e.style.backgroundImage='none';}return 'original';};
Board.prototype.renderEditor=function(editor){for(let i=0;i<64;i++){let sq=this.squareFor(Math.floor(i/8),i%8),p=editor.get(sq);let e=this.squares[i].piece;e.textContent=p?'♜':'';e.style.backgroundImage='none';}};
function Game(options){this.mode=(options||{}).mode||'local-two-players';this.engine={get:function(s){return s==='e4'?{color:'w',type:'q'}:null;}};}
Game.prototype.snapshot=function(){return {mode:this.mode,whiteAppearance:'classic',blackAppearance:'classic',moves:[]};};
Game.prototype.restore=function(saved){return !!saved;};
const prefs={whiteAppearance:'medallas',blackAppearance:'emblemas'};
const Xake={Board,Game,Editor,EditorUI:function(){},Storage:{
 preferences:()=>({...prefs}),savePreferences:p=>{Object.assign(prefs,p);return true;},
 armies:()=>records('xake:v1:armies'),scenarios:()=>records('xake:v1:scenarios'),
 saveGame:()=>true
}, I18n:{t:(key,values)=>key+' '+JSON.stringify(values||{})},EditorTools:{
 countsValid:counts,copyCounts:c=>({k:c.k,q:c.q,r:c.r,b:c.b,n:c.n,p:c.p}),
 boardFromFen:fromFen,pieceCounts
}};
Xake.EditorUI.prototype.renderPalette=function(){};Xake.EditorUI.prototype.renderCounts=function(){};
const document={readyState:'loading',addEventListener:function(){},getElementById:()=>null,querySelector:()=>null};
const window={Xake,document,localStorage,alert:function(){},confirm:()=>true};
const ctx=vm.createContext({window,document,Date,Math,JSON,Object,Array,String,Number,Error,isFinite});
for(let f of ['appearance.js','backup.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',f),'utf8'),ctx,{filename:f});
const A=Xake.Appearance,B=Xake.Backup;
const king={k:1,q:0,r:0,b:0,n:0,p:0};
const queens={k:1,q:15,r:0,b:0,n:0,p:0};
const wp={k:1,q:0,r:0,b:0,n:0,p:15};
const validFen='4k3/8/8/8/8/8/8/4K3 w - - 0 1';
const army={id:'army-old',name:'Reinas',pieces:queens};
const scenario={id:'scenario-old',name:'Reyes',initialFen:validFen,whiteArmySnapshot:king,blackArmySnapshot:king};
localStorage.setItem('xake:v1:armies',JSON.stringify({schemaVersion:1,items:[army]}));
localStorage.setItem('xake:v1:scenarios',JSON.stringify({schemaVersion:1,items:[scenario]}));
test('Apariencias reconocidas, desconocidas a clásico',()=>{assert.strictEqual(A.safe('emblemas'),'emblemas');assert.strictEqual(A.safe('bad'),'classic');});
test('El selector mantiene preferencias independientes',()=>{assert.strictEqual(A.preference('w'),'medallas');assert.strictEqual(A.preference('b'),'emblemas');});
test('Juego nuevo hereda apariencia de preferencias',()=>{let g=new Xake.Game();assert.strictEqual(g.whiteAppearance,'medallas');assert.strictEqual(g.blackAppearance,'emblemas');});
test('La instantánea conserva ambos temas',()=>{let g=new Xake.Game();assert.strictEqual(g.snapshot().blackAppearance,'emblemas');assert.strictEqual(g.snapshot().whiteAppearance,'medallas');});
test('La restauración conserva una partida antigua con tema clásico',()=>{let g=new Xake.Game();g.restore({whiteAppearance:'classic',blackAppearance:'classic'});assert.strictEqual(g.whiteAppearance,'classic');assert.strictEqual(g.blackAppearance,'classic');});
test('La restauración ignora temas desconocidos',()=>{let g=new Xake.Game();g.restore({whiteAppearance:'unknown',blackAppearance:null});assert.strictEqual(g.whiteAppearance,'classic');assert.strictEqual(g.blackAppearance,'classic');});
test('El tablero usa el PNG de la pieza y color correctos',()=>{let g=new Xake.Game(),b=new Xake.Board();b.render(g);assert(b.squares[4*8+4].piece.style.backgroundImage.includes('medallas/wq.png'));});
test('Cambiar a clásico no necesita recursos gráficos',()=>{let g=new Xake.Game(),b=new Xake.Board();g.whiteAppearance='classic';b.render(g);assert.strictEqual(b.squares[4*8+4].piece.style.backgroundImage,'none');});
test('El editor comparte la apariencia de las preferencias',()=>{let b=new Xake.Board();b.renderEditor({get:s=>s==='a1'?{color:'b',type:'n'}:null});assert(b.squares[56].piece.style.backgroundImage.includes('emblemas/bn.png'));});
test('Exportación JSON versionada, solo ejércitos y tableros',()=>{let p=JSON.parse(B.exportData());assert.strictEqual(p.format,'xake-config');assert.strictEqual(p.schemaVersion,1);assert.strictEqual(p.armies.length,1);assert.strictEqual(p.scenarios.length,1);assert(!('games' in p));});
test('Importar añade copias sin sobrescribir originales',()=>{let before=B.exportData();let r=B.importData(before);assert.strictEqual(r.armies,1);assert.strictEqual(r.scenarios,1);assert.strictEqual(records('xake:v1:armies').length,2);assert.strictEqual(records('xake:v1:scenarios').length,2);assert.strictEqual(records('xake:v1:armies')[0].id,'army-old');});
test('Segunda importación añade nuevas copias sin colisiones',()=>{B.importData(B.exportData());let ids=records('xake:v1:armies').map(a=>a.id);assert.strictEqual(new Set(ids).size,ids.length);});
test('JSON malformado no altera colecciones',()=>{let old=storage['xake:v1:scenarios'];assert.throws(()=>B.importData('esto no es json'),/json/);assert.strictEqual(storage['xake:v1:scenarios'],old);});
test('Formato inválido se rechaza',()=>{assert.throws(()=>B.importData('{"format":"other","schemaVersion":1,"armies":[],"scenarios":[]}'),/format/);});
test('Ejército sin rey se rechaza y no guarda nada',()=>{let old=storage['xake:v1:armies'];let p=JSON.parse(B.exportData());p.armies[0].pieces.k=0;assert.throws(()=>B.importData(JSON.stringify(p)),/army/);assert.strictEqual(storage['xake:v1:armies'],old);});
test('Escenario con recuento manipulado no importa',()=>{let p=JSON.parse(B.exportData());p.scenarios[0].whiteArmySnapshot.q=2;let old=storage['xake:v1:scenarios'];assert.throws(()=>B.importData(JSON.stringify(p)),/scenario/);assert.strictEqual(storage['xake:v1:scenarios'],old);});
test('La repetición de IDs dentro de un paquete se rechaza',()=>{let p=JSON.parse(B.exportData());p.armies.push(p.armies[0]);assert.throws(()=>B.importData(JSON.stringify(p)),/army/);});
test('La copia excesiva se rechaza antes de JSON.parse',()=>{assert.throws(()=>B.importData('a'.repeat(524289)),/size/);});
test('Errores de cuota restauran la colección de ejércitos',()=>{let p=B.exportData(),old=storage['xake:v1:armies'];failScenarioWrite=true;assert.throws(()=>B.importData(p),/storage/);failScenarioWrite=false;assert.strictEqual(storage['xake:v1:armies'],old);});
console.log('Hito 4: '+cases+' pruebas superadas.');
