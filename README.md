# QuestLog v2 — RPG de hábitos

React + Vite + TypeScript no frontend, Node + Express + **SQLite** no backend.

## Stack (escolhas)

| Camada | Escolha | Por quê |
|---|---|---|
| UI base | **shadcn/ui** (Radix + `cva` + Tailwind) | Código próprio e acessível, sem cara de template (DaisyUI/Flowbite entregam "feito com IA" de longe) |
| Toque signature | **Magic UI** — `NumberTicker` + beam/shine sutis | 1–2 efeitos comedidos, nada de carrossel genérico |
| Animação | **Motion (Framer Motion)** | Springs, `layout` na lista, modal de level-up. Three.js/Lottie/GSAP seriam overkill num app de produtividade |
| Ícones | Lucide | Sem emojis na UI |
| Fonte | Fraunces (display serif) + Inter | Editorial, distinto do Inter-roxo-padrão |
| Banco | **libsql** (SQLite) — arquivo local no dev, **Turso** na Vercel | Mesmo dialeto nos dois ambientes; arquivo local não persistiria no filesystem efêmero serverless |
| Auth | bcrypt + JWT (30 dias) | Login real, cada conta só vê as próprias tasks |

## Rodar local

```bash
npm install
npm run dev        # sobe API :3001 + client :5173 (banco em ./data/questlog.db)
```

## Deploy na Vercel

O filesystem serverless é efêmero, então produção usa **Turso** (SQLite remoto):

1. Crie o banco: https://turso.tech → Databases → Create (ou `turso db create questlog`)
2. Pegue a URL (`libsql://...`) e crie um token (Database → API Tokens)
3. Na Vercel (Settings → Environment Variables), defina:
   - `TURSO_DATABASE_URL` = `libsql://...`
   - `TURSO_AUTH_TOKEN` = `eyJ...`
   - `JWT_SECRET` = segredo aleatório (`openssl rand -base64 32`)
4. Deploy: `vercel` ou conecte o repo no dashboard. O `vercel.json` já configura
   build (`dist/`), função `/api/*` (`api/index.js`) e schema auto-criado no cold start.

- Client: http://localhost:5173
- API: http://localhost:3001 (`/api/health`)

## Scripts

- `npm run client:build` — typecheck + build de produção
- `npm run server:start` — só a API

## Estrutura

```
server/
  index.js   # Express: auth, tasks, settings, profile, streak, XP
  db.js      # schema SQLite (users, tasks, progress, settings)
src/
  App.tsx
  lib/       # api client, níveis, utils
  components/# ui (shadcn-style), NumberTicker, Toast
  features/  # Auth, Hud, Tasks, Settings, LevelUp
data/        # questlog.db (ignorado no git)
legacy-single-file.html  # v1 original, só referência
```
