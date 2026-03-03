import test from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";

const { enforceOverlayTextLegibility } = await import("../src/index.js");

test("enforceOverlayTextLegibility applies fallback styles for low-contrast text overlays", () => {
  const project = {
    id: "project-legibility",
    name: "Legibility",
    fps: 30,
    width: 1080,
    height: 1920,
    durationMs: 3000,
    tracks: [
      {
        id: "track-video",
        name: "Video",
        type: "video",
        clips: [
          {
            id: "clip-1",
            sourceUri: "file:///clip.mp4",
            startTimeMs: 0,
            durationMs: 3000,
            overlays: [
              {
                id: "overlay-text-1",
                kind: "text",
                startTimeMs: 0,
                endTimeMs: 1800,
                layer: 1,
                style: { color: "#B9BDC3" },
                keyframes: []
              }
            ]
          }
        ]
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: { timeline: { layerLocks: {} } }
  };

  const updated = enforceOverlayTextLegibility(project, "#C0C4CB");
  const style = updated.tracks[0].clips[0].overlays[0].style;

  assert.equal(style.color, "#111111");
  assert.equal(style.strokeWidth, 2);
  assert.ok(typeof style.textShadow === "string");
});
