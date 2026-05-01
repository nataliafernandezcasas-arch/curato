# Midi Pass

Landing page y plataforma de **Midi Pass** — la membresía lifestyle para creators verificados (10K+ seguidores) que reciben crédito mensual de $1.500.000 COP en merchants partners a cambio de contenido auténtico (3 stories + 1 reel por visita, 60% de uso mínimo).

Pass digital se entrega vía **PassKit** (Apple Wallet / Google Pay).

🌐 Producción: https://pass.midi.io

---

## Stack

- **Next.js 16.2.2** (App Router) · **React 19** · **TypeScript 5**
- **Tailwind CSS 4** · Framer Motion · Phosphor + Lucide icons
- **Supabase** (`@supabase/ssr`) — auth + DB (compartida con `midi-crm`)
- **Resend** — emails transaccionales (domain `midi.io`)
- **Phyllo** — verificación de seguidores del creator (Instagram, TikTok, etc.)
- **PassKit** — emisión de pass digital para wallet
- Deployment: **Vercel** (push a `main` deploya solo)

> ⚠️ Next.js 16 tiene breaking changes — antes de tocar código de framework, leer `node_modules/next/dist/docs/`. Ver [`AGENTS.md`](AGENTS.md).

## Estructura

```
src/
├── app/                # App Router
│   ├── page.tsx        # landing principal
│   ├── creadores/      # landing creator (ES)
│   ├── influencers/    # landing creator (EN)
│   ├── comercios/      # landing merchant (ES)
│   ├── businesses/     # landing merchant (EN)
│   ├── auth/           # login / signup
│   ├── dashboard/      # área autenticada
│   └── api/            # endpoints (applications, auth/check-approved, etc.)
├── components/         # forms, layout
├── lib/
│   ├── supabase/       # cliente SSR
│   ├── phyllo/         # wrapper HTTP — follower verification
│   └── passkit/        # wrapper HTTP — wallet pass issuance
└── proxy.ts            # auth refresh por request (Next 16: era middleware.ts)

passkit-assets/         # assets de la pass (logos, hero, iconos)
public/                 # estáticos públicos
supabase/migrations/    # migraciones de DB
```

## Setup local

```bash
# 1. Clonar
git clone https://github.com/MidiApp/midi-pass.git
cd midi-pass

# 2. Linkear con Vercel y bajar env vars
vercel link --project midi-pass --scope midiapp --yes
vercel pull --environment=production --yes --scope midiapp

# 3. Mover secrets fuera del repo (recomendado)
mkdir -p ~/.midi-pass-env
mv .vercel/.env.production.local ~/.midi-pass-env/.env.production.local
chmod 600 ~/.midi-pass-env/.env.production.local
ln -s ~/.midi-pass-env/.env.production.local .env.local

# 4. Instalar y arrancar
npm install
npm run dev   # localhost:3000
```

Variables de entorno: ver [`.env.example`](.env.example).

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Dev server (Turbopack) en `localhost:3000` |
| `npm run build` | Build de producción |
| `npm run start` | Servir el build |
| `npm run lint` | ESLint |

## Deployment

Conectado a Vercel (project `midi-pass`, team `midiapp`). Cada push a `main` deploya automáticamente a https://pass.midi.io. Para preview, abre PR contra `main` y Vercel genera URL única.

## Contexto interno

- **Producto:** ver Midi Brain → `Midi OS/Midi Brain/knowledge/productos.md`
- **Workspace + workflow:** `Midi OS/Productos/Midi Pass/CLAUDE.md`
- **Referencias técnicas (URLs, IDs):** `Midi OS/Productos/Midi Pass/docs/references.md`
- **Tono y branding:** skills `midi-tono-de-voz` y `midi-branding`
