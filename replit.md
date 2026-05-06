# Out of Office: The Game

An office-themed Mario-style platformer where you dodge your Boss, email notifications, and Teams pings while collecting PTO hours (clock icons). Power-ups include coffee (speed), headphones (invincibility), and WFH mode (floaty jumping).

## Run & Operate

- `pnpm --filter @workspace/mario-game run dev` — run the game (port 22036, preview at `/`)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, preview at `/api`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Game: React + Vite, HTML5 Canvas (custom engine)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- Game source: `artifacts/mario-game/src/game/` — engine, level, renderer, types
- Game page: `artifacts/mario-game/src/pages/Game.tsx`
- Logo asset: `attached_assets/OOO-logo_1777181952692.png`
- API server: `artifacts/api-server/src/`
- DB schema: `lib/db/src/schema/`
- API spec: `lib/api-spec/openapi.yaml`

## Architecture decisions

- Game runs entirely on HTML5 Canvas — no game engine framework, custom physics in `engine.ts`
- Level design is hardcoded in `level.ts` (tile grid, enemy placements, power-up locations)
- Game is portrait-oriented (450×800 viewport) designed for mobile/touch with swipe and tap controls
- `@assets` alias in Vite resolves to `attached_assets/` at workspace root for logo/images
- The game artifact sits at previewPath `/` so it's the root experience

## Product

- Platformer game: dodge Boss, Email, and Teams enemies; collect clock icons (PTO hours)
- Power-ups: ☕ Coffee (speed boost), 🎧 Headphones (invincibility), 🏠 WFH (floaty gravity)
- Score system: coins + enemy stomps + time bonus at flag
- Touch and keyboard controls; start overlay with instructions

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The game's vite.config.ts requires both `PORT` and `BASE_PATH` env vars (set via artifact.toml)
- `@assets` alias points to `attached_assets/` two directories above the artifact root
- Game viewport is fixed at 450×800 — renderer uses this hardcoded size

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `react-vite` skill for frontend build patterns
