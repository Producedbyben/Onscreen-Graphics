import test from "node:test";
import assert from "node:assert/strict";
import { runAutomationBatch } from "../dist/automation.js";

function createProjectFixture() {
  return {
    id: "project-1",
    name: "Automation Fixture",
    fps: 30,
    width: 1080,
    height: 1920,
    durationMs: 5000,
    tracks: [
      {
        id: "track-1",
        name: "Main",
        type: "video",
        clips: [
          {
            id: "clip-a",
            sourceUri: "file:///clip.mp4",
            startTimeMs: 0,
            durationMs: 2500,
            overlays: [
              {
                id: "overlay-1",
                kind: "text",
                startTimeMs: 0,
                endTimeMs: 900,
                layer: 1,
                style: { text: "Hello Team", color: "#FFFFFF" },
                keyframes: []
              }
            ]
          }
        ]
      }
    ],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    metadata: {}
  };
}

test("runAutomationBatch duplicates clips with deterministic replacement ordering", () => {
  const fixture = createProjectFixture();
  const operations = [
    {
      type: "duplicate-with-replacements",
      clipId: "clip-a",
      duplicateCount: 2,
      replacements: {
        Team: "Fans",
        Hello: "Go"
      }
    }
  ];

  const firstRun = runAutomationBatch(fixture, operations);
  const secondRun = runAutomationBatch(fixture, operations);

  const firstClips = firstRun.project.tracks[0].clips.map((clip) => clip.id);
  const secondClips = secondRun.project.tracks[0].clips.map((clip) => clip.id);
  assert.deepEqual(firstClips, secondClips);
  assert.equal(firstRun.project.tracks[0].clips[1].overlays[0].style.text, "Go Fans");
  assert.equal(firstRun.appliedOperations[0].details, "Duplicated clip clip-a 2 time(s).");
});

test("runAutomationBatch bulk style apply patches all matching overlays", () => {
  const fixture = createProjectFixture();
  fixture.tracks[0].clips[0].overlays.push({
    id: "overlay-2",
    kind: "shape",
    startTimeMs: 200,
    endTimeMs: 800,
    layer: 2,
    style: { opacity: 0.8 },
    keyframes: []
  });

  const result = runAutomationBatch(fixture, [
    {
      type: "bulk-style-apply",
      overlayKind: "text",
      stylePatch: { fontWeight: 700, color: "#FFEE00" }
    }
  ]);

  assert.equal(result.project.tracks[0].clips[0].overlays[0].style.fontWeight, 700);
  assert.equal(result.project.tracks[0].clips[0].overlays[0].style.color, "#FFEE00");
  assert.equal(result.project.tracks[0].clips[0].overlays[1].style.color, undefined);
  assert.equal(result.appliedOperations[0].details, "Applied style patch to 1 overlay(s).");
});
