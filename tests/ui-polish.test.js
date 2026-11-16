/* Pruebas de ajustes y botones de la fase de pulido; sin dependencias npm. */
'use strict';
var fs = require('fs');
var vm = require('vm');
var path = require('path');
var assert = require('assert');
var n = 0;
var prefs = {}, progress = { 'xake:v1:challengeProgress': '{"items":[]}',
  'xake:v1:learnProgress': '{"schemaVersion":1,"completed":{"pawn-move":true}}' };
var failRemove = false, alerts = 0;
var confirmValue = true, failSave = false;
var elements = {};
function Node(tag) { this.tagName = tag; this.children = []; this.parentNode = null; this.className = ''; this.textContent = ''; this.attributes = {}; this.value = ''; }
Node.prototype.appendChild = function(child) {
  if (child.parentNode) { var ix = child.parentNode.children.indexOf(child); if (ix >= 0) child.parentNode.children.splice(ix,1); }
  this.children.push(child); child.parentNode = this; return child;
};
Node.prototype.setAttribute = function(k,v) { this.attributes[k] = v; };
Node.prototype.getAttribute = function(k) { return this.attributes[k] || null; };
Node.prototype.querySelector = function(selector) {
  if (selector === '.xake-action-left') return this.children.filter(function(c) { return c.className === 'xake-action-left'; })[0] || null;
  return null;
};
var document = { readyState:'loading', addEventListener:function(){},
  getElementById:function(k){return elements[k]||null;},
  createElement:function(tag){return new Node(tag);} };
var Xake = {
  Storage: { preferences:function(){return Object.assign({},prefs);}, savePreferences:function(value){if(failSave)return false; prefs=value;return true;}, scenario:function(k){return k==='sc1'?{id:k}:null;} },
  I18n: { t:function(k){return k;},init:function(k,cb){cb();},change:function(k,cb){cb();} },
  Challenges: {goals:['check','queen','mate','mate2'],storageKeys:{progress:'xake:v1:challengeProgress'}},
  Learn: {storageKey:'xake:v1:learnProgress'}
};
var window={Xake:Xake,localStorage:{removeItem:function(k){if(failRemove)throw Error('quota');delete progress[k];}}, confirm:function(){return confirmValue;}, alert:function(){alerts++;}, setTimeout:function(cb){cb();}};
window.window=window;
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/ui-polish.js'),'utf8'),{window:window,document:document});
var P=Xake.UIPolish;
function test(name,fn){fn();n++;console.log('✓ '+name);}
test('Oculta capturas y movimientos por defecto',function(){assert.strictEqual(P.enabledTab({id:'captures',pref:'showCapturedTab'}),false);assert.strictEqual(P.enabledTab({id:'controls'}),true);});
test('Guarda cada opción independiente',function(){assert(P.setPreference('showCapturedTab',true));assert.strictEqual(prefs.showCapturedTab,true);assert.strictEqual(P.enabledTab({pref:'showCapturedTab'}),true);assert.strictEqual(P.enabledTab({pref:'showMovesTab'}),false);});
test('No admite modificar opciones desconocidas',function(){assert.strictEqual(P.setPreference('other',true),false);});
test('No anuncia éxito si falla localStorage',function(){failSave=true;assert.strictEqual(P.setPreference('showMovesTab',true),false);assert.strictEqual(prefs.showMovesTab,undefined);failSave=false;});
test('Se permite desactivar una pestaña previamente activada',function(){assert(P.setPreference('showCapturedTab',false));assert.strictEqual(prefs.showCapturedTab,false);});
test('No permite importar texto vacío ni espacios',function(){assert.strictEqual(P.readyImport('   '),false);assert.strictEqual(P.readyImport(''),false);assert.strictEqual(P.readyImport(' { } '),true);});
test('Formulario reto vacío desactivado',function(){assert.strictEqual(P.readyChallenge(),false);});
elements['challenge-name']={value:'Mi reto'};elements['challenge-scenario']={value:''};elements['challenge-goal']={value:'mate'};
test('No permite guardar reto sin escenario',function(){assert.strictEqual(P.readyChallenge(),false);});
elements['challenge-scenario'].value='sc1';
test('Permite guardar cuando nombre, escenario y objetivo son válidos',function(){assert.strictEqual(P.readyChallenge(),true);});
test('Rechaza nombre en blanco y objetivo desconocido',function(){elements['challenge-name'].value='  ';assert.strictEqual(P.readyChallenge(),false);elements['challenge-name'].value='Mi reto';elements['challenge-goal'].value='no';assert.strictEqual(P.readyChallenge(),false);});
elements['challenge-goal'].value='mate2';
test('Admite mate en dos como objetivo',function(){assert.strictEqual(P.readyChallenge(),true);});
test('Reset cancelado no toca progreso',function(){confirmValue=false;assert.strictEqual(P.resetProgress(),false);assert(progress['xake:v1:challengeProgress']);});
test('Reset confirmado solo borra progreso, no retos propios',function(){confirmValue=true;progress['xake:v1:challenges']='retos';assert.strictEqual(P.resetProgress(),true);assert.strictEqual(progress['xake:v1:challengeProgress'],undefined);assert.strictEqual(progress['xake:v1:challenges'],'retos');});
test('Restablecer Aprender cancelado conserva el progreso',function(){
  confirmValue=false;
  var before=progress['xake:v1:learnProgress'];
  assert.strictEqual(P.resetLearnProgress(),false);
  assert.strictEqual(progress['xake:v1:learnProgress'],before);
  confirmValue=true;
});
test('Restablecer Aprender solo borra lecciones completadas',function(){
  progress['xake:v1:challengeProgress']='estrellas';
  progress['xake:v1:challenges']='retos propios';
  progress['xake:v2:games']='partidas';
  progress['xake:v1:learnProgress']='lecciones';
  assert.strictEqual(P.resetLearnProgress(),true);
  assert.strictEqual(progress['xake:v1:learnProgress'],undefined);
  assert.strictEqual(progress['xake:v1:challengeProgress'],'estrellas');
  assert.strictEqual(progress['xake:v1:challenges'],'retos propios');
  assert.strictEqual(progress['xake:v2:games'],'partidas');
});
test('Restablecer Aprender informa del error de almacenamiento',function(){
  progress['xake:v1:learnProgress']='completado';
  failRemove=true;
  var a=alerts;
  assert.strictEqual(P.resetLearnProgress(),false);
  assert.strictEqual(progress['xake:v1:learnProgress'],'completado');
  assert.strictEqual(alerts,a+1);
  failRemove=false;
});
test('Restablecer Aprender no utiliza claves inventadas sin el módulo educativo',function(){
  var learn=Xake.Learn;
  Xake.Learn=null;
  assert.strictEqual(P.resetLearnProgress(),false);
  assert.strictEqual(progress['xake:v1:learnProgress'],'completado');
  Xake.Learn=learn;
});
test('Los contadores usan centrado nativo, no flex dentro de button',function(){
  var css=fs.readFileSync(path.join(__dirname,'../css/ui-polish.css'),'utf8');
  var rule=css.match(/\.army-count-row \.editor-count-btn\s*\{([^}]+)\}/);
  assert(rule,'Falta la regla del contador');
  assert(/text-align:\s*center/.test(rule[1]));
  assert(/display:\s*block/.test(rule[1]));
  assert(/line-height:\s*41px/.test(rule[1]));
  assert(!/display:\s*(?:-webkit-flex|flex)/.test(rule[1]));
});
test('Los textos de reset Aprender existen en castellano y euskera',function(){
  var keys=['resetLearnTitle','resetLearnDescription','resetLearnButton','resetLearnConfirm','resetLearnDone'];
  var es=JSON.parse(fs.readFileSync(path.join(__dirname,'../i18n/es.json'),'utf8'));
  var eu=JSON.parse(fs.readFileSync(path.join(__dirname,'../i18n/eu.json'),'utf8'));
  keys.forEach(function(k){assert(es['polish.'+k]);assert(eu['polish.'+k]);});
});
function row(n){var r=new Node('div');for(var i=0;i<n;i++){var b=new Node('button');b.textContent=['Jugar','Máquina','Editar','Duplicar','Eliminar'][i];r.appendChild(b);}return r;}
test('Tableros: dos acciones izquierda y tres iconos derecha',function(){var r=row(5);P.formatActionRow(r,2,['edit','duplicate','delete']);assert.strictEqual(r.children.length,2);assert.strictEqual(r.children[0].children.length,2);assert.strictEqual(r.children[1].children.length,3);assert(r.children[1].children[0].attributes['aria-label']);});
test('No duplica agrupación de acciones si se llama dos veces',function(){var r=row(3);P.formatActionRow(r,1,['edit','delete']);P.formatActionRow(r,1,['edit','delete']);assert.strictEqual(r.children.length,2);assert.strictEqual(r.children[1].children.length,2);});
console.log('Interfaz: '+n+' pruebas superadas.');
