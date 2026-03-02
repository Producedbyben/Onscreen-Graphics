import type { Project } from "@onscreen/core";

export interface RenderRequest {
  project: Project;
  outputPath: string;
  codec?: "h264" | "prores" | string;
}

export function renderProject(request: RenderRequest): string {
  const { project, outputPath } = request;
  return `Rendering project ${project.id} to ${outputPath}`;
}
