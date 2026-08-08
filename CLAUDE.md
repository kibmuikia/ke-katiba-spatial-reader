# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`my-three-app` is a single-page Vite + TypeScript app that renders an interactive 3D model of the Kenyan Constitution book. Clicking the book opens/closes its front cover, plays a synthesized paper-flip audio cue, and reveals a side info panel with chapter cards. A top-bar button toggles between dark and light themes, with the Three.js scene background re-synced from CSS custom properties.

## to note
- always keep claude.md and readme.md file updated after tasks to ensure info is valid without losing valid data and ensuring claude specifically is compact.
- provide sample git commit message to use after a task.

## Commands

This project uses `pnpm` (see `pnpm-lock.yaml`). Node tooling is the standard Vite + TypeScript stack.

- Install: `pnpm install`
- Dev server (HMR): `pnpm dev`
- Production build (runs `tsc` then `vite build`): `pnpm build`
- Preview built bundle: `pnpm preview`

There is no test runner configured. To type-check only, run `pnpm exec tsc --noEmit`.

## Architecture

The whole app lives in `src/main.ts` (one file) and is loaded from `index.html` via `<script type="module" src="/src/main.ts">`. `src/counter.ts` and `src/style.css` are unused Vite scaffolding leftovers from the template — do not extend them.

`index.html` is structured in three layers:

1. **Design tokens** — `:root[data-theme="light"]` and `:root[data-theme="dark"]` CSS custom properties (`--bg-canvas`, `--bg-surface`, `--text-primary`, `--interactive-primary`, etc.). These are the single source of truth for color; `main.ts` reads them at runtime via `getThemeColor()` and re-applies them when the theme toggles.
2. **HUD chrome** — top bar (`.brand-badge` "Katiba 3D" + `#themeBtn`), right-side `.info-panel` (chapter cards), and bottom `.hint-overlay`. All HUD elements use `pointer-events: none` by default; only `.interactive-element` nodes receive clicks so the raycaster can hit the 3D book.
3. **`<div id="app">`** — the Three.js canvas is appended to `document.body` in `main.ts`, not into `#app`.

`src/main.ts` is organized into seven labeled sections (numbered comments). The critical architecture points:

- **Book assembly as a `THREE.Group`** — `bookGroup` contains the page block (gilded side, ivory top/bottom faces), back cover, spine, and a `frontCoverPivot` `THREE.Group` placed at the hinge edge. The pivot's `rotation.z` is the only animated transform that opens the cover — children inherit it. `bookGroup` itself has idle bobbing/swaying (`Math.sin(Date.now()...)`) only while closed; it lerps to a settled pose when open.
- **Procedural cover texture** — `createKenyanCoverTexture()` paints a 1024×1433 canvas (green court color, gold borders, Maasai shield, "Harambee") and wraps it as a `THREE.CanvasTexture` (SRGB color space). This is the only textured material; the back cover/spine use a flat `MeshStandardMaterial`.
- **Paper-flip audio** — `PaperAudioEngine` lazily creates an `AudioContext` on the first user click (browser autoplay policy), then synthesizes a lowpass-swept white-noise burst (~550 ms). Created once at module scope as `sfx`.
- **Interaction** — A single `window.click` listener raycasts against `bookGroup.children` (recursive). Clicks on `.interactive-element` (the theme button) are filtered out via `event.target.closest()`. On a hit, it toggles `isOpen`, sets `targetRotation` to `Math.PI * 0.92`, triggers `sfx.playFlippingEffect()`, and shows/hides `#infoPanel` + fades `#hintOverlay`.
- **Animation loop** — `animate()` uses `requestAnimationFrame` and lerps `frontCoverPivot.rotation.z` toward `targetRotation` at `animationSpeed = 0.06`. No clock-based dt is used; it's frame-rate-coupled.

## Conventions

- `package.json` has `"type": "module"` — all imports use ESM. `tsconfig.json` uses `verbatimModuleSyntax` and `moduleResolution: "bundler"`, so type-only imports need `import type`.
- TS strict-ish flags are on: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `erasableSyntaxOnly`. The build will fail on unused symbols.
- No CSS framework — styling lives inline in `index.html`'s `<style>` block and in the unused `src/style.css`.
- The favicon lives at `public/favicon.svg`; the Vite scaffold `src/assets/` icons are unused.
- `data/` is a scratch directory for screenshots/logs and is gitignored.

## Gotchas

- The book's pivot axis matters: `frontCoverPivot` sits at `-(bookWidth/2), bookThickness/2, 0` (the spine/hinge edge), not the book center. Moving the cover mesh without updating the pivot will rotate it around the wrong axis.
- Theme colors must be added to *both* `:root[data-theme="light"]` and `:root[data-theme="dark"]` and referenced via `getThemeColor()` to stay in sync with the 3D scene. Hardcoding `0x` colors in materials breaks the dark/light toggle.
- The click listener is global on `window` and bails on `.interactive-element` ancestors — any new HUD control that shouldn't trigger the book must be inside an element with that class.
- `index.html.bak`, `src/main.ts.bak`, and `src/main.ts.2.bak` are leftover snapshots; ignore them.
