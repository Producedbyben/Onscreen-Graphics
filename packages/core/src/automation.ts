import type { Clip, OverlayElement, Project } from "./types";

export interface DuplicateWithReplacementsOperation {
  type: "duplicate-with-replacements";
  clipId: string;
  replacements: Record<string, string>;
  duplicateCount?: number;
}

export interface BulkStyleApplyOperation {
  type: "bulk-style-apply";
  overlayKind?: OverlayElement["kind"];
  stylePatch: Record<string, string | number | boolean>;
}

export type AutomationOperation = DuplicateWithReplacementsOperation | BulkStyleApplyOperation;

export interface AutomationBatchResult {
  project: Project;
  appliedOperations: Array<{ type: AutomationOperation["type"]; details: string }>;
}

function cloneProject(project: Project): Project {
  return JSON.parse(JSON.stringify(project));
}

function applyStringReplacements(input: string, replacements: Record<string, string>): string {
  return Object.entries(replacements)
    .sort(([left], [right]) => left.localeCompare(right))
    .reduce((value, [search, replace]) => value.split(search).join(replace), input);
}

function duplicateClipWithReplacements(project: Project, operation: DuplicateWithReplacementsOperation): { applied: boolean; detail: string } {
  const duplicateCount = Math.max(1, Number(operation.duplicateCount ?? 1));

  for (const track of project.tracks) {
    const sourceIndex = track.clips.findIndex((clip) => clip.id === operation.clipId);
    if (sourceIndex === -1) {
      continue;
    }

    const sourceClip = track.clips[sourceIndex];
    const duplicates: Clip[] = [];

    for (let copyIndex = 0; copyIndex < duplicateCount; copyIndex += 1) {
      const duplicateId = `${sourceClip.id}-dup-${copyIndex + 1}`;
      const duplicateClip: Clip = {
        ...JSON.parse(JSON.stringify(sourceClip)),
        id: duplicateId,
        overlays: sourceClip.overlays.map((overlay) => {
          const duplicatedOverlay = JSON.parse(JSON.stringify(overlay));
          duplicatedOverlay.id = `${overlay.id}-dup-${copyIndex + 1}`;
          if (duplicatedOverlay.kind === "text") {
            const maybeText = duplicatedOverlay.style?.text;
            if (typeof maybeText === "string") {
              duplicatedOverlay.style.text = applyStringReplacements(maybeText, operation.replacements);
            }
          }
          return duplicatedOverlay;
        })
      };
      duplicates.push(duplicateClip);
    }

    track.clips.splice(sourceIndex + 1, 0, ...duplicates);
    return { applied: true, detail: `Duplicated clip ${operation.clipId} ${duplicateCount} time(s).` };
  }

  return { applied: false, detail: `Clip ${operation.clipId} not found.` };
}

function applyBulkStyle(project: Project, operation: BulkStyleApplyOperation): { applied: boolean; detail: string } {
  let updated = 0;
  for (const track of project.tracks) {
    for (const clip of track.clips) {
      for (const overlay of clip.overlays) {
        if (operation.overlayKind && overlay.kind !== operation.overlayKind) {
          continue;
        }

        overlay.style = { ...(overlay.style ?? {}), ...operation.stylePatch };
        updated += 1;
      }
    }
  }

  return {
    applied: updated > 0,
    detail: `Applied style patch to ${updated} overlay(s).`
  };
}

export function runAutomationBatch(project: Project, operations: AutomationOperation[]): AutomationBatchResult {
  const workingProject = cloneProject(project);
  const appliedOperations: AutomationBatchResult["appliedOperations"] = [];

  for (const operation of operations) {
    if (operation.type === "duplicate-with-replacements") {
      const result = duplicateClipWithReplacements(workingProject, operation);
      appliedOperations.push({ type: operation.type, details: result.detail });
      continue;
    }

    if (operation.type === "bulk-style-apply") {
      const result = applyBulkStyle(workingProject, operation);
      appliedOperations.push({ type: operation.type, details: result.detail });
    }
  }

  workingProject.updatedAt = new Date().toISOString();
  return { project: workingProject, appliedOperations };
}
