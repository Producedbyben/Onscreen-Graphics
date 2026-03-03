import type { TemplateEditableField } from "./types.js";
import { TIKTOK_SAFE_ZONE_INSETS, type SafeZoneInsets } from "./safeZones.js";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextFitResult {
  originalText: string;
  fittedText: string;
  maxChars: number;
  wasTruncated: boolean;
  overflowChars: number;
}

export interface TemplateFieldConstraintResult {
  valid: boolean;
  violations: string[];
}

export function isRectWithinSafeZone(
  rect: Rect,
  canvasWidth: number,
  canvasHeight: number,
  insets: SafeZoneInsets = TIKTOK_SAFE_ZONE_INSETS,
): boolean {
  const safeLeft = 0;
  const safeTop = Math.round(Math.max(0, canvasHeight) * insets.top);
  const safeRight = Math.round(Math.max(0, canvasWidth) * (1 - insets.right));
  const safeBottom = Math.round(Math.max(0, canvasHeight) * (1 - insets.bottom));

  return (
    rect.x >= safeLeft &&
    rect.y >= safeTop &&
    rect.x + rect.width <= safeRight &&
    rect.y + rect.height <= safeBottom
  );
}

export function fitTextToMaxChars(text: string, maxChars: number, ellipsis = true): TextFitResult {
  const normalized = text ?? "";
  const limit = Math.max(0, Math.floor(maxChars));

  if (normalized.length <= limit) {
    return {
      originalText: normalized,
      fittedText: normalized,
      maxChars: limit,
      wasTruncated: false,
      overflowChars: 0,
    };
  }

  if (ellipsis && limit > 1) {
    return {
      originalText: normalized,
      fittedText: `${normalized.slice(0, limit - 1)}…`,
      maxChars: limit,
      wasTruncated: true,
      overflowChars: normalized.length - limit,
    };
  }

  return {
    originalText: normalized,
    fittedText: normalized.slice(0, limit),
    maxChars: limit,
    wasTruncated: true,
    overflowChars: normalized.length - limit,
  };
}

export function validateTemplateFieldConstraints(
  field: TemplateEditableField,
  value: string,
  appliedStyles: string[] = [],
): TemplateFieldConstraintResult {
  const violations: string[] = [];

  if (field.maxChars !== undefined && value.length > field.maxChars) {
    violations.push(`Field "${field.id}" exceeds maxChars (${field.maxChars}).`);
  }

  if (field.allowedStyles && field.allowedStyles.length > 0) {
    for (const style of appliedStyles) {
      if (!field.allowedStyles.includes(style)) {
        violations.push(`Field "${field.id}" does not allow style "${style}".`);
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}
