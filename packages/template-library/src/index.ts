import type { TemplateDefinition } from "@onscreen/core";
import { migrateTemplateDefinition } from "./migrations";
import rankingVideosTemplate from "./templates/ranking-videos.json";
import scoreboardsTemplate from "./templates/scoreboards.json";
import countdownListTemplate from "./templates/countdown-list.json";

const rawTemplates: unknown[] = [rankingVideosTemplate, scoreboardsTemplate, countdownListTemplate];

export const templates: TemplateDefinition[] = rawTemplates.map((template) => migrateTemplateDefinition(template));

export function getTemplateById(templateId: string): TemplateDefinition | undefined {
  return templates.find((template) => template.id === templateId);
}

export function listTemplateMetadata(): Array<
  Pick<TemplateDefinition, "id" | "name" | "category" | "aspectRatio" | "defaultDurationMs">
> {
  return templates.map(({ id, name, category, aspectRatio, defaultDurationMs }) => ({
    id,
    name,
    category,
    aspectRatio,
    defaultDurationMs
  }));
}
