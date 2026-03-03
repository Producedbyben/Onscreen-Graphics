import test from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";

const { listCaptionStylePacks, normalizeProjectCaptions } = await import("../src/index.js");

test("caption style packs expose curated packs and presets", () => {
  const packs = listCaptionStylePacks();

  assert.equal(packs.length, 4);
  assert.ok(packs.every((pack) => pack.presets.length >= 2));
  assert.ok(packs.some((pack) => pack.id === "sports" && pack.highlightModes.includes("karaoke")));
});

test("caption normalization keeps style in-bounds for selected pack", () => {
  const project = {
    id: "project-captions",
    name: "Captions",
    fps: 30,
    width: 1080,
    height: 1920,
    durationMs: 3000,
    tracks: [],
    captions: {
      segments: [],
      stylePreset: { packId: "news", presetId: "missing-preset" },
      highlightMode: "karaoke"
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {}
  };

  normalizeProjectCaptions(project);

  assert.equal(project.captions.stylePreset.packId, "news");
  assert.equal(project.captions.stylePreset.presetId, "ticker-blue");
  assert.equal(project.captions.highlightMode, "segment");
});
