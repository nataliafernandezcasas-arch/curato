# Brief · Mejoras web y app Curato

Para: Claude Code en el repo de curatocollective.com (Next.js + Tailwind)
Antes de empezar: lee `DESIGN.md` en la raíz del repo. Es la fuente de verdad visual.

Trabajar en una rama nueva (`design/polish`) y hacer un commit por fase.

---

## Fase 0 · Instalar herramientas

```bash
# Skills de diseño
npx skills add pbakaus/impeccable
npx skills add emilkowalski/skill

# QA visual
npm i -D @playwright/test && npx playwright install chromium
claude mcp add playwright npx @playwright/mcp@latest

# Animación (solo para la landing)
npm i gsap @gsap/react lenis
```

No instalar Taste skill al mismo tiempo que Impeccable, para que no se pisen las reglas. No usar React Bits salvo que algo concreto lo justifique.

---

## Fase 1 · Arreglos de base (prioridad alta)

1. **Fuentes.** Hoy los titulares caen a la fuente del sistema (SF en Mac, Segoe en Windows, Roboto en Android), así que la web se ve distinta en cada dispositivo. Cargar la sans elegida y Cormorant Garamond con `next/font/google` en `app/layout.tsx` y exponerlas como variables CSS. Cargar solo los pesos que se usan (300, 400, 500 e itálica 400 de Cormorant).
2. **Imágenes.**
   - Reemplazar todos los `<img>` por `next/image` con `sizes` correcto.
   - Las fotos actuales miden entre 427 y 736px de ancho y se ven pixeladas a pantalla completa. Hay que sustituirlas por versiones de al menos 2400px (hero/fondos) y 1200px (tarjetas).
   - Renombrar los archivos sin espacios: `Background Image 4.jpeg` → `bg-04.jpg`.
   - `Logo Curato.png` pesa 645 KB: exportarlo a SVG, o a WebP de menos de 30 KB.
3. **Metadatos.**
   - La meta description está en español y la página está en `lang="fr"`. Hay que traducirla y hacer una versión por idioma.
   - `og:image` apunta a `curato.co/opengraph-image`. Debe apuntar a `curatocollective.com` (revisar `metadataBase` en el layout).
   - Crear una imagen OG propia (1200×630, logo + lema sobre foto cálida) y comprobarla en opengraph.xyz.
4. **Contenido de categorías.** "Conscience" describe soins du visage / nail bars, pero la foto es de yoga. "Bien-être" menciona yoga y la foto es una mascarilla. Hay que corregir textos o fotos para que coincidan.
5. **Reveals demasiado lentos.** Al hacer scroll, los párrafos se quedan casi invisibles un buen rato. Hay que bajar la duración a 700 a 900ms y disparar antes (`start: "top 85%"`).
6. **Espacios vacíos.** Hay bloques grises sin contenido entre secciones. Se deben eliminar o usar para una frase o imagen.

Al terminar, corre Playwright y saca capturas de `/`, `/storytellers`, `/casas` y `/auth/sign-in` en 375, 768, 1440 y 1920px.

---

## Fase 2 · Audit con Impeccable

```
/impeccable init
/audit       → en /, /storytellers y /casas
/critique    → en /
```

Aplicar solo las sugerencias compatibles con `DESIGN.md`. Si una regla de Impeccable contradice el DESIGN.md, manda el DESIGN.md. Después:

```
/typeset     → jerarquía tipográfica
/polish      → detalles finales
```

---

## Fase 3 · Landing con GSAP + Lenis

Solo en las páginas públicas (`/`, `/storytellers`, `/casas`).

- **Lenis:** smooth scroll global en un layout de marketing (no en el layout de la app). Hay que desactivarlo con `prefers-reduced-motion`.
- **Hero:** con SplitText por líneas, cada línea sube desde una máscara (`yPercent: 100 → 0`, stagger 0.08, `power4.out`). La segunda frase ("TOUJOURS UNE HISTOIRE.") entra 200ms después.
- **Imágenes a pantalla completa:** parallax suave con ScrollTrigger `scrub`, máximo 8%.
- **Grid de categorías:** reveal escalonado de las 4 tarjetas y zoom 1.03 en hover.
- **CTA final:** la flecha del botón se desplaza en hover.

Usar `useGSAP()` de `@gsap/react` para limpiar bien en navegación.

---

## Fase 4 · App privada con la skill de Emil Kowalski

```
Usa la skill emil-design-eng para revisar todos los componentes interactivos de la app (botones, inputs, modales, toasts, tabs, menús) y devuelve una tabla Antes / Después / Por qué.
```

Prioridades:
- Botones con feedback al presionar (`scale(0.97)`, 150ms).
- Modales y drawers que entren desde su origen, con ease-out y en menos de 300ms.
- Toasts discretos (Sonner, con estilos de Curato: fondo `--papel-alto`, borde `--linea`, sin colores chillones).
- Estados de carga con skeletons en `--papel-alto`, nunca spinners genéricos.
- Estados vacíos editoriales (frase en Cormorant itálica + acción clara).
- Nada de GSAP ni Lenis dentro de la app.

---

## Fase 5 · QA final

- Tests de Playwright para: login, "Demander une invitation", "Code de bienvenue" y cambio de idioma FR/EN/ES.
- Capturas finales en los 4 anchos para comparar el antes y el después.
- Lighthouse: Performance ≥ 90, Accessibility ≥ 95 y SEO 100 en `/`.
- Revisar con `prefers-reduced-motion` activado.
- Pasar el checklist de la sección 9 de `DESIGN.md`.
