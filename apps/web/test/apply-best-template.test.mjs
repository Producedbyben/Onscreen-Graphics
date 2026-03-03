import test from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";

const { startWebServer } = await import("../src/index.js");

const port = 3211;
let server;

test("setup web server", async () => {
  server = startWebServer({ port });
  await new Promise((resolve) => server.on("listening", resolve));
  assert.ok(server.listening);
});

test("apply-best endpoint returns a recommended template", async () => {
  const response = await fetch(`http://127.0.0.1:${port}/api/templates/recommended`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      projectMetadata: {
        aspectRatio: "9:16",
        desiredCategories: ["cta"],
        hasCaptions: true,
        needsCTA: true
      }
    })
  });

  assert.equal(response.status, 200);
  const data = await response.json();
  assert.ok(data.template?.id);
  assert.ok(Array.isArray(data.template?.recommendationSignals?.categorySignals));
  assert.ok(data.template.recommendationSignals.categorySignals.includes("cta"));
});

test("client flow template list includes category signals used by tabs", async () => {
  const response = await fetch(`http://127.0.0.1:${port}/api/templates`);
  const data = await response.json();

  assert.ok(Array.isArray(data.templates));
  assert.ok(data.templates.length >= 20);
  assert.ok(data.templates.some((template) => (template.recommendationSignals?.categorySignals ?? []).includes("captions")));
});

test("teardown web server", async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  assert.equal(server.listening, false);
});
