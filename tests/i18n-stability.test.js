/* Hito 10: las peticiones de traducción son asíncronas y pueden resolverse fuera de orden.
 * Prueba el módulo real sin red, simulando XMLHttpRequest como en Safari de iOS 9. */
'use strict';
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var count = 0;
var source = fs.readFileSync(path.join(__dirname, '../js/i18n.js'), 'utf8');
function test(name, fn) { fn(); count++; console.log('✓ ' + name); }
function harness() {
  var pending = [];
  function FakeXHR() { this.readyState = 0; this.status = 0; this.responseText = ''; }
  FakeXHR.prototype.open = function (method, url) { this.method = method; this.url = url; };
  FakeXHR.prototype.send = function () { pending.push(this); };
  FakeXHR.prototype.reply = function (payload, status) {
    this.readyState = 4;
    this.status = status === undefined ? 200 : status;
    this.responseText = typeof payload === 'string' ? payload : JSON.stringify(payload);
    if (this.onreadystatechange) { this.onreadystatechange(); }
  };
  FakeXHR.prototype.fail = function () { if (this.onerror) { this.onerror(); } };
  var window = {}, context = vm.createContext({window: window, XMLHttpRequest: FakeXHR});
  vm.runInContext(source, context, {filename: 'js/i18n.js'});
  return {i18n:window.Xake.I18n, requests:pending};
}
var es = {'menu.new':'Dos jugadores', 'custom.hello':'Hola {name}', 'custom.onlySpanish':'Solo castellano'};
var eu = {'menu.new':'Bi jokalari', 'custom.hello':'Kaixo {name}'};
test('Español predeterminado y carga del JSON local', function () {
  var h=harness(), calls=0;
  h.i18n.init('es',function(){calls++;});
  assert.strictEqual(h.requests.length,1);
  assert(h.requests[0].url.indexOf('i18n/es.json')===0);
  h.requests[0].reply(es);
  assert.strictEqual(calls,1);
  assert.strictEqual(h.i18n.language(),'es');
  assert.strictEqual(h.i18n.t('menu.new'),'Dos jugadores');
});
test('Euskera con fallback al español y sustitución de parámetros', function () {
  var h=harness(), calls=0;
  h.i18n.init('eu',function(){calls++;});
  h.requests[0].reply(es);
  assert.strictEqual(h.requests.length,2);
  h.requests[1].reply(eu);
  assert.strictEqual(calls,1);
  assert.strictEqual(h.i18n.t('menu.new'),'Bi jokalari');
  assert.strictEqual(h.i18n.t('custom.hello',{name:'Unai'}),'Kaixo Unai');
  assert.strictEqual(h.i18n.t('custom.onlySpanish'),'Solo castellano');
});
test('Una respuesta antigua de euskera no reemplaza el español elegido después', function () {
  var h=harness(), callbacks=[], i=h.i18n;
  i.init('es',function(){}); h.requests[0].reply(es);
  i.change('eu',function(){callbacks.push('eu');});
  assert.strictEqual(h.requests.length,2);
  i.change('es',function(){callbacks.push('es');});
  h.requests[1].reply(eu);
  assert.strictEqual(i.language(),'es');
  assert.strictEqual(i.t('menu.new'),'Dos jugadores');
  assert.deepStrictEqual(callbacks,['es']);
});
test('Dos selecciones de euskera: solo se aplica la última respuesta', function () {
  var h=harness(), callbacks=[], i=h.i18n;
  i.init('es',function(){}); h.requests[0].reply(es);
  i.change('eu',function(){callbacks.push('primera');});
  i.change('eu',function(){callbacks.push('segunda');});
  h.requests[2].reply({'menu.new':'Última traducción'});
  h.requests[1].reply(eu);
  assert.strictEqual(i.t('menu.new'),'Última traducción');
  assert.deepStrictEqual(callbacks,['segunda']);
});
test('Una carga inicial obsoleta no vuelve a cambiar la selección', function () {
  var h=harness(), callbacks=[], i=h.i18n;
  i.init('eu',function(){callbacks.push('init');});
  i.change('es',function(){callbacks.push('es');});
  h.requests[0].reply(es);
  assert.strictEqual(i.language(),'es');
  assert.strictEqual(i.t('menu.new'),'Dos jugadores');
  assert.deepStrictEqual(callbacks,['es']);
  assert.strictEqual(h.requests.length,1);
});
test('Si falla el JSON de euskera, se conserva la traducción española', function () {
  var h=harness(), calls=0, i=h.i18n;
  i.init('es',function(){});h.requests[0].reply(es);
  i.change('eu',function(){calls++;});
  h.requests[1].fail();
  assert.strictEqual(calls,1);
  assert.strictEqual(i.t('menu.new'),'Dos jugadores');
});
test('No se invoca dos veces el callback si XMLHttpRequest dispara varios eventos', function () {
  var h=harness(), calls=0;
  h.i18n.init('es',function(){calls++;});
  h.requests[0].reply(es);
  h.requests[0].fail();
  assert.strictEqual(calls,1);
});
test('Un idioma no soportado utiliza castellano', function () {
  var h=harness();h.i18n.init('fr',function(){});h.requests[0].reply(es);
  assert.strictEqual(h.i18n.language(),'es');
  assert.strictEqual(h.i18n.t('menu.new'),'Dos jugadores');
});
console.log('Hito 10: '+count+' pruebas de i18n superadas.');
