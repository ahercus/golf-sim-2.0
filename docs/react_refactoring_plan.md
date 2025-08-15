## Goals

- **Framework**: Migrate from CRA to Next.js (App Router) with TypeScript.
- **UI**: Replace all dropdowns, tabs, buttons and text inputs with shadcn/ui.
- **Architecture**: Modularize into small components, extracted hooks, and domain libraries.
- **Security**: Move OpenAI calls server-side; no secrets in client bundles.
- **Performance & DX**: Tailwind CSS, better state management, linting/testing/CI.

## Target Stack

- **Next.js** (App Router) with **TypeScript**
- **Tailwind CSS** + **shadcn/ui** components
- **Zustand** for global game state; **XState** for shot lifecycle (already in deps)
- **Mapbox GL** via `react-map-gl`, dynamically imported on the client
- **OpenAI Assistants v2** via Next.js Route Handlers (`app/api/*/route.ts`)

## Final Folder Structure

```
/
├─ app/
│  ├─ layout.tsx                     # Root layout
│  ├─ globals.css                    # Tailwind base + mapbox css import
│  ├─ (game)/                        # Route group for game UI
│  │  ├─ page.tsx                    # Game entry (formerly App)
│  │  ├─ components/                 # Page-local components
│  │  │  ├─ GolfSidebar.tsx
│  │  │  ├─ ClubSelect.tsx           # shadcn Select
│  │  │  ├─ ShotPlanInput.tsx        # shadcn Input/Textarea
│  │  │  ├─ CommentaryPanel.tsx
│  │  │  ├─ MapCanvas.tsx
│  │  │  ├─ AimingOverlay.tsx        # migrated
│  │  │  └─ Tracer.tsx
│  │  └─ hooks/                      # Page-local hooks if needed
│  ├─ api/
│  │  ├─ openai/
│  │  │  ├─ thread/route.ts          # POST create thread
│  │  │  ├─ message/route.ts         # POST add message
│  │  │  ├─ run/route.ts             # POST create run + polling
│  │  │  └─ latest/route.ts          # GET latest assistant msg
│  └─ (marketing)/
│     └─ page.tsx (optional future)
├─ components/                        # Shared UI components
│  ├─ ui/                             # shadcn generated components
│  ├─ Buttons/
│  ├─ Tabs/
│  ├─ Forms/
│  └─ Icons/                          # lucide-react wrappers if any
├─ features/
│  └─ golf/
│     ├─ state/                       # Zustand stores, XState machines
│     │  ├─ useGameStore.ts
│     │  └─ shotMachine.ts
│     ├─ lib/                         # domain logic
│     │  ├─ geometry.ts               # distances, bearings, arcs
│     │  ├─ collision.ts              # OB/water/green/bunker detection
│     │  ├─ shot.ts                   # shot sim helpers
│     │  └─ wind.ts
│     ├─ data/                        # course datasets
│     │  ├─ PebbleData.ts
│     │  └─ HoleMetadata.ts
│     └─ types.ts                     # Golf domain types
├─ lib/                                # app-level helpers
│  ├─ env.ts                          # type-safe env access (server/client)
│  └─ fetch.ts                        # small fetch wrapper with errors
├─ services/
│  └─ openai.ts                       # server-side client (used by route handlers)
├─ public/
│  └─ assets/                         # images, audio (golfSwing.mp3)
├─ styles/
│  └─ shadcn.css (if needed)
├─ tests/
│  ├─ lib.golf.geometry.test.ts
│  └─ lib.golf.collision.test.ts
├─ docs/
│  └─ react_refactoring_plan.md
└─ package.json
```

## Environment Variables

- Client-side Mapbox: `NEXT_PUBLIC_MAPBOX_TOKEN`
- Server-side OpenAI: `OPENAI_API_KEY`, `OPENAI_ASSISTANT_ID`
- Assumption: environment files already exist and are managed outside of version control. Only update code to reference the above names.

## Migration Strategy (Phased)

### Phase 0 – Preparation

- Audit dependencies; note removals and additions (see checklist below).
- Freeze `main` and branch `nextjs-migration` for work.

### Phase 1 – Scaffold Next.js + TS + Tailwind + shadcn

- [x] Initialize Next.js (TypeScript, App Router) at repo root.
- [x] Add Tailwind CSS and configure `globals.css`.
- [x] Initialize shadcn/ui and generate core components: Button, Input, Label, Tabs, Select, Textarea, Toast/Toaster.
- [x] Add aliases in `tsconfig.json` and `next.config.js` for `@/` paths.

### Phase 2 – Extract and Type Domain Logic

- Create `features/golf/lib/*` and migrate pure functions from `src/GolfGame.js`:
  - `distanceYards`, `bearingBetween`, polygon checks, OB/water/green detection
  - Shot/path helpers (linear path, tracer), wind helpers
- Add `features/golf/types.ts` with domain types: `Coordinate`, `Lie`, `ClubName`, `ShotOutcome`, `Wind`, `HoleNumber`, `ShotPlan`, `ShotResult`.
- Convert `PebbleData.js` and `HoleMetadata.js` to typed modules.

### Phase 3 – State Management

- Create `useGameStore.ts` (Zustand) for global state: player, selectedHole, scores, wind, aimMode.
- Create `shotMachine.ts` (XState) for the shot lifecycle (idle → aiming → swinging → resolving → done/error).
- Replace ad-hoc `useState` islands with store + machine where appropriate.

### Phase 4 – Page and Component Decomposition

- Create `app/(game)/page.tsx` as the main entry.
- Split the former `GolfGame.js` into composable components:
  - `GolfSidebar.tsx` (holds Tabs + controls)
  - `ClubSelect.tsx` (shadcn Select, reads from store)
  - `ShotPlanInput.tsx` (shadcn Input/Textarea)
  - `CommentaryPanel.tsx`
  - `MapCanvas.tsx` (Map, markers, overlays; dynamic import client-only)
  - `AimingOverlay.tsx` (SVG overlay, client-only)
  - `Tracer.tsx` (animates tracer lines)
- Move `WelcomeScreen` and `Scorecard` under `features/golf` or `app/(game)/components` and update to shadcn UI.

### Phase 5 – API: Server-side OpenAI

- [x] Implement Next.js route handlers under `app/api/openai/*` to proxy Assistants v2 operations:
  - `POST /api/openai/thread` → create thread
  - `POST /api/openai/message` → add message
  - `POST /api/openai/run` → create run and poll until terminal state (server-side)
  - `GET /api/openai/latest` → latest assistant message
- [x] Move client-side OpenAI calls to fetch these endpoints.
- [x] Read secrets only on the server; validate inputs and return structured errors.

### Phase 6 – UI Rewrite to shadcn

- Replace:
  - Native `<select>` → shadcn `Select`
  - Custom/legacy Tabs → shadcn `Tabs`
  - Buttons → shadcn `Button` variants
  - Text inputs → shadcn `Input`/`Textarea` with `Label`
- Tailwind-ify layout and remove inline styles where feasible.
- Keep a thin layer of CSS for Mapbox-specific styles in `globals.css`.
 - Add `Toaster` in the root layout and use shadcn `toast` for error/success/info messages across the app (API failures, missing tokens, validation errors, run timeouts).

### Phase 7 – Testing, Linting, CI

- ESLint (Next.js config) + Prettier; strict TS `"strict": true`.
- Unit tests for `lib/*` geometry/collision; component tests for sidebar and map interactions.
- GitHub Actions: lint, typecheck, build, and run tests.

### Phase 8 – Cleanup & Decommission CRA

- [x] Remove CRA-specific files (`public/index.html`, `react-scripts`, etc.).
- [x] Remove unused dependencies and dead code.
- [ ] Update README with Next.js commands.

## Dependency Plan

### Add

- `next`, `react`, `react-dom`
- `typescript`, `@types/react`, `@types/react-dom`
- `tailwindcss`, `postcss`, `autoprefixer`
- `class-variance-authority`, `clsx`, `tailwind-merge` (shadcn peer utils)
- `@radix-ui/react-tabs`, `@radix-ui/react-select` (shadcn uses Radix under the hood)
- `lucide-react` (icons)
- `zustand`, `xstate`
 - `sonner` (shadcn toast implementation)

### Keep

- `react-map-gl`, `mapbox-gl`

### Remove

- `react-scripts` (CRA)
- `react-three-fiber` (legacy; use `@react-three/fiber` only if actually used)
- Any unused libs: `@shadcn/ui` placeholder package (use the generator instead), `cannon`/`@react-three/cannon` if not used

## TypeScript Types (Domain)

- `Coordinate` → `{ lat: number; lng: number }`
- `Lie` → `'tee' | 'fairway' | 'rough' | 'bunker' | 'green' | 'ob' | 'water'`
- `ClubName` → union from club constants
- `Wind` → `{ speedMph: number; directionDeg: number }`
- `ShotOutcome` → enum/union for draw/fade/push/pull/etc.
- `ShotPlan` → `{ description: string; aim: Coordinate; club: ClubName }`
- `ShotResult` → `{ endPos: Coordinate; lie: Lie; penalty?: 'ob'|'water'; quality: number }`

## Mapbox in Next.js

- Mark `MapCanvas` and `AimingOverlay` as client components (`"use client"`).
- Dynamically import heavy map code with `next/dynamic` and `ssr: false`.
- Import Mapbox CSS in `app/globals.css` (`@import 'mapbox-gl/dist/mapbox-gl.css';`).
- Use `process.env.NEXT_PUBLIC_MAPBOX_TOKEN` on the client.

## Error Handling & Observability

- Graceful, user-facing errors for missing tokens or API failures.
- Server routes return structured JSON errors with codes and actionable messages.
- Optional: add lightweight request logging and timing on server routes.
 - Centralize user notifications with shadcn `toast` (via `sonner`):
   - Show error toasts on OpenAI/map/network failures and validation issues.
   - Show success/info toasts for key user actions (shot saved, settings saved).
   - Mount a single `Toaster` in `app/layout.tsx`.

## Accessibility & UX

- Use shadcn primitives with accessible labels/aria.
- Keyboard interactions for Tabs/Select.
- Respect reduced motion for tracer animations.

## Performance

- Memoize derived values; throttle mouse events.
- Avoid rerenders of heavy map components via isolated client components and stable props.
- Code-split commentary panel and heavy UI.

## Rollback Plan

- Keep CRA branch until Next.js build passes and feature parity achieved.
- If critical blockers arise, deploy CRA branch while issues are resolved.

## Checklists

### Pre-migration

- [ ] Create `nextjs-migration` branch
- [ ] Inventory dependencies to add/remove
- [ ] Confirm env variables exist: `NEXT_PUBLIC_MAPBOX_TOKEN`, `OPENAI_API_KEY`, `OPENAI_ASSISTANT_ID`

### Phase 1 – Scaffold

- [ ] Initialize Next.js (TypeScript, App Router)
- [ ] Configure Tailwind and `globals.css`
- [ ] Initialize shadcn and generate Button, Input, Label, Tabs, Select, Textarea
- [ ] Add `@/` path aliases

### Phase 2 – Domain Logic

- [x] Create `features/golf/lib/*` and migrate geometry/collision helpers
- [x] Add `features/golf/types.ts` and type basic domain
- [x] Type `PebbleData` and `HoleMetadata`

### Phase 3 – State

- [x] Add `useGameStore.ts` (Zustand) for global state
- [ ] Add `shotMachine.ts` (XState) and integrate with UI

### Phase 4 – Components

- [x] Create `app/(game)/page.tsx`
- [x] Build `ClubSelect`, `ShotPlanInput`, `CommentaryPanel`
- [x] Build `GolfSidebar` and `MapCanvas` wrappers
- [ ] Replace inline styles with Tailwind where feasible
 - [ ] Extract `AimingOverlay` and `Tracer` to TS components

### Phase 5 – API

- [ ] Implement `app/api/openai/*` routes
- [ ] Replace client calls to use server routes
- [ ] Add structured error responses and retries where appropriate

### Phase 6 – UI to shadcn

- [x] Replace dropdown in GolfGame with shadcn `Select`
- [x] Replace Tabs in GolfGame with shadcn `Tabs`
- [x] Replace primary action with shadcn `Button`
- [x] Replace shot plan input with shadcn `Input` + `Label`

### Phase 7 – QA

- [ ] ESLint, Prettier, strict TS
- [ ] Unit tests for `lib/*`; component tests for sidebar/map
- [ ] Build and run on local, verify all holes, tracer, commentary

### Phase 8 – Cleanup

- [ ] Remove CRA files and unused deps
- [x] Update README with Next.js commands
- [ ] Merge to `main`


