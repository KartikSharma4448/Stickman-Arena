# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server + Socket.IO game server
│   └── 3d-game/            # React Three Fiber FPS game frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Stickman FPS Game

### Architecture

- **Frontend** (`artifacts/3d-game/`): React + Vite + React Three Fiber game
  - `src/game/store.ts` - Zustand game state (players, health, kills, kill feed)
  - `src/game/socket.ts` - Socket.IO client singleton
  - `src/game/Arena.tsx` - 3D arena with cover objects and walls
  - `src/game/Stickman.tsx` - Low-poly stickman character with health bar
  - `src/game/PlayerController.tsx` - WASD movement, mouse look, raycast shooting
  - `src/game/Effects.tsx` - Muzzle flash, bullet trails (object pooled)
  - `src/game/HUD.tsx` - Health bar, crosshair, kill feed, scoreboard
  - `src/game/Lobby.tsx` - Room browser and room creation UI
  - `src/game/TouchControls.tsx` - Mobile joystick + shoot button
  - `src/game/GameScene.tsx` - Three.js canvas with all game objects

- **Backend** (`artifacts/api-server/`): Express + Socket.IO game server
  - `src/game-server.ts` - Full multiplayer server: rooms, player sync, shooting, scoring
  - WebSocket path: `/socket.io/` (proxied by Vite dev server from frontend)

### Game Features
- 3D FPS with stickman low-poly characters (Minecraft-style blocky)
- Real-time multiplayer via WebSocket (20 tick rate)
- 5 maps: Highlands, Desert, Urban Ruins, Military Compound, **Barmuda** (battle royale)
- FPP/TPP camera toggle
- Weapons: AK-47, SMG, Sniper, Shotgun, Pistol with different stats
- Raycast shooting with headshot detection
- Kill feed, scoreboard, HUD

### Barmuda Battle Royale Map (Arena5.tsx)
- 150×150 island with ocean, beach, grass, roads, tropical palm trees
- Zones: Pochinki (center), School, Military Base, Georgopol, Primorsk, Lipovka, Rozhok, Ferry Pier, Novorepnoye
- **Walkable building interiors** — houses have open doorways with 4-wall collision system (gap at front)
- **Helicopter drop** — players spawn at altitude 80m, parachute down to the island (parachute canopy visible)
- **Loot system** — 27 gun pickups + 29 item pickups (medkits, bandages, armor, ammo) scattered across map
- **Pick up guns/items** — walk near and press E (or tap button on mobile)
- **2 lives system** — each player gets only 2 lives; after both are used, "ELIMINATED" screen shows
- **Shrinking zone** — 6 phases with increasing damage (ZoneSystem.tsx), blue ring + red danger zone visual, wall pillars
- **Minimap** — circular minimap (Minimap.tsx) showing player triangle, FOV cone, zone rings, enemy dots, coordinates
- **Sprint/Crouch** — Shift to sprint (1.55x speed, drains stamina), C to crouch (0.5x speed, lower camera)
- **Armor system** — pick up armor items for damage reduction, shown in HUD
- **Dual weapon slots** — carry 2 guns, switch with 1/2 keys, weapon slot UI in HUD
- **Kill streaks** — First Blood, Double Kill, Triple Kill, Quad Kill, Rampage announcements
- **Damage direction** — red arrow indicator pointing toward attacker
- **Inventory** — medkits (F to heal +50hp), bandages (+15hp up to 75), ammo boxes
- **Players alive counter** — shown in top bar
- **Mobile controls** — Sprint, Crouch, Heal, weapon slot 1/2 touch buttons
- Helicopter visual flies across the map during drop phase
- **Secret Aimbot** — Shift+I to toggle auto-aim at nearest enemy head, "AIM LOCK" indicator shown below crosshair

### Key Files (Legendary Update)
- `src/game/store.ts` — Full Zustand store with zone, armor, sprint, weapon slots, kill streaks, inventory
- `src/game/ZoneSystem.tsx` — 3D shrinking zone with 6 phases, ring geometry updates per frame
- `src/game/Minimap.tsx` — Canvas-based circular minimap with 100ms redraw interval
- `src/game/PlayerController.tsx` — Sprint/crouch/stamina, zone damage ticks, item proximity scan
- `src/game/Arena5.tsx` — BARMUDA_LOOT (guns) + BARMUDA_ITEMS (medkits/armor/etc) with ItemPickup components
- `src/game/HUD.tsx` — Armor bar, weapon slots, kill streak banners, damage arrows, zone info, inventory bar
- `src/game/TouchControls.tsx` — Sprint, crouch, heal, weapon switch mobile buttons

### Performance Optimizations
- `powerPreference: "low-power"` WebGL
- `precision: "lowp"` shader precision
- `antialias: false` for lower GPU load
- `MeshLambertMaterial` (no specular calculation) for all objects
- Fixed 20 tick/s network update rate
- Lerp interpolation for remote players (no jitter)
- Object pooling for shoot events/effects
- Shadow map limited to 512x512
- Minimal geometry (stickman = ~6 primitives)
- No per-frame Vector3 allocations (Stickman.tsx uses manual x/y/z math)
- All loot/item pickups use meshBasicMaterial (no lighting calc)
- No pointLights on any pickups
- castShadow removed from ~50+ decorative meshes (walls, towers, tanks, trees)
- Cylinder geometry segments reduced (12/10→6, palm trunk 7→5, fence posts 6→4)
- InstancedMesh for zone pillars (24 instances)
- Minimap canvas redraws at 200ms interval
- Zone timer/radius store writes throttled (timer: 1s, radius: 0.3 delta)
- Barmuda fog distance reduced (near 60, far 160)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server with Socket.IO game server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation.

- Entry: `src/index.ts` — reads `PORT`, creates HTTP server, initializes Socket.IO game server
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Game server: `src/game-server.ts` — real-time multiplayer logic
- Routes: `src/routes/index.ts` mounts sub-routers
- Socket.IO path: `/socket.io/` (proxied through Vite in dev)

### `artifacts/3d-game` (`@workspace/3d-game`)

React + Vite FPS game with Three.js via React Three Fiber.

- `vite.config.ts` — Vite config with `/socket.io` proxy to port 8080
- Game files in `src/game/`

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Currently no game tables (game state is in-memory on the server).
