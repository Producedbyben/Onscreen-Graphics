# Onscreen Graphics Monorepo

This repository is organized as a TypeScript monorepo for building an on-screen graphics editor and renderer pipeline.

## Local run commands

From the repo root:

- `npm install` — install all workspace dependencies.
- `npm run dev:web` — run the local web UI server in `apps/web` (open http://localhost:3000 in Chrome).
- `npm run typecheck` — run type checks across all workspaces.
- `npm run build` — build every workspace package/app.

For a server-free local experience:

- `run-local.html` — open this file directly in Chrome for a no-server local video editor (template picker, video upload preview, draggable text layers, add-layer-at-playhead controls (including per-field quick-add buttons) with on-entry animations, timeline visibility windows, scenes, and JSON export; no `npm install` required).

You can also run package-specific scripts:

- `npm --workspace @onscreen/core run build`
- `npm --workspace @onscreen/renderer run build`
- `npm --workspace @onscreen/template-library run build`

## Package responsibilities

- `apps/web`
  - Editor user interface, including timeline, canvas, and template picker.
  - Consumes domain models from `@onscreen/core`.
  - Loads predefined templates from `@onscreen/template-library`.

- `packages/core`
  - Shared TypeScript interfaces and domain logic.
  - Defines project model types such as `Project`, `Track`, `Clip`, `OverlayElement`, `AnimationKeyframe`, and `TemplateDefinition`.

- `packages/renderer`
  - Deterministic rendering/export pipeline.
  - Accepts `Project` data and produces reproducible encoded output.

- `packages/template-library`
  - Predefined template formats for rankings, scoreboards, and listicles.
  - Exposes reusable `TemplateDefinition` presets for the editor.

## Data flow: upload -> edit -> export

1. **Upload**
   - Users upload source media in `apps/web`.
   - The editor creates clip records (`Clip`) and attaches them to timeline tracks (`Track`) inside a project (`Project`).

2. **Edit**
   - In the timeline/canvas UI, users trim clips, add overlays (`OverlayElement`), and adjust animation keyframes (`AnimationKeyframe`).
   - Users can pick a preset from `packages/template-library` to seed tracks, overlays, and placeholder content via `TemplateDefinition`.
   - Edits persist as normalized `Project` state defined by `packages/core`.

3. **Export**
   - The finalized `Project` is passed to `packages/renderer`.
   - Renderer resolves tracks/clips/overlays deterministically and exports a video file with stable output behavior.
