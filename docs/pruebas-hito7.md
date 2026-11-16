# Xake — Pruebas del Hito 7

## Pruebas automatizadas

Desde la raíz del proyecto:

```bash
npm test
```

No necesitas instalar librerías. El ejecutor detectará las pruebas de futuros hitos sin actualizar esta lista.
Resultado previsto: **8 archivos correctos, 131 pruebas**.

## Comprobaciones manuales

### Partida clásica

1. Iniciar una partida nueva para dos jugadores. Comprobar que las tres ayudas aparecen activadas.
2. Realizar `e2-e4`, `d7-d5` y `e4xd5`. Debe aparecer un peón negro bajo «Capturadas por las blancas».
3. Deshacer la captura: debe desaparecer el peón capturado. Rehacer una captura y salir/continuar la partida: debe mantenerse el panel.
4. Cambiar entre Clásico, Medallas y Emblemas en los selectores; las piezas capturadas deberán actualizarse y no quedar imágenes fantasma.
5. Desactivar cada ayuda visual por separado y comprobar que no se altera la legalidad de los movimientos.
6. Salir al menú y reanudar: las opciones escogidas deben persistir. Reiniciar: las capturas deben desaparecer.

### Compatibilidad con escenarios y retos

7. Iniciar una partida con un tablero personalizado que contenga varias reinas y realizar capturas repetidas. El contador `×N` debe crecer correctamente.
8. Entrar en un reto y en el editor: deben respetarse las ayudas visuales (coordenadas y resaltes), sin bloquear la interacción táctil.
9. Cambiar el idioma a euskera y volver al juego: comprobar las traducciones de ayudas y capturas. Cambiar de nuevo a castellano.
10. Probar orientación horizontal en el iPad 3 y vertical en móvil: no debe existir desbordamiento horizontal; si los paneles no caben verticalmente, debe poderse desplazar la página.

### Datos

11. Sin borrar `localStorage`, comprobar que se conservan ejércitos, tableros, partidas y retos anteriores.
12. Verificar que `npm test` funciona en Windows desde la raíz del proyecto y devuelve un código de error si falla algún test.

**Nota:** la exportación JSON de Xake no incluye estas preferencias, igual que no incluye la partida activa; las preferencias permanecen solo en este navegador/dispositivo.
