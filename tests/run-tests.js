/* Xake: ejecutor de TODAS las pruebas, sin dependencias npm. */
'use strict';

var fs = require('fs');
var path = require('path');
var spawnSync = require('child_process').spawnSync;
var ROOT = path.resolve(__dirname, '..');
var TESTS = path.join(ROOT, 'tests');

function discover(dir) {
  var out = [];
  fs.readdirSync(dir).sort().forEach(function (name) {
    var full = path.join(dir, name);
    var stat = fs.statSync(full);
    if (stat.isDirectory()) {
      out = out.concat(discover(full));
    } else if (stat.isFile() && /\.test\.js$/.test(name)) {
      out.push(full);
    }
  });
  return out;
}

function main() {
  var tests = discover(TESTS);
  var passed = 0, failed = [], i, file, result, started = Date.now();
  if (!tests.length) {
    console.error('Xake: no se encontraron archivos *.test.js en tests/.');
    return 1;
  }
  console.log('\nXake · Batería completa (' + tests.length + ' archivos)\n');
  for (i = 0; i < tests.length; i++) {
    file = path.relative(ROOT, tests[i]);
    console.log('\n[' + (i + 1) + '/' + tests.length + '] ' + file);
    result = spawnSync(process.execPath, [tests[i]], { cwd: ROOT, stdio: 'inherit' });
    if (!result.error && result.status === 0) {
      passed++;
    } else {
      failed.push(file);
      if (result.error) { console.error('Error al iniciar: ' + result.error.message); }
      else { console.error('Error en ' + file + ' (código ' + result.status + ')'); }
    }
  }
  console.log('\n----------------------------------------');
  console.log('Resultado: ' + passed + '/' + tests.length + ' archivos correctos. Tiempo: ' + ((Date.now()-started)/1000).toFixed(2) + 's.');
  if (failed.length) {
    console.error('Han fallado: ' + failed.join(', '));
    return 1;
  }
  console.log('Todas las pruebas han pasado.');
  return 0;
}
process.exitCode = main();
