import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const templatesDir = join(__dirname, "..", "src", "templates");
const templates = readdirSync(templatesDir)
  .filter((file) => file.endsWith(".json"))
  .sort()
  .map((file) => JSON.parse(readFileSync(join(templatesDir, file), "utf8")));

function getRecommendedTemplate(projectMetadata = {}) {
  const desiredCategories = (projectMetadata.desiredCategories ?? []).map((category) => `${category}`.toLowerCase());
  const projectType = typeof projectMetadata.projectType === "string" ? projectMetadata.projectType.toLowerCase() : undefined;

  const scored = templates.map((template) => {
    const weights = template.recommendationSignals?.confidenceWeights ?? {};
    const projectTypeTags = (template.recommendationSignals?.projectTypeTags ?? []).map((tag) => `${tag}`.toLowerCase());
    const categorySignals = (template.recommendationSignals?.categorySignals ?? []).map((signal) => `${signal}`.toLowerCase());

    let score = 0;
    if (projectType && projectTypeTags.includes(projectType)) score += weights.projectType ?? 0.45;
    if (projectMetadata.aspectRatio && template.aspectRatio === projectMetadata.aspectRatio) score += weights.aspectRatio ?? 0.2;
    if (projectMetadata.hasCaptions && categorySignals.includes("captions")) score += weights.captions ?? 0.2;
    if (projectMetadata.needsCTA && categorySignals.includes("cta")) score += weights.cta ?? 0.2;
    if (desiredCategories.some((category) => categorySignals.includes(category))) score += 0.25;

    return { template, score };
  });

  scored.sort((left, right) => right.score - left.score || left.template.id.localeCompare(right.template.id));
  return scored[0]?.template;
}

test("recommendation scoring is deterministic", () => {
  const metadata = {
    projectType: "captions",
    aspectRatio: "9:16",
    desiredCategories: ["captions", "cta"],
    hasCaptions: true,
    needsCTA: true
  };

  const first = getRecommendedTemplate(metadata);
  const second = getRecommendedTemplate(metadata);
  assert.equal(first.id, second.id);
});

test("lower-third preference picks lower-third capable templates", () => {
  const result = getRecommendedTemplate({ desiredCategories: ["lower-third"], hasCaptions: true, aspectRatio: "9:16" });
  assert.ok((result.recommendationSignals?.categorySignals ?? []).includes("lower-third"));
});
