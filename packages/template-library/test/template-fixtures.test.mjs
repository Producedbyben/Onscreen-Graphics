import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const templatesDir = join(__dirname, "..", "src", "templates");

const templateFiles = ["ranking-videos.json", "scoreboards.json", "countdown-list.json"];

function readTemplate(fileName) {
  const fullPath = join(templatesDir, fileName);
  return JSON.parse(readFileSync(fullPath, "utf8"));
}

test("all shipped templates declare schemaVersion 1", () => {
  for (const file of templateFiles) {
    const template = readTemplate(file);
    assert.equal(template.schemaVersion, 1, `${file} must define schemaVersion: 1`);
  }
});

test("editable field constraints are structurally valid", () => {
  for (const file of templateFiles) {
    const template = readTemplate(file);
    assert.ok(Array.isArray(template.editableFields), `${file} editableFields must be an array`);

    for (const field of template.editableFields) {
      if (field.maxChars !== undefined) {
        assert.equal(Number.isInteger(field.maxChars), true, `${file}:${field.id} maxChars must be an integer`);
        assert.ok(field.maxChars > 0, `${file}:${field.id} maxChars must be > 0`);
      }

      if (field.allowedStyles !== undefined) {
        assert.equal(Array.isArray(field.allowedStyles), true, `${file}:${field.id} allowedStyles must be an array`);
        assert.ok(field.allowedStyles.length > 0, `${file}:${field.id} allowedStyles should include at least one option`);
        assert.ok(
          field.allowedStyles.every((style) => typeof style === "string" && style.trim().length > 0),
          `${file}:${field.id} allowedStyles entries must be non-empty strings`
        );
      }

      if (field.positionPreset !== undefined) {
        assert.equal(typeof field.positionPreset, "string", `${file}:${field.id} positionPreset must be a string`);
        assert.ok(field.positionPreset.trim().length > 0, `${file}:${field.id} positionPreset cannot be empty`);
      }
    }
  }
});
