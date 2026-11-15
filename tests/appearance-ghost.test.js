/* Regresión del Hito 4: las imágenes no deben persistir en casillas vacías.
 * Prueba los módulos reales de tablero, motor y apariencias, sin DOM externo. */
'use strict';
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var passed = 0;

function test(name, fn) {
  fn();
  passed++;
  console.log('✓ ' + name);
}
function Element(tag) {
  this.tagName = tag;
  this.children = [];
  this.attributes = {};
  this.style = {};
  this.className = '';
  this.textContent = '';
  this.clientWidth = 490;
  this.innerHTML = '';
}
Element.prototype.appendChild = function (child) {
  this.children.push(child);
  return child;
};
Element.prototype.setAttribute = function (key, value) {
  this.attributes[key] = value;
};
Element.prototype.removeAttribute = function (key) {
  delete this.attributes[key];
};

var document = {
  readyState: 'loading',
  createElement: function (tag) { return new Element(tag); },
  getElementById: function () { return null; },
  querySelector: function () { return null; },
  addEventListener: function () {}
};
var preferences = { whiteAppearance: 'emblemas', blackAppearance: 'emblemas' };
var window = {
  document: document,
  addEventListener: function () {},
  setTimeout: function () {},
  Xake: {
    I18n: { t: function (key) { return key; } },
    Storage: {
      preferences: function () { return preferences; },
      savePreferences: function (p) { preferences = p; return true; },
      saveGame: function () { return true; }
    }
  }
};
var context = vm.createContext({
  window: window, document: document, Math: Math, Date: Date,
  JSON: JSON, Object: Object, Array: Array, isFinite: isFinite
});
function load(file) {
  var full = path.join(__dirname, '..', file);
  vm.runInContext(fs.readFileSync(full, 'utf8'), context, { filename: file });
}
load('lib/chess.js');
context.Chess = window.Chess;
load('js/game.js');
load('js/board.js');
load('js/appearance.js');
var Xake = window.Xake;
function cell(board, square) {
  for (var r = 0; r < 8; r++) {
    for (var f = 0; f < 8; f++) {
      if (board.squareFor(r, f) === square) { return board.squares[r * 8 + f].piece; }
    }
  }
  throw new Error('Casilla desconocida: ' + square);
}
function image(board, square) { return cell(board, square).style.backgroundImage; }
function newBoard() { return new Xake.Board(new Element('div'), function () {}); }
function render(board, game) { board.render(game, null, [], null); }

test('Un peón blanco deja libre su casilla de origen con emblemas', function () {
  var game = new Xake.Game();
  var board = newBoard();
  render(board, game);
  assert(image(board, 'e2').indexOf('emblemas/wp.png') >= 0);
  assert(game.move('e2', 'e4'));
  render(board, game);
  assert.strictEqual(game.engine.get('e2'), null);
  assert.strictEqual(image(board, 'e2'), 'none');
  assert.strictEqual(cell(board, 'e2').textContent, '');
  assert(image(board, 'e4').indexOf('emblemas/wp.png') >= 0);
});

test('El peón negro tampoco deja un fantasma tras su movimiento', function () {
  var game = new Xake.Game();
  var board = newBoard();
  render(board, game);
  game.move('d2', 'd4');
  game.move('b7', 'b6');
  render(board, game);
  assert.strictEqual(image(board, 'b7'), 'none');
  assert(image(board, 'b6').indexOf('emblemas/bp.png') >= 0);
  assert.strictEqual(image(board, 'd2'), 'none');
});

test('Cambiar a Clásico elimina emblemas incluso en casillas vacías', function () {
  var game = new Xake.Game();
  var board = newBoard();
  render(board, game);
  game.move('e2', 'e4');
  render(board, game);
  game.whiteAppearance = 'classic';
  render(board, game);
  assert.strictEqual(image(board, 'e2'), 'none');
  assert.strictEqual(image(board, 'e4'), 'none');
  assert(cell(board, 'e4').textContent.length > 0);
});

test('Cambiar de Emblemas a Medallas y viceversa limpia los fondos anteriores', function () {
  var game = new Xake.Game();
  var board = newBoard();
  render(board, game);
  game.whiteAppearance = 'medallas';
  render(board, game);
  assert(image(board, 'e2').indexOf('medallas/wp.png') >= 0);
  game.whiteAppearance = 'emblemas';
  render(board, game);
  assert(image(board, 'e2').indexOf('emblemas/wp.png') >= 0);
  game.move('e2', 'e4');
  render(board, game);
  assert.strictEqual(image(board, 'e2'), 'none');
});

test('Deshacer limpia el destino y restaura origen con su apariencia', function () {
  var game = new Xake.Game();
  var board = newBoard();
  render(board, game);
  game.move('e2', 'e4');
  render(board, game);
  game.undo();
  render(board, game);
  assert.strictEqual(image(board, 'e4'), 'none');
  assert(image(board, 'e2').indexOf('emblemas/wp.png') >= 0);
});

test('El editor elimina el fondo cuando se retira una pieza', function () {
  var board = newBoard();
  var pieces = { a1: { color: 'w', type: 'r' } };
  var editor = { get: function (sq) { return pieces[sq] || null; } };
  board.renderEditor(editor, null);
  assert(image(board, 'a1').indexOf('emblemas/wr.png') >= 0);
  delete pieces.a1;
  board.renderEditor(editor, null);
  assert.strictEqual(image(board, 'a1'), 'none');
  assert.strictEqual(cell(board, 'a1').textContent, '');
});

test('Mover piezas en el editor deja vacía la casilla anterior', function () {
  var board = newBoard();
  var pieces = { a1: { color: 'w', type: 'r' } };
  var editor = { get: function (sq) { return pieces[sq] || null; } };
  board.renderEditor(editor, null);
  pieces.a2 = pieces.a1;
  delete pieces.a1;
  board.renderEditor(editor, null);
  assert.strictEqual(image(board, 'a1'), 'none');
  assert(image(board, 'a2').indexOf('emblemas/wr.png') >= 0);
});

test('Girar el tablero no conserva una imagen en la casilla visual anterior', function () {
  var game = new Xake.Game();
  var board = newBoard();
  render(board, game);
  game.move('e2', 'e4');
  board.flip();
  render(board, game);
  assert.strictEqual(image(board, 'e2'), 'none');
  assert(image(board, 'e4').indexOf('emblemas/wp.png') >= 0);
});
test('Una captura actualiza destino y limpia el origen de la atacante', function () {
  var game = new Xake.Game();
  var board = newBoard();
  render(board, game);
  game.move('e2', 'e4');
  game.move('d7', 'd5');
  game.move('e4', 'd5');
  render(board, game);
  assert.strictEqual(image(board, 'e4'), 'none');
  assert.strictEqual(image(board, 'd7'), 'none');
  assert(image(board, 'd5').indexOf('emblemas/wp.png') >= 0);
});

test('Capturar al paso limpia también la casilla del peón capturado', function () {
  var game = new Xake.Game({
    initialFen: '4k3/3p4/8/4P3/8/8/8/4K3 b - - 0 1'
  });
  var board = newBoard();
  render(board, game);
  assert(game.move('d7', 'd5'));
  render(board, game);
  assert(game.move('e5', 'd6'));
  render(board, game);
  assert.strictEqual(image(board, 'd5'), 'none');
  assert.strictEqual(image(board, 'e5'), 'none');
  assert(image(board, 'd6').indexOf('emblemas/wp.png') >= 0);
});

test('El enroque no deja fondos de rey ni torre en sus casillas iniciales', function () {
  var game = new Xake.Game({
    initialFen: 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'
  });
  var board = newBoard();
  render(board, game);
  assert(game.move('e1', 'g1'));
  render(board, game);
  assert.strictEqual(image(board, 'e1'), 'none');
  assert.strictEqual(image(board, 'h1'), 'none');
  assert(image(board, 'g1').indexOf('emblemas/wk.png') >= 0);
  assert(image(board, 'f1').indexOf('emblemas/wr.png') >= 0);
});

test('Promocionar reemplaza el emblema del peón y limpia su origen', function () {
  var game = new Xake.Game({
    initialFen: '4k3/P7/8/8/8/8/8/4K3 w - - 0 1'
  });
  var board = newBoard();
  render(board, game);
  assert(game.move('a7', 'a8', 'q'));
  render(board, game);
  assert.strictEqual(image(board, 'a7'), 'none');
  assert(image(board, 'a8').indexOf('emblemas/wq.png') >= 0);
});

console.log('Regresión de piezas fantasma: ' + passed + ' pruebas superadas.');
