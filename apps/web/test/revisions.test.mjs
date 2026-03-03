import test from "node:test";
import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

process.env.NODE_ENV = "test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectStorageDir = resolve(__dirname, "../storage/projects/revision-test-project");
const { startWebServer } = await import("../src/index.js");

const port = 3212;
let server;

test("setup web server", async () => {
  rmSync(projectStorageDir, { recursive: true, force: true });
  server = startWebServer({ port });
  await new Promise((resolveReady) => server.on("listening", resolveReady));
  assert.ok(server.listening);
});

test("revision endpoints create, list, and restore snapshots", async () => {
  const project = {
    id: "revision-test-project",
    name: "Revision test",
    fps: 30,
    width: 1080,
    height: 1920,
    durationMs: 4000,
    tracks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {}
  };

  const createResponse = await fetch(`http://127.0.0.1:${port}/api/projects/revision-test-project/revisions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      project,
      source: "author",
      authorId: "tester-1",
      patchSummary: { notes: "Initial snapshot" }
    })
  });
  assert.equal(createResponse.status, 201);
  const created = await createResponse.json();
  assert.equal(created.revision.source, "author");

  project.name = "Revision test updated";
  project.collaboration = { pendingOperations: [{ id: "op-1", authorId: "tester-1", timestamp: new Date().toISOString(), operation: "rename" }] };

  const secondResponse = await fetch(`http://127.0.0.1:${port}/api/projects/revision-test-project/revisions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      project,
      source: "system",
      branchId: "feature-a",
      patchSummary: { notes: "rename" }
    })
  });
  assert.equal(secondResponse.status, 201);
  const second = await secondResponse.json();
  assert.equal(second.revision.parentRevisionId, created.revision.id);
  assert.equal(second.revision.snapshot.collaboration.branchId, "feature-a");
  assert.equal(second.revision.snapshot.collaboration.branches[0].id, "feature-a");

  const listResponse = await fetch(`http://127.0.0.1:${port}/api/projects/revision-test-project/revisions`);
  assert.equal(listResponse.status, 200);
  const listed = await listResponse.json();
  assert.equal(listed.revisions.length, 2);
  assert.equal(listed.revisions[1].patchSummary.notes, "rename");

  const restoreResponse = await fetch(`http://127.0.0.1:${port}/api/projects/revision-test-project/revisions/${created.revision.id}/restore`, {
    method: "POST"
  });
  assert.equal(restoreResponse.status, 200);
  const restored = await restoreResponse.json();
  assert.equal(restored.project.name, "Revision test");
  assert.equal(restored.project.collaboration.headRevisionId, created.revision.id);
  assert.ok(Array.isArray(restored.project.collaboration.branches));
});

test("automation endpoint runs deterministic transforms and writes revision", async () => {
  const project = {
    id: "revision-test-project",
    name: "Automation",
    fps: 30,
    width: 1080,
    height: 1920,
    durationMs: 4000,
    tracks: [
      {
        id: "track-1",
        name: "main",
        type: "video",
        clips: [
          {
            id: "clip-1",
            sourceUri: "file:///tmp/a.mp4",
            startTimeMs: 0,
            durationMs: 1000,
            overlays: [
              { id: "ov-1", kind: "text", startTimeMs: 0, endTimeMs: 600, layer: 1, style: { text: "Hello Team", color: "#fff" }, keyframes: [] }
            ]
          }
        ]
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {}
  };

  const response = await fetch(`http://127.0.0.1:${port}/api/projects/revision-test-project/automation/run`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      project,
      operations: [
        { type: "duplicate-with-replacements", clipId: "clip-1", duplicateCount: 1, replacements: { Team: "World", Hello: "Hi" } },
        { type: "bulk-style-apply", overlayKind: "text", stylePatch: { fontWeight: 800 } }
      ]
    })
  });

  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.project.tracks[0].clips.length, 2);
  assert.equal(data.project.tracks[0].clips[1].overlays[0].style.text, "Hi World");
  assert.equal(data.project.tracks[0].clips[0].overlays[0].style.fontWeight, 800);
  assert.ok(data.revision.id);
});

test("teardown web server", async () => {
  await new Promise((resolveDone, rejectDone) => {
    server.close((error) => (error ? rejectDone(error) : resolveDone()));
  });
  assert.equal(server.listening, false);
});
