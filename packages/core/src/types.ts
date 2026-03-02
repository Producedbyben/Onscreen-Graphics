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

export interface TemplateEditableField {
  id: string;
  label: string;
  type: "text" | "color" | "avatar" | "icon";
  defaultValue: string;
  description?: string;
}

export interface TemplateLayoutZone {
  id: string;
  label: string;
  kind: "title" | "content" | "badge" | "footer" | "media" | string;
  x: number;
  y: number;
  width: number;
  height: number;
  safeAreaAware: boolean;
}

export interface TemplateAnimationPreset {
  id: string;
  label: string;
  target: "card" | "row" | "headline" | "counter" | "icon" | string;
  in: string;
  out: string;
  durationMs: number;
}

export interface TemplateSceneRule {
  id: string;
  label: string;
  minDurationMs: number;
  maxDurationMs?: number;
  transition: "cut" | "fade" | "slide-up" | "slide-left" | "zoom" | string;
  autoAdvance: boolean;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  category: "rankings" | "scoreboards" | "listicles" | string;
  aspectRatio: "16:9" | "9:16" | "1:1" | string;
  trackBlueprints: Array<Pick<Track, "name" | "type">>;
  defaultOverlays: OverlayElement[];
  placeholders?: Record<string, string>;
  editableFields: TemplateEditableField[];
  layoutZones: TemplateLayoutZone[];
  animationPresets: TemplateAnimationPreset[];
  defaultDurationMs: number;
  sceneSequencingRules: TemplateSceneRule[];
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
  metadata?: Record<string, unknown>;
}
