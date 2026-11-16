# Xake — Pruebas manuales del Hito 8 (varias partidas)

**Preparación:** publicar el contenido del ZIP sobre Xake y abrir desde `https://xake.osumi.es` en el iPad 3. No borrar la caché de datos del sitio ni `localStorage`; los JS actualizados incluyen `?v=8.0.0`.

## Pruebas automatizadas

Desde la raíz del repositorio:

```bash
npm test
```

Resultado esperado: **9/9 archivos, 155 pruebas superadas**, sin instalar dependencias.

## Pruebas funcionales en el iPad 3

1. **Migración:** si había una partida guardada del Hito 7, entrar en **Mis partidas**: debe aparecer sin perder jugadas ni apariencia, y poder reanudarse.
2. **Crear:** jugar una partida clásica, mover un peón, volver a menú; crear otra partida clásica distinta y realizar una jugada diferente. Ambas deben figurar en «Mis partidas».
3. **Alternar:** continuar la primera y comprobar sus movimientos; volver y abrir la segunda, comprobando que el historial es distinto.
4. **Renombrar:** cambiar el nombre desde la biblioteca; continuar la partida, cambiar el nombre desde el juego y regresar para verificarlo.
5. **Borrar:** eliminar una de las partidas previa confirmación. Comprobar que la otra sigue disponible y que «Continuar partida» abre la última seleccionada.
6. **Contra la IA:** crear una nueva partida contra la máquina, cambiar color y dificultad, guardar y continuarla. Verificar que recupera el turno y los ajustes.
7. **Partida personalizada:** iniciar desde «Mis tableros», jugar y guardar; eliminar el tablero origen y comprobar que la partida guardada continúa usando el FEN original.
8. **Apariencias:** cambiar Clásico/Medallas/Emblemas en una partida; abrir otra con una apariencia distinta; al regresar se deben recuperar independientemente.
9. **Final de partida:** al terminar en mate o tablas, «Mis partidas» debe indicar **Finalizada**, sin impedir ver la posición al continuarla.
10. **Persistencia:** cerrar Safari y volver a abrir. Confirmar nombres, partidas, avances, apariencia y última seleccionada.
11. **Aspecto:** comprobar «Mis partidas» en horizontal y vertical, sin botones inaccesibles ni desplazamiento horizontal.
12. **Idiomas:** alternar español/euskera y comprobar los textos nuevos.

## Errores de almacenamiento

Las pruebas automáticas ya simulan fallo de cuota en la migración, en guardado nuevo, en renombrado y en borrado. No es necesario borrar datos reales ni forzar fallos en el iPad para verificarlos.

**Nota:** la copia de seguridad JSON actual solo incluye ejércitos, tableros y retos: todavía no exporta las partidas de la biblioteca. Evitar borrar datos del sitio, porque `localStorage` es el único almacenamiento de partidas.
