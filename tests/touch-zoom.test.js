/* Zoom guards should never cancel single-finger board selection. ES5 source. */
'use strict';
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var root = path.join(__dirname, '..');
var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
var boardCss = fs.readFileSync(path.join(root, 'css/board.css'), 'utf8');
var js = fs.readFileSync(path.join(root, 'js/touch-guard.js'), 'utf8');
var docEvents = {}, boardEvents = {}, tests = 0;
function test(title, fn) { fn(); tests++; console.log('✓ ' + title); }
var shell = { addEventListener: function (type, cb) { boardEvents[type] = cb; } };
var document = {
  readyState: 'complete',
  addEventListener: function (type, cb) { docEvents[type] = cb; },
  querySelector: function (query) { return query === '.app-shell' ? shell : null; }
};
var win = { document: document };
vm.runInNewContext(js, { window: win, document: document }, { filename: 'js/touch-guard.js' });
function event(n) {
  return { touches: Array(n), cancelable: true, canceled: false,
    preventDefault: function () { this.canceled = true; } };
}

test('The HTML disables pinch/double-tap zoom in iOS 9 viewport', function () {
  assert(/<meta\s+name="viewport"\s+content="[^"]*user-scalable=no/.test(html));
  assert(/maximum-scale=1/.test(html));
  assert(/minimum-scale=1/.test(html));
});
test('Board uses touch-action manipulation and assets are versioned', function () {
  assert(/\.chess-board, \.board-square\s*\{[^}]*touch-action: manipulation/.test(boardCss));
  assert(html.indexOf('css/board.css?v=13.0.0') >= 0);
  assert(html.indexOf('js/touch-guard.js?v=13.0.0') >= 0);
  assert(html.indexOf('lib/chess.js?v=13.0.0') >= 0);
});
test('One-finger touchstart is not prevented', function () {
  var e = event(1); boardEvents.touchstart(e);
  assert.strictEqual(e.canceled, false);
});
test('One-finger touchmove is not prevented', function () {
  var e = event(1); boardEvents.touchmove(e);
  assert.strictEqual(e.canceled, false);
});
test('Two-finger touchstart and touchmove are prevented', function () {
  var e1 = event(2), e2 = event(2);
  boardEvents.touchstart(e1); boardEvents.touchmove(e2);
  assert(e1.canceled && e2.canceled);
});
test('Safari pinch gesturestart/gesturechange are prevented', function () {
  var e1 = event(2), e2 = event(2);
  docEvents.gesturestart(e1); docEvents.gesturechange(e2);
  assert(e1.canceled && e2.canceled);
});
test('Non-cancelable events do not throw and never block click handlers', function () {
  assert.doesNotThrow(function () { docEvents.gesturestart({cancelable:false,preventDefault:function(){throw Error('should not be called');}}); });
  assert.strictEqual(boardEvents.touchend, undefined);
  assert.strictEqual(docEvents.click, undefined);
});
console.log('Táctil: ' + tests + ' pruebas superadas.');
