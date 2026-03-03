export interface LegibilityTextStyle {
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  textShadow?: string;
  [key: string]: unknown;
}

export interface LegibilityValidationResult {
  passes: boolean;
  contrastRatio: number;
  minimumContrastRatio: number;
  recommendedStyle: LegibilityTextStyle;
  reason?: string;
}

const DEFAULT_TEXT_COLOR = "#FFFFFF";
const DEFAULT_BACKGROUND_COLOR = "#000000";

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function parseHexColor(value: string): RgbColor | null {
  const hex = value.replace("#", "").trim();
  if (hex.length !== 3 && hex.length !== 6) {
    return null;
  }

  const normalized =
    hex.length === 3
      ? hex
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : hex;

  const parsed = Number.parseInt(normalized, 16);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}

function parseRgbColor(value: string): RgbColor | null {
  const match = value.match(/rgba?\(([^)]+)\)/i);
  if (!match) {
    return null;
  }

  const parts = match[1].split(",").map((entry) => Number.parseFloat(entry.trim()));
  if (parts.length < 3 || parts.slice(0, 3).some((entry) => Number.isNaN(entry))) {
    return null;
  }

  return {
    r: clampChannel(parts[0]),
    g: clampChannel(parts[1]),
    b: clampChannel(parts[2]),
  };
}

function parseColor(value: string | undefined, fallback: string): RgbColor {
  const candidate = value ?? fallback;
  return parseHexColor(candidate) ?? parseRgbColor(candidate) ?? parseHexColor(fallback) ?? { r: 255, g: 255, b: 255 };
}

export function relativeLuminance(color: string): number {
  const { r, g, b } = parseColor(color, DEFAULT_TEXT_COLOR);
  const channels = [r, g, b].map((channel) => {
    const sRGB = channel / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : ((sRGB + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export function validateTextLegibility(
  textStyle: LegibilityTextStyle = {},
  backgroundSample: string = DEFAULT_BACKGROUND_COLOR,
  minimumContrastRatio = 4.5,
): LegibilityValidationResult {
  const color = typeof textStyle.color === "string" ? textStyle.color : DEFAULT_TEXT_COLOR;
  const ratio = contrastRatio(color, backgroundSample);

  if (ratio >= minimumContrastRatio) {
    return {
      passes: true,
      contrastRatio: ratio,
      minimumContrastRatio,
      recommendedStyle: { ...textStyle, color },
    };
  }

  const darkerBackground = relativeLuminance(backgroundSample) > 0.45;
  const fallbackColor = darkerBackground ? "#111111" : "#FFFFFF";

  return {
    passes: false,
    contrastRatio: ratio,
    minimumContrastRatio,
    reason: `Contrast ratio ${ratio.toFixed(2)} is below ${minimumContrastRatio.toFixed(2)}.`,
    recommendedStyle: {
      ...textStyle,
      color: fallbackColor,
      strokeColor: textStyle.strokeColor ?? (darkerBackground ? "#FFFFFFCC" : "#000000CC"),
      strokeWidth: Number.isFinite(Number(textStyle.strokeWidth))
        ? Math.max(1, Number(textStyle.strokeWidth))
        : 2,
      textShadow:
        typeof textStyle.textShadow === "string"
          ? textStyle.textShadow
          : darkerBackground
            ? "0px 1px 2px rgba(255,255,255,0.35)"
            : "0px 2px 6px rgba(0,0,0,0.75)",
    },
  };
}
