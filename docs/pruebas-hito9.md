# Xake — Pruebas manuales Hito 9 (Aprender)

**Dispositivo de referencia:** iPad 3 con Safari iOS 9.  
**Web:** https://xake.osumi.es

## Comprobación automatizada

Desde la raíz del repositorio:

```bash
npm test
```

Deben terminar correctamente las 10 baterías. El archivo `tests/learn.test.js` valida las 15 posiciones de aprendizaje con el motor real y su almacenamiento.

## Comprobaciones en el iPad

1. Abre «Aprender» desde el menú. Deben aparecer 12 ejercicios de piezas y 3 movimientos especiales, con contador `0 de 15` si nunca has hecho ninguno.
2. Abre «Peón · Movimiento», selecciona el peón en `e2`, muévelo a `e4` y comprueba el mensaje de éxito. Vuelve a la lista y revisa la marca de completado.
3. Abre «Caballo · Movimiento», elige el caballo en `b1` e intenta una casilla no permitida. No debe desaparecer ni cambiar de casilla. Después muévelo a `c3`.
4. En «Torre · Captura», usa la pista y comprueba el resaltado de origen y destino. Captura el peón.
5. En «Movimientos especiales», realiza un jaque, después el enroque (rey `e1` → `g1`) y, por último, promociona `g7` → `g8` eligiendo una pieza. No deben quedar piezas fantasma.
6. Cierra Safari, vuelve a abrirlo y entra en «Aprender». Debe conservar el progreso.
7. Cambia el idioma a euskera desde el menú: títulos, descripciones e instrucciones deben traducirse. Vuelve al castellano.
8. Cambia las apariencias de las piezas; confirma que el tablero educativo también las respeta.
9. Abre una partida guardada, entra en «Aprender» y vuelve a «Mis partidas». La partida, las jugadas, las apariencias y los retos deben permanecer intactos.
10. Comprueba que la navegación y los botones se ven completos tanto en horizontal como en vertical.

## Datos y despliegue

- Progreso educativo: `xake:v1:learnProgress`; no borrar `localStorage`.
- Mantener el workflow de GitHub Actions actual; el `push` a `main` ejecutará `npm test` y, si tiene éxito, el despliegue.
- Si la página parece antigua, revisa las versiones `?v=9.0.0` de CSS, JS y JSON.
