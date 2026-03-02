import type { TemplateDefinition } from "@onscreen/core";
import rankingVideosTemplate from "./templates/ranking-videos.json";
import scoreboardsTemplate from "./templates/scoreboards.json";
import countdownListTemplate from "./templates/countdown-list.json";

export const templates: TemplateDefinition[] = [
  rankingVideosTemplate as TemplateDefinition,
  scoreboardsTemplate as TemplateDefinition,
  countdownListTemplate as TemplateDefinition
];

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
