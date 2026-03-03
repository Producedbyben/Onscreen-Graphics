import test from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

process.env.NODE_ENV = "test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const storageDir = resolve(__dirname, "../storage");
const draftPath = resolve(storageDir, "latest-draft.json");
const { saveDraft, loadDraft } = await import("../src/index.js");

test("saveDraft and loadDraft preserve caption segments and style metadata", () => {
  const project = {
    id: "project-test",
    name: "Caption Project",
    fps: 30,
    width: 1080,
    height: 1920,
    durationMs: 4000,
    tracks: [],
    captions: {
      segments: [{ text: "hello", startTimeMs: 0, endTimeMs: 500 }],
      stylePreset: { presetId: "bold-yellow", packId: "sports", variantId: "v1" },
      highlightMode: "karaoke"
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {}
  };

  saveDraft(project);
  const loaded = loadDraft();

  assert.deepEqual(loaded.project.captions.segments, project.captions.segments);
  assert.equal(loaded.project.captions.stylePreset.presetId, "bold-yellow");
  assert.equal(loaded.project.captions.highlightMode, "karaoke");
});

test("loadDraft backfills captions for legacy drafts", () => {
  const legacyRecord = {
    project: {
      id: "legacy-project",
      name: "Legacy",
      fps: 30,
      width: 1080,
      height: 1920,
      durationMs: 3000,
      tracks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {}
    },
    updatedAt: new Date().toISOString()
  };

  writeFileSync(draftPath, JSON.stringify(legacyRecord, null, 2));
  const loaded = loadDraft();

  assert.ok(loaded.project.captions);
  assert.deepEqual(loaded.project.captions.segments, []);
  assert.equal(loaded.project.captions.stylePreset.presetId, "classic-white");
  assert.equal(loaded.project.captions.highlightMode, "word");
});
