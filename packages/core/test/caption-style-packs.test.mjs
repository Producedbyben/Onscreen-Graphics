import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_CAPTION_STYLE_PACK_ID,
  DEFAULT_CAPTION_STYLE_PRESET_ID,
  getCaptionStylePresetById,
  isCaptionHighlightModeSupported,
  listCaptionStylePacks,
} from "../dist/captionStylePacks.js";

test("caption style pack catalog ships curated options", () => {
  const packs = listCaptionStylePacks();

  assert.ok(packs.length >= 4);
  assert.equal(DEFAULT_CAPTION_STYLE_PACK_ID, "classic");
  assert.equal(DEFAULT_CAPTION_STYLE_PRESET_ID, "classic-white");
  assert.ok(packs.every((pack) => pack.presets.length >= 2));
});

test("caption presets can be resolved by id", () => {
  const preset = getCaptionStylePresetById("bold-yellow");

  assert.equal(preset?.pack.id, "sports");
  assert.equal(preset?.preset.label, "Bold Yellow");
});

test("highlight modes are validated per pack", () => {
  assert.equal(isCaptionHighlightModeSupported("news", "segment"), true);
  assert.equal(isCaptionHighlightModeSupported("news", "karaoke"), false);
});
