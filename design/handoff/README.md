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

## 10 bis. Segunda entrega: los huecos del orden

Al construir por el orden de la sección 9 aparecieron tres huecos: la ficha de maison, Mes visites y Réglages no estaban diseñadas, y la 14 vivía dentro de la 13. `Curato Wireframes 2.dc.html` los cierra. Con eso, las seis pantallas del orden de construcción están diseñadas.

**Regla de negocio, y el código la contradice: todo va en euros, nunca en créditos.**

El crédito mensual del creador se calibra sobre su audiencia:

| Abonnés | Crédito mensual |
|---|---|
| 5 000 a 10 000 | 500 € |
| 10 000 a 50 000 | 750 € |
| 50 000 a 100 000 | 1 000 € |
| 100 000 a 500 000 | 1 500 € |
| Más de 500 000 | 3 000 € |

Es mensual y se consume. Se muestra siempre con su denominador (900 € de 1 500 €, el tramo de Tereza Bolkvadze con 142 K abonnés, que es el ejemplo de todos los documentos), con espacio fino de millar a la francesa y `font-variant-numeric: tabular-nums`, para que no cambie de ancho al gastarse.

Antes de reservar, lo que se ve son **las tarifas reales de la maison**, escritas por ella en sus servicios, y la pantalla dice de dónde sale la cifra (*le tarif du dîner pour deux, tel que la maison l'affiche*). Nunca una valoración de Curato ni una unidad abstracta.

La tabla `CATEGORY` de `maison/[id]/page.tsx` guarda hoy 8, 2 y 3 "crédits" y los pinta como coste indicativo: **es un resto y hay que sustituirlo** por esa tarifa. La palabra crédit no vuelve a aparecer en el producto.

**Primitivas que ya existen y hay que reutilizar, no rehacer:** `Button` y `ButtonLink`, `AuthShell` (flor, velo ajustable, idioma, logotipo), `CodeField` y `StrengthMeter`, además de `Row`, `Field`, `Tabs`, `Section`, `Rise` y `Photo`. Construidas ya: el carnet (10) y las cinco de entrada (01 a 05).

**Encadenado en un PR aparte** porque necesitan columnas nuevas: la 14, la 25 y la 16b. Los diseños son válidos tal cual y no hay que rehacerlos.

| # | Pantalla | Ruta | Archivo | Qué cambia |
|---|---|---|---|---|
| 11 | Fiche maison | `/dashboard/storyteller/maison/[id]` | `maison/[id]/page.tsx` | Portada 4:5 en vez de 16:9: en vertical una banda ancha desperdicia media pantalla. Fuera la tarjeta lateral con borde, en 375 px dirección, web y botón son filas. Orden de revista: foto, categoría, nombre, texto, coste en créditos, créneaux, acción, más fotografías, plano al final. El plano sigue siendo el iframe de Google en gris, sin borde, 180 px de alto. |
| 12 | **Demander une visite**, pantalla propia | `/maison/[id]/reserver`, ruta nueva | idem, extraído de `ReserveModal` | **Decisión: deja de ser diálogo.** Seis campos y una rejilla de horas con el teclado abierto no caben en un modal de 375 px, y una ruta propia devuelve el botón atrás y hace que el enlace `?slot=` del correo abra algo compartible. El día es una lista de filas con su recuento de créneaux, no un `select` nativo. Horas en rejilla de cuatro, 44 px, las ocupadas al 38 % sin poder pulsarse. Lo elegido se repite sobre el botón con su coste. Éxito sin diálogo: vuelta a la ficha con una capital en sauge. |
| 13 | Mes visites | `/dashboard/storyteller/visits` | `storyteller/visits/page.tsx` | Se ordena por **lo que toca hacer**: À faire, con la cuenta atrás y el botón a la 14; À venir; Passées. Los seis estados con color y acción propios. **Hoy `no_show` se pinta igual que `declined`**, el mapa de estados los une; son cosas distintas y la primera lleva strike. La subida sigue pidiendo dos fotos como mínimo en el primer envío, y solo en `confirmed` o `completed`. |
| 18 | Réglages | `/dashboard/storyteller/reglages` y `/dashboard/business/reglages` | ambos `reglages/page.tsx` | Idioma en tres filas con punto en champagne, sin línea inferior. **Añadido**: bloque de cuenta con correo, antigüedad y cambio de contraseña, que no existe. Cerrar sesión es un botón con su caja, no un enlace gris con icono, y sin diálogo de confirmación. |
| 31 | La barra y su menú | `dashboard-nav.tsx` | | Fuera la hamburguesa y la equis: la palabra Menu se convierte en Fermer, capital de 11 px. Destinos a 19 px, no a 13. El contenido de detrás se atenúa al 38 %, no se cubre con velo negro. La barra se queda pegada con `rgba(30,30,30,0.72)` y desenfoque, sin la línea inferior de hoy. |
| 33 | Estados vacíos, como sistema | todas | | Una plantilla, cuatro huecos: 72 px de aire, capital en champagne, titular de 28 px, una frase con **un dato real** (cifra o fecha), una fotografía que respira 18 s al 0.8 %, y **un solo** botón. Si no hay nada que hacer, el botón desaparece en vez de inventarse una acción. Los cuatro vacíos que ve un miembro nuevo, con el dato que le toca a cada uno, están en el documento. |
| 34 | Errores, confirmaciones y esperas | todas | | La regla que las ordena: **el aviso vive donde ocurrió la cosa**, nada flota. Guardado: en la fila que cambió, en sauge, se va en 2,5 s. Error de campo: bajo el campo, en copper, y la línea del campo se tiñe. Error grande: filete burgundy, qué pasó, **qué no se ha perdido**, botón. Espera: bloques con la forma de lo que va a llegar y la respiración de 1,6 s; pasados 8 s se convierte en el error grande. Botón trabajando: texto a Envoi y 45 % de opacidad. |

### Sigue sin diseñar (24 de 35 entregadas, más la 16b)

Once pantallas y la vista de ordenador: 10 (ya construida, queda revisarla contra la referencia), 15 conectar Instagram, 17 sugerir una dirección, 23 vos visiteurs, 24 le carnet de la maison, 27 code QR, 28 réglages de maison, 29 tableau apporteur, 30 présenter une maison, 32 sans connexion, 35 notificaciones, y el tablero de maison a 1440.

**Pendiente de decidir antes de dibujar:** la 27, el código QR. Es el único caso de uso físico del producto y pide romper dos reglas, brillo alto y una forma grande y cerrada. Propuesta en una línea: QR a ancho completo sobre **fondo crema**, no charcoal, porque un código oscuro se lee peor y la cámara del cliente no perdona. Sería la única pantalla en modo claro de la app, y el modo crema ya está en los tokens.

## 10 ter. Interacciones: que se sienta app y no página

Documento vivo y tocable: `Curato Interacciones.dc.html`. Ábrelo antes de implementar nada de esta sección — describir un gesto con palabras no sirve.

Dos causas hacían que la zona de miembro pareciese una web: todo se recorre hacia abajo, y la navegación vive arriba detrás de un menú. Nueve piezas lo corrigen.

**Esto reemplaza la pantalla 31 tal como estaba diseñada, y convierte la 32 en un estado en vez de una pantalla.**

| # | Pieza | Qué implica en el código |
|---|---|---|
| 1 | **Barra de pestañas abajo** — tres destinos en capital de 11 px, la activa en champagne, sobre `rgba(30,30,30,0.72)` con desenfoque, sin iconos ni caja ni subrayado | Sustituye al menú desplegable como navegación principal en `dashboard-nav.tsx`. El menú se queda solo para réglages, cambiar de espacio y cerrar sesión, colgados del nombre. Inactivas al 65 % de tinta, no a un valor nuevo |
| 2 | **Galerías que se arrastran** — una por maison, páginas del ancho completo con `scroll-snap-type: x mandatory` | Arrastre con dedo y con ratón vía pointer events; al soltar cae en la foto más cercana. Un arrastre de más de 8 px **no** cuenta como toque, o deslizar abre la ficha por error. Indicador: una línea de 1 px que se llena, nunca una hilera de puntos (serían formas cerradas) |
| 3 | **La ficha entra desde la derecha** — 320 ms, curva de la marca, sombra en el canto | View Transition API o framer-motion sobre el router. El gesto de arrastrar desde el borde lo da el WebView de iOS solo si la ruta es real: otra razón para que la reserva sea la 12 y no un diálogo |
| 4 | **Acción pegada abajo** en la ficha, y la barra de pestañas se apaga mientras está abierta | En una pantalla de detalle hay una sola cosa que hacer |
| 5 | **Hoja inferior para elecciones cortas** — filtros del carnet, 260 ms, se aplica al tocar, sin botón de aceptar | Mismo patrón para el idioma en réglages y las noches de un hotel. Sustituye a los diálogos centrados |
| 6 | **Tirar para actualizar** — `Tirer` → `Relâcher pour actualiser` → `À jour` en sauge | Sin botón de recargar y sin rueda giratoria. La cabecera aparece con el gesto y se va sola |
| 7 | **Visor a pantalla completa** — se abre en la foto que se estaba viendo, las cuatro se recorren dentro, contador `2 / 4`, pie de foto y `Fermer` | Sin marco, sin negro puro y sin pellizcar para ampliar: son fotografías de casas, no mapas. La misma pieza sirve para las stories del perfil y la galería del informe mensual |
| 8 | **Deslizar una visita para actuar** — la fila se arrastra a la izquierda y revela una sola acción, la que toca según el estado | Declarar si la visita se hizo, anular si no ha llegado. Nunca dos, nunca destructiva sin decir la consecuencia. El botón sigue dentro de la visita: el gesto es un atajo, no la única vía |
| 9 | **La cabecera se encoge** — el nombre de la maison aparece en la barra pegada cuando el titular grande sale de pantalla | Solo opacidad, nada se mueve. Única excepción a la regla de no truncar nombres, porque en la barra es metadato y el nombre completo sigue dos dedos más abajo |

### Cuatro más, decididas y sin prototipo

- **Vibración al confirmar**: `Haptics.impact` de Capacitor al enviar una demanda o declarar la portée. Dos líneas, y es lo que el cuerpo reconoce como app. Nunca en errores.
- **La foto que revela**: cada fotografía entra desde una miniatura desenfocada del propio archivo, no desde un bloque gris. Es un atributo de `next/image`.
- **Sin conexión, dicho en la barra**: `Hors ligne` en copper en la barra inferior y las acciones de red al 45 %. **Esto es la pantalla 32, y deja de ser pantalla.**
- **Cambiar de espacio en dos toques**: el nombre de arriba abre una hoja con los espacios y se vuelve al mismo sitio de la otra cara. `role-switch` ya existe.

### Lo que no se añade

Carruseles automáticos, rebotes, muelles exagerados, mensajes flotantes, celebraciones al confirmar, transiciones distintas por pantalla, cifras que cuentan hacia arriba. Lo que hace que una app se sienta app no es la cantidad de movimiento: es que el pulgar alcance las cosas, que se pueda volver, y que cada gesto tenga consecuencia inmediata.

## 11. Archivos de este paquete

- `Curato Sistema.dc.html` — el sistema: escala tipográfica, espaciado, la regla de las cajas con un antes y después interactivo, roles de color, tacto, la fila estrecha con un deslizador que la estrecha de verdad, y el movimiento. Incluye la pantalla del carnet en sus cinco estados.
- `Curato Interacciones.dc.html` — **el prototipo tocable de las nueve interacciones**: galerías que se arrastran, barra inferior, empuje de pantalla, hoja de filtros, tirar para actualizar, visor a pantalla completa y deslizar una visita. Ábrelo primero.
- `Curato Wireframes 2.dc.html` — la segunda entrega: 11, 12, 13, 18, 31, 33 y 34, más la lista de lo que sigue sin diseñar.
- `Curato Wireframes.dc.html` — las 17 pantallas de la primera entrega a 375 px, agrupadas por rol, cada una con ruta, estados y decisiones. Al final, el índice de las 35 con el orden de trabajo.
- `Curato Movimiento.dc.html` — el movimiento **vivo**: una pantalla desplazable donde el fondo camina, el texto se asienta y las fotos se acercan, con un interruptor de `reduced-motion` para comparar. Abre este primero para entender el movimiento; describirlo con palabras no sirve.
- `github.md` — la asociación con el repositorio y el mapa de pantalla a archivos, que es el que se diffea en el siguiente sync.

Los tres HTML se abren directamente en un navegador. El fondo floral y el logo vienen de `public/` del propio repositorio; las fotografías de `photos/` son del banco de la marca y son **marcadores**, no fotografías finales.

## 12. Assets

- `public/flor-bg.jpg`, `public/logo-curato-simple.png` — del repositorio, sin cambios.
- `public/onboarding/fr/slide-01…10.jpg` (welcome), `public/onboarding/maison/slide-1…8.jpg`, `public/onboarding/recruiter/slide-1…6.jpg` — los dossiers reales, ya en el repositorio.
- `photos/` — banco de la marca, usado como marcador en las pantallas. Falta un retrato real de storyteller para la 16b.
- Iconos: **Phosphor**, que ya está. No mezcles familias. El diseño usa muy pocos: la mayoría de lo que hoy es un icono pasa a ser una palabra en capital.
