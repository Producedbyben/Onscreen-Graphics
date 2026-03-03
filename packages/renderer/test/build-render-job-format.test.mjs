import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRenderJobFormat } from "../dist/renderer/src/index.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const fixturesDir = join(__dirname, "fixtures", "projects");
const goldenDir = join(__dirname, "golden");
const templatesDir = join(__dirname, "..", "..", "template-library", "src", "templates");
const fixtureFiles = ["ranking-videos.fixture.json", "scoreboards.fixture.json", "countdown-list.fixture.json"];
const updateGolden = process.env.UPDATE_GOLDEN === "1";

function stableStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }

  const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`).join(",")}}`;
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function buildRequestFromFixture(fixture) {
  const template = loadJson(join(templatesDir, fixture.templateFile));

  const tracks = template.trackBlueprints.map((blueprint, trackIndex) => {
    const clipDuration = Math.floor(fixture.durationMs / (fixture.clipsPerTrack * template.trackBlueprints.length));
    const clips = Array.from({ length: fixture.clipsPerTrack }).map((_, clipIndex) => ({
      id: `${template.id}-track${trackIndex + 1}-clip${clipIndex + 1}`,
      sourceUri: `file:///${template.id}/track-${trackIndex + 1}/clip-${clipIndex + 1}.mp4`,
      startTimeMs: clipIndex * clipDuration,
      durationMs: clipDuration,
      overlays: [
        {
          id: `${template.id}-overlay-${trackIndex + 1}-${clipIndex + 1}`,
          kind: "text",
          startTimeMs: clipIndex * clipDuration,
          endTimeMs: clipIndex * clipDuration + Math.floor(clipDuration / 2),
          layer: trackIndex + 1,
          style: { color: "#FFFFFF", fontWeight: "bold" },
          keyframes: [
            { id: `${template.id}-kf-in-${trackIndex + 1}-${clipIndex + 1}`, property: "opacity", timeMs: 0, value: 0 },
            {
              id: `${template.id}-kf-out-${trackIndex + 1}-${clipIndex + 1}`,
              property: "opacity",
              timeMs: Math.floor(clipDuration / 2),
              value: 1,
            },
          ],
        },
      ],
    }));

    return {
      id: `${template.id}-track${trackIndex + 1}`,
      name: blueprint.name,
      type: blueprint.type,
      clips,
    };
  });

  const mediaAssets = tracks
    .flatMap((track, trackIndex) =>
      track.clips.map((clip, clipIndex) => ({
        id: `${track.id}-asset-${clipIndex + 1}`,
        uri: clip.sourceUri,
        kind: "video",
        codec: "h264",
        container: "mp4",
        width: fixture.width,
        height: fixture.height,
        fps: fixture.fps,
        metadata: {
          templateId: template.id,
          trackOrder: trackIndex,
          clipOrder: clipIndex,
        },
      })),
    )
    .sort((a, b) => a.id.localeCompare(b.id));

  return {
    project: {
      id: fixture.projectId,
      name: fixture.projectName,
      fps: fixture.fps,
      width: fixture.width,
      height: fixture.height,
      durationMs: fixture.durationMs,
      tracks,
      template,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    outputPath: "s3://render-output",
    preset: "social-1080x1920-30",
    idempotencyKey: `${fixture.projectId}-key`,
    mediaAssets,
  };
}

for (const fixtureFile of fixtureFiles) {
  test(`buildRenderJobFormat snapshot remains stable: ${fixtureFile}`, () => {
    const fixture = loadJson(join(fixturesDir, fixtureFile));
    const request = buildRequestFromFixture(fixture);
    const renderJob = buildRenderJobFormat(request, `job-${fixture.projectId}`);

    assert.deepEqual(renderJob.timelineTracks.map((track) => track.trackId), request.project.tracks.map((track) => track.id));
    assert.deepEqual(renderJob.mediaAssets.map((asset) => asset.id), [...renderJob.mediaAssets].map((asset) => asset.id).sort());

    const snapshotPath = join(goldenDir, fixtureFile.replace(".fixture.json", ".render-job.json"));
    const serialized = `${stableStringify(renderJob)}\n`;

    if (updateGolden || !existsSync(snapshotPath)) {
      mkdirSync(dirname(snapshotPath), { recursive: true });
      writeFileSync(snapshotPath, serialized, "utf8");
    }

    const expected = readFileSync(snapshotPath, "utf8");
    assert.equal(serialized, expected);
  });
}
