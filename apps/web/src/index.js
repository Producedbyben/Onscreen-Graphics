import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatesDir = resolve(__dirname, "../../../packages/template-library/src/templates");
const indexHtmlPath = resolve(__dirname, "../public/index.html");
const uploadsDir = resolve(__dirname, "../uploads");
const draftDir = resolve(__dirname, "../storage");
const draftPath = resolve(draftDir, "latest-draft.json");

mkdirSync(uploadsDir, { recursive: true });
mkdirSync(draftDir, { recursive: true });
const execFileAsync = promisify(execFile);

const templateSources = ["ranking-videos.json", "scoreboards.json", "countdown-list.json"];

const templates = templateSources.map((fileName) => {
  const raw = readFileSync(resolve(templatesDir, fileName), "utf8");
  return JSON.parse(raw);
});

const ASPECT_RATIO_DIMENSIONS = {
  "9:16": { width: 1080, height: 1920 },
  "16:9": { width: 1920, height: 1080 },
  "1:1": { width: 1080, height: 1080 }
};

const TIMELINE_DEFAULTS = {
  overlaySnapMs: 100,
  minOverlayDurationMs: 250
};

const SAFE_ZONE_PRESETS = {
  "tiktok-9:16": { top: 0.14, right: 0.2, bottom: 0.22 }
};

const SAFE_ZONE_DEFAULT_OPACITY = 0.35;

const DEFAULT_CAPTION_STYLE_PRESET = {
  presetId: "classic-white",
  packId: "core-defaults",
  label: "Classic White"
};

const DEFAULT_CAPTION_HIGHLIGHT_MODE = "word";

function createDefaultCaptions() {
  return {
    segments: [],
    stylePreset: { ...DEFAULT_CAPTION_STYLE_PRESET },
    highlightMode: DEFAULT_CAPTION_HIGHLIGHT_MODE
  };
}

function normalizeProjectCaptions(project) {
  if (!project || typeof project !== "object") {
    return project;
  }

  const existing = project.captions ?? {};
  project.captions = {
    segments: Array.isArray(existing.segments) ? existing.segments : [],
    stylePreset: { ...DEFAULT_CAPTION_STYLE_PRESET, ...(existing.stylePreset ?? {}) },
    highlightMode: existing.highlightMode ?? DEFAULT_CAPTION_HIGHLIGHT_MODE
  };

  return project;
}

async function requestTranscription(mediaAsset) {
  if (!mediaAsset?.id || !mediaAsset?.filePath) {
    throw validationError("Media asset reference is required for transcription.");
  }

  return {
    provider: {
      id: "placeholder-transcriber",
      label: "Placeholder Transcriber",
      supportsWordTimestamps: true
    },
    segments: [
      {
        text: "Add your first caption segment here.",
        startTimeMs: 0,
        endTimeMs: 1800,
        words: [
          { text: "Add", startTimeMs: 0, endTimeMs: 300 },
          { text: "your", startTimeMs: 300, endTimeMs: 550 },
          { text: "first", startTimeMs: 550, endTimeMs: 900 },
          { text: "caption", startTimeMs: 900, endTimeMs: 1300 },
          { text: "segment", startTimeMs: 1300, endTimeMs: 1800 }
        ]
      }
    ]
  };
}

function getSafeZoneGuideRects(width, height, preset = "tiktok-9:16") {
  const insets = SAFE_ZONE_PRESETS[preset] ?? SAFE_ZONE_PRESETS["tiktok-9:16"];
  const safeWidth = Math.max(0, Number(width) || 0);
  const safeHeight = Math.max(0, Number(height) || 0);

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

function createSafeZoneGuideSettings(aspectRatio) {
  return {
    enabled: aspectRatio === "9:16",
    opacity: SAFE_ZONE_DEFAULT_OPACITY,
    preset: "tiktok-9:16"
  };
}

const SUPPORTED_MEDIA_FORMATS = {
  ".mp4": {
    format: "mp4",
    mimeTypes: ["video/mp4"]
  },
  ".webm": {
    format: "webm",
    mimeTypes: ["video/webm"]
  },
  ".mov": {
    format: "mov",
    mimeTypes: ["video/quicktime"]
  }
};

function validationError(message, details = {}) {
  const error = new Error(message);
  error.code = "VALIDATION_ERROR";
  error.details = details;
  return error;
}

function sanitizeFileName(fileName) {
  return basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
}

function validateMediaUpload({ fileName, mimeType, fileSize }) {
  const extension = extname(fileName).toLowerCase();
  const supportedExtensions = Object.keys(SUPPORTED_MEDIA_FORMATS);
  const supportedFormat = SUPPORTED_MEDIA_FORMATS[extension];

  if (!supportedFormat) {
    throw validationError(`Unsupported file extension \"${extension || "(none)"}\".`, {
      allowedExtensions: supportedExtensions,
      hint: "Use an MP4, WEBM, or MOV video file."
    });
  }

  if (mimeType && !supportedFormat.mimeTypes.includes(mimeType)) {
    throw validationError(`Unsupported content type \"${mimeType}\" for ${extension} file.`, {
      expectedMimeTypes: supportedFormat.mimeTypes,
      hint: "Check your file export settings and try uploading again."
    });
  }

  if (typeof fileSize === "number" && fileSize <= 0) {
    throw validationError("Uploaded file is empty.", {
      hint: "Please select a non-empty video file and retry."
    });
  }

  return supportedFormat;
}

async function probeMediaFile(filePath) {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v",
      "error",
      "-print_format",
      "json",
      "-show_streams",
      "-show_format",
      filePath
    ]);

    const parsed = JSON.parse(stdout);
    const videoStream = parsed.streams?.find((stream) => stream.codec_type === "video");
    const durationSeconds = Number(videoStream?.duration ?? parsed.format?.duration ?? 0);
    const fpsValue = videoStream?.avg_frame_rate;
    const [fpsNumerator, fpsDenominator] = typeof fpsValue === "string" ? fpsValue.split("/") : [];
    const fps =
      fpsNumerator && fpsDenominator && Number(fpsDenominator) !== 0
        ? Number(fpsNumerator) / Number(fpsDenominator)
        : undefined;

    return {
      width: Number(videoStream?.width) || undefined,
      height: Number(videoStream?.height) || undefined,
      durationMs: durationSeconds > 0 ? Math.round(durationSeconds * 1000) : undefined,
      fps: Number.isFinite(fps) ? Number(fps.toFixed(3)) : undefined
    };
  } catch {
    return {
      width: undefined,
      height: undefined,
      durationMs: undefined,
      fps: undefined
    };
  }
}

function getTemplateById(templateId) {
  return templates.find((template) => template.id === templateId);
}

function listTemplateMetadata() {
  return templates.map(({ id, name, category, aspectRatio, defaultDurationMs }) => ({
    id,
    name,
    category,
    aspectRatio,
    defaultDurationMs
  }));
}

function createProjectScaffold({ projectName, aspectRatio = "9:16", durationMs = 15000 }) {
  const now = new Date().toISOString();
  const normalizedAspectRatio = ASPECT_RATIO_DIMENSIONS[aspectRatio] ? aspectRatio : "9:16";
  const dimensions = ASPECT_RATIO_DIMENSIONS[normalizedAspectRatio] ?? ASPECT_RATIO_DIMENSIONS["9:16"];
  const projectId = `project-${Date.now()}`;

  return {
    id: projectId,
    name: projectName?.trim() || "Untitled Project",
    fps: 30,
    width: dimensions.width,
    height: dimensions.height,
    durationMs,
    tracks: [
      { id: `${projectId}-track-video`, name: "Background Video", type: "video", clips: [], muted: false, locked: false },
      { id: `${projectId}-track-overlay`, name: "Overlays", type: "overlay", clips: [], muted: false, locked: false }
    ],
    captions: createDefaultCaptions(),
    scenes: [],
    template: undefined,
    createdAt: now,
    updatedAt: now,
    metadata: {
      createFlow: "upload-first",
      editableFieldDefaults: {},
      bulkFieldValues: {},
      timeline: {
        layerLocks: {},
        snappingEnabled: true,
        snapThresholdMs: TIMELINE_DEFAULTS.overlaySnapMs,
        playheadMs: 0
      },
      warnings: [],
      safeZoneGuides: createSafeZoneGuideSettings(normalizedAspectRatio)
    }
  };
}

function importMediaAndCreateProject({
  asset,
  projectName,
  aspectRatio = "9:16",
  durationMs = 15000,
  trimInMs = 0,
  trimOutMs
}) {
  if (!asset?.filePath || !asset?.fileName) {
    throw validationError("Missing uploaded media reference.", {
      hint: "Upload a media file before creating a project."
    });
  }

  const validated = validateMediaUpload({
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    fileSize: asset.fileSize
  });

  const inferredDurationMs = asset.probe?.durationMs ?? durationMs;
  const clipTrimOutMs = trimOutMs ?? inferredDurationMs;
  const clipDuration = Math.max(1000, clipTrimOutMs - trimInMs);

  const project = createProjectScaffold({ projectName, aspectRatio, durationMs: inferredDurationMs });
  if (asset.probe?.fps) {
    project.fps = Math.round(asset.probe.fps);
  }

  const videoClip = {
    id: `${project.id}-clip-bg-1`,
    sourceUri: asset.filePath,
    startTimeMs: 0,
    durationMs: clipDuration,
    trimInMs,
    trimOutMs: clipTrimOutMs,
    overlays: [],
    metadata: {
      importedFileName: asset.fileName,
      importType: validated.format,
      mimeType: asset.mimeType,
      fileSize: asset.fileSize,
      sourceWidth: asset.probe?.width,
      sourceHeight: asset.probe?.height,
      sourceDurationMs: asset.probe?.durationMs,
      sourceFps: asset.probe?.fps
    }
  };

  project.tracks[0].clips.push(videoClip);
  project.updatedAt = new Date().toISOString();

  return project;
}

function createProjectFromTemplate({ templateId, projectName, baseProject }) {
  const template = getTemplateById(templateId);

  if (!template) {
    throw new Error(`Template not found for id: ${templateId}`);
  }

  const project = baseProject
    ? JSON.parse(JSON.stringify(baseProject))
    : createProjectScaffold({
        projectName: projectName?.trim() || `${template.name} Project`,
        aspectRatio: template.aspectRatio,
        durationMs: template.defaultDurationMs
      });

  project.template = template;
  project.metadata = project.metadata ?? {};
  project.metadata.createFlow = "template-first";
  project.metadata.editableFieldDefaults = { ...(project.metadata.editableFieldDefaults ?? {}), ...(template.defaults?.fields ?? {}) };
  project.metadata.bulkFieldValues = { ...(project.metadata.bulkFieldValues ?? {}), ...(template.defaults?.fields ?? {}) };
  project.updatedAt = new Date().toISOString();

  return project;
}

function applyTemplateOneClick(project, templateId) {
  const nextProject = createProjectFromTemplate({ templateId, baseProject: project });
  const videoTrack = nextProject.tracks.find((track) => track.type === "video");

  if (videoTrack?.clips[0]) {
    const clip = videoTrack.clips[0];
    clip.overlays = [
      {
        id: `${clip.id}-overlay-title`,
        kind: "text",
        layer: 1,
        text: "Top Scorer",
        startTimeMs: 500,
        endTimeMs: 3200,
        style: { fontSize: 64, color: "#FFFFFF", fontWeight: 700 },
        keyframes: []
      }
    ];
  }

  return nextProject;
}

function bulkEditTemplateFields(project, fieldsPatch) {
  const nextProject = JSON.parse(JSON.stringify(project));
  nextProject.metadata.bulkFieldValues = { ...nextProject.metadata.bulkFieldValues, ...fieldsPatch };
  nextProject.updatedAt = new Date().toISOString();
  return nextProject;
}

function setTimelineLayerLock(project, layerId, locked) {
  const nextProject = JSON.parse(JSON.stringify(project));
  nextProject.metadata.timeline.layerLocks[layerId] = Boolean(locked);
  nextProject.updatedAt = new Date().toISOString();
  return nextProject;
}

function snapTime(timeMs, snapTargets, thresholdMs) {
  let snapped = timeMs;
  let smallestDistance = thresholdMs + 1;

  for (const target of snapTargets) {
    const distance = Math.abs(target - timeMs);
    if (distance <= thresholdMs && distance < smallestDistance) {
      smallestDistance = distance;
      snapped = target;
    }
  }

  return snapped;
}

function moveOverlayWithTimelineRules(project, { clipId, overlayId, nextStartTimeMs, nextEndTimeMs, layerId }) {
  const nextProject = JSON.parse(JSON.stringify(project));
  const isLayerLocked = nextProject.metadata.timeline.layerLocks[layerId];

  if (isLayerLocked) {
    throw new Error(`Layer ${layerId} is locked and cannot be edited.`);
  }

  const isSnappingEnabled = nextProject.metadata.timeline.snappingEnabled !== false;
  const snapThresholdMs = nextProject.metadata.timeline.snapThresholdMs ?? TIMELINE_DEFAULTS.overlaySnapMs;
  const track = nextProject.tracks.find((candidate) => candidate.type === "video" || candidate.type === "overlay");
  const clip = track?.clips.find((candidate) => candidate.id === clipId);

  if (!clip) {
    throw new Error(`Clip ${clipId} not found.`);
  }

  const overlay = clip.overlays.find((candidate) => candidate.id === overlayId);
  if (!overlay) {
    throw new Error(`Overlay ${overlayId} not found.`);
  }

  const snapTargets = [0, clip.durationMs, ...clip.overlays.flatMap((entry) => [entry.startTimeMs, entry.endTimeMs])];
  const inputStart = Number(nextStartTimeMs);
  const inputEnd = Number(nextEndTimeMs);

  const desiredStart = isSnappingEnabled ? snapTime(inputStart, snapTargets, snapThresholdMs) : inputStart;
  const desiredEnd = isSnappingEnabled ? snapTime(inputEnd, snapTargets, snapThresholdMs) : inputEnd;
  const minimumEnd = desiredStart + TIMELINE_DEFAULTS.minOverlayDurationMs;

  overlay.startTimeMs = Math.max(0, desiredStart);
  overlay.endTimeMs = Math.max(minimumEnd, desiredEnd);
  nextProject.updatedAt = new Date().toISOString();

  return nextProject;
}

function duplicateScene(project, sceneId) {
  const nextProject = JSON.parse(JSON.stringify(project));
  const sourceScene = nextProject.scenes.find((scene) => scene.id === sceneId);

  if (!sourceScene) {
    throw new Error(`Scene ${sceneId} not found.`);
  }

  const duplicate = {
    ...sourceScene,
    id: `${sourceScene.id}-copy-${Date.now()}`,
    name: `${sourceScene.name} (Copy)`
  };

  const insertIndex = nextProject.scenes.findIndex((scene) => scene.id === sceneId);
  nextProject.scenes.splice(insertIndex + 1, 0, duplicate);
  nextProject.updatedAt = new Date().toISOString();
  return nextProject;
}

function applyStyleToAllScenes(project, stylePatch) {
  const nextProject = JSON.parse(JSON.stringify(project));
  nextProject.scenes = nextProject.scenes.map((scene) => ({
    ...scene,
    style: { ...(scene.style ?? {}), ...stylePatch }
  }));

  nextProject.updatedAt = new Date().toISOString();
  return nextProject;
}

function autoFitTextWithinBoundingBox({ text, boxWidth, boxHeight, fontSize, lineHeight = 1.2, minFontSize = 12 }) {
  const estimateCharsPerLine = (size) => Math.max(1, Math.floor(boxWidth / (size * 0.55)));
  const estimateLineCount = (size) => Math.ceil(text.length / estimateCharsPerLine(size));
  const estimatedHeight = (size) => estimateLineCount(size) * size * lineHeight;

  let nextFontSize = fontSize;
  while (nextFontSize > minFontSize && estimatedHeight(nextFontSize) > boxHeight) {
    nextFontSize -= 1;
  }

  const overflow = estimatedHeight(nextFontSize) > boxHeight;

  return {
    fittedFontSize: nextFontSize,
    overflow,
    warning: overflow ? "Text overflow remains after auto-fit. Consider shortening text." : undefined
  };
}

function buildDemoSceneData(project) {
  const nextProject = JSON.parse(JSON.stringify(project));
  nextProject.scenes = [
    {
      id: "scene-1",
      name: "Top 10 Intro",
      fields: { rankLabel: "#10", accentColor: "#00E5FF" },
      style: { fontFamily: "Inter", fontWeight: 700 }
    },
    {
      id: "scene-2",
      name: "Top 9 Reveal",
      fields: { rankLabel: "#9", accentColor: "#00E5FF" },
      style: { fontFamily: "Inter", fontWeight: 700 }
    }
  ];

  const videoTrack = nextProject.tracks.find((track) => track.type === "video");
  if (videoTrack?.clips[0]) {
    videoTrack.clips[0].overlays.push({
      id: "overlay-title",
      kind: "text",
      text: "Top 10 Goal Scorers",
      layer: 2,
      startTimeMs: 600,
      endTimeMs: 2800,
      keyframes: [],
      style: { fontSize: 72, color: "#FFFFFF", fontWeight: 700 }
    });
  }

  return nextProject;
}

async function runCreateFromTemplateFlow(selectedTemplateId, projectName, mediaAsset) {
  const templateOptions = listTemplateMetadata();

  let project = importMediaAndCreateProject({
    asset: mediaAsset,
    projectName: projectName || "Untitled from Upload",
    aspectRatio: templateOptions[0]?.aspectRatio ?? "9:16"
  });

  project = applyTemplateOneClick(project, selectedTemplateId ?? templateOptions[0]?.id);
  project = buildDemoSceneData(project);
  project = bulkEditTemplateFields(project, { rankLabel: "#1", accentColor: "#FF5A5F" });
  project = applyStyleToAllScenes(project, { fontFamily: "Sora", textTransform: "uppercase" });
  project = setTimelineLayerLock(project, "layer-1", true);

  const transcription = await requestTranscription(mediaAsset);
  project.captions = {
    ...(project.captions ?? createDefaultCaptions()),
    segments: transcription.segments
  };

  const fitResult = autoFitTextWithinBoundingBox({
    text: "WORLD'S FASTEST GOAL SCORERS",
    boxWidth: 860,
    boxHeight: 140,
    fontSize: 64
  });

  if (fitResult.warning) {
    project.metadata.warnings.push(fitResult.warning);
  }

  return { project, fitResult, transcriptionProvider: transcription.provider };
}

function getPrimaryClip(project) {
  const videoTrack = project?.tracks?.find((track) => track.type === "video");
  return videoTrack?.clips?.[0];
}

function updateProjectState(project, operation, payload) {
  switch (operation) {
    case "bulk-edit-fields":
      return bulkEditTemplateFields(project, payload?.fieldsPatch ?? {});
    case "apply-style-all-scenes":
      return applyStyleToAllScenes(project, payload?.stylePatch ?? {});
    case "move-overlay":
      return moveOverlayWithTimelineRules(project, payload);
    case "set-layer-lock":
      return setTimelineLayerLock(project, payload?.layerId, payload?.locked);
    case "set-snap-enabled": {
      const nextProject = JSON.parse(JSON.stringify(project));
      nextProject.metadata.timeline.snappingEnabled = Boolean(payload?.enabled);
      nextProject.updatedAt = new Date().toISOString();
      return nextProject;
    }
    case "set-playhead": {
      const nextProject = JSON.parse(JSON.stringify(project));
      const durationMs = getPrimaryClip(nextProject)?.durationMs ?? nextProject.durationMs;
      const safePlayhead = Math.max(0, Math.min(Number(payload?.playheadMs ?? 0), durationMs));
      nextProject.metadata.timeline.playheadMs = safePlayhead;
      nextProject.updatedAt = new Date().toISOString();
      return nextProject;
    }
    default:
      throw validationError(`Unsupported operation: ${operation}`);
  }
}

function parseRequestBody(req) {
  return new Promise((resolveBody, rejectBody) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => resolveBody(raw));
    req.on("error", rejectBody);
  });
}

async function parseJsonBody(req) {
  const raw = await parseRequestBody(req);
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload, null, 2));
}

function saveDraft(project) {
  const normalizedProject = normalizeProjectCaptions(JSON.parse(JSON.stringify(project)));
  const now = new Date().toISOString();
  const record = {
    project: normalizedProject,
    updatedAt: now
  };

  writeFileSync(draftPath, JSON.stringify(record, null, 2));
  return record;
}

function loadDraft() {
  if (!existsSync(draftPath)) {
    return null;
  }

  const raw = readFileSync(draftPath, "utf8");
  const parsed = JSON.parse(raw);
  if (parsed?.project) {
    normalizeProjectCaptions(parsed.project);
  }
  return parsed;
}

async function handleUploadRequest(req, res) {
  const fileName = req.headers["x-file-name"];
  const mimeType = req.headers["content-type"];
  const fileSize = Number(req.headers["content-length"]);

  if (!fileName || Array.isArray(fileName)) {
    throw validationError("Missing file metadata.", {
      hint: "Send the original file name in the x-file-name request header."
    });
  }

  const validatedFormat = validateMediaUpload({ fileName, mimeType, fileSize });
  const safeName = sanitizeFileName(fileName);
  const storageName = `${Date.now()}-${randomUUID()}-${safeName}`;
  const filePath = resolve(uploadsDir, storageName);

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const data = Buffer.concat(chunks);
  validateMediaUpload({ fileName, mimeType, fileSize: data.byteLength });
  writeFileSync(filePath, data);
  const probe = await probeMediaFile(filePath);

  sendJson(res, 201, {
    asset: {
      id: storageName,
      fileName: safeName,
      filePath,
      format: validatedFormat.format,
      mimeType,
      fileSize: data.byteLength,
      probe
    }
  });
}

function startWebServer() {
  const port = Number(process.env.PORT ?? 3000);
  const indexHtml = readFileSync(indexHtmlPath, "utf8");

  const server = createServer(async (req, res) => {
    const { method, url } = req;

    if (method === "GET" && url === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(indexHtml);
      return;
    }

    if (method === "GET" && url === "/api/templates") {
      sendJson(res, 200, { templates: listTemplateMetadata() });
      return;
    }

    if (method === "GET" && url === "/api/workflow/steps") {
      sendJson(res, 200, {
        steps: [
          { id: "template", title: "Choose template", description: "Start from a scoreboard/countdown template." },
          { id: "media", title: "Upload media", description: "Attach your background video clip." },
          { id: "edit", title: "Edit", description: "Adjust fields, overlays, styles, and scene timing." },
          { id: "timeline", title: "Timeline", description: "Move playhead, snap overlays, lock layers." },
          { id: "export", title: "Export", description: "Review and export project JSON." }
        ]
      });
      return;
    }

    if (method === "POST" && url === "/api/uploads") {
      try {
        await handleUploadRequest(req, res);
      } catch (error) {
        const statusCode = error.code === "VALIDATION_ERROR" ? 422 : 400;
        sendJson(res, statusCode, {
          error: error.message,
          code: error.code ?? "BAD_REQUEST",
          details: error.details
        });
      }
      return;
    }

    if (method === "POST" && url === "/api/transcriptions/request") {
      try {
        const parsedBody = await parseJsonBody(req);
        const transcription = await requestTranscription(parsedBody.mediaAsset);
        sendJson(res, 200, transcription);
      } catch (error) {
        const statusCode = error.code === "VALIDATION_ERROR" ? 422 : 400;
        sendJson(res, statusCode, {
          error: error.message,
          code: error.code ?? "BAD_REQUEST",
          details: error.details
        });
      }
      return;
    }

    if (method === "POST" && url === "/api/projects/from-template") {
      try {
        const parsedBody = await parseJsonBody(req);
        const { templateId, projectName, mediaAsset } = parsedBody;

        const result = await runCreateFromTemplateFlow(templateId, projectName, mediaAsset);
        const preset = result.project?.metadata?.safeZoneGuides?.preset;
        const guides = getSafeZoneGuideRects(result.project?.width, result.project?.height, preset);
        sendJson(res, 200, { ...result, guides });
      } catch (error) {
        const statusCode = error.code === "VALIDATION_ERROR" ? 422 : 400;
        sendJson(res, statusCode, {
          error: error.message,
          code: error.code ?? "BAD_REQUEST",
          details: error.details
        });
      }
      return;
    }

    if (method === "POST" && url === "/api/projects/update") {
      try {
        const parsedBody = await parseJsonBody(req);
        const { project, operation, payload } = parsedBody;

        if (!project) {
          throw validationError("Project payload is required.");
        }

        const updatedProject = updateProjectState(project, operation, payload);
        const preset = updatedProject?.metadata?.safeZoneGuides?.preset;
        const guides = getSafeZoneGuideRects(updatedProject?.width, updatedProject?.height, preset);
        sendJson(res, 200, { project: updatedProject, guides });
      } catch (error) {
        const statusCode = error.code === "VALIDATION_ERROR" ? 422 : 400;
        sendJson(res, statusCode, {
          error: error.message,
          code: error.code ?? "BAD_REQUEST",
          details: error.details
        });
      }
      return;
    }

    if (method === "POST" && url === "/api/projects/draft") {
      try {
        const parsedBody = await parseJsonBody(req);
        if (!parsedBody.project) {
          throw validationError("Project payload is required for draft save.");
        }

        const saved = saveDraft(parsedBody.project);
        sendJson(res, 201, saved);
      } catch (error) {
        const statusCode = error.code === "VALIDATION_ERROR" ? 422 : 400;
        sendJson(res, statusCode, {
          error: error.message,
          code: error.code ?? "BAD_REQUEST",
          details: error.details
        });
      }
      return;
    }

    if (method === "GET" && url === "/api/projects/draft") {
      const draft = loadDraft();
      sendJson(res, 200, { draft });
      return;
    }

    if (method === "POST" && url === "/api/projects/safe-zones") {
      try {
        const parsedBody = await parseJsonBody(req);
        const { width, height, preset } = parsedBody;
        const guides = getSafeZoneGuideRects(width, height, preset);
        sendJson(res, 200, { guides, width, height, preset: preset ?? "tiktok-9:16" });
      } catch (error) {
        sendJson(res, 400, {
          error: error.message,
          code: error.code ?? "BAD_REQUEST",
          details: error.details
        });
      }
      return;
    }

    sendJson(res, 404, { error: "Not Found" });
  });

  server.listen(port, () => {
    console.log(`Onscreen web UI running at http://localhost:${port}`);
  });
}

if (process.env.NODE_ENV !== "test") {
  startWebServer();
}

export {
  applyStyleToAllScenes,
  applyTemplateOneClick,
  autoFitTextWithinBoundingBox,
  bulkEditTemplateFields,
  createProjectFromTemplate,
  duplicateScene,
  importMediaAndCreateProject,
  listTemplateMetadata,
  moveOverlayWithTimelineRules,
  requestTranscription,
  runCreateFromTemplateFlow,
  saveDraft,
  loadDraft,
  setTimelineLayerLock,
  startWebServer,
  updateProjectState
};
