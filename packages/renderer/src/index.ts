import type { AnimationKeyframe, OverlayElement, Project, Track } from "@onscreen/core";

export type SupportedCodec = "h264";
export type SupportedContainer = "mp4";
export type RenderPresetId = "social-1080x1920-30" | "social-1080x1920-60";
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
  width: 1080;
  height: 1920;
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
    width: 1080,
    height: 1920,
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
    width: 1080,
    height: 1920,
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
  createdAt: string;
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
}

export interface RenderResult {
  status: RenderQueueStatus;
  job: RenderQueueJob;
  serializedJob?: string;
}

export class RenderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RenderValidationError";
  }
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

export function validateRenderRequest(request: RenderRequest): ExportPreset {
  const preset = EXPORT_PRESETS[request.preset];
  if (!preset) {
    throw new RenderValidationError(`Unsupported preset: ${request.preset}`);
  }

  const codec = request.codec ?? preset.codec;
  const container = request.container ?? preset.container;

  if (codec !== "h264") {
    throw new RenderValidationError(`Codec \"${codec}\" is not supported for social export.`);
  }

  if (container !== "mp4") {
    throw new RenderValidationError(`Container \"${container}\" is not supported. Use mp4.`);
  }

  if (request.project.width !== preset.width || request.project.height !== preset.height) {
    throw new RenderValidationError(
      `Project resolution ${request.project.width}x${request.project.height} is incompatible with preset ${preset.width}x${preset.height}.`,
    );
  }

  if (request.project.fps !== preset.fps) {
    throw new RenderValidationError(
      `Project FPS ${request.project.fps} is incompatible with preset FPS ${preset.fps}.`,
    );
  }

  for (const asset of request.mediaAssets) {
    if (asset.kind === "video") {
      if (asset.codec && asset.codec !== "h264") {
        throw new RenderValidationError(
          `Video asset ${asset.id} uses unsupported codec ${asset.codec}. Supported: h264.`,
        );
      }
      if (asset.container && asset.container !== "mp4") {
        throw new RenderValidationError(
          `Video asset ${asset.id} uses unsupported container ${asset.container}. Supported: mp4.`,
        );
      }
      if (typeof asset.fps === "number" && asset.fps > preset.fps) {
        throw new RenderValidationError(
          `Video asset ${asset.id} has FPS ${asset.fps}, exceeding output FPS ${preset.fps}.`,
        );
      }
    }
    if (asset.width && asset.height && asset.width / asset.height !== preset.width / preset.height) {
      throw new RenderValidationError(
        `Asset ${asset.id} aspect ratio ${asset.width}:${asset.height} does not match 9:16 output preset.`,
      );
    }
  }

  return preset;
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
    createdAt: new Date().toISOString(),
  };
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
    const preset = validateRenderRequest(request);
    const renderJob = buildRenderJobFormat(request, jobId);

    const processingAt = new Date().toISOString();
    const processingJob: RenderQueueJob = {
      ...baseJob,
      status: "processing",
      progressPercent: 50,
      statusHistory: [...baseJob.statusHistory, { status: "processing", timestamp: processingAt }],
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
      statusHistory: [...baseJob.statusHistory, { status: "failed", timestamp: failedAt }],
      updatedAt: failedAt,
    };

    return { status: failedJob.status, job: failedJob };
  }
}
