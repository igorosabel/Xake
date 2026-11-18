/* Regression: pawn direction and promotion after moving a knight. Node, no deps. */
'use strict';
var assert = require('assert');
var Chess = require('../lib/chess.js').Chess;
var n = 0;
function test(title, callback) { callback(); n++; console.log('✓ ' + title); }
function moves(c, from) { return c.moves({ square: from, verbose: true }); }
function to(movesArray) { return movesArray.map(function (m) { return m.to; }); }

test('White pawn g2 cannot retreat to g1 after the white knight jumps away', function () {
  var c = new Chess();
  assert(c.move({ from: 'g1', to: 'f3' }));
  assert(c.move({ from: 'g8', to: 'f6' }));
  var fen = c.fen(), possible = moves(c, 'g2');
  assert.deepStrictEqual(to(possible), ['g3', 'g4']);
  assert(!to(possible).includes('g1'));
  assert.strictEqual(c.move({ from: 'g2', to: 'g1', promotion: 'q' }), null);
  assert.strictEqual(c.fen(), fen);
  assert.strictEqual(c.get('g2').type, 'p');
  assert.strictEqual(c.get('g1'), null);
});

test('Black pawn g7 cannot retreat to g8 when the knight has left g8', function () {
  var c = new Chess();
  assert(c.move({ from: 'g1', to: 'f3' }));
  assert(c.move({ from: 'g8', to: 'f6' }));
  assert(c.move({ from: 'b1', to: 'c3' }));
  var fen = c.fen(), options = moves(c, 'g7');
  assert.deepStrictEqual(to(options), ['g6', 'g5']);
  assert.strictEqual(c.move({ from: 'g7', to: 'g8', promotion: 'q' }), null);
  assert.strictEqual(c.fen(), fen);
});

test('A2/A1 white and h7/h8 black never promote towards their own home rank', function () {
  var c = new Chess('4k3/7p/8/8/8/8/P7/4K3 w - - 0 1');
  assert.strictEqual(c.move({ from: 'a2', to: 'a1', promotion: 'q' }), null);
  assert(c.move({ from: 'a2', to: 'a4' }));
  assert.strictEqual(c.move({ from: 'h7', to: 'h8', promotion: 'q' }), null);
  assert(c.get('h7') && c.get('h7').type === 'p');
});

test('Legal forward moves, captures, and two-square advances still work', function () {
  var c = new Chess();
  assert(c.move({ from: 'e2', to: 'e4' }));
  assert(c.move({ from: 'd7', to: 'd5' }));
  var m = c.move({ from: 'e4', to: 'd5' });
  assert(m && m.captured === 'p');
  assert.strictEqual(c.get('d5').color, 'w');
});

test('White pawn still promotes only when advancing to rank 8', function () {
  var c = new Chess('k7/6P1/8/8/8/8/8/7K w - - 0 1');
  var options = moves(c, 'g7');
  assert.strictEqual(options.filter(function (m) { return m.to === 'g8' && m.promotion; }).length, 4);
  assert(c.move({ from: 'g7', to: 'g8', promotion: 'n' }));
  assert.strictEqual(c.get('g8').type, 'n');
});

test('Black pawn still promotes only when advancing to rank 1', function () {
  var c = new Chess('4k3/8/8/8/8/8/6p1/4K3 b - - 0 1');
  assert.strictEqual(moves(c, 'g2').filter(function (m) { return m.to === 'g1' && m.promotion; }).length, 4);
  assert(c.move({ from: 'g2', to: 'g1', promotion: 'q' }));
  assert.strictEqual(c.get('g1').color, 'b');
  assert.strictEqual(c.get('g1').type, 'q');
});

test('Internal AI move generation respects pawn direction', function () {
  var c = new Chess();
  assert(c.move({ from: 'g1', to: 'f3' }));
  assert(c.move({ from: 'g8', to: 'f6' }));
  var list = c.search_moves(), fromG2 = 6 * 16 + 6, toG1 = 7 * 16 + 6;
  assert(!list.some(function (m) { return m.f === fromG2 && m.t === toG1; }));
});

console.log('Peones: ' + n + ' pruebas superadas.');
