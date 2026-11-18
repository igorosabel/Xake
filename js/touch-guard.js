/* global window, document */
/* Xake - evitar zoom por doble toque / pellizco en Safari iOS 9 y moderno.
 * No se cancelan toques de un dedo, clics ni desplazamientos normales. ES5. */
(function (root) {
  'use strict';
  function prevent(event) {
    if (event && event.cancelable !== false && event.preventDefault) {
      event.preventDefault();
    }
  }
  function multipleTouches(event) {
    if (event && event.touches && event.touches.length > 1) { prevent(event); }
  }
  function init() {
    // gesturestart/gesturechange son compatibles con WebKit antiguo, incluido iOS 9.
    document.addEventListener('gesturestart', prevent, false);
    document.addEventListener('gesturechange', prevent, false);
    // En móviles modernos limitar el pellizco a dos dedos sin bloquear los toques
    // con los que los niños eligen y mueven una pieza.
    var shell = document.querySelector('.app-shell');
    if (shell) {
      shell.addEventListener('touchstart', multipleTouches, false);
      shell.addEventListener('touchmove', multipleTouches, false);
    }
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
}(window));
