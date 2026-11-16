/* global window, Chess */
/* Xake Hitos 5–6: retos de una y dos jugadas, sin DOM ni APIs modernas. ES5. */
(function (root) {
  'use strict';
  var Xake = root.Xake = root.Xake || {};
  var KEY_CHALLENGES = 'xake:v1:challenges';
  var KEY_PROGRESS = 'xake:v1:challengeProgress';
  var GOALS = ['check', 'queen', 'mate', 'mate2'];
  var BUILTIN = [
    { id: 'builtin-check-1', nameKey: 'challenge.preset.check1', goal: 'check', initialFen: '4k3/8/8/8/8/8/8/4K2R w - - 0 1' },
    { id: 'builtin-check-2', nameKey: 'challenge.preset.check2', goal: 'check', initialFen: '4k3/8/8/8/8/8/8/R3K3 w - - 0 1' },
    { id: 'builtin-queen-1', nameKey: 'challenge.preset.queen1', goal: 'queen', initialFen: '4k3/8/8/8/4q3/8/4R3/K7 w - - 0 1' },
    { id: 'builtin-queen-2', nameKey: 'challenge.preset.queen2', goal: 'queen', initialFen: '7k/8/8/4q3/8/5N2/8/4K3 w - - 0 1' },
    { id: 'builtin-mate-1', nameKey: 'challenge.preset.mate1', goal: 'mate', initialFen: '7k/8/5KQ1/8/8/8/8/8 w - - 0 1' },
    { id: 'builtin-mate-2', nameKey: 'challenge.preset.mate2', goal: 'mate', initialFen: 'k7/8/1QK5/8/8/8/8/8 w - - 0 1' }
  ];
  // La colección original se conserva para que las partidas y pruebas del Hito 5 sigan siendo válidas.
  var MULTI_BUILTIN = [
    { id: 'builtin-mate-two-1', nameKey: 'challenge.preset.mateTwo1', goal: 'mate2',
      initialFen: '1k6/3KQ3/8/8/8/8/8/8 w - - 0 1' },
    { id: 'builtin-mate-two-2', nameKey: 'challenge.preset.mateTwo2', goal: 'mate2',
      initialFen: '8/6k1/1R6/8/8/8/2R5/4K3 w - - 0 1' },
    { id: 'builtin-mate-two-3', nameKey: 'challenge.preset.mateTwo3', goal: 'mate2',
      initialFen: '8/8/8/8/8/8/3kq3/1K6 b - - 0 1' }
  ];
  function allBuiltins() { return BUILTIN.concat(MULTI_BUILTIN); }
  function goodId(v) { return typeof v === 'string' && /^[a-z0-9-]{1,80}$/.test(v); }
  function goodName(v) { return typeof v === 'string' && v.length > 0 && v.length <= 60 && !!v.replace(/^\s+|\s+$/g, ''); }
  function goodGoal(v) { return GOALS.indexOf(v) >= 0; }
  function trim(v) { return String(v || '').replace(/^\s+|\s+$/g, ''); }
  function load(key) {
    try { var raw = root.localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
    catch (e) { return null; }
  }
  function write(key, items) {
    try { root.localStorage.setItem(key, JSON.stringify({ schemaVersion: 1, items: items })); return true; }
    catch (e) { return false; }
  }
  function entries(key) {
    var data = load(key);
    return data && data.schemaVersion === 1 && Object.prototype.toString.call(data.items) === '[object Array]' ? data.items : [];
  }
  function chessFor(fen) {
    if (typeof fen !== 'string' || fen.length > 160) { return null; }
    var c = new root.Chess();
    if (!c.load(fen) || c.game_over()) { return null; }
    return c;
  }
  function success(chess, played, goal) {
    if (!played || !goodGoal(goal)) { return false; }
    if (goal === 'queen') { return played.captured === 'q'; }
    // El mate en dos requiere validar una SECUENCIA; no se evalúa con success().
    if (goal === 'mate2') { return false; }
    if (goal === 'mate') { return chess.in_checkmate(); }
    return chess.in_check();
  }
  function solutions(fen, goal) {
    var c = chessFor(fen), all, out = [], i, m, captured, matches;
    var files = 'abcdefgh';
    function square(index) { return files.charAt(index & 7) + String(8 - (index >> 4)); }
    if (!c || !goodGoal(goal)) { return out; }
    if (goal === 'mate2') { return Xake.MateTwo ? Xake.MateTwo.firstMoves(fen) : out; }
    // La búsqueda interna evita recalcular todas las jugadas legales en cada
    // candidato. Es importante para los tableros con muchas reinas del editor.
    all = c.search_moves();
    for (i = 0; i < all.length; i++) {
      m = all[i];
      captured = goal === 'queen' ? c.get(square(m.t)) : null;
      c.search_play(m);
      matches = goal === 'queen' ? !!(captured && captured.type === 'q') :
        goal === 'mate' ? c.in_checkmate() : c.in_check();
      c.search_undo();
      if (matches) {
        out.push({ from: square(m.f), to: square(m.t), promotion: m.promo || null });
      }
    }
    return out;
  }
  function valid(item) {
    if (!item || !goodId(item.id) || !goodName(item.name) || !goodGoal(item.goal) ||
      typeof item.initialFen !== 'string' || !Xake.Editor || !Xake.EditorTools) { return false; }
    // Aplicar también las restricciones del editor al importar JSON externos:
    // los dos reyes, peones, turno inicial y jaques incompatibles.
    var board = Xake.EditorTools.boardFromFen(item.initialFen);
    if (!board) { return false; }
    var e = new Xake.Editor(), scenario = {
      id: 'scenario-validation', name: 'Validación', initialFen: item.initialFen,
      whiteArmySnapshot: Xake.EditorTools.pieceCounts(board, 'w'),
      blackArmySnapshot: Xake.EditorTools.pieceCounts(board, 'b')
    };
    if (!e.loadScenario(scenario)) { return false; }
    var state = e.validate().state;
    return (state === 'valid' || state === 'warning') && solutions(item.initialFen, item.goal).length > 0;
  }
  function custom() {
    var items = entries(KEY_CHALLENGES), out = [], i;
    for (i = 0; i < items.length; i++) { if (valid(items[i])) { out.push(items[i]); } }
    return out;
  }
  function all() { return allBuiltins().concat(custom()); }
  function save(item) {
    if (!valid(item) || allBuiltins().some(function (v) { return v.id === item.id; })) { return false; }
    var items = custom(), i, updated = false;
    for (i = 0; i < items.length; i++) { if (items[i].id === item.id) { items[i] = item; updated = true; break; } }
    if (!updated) { items.push(item); }
    return write(KEY_CHALLENGES, items);
  }
  function remove(id) {
    var existing = custom(), next = [], i;
    for (i = 0; i < existing.length; i++) { if (existing[i].id !== id) { next.push(existing[i]); } }
    return next.length < existing.length && write(KEY_CHALLENGES, next);
  }
  function createFromScenario(scenario, goal, name) {
    if (!scenario || typeof scenario.initialFen !== 'string' || !goodGoal(goal) || !goodName(trim(name))) { return null; }
    // La validación estructural de escenarios conserva las reglas del editor.
    var editor = new Xake.Editor();
    if (!editor.loadScenario(scenario)) { return null; }
    var validation = editor.validate();
    if (validation.state === 'terminal' || validation.state === 'error' || !solutions(scenario.initialFen, goal).length) { return null; }
    return { id: 'challenge-' + Date.now() + '-' + Math.floor(Math.random() * 1000000),
      name: trim(name), initialFen: scenario.initialFen, goal: goal, sourceScenarioId: scenario.id,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }
  function progress() {
    var raw = entries(KEY_PROGRESS), result = {}, i, p;
    for (i = 0; i < raw.length; i++) {
      p = raw[i];
      if (p && goodId(p.id) && typeof p.bestStars === 'number' && p.bestStars >= 1 && p.bestStars <= 3) { result[p.id] = p; }
    }
    return result;
  }
  function markSolved(id, stars) {
    if (!goodId(id) || typeof stars !== 'number' || stars < 1 || stars > 3) { return false; }
    var items = entries(KEY_PROGRESS), i, p, found = false;
    for (i = 0; i < items.length; i++) {
      p = items[i];
      if (p && p.id === id) {
        p.bestStars = Math.max(p.bestStars || 0, stars);
        p.completed = (p.completed || 0) + 1;
        p.solvedAt = new Date().toISOString(); found = true; break;
      }
    }
    if (!found) { items.push({ id: id, bestStars: stars, completed: 1, solvedAt: new Date().toISOString() }); }
    return write(KEY_PROGRESS, items);
  }
  function stars(attempts, hintUsed) {
    return hintUsed ? 1 : attempts <= 1 ? 3 : 2;
  }
  Xake.Challenges = {
    builtins: BUILTIN, multiBuiltins: MULTI_BUILTIN, allBuiltins: allBuiltins,
    goals: GOALS, all: all, custom: custom, valid: valid,
    solutions: solutions, success: success, createFromScenario: createFromScenario,
    save: save, remove: remove, progress: progress, markSolved: markSolved, stars: stars,
    storageKeys: { challenges: KEY_CHALLENGES, progress: KEY_PROGRESS }
  };
}(typeof window !== 'undefined' ? window : this));
