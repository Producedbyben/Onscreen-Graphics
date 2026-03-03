# Golden fixture update workflow

Renderer snapshot tests use golden files in `packages/renderer/test/golden/` to pin deterministic output from `buildRenderJobFormat`.

## Run tests normally

```bash
npm --workspace @onscreen/renderer run test
npm --workspace @onscreen/core run test
```

## Intentionally update golden fixtures

When renderer payload shape/order changes intentionally, regenerate snapshots and commit the updated goldens in the same PR:

```bash
UPDATE_GOLDEN=1 npm --workspace @onscreen/renderer run test
npm --workspace @onscreen/renderer run test
```

The second command verifies the newly written snapshots are stable.

## Review checklist

- Confirm changed files under `packages/renderer/test/golden/*.render-job.json` are expected.
- Verify ordering changes are intentional (tracks, clips, overlays, and media assets).
- Include a short note in the PR summary describing why the golden changed.
