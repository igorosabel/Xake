# Xake — Pruebas manuales del Hito 3

## Preparación

Publicar los archivos sobre el repositorio actual (no borrar el contenido previo de `localStorage`). Probar desde `https://xake.osumi.es` en ordenador y especialmente en **Safari iOS 9, iPad 3**. Los navegadores conservan datos por origen, de modo que las configuraciones de `localhost` no se trasladan automáticamente a la web pública.

## Comprobaciones esenciales

1. Menú: se ven **Crear tablero** y **Mis tableros**. Los botones clásicos y contra la máquina siguen funcionando.
2. Crear tablero → Paso 1: alternar Blancas/Negras, modificar cantidades; el rey permanece en 1; el total de ambos ejércitos no supera 64 y los peones no superan 48.
3. Guardar un ejército con nombre; cargarlo, cambiar su cantidad, guardarlo de nuevo; guardar copia independiente y eliminarla. Comprobar que se puede reutilizar en cualquiera de los bandos.
4. Paso 2: tocar pieza y casilla vacía para colocar; repetir toques sin volver a seleccionar; tocar pieza colocada y casilla vacía para mover; tocar **Retirar**. No hay drag-and-drop.
5. Deshacer y Rehacer diversas acciones; Vaciar tablero con confirmación. Verificar que los contadores reflejan las piezas realmente colocadas.
6. Pulsar **Distribuir automáticamente** con inventario clásico: 32 piezas en su disposición normal. El escenario personalizado desactiva el enroque inicial (por diseño).
7. Crear ejemplo extremo: Blancas `1 rey + 15 reinas`, Negras `1 rey + 15 peones`, pulsar distribuir. Comprobar que se ocupa un total de 32 casillas y la validación lo acepta; si una distribución compleja no fuese válida, se puede colocar manualmente.
8. Paso 3: cambiar quién empieza y comprobar la validación. Un tablero incompleto no se guarda; un tablero de dos reyes se guarda como terminal, pero no se puede jugar. Verificar que un jaque al rey del jugador que *no* mueve es un error.
9. Guardar tablero: aparece en **Mis tableros**. Editar, duplicar, renombrar (editar y guardar con otro nombre) y eliminar la copia. El original debe mantenerse.
10. Empezar una partida desde un tablero guardado con dos personas. Mover, deshacer, reiniciar: debe reaparecer la **posición personalizada** en lugar de la clásica.
11. Guardar y salir, volver a abrir Safari y continuar: mantiene FEN original, nombre y jugadas. Eliminar el tablero del que nació la partida no impide continuarla.
12. Jugar el tablero contra la máquina con blancas y negras, en niveles 1 y 4. En el iPad comprobar que no se bloquea ni muestra pantalla en blanco mientras calcula.
13. Cambiar de castellano a euskera. Verificar textos nuevos de editor, biblioteca y avisos, y que la preferencia se conserva al volver a abrir Safari.
14. Abrir en móvil vertical: tablero y controles visibles, sin desplazamiento horizontal. En iPad horizontal: tablero a la izquierda, controles a la derecha, botones accesibles.
15. Comprobar que los tableros del Hito 3 no hacen desaparecer ni inutilizan la partida clásica o la modalidad contra la máquina.

## Ejecución automatizada (en ordenador)

```bash
node tests/chess.test.js
node tests/ai.test.js
node tests/editor.test.js
```

Las pruebas automatizadas cubren movimientos, IA, inventarios, FEN, posiciones incoherentes, terminales, 15 reinas contra 15 peones, persistencia compatible y reinicio. No sustituyen una prueba real en Safari iOS 9.

## Notas

- La distribución automática hace un esfuerzo acotado. No garantiza encontrar una solución para todo inventario posible.
- **Una única partida activa** se conserva en este hito. La biblioteca de varias partidas y exportación/importación se abordarán después.
- Si no se puede escribir `localStorage`, debe mostrarse un aviso, pero el juego ha de seguir funcionando.
- No utilizar `file://`: se necesita HTTP(S) para los JSON de idiomas y el Web Worker.
