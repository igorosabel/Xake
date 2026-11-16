/* Hito 10: verificaciones de los recursos distribuidos y de la i18n.
 * Sin dependencias: se ejecuta con npm test también en GitHub Actions. */
'use strict';
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var root = path.resolve(__dirname,'..');
var count = 0;
function test(label, fn) { fn(); count++; console.log('✓ '+label); }
function read(file) { return fs.readFileSync(path.join(root,file), 'utf8'); }
function matches(text, re) {
  var result=[], match;
  re.lastIndex=0;
  while ((match = re.exec(text)) !== null) { result.push(match[1]); }
  return result;
}
function unique(xs) { return xs.filter(function(v,i){return xs.indexOf(v)===i;}); }
var es=JSON.parse(read('i18n/es.json'));
var eu=JSON.parse(read('i18n/eu.json'));
var html=read('index.html');
function fields(text) {
  return unique(matches(text, /\{([a-zA-Z]+)\}/g)).sort();
}
test('Las dos traducciones tienen exactamente las mismas claves',function(){
  assert.deepStrictEqual(Object.keys(es).sort(),Object.keys(eu).sort());
});
test('Los parámetros {name} de cada traducción son iguales',function(){
  Object.keys(es).forEach(function(key){
    assert.strictEqual(typeof es[key], 'string',key);
    assert.strictEqual(typeof eu[key], 'string',key);
    assert.deepStrictEqual(fields(es[key]),fields(eu[key]),key);
  });
});
test('Todos los data-i18n del HTML tienen traducción en ambos idiomas',function(){
  matches(html,/\bdata-i18n="([^"]+)"/g).forEach(function(key){
    assert(Object.prototype.hasOwnProperty.call(es,key),'Falta '+key+' en es');
    assert(Object.prototype.hasOwnProperty.call(eu,key),'Falta '+key+' en eu');
  });
});
test('El HTML no contiene IDs duplicados',function(){
  var ids=matches(html,/\bid="([^"]+)"/g);
  assert(ids.length>0);
  assert.strictEqual(ids.length,unique(ids).length);
});
test('Las hojas de estilo y scripts referenciados existen localmente',function(){
  var urls=matches(html,/<script\b[^>]*\bsrc="([^"]+)"/g)
    .concat(matches(html,/<link\b[^>]*\bhref="([^"]+)"/g));
  assert(urls.length>=10);
  urls.forEach(function(url){
    assert(!/^https?:\/\//.test(url),'Dependencia de red: '+url);
    var file=url.split('?')[0].split('#')[0];
    assert(fs.existsSync(path.join(root,file)),'No existe '+file);
  });
});
test('Hay imágenes PNG válidas para todos los tipos y ambos colores',function(){
  ['medallas','emblemas'].forEach(function(theme){
    ['w','b'].forEach(function(color){
      'kqrbnp'.split('').forEach(function(type){
        var file=path.join(root,'assets','pieces',theme,color+type+'.png');
        var data=fs.readFileSync(file);
        assert(data.length>100,'Imagen vacía: '+file);
        assert.strictEqual(data.slice(0,8).toString('hex'),'89504e470d0a1a0a',file);
      });
    });
  });
});
test('Los JavaScript de la aplicación tienen sintaxis válida',function(){
  var dirs=['js','lib'];
  dirs.forEach(function(dir){
    fs.readdirSync(path.join(root,dir)).filter(function(n){return /\.js$/.test(n);}).forEach(function(n){
      var file=dir+'/'+n;
      assert.doesNotThrow(function(){new vm.Script(read(file),{filename:file});},file);
    });
  });
});
test('La carga de módulos del HTML respeta el orden de dependencias',function(){
  var scripts=matches(html,/<script\b[^>]*\bsrc="([^"]+)"/g).map(function(x){return x.split('?')[0];});
  function before(a,b){assert(scripts.indexOf(a)>=0 && scripts.indexOf(b)>=0 && scripts.indexOf(a)<scripts.indexOf(b),a+' debe preceder a '+b);}
  before('lib/chess.js','js/game.js');
  before('js/i18n.js','js/app.js');
  before('js/storage.js','js/app.js');
  before('js/board.js','js/appearance.js');
  before('js/editor.js','js/challenges.js');
  before('js/mate-two.js','js/challenges.js');
  before('js/learn.js','js/learn-ui.js');
});
test('La versión del cargador i18n coincide con la del recurso publicado',function(){
  var script=matches(html,/<script\b[^>]*\bsrc="(js\/i18n\.js\?v=[^"]+)"/g)[0];
  assert(script);
  var version=script.split('v=')[1];
  var source=read('js/i18n.js');
  assert(source.indexOf('i18n/es.json?v='+version)>=0);
  assert(source.indexOf('i18n/eu.json?v='+version)>=0);
});
console.log('Hito 10: '+count+' comprobaciones de integridad superadas.');
