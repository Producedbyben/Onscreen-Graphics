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
  maxChars?: number;
  allowedStyles?: string[];
  positionPreset?: "header" | "content" | "footer" | "badge" | string;
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
  schemaVersion: 1;
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
  recommendationSignals?: {
    projectTypeTags?: string[];
    categorySignals?: Array<"hook" | "captions" | "cta" | "lower-third" | "product" | string>;
    confidenceWeights?: Partial<Record<"projectType" | "aspectRatio" | "captions" | "cta" | "hook" | "lowerThird" | "product", number>>;
  };
}

export interface CaptionWord {
  text: string;
  startTimeMs: number;
  endTimeMs: number;
}

export interface CaptionSegment {
  text: string;
  startTimeMs: number;
  endTimeMs: number;
  words?: CaptionWord[];
}

export interface CaptionStyleMetadata {
  presetId: string;
  packId?: string;
  variantId?: string;
  label?: string;
}

export interface CaptionStylePresetDefinition {
  id: string;
  label: string;
  textColor: string;
  emphasisColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontWeight?: number;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
}

export interface CaptionStylePack {
  id: string;
  label: string;
  description: string;
  highlightModes: CaptionHighlightMode[];
  presets: CaptionStylePresetDefinition[];
}

export type CaptionHighlightMode = "word" | "segment" | "karaoke" | "none" | string;

export interface CaptionSettings {
  segments: CaptionSegment[];
  stylePreset: CaptionStyleMetadata;
  highlightMode: CaptionHighlightMode;
}


export interface BrandKitTypography {
  fontFamily: string;
  headingFontFamily?: string;
  fallbackFontFamily?: string;
}

export interface BrandKit {
  id?: string;
  label?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  typography: BrandKitTypography;
  logoUri?: string;
}

export interface BrandVariantSubstitution {
  variantId: string;
  name?: string;
  substitutions: Record<string, string>;
  brandKit?: Partial<BrandKit>;
}
export interface SafeZoneGuideSettings {
  enabled: boolean;
  opacity: number;
  preset?: "tiktok-9:16" | string;
}

export interface ProjectMetadata {
  safeZoneGuides?: SafeZoneGuideSettings;
  brandKit?: BrandKit;
  variants?: Array<{
    variantId: string;
    name?: string;
    substitutions: Record<string, string>;
  }>;
  [key: string]: unknown;
}

export type ProjectRevisionSource = "author" | "system";

export interface ProjectRevisionPatchSummary {
  trackIdsUpdated?: string[];
  overlayIdsUpdated?: string[];
  captionUpdated?: boolean;
  styleUpdated?: boolean;
  notes?: string;
  [key: string]: unknown;
}

export interface ProjectRevision {
  id: string;
  projectId: string;
  parentRevisionId?: string;
  source: ProjectRevisionSource;
  authorId?: string;
  timestamp: string;
  patchSummary: ProjectRevisionPatchSummary;
  snapshot: Project;
}

export interface CollaborationBranchState {
  id: string;
  headRevisionId: string;
  updatedAt: string;
  authorId?: string;
}

export interface CollaborationMetadata {
  headRevisionId?: string;
  branchId?: string;
  branches?: CollaborationBranchState[];
  pendingOperations?: Array<{
    id: string;
    authorId: string;
    timestamp: string;
    operation: string;
    payload?: Record<string, unknown>;
  }>;
}

export interface Project {
  id: string;
  name: string;
  fps: number;
  width: number;
  height: number;
  durationMs: number;
  tracks: Track[];
  captions?: CaptionSettings;
  template?: TemplateDefinition;
  createdAt: string;
  updatedAt: string;
  metadata?: ProjectMetadata;
  collaboration?: CollaborationMetadata;
}
