import type { AnimationKeyframe, OverlayElement, Project, Track } from "@onscreen/core";

export type SupportedCodec = "h264";
export type SupportedContainer = "mp4";
export type RenderPresetId =
  | "social-1080x1920-30"
  | "social-1080x1920-60"
  | "social-1080x1080-30"
  | "social-1080x1080-60"
  | "social-1920x1080-30"
  | "social-1920x1080-60";
export type H264Profile = "baseline" | "main" | "high";

export interface MediaAsset {
  id: string;
  uri: string;
  kind: "video" | "audio" | "image" | string;
  codec?: string;
  container?: string;
  width?: number;
  height?: number;
  fps?: number;
  hasAudio?: boolean;
  metadata?: Record<string, unknown>;
}

export interface TimelineTrackInstruction {
  trackId: string;
  trackType: Track["type"];
  clipIds: string[];
}

export interface OverlayInstruction {
  trackId: string;
  overlay: OverlayElement;
}

export interface RenderJobFormat {
  jobId: string;
  projectId: string;
  mediaAssets: MediaAsset[];
  timelineTracks: TimelineTrackInstruction[];
  overlays: OverlayInstruction[];
  animationKeyframes: AnimationKeyframe[];
}

export interface ExportPreset {
  id: RenderPresetId;
  label: string;
  width: number;
  height: number;
  aspectRatio: "9:16" | "1:1" | "16:9";
  fps: 30 | 60;
  codec: SupportedCodec;
  container: SupportedContainer;
  h264Profile: H264Profile;
  videoBitrateKbps: number;
  audioBitrateKbps: number;
  maxFileSizeMb?: number;
}

export const EXPORT_PRESETS: Record<RenderPresetId, ExportPreset> = {
  "social-1080x1920-30": {
    id: "social-1080x1920-30",
    label: "Vertical 1080x1920 @ 30fps",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    fps: 30,
    codec: "h264",
    container: "mp4",
    h264Profile: "high",
    videoBitrateKbps: 8000,
    audioBitrateKbps: 256,
    maxFileSizeMb: 250,
  },
  "social-1080x1920-60": {
    id: "social-1080x1920-60",
    label: "Vertical 1080x1920 @ 60fps",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    fps: 60,
    codec: "h264",
    container: "mp4",
    h264Profile: "high",
    videoBitrateKbps: 12000,
    audioBitrateKbps: 320,
    maxFileSizeMb: 250,
  },
  "social-1080x1080-30": {
    id: "social-1080x1080-30",
    label: "Square 1080x1080 @ 30fps",
    width: 1080,
    height: 1080,
    aspectRatio: "1:1",
    fps: 30,
    codec: "h264",
    container: "mp4",
    h264Profile: "high",
    videoBitrateKbps: 7000,
    audioBitrateKbps: 256,
    maxFileSizeMb: 250,
  },
  "social-1080x1080-60": {
    id: "social-1080x1080-60",
    label: "Square 1080x1080 @ 60fps",
    width: 1080,
    height: 1080,
    aspectRatio: "1:1",
    fps: 60,
    codec: "h264",
    container: "mp4",
    h264Profile: "high",
    videoBitrateKbps: 10000,
    audioBitrateKbps: 320,
    maxFileSizeMb: 250,
  },
  "social-1920x1080-30": {
    id: "social-1920x1080-30",
    label: "Landscape 1920x1080 @ 30fps",
    width: 1920,
    height: 1080,
    aspectRatio: "16:9",
    fps: 30,
    codec: "h264",
    container: "mp4",
    h264Profile: "high",
    videoBitrateKbps: 8000,
    audioBitrateKbps: 256,
    maxFileSizeMb: 250,
  },
  "social-1920x1080-60": {
    id: "social-1920x1080-60",
    label: "Landscape 1920x1080 @ 60fps",
    width: 1920,
    height: 1080,
    aspectRatio: "16:9",
    fps: 60,
    codec: "h264",
    container: "mp4",
    h264Profile: "high",
    videoBitrateKbps: 12000,
    audioBitrateKbps: 320,
    maxFileSizeMb: 250,
  },
};

export type RenderQueueStatus = "queued" | "processing" | "failed" | "completed";

export interface RenderArtifactMetadata {
  artifactId: string;
  fileName: string;
  downloadUrl: string;
  mimeType: "video/mp4";
  sizeBytes?: number;
  width: number;
  height: number;
  fps: number;
  codec: SupportedCodec;
  durationMs: number;
  presetId: RenderPresetId;
  presetLabel: string;
  estimatedSizeBytes: number;
  createdAt: string;
}

export type RenderValidationCode =
  | "preset_unsupported"
  | "codec_unsupported"
  | "container_unsupported"
  | "project_resolution_mismatch"
  | "project_fps_mismatch"
  | "asset_codec_unsupported"
  | "asset_container_unsupported"
  | "asset_fps_exceeds_output"
  | "asset_aspect_ratio_mismatch";

export interface RenderValidationDiagnostic {
  code: RenderValidationCode;
  message: string;
  field:
    | "preset"
    | "codec"
    | "container"
    | "project.width"
    | "project.height"
    | "project.fps"
    | "mediaAssets"
    | `mediaAssets.${string}.codec`
    | `mediaAssets.${string}.container`
    | `mediaAssets.${string}.fps`
    | `mediaAssets.${string}.dimensions`;
}

export interface RenderPreflightAction {
  assetId: string;
  action: "transcode-container" | "transcode-fps";
  reason: string;
  from: string | number;
  to: string | number;
  ffmpegArgs: string[];
}

export interface RenderQueueStatusEntry {
  status: RenderQueueStatus;
  timestamp: string;
  detail?: string;
}

export interface RenderQueueJob {
  id: string;
  status: RenderQueueStatus;
  request: RenderRequest;
  progressPercent: number;
  statusHistory: RenderQueueStatusEntry[];
  errorMessage?: string;
  validationDiagnostics?: RenderValidationDiagnostic[];
  preflightActions?: RenderPreflightAction[];
  artifact?: RenderArtifactMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface RenderRequest {
  project: Project;
  outputPath: string;
  preset: RenderPresetId;
  mediaAssets: MediaAsset[];
  codec?: SupportedCodec;
  container?: SupportedContainer;
  preflight?: {
    normalizeVideoContainer?: boolean;
    normalizeVideoFps?: boolean;
  };
}

export interface RenderResult {
  status: RenderQueueStatus;
  job: RenderQueueJob;
  serializedJob?: string;
}

export class RenderValidationError extends Error {
  diagnostics: RenderValidationDiagnostic[];

  constructor(message: string, diagnostics: RenderValidationDiagnostic[] = []) {
    super(message);
    this.name = "RenderValidationError";
    this.diagnostics = diagnostics;
  }
}

export interface RenderValidationResult {
  preset?: ExportPreset;
  diagnostics: RenderValidationDiagnostic[];
  preflightActions: RenderPreflightAction[];
  isValid: boolean;
}

function makeDiagnostic(code: RenderValidationCode, message: string, field: RenderValidationDiagnostic["field"]) {
  return { code, message, field };
}

function collectAnimationKeyframes(project: Project): AnimationKeyframe[] {
  return project.tracks.flatMap((track) =>
    track.clips.flatMap((clip) => clip.overlays.flatMap((overlay) => overlay.keyframes)),
  );
}

export function buildRenderJobFormat(request: RenderRequest, jobId: string): RenderJobFormat {
  const timelineTracks: TimelineTrackInstruction[] = request.project.tracks.map((track) => ({
    trackId: track.id,
    trackType: track.type,
    clipIds: track.clips.map((clip) => clip.id),
  }));

  const overlays: OverlayInstruction[] = request.project.tracks.flatMap((track) =>
    track.clips.flatMap((clip) => clip.overlays.map((overlay) => ({ trackId: track.id, overlay }))),
  );

  return {
    jobId,
    projectId: request.project.id,
    mediaAssets: request.mediaAssets,
    timelineTracks,
    overlays,
    animationKeyframes: collectAnimationKeyframes(request.project),
  };
}

export function validateRenderRequestDetailed(request: RenderRequest): RenderValidationResult {
  const preset = EXPORT_PRESETS[request.preset];
  const diagnostics: RenderValidationDiagnostic[] = [];
  const preflightActions: RenderPreflightAction[] = [];

  if (!preset) {
    diagnostics.push(
      makeDiagnostic(
        "preset_unsupported",
        `Preset "${request.preset}" is not available. Choose one of the supported social presets (9:16, 1:1, or 16:9).`,
        "preset",
      ),
    );
    return { diagnostics, preflightActions, isValid: false };
  }

  const codec = request.codec ?? preset.codec;
  const container = request.container ?? preset.container;

  if (codec !== "h264") {
    diagnostics.push(
      makeDiagnostic(
        "codec_unsupported",
        `Codec "${codec}" is not supported for ${preset.label}. Switch to h264 or choose a preset that supports your target codec.`,
        "codec",
      ),
    );
  }

  if (container !== "mp4") {
    diagnostics.push(
      makeDiagnostic(
        "container_unsupported",
        `Container "${container}" is not supported for ${preset.label}. Use mp4 or change to a compatible preset.`,
        "container",
      ),
    );
  }

  if (request.project.width !== preset.width || request.project.height !== preset.height) {
    diagnostics.push(
      makeDiagnostic(
        "project_resolution_mismatch",
        `Project is ${request.project.width}x${request.project.height}, but ${preset.label} requires ${preset.width}x${preset.height}. Fix by resizing the project or choosing a matching preset.`,
        "project.width",
      ),
    );
  }

  if (request.project.fps !== preset.fps) {
    diagnostics.push(
      makeDiagnostic(
        "project_fps_mismatch",
        `Project FPS is ${request.project.fps}, but ${preset.label} requires ${preset.fps}fps. Change project FPS, choose another preset, or transcode source media.`,
        "project.fps",
      ),
    );
  }

  for (const asset of request.mediaAssets) {
    if (asset.kind === "video") {
      if (asset.codec && asset.codec !== "h264") {
        diagnostics.push(
          makeDiagnostic(
            "asset_codec_unsupported",
            `Video asset "${asset.id}" uses codec ${asset.codec}. Transcode this source to h264 before rendering ${preset.label}.`,
            `mediaAssets.${asset.id}.codec`,
          ),
        );
      }
      if (asset.container && asset.container !== "mp4") {
        if (request.preflight?.normalizeVideoContainer) {
          preflightActions.push({
            assetId: asset.id,
            action: "transcode-container",
            reason: `Normalize ${asset.container} container to mp4 for ${preset.label}.`,
            from: asset.container,
            to: "mp4",
            ffmpegArgs: ["-i", asset.uri, "-c:v", "copy", "-c:a", "aac", `${asset.id}.normalized.mp4`],
          });
        } else {
          diagnostics.push(
            makeDiagnostic(
              "asset_container_unsupported",
              `Video asset "${asset.id}" is ${asset.container}, but ${preset.label} requires mp4. Enable preflight container normalization or transcode this source to mp4.`,
              `mediaAssets.${asset.id}.container`,
            ),
          );
        }
      }
      if (typeof asset.fps === "number" && asset.fps > preset.fps) {
        if (request.preflight?.normalizeVideoFps) {
          preflightActions.push({
            assetId: asset.id,
            action: "transcode-fps",
            reason: `Downsample ${asset.fps}fps source to ${preset.fps}fps for ${preset.label}.`,
            from: asset.fps,
            to: preset.fps,
            ffmpegArgs: ["-i", asset.uri, "-r", `${preset.fps}`, "-c:v", "libx264", `${asset.id}.fps-${preset.fps}.mp4`],
          });
        } else {
          diagnostics.push(
            makeDiagnostic(
              "asset_fps_exceeds_output",
              `Video asset "${asset.id}" is ${asset.fps}fps, which exceeds ${preset.fps}fps output. Enable preflight FPS normalization or transcode the source.`,
              `mediaAssets.${asset.id}.fps`,
            ),
          );
        }
      }
    }
    if (asset.width && asset.height) {
      const aspectDelta = Math.abs(asset.width / asset.height - preset.width / preset.height);
      if (aspectDelta > 0.01) {
        diagnostics.push(
          makeDiagnostic(
            "asset_aspect_ratio_mismatch",
            `Asset "${asset.id}" aspect ratio ${asset.width}:${asset.height} does not match ${preset.aspectRatio}. Crop/resize the asset, resize the project, or choose a matching preset.`,
            `mediaAssets.${asset.id}.dimensions`,
          ),
        );
      }
    }
  }

  return {
    preset,
    diagnostics,
    preflightActions,
    isValid: diagnostics.length === 0,
  };
}

export function validateRenderRequest(request: RenderRequest): ExportPreset {
  const result = validateRenderRequestDetailed(request);
  if (!result.preset || !result.isValid) {
    const message = result.diagnostics.map((diagnostic) => diagnostic.message).join(" ");
    throw new RenderValidationError(message || "Render validation failed.", result.diagnostics);
  }

  return result.preset;
}

function createArtifactMetadata(
  request: RenderRequest,
  preset: ExportPreset,
  jobId: string,
): RenderArtifactMetadata {
  const fileName = `${request.project.id}-${preset.id}.mp4`;

  return {
    artifactId: `${jobId}-artifact`,
    fileName,
    downloadUrl: `${request.outputPath.replace(/\/$/, "")}/${fileName}`,
    mimeType: "video/mp4",
    width: preset.width,
    height: preset.height,
    fps: preset.fps,
    codec: preset.codec,
    durationMs: request.project.durationMs,
    presetId: preset.id,
    presetLabel: preset.label,
    estimatedSizeBytes: estimateOutputSizeBytes(request.project.durationMs, preset),
    createdAt: new Date().toISOString(),
  };
}

function estimateOutputSizeBytes(durationMs: number, preset: ExportPreset): number {
  const durationSeconds = durationMs / 1000;
  const totalBitrateKbps = preset.videoBitrateKbps + preset.audioBitrateKbps;
  return Math.round((totalBitrateKbps * 1000 * durationSeconds) / 8);
}

export function renderProject(request: RenderRequest): RenderResult {
  const now = new Date().toISOString();
  const jobId = `job_${request.project.id}_${Date.now()}`;

  const baseJob: RenderQueueJob = {
    id: jobId,
    status: "queued",
    request,
    progressPercent: 0,
    statusHistory: [{ status: "queued", timestamp: now }],
    createdAt: now,
    updatedAt: now,
  };

  try {
    const validation = validateRenderRequestDetailed(request);
    if (!validation.preset || !validation.isValid) {
      throw new RenderValidationError(
        validation.diagnostics.map((diagnostic) => diagnostic.message).join(" "),
        validation.diagnostics,
      );
    }

    const preset = validation.preset;
    const renderJob = buildRenderJobFormat(request, jobId);

    const processingAt = new Date().toISOString();
    const processingJob: RenderQueueJob = {
      ...baseJob,
      status: "processing",
      progressPercent: 50,
      statusHistory: [...baseJob.statusHistory, { status: "processing", timestamp: processingAt }],
      preflightActions: validation.preflightActions,
      updatedAt: processingAt,
    };

    const artifact = createArtifactMetadata(request, preset, jobId);
    const completedAt = new Date().toISOString();
    const completedJob: RenderQueueJob = {
      ...processingJob,
      status: "completed",
      progressPercent: 100,
      artifact,
      statusHistory: [...processingJob.statusHistory, { status: "completed", timestamp: completedAt }],
      updatedAt: completedAt,
    };

    return {
      status: completedJob.status,
      job: completedJob,
      serializedJob: JSON.stringify(renderJob),
    };
  } catch (error) {
    const failedAt = new Date().toISOString();
    const failedJob: RenderQueueJob = {
      ...baseJob,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown render failure",
      validationDiagnostics: error instanceof RenderValidationError ? error.diagnostics : undefined,
      statusHistory: [...baseJob.statusHistory, { status: "failed", timestamp: failedAt }],
      updatedAt: failedAt,
    };

    return { status: failedJob.status, job: failedJob };
  }
}
