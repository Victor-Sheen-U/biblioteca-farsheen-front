# Accesibilidad — Biblioteca farsheen

El frontend incluye un menú flotante de accesibilidad (`CTRL+U`) accesible desde cualquier página (inicio, catálogo, detalle, login, reservas y administración) y desde el enlace **Accesibilidad** en el pie de página.

## Funciones disponibles (A1–A13)

| Código | Función | Comportamiento |
|---|---|---|
| A1 | Contraste + | Ciclo `normal` → `alto claro` → `alto oscuro` (contraste AAA ≥ 7:1 sobre tokens) |
| A2 | Resaltar enlaces | Subrayado grueso y fondo/borde de realce en enlaces y controles tipo enlace |
| A3 | Agrandar texto | Escala raíz `100 %` → `115 %` → `130 %` → `150 %` mediante `rem` |
| A4 | Espaciado de texto | WCAG 1.4.12 (`letter-spacing: 0.12em`, `word-spacing: 0.16em`, `p` `2em`) |
| A5 | Altura de línea | Ciclo `1.5` → `1.8` → `2.2` |
| A6 | Texto alineado | Ciclo `izquierda` → `centro` → `derecha` solo en bloques de texto |
| A7 | Fuente dislexia | Tipografía local `@fontsource/opendyslexic` (licencia OFL, sin CDN) |
| A8 | Detener animaciones | Desactiva transiciones y animaciones; respeta `prefers-reduced-motion` |
| A9 | Ocultar imágenes | Oculta portadas e imágenes decorativas manteniendo textos y controles |
| A10 | Cursor grande | Cursor ampliado servido desde `public/cursor-large.svg` |
| A11 | Saturación | Ciclo `normal` → `baja` → `alta` → `escala de grises` sin afectar capas `fixed` |
| A12 | Restablecer todo | Restaura valores iniciales y actualiza `localStorage` |
| A13 | Mover / ocultar widget | Cambia esquina izquierda/derecha u oculta el botón flotante |

## Precedencia, persistencia y atajos

- **Precedencia de contraste y tema:** cuando **Contraste +** está en `alto claro` o `alto oscuro`, sus tokens AAA tienen precedencia sobre el tema claro/oscuro elegido con el botón de tema.
- **Persistencia:** las preferencias se validan por lista cerrada y se guardan bajo `localStorage['biblio.a11y']`. `public/theme-init.js` aplica las clases antes del primer pintado para evitar parpadeos y cumple la CSP sin `style` en línea.
- **Teclado:** `CTRL+U` abre o cierra el panel incluso si el botón está oculto; `Tab` / `Shift+Tab` mantienen el foco dentro del diálogo y `Esc` lo cierra devolviendo el foco al botón disparador.
