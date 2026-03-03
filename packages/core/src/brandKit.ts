import type { BrandKit, BrandVariantSubstitution, Project } from "./types";

const DEFAULT_BRAND_KIT: BrandKit = {
  label: "Default Brand",
  primaryColor: "#0EA5E9",
  secondaryColor: "#1E293B",
  accentColor: "#F97316",
  typography: {
    fontFamily: "Inter",
    headingFontFamily: "Inter",
    fallbackFontFamily: "sans-serif",
  },
};

export function createDefaultBrandKit(overrides: Partial<BrandKit> = {}): BrandKit {
  return {
    ...DEFAULT_BRAND_KIT,
    ...overrides,
    typography: {
      ...DEFAULT_BRAND_KIT.typography,
      ...(overrides.typography ?? {}),
    },
  };
}

export function withProjectBrandKitDefaults(project: Project, overrides: Partial<BrandKit> = {}): Project {
  const nextProject: Project = JSON.parse(JSON.stringify(project));
  nextProject.metadata = nextProject.metadata ?? {};
  nextProject.metadata.brandKit = createDefaultBrandKit({
    ...(nextProject.metadata.brandKit ?? {}),
    ...overrides,
  });
  return nextProject;
}

function replaceTokensInString(value: string, substitutions: Record<string, string>): string {
  let next = value;
  for (const [key, replacement] of Object.entries(substitutions)) {
    next = next.split(`{{${key}}}`).join(replacement);
    next = next.split(key).join(replacement);
  }
  return next;
}

function applySubstitutions(value: unknown, substitutions: Record<string, string>): unknown {
  if (typeof value === "string") {
    return replaceTokensInString(value, substitutions);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => applySubstitutions(entry, substitutions));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const next: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    next[key] = applySubstitutions(entry, substitutions);
  }

  return next;
}

export function generateVariants(baseProject: Project, substitutions: BrandVariantSubstitution[]): Project[] {
  return substitutions.map((variant, index) => {
    const cloned: Project = JSON.parse(JSON.stringify(baseProject));
    const variantProject = applySubstitutions(cloned, variant.substitutions) as Project;

    variantProject.id = `${baseProject.id}--${variant.variantId}`;
    variantProject.name = variant.name ?? `${baseProject.name} (${variant.variantId})`;
    variantProject.metadata = variantProject.metadata ?? {};
    variantProject.metadata.brandKit = createDefaultBrandKit({
      ...(variantProject.metadata.brandKit ?? {}),
      ...(variant.brandKit ?? {}),
    });
    const existingVariants = Array.isArray(variantProject.metadata.variants) ? variantProject.metadata.variants : [];
    variantProject.metadata.variants = [
      ...existingVariants,
      {
        variantId: variant.variantId,
        name: variant.name,
        substitutions: variant.substitutions,
      },
    ];
    variantProject.updatedAt = new Date(Date.now() + index).toISOString();

    return variantProject;
  });
}
