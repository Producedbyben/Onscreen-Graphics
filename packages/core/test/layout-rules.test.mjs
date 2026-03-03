import test from "node:test";
import assert from "node:assert/strict";
import {
  fitTextToMaxChars,
  isRectWithinSafeZone,
  validateTemplateFieldConstraints,
} from "../dist/layoutRules.js";
import { TIKTOK_SAFE_ZONE_INSETS, getSafeZoneGuideRects } from "../dist/safeZones.js";

test("safe-zone helpers return expected guide rectangles", () => {
  const guides = getSafeZoneGuideRects(1080, 1920, TIKTOK_SAFE_ZONE_INSETS);
  assert.deepEqual(guides, [
    { id: "top", x: 0, y: 0, width: 1080, height: 269 },
    { id: "right", x: 864, y: 0, width: 216, height: 1920 },
    { id: "bottom", x: 0, y: 1498, width: 1080, height: 422 },
  ]);
});

test("safe-zone compliance rejects overlays that cross protected rails", () => {
  const compliantRect = { x: 100, y: 320, width: 700, height: 800 };
  const collidingRect = { x: 860, y: 320, width: 280, height: 800 };

  assert.equal(isRectWithinSafeZone(compliantRect, 1080, 1920), true);
  assert.equal(isRectWithinSafeZone(collidingRect, 1080, 1920), false);
});

test("text fit utility truncates deterministically and reports overflow", () => {
  assert.deepEqual(fitTextToMaxChars("Top 10 Plays of the Week", 10), {
    originalText: "Top 10 Plays of the Week",
    fittedText: "Top 10 Pl…",
    maxChars: 10,
    wasTruncated: true,
    overflowChars: 14,
  });

  assert.deepEqual(fitTextToMaxChars("MVP", 10), {
    originalText: "MVP",
    fittedText: "MVP",
    maxChars: 10,
    wasTruncated: false,
    overflowChars: 0,
  });
});

test("template field constraints enforce maxChars and allowed style restrictions", () => {
  const field = {
    id: "headline",
    label: "Headline",
    type: "text",
    defaultValue: "Top 10",
    maxChars: 12,
    allowedStyles: ["bold", "uppercase"],
  };

  const valid = validateTemplateFieldConstraints(field, "TOP 10", ["bold"]);
  assert.deepEqual(valid, { valid: true, violations: [] });

  const invalid = validateTemplateFieldConstraints(field, "Top 10 Plays This Week", ["italic"]);
  assert.deepEqual(invalid, {
    valid: false,
    violations: [
      'Field "headline" exceeds maxChars (12).',
      'Field "headline" does not allow style "italic".',
    ],
  });
});
