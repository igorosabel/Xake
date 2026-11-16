/* Xake: accesos desde pantalla de inicio, iconos y manifiesto; solo Node estándar. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/manifest.json'), 'utf8'));
let total = 0;
function test(label, fn) { fn(); total++; console.log('✓ '+label); }
function existsRelative(name) { return fs.existsSync(path.join(ROOT, name)); }
function pngSize(name) {
  const file = fs.readFileSync(path.join(ROOT, name));
  assert.strictEqual(file.slice(1,4).toString('ascii'), 'PNG', name);
  assert.strictEqual(file.slice(12,16).toString('ascii'), 'IHDR', name);
  return [file.readUInt32BE(16), file.readUInt32BE(20)];
}
test('Safari iOS 9: modo app independiente', () => {
  assert(/<meta\s+name="apple-mobile-web-app-capable"\s+content="yes"\s*>/.test(html));
  assert(/<meta\s+name="apple-mobile-web-app-title"\s+content="Xake"\s*>/.test(html));
  assert(/<meta\s+name="apple-mobile-web-app-status-bar-style"\s+content="default"\s*>/.test(html));
});
test('Se conserva la etiqueta Android existente', () => {
  assert(/<meta\s+name="mobile-web-app-capable"[\s\S]*?content="yes"\s*>/.test(html));
});
test('Existe enlace al manifest y se sirve desde assets ya desplegados', () => {
  assert(html.includes('rel="manifest" href="assets/manifest.json"'));
  assert(existsRelative('assets/manifest.json'));
  const workflowPath = path.join(ROOT,'.github/workflows/deploy.yml');
  if (fs.existsSync(workflowPath)) {
    const workflow = fs.readFileSync(workflowPath,'utf8');
    assert(/source:[^\n]*assets/.test(workflow));
  }
});
test('Manifiesto: identificador, inicio y ámbito de Xake', () => {
  assert.strictEqual(manifest.id, '/');
  assert.strictEqual(manifest.start_url, '/');
  assert.strictEqual(manifest.scope, '/');
  assert.strictEqual(manifest.short_name, 'Xake');
  assert.strictEqual(manifest.display, 'standalone');
});
test('Manifiesto: colores de la marca', () => {
  assert.strictEqual(manifest.theme_color, '#254638');
  assert.strictEqual(manifest.background_color, '#edf2ec');
});
test('PWA moderno: PNG 192 y 512 con tamaños válidos', () => {
  for (const px of [192,512]) {
    const icon = manifest.icons.find(x=>x.sizes === `${px}x${px}` && x.purpose === 'any');
    assert(icon, 'Falta icono '+px);
    assert.strictEqual(icon.type, 'image/png');
    assert.deepStrictEqual(pngSize(path.join('assets',icon.src)),[px,px]);
  }
});
test('Icono adaptable para Android: maskable 512', () => {
  const icon = manifest.icons.find(x=>x.purpose === 'maskable');
  assert(icon);
  assert.deepStrictEqual(pngSize(path.join('assets',icon.src)),[512,512]);
});
test('Apple: versiones específicas de iPhone, iPad y iPad Retina', () => {
  for (const px of [76,120,152,167,180]) {
    const resource = px === 152 ? 'apple-touch-icon-152x152.png' : `assets/icons/apple-touch-icon-${px}.png`;
    assert(html.includes(`sizes="${px}x${px}" href="${px === 152 ? '/' : ''}${resource}"`),resource);
    assert.deepStrictEqual(pngSize(resource),[px,px]);
  }
});
test('Apple: icono canonico sin sizes y variante precomposed', () => {
  assert(html.includes('<link rel="apple-touch-icon" href="/apple-touch-icon.png">'));
  assert(html.includes('<link rel="apple-touch-icon-precomposed" href="/apple-touch-icon-precomposed.png">'));
  assert.deepStrictEqual(pngSize('apple-touch-icon.png'),[180,180]);
});
test('Favicons apuntan a archivos existentes', () => {
  assert(html.includes('href="assets/icons/favicon.ico"'));
  assert(html.includes('href="assets/icons/favicon-32.png"'));
  assert(existsRelative('assets/icons/favicon.ico'));
  assert.deepStrictEqual(pngSize('assets/icons/favicon-32.png'),[32,32]);
});
test('Los archivos web no contienen nuevas dependencias de JS ni service worker', () => {
  assert(!html.includes('serviceWorker.register'));
  assert(!html.includes('workbox'));
  assert(!html.includes('sw.js'));
});
console.log('Instalación en pantalla de inicio: '+total+' pruebas superadas.');
