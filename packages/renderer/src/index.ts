import { validateTextLegibility } from "@onscreen/core";
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
export type UserFacingPresetTier = "TikTok Fast" | "TikTok Standard" | "TikTok High";

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

export interface PresetTierEncoding {
  tier: UserFacingPresetTier;
  h264Profile: H264Profile;
  videoBitrateKbps: number;
  audioBitrateKbps: number;
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

const PRESET_TIER_ENCODINGS: Record<UserFacingPresetTier, PresetTierEncoding> = {
  "TikTok Fast": {
    tier: "TikTok Fast",
    h264Profile: "baseline",
    videoBitrateKbps: 6000,
    audioBitrateKbps: 192,
  },
  "TikTok Standard": {
    tier: "TikTok Standard",
    h264Profile: "main",
    videoBitrateKbps: 8000,
    audioBitrateKbps: 256,
  },
  "TikTok High": {
    tier: "TikTok High",
    h264Profile: "high",
    videoBitrateKbps: 12000,
    audioBitrateKbps: 320,
  },
};

export type RenderQueueStatus = "queued" | "processing" | "retrying" | "failed" | "completed";

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

export interface RenderStatusMetadata {
  warnings?: string[];
}

export interface RenderQueueJob {
  id: string;
  idempotencyKey: string;
  status: RenderQueueStatus;
  request: RenderRequest;
  attempt: number;
  maxAttempts: number;
  lastFailureReason?: string;
  progressPercent: number;
  statusHistory: RenderQueueStatusEntry[];
  errorMessage?: string;
  validationDiagnostics?: RenderValidationDiagnostic[];
  preflightActions?: RenderPreflightAction[];
  artifact?: RenderArtifactMetadata;
  statusMetadata?: RenderStatusMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface RenderRequest {
  project: Project;
  outputPath: string;
  preset: RenderPresetId;
  presetTier?: UserFacingPresetTier;
  idempotencyKey: string;
  mediaAssets: MediaAsset[];
  retry?: {
    maxAttempts?: number;
  };
  codec?: SupportedCodec;
  container?: SupportedContainer;
  preflight?: {
    normalizeVideoContainer?: boolean;
    normalizeVideoFps?: boolean;
  };
  legibilityValidation?: {
    enabled?: boolean;
    minimumContrastRatio?: number;
    backgroundSample?: string;
  };
}

export interface RenderResult {
  status: RenderQueueStatus;
  statusMessage: string;
  job: RenderQueueJob;
  serializedJob?: string;
}

export interface RenderBatchVariantRequest {
  variantId: string;
  request: RenderRequest;
}

export interface RenderBatchRequest {
  batchId: string;
  variants: RenderBatchVariantRequest[];
}

export interface RenderBatchVariantResult {
  variantId: string;
  status: RenderQueueStatus;
  attempt: number;
  maxAttempts: number;
  retriesUsed: number;
  result: RenderResult;
}

export interface RenderBatchResult {
  batchId: string;
  status: RenderQueueStatus;
  statusMessage: string;
  totalVariants: number;
  completedVariants: number;
  failedVariants: number;
  retriesUsed: number;
  variants: RenderBatchVariantResult[];
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


function collectLegibilityWarnings(request: RenderRequest): string[] {
  if (!request.legibilityValidation?.enabled) {
    return [];
  }

  const threshold = request.legibilityValidation.minimumContrastRatio ?? 4.5;
  const backgroundSample = request.legibilityValidation.backgroundSample ?? "#7C8594";
  const warnings: string[] = [];

  for (const track of request.project.tracks) {
    for (const clip of track.clips) {
      for (const overlay of clip.overlays) {
        if (overlay.kind !== "text") {
          continue;
        }

        const validation = validateTextLegibility((overlay.style ?? {}) as Record<string, unknown>, backgroundSample, threshold);
        if (!validation.passes) {
          warnings.push(
            `Overlay "${overlay.id}" failed legibility threshold ${threshold.toFixed(2)} with contrast ${validation.contrastRatio.toFixed(2)}.`,
          );
        }
      }
    }
  }

  return warnings;
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

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
  return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`).join(",")}}`;
}

function buildIdempotencyFingerprint(request: RenderRequest): string {
  const { idempotencyKey: _idempotencyKey, retry: _retry, ...requestPayload } = request;
  return stableStringify(requestPayload);
}

function getStatusMessage(status: RenderQueueStatus, job: RenderQueueJob): string {
  switch (status) {
    case "queued":
      return "Render request queued.";
    case "processing":
      return "Render is processing.";
    case "retrying":
      return `Render failed and is retrying (attempt ${job.attempt} of ${job.maxAttempts}).`;
    case "failed":
      return `Render failed after ${job.attempt} attempt(s): ${job.lastFailureReason ?? "Unknown error"}.`;
    case "completed":
      return "Render completed successfully.";
  }
}

function withTierEncoding(preset: ExportPreset, tier: UserFacingPresetTier): ExportPreset {
  const tierEncoding = PRESET_TIER_ENCODINGS[tier];
  return {
    ...preset,
    h264Profile: tierEncoding.h264Profile,
    videoBitrateKbps: tierEncoding.videoBitrateKbps,
    audioBitrateKbps: tierEncoding.audioBitrateKbps,
    label: `${preset.label} (${tier})`,
  };
}

interface IdempotentJobRecord {
  fingerprint: string;
  result: RenderResult;
}

const IDEMPOTENT_JOB_STORE = new Map<string, IdempotentJobRecord>();

export function renderProject(request: RenderRequest): RenderResult {
  const maxAttempts = Math.max(1, request.retry?.maxAttempts ?? 3);
  const fingerprint = buildIdempotencyFingerprint(request);
  const existingJob = IDEMPOTENT_JOB_STORE.get(request.idempotencyKey);

  if (existingJob) {
    if (existingJob.fingerprint !== fingerprint) {
      const now = new Date().toISOString();
      const conflictJob: RenderQueueJob = {
        id: `job_${request.project.id}_${Date.now()}`,
        idempotencyKey: request.idempotencyKey,
        status: "failed",
        request,
        attempt: 1,
        maxAttempts,
        progressPercent: 0,
        lastFailureReason: "Idempotency key already exists for a different request payload.",
        errorMessage: "Idempotency key already exists for a different request payload.",
        statusHistory: [
          { status: "queued", timestamp: now },
          { status: "failed", timestamp: now, detail: "idempotency_mismatch" },
        ],
        createdAt: now,
        updatedAt: now,
      };

      return {
        status: conflictJob.status,
        statusMessage: getStatusMessage(conflictJob.status, conflictJob),
        job: conflictJob,
      };
    }

    return existingJob.result;
  }

  const now = new Date().toISOString();
  const jobId = `job_${request.project.id}_${Date.now()}`;

  let activeJob: RenderQueueJob = {
    id: jobId,
    idempotencyKey: request.idempotencyKey,
    status: "queued",
    request,
    attempt: 1,
    maxAttempts,
    progressPercent: 0,
    statusHistory: [{ status: "queued", timestamp: now }],
    createdAt: now,
    updatedAt: now,
  };

  const tier = request.presetTier ?? "TikTok Standard";

  while (activeJob.attempt <= activeJob.maxAttempts) {
    try {
      const validation = validateRenderRequestDetailed(request);
      if (!validation.preset || !validation.isValid) {
        throw new RenderValidationError(
          validation.diagnostics.map((diagnostic) => diagnostic.message).join(" "),
          validation.diagnostics,
        );
      }

      const preset = withTierEncoding(validation.preset, tier);
      const renderJob = buildRenderJobFormat(request, jobId);
      const legibilityWarnings = collectLegibilityWarnings(request);

      const processingAt = new Date().toISOString();
      activeJob = {
        ...activeJob,
        status: "processing",
        progressPercent: 50,
        statusHistory: [...activeJob.statusHistory, { status: "processing", timestamp: processingAt }],
        preflightActions: validation.preflightActions,
        statusMetadata: legibilityWarnings.length > 0 ? { warnings: legibilityWarnings } : undefined,
        updatedAt: processingAt,
      };

      const artifact = createArtifactMetadata(request, preset, jobId);
      const completedAt = new Date().toISOString();
      const completedJob: RenderQueueJob = {
        ...activeJob,
        status: "completed",
        progressPercent: 100,
        artifact,
        statusHistory: [...activeJob.statusHistory, { status: "completed", timestamp: completedAt }],
        updatedAt: completedAt,
      };

      const result: RenderResult = {
        status: completedJob.status,
        statusMessage: getStatusMessage(completedJob.status, completedJob),
        job: completedJob,
        serializedJob: JSON.stringify(renderJob),
      };

      IDEMPOTENT_JOB_STORE.set(request.idempotencyKey, { fingerprint, result });
      return result;
    } catch (error) {
      const failureReason = error instanceof Error ? error.message : "Unknown render failure";
      const failedAt = new Date().toISOString();
      const failedStatusEntry: RenderQueueStatusEntry = {
        status: "failed",
        timestamp: failedAt,
        detail: failureReason,
      };

      if (activeJob.attempt < activeJob.maxAttempts) {
        const retryAt = new Date().toISOString();
        activeJob = {
          ...activeJob,
          status: "retrying",
          progressPercent: 0,
          lastFailureReason: failureReason,
          errorMessage: failureReason,
          validationDiagnostics: error instanceof RenderValidationError ? error.diagnostics : undefined,
          statusHistory: [...activeJob.statusHistory, failedStatusEntry, { status: "retrying", timestamp: retryAt }],
          attempt: activeJob.attempt + 1,
          updatedAt: retryAt,
        };
        continue;
      }

      const terminalFailedJob: RenderQueueJob = {
        ...activeJob,
        status: "failed",
        progressPercent: 0,
        lastFailureReason: failureReason,
        errorMessage: failureReason,
        validationDiagnostics: error instanceof RenderValidationError ? error.diagnostics : undefined,
        statusHistory: [...activeJob.statusHistory, failedStatusEntry],
        updatedAt: failedAt,
      };

      const result: RenderResult = {
        status: terminalFailedJob.status,
        statusMessage: getStatusMessage(terminalFailedJob.status, terminalFailedJob),
        job: terminalFailedJob,
      };

      IDEMPOTENT_JOB_STORE.set(request.idempotencyKey, { fingerprint, result });
      return result;
    }
  }

  const exhaustedResult: RenderResult = {
    status: "failed",
    statusMessage: "Render failed after exhausting retry attempts.",
    job: activeJob,
  };
  IDEMPOTENT_JOB_STORE.set(request.idempotencyKey, { fingerprint, result: exhaustedResult });
  return exhaustedResult;
}

function getBatchStatus(variants: RenderBatchVariantResult[]): RenderQueueStatus {
  if (variants.some((variant) => variant.status === "failed")) {
    return "failed";
  }

  if (variants.some((variant) => variant.status === "retrying" || variant.status === "processing" || variant.status === "queued")) {
    return "processing";
  }

  return "completed";
}

export function renderProjectBatch(request: RenderBatchRequest): RenderBatchResult {
  const variants = request.variants.map((variant) => {
    const result = renderProject(variant.request);
    return {
      variantId: variant.variantId,
      status: result.status,
      attempt: result.job.attempt,
      maxAttempts: result.job.maxAttempts,
      retriesUsed: Math.max(0, result.job.attempt - 1),
      result,
    } satisfies RenderBatchVariantResult;
  });

  const status = getBatchStatus(variants);
  const completedVariants = variants.filter((variant) => variant.status === "completed").length;
  const failedVariants = variants.filter((variant) => variant.status === "failed").length;
  const retriesUsed = variants.reduce((total, variant) => total + variant.retriesUsed, 0);

  return {
    batchId: request.batchId,
    status,
    statusMessage:
      status === "completed"
        ? `Batch completed for ${completedVariants}/${variants.length} variant(s).`
        : `Batch finished with ${failedVariants} failed variant(s) out of ${variants.length}.`,
    totalVariants: variants.length,
    completedVariants,
    failedVariants,
    retriesUsed,
    variants,
  };
}

export function renderProjectRequest(request: RenderRequest | RenderBatchRequest): RenderResult | RenderBatchResult {
  if ("variants" in request) {
    return renderProjectBatch(request);
  }

  return renderProject(request);
}
