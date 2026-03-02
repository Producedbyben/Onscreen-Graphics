import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatesDir = resolve(__dirname, "../../../packages/template-library/src/templates");

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

function createProjectFromTemplate({ templateId, projectName }) {
  const template = getTemplateById(templateId);

  if (!template) {
    throw new Error(`Template not found for id: ${templateId}`);
  }

  const now = new Date().toISOString();
  const dimensions = ASPECT_RATIO_DIMENSIONS[template.aspectRatio] ?? ASPECT_RATIO_DIMENSIONS["9:16"];
  const projectId = `project-${template.id}-${Date.now()}`;

  return {
    id: projectId,
    name: projectName?.trim() || `${template.name} Project`,
    fps: 30,
    width: dimensions.width,
    height: dimensions.height,
    durationMs: template.defaultDurationMs,
    tracks: template.trackBlueprints.map((track, index) => ({
      id: `${projectId}-track-${index + 1}`,
      name: track.name,
      type: track.type,
      clips: []
    })),
    template,
    createdAt: now,
    updatedAt: now,
    metadata: {
      createFlow: "create-from-template",
      editableFieldDefaults: template.editableFields.reduce((accumulator, field) => {
        accumulator[field.id] = field.defaultValue;
        return accumulator;
      }, {}),
      layoutZones: template.layoutZones,
      animationPresets: template.animationPresets,
      sceneSequencingRules: template.sceneSequencingRules
    }
  };
}

function runCreateFromTemplateFlow(selectedTemplateId) {
  const templateOptions = listTemplateMetadata();
  console.log("Available templates:");
  console.table(templateOptions);

  const project = createProjectFromTemplate({
    templateId: selectedTemplateId ?? templateOptions[0]?.id,
    projectName: "Untitled from Template"
  });

  console.log("Created project from template metadata:");
  console.log(JSON.stringify(project, null, 2));

  return project;
}

runCreateFromTemplateFlow(process.env.TEMPLATE_ID);

export { createProjectFromTemplate, runCreateFromTemplateFlow, listTemplateMetadata };
