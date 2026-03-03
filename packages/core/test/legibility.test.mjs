import test from "node:test";
import assert from "node:assert/strict";
import { contrastRatio, relativeLuminance, validateTextLegibility } from "../dist/legibility.js";

test("relative luminance and contrast ratio follow WCAG expectations", () => {
  assert.equal(relativeLuminance("#000000"), 0);
  assert.equal(relativeLuminance("#FFFFFF"), 1);
  assert.equal(Math.round(contrastRatio("#FFFFFF", "#000000") * 100) / 100, 21);
});

test("validateTextLegibility passes high-contrast styles unchanged", () => {
  const result = validateTextLegibility({ color: "#FFFFFF", strokeWidth: 3 }, "#000000");

  assert.equal(result.passes, true);
  assert.equal(result.recommendedStyle.color, "#FFFFFF");
  assert.equal(result.recommendedStyle.strokeWidth, 3);
});

test("validateTextLegibility recommends fallback stroke/shadow for low-contrast text", () => {
  const result = validateTextLegibility({ color: "#B8BCC2" }, "#C1C5CC", 4.5);

  assert.equal(result.passes, false);
  assert.equal(result.recommendedStyle.color, "#111111");
  assert.equal(result.recommendedStyle.strokeWidth, 2);
  assert.match(result.recommendedStyle.textShadow, /rgba\(/);
  assert.ok(result.reason?.includes("below 4.50"));
});
