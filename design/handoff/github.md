repo: nataliafernandezcasas-arch/curato
branch: main
path: src/app

## Last sync
date: 2026-09-08T02:40:00Z

### Updated in this project
- Wireframes de entrada, primera vez, storyteller y maison (15 de 35) a 375 px, con el fondo floral en todas.
- Requisitos reales de publicación de una maison: cinco fotografías (1280 px mínimo en el lado largo) y doscientos caracteres de descripción en francés.
- Cifras y textos tomados del código: código de 6 dígitos en /auth/access y /auth/verify, mínimo de 8 caracteres, campo único handle o email en sign-in, dossier de 10 páginas con dos casillas en welcome, condiciones del programa Recruiters (50 %, 149,50 €, 448,50 €, 15 días).
- Sistema visual de la zona de miembro: escala tipográfica, espaciado, regla de las cajas, roles de color y movimiento.
- No existen `design/decks/` ni `design/curato-app/` en `main`.

## Screen map
| Pantalla del proyecto | Archivos del repositorio |
| --- | --- |
| Curato Sistema · tokens y roles de color | src/app/globals.css |
| Curato Sistema · pantalla de referencia (le carnet) | src/app/dashboard/storyteller/page.tsx, src/app/dashboard/dashboard-nav.tsx, src/app/dashboard/role-switch.tsx |
| Curato Sistema · movimiento y áreas seguras | src/app/dashboard/floral-backdrop.tsx, src/app/native-shell.tsx, src/app/layout.tsx |
| Wireframes 01, 02 · accéder, mot de passe oublié | src/app/auth/sign-in/page.tsx |
| Wireframes 03 · nouveau mot de passe | src/app/auth/change-password/page.tsx |
| Wireframes 04 · code de bienvenue | src/app/auth/access/page.tsx |
| Wireframes 05 · vérification | src/app/auth/verify/page.tsx |
| Wireframes 06 · bienvenue | src/app/onboarding/welcome/welcome-client.tsx, public/onboarding/fr/slide-01.jpg (10 páginas) |
| Wireframes 07 · questionnaire (sin leer todavía: supuestos marcados en pantalla) | src/app/onboarding/survey/survey-client.tsx |
| Wireframes 08 · engagement maison | src/app/onboarding/maison/commitment-client.tsx, public/onboarding/maison/ (8 páginas) |
| Wireframes 09 · engagement apporteur | src/app/onboarding/recruiter/recruiter-commitment-client.tsx, public/onboarding/recruiter/ (6 páginas) |
| Wireframes 16 · mon profil (abonnés, engagement, portée, publicaciones) | src/lib/phyllo/client.ts, src/app/api/maison/roster/route.ts, src/app/dashboard/storyteller/connect-instagram.tsx, src/lib/i18n/translations.ts |
| Wireframes 14 · déclarer la portée (nueva) | src/app/api/visits/upload-proof/route.ts, src/app/api/phyllo/sync-engagement/route.ts, src/app/dashboard/storyteller/visits/page.tsx |
| Wireframes 16 b · portrait y bio (nueva) | src/app/api/maison/roster/route.ts, src/lib/candidature-portfolio.ts (JPEG/PNG/WEBP/HEIC, 3 MB) |
| Wireframes 19 · ma maison | src/app/dashboard/business/maison-profile.tsx, src/app/dashboard/business/nav-links.tsx (page.tsx aún sin leer) |
| Wireframes 20 · mon offre, agenda semanal | src/app/dashboard/business/maison-offer.tsx |
| Wireframes 21, 22 · storytellers y demandes | src/app/api/maison/roster/route.ts, src/lib/phyllo/client.ts, src/lib/i18n/faq.ts (mínimo de 5 visitas) |
| Wireframes 25 · rapport mensuel (nueva) | src/app/api/maison/visitors/route.ts, src/app/api/visits/upload-proof/route.ts, src/lib/i18n/faq.ts |
| Wireframes 26 · facturation | src/app/dashboard/business/maison-billing.tsx |
| Wireframes 2 · 11 fiche maison y 12 réserver | src/app/dashboard/storyteller/maison/[id]/page.tsx (créditos: hôtel 8, gastronomie 2, wellness 3, beauté 3), src/lib/availability.ts (hora de Paris; sin disponibilidad configurada no hay restricción) |
| Wireframes 2 · 13 mes visites | src/app/dashboard/storyteller/visits/page.tsx, src/app/api/reservations/visit/route.ts |
| Wireframes 2 · 18 réglages | src/app/dashboard/storyteller/reglages/page.tsx, src/app/dashboard/business/reglages/page.tsx |
| Wireframes 2 · 31 barra y menú | src/app/dashboard/dashboard-nav.tsx, src/app/dashboard/role-switch.tsx |
| Interacciones · nueve gestos (barra inferior, galerías, visor, deslizar fila) | src/app/dashboard/dashboard-nav.tsx, src/app/dashboard/role-switch.tsx |

## Sync history
- 2026-09-07T20:20:00Z · primera lectura: globals.css, dashboard del storyteller, nav, fondo floral.
