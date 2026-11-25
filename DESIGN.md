# DESIGN.md · Curato Collective

> Fuente de verdad visual de Curato. Cualquier agente (Claude Code, Impeccable, Taste, Emil) debe leer este archivo antes de tocar UI y respetarlo por encima de sus propios defaults.

## 1. Esencia

**Curato** viene del latín *curare*: cuidar, seleccionar. Es un club por invitación en París que une a Storytellers (fotógrafos, chefs, periodistas, creadores) con Maisons de excepción (gastronomía, bienestar, belleza, hotelería boutique).

Lema: **« Jamais une campagne. Toujours une histoire. »**

La interfaz debe sentirse como una revista impresa de noche: oscura, cálida, silenciosa, con mucho aire. Nunca como un SaaS, nunca como una app de influencers.

**Tres palabras:** editorial, íntimo, discreto.

**Referencias de espíritu:** revistas independientes (Kinfolk, Apartamento, Cereal), cartas de restaurantes de autor, hoteles boutique. No referencias tech (Linear, Stripe, Vercel).

**Lo que Curato NO es:** neón, gradientes vibrantes, glassmorphism, emojis, badges de colores, contadores de seguidores gigantes, confeti, animaciones rebotonas.

## 2. Color

Los tokens ya existen en `:root`. Mantener los nombres.

| Token | Valor | Uso |
|---|---|---|
| `--papel` | `#14100E` | Fondo base (negro cálido, nunca `#000`) |
| `--papel-alto` | `#2A2A2A` | Superficies elevadas: tarjetas, inputs, modales |
| `--papel-hover` | `#363636` | Hover de superficies |
| `--tinta` | `#F5EFE4` | Texto principal (crema, nunca `#FFF`) |
| `--tinta-2` | `#F5EFE4` al 86% | Texto de párrafo |
| `--tinta-3` | `#F5EFE4` al 68% | Texto secundario, metadatos |
| `--marca` | `#CBB78F` | Arena/oro. CTA principal, acentos, segunda línea de titulares |
| `--linea` | `#CBB78F` al 15% | Bordes y separadores |
| `--linea-hover` | `#CBB78F` al 30% | Bordes en hover/focus |
| Bronce | `#B56E2E` | Acento editorial puntual (eyebrows de la sección Maisons, links "En savoir plus") |
| Burdeos | `#763943` | Acento profundo, solo en fotografía, overlays o detalles; nunca en texto sobre fondo oscuro |

Colores de estado de la app (`--sauge-vif`, `--copper-vif`, `--burgundy-vif`, `--rouge-vif`, `--brume`): solo para estados funcionales (aprobado, pendiente, error). Siempre en pequeño (punto, texto corto), nunca como fondo de bloques grandes.

**Reglas**
- Máximo un acento de color por pantalla además de `--marca`.
- No usar `#000` puro ni `#FFF` puro en ningún sitio.
- Contraste mínimo WCAG AA: `--tinta-3` solo para texto ≥ 14px.

## 3. Tipografía

**La fuente de verdad es `src/app/globals.css`.** Las decisiones de tipografía ya están tomadas ahí (Natalia, 2026-10-09 y 2026-10-20) y este archivo no las cambia.

| Rol | Fuente | Detalle |
|---|---|---|
| Logo | Centaur | Palabra "curato" en minúsculas con línea tachada opcional. Usar siempre la imagen, nunca recrearlo en CSS |
| Texto, botones, etiquetas, cifras | Fuente del sistema (`--font-serif`: San Francisco en iPhone y Mac) | Decisión deliberada: así se siente como una app de Apple. No sustituir por Inter ni otra fuente web |
| Títulos y nombres de casas y storytellers | Cormorant Garamond (`--font-titulo`) | La voz de Curato |
| Titulares de la landing | Fuente del sistema, MAYÚSCULAS, peso 300, interletrado amplio | Estilo actual del hero; se mantiene |

**Reglas**
- Solo los tamaños de la escala de `globals.css`: capitale 11 · légende 13 · champ 14 · corps 15 · sous-titre 19 · titre/grande 28 · cifra 36. En la app no se escribe ningún otro tamaño. La landing pública puede usar titulares más grandes.
- Solo los interletrados definidos (`--tracking-titre`, `--tracking-capitale`).
- Campos de formulario: nunca por debajo de lo que fija `--text-champ`, por el zoom del iPhone.
- Nunca negrita (700) en titulares. Máximo 500.
- Mejora pendiente: cargar Cormorant con `next/font` en vez del `@import` de Google, para que no haya salto de fuente al cargar.

## 4. Espacio y layout

- Base de 8px. Secciones separadas por 160px en desktop y 96px en móvil.
- Contenedor máximo 1160px, márgenes laterales 24px móvil y 64px desktop.
- Composición asimétrica y editorial: texto alineado a la izquierda, imágenes que sangran a los bordes, columnas desiguales (7/5, 8/4).
- Nada de bloques vacíos sin función: si hay un espacio grande, debe enmarcar una imagen o una frase.
- Separadores: línea de 1px en `--linea`, nunca sombras.

## 5. Componentes

**Botón principal:** fondo `--marca`, texto `#1E1E1E`, sin border radius (0 a 2px), padding 16px 28px. Hover: fondo 8% más claro y flecha que se desplaza 4px.

**Botón secundario:** borde 1px `--linea-hover`, texto `--tinta-2`. Hover: borde `--marca`.

**Links de texto:** subrayado fino que crece de izquierda a derecha en hover (200ms).

**Tarjetas (Maisons / Storytellers):** imagen arriba en ratio 4:5, sin bordes redondeados, sin sombra. Hover: la imagen hace zoom 1.03 en 600ms, y el título se mantiene fijo.

**Inputs:** fondo transparente, solo línea inferior en `--linea`, label en eyebrow encima. Focus: línea en `--marca`.

**Radios:** 0 a 2px en todo. Curato no usa esquinas redondeadas grandes ni píldoras.

**Iconos:** trazo fino de 1px a 1.25px (Lucide con `strokeWidth={1.25}`), siempre en `--tinta-3` o `--marca`.

## 6. Fotografía

- Calidez: tonos ámbar, terracota, luz de vela, sombras profundas. Grano suave permitido.
- Resolución mínima: 2400px de ancho para imágenes a pantalla completa y 1200px para tarjetas.
- Siempre con `next/image`, formatos AVIF/WebP, `sizes` correcto, `priority` solo en el hero.
- Overlay oscuro (`--papel` al 40% a 60%) cuando hay texto encima.
- La imagen debe corresponder a la categoría que ilustra.

## 7. Movimiento

Principio: **el movimiento revela, no decora.** Lento al entrar y rápido al responder.

| Caso | Duración | Easing |
|---|---|---|
| Hover / press en botones | 150 a 200ms | `cubic-bezier(0.23, 1, 0.32, 1)` |
| Modales, drawers, toasts | 250 a 350ms | mismo ease-out |
| Reveal de secciones al hacer scroll | 700 a 900ms, una sola vez | `power3.out` (GSAP) |
| Titular del hero | Líneas que suben desde una máscara, 80ms de stagger | `power4.out` |
| Parallax de imágenes | Máximo 8% de desplazamiento | `scrub` |

**Reglas**
- Nunca `ease-in` en interfaces. Nunca rebotes ni springs exagerados.
- El texto debe ser legible en menos de 400ms después de entrar en pantalla.
- Animar solo `transform` y `opacity`.
- Respetar `prefers-reduced-motion`: sin parallax, sin smooth scroll y con fades simples.
- **Landing:** GSAP (ScrollTrigger + SplitText) + Lenis.
- **App privada:** sin Lenis ni GSAP. Usar `framer-motion` (ya instalado) o CSS, siguiendo la skill de Emil Kowalski.
- La landing ya tiene parallax propio en `src/components/home/motion.tsx`: mejorarlo antes de añadir librerías nuevas.

## 8. Tono del texto

- Francés por defecto, y también inglés y español. Frases cortas, sin jerga de marketing ("boost", "engagement", "ROI").
- Se habla de *histoires*, *maisons*, *storytellers*, *invitation*; nunca de *influenceurs*, *campagnes* ni *deals*.
- Los mensajes de error y los estados vacíos también son editoriales: amables, breves, sin signos de exclamación.

## 9. Checklist antes de dar algo por terminado

- [ ] Tipografía y tamaños dentro de la escala de `globals.css`
- [ ] Imágenes con `next/image` y en resolución suficiente
- [ ] Sin `#000` / `#FFF` puros; solo tokens
- [ ] Probado en 375px, 768px, 1440px y 1920px (Playwright)
- [ ] `prefers-reduced-motion` respetado
- [ ] Contraste AA y focus visible en todos los elementos interactivos
- [ ] Ningún componente con aspecto "plantilla SaaS"
