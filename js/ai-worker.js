/* global importScripts, onmessage, postMessage, Xake */
/* Worker ES5. Las reglas se cargan de la propia aplicación, sin red externa. */
importScripts('../lib/chess.js', 'ai.js');
onmessage = function (event) {
  'use strict';
  var job = event.data, move;
  if (!job || job.type !== 'find' || typeof job.fen !== 'string') { return; }
  try {
    move = Xake.AI.compute(job.fen, job.level, function (partial, depth) {
      postMessage({ type: 'progress', depth: depth, move: partial });
    }, job.budget);
    postMessage({ type: 'result', move: move });
  } catch (e) {
    postMessage({ type: 'result', move: null, error: String(e && e.message || e) });
  }
};
