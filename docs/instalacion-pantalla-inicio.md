# Xake · Instalación en pantalla de inicio (iOS 9, iOS actual y Android)

## Alcance

- Se puede añadir Xake a la pantalla de inicio con el icono propio en iPad 3 con Safari/iOS 9, en iPhone modernos y en navegadores Android compatibles.
- Safari iOS 9 usa las etiquetas de Apple, no el manifiesto moderno. El iPad 3 (Retina) recibe `apple-touch-icon-152.png`.
- Los navegadores modernos utilizan `assets/manifest.json` y los iconos de 192, 512 y 512 maskable.
- `apple-mobile-web-app-capable=yes` activa el modo independiente de Safari en iOS antiguo.
- Sin *service worker* ni funcionamiento offline; seguimos con la estrategia segura de actualizar en cada despliegue.

## Archivos entregados

- `index.html`: enlaces y metadatos nuevos en `<head>`; no se modifican pantallas ni JS.
- `assets/manifest.json`: manifiesto para navegadores modernos.
- `assets/icons/`: PNG de Apple 76, 120, 152, 167 y 180 px; PNG generales de 192 y 512 px; icono maskable de 512 px; favicon ICO y PNG.
- `tests/installability.test.js`: verificaciones automatizadas de manifest, HTML y dimensiones PNG.
- `README.md`: instrucciones de instalación.

El workflow `.github/workflows/deploy.yml` existente ya incluye `assets`, por lo que no hay que modificarlo. No se han tocado las claves `localStorage`, los datos, las partidas, los retos ni la IA.

## Comprobación

1. Copiar el contenido del ZIP sobre la raíz de `Xake`.
2. Ejecutar `npm test` y verificar que GitHub Actions despliega al subir a `main`.
3. Visitar `https://xake.osumi.es/assets/manifest.json` y comprobar que devuelve JSON, no un 404.
4. En iPad 3: abrir Safari → Compartir → Añadir a pantalla de inicio. El icono debe mostrar un caballo dorado sobre verde oscuro. Abrir desde el icono y comprobar menús, partidas y pruebas.
5. En iPhone moderno: utilizar Compartir → Añadir a pantalla de inicio, marcar "Abrir como app" si existe.
6. En Chrome de Android: menú → Instalar aplicación/Añadir a pantalla de inicio. Comprobar el icono y el modo de pantalla independiente.
7. Comprobar la recarga de la versión nueva después de un despliegue normal (requiere conexión).

## Atención: partidas y almacenamiento

Las apps añadidas en la pantalla de inicio de iOS pueden utilizar un almacenamiento distinto de Safari. Si una partida está guardada en Safari, es posible que no aparezca dentro de la web-app lanzada desde el icono. **No implica que la partida se haya borrado**: permanece en el navegador donde estaba guardada.

Conviene conservar la copia JSON de ejércitos, tableros y retos creados. Esa copia **no incluye las partidas**, según el diseño actual de Xake. No borrar datos del sitio ni desinstalar la web-app si contiene progresos que se quieran conservar.

## Nota para el servidor

Se ha elegido `assets/manifest.json` (extensión JSON) para facilitar su servicio en Plesk. La URL de inicio y el ámbito son `/` porque el sitio ocupa el subdominio `xake.osumi.es`. Los archivos PNG se sirven como `image/png`.
