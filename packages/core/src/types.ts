export interface AnimationKeyframe {
  id: string;
  property: "x" | "y" | "scale" | "rotation" | "opacity" | string;
  timeMs: number;
  value: number | string;
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out" | string;
}

export interface OverlayElement {
  id: string;
  kind: "text" | "image" | "shape" | "badge" | string;
  startTimeMs: number;
  endTimeMs: number;
  layer: number;
  style?: Record<string, string | number | boolean>;
  keyframes: AnimationKeyframe[];
}

export interface Clip {
  id: string;
  sourceUri: string;
  startTimeMs: number;
  durationMs: number;
  trimInMs?: number;
  trimOutMs?: number;
  overlays: OverlayElement[];
  metadata?: Record<string, unknown>;
}

export interface Track {
  id: string;
  name: string;
  type: "video" | "audio" | "overlay" | string;
  clips: Clip[];
  muted?: boolean;
  locked?: boolean;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  category: "rankings" | "scoreboards" | "listicles" | string;
  aspectRatio: "16:9" | "9:16" | "1:1" | string;
  trackBlueprints: Array<Pick<Track, "name" | "type">>;
  defaultOverlays: OverlayElement[];
  placeholders?: Record<string, string>;
}

export interface Project {
  id: string;
  name: string;
  fps: number;
  width: number;
  height: number;
  durationMs: number;
  tracks: Track[];
  template?: TemplateDefinition;
  createdAt: string;
  updatedAt: string;
}
