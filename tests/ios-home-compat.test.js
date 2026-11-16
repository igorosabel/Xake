/* iOS 9 canonical icon fallback + iOS 27 status bar color mitigation. */
'use strict';
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var root = path.join(__dirname, '..');
var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
var css = fs.readFileSync(path.join(root, 'css/ios-home.css'), 'utf8');
var workflow = fs.readFileSync(path.join(root, '.github/workflows/deploy.yml'), 'utf8');
var n = 0;
function test(name, fn) { fn(); n++; console.log('✓ ' + name); }
function pngSize(name) {
  var p = path.join(root, name), b = fs.readFileSync(p);
  assert.strictEqual(b.toString('hex',0,8),'89504e470d0a1a0a',name);
  assert.strictEqual(b.toString('ascii',12,16),'IHDR',name);
  assert.strictEqual(b[25],2,'PNG RGB sin transparencia para '+name);
  return [b.readUInt32BE(16),b.readUInt32BE(20)];
}
test('iOS antiguo tiene icono canonico en la raiz',function () {
  assert.deepStrictEqual(pngSize('apple-touch-icon.png'),[180,180]);
});
test('iOS antiguo tiene alternativa precomposed',function () {
  assert.deepStrictEqual(pngSize('apple-touch-icon-precomposed.png'),[180,180]);
});
test('iPad Retina antiguo tiene icono explicito de 152px en raiz',function () {
  assert.deepStrictEqual(pngSize('apple-touch-icon-152x152.png'),[152,152]);
});
test('El HTML enlaza los tres iconos de raiz',function () {
  assert(html.indexOf('href="/apple-touch-icon.png"')>=0);
  assert(html.indexOf('href="/apple-touch-icon-precomposed.png"')>=0);
  assert(html.indexOf('sizes="152x152" href="/apple-touch-icon-152x152.png"')>=0);
});
test('El manifest y los iconos modernos siguen en assets',function () {
  assert(html.indexOf('href="assets/manifest.json"')>=0);
  var m=JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'),'utf8'));
  assert.strictEqual(m.display,'standalone');
  assert(m.icons.some(function(i){return i.sizes==='192x192';}));
  assert(m.icons.some(function(i){return i.sizes==='512x512';}));
});
test('La correccion visual no bloquea iOS9 ni los clics',function () {
  assert(html.indexOf('css/ios-home.css?v=12.0.0')>=0);
  assert(html.indexOf('<div class="xake-ios-top-swatch" aria-hidden="true"></div>')>=0);
  assert(css.indexOf('@supports (-webkit-touch-callout: none)')>=0);
  assert(css.indexOf('@supports (top: env(safe-area-inset-top))')>=0);
  assert(css.indexOf('pointer-events: none')>=0);
  assert(css.indexOf('height: 6px')>=0);
});
test('El despliegue SCP incluye ahora los iconos de raiz',function () {
  var source=workflow.match(/source: '([^']+)'/);
  assert(source);
  ['index.html','apple-touch-icon.png','apple-touch-icon-precomposed.png',
   'apple-touch-icon-152x152.png','assets','css','js','lib','i18n'].forEach(function(p){
    assert(source[1].split(',').indexOf(p)>=0,'Falta '+p);
  });
  assert(workflow.indexOf('run: npm test')>=0);
  assert(workflow.indexOf('rm: false')>=0);
});
test('No hay service worker ni cambios en datos locales',function () {
  assert(!/navigator\.serviceWorker\.register/.test(html));
  assert(!/localStorage|sessionStorage/.test(css));
});
console.log('Correccion iOS: '+n+' pruebas superadas.');
