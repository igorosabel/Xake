# Xake — Comprobaciones manuales del pulido visual

## Instalación

1. Descomprimir el ZIP en la **raíz del repositorio Xake**.
2. Ejecutar una sola vez `python instalar_pulido.py` desde esa raíz. Requiere Python 3 y actualiza solo `index.html`, `js/appearance.js`, `js/i18n.js` y los dos JSON de traducciones; los demás archivos viajan listos en `js/`, `css/`, `tests/`, `docs/`.
3. Ejecutar `npm test`. El resultado esperado en esta versión es 13 archivos de pruebas correctos, 213 comprobaciones individuales.
4. Revisar `git diff`. Se puede borrar `instalar_pulido.py` del repositorio local antes del commit: no se necesita en producción.
5. Hacer commit/push a `main`, tras lo que el workflow existente ejecutará tests y despliegue.

## Prueba en el iPad 3

- [ ] En Inicio ya no aparecen las dos frases antiguas ni el aviso de «Próximamente». Existe el botón Configuración.
- [ ] En Configuración aparecen Idioma y Apariencia, guardan sus valores tras cerrar y reabrir Safari.
- [ ] En una partida nueva se heredan esas apariencias. Si se cambia la apariencia dentro de la partida, la opción predeterminada en Configuración **no cambia**.
- [ ] La columna lateral presenta inicialmente solo tres pestañas iconográficas: Controles, Apariencia y Ajustes. La primera está seleccionada.
- [ ] En Ajustes de partida, al marcar Capturadas y Movimientos aparecen sendas pestañas; al desmarcar la pestaña activa, vuelve a Ajustes. La elección persiste al recargar.
- [ ] Las piezas capturadas y movimientos continúan actualizándose, y no se borran al ocultar la pestaña.
- [ ] En el editor de ejército, `+` y `−` están bien centrados y Cargar/Eliminar se habilitan solo después de elegir un ejército guardado.
- [ ] En Mis tableros, jugar (2 botones) a la izquierda; edición, duplicación y borrado (3 iconos) a la derecha. Comprobar que los botones siguen funcionando.
- [ ] Importar copia desactivado con el área vacía o con espacios; activado tras pegar texto.
- [ ] Guardar reto desactivado mientras falten nombre, escenario o objetivo. Se activa cuando los tres son válidos.
- [ ] En Configuración, restablecer puntuaciones de Retos pide confirmación, elimina las estrellas y **no** elimina retos propios. Cancelar no cambia nada.
- [ ] En Mis partidas: Continuar a la izquierda, renombrar y borrar a la derecha como iconos. Comprobar una partida existente.
- [ ] Cambiar Español ↔ Euskara en Configuración y revisar títulos de pestañas, botones y ayudas.
- [ ] Comprobar la misma distribución en un móvil estrecho, permitiendo que las acciones salten de línea si no caben.

## Si aparece un error

No borrar `localStorage`: contiene los datos de los niños. Anotar navegador, pantalla, acción, traducción y captura de pantalla. Se conservan los formatos de almacenamiento del Hito 10.
