import test from "node:test";
import assert from "node:assert/strict";
import { renderProjectBatch, renderProjectRequest } from "../dist/renderer/src/index.js";

function createRequest({ idempotencyKey, width = 1080 } = {}) {
  return {
    project: {
      id: `project-${idempotencyKey}`,
      name: "Render Fixture",
      fps: 30,
      width,
      height: 1920,
      durationMs: 3000,
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
              durationMs: 3000,
              overlays: [],
            },
          ],
        },
      ],
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
    outputPath: "s3://render-output",
    preset: "social-1080x1920-30",
    idempotencyKey,
    mediaAssets: [
      {
        id: "asset-1",
        uri: "file:///clip.mp4",
        kind: "video",
        codec: "h264",
        container: "mp4",
        width,
        height: 1920,
        fps: 30,
      },
    ],
    retry: { maxAttempts: 2 },
  };
}

test("renderProjectBatch aggregates per-variant status and retry totals", () => {
  const batch = renderProjectBatch({
    batchId: "batch-1",
    variants: [
      { variantId: "valid", request: createRequest({ idempotencyKey: "ok-1" }) },
      { variantId: "invalid", request: createRequest({ idempotencyKey: "bad-1", width: 720 }) },
    ],
  });

  assert.equal(batch.totalVariants, 2);
  assert.equal(batch.completedVariants, 1);
  assert.equal(batch.failedVariants, 1);
  assert.equal(batch.status, "failed");

  const failed = batch.variants.find((variant) => variant.variantId === "invalid");
  assert.equal(failed.attempt, 2);
  assert.equal(failed.retriesUsed, 1);
});

test("renderProjectRequest accepts batch payloads", () => {
  const result = renderProjectRequest({
    batchId: "batch-2",
    variants: [{ variantId: "valid", request: createRequest({ idempotencyKey: "ok-2" }) }],
  });

  assert.equal(result.batchId, "batch-2");
  assert.equal(result.status, "completed");
  assert.equal(result.variants[0].status, "completed");
});
