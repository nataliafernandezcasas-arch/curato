# Handoff: zona de miembro de Curato

Para: Claude Code, trabajando en `nataliafernandezcasas-arch/curato` (rama `main`).

## 1. Qué es esto

El rediseño completo de la zona de miembro de Curato: sistema visual, movimiento y wireframes de alta fidelidad de 17 de las 35 pantallas. El objetivo del brief es llevarlo a **un solo PR**, así que el orden de construcción de la sección 9 importa tanto como los diseños.

**Los archivos HTML de este paquete son referencias de diseño**, no código de producción. Son prototipos que muestran el aspecto y el comportamiento buscados. La tarea es **recrearlos en el entorno que ya existe en el repositorio**: Next 16 (App Router), React 19, Tailwind v4 con los tokens en `@theme inline` dentro de `src/app/globals.css`, framer-motion 12 e iconos Phosphor. No copies el HTML: traduce las decisiones a componentes y tokens.

Restricción del entorno: la app es un **WebView de Capacitor** que carga el sitio en vivo. Todo es HTML y CSS, no hay pantallas nativas, y cualquier cambio visual llega al móvil sin recompilar. En Android las áreas seguras se meten por CSS con `env(safe-area-inset-*)`; en iOS las resuelve el contenedor nativo (ya está así en `globals.css`).

## 2. Fidelidad

**Alta fidelidad.** Colores, tipografía, tamaños, espaciado, estados y copy están decididos. Recréalos con precisión. Los textos en francés de las pantallas son ejemplos reales de contenido, no copy final aprobado: manténlos como valores por defecto o sustitúyelos por las claves de `src/lib/i18n/translations.ts` cuando existan.

Tres cosas están marcadas explícitamente como supuesto en el propio documento y hay que verificarlas antes de implementarlas:

- El medidor de solidez de contraseña (pantalla 03). Hoy no existe; el mínimo real es de 8 caracteres.
- El enunciado, el `Passer` y el número de pasos del cuestionario (pantalla 07). No se leyó `survey-client.tsx`.
- El retrato de storyteller de la pantalla 16b es un marcador: falta material fotográfico real.

## 3. Decisiones que gobiernan todo

Cinco reglas. Si algo del diseño contradice una de ellas, gana la regla.

### 3.1 La regla de las cajas

Hoy hay 216 bordes en las pantallas de miembro, contra una dirección de arte que dice que no hay cajas. El objetivo son ocho, y los ocho son botones.

- **La única forma cerrada del producto es el botón**: `1px solid rgba(203,183,143,0.3)`, esquinas rectas, 44 px de alto mínimo, texto en capital de 11 px con `letter-spacing: 0.28em`. Al ser lo único encerrado, se reconoce sin explicación.
- **Sin caja y sin línea**: listas, tarjetas, pestañas, campos, avisos y estados vacíos. La jerarquía la hacen el tamaño, la fotografía y el aire de 32 px.
- **Las tres líneas que quedan** son datos, no adorno: la barra del crédito, el filete de 2 px que precede a un error, y la línea inferior de un campo, que aparece solo al enfocarlo. Un solo valor de línea en todo el producto: `1px solid rgba(203,183,143,0.15)`.
- La pestaña activa se marca **en champagne**, sin subrayado y sin fondo.
- El botón deja de ser un bloque champagne relleno (`bg-champagne text-charcoal-deep`, como está hoy en sign-in, access, welcome, maison-profile y maison-offer). En esta marca el champagne es tinta, no fondo.

### 3.2 La regla de la fila estrecha

Toda fila es una rejilla de dos columnas: `grid-template-columns: minmax(0, 1fr) auto`. El valor nunca se comprime ni se parte; lo que cede es la etiqueta.

1. El texto secundario trunca a una línea con `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`.
2. El nombre propio **no trunca**: parte a dos líneas con `overflow-wrap: break-word`. Un nombre cortado es una falta de respeto.
3. Si hay un tercer valor, baja a una segunda línea bajo la etiqueta.
4. Las pestañas envuelven a dos líneas. Cinco pestañas en francés no caben en 375 px.
5. **Nada se desplaza en horizontal, nunca.** Es la queja número uno. Cuando algo no cabe, envuelve o baja de línea.

Casos que hoy rompen y que esta regla arregla: la fila de la agenda semanal con dos horas (`maison-offer.tsx`), el nombre largo junto a las cifras en la ficha de storyteller (`page.tsx` de business), y la fila de cinco pestañas de secciones.

### 3.3 Contraste

- Instrucción y cualquier texto que haya que leer para decidir: tinta al **65 %** (`rgba(245,239,228,0.65)`), 6.9:1.
- El **38 %** (`rgba(245,239,228,0.38)`), 3.2:1, solo para etiquetas de metadato que no son instrucción.
- Burgundy nunca en texto pequeño sobre charcoal: el aviso se escribe en `#F5EFE4` y el burgundy queda en el filete de 2 px.

### 3.4 Tacto y campos

- Objetivo táctil de **44 px de alto**, y lo cubre la fila entera, no la palabra. 8 px mínimo entre dos objetivos.
- El valor de un campo va a **17 px**. Por debajo de 16 px el WebView de iOS hace zoom al enfocar, y ese zoom es el origen del desplazamiento horizontal.
- El campo no lleva línea en reposo: `border-bottom: 1px solid transparent` y `border-bottom-color: #CBB78F` en `:focus`, con `transition: border-bottom-color 180ms ease-out`.
- El botón inválido baja al 45 % de opacidad y no se pulsa.
- Con el teclado abierto, el botón principal se ancla al fondo del área visible. Usa `100dvh`, no `100vh`: es lo que hoy deja el botón debajo del teclado en iOS.

### 3.5 El negro de Curato

`#1E1E1E`. La cáscara nativa pinta hoy `#1A1A1A` detrás de una página que es `#1E1E1E`, y en los rebotes del scroll se ve el segundo negro. Cambia `themeColor` en `src/app/layout.tsx` y el fondo nativo a `#1E1E1E`, y elimina `#1A1A1A` del proyecto.

## 4. Tokens

Van en `@theme inline` dentro de `src/app/globals.css`. Los de color ya existen; añade los de tipografía, espaciado y movimiento.

### Color, por rol y no por paleta

| Token | Valor | Qué significa |
|---|---|---|
| `--color-surface` | `#1E1E1E` | El fondo. El único negro. |
| `--color-surface-raised` | `#2A2A2A` | Superficie elevada. |
| `--color-surface-hover` | `#363636` | Hover en escritorio. |
| `--color-accent` (champagne) | `#CBB78F` | Lo que es del miembro y dónde está: su crédito, su hora, la sección activa, las capitales de titulación. No es decoración ni fondo grande. |
| `--color-copper` | `#B56E2E` | Lo que tiene plazo: las 2 stories en 24 h, la visita por confirmar, el crédito por debajo del 20 %, el mínimo de 5 visitas sin cumplir. Nunca dos avisos en copper en la misma pantalla. |
| `--color-burgundy` | `#763943` | Lo que se ha caído: reserva rechazada, cobro fallido, `::selection`. |
| `--color-sauge` | `#4E5A4B` | **Nuevo.** Lo cumplido: visita confirmada, stories publicadas, mínimo alcanzado. En texto sube a `#8C9A86` para contrastar. |
| `--color-brume` | `#A3BAC0` | **Nuevo.** Lo que solo informa: categoría, arrondissement, idioma, número de factura. Libera al champagne de un trabajo que hacía de más. |
| `--color-text-primary` | `#F5EFE4` | Contenido. |
| `--color-text-secondary` | `rgba(245,239,228,0.65)` | Metadato e instrucción. |
| `--color-text-muted` | `rgba(245,239,228,0.38)` | Solo orientación. |
| `--color-border` | `rgba(203,183,143,0.15)` | La única línea. |
| Botón | `rgba(203,183,143,0.3)` | El único borde de cuatro lados. |

Modo crema (sin usar todavía en la zona de miembro): fondo `#F2EDE4`, texto `#2A201C`.

### Tipografía

**Cormorant Garamond**, peso 300 por defecto. Es una decisión cerrada: Centaur es la fuente impresa y se descartó para pantalla por licencia y por no tener peso Light, que es de donde viene el aire de la marca.

Cinco peldaños, de los 12 tamaños que hay hoy:

| Peldaño | Tamaño / interlineado | Peso | Interletrado | Uso |
|---|---|---|---|---|
| Titre | 28 px, 1.15 (32 px desde 768) | 300 | 0.12em, mayúsculas | Uno por pantalla |
| Sous-titre | 19 px, 1.3 | 300 | 0 | Nombre de maison, cifra, pregunta |
| Corps | 15 px, 1.6 | 300 | 0 | Toda la prosa. Máximo 46 caracteres de medida a 375 px |
| Légende | 13 px, 1.55 | **400** | 0 | Metadato. 300 a 13 px se deshace en pantalla |
| Capitale | 11 px | 400 | 0.28em, mayúsculas | El recurso de titulación de Curato. Nunca más de cuatro palabras |

Desaparecen 9, 10, 12, 14, 18, 20, 22, 26 y 32 px. Los 65 usos de 11 px que no eran capitales suben a 13. Los 31 de 10 px suben a 11 y se vuelven mayúsculas, o desaparecen. Interletrado: solo 0, 0.12em y 0.28em; los de 0.4em y 0.5em bajan a 0.28em. Cifras con `font-variant-numeric: tabular-nums` siempre que sean valor o columna.

Excepción: el valor de un campo va a 17 px (ver 3.4), y el código de verificación de seis cifras a 28 px centrado.

### Espaciado

Base 4. Siete peldaños, cada uno con un trabajo: **4** etiqueta y su valor · **8** líneas de un mismo bloque · **16** aire dentro de una fila · **20** margen de página a 375 px, el único valor de borde · **32** entre elementos de distinto rango, sustituye al recuadro · **48** entre secciones de una pantalla · **72** cabecera de pantalla y estado vacío.

Las áreas seguras no son espaciado, son terreno: el margen de página se suma a `env(safe-area-inset-*)` en Android. Ninguna pantalla añade su propio `padding-top` por si acaso.

## 5. Movimiento

El movimiento vive en la fotografía y en el papel. El texto no viaja: aparece asentándose. Un archivo de variantes compartidas de framer-motion, un componente `Rise` y el `FloralBackdrop` que ya existe.

| Movimiento | Especificación |
|---|---|
| El texto se asienta | 420 ms, opacidad 0→1 y **8 px de bajada** (`y: -8` → `0`), `cubic-bezier(.22, 1, .36, 1)`. Baja, no sube. |
| Escalonado | 70 ms entre hermanos, cortado al cuarto elemento (`Math.min(i, 3) * 0.07`). |
| La foto se acerca | 900 ms desde `scale(1.04)` a 1, con la opacidad. Una vez, al entrar en pantalla. Nunca en hover: en un móvil no hay hover. |
| El fondo camina | La flor se desplaza el **7 %** del scroll, escalada a 1.06 para no descubrir el borde, con muelle de baja rigidez (`stiffness: 38, damping: 24, mass: 0.7`, ya en `floral-backdrop.tsx`). El retraso es el efecto. |
| Respiración | La foto de un estado vacío o de portada deriva 0.8 % en 18 s, en bucle. Es el único bucle del producto. |
| Paneles | 260 ms de altura y opacidad con la misma curva. Salir: 140 ms, solo opacidad. Se va más rápido de lo que llega. |

Variante de referencia:

```js
export const rise = (reduce) => ({
  hidden: { opacity: 0, y: reduce ? 0 : -8 },
  shown: (i = 0) => ({
    opacity: 1, y: 0,
    transition: {
      duration: reduce ? 0.12 : 0.42,
      delay: reduce ? 0 : Math.min(i, 3) * 0.07,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
});
```

El revelado usa `whileInView` con `viewport = { once: true, margin: "-10%" }`.

**Lo que no se anima:** las cifras no cuentan hacia arriba (ni el crédito ni la portée); las listas al filtrar solo cambian de opacidad, sin recolocarse una a una; nada rebota, nada gira, ninguna caja escala; la cuenta atrás de las 24 horas se lee, no corre; el texto nunca se anima letra a letra ni palabra por palabra. Al confirmar una visita no hay confeti: hay una capital en sauge que dice que está hecho.

**`prefers-reduced-motion`:** todo cae a una opacidad de 120 ms, sin desplazamiento ni escala; las alturas se aplican de golpe; el parallax floral queda quieto. `useReducedMotion` va dentro de la variante, no en cada uso.

## 6. El fondo floral, en todas las pantallas

Hoy el fondo floral solo está en el dashboard, y las pantallas de entrada llevan una imagen fija. Va en **todas**: es lo que separa a Curato de una app oscura cualquiera, y sale gratis con lo que ya existe.

```
<img src="/flor-bg.jpg" class="absolute inset-0 w-full h-full object-cover" />
<div class="absolute inset-0 bg-charcoal-deep" style="opacity: .86" />
```

El velo se mueve entre **0.80 y 0.92** según cuánto texto haya que proteger: 0.80 en la pantalla del código de bienvenida (poco texto, la flor se ve), 0.86 por defecto, 0.90 en compromisos y formularios largos, 0.92 en la agenda. Nunca menos de 0.80: la flor tiene un centro pálido y esto se lee con mala luz.

En las pantallas de entrada el fondo puede derivar en bucle (18–26 s). Dentro del producto usa el `FloralBackdrop` con el parallax de scroll.

## 7. Las pantallas

`Curato Wireframes.dc.html` tiene las 17 a 375 px, cada una con su ruta, sus estados y la decisión que resuelve. Aquí el resumen y el archivo del repositorio que hay que tocar.

### A · Entrada

| # | Pantalla | Ruta | Archivo | Qué cambia |
|---|---|---|---|---|
| 01 | Accéder | `/auth/sign-in` | `src/app/auth/sign-in/page.tsx` | Un solo campo `Handle · email` (ya se resuelve por `/api/auth/lookup-handle`). Campos sin recuadro, botón sin relleno. En la app el pie de la invitación no se pinta (ya lo controla `useNativePlatform`). |
| 02 | Mot de passe oublié | misma ruta, modo `reset` | idem | Mismo campo de handle y un `Retour`. La confirmación es siempre la misma frase, exista la cuenta o no: eso ya está y se mantiene. |
| 03 | Nouveau mot de passe | `/auth/change-password` | `src/app/auth/change-password/page.tsx` | Mínimo real de 8 caracteres. Dos campos, error de coincidencia bajo el segundo. El medidor de solidez es nuevo: una barra de 1 px con su palabra al lado, la misma pieza que la barra del crédito. |
| 04 | Code de bienvenue | `/auth/access` | `src/app/auth/access/page.tsx` | Correo más código de **seis dígitos** (solo números, botón inactivo hasta los seis). El código a 28 px centrado. Velo al 0.80. |
| 05 | Vérification | `/auth/verify` | `src/app/auth/verify/page.tsx` | No es una sala de espera: es el código de seis cifras. El correo entero y sin truncar arriba, y el enlace `Changer d'adresse e-mail`. Es la pantalla que más se ve. |

### B · La primera vez

| # | Pantalla | Ruta | Archivo | Qué cambia |
|---|---|---|---|---|
| 06 | Bienvenue | `/onboarding/welcome` | `welcome-client.tsx` | Diez páginas del dossier a sangre (`public/onboarding/fr/slide-01…10.jpg`) y al final dos casillas, condiciones y privacidad, con el botón inactivo hasta tener las dos. El bloque de aceptación deja de ser un pie oscuro con casillas de sistema. |
| 07 | Questionnaire | `/onboarding/survey` | `survey-client.tsx` | Barra de progreso de 1 px, opciones marcadas con un punto en champagne y la fila entera como objetivo táctil. Botón anclado sobre el teclado con `100dvh`. **Verificar enunciados con el archivo.** |
| 08 | Engagement maison | `/onboarding/maison` | `commitment-client.tsx` | Dossier (8 páginas), descarga en PDF, términos numerados de `lib/i18n/commitment`, nombre del firmante en cursiva a 17 px y la casilla con los dos enlaces. Orden y aire, sin recuadros. Velo 0.90. |
| 09 | Engagement apporteur | `/onboarding/recruiter` | `recruiter-commitment-client.tsx` | Misma plantilla que la 08. Cifras reales del programa: 50 % del abonnement, 149,50 € al mes, hasta 448,50 € por maison en los tres primeros meses pagados, transferencia a 15 días. Campos `Nom`, `Fait à`, `Le`. |

### C · Storyteller

| # | Pantalla | Ruta | Archivo | Qué cambia |
|---|---|---|---|---|
| 14 | **Déclarer la portée** (nueva) | dentro de una visita | `src/app/dashboard/storyteller/visits/page.tsx`, `api/visits/upload-proof` | Dos vías en la misma pantalla: la automática por Phyllo arriba (cifras que llegan solas y se confirman) y la manual debajo, sin esconderse. Dos huecos de captura que **dicen lo que hacen** (`+ Ajouter la capture`, `Remplacer` cuando ya hay una) y tres campos nuevos: vues, portée, interactions. Cuenta atrás en copper, en capital, sin dígitos que corran. |
| 16 | Mon profil | `/dashboard/storyteller/profil` | Phyllo (`src/lib/phyllo/client.ts`) | Abonnés, engagement (`engagement_rate` se guarda en fracción; muestra el tanto por ciento con un decimal), portée media (`avgReach`) con su frase real, crédito, categorías, últimas publicaciones con su portée, y **publiées chez les maisons** agrupado por casa con la portée conseguida y la vigencia de 90 días. Cifras propias en tinta al 100; el champagne queda para el crédito y la portée conseguida en el club. Miniaturas cuadradas para Instagram, 9:16 para stories de visita. |
| 16b | **Portrait et bio** (nueva) | misma ruta, en edición | `api/maison/roster`, `src/lib/candidature-portfolio.ts` | Hasta dos fotografías y una bio de 240 caracteres sobre qué fotografía la persona. Sobrescribe el avatar y la bio que hoy trae Phyllo; las cifras siguen viniendo de la cuenta. Formatos y peso reutilizados de la candidatura: JPEG, PNG, WEBP, HEIC, 3 MB. **El portrait es un rectángulo 4:5, no un círculo.** |

### D · Maison

| # | Pantalla | Ruta | Archivo | Qué cambia |
|---|---|---|---|---|
| 19 | Ma maison | `/dashboard/business` | `maison-profile.tsx` | Los requisitos para abrir la ficha son exactamente **dos**: cinco fotografías (rechazo por debajo de 1280 px en el lado largo) y 200 caracteres de descripción en francés; inglés y español opcionales. Contadores en copper arriba, aviso de foto rechazada donde ocurre, primera foto marcada como portada, orden arrastrando. El `Aperçu storyteller` sube a botón. |
| 20 | Mon offre | `/dashboard/business/offer/edit` | `maison-offer.tsx` | La agenda semanal es hoy lo más roto en un móvil. Una fila por día: `[punto][día flexible][horas fijas]` en una sola rejilla; las horas viajan juntas y no se comprimen (99 px a 375). Fermé cuando está apagado. Las fechas cerradas dejan de ser etiquetas con equis: filas de 44 px con su `Retirer`. Servicios separados por aire, no en tarjetas con borde. |
| 21 | Storytellers | `?section=roster` | `api/maison/roster` | Ficha en retrato 4:5, tres cifras en filas (abonnés, engagement, portée), bio y últimas publicaciones, sin recuadro. El nombre largo parte a dos líneas junto a las cifras: eso es lo que hoy se solapa. |
| 22 | Demandes de visite | `?section=roster` | idem | La consecuencia de rechazar se lee **antes** de pulsar y encima de los dos botones: un rechazo cuenta como visita ofrecida en el mínimo del mes. Sin diálogo de confirmación después. |
| 25 | **Le rapport mensuel** (nueva) | `?section=visitors` | `api/maison/visitors` | La razón por la que una casa paga 299 €. La cifra que lo justifica es la más grande de la pantalla, 46 px, con su denominador: `6 sur 5 garanties`. Por debajo del mínimo pasa a copper y dice lo del contrato, que el mes siguiente se ofrece gratis, sin reproche. Portée acumulada, storytellers con su audiencia, galería de lo publicado con los 90 días, y descarga del documento. **Depende de la pantalla 14**: sin esas cifras el informe no existe. |
| 26 | Facturation | `?section=billing` | `maison-billing.tsx` | Las filas y fechas que ya existen, con los 15 días gratis y la facturación anclada al fin de la prueba. El estado sube al titular en capital y champagne en vez de esconderse en una fila dentro de un recuadro. Valores largos alineados a la derecha, envuelven a dos líneas, nunca truncan una fecha. |

Faltan por diseñar: 10 a 13, 15, 17, 18 del storyteller, 23, 24, 27, 28 de maison, 29 y 30 de apporteur, 31 a 35 transversales, y el tablero de maison a 1440.

## 8. Estados

Cada pantalla del documento lleva su lista. Los patrones:

- **Cargando**: bloques de `rgba(203,183,143,0.15)` con la respiración de opacidad de 1.6 s, con la forma del contenido que va a llegar. Sin ruedas giratorias.
- **Vacío**: 72 px de aire, una capital en champagne, una frase de corps que dice **dónde está la persona y qué pasa después**, una fotografía y una sola cosa que hacer. Un tablero vacío con una frase centrada es el defecto que hay que borrar.
- **Error**: filete de 2 px en burgundy, el título en 19 px que dice qué ha pasado, una frase que dice **qué no se ha perdido**, y un botón para reintentar.
- **Formulario inválido**: el botón al 45 % y el motivo escrito bajo el campo, en copper, sin icono y sin recuadro.

## 9. Orden de construcción, para un solo PR

1. **Tokens** en `@theme inline`: cinco tamaños, tres interletrados, siete espacios, una línea, los dos colores nuevos. Nada más entra.
2. **Cuatro primitivas**: `Row`, `Field`, `Tabs`, `Section`. Son las que borran los 216 bordes de una vez, y sin ellas cada pantalla vuelve a inventar su borde.
3. **El negro y las áreas seguras**: `#1E1E1E` en `themeColor` y en la cáscara nativa; revisar que ninguna pantalla añada su propio padding de área segura.
4. **Movimiento, una sola vez**: el archivo de variantes, el componente `Rise` y el `FloralBackdrop` montado también en las pantallas de entrada.
5. **Pantallas**, en este orden: carnet, ficha de maison, `visits` con la 14, agenda de maison (20), informe mensual (25), réglages. La agenda va tarde porque es la que más depende de la fila estrecha, y el informe después de la 14 porque depende de sus datos.
6. **Estados vacíos**: acabado, no cimiento, pero son la primera pantalla de todo miembro nuevo.

## 10. Datos que hoy no existen

Lo único del diseño que necesita esquema nuevo:

- **Cifras de portée por visita**: `vues`, `portee`, `interactions`, más el estado de verificación y la fecha de declaración. Hoy `api/visits/upload-proof` guarda las capturas en el bucket privado `content-proofs` y escribe `content_proof_urls`, pero no se guarda ni una cifra. De aquí sale todo el informe mensual.
- **Portrait y bio propios del storyteller**, separados de los que trae Phyllo.
- **Agregados mensuales por maison** para el informe: visitas del mes, portée acumulada, stories publicadas, audiencia acumulada. Se pueden derivar de las visitas, no hace falta tabla nueva.

## 11. Archivos de este paquete

- `Curato Sistema.dc.html` — el sistema: escala tipográfica, espaciado, la regla de las cajas con un antes y después interactivo, roles de color, tacto, la fila estrecha con un deslizador que la estrecha de verdad, y el movimiento. Incluye la pantalla del carnet en sus cinco estados.
- `Curato Wireframes.dc.html` — las 17 pantallas a 375 px, agrupadas por rol, cada una con ruta, estados y decisiones. Al final, el índice de las 35 con el orden de trabajo.
- `Curato Movimiento.dc.html` — el movimiento **vivo**: una pantalla desplazable donde el fondo camina, el texto se asienta y las fotos se acercan, con un interruptor de `reduced-motion` para comparar. Abre este primero para entender el movimiento; describirlo con palabras no sirve.
- `github.md` — la asociación con el repositorio y el mapa de pantalla a archivos, que es el que se diffea en el siguiente sync.

Los tres HTML se abren directamente en un navegador. El fondo floral y el logo vienen de `public/` del propio repositorio; las fotografías de `photos/` son del banco de la marca y son **marcadores**, no fotografías finales.

## 12. Assets

- `public/flor-bg.jpg`, `public/logo-curato-simple.png` — del repositorio, sin cambios.
- `public/onboarding/fr/slide-01…10.jpg` (welcome), `public/onboarding/maison/slide-1…8.jpg`, `public/onboarding/recruiter/slide-1…6.jpg` — los dossiers reales, ya en el repositorio.
- `photos/` — banco de la marca, usado como marcador en las pantallas. Falta un retrato real de storyteller para la 16b.
- Iconos: **Phosphor**, que ya está. No mezcles familias. El diseño usa muy pocos: la mayoría de lo que hoy es un icono pasa a ser una palabra en capital.
