# Xake - icono de iPad iOS 9 y barra de estado iOS 27 (correccion experimental)

Fecha: 16/11/2026. Partimos de `main` publicado tras los cambios de instalacion.

## Problemas comunicados

- iPad 3 / Safari iOS 9: el PNG `assets/icons/apple-touch-icon-152.png` se ve si se abre directamente, pero "Añadir a pantalla de inicio" usa una miniatura de la web.
- iPhone / iOS 27.2.1: Safari deja una franja clara sobre la cabecera; la app instalada sustituye esa franja por un difuminado. Las capturas confirman que no es un gradiente del CSS de Xake.

## Cambio 1: iconos clasicos en la raiz

Apple indica que los Web Clips pueden buscar el nombre `apple-touch-icon.png` en la raiz. Se incorporan tres ficheros PNG RGB: `apple-touch-icon.png` (180), `apple-touch-icon-precomposed.png` (180) y `apple-touch-icon-152x152.png` (152). El HTML ahora enlaza las rutas absolutas; las otras variantes de `assets/icons` y el manifiesto siguen intactos.

**Importante:** iOS 9 ha tenido informes de fallos con estos iconos aun cuando las etiquetas y rutas son validas. Esta es una ruta alternativa para aumentar compatibilidad, no una garantia de corregir Safari.

## Cambio 2: tratamiento de la franja superior iOS 27

Se anade un elemento DOM sin interaccion ni contenido y `css/ios-home.css`, limitado con reglas `@supports` a WebKit compatible con `env(safe-area-inset-top)`. Es una mitigacion experimental basada en la observacion de que WebKit puede tomar el color del fondo de un elemento fijo al borde superior. El elemento es de 6 px de alto, fondo `#254638` y `pointer-events: none`. No modifica la disposicion del tablero y Safari iOS 9 no deberia aplicar el CSS moderno.

**Limite:** la franja del reloj pertenece a iOS; la web no puede recuperar esos pixeles ni garantizar eliminar el difuminado. Ver https://bugs.webkit.org/show_bug.cgi?id=317153 y https://modernwebweekly.substack.com/p/so-whats-up-with-the-ios27-blur

## GitHub Actions

Se actualizan la lista `source` y la validacion previa en `.github/workflows/deploy.yml` para publicar tambien los tres archivos de la raiz. Sin este paso los PNG podrian existir en GitHub pero no en Plesk. Se mantienen los mismos 4 secrets, las pruebas y `rm: false`.

## Comprobaciones

1. `npm test` debe pasar todas las baterias, incluida `tests/ios-home-compat.test.js`.
2. Publicar en `main` (el workflow debe desplegar los nuevos PNG de la raiz).
3. Abrir `https://xake.osumi.es/apple-touch-icon.png` y `https://xake.osumi.es/apple-touch-icon-152x152.png` en el iPad y comprobar que se ven.
4. En Safari iOS 9 abrir `https://xake.osumi.es/?icon=3`, y probar a crear un **nuevo** icono en inicio. No elimines el acceso anterior si contiene partidas que quieras conservar y **no limpies los datos de Safari**.
5. En iPhone probar la web normal y la app **ya instalada**: comprobar si el difuminado cambia. Si no, no intentar CSS invasivo ni `black-translucent`. No borres la app instalada para forzar el cambio si tienes partidas dentro: sus datos locales pueden ser independientes de Safari.
6. Si la franja se ve oscura y el reloj pierde contraste, retirar el enlace a `css/ios-home.css` y el elemento `xake-ios-top-swatch`. Es un ajuste cosmetico reversible.

## Archivos

- `index.html` modificado (etiquetas, hoja CSS, elemento superior).
- `.github/workflows/deploy.yml` modificado (desplegar iconos de raiz).
- `apple-touch-icon.png`, `apple-touch-icon-precomposed.png`, `apple-touch-icon-152x152.png` nuevos.
- `css/ios-home.css`, `tests/ios-home-compat.test.js`, este documento nuevos.
- `tests/installability.test.js` actualizado con las nuevas rutas de iconos.

No se tocan el motor de ajedrez, partidas, preferencias ni datos del usuario.
