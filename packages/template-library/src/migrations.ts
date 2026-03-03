import type { TemplateDefinition } from "@onscreen/core";

export const CURRENT_TEMPLATE_SCHEMA_VERSION = 1 as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function validateEditableField(field: unknown, templateId: string, fieldIndex: number): void {
  if (!isRecord(field)) {
    throw new Error(`Template \"${templateId}\" has a non-object editable field at index ${fieldIndex}.`);
  }

  const fieldId = typeof field.id === "string" ? field.id : `index-${fieldIndex}`;

  if (field.maxChars !== undefined && (!Number.isInteger(field.maxChars) || Number(field.maxChars) <= 0)) {
    throw new Error(`Template \"${templateId}\" field \"${fieldId}\" has invalid maxChars (must be a positive integer).`);
  }

  if (field.allowedStyles !== undefined) {
    if (!Array.isArray(field.allowedStyles) || field.allowedStyles.some((style) => typeof style !== "string" || style.trim().length === 0)) {
      throw new Error(`Template \"${templateId}\" field \"${fieldId}\" has invalid allowedStyles (must be an array of non-empty strings).`);
    }
  }

  if (field.positionPreset !== undefined && (typeof field.positionPreset !== "string" || field.positionPreset.trim().length === 0)) {
    throw new Error(`Template \"${templateId}\" field \"${fieldId}\" has invalid positionPreset (must be a non-empty string).`);
  }
}

export function validateTemplateDefinition(template: unknown): asserts template is TemplateDefinition {
  if (!isRecord(template)) {
    throw new Error("Template payload must be an object.");
  }

  const templateId = typeof template.id === "string" ? template.id : "unknown-template";

  if (template.schemaVersion !== CURRENT_TEMPLATE_SCHEMA_VERSION) {
    throw new Error(
      `Template \"${templateId}\" is schema version ${String(template.schemaVersion)} but expected ${CURRENT_TEMPLATE_SCHEMA_VERSION}.`
    );
  }

  if (!Array.isArray(template.editableFields)) {
    throw new Error(`Template \"${templateId}\" is missing editableFields array.`);
  }

  template.editableFields.forEach((field, index) => validateEditableField(field, templateId, index));
}

export function migrateTemplateDefinition(payload: unknown): TemplateDefinition {
  if (!isRecord(payload)) {
    throw new Error("Template payload must be an object.");
  }

  const migrated: Record<string, unknown> = { ...payload };
  let version = typeof migrated.schemaVersion === "number" ? migrated.schemaVersion : 0;

  if (version < 1) {
    migrated.schemaVersion = 1;
    if (Array.isArray(migrated.editableFields)) {
      migrated.editableFields = migrated.editableFields.map((field) => {
        if (!isRecord(field)) {
          return field;
        }

        const updatedField: Record<string, unknown> = { ...field };

        if (updatedField.maxChars !== undefined && typeof updatedField.maxChars === "string") {
          const parsed = Number.parseInt(updatedField.maxChars, 10);
          updatedField.maxChars = Number.isInteger(parsed) ? parsed : updatedField.maxChars;
        }

        return updatedField;
      });
    }

    version = 1;
  }

  // Future migration scaffold:
  // if (version < 2) {
  //   // ...apply v2 migration here
  //   version = 2;
  // }

  migrated.schemaVersion = version;
  validateTemplateDefinition(migrated);
  return migrated as TemplateDefinition;
}
