import type { CaptionStylePack } from "./types.js";

export const CAPTION_STYLE_PACKS: CaptionStylePack[] = [
  {
    id: "classic",
    label: "Classic",
    description: "Balanced subtitle treatments for general creator content.",
    highlightModes: ["word", "segment", "none"],
    presets: [
      {
        id: "classic-white",
        label: "Classic White",
        textColor: "#FFFFFF",
        emphasisColor: "#FACC15",
        fontFamily: "Inter",
        fontWeight: 700
      },
      {
        id: "classic-shadow",
        label: "Classic Shadow",
        textColor: "#FFFFFF",
        backgroundColor: "#0F172ACC",
        emphasisColor: "#22D3EE",
        fontFamily: "Inter",
        fontWeight: 700
      }
    ]
  },
  {
    id: "sports",
    label: "Sports",
    description: "High-energy sports captions with punchy emphasis colors.",
    highlightModes: ["word", "karaoke", "segment"],
    presets: [
      {
        id: "bold-yellow",
        label: "Bold Yellow",
        textColor: "#FFFFFF",
        emphasisColor: "#FDE047",
        backgroundColor: "#1E293B",
        fontFamily: "Sora",
        fontWeight: 800,
        textTransform: "uppercase"
      },
      {
        id: "arena-neon",
        label: "Arena Neon",
        textColor: "#E2E8F0",
        emphasisColor: "#22D3EE",
        backgroundColor: "#0B1220D9",
        fontFamily: "Sora",
        fontWeight: 700,
        textTransform: "uppercase"
      }
    ]
  },
  {
    id: "creator",
    label: "Creator",
    description: "Friendly creator-facing subtitles for explainers and vlogs.",
    highlightModes: ["word", "segment", "karaoke", "none"],
    presets: [
      {
        id: "soft-pop",
        label: "Soft Pop",
        textColor: "#F8FAFC",
        emphasisColor: "#FB7185",
        backgroundColor: "#1E1B4BCC",
        fontFamily: "Nunito",
        fontWeight: 700
      },
      {
        id: "clean-minimal",
        label: "Clean Minimal",
        textColor: "#FFFFFF",
        emphasisColor: "#A78BFA",
        fontFamily: "Inter",
        fontWeight: 600
      }
    ]
  },
  {
    id: "news",
    label: "News",
    description: "Structured lower-third style captions for updates and commentary.",
    highlightModes: ["segment", "word", "none"],
    presets: [
      {
        id: "ticker-blue",
        label: "Ticker Blue",
        textColor: "#FFFFFF",
        emphasisColor: "#60A5FA",
        backgroundColor: "#0F172ACC",
        fontFamily: "Roboto",
        fontWeight: 700,
        textTransform: "uppercase"
      },
      {
        id: "briefing-slate",
        label: "Briefing Slate",
        textColor: "#E2E8F0",
        emphasisColor: "#F97316",
        backgroundColor: "#111827D9",
        fontFamily: "Roboto",
        fontWeight: 600
      }
    ]
  }
];

export const DEFAULT_CAPTION_STYLE_PACK_ID = "classic";
export const DEFAULT_CAPTION_STYLE_PRESET_ID = "classic-white";

export function listCaptionStylePacks(): CaptionStylePack[] {
  return CAPTION_STYLE_PACKS.map((pack) => ({
    ...pack,
    highlightModes: [...pack.highlightModes],
    presets: pack.presets.map((preset) => ({ ...preset }))
  }));
}

export function getCaptionStylePackById(packId: string): CaptionStylePack | undefined {
  return CAPTION_STYLE_PACKS.find((pack) => pack.id === packId);
}

export function getCaptionStylePreset(packId: string, presetId: string) {
  return getCaptionStylePackById(packId)?.presets.find((preset) => preset.id === presetId);
}

export function getCaptionStylePresetById(presetId: string) {
  for (const pack of CAPTION_STYLE_PACKS) {
    const preset = pack.presets.find((candidate) => candidate.id === presetId);
    if (preset) {
      return { pack, preset };
    }
  }

  return undefined;
}

export function isCaptionHighlightModeSupported(packId: string, mode: string): boolean {
  const pack = getCaptionStylePackById(packId);
  return Boolean(pack?.highlightModes.includes(mode));
}
