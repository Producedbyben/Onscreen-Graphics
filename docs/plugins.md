# Plugin API (`@onscreen/core`)

`@onscreen/core` exposes a plugin contract so external packages can contribute:

- overlay element types,
- animation/easing presets,
- template packs,
- optional data providers (score feeds, CSV import, etc.).

## Core Types

The plugin API is exported from `packages/core/src/plugins.ts`.

### `OsgPlugin`

Each plugin is a plain object with metadata, optional contributions, and optional lifecycle hooks.

```ts
import type { OsgPlugin } from "@onscreen/core";

const plugin: OsgPlugin = {
  id: "acme-score-pack",
  name: "ACME Score Pack",
  version: "1.0.0",
  description: "Adds a scoreboard overlay and live score feed provider",
  contributions: {
    overlayElementTypes: [
      { id: "acme-score-bug", label: "Score Bug" },
    ],
    animationPresets: [
      { id: "acme-bounce-in", label: "Bounce In", easing: "cubic-bezier(0.34,1.56,0.64,1)" },
    ],
    templatePacks: [],
    dataProviders: [
      { id: "acme-live-scores", label: "Live Scores" },
    ],
  },
};
```

## Registry Lifecycle

Use `PluginRegistry` to register plugins and query resolved contributions.

1. `register(plugin)`
   - stores plugin metadata,
   - indexes contributions,
   - recalculates capability flags,
   - runs `plugin.onRegister(context)`.
2. `activate(pluginId)`
   - runs `plugin.onActivate(context)`.
3. `deactivate(pluginId)`
   - runs `plugin.onDeactivate(context)`.
4. `dispose(pluginId)`
   - runs `plugin.onDispose(context)`,
   - removes contributions from the registry,
   - recalculates capability flags.

Lifecycle hooks can be async and receive:

- `context.registry`: current `PluginRegistry` instance,
- `context.now()`: timestamp helper for logging/telemetry.

## Capability Flags for UI Gating

UI surfaces can conditionally render controls by reading `registry.getCapabilities()`.

```ts
{
  "overlay-elements": boolean,
  "animation-presets": boolean,
  "template-packs": boolean,
  "data-providers": boolean,
}
```

Example: hide "Import CSV" if `data-providers` is false.

## Contribution Query APIs

After registration, the host can query contributions with:

- `listOverlayElementTypes()`
- `listAnimationPresets()`
- `listTemplatePacks()`
- `listDataProviders()`
- `listPlugins()`

These values are normalized and ready for UI pickers, inspectors, and import dialogs.
