# CLAUDE.md

Working notes for Claude Code agents on this repo. Keep this file lean — link to README.md for user-facing context.

## Project

Single-page Vite + TypeScript app that renders an interactive 3D model of the Constitution of Kenya (2010). Click the book → cover opens on its hinge, synthesised paper-flip audio plays, side panel slides in with real chapter cards (18 chapters, 227 articles) populated from `ke-katiba-digest` JSON. Theme toggle (dark/light) re-syncs the Three.js scene from CSS custom properties.

## Commands (pnpm)

- `pnpm install` · `pnpm dev` · `pnpm build` (runs `tsc` then `vite build`)
- `pnpm preview` · `pnpm typecheck` (`tsc --noEmit`)
- No test runner configured.

## Layout

- `src/main.ts` — 3D scene, interaction, theme toggle. Organised in 7 numbered sections (Scene/Lights/Audio/Materials/Geometry/Interaction/Animation).
- `src/data.ts` — `loadConstitution()` (JSON, cached) and `loadConstitutionDb()` (lazy `sql.js` + SQLite mirror). Main.ts renders chapters from `loadConstitution()`.
- `src/counter.ts`, `src/style.css`, `src/assets/` — unused Vite scaffold leftovers. Don't extend.
- `public/data/constitution_kenya_2010.{json,db}` — bundled snapshots from [kibmuikia/ke-katiba-digest](https://github.com/kibmuikia/ke-katiba-digest). Refresh by re-curling from `main`.
- `index.html` — design tokens (`:root[data-theme=…]`) + HUD shell (`.brand-badge`, `#themeBtn`, `.info-panel`, `.hint-overlay`) + `#app` mount. Three.js canvas is appended to `document.body`, not `#app`.
- `data/` — gitignored scratch (screenshots, logs).
- Leftover snapshots to ignore: `index.html.bak`, `src/main.ts.bak`, `src/main.ts.2.bak`.

## Architecture notes

- **`bookGroup`** is the root `THREE.Group`. Cover opens via `frontCoverPivot.rotation.z` lerped toward `targetRotation` at `animationSpeed = 0.06` (no clock-based dt — frame-rate-coupled). Idle bob/sway only while closed; lerps to settled pose when open.
- **`frontCoverPivot`** sits at `-(bookWidth/2), bookThickness/2, 0` (spine/hinge edge), **not** the book centre. Moving the cover mesh without updating the pivot rotates around the wrong axis.
- **`PaperAudioEngine`** (`sfx`) lazily creates `AudioContext` on first click (autoplay policy). Synthesises a lowpass-swept white-noise burst (~550 ms).
- **Single global click listener** on `window`. Raycasts against `bookGroup.children` (recursive). Bails if `event.target.closest('.interactive-element')` matches — any HUD control that shouldn't trigger the book must be inside that class.
- **Cover texture** — `createKenyanCoverTexture()` paints a 1024×1433 canvas (court green, gold borders, Maasai shield, "Harambee") → `THREE.CanvasTexture` (SRGB). Only textured material; back cover/spine use flat `MeshStandardMaterial`.
- **Theme** — CSS custom properties on `:root[data-theme=light|dark]` are the single source of truth for colour. `getThemeColor()` reads them at runtime; `scene.background` is re-applied on toggle. Hardcoded `0x` colours in materials break the toggle.

## Conventions

- `package.json` has `"type": "module"` — ESM imports. `tsconfig.json` uses `verbatimModuleSyntax` + `moduleResolution: "bundler"`, so type-only imports need `import type`.
- Strict-ish TS flags on: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `erasableSyntaxOnly`. Build fails on unused symbols.
- No CSS framework. Styling lives in `index.html`'s `<style>` block.
- Favicon at `public/favicon.svg`.

## Gotchas

- Theme colours must be added to **both** `:root[data-theme="light"]` and `:root[data-theme="dark"]` and referenced via `getThemeColor()`.
- The `src/counter.ts` / `src/style.css` / `src/assets/` are scaffolds — never import them.
- After every task: keep this file and `README.md` accurate and compact; provide a sample commit with a `task: …` message without including co-authored-by-data.
