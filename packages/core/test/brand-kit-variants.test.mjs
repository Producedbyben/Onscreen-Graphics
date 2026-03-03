import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultBrandKit, generateVariants, withProjectBrandKitDefaults } from "../dist/brandKit.js";

function createProjectFixture() {
  return {
    id: "project-brand",
    name: "Brand Project",
    fps: 30,
    width: 1080,
    height: 1920,
    durationMs: 4000,
    tracks: [
      {
        id: "track-1",
        name: "Main",
        type: "video",
        clips: [
          {
            id: "clip-1",
            sourceUri: "file:///clip.mp4",
            startTimeMs: 0,
            durationMs: 4000,
            overlays: [
              {
                id: "ov-1",
                kind: "text",
                startTimeMs: 0,
                endTimeMs: 2000,
                layer: 1,
                style: { text: "{{team}} wins", color: "{{primary}}" },
                keyframes: [],
              },
            ],
          },
        ],
      },
    ],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    metadata: {},
  };
}

test("createDefaultBrandKit merges overrides while preserving defaults", () => {
  const kit = createDefaultBrandKit({ accentColor: "#FFFFFF", typography: { fontFamily: "Sora" } });
  assert.equal(kit.primaryColor, "#0EA5E9");
  assert.equal(kit.accentColor, "#FFFFFF");
  assert.equal(kit.typography.fontFamily, "Sora");
  assert.equal(kit.typography.fallbackFontFamily, "sans-serif");
});

test("withProjectBrandKitDefaults attaches a defaulted brand kit", () => {
  const fixture = createProjectFixture();
  const next = withProjectBrandKitDefaults(fixture, { primaryColor: "#111111" });

  assert.equal(next.metadata.brandKit.primaryColor, "#111111");
  assert.equal(next.metadata.brandKit.secondaryColor, "#1E293B");
  assert.equal(fixture.metadata.brandKit, undefined);
});

test("generateVariants creates independent variant projects with substitutions", () => {
  const fixture = createProjectFixture();
  const variants = generateVariants(fixture, [
    {
      variantId: "falcons",
      substitutions: { "{{team}}": "Falcons", "{{primary}}": "#1D4ED8" },
      brandKit: { primaryColor: "#1D4ED8", typography: { fontFamily: "Inter" } },
    },
    {
      variantId: "sharks",
      substitutions: { "{{team}}": "Sharks", "{{primary}}": "#EA580C" },
      brandKit: { primaryColor: "#EA580C", typography: { fontFamily: "Sora" } },
    },
  ]);

  assert.equal(variants.length, 2);
  assert.equal(variants[0].id, "project-brand--falcons");
  assert.equal(variants[0].tracks[0].clips[0].overlays[0].style.text, "Falcons wins");
  assert.equal(variants[1].tracks[0].clips[0].overlays[0].style.color, "#EA580C");
  assert.equal(variants[1].metadata.brandKit.typography.fontFamily, "Sora");
  assert.equal(fixture.tracks[0].clips[0].overlays[0].style.text, "{{team}} wins");
});
