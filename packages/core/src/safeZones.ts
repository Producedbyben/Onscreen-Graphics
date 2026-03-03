export interface SafeZoneInsets {
  top: number;
  right: number;
  bottom: number;
}

export interface SafeZoneGuideRect {
  id: "top" | "right" | "bottom";
  x: number;
  y: number;
  width: number;
  height: number;
}

export const TIKTOK_SAFE_ZONE_TOP = 0.14;
export const TIKTOK_SAFE_ZONE_RIGHT_INTERACTION_RAIL = 0.2;
export const TIKTOK_SAFE_ZONE_BOTTOM_CAPTION = 0.22;

export const TIKTOK_SAFE_ZONE_INSETS: SafeZoneInsets = {
  top: TIKTOK_SAFE_ZONE_TOP,
  right: TIKTOK_SAFE_ZONE_RIGHT_INTERACTION_RAIL,
  bottom: TIKTOK_SAFE_ZONE_BOTTOM_CAPTION
};

export function getSafeZoneGuideRects(
  width: number,
  height: number,
  insets: SafeZoneInsets = TIKTOK_SAFE_ZONE_INSETS
): SafeZoneGuideRect[] {
  const safeWidth = Math.max(0, width);
  const safeHeight = Math.max(0, height);

  return [
    {
      id: "top",
      x: 0,
      y: 0,
      width: safeWidth,
      height: Math.round(safeHeight * insets.top)
    },
    {
      id: "right",
      x: Math.round(safeWidth * (1 - insets.right)),
      y: 0,
      width: Math.round(safeWidth * insets.right),
      height: safeHeight
    },
    {
      id: "bottom",
      x: 0,
      y: Math.round(safeHeight * (1 - insets.bottom)),
      width: safeWidth,
      height: Math.round(safeHeight * insets.bottom)
    }
  ];
}
