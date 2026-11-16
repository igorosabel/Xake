/* Hito 7: pruebas de ayudas del tablero y piezas capturadas, sin dependencias. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
let count = 0;
function test(name, fn) { fn(); count++; console.log('✓ ' + name); }
function Element(tag) {
  this.tagName = tag.toUpperCase(); this.className = ''; this.id = '';
  this.style = {}; this.textContent = ''; this.children = []; this.attributes = {};
}
Object.defineProperty(Element.prototype, 'firstChild', { get() { return this.children[0] || null; } });
Element.prototype.appendChild = function (child) { this.children.push(child); return child; };
Element.prototype.removeChild = function (child) {
  let i = this.children.indexOf(child); if (i < 0) throw Error('missing');
  this.children.splice(i, 1); return child;
};
Element.prototype.insertBefore = function (child, sibling) {
  const i = this.children.indexOf(sibling);
  if (!sibling || i < 0) this.children.push(child);
  else this.children.splice(i, 0, child);
  return child;
};
Element.prototype.setAttribute = function (k, v) { this.attributes[k] = String(v); };
Element.prototype.querySelector = function (selector) {
  if (selector === '.moves-panel') return this.children.find(x => (x.className || '').indexOf('moves-panel') >= 0) || null;
  return null;
};
const sidebar = new Element('aside');
const moves = new Element('div'); moves.className='panel moves-panel';sidebar.appendChild(moves);
const byId = {board: new Element('div'), 'challenge-board': new Element('div'), 'editor-board': new Element('div')};
for (const id of Object.keys(byId)) { byId[id].id = id; byId[id].className = 'chess-board'; }
const listeners = {};
const document = {
  readyState: 'loading',
  addEventListener: (name, fn) => { listeners[name] = fn; },
  createElement: tag => new Element(tag),
  getElementById: id => {
    if (byId[id]) return byId[id];
    function find(node) { if (node.id === id) return node; for (const child of node.children) { const result=find(child); if (result) return result; } return null; }
    return find(sidebar);
  },
  querySelector: q => q === '#screen-game .game-sidebar' ? sidebar : null
};
let prefs = {language:'eu',whiteAppearance:'medallas',blackAppearance:'emblemas'}, failSave = false, lang='es';
const Xake = {
  I18n: { t: key => key, language: () => lang },
  Storage: { preferences: () => Object.assign({}, prefs), savePreferences: obj => {
    if (failSave) return false;
    prefs = Object.assign({},obj); return true;
  } },
  Board: function Board() {},
  Appearance: {safe: x => ['classic','emblemas','medallas'].includes(x) ? x:'classic', iconUrl:(theme,color,type)=>`assets/pieces/${theme}/${color}${type}.png`}
};
Xake.Board.names={q:'queen',r:'rook',b:'bishop',n:'knight',p:'pawn'};
Xake.Board.glyphs={bp:'♟',bq:'♛',br:'♜',bb:'♝',bn:'♞',wp:'♙',wq:'♕',wr:'♖',wb:'♗',wn:'♘'};
let baseRenders=0;
Xake.Board.prototype.render = () => {baseRenders++;};
const window = { Xake, alert: () => {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/usability.js'),'utf8'), { window, document, JSON, Object, Array, RegExp }, {filename:'usability.js'});
const U=Xake.Usability;
test('Se inicializa el panel sin destruir los controles anteriores', () => {
  assert(listeners.DOMContentLoaded);listeners.DOMContentLoaded();
  assert.strictEqual(sidebar.children.length,3);
  assert.strictEqual(sidebar.children[0].id,'ux-aids');
  assert.strictEqual(sidebar.children[1].id,'ux-captures');
  assert.strictEqual(sidebar.children[2],moves);
});
test('Sin preferencias antiguas se activan todas las ayudas', () => {
  assert(U.enabled('showDestinations'));assert(U.enabled('showLastMove'));assert(U.enabled('showCoordinates'));
  U.applyOptions(); assert(!byId.board.className.includes('xake-hide-'));
});
test('Desactivar casillas de destino afecta a los tres tableros', () => {
  assert(U.setOption('showDestinations',false));
  assert(prefs.whiteAppearance==='medallas' && prefs.language==='eu');
  for (const name of Object.keys(byId)) assert(byId[name].className.includes('xake-hide-destinations'));
});
test('La configuración es idempotente y reversible', () => {
  U.applyOptions(); U.applyOptions();
  assert.strictEqual(byId.board.className.split('xake-hide-destinations').length,2);
  assert(U.setOption('showDestinations',true));
  assert(!byId.board.className.includes('xake-hide-destinations'));
});
test('Ocultar última jugada y coordenadas se guarda por separado',()=>{
  assert(U.setOption('showLastMove',false));assert(U.setOption('showCoordinates',false));
  assert(byId.board.className.includes('xake-hide-last'));
  assert(byId['challenge-board'].className.includes('xake-hide-coordinates'));
  assert(U.setOption('showLastMove',true));assert(U.setOption('showCoordinates',true));
});
test('No se admiten nombres de opción desconocidos',()=>{
  assert.strictEqual(U.setOption('whiteAppearance',false),false);
  assert.strictEqual(prefs.whiteAppearance,'medallas');
});
test('La falta de espacio no causa una falsa confirmación de guardado',()=>{
  failSave=true;assert.strictEqual(U.setOption('showCoordinates',false),false);
  assert(U.enabled('showCoordinates'));
  failSave=false;U.applyOptions();
});
test('La casilla de ayuda vuelve a su estado previo si no se puede guardar',()=>{
  const options=sidebar.children[0].children.filter(x=>x.className==='ux-option');
  const coordinates=options[2].children[0];
  coordinates.checked=false;failSave=true;coordinates.onchange();failSave=false;
  assert.strictEqual(coordinates.checked,true);
  assert(U.enabled('showCoordinates'));
});
test('Sin capturas se obtienen contadores vacíos',()=>{
  const s=U.captured([]);assert.deepStrictEqual(JSON.parse(JSON.stringify(s.w)),{q:0,r:0,b:0,n:0,p:0});
});
test('Las capturas se agrupan por bando que captura y tipo de víctima',()=>{
  const s=U.captured([{color:'w',captured:'p'},{color:'w',captured:'q'},
    {color:'b',captured:'n'},{color:'w',captured:'p'},{color:'b'},{color:'x',captured:'p'}]);
  assert.strictEqual(s.w.p,2);assert.strictEqual(s.w.q,1);assert.strictEqual(s.b.n,1);
  assert.strictEqual(s.b.p,0);
});
test('Una captura al paso figura como peón capturado',()=>{
  assert.strictEqual(U.captured([{color:'w',captured:'p',flags:'e'}]).w.p,1);
});
test('El tablero actualiza las piezas capturadas y no las duplica al redibujar',()=>{
  const game={whiteAppearance:'medallas',blackAppearance:'emblemas', history:()=>[{color:'w',captured:'p'},{color:'w',captured:'p'},{color:'b',captured:'n'}]};
  const board=new Xake.Board();board.container=byId.board;
  board.render(game);
  const w=document.getElementById('ux-captured-by-white'); const b=document.getElementById('ux-captured-by-black');
  assert(w&&b);assert.strictEqual(w.children.length,1);assert.strictEqual(b.children.length,1);
  assert.strictEqual(w.children[0].children[1].textContent,'×2');
  assert(w.children[0].children[0].style.backgroundImage.includes('emblemas/bp.png'));
  board.render(game);assert.strictEqual(w.children.length,1);assert.strictEqual(baseRenders,2);
});
test('Deshacer y reiniciar borran correctamente los contadores',()=>{
  let moves=[{color:'w',captured:'q'}];
  const game={whiteAppearance:'classic',blackAppearance:'classic',history:()=>moves};
  const board=new Xake.Board();board.container=byId.board;board.render(game);
  let w=document.getElementById('ux-captured-by-white');assert.strictEqual(w.children.length,1);
  moves=[];board.render(game);assert.strictEqual(w.children[0].textContent,'ux.none');
});
test('Cambiar de apariencia actualiza la imagen capturada',()=>{
  const game={whiteAppearance:'classic',blackAppearance:'classic', history:()=>[{color:'b',captured:'r'}]};
  const board=new Xake.Board();board.container=byId.board;board.render(game);
  let b=document.getElementById('ux-captured-by-black');
  assert.strictEqual(b.children[0].children[0].style.backgroundImage,undefined);
  game.whiteAppearance='medallas';board.render(game);
  assert(b.children[0].children[0].style.backgroundImage.includes('medallas/wr.png'));
});
test('El tablero de retos no modifica los contadores de partida',()=>{
  const before=document.getElementById('ux-captured-by-black').children[0];
  const board=new Xake.Board();board.container=byId['challenge-board'];
  board.render({history:()=>[]});
  assert.strictEqual(document.getElementById('ux-captured-by-black').children[0],before);
});
console.log('Hito 7: '+count+' pruebas superadas.');
