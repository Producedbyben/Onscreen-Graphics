import type { TemplateDefinition } from "@onscreen/core";
import { migrateTemplateDefinition } from "./migrations";
import captionCtaHybridTemplate from "./templates/caption-cta-hybrid.json";
import captionExplainerContrastTemplate from "./templates/caption-explainer-contrast.json";
import captionExplainerSlateTemplate from "./templates/caption-explainer-slate.json";
import captionHookMinimalTemplate from "./templates/caption-hook-minimal.json";
import captionHookPunchyTemplate from "./templates/caption-hook-punchy.json";
import captionKaraokeBoldTemplate from "./templates/caption-karaoke-bold.json";
import captionKaraokeNeonTemplate from "./templates/caption-karaoke-neon.json";
import captionNewsBreakingTemplate from "./templates/caption-news-breaking.json";
import captionNewsLowerThirdTemplate from "./templates/caption-news-lower-third.json";
import captionStoryCleanTemplate from "./templates/caption-story-clean.json";
import captionStoryPopTemplate from "./templates/caption-story-pop.json";
import countdownListTemplate from "./templates/countdown-list.json";
import ctaDownloadAppTemplate from "./templates/cta-download-app.json";
import ctaFollowNowTemplate from "./templates/cta-follow-now.json";
import ctaLinkInBioTemplate from "./templates/cta-link-in-bio.json";
import ctaSubscribeFastTemplate from "./templates/cta-subscribe-fast.json";
import hookFastFactsTemplate from "./templates/hook-fast-facts.json";
import hookQuestionTeaseTemplate from "./templates/hook-question-tease.json";
import hookSplitRevealTemplate from "./templates/hook-split-reveal.json";
import lowerThirdInterviewCleanTemplate from "./templates/lower-third-interview-clean.json";
import lowerThirdOpinionCardTemplate from "./templates/lower-third-opinion-card.json";
import lowerThirdSportsTickerTemplate from "./templates/lower-third-sports-ticker.json";
import productBeforeAfterTemplate from "./templates/product-before-after.json";
import productDemoSplitTemplate from "./templates/product-demo-split.json";
import productFeatureStackTemplate from "./templates/product-feature-stack.json";
import productPricingFlashTemplate from "./templates/product-pricing-flash.json";
import rankingVideosTemplate from "./templates/ranking-videos.json";
import scoreboardsTemplate from "./templates/scoreboards.json";

const rawTemplates: unknown[] = [
  captionCtaHybridTemplate,
  captionExplainerContrastTemplate,
  captionExplainerSlateTemplate,
  captionHookMinimalTemplate,
  captionHookPunchyTemplate,
  captionKaraokeBoldTemplate,
  captionKaraokeNeonTemplate,
  captionNewsBreakingTemplate,
  captionNewsLowerThirdTemplate,
  captionStoryCleanTemplate,
  captionStoryPopTemplate,
  countdownListTemplate,
  ctaDownloadAppTemplate,
  ctaFollowNowTemplate,
  ctaLinkInBioTemplate,
  ctaSubscribeFastTemplate,
  hookFastFactsTemplate,
  hookQuestionTeaseTemplate,
  hookSplitRevealTemplate,
  lowerThirdInterviewCleanTemplate,
  lowerThirdOpinionCardTemplate,
  lowerThirdSportsTickerTemplate,
  productBeforeAfterTemplate,
  productDemoSplitTemplate,
  productFeatureStackTemplate,
  productPricingFlashTemplate,
  rankingVideosTemplate,
  scoreboardsTemplate
];

export const templates: TemplateDefinition[] = rawTemplates.map((template) => migrateTemplateDefinition(template));

export function getTemplateById(templateId: string): TemplateDefinition | undefined {
  return templates.find((template) => template.id === templateId);
}

export function listTemplateMetadata(): Array<
  Pick<TemplateDefinition, "id" | "name" | "category" | "aspectRatio" | "defaultDurationMs"> & {
    recommendationSignals?: TemplateDefinition["recommendationSignals"];
  }
> {
  return templates.map(({ id, name, category, aspectRatio, defaultDurationMs, recommendationSignals }) => ({
    id,
    name,
    category,
    aspectRatio,
    defaultDurationMs,
    recommendationSignals
  }));
}

export interface TemplateRecommendationInput {
  aspectRatio?: string;
  projectType?: string;
  desiredCategories?: string[];
  hasCaptions?: boolean;
  needsCTA?: boolean;
}

export function getRecommendedTemplate(projectMetadata: TemplateRecommendationInput = {}): TemplateDefinition {
  const scored = templates.map((template) => {
    const weights = template.recommendationSignals?.confidenceWeights ?? {};
    const normalizedTags = (template.recommendationSignals?.projectTypeTags ?? []).map((tag) => tag.toLowerCase());
    const normalizedSignals = (template.recommendationSignals?.categorySignals ?? []).map((signal) => signal.toLowerCase());
    const normalizedDesiredCategories = (projectMetadata.desiredCategories ?? []).map((category) => category.toLowerCase());

    let score = 0;

    if (projectMetadata.projectType && normalizedTags.includes(projectMetadata.projectType.toLowerCase())) {
      score += weights.projectType ?? 0.45;
    }

    if (projectMetadata.aspectRatio && template.aspectRatio === projectMetadata.aspectRatio) {
      score += weights.aspectRatio ?? 0.2;
    }

    if (projectMetadata.hasCaptions && normalizedSignals.includes("captions")) {
      score += weights.captions ?? 0.2;
    }

    if (projectMetadata.needsCTA && normalizedSignals.includes("cta")) {
      score += weights.cta ?? 0.2;
    }

    if (normalizedDesiredCategories.some((category) => normalizedSignals.includes(category))) {
      score += 0.25;
    }

    return { template, score };
  });

  scored.sort((left, right) => right.score - left.score || left.template.id.localeCompare(right.template.id));
  return scored[0]?.template ?? templates[0];
}
