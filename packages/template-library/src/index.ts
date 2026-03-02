import type { TemplateDefinition } from "@onscreen/core";

export const templates: TemplateDefinition[] = [
  {
    id: "ranking-top-10",
    name: "Top 10 Rankings",
    category: "rankings",
    aspectRatio: "9:16",
    trackBlueprints: [
      { name: "Base Video", type: "video" },
      { name: "Graphics", type: "overlay" }
    ],
    defaultOverlays: [],
    placeholders: {
      title: "Top 10 Players",
      accentColor: "#ff3366"
    }
  },
  {
    id: "match-scoreboard",
    name: "Match Scoreboard",
    category: "scoreboards",
    aspectRatio: "16:9",
    trackBlueprints: [
      { name: "Background", type: "video" },
      { name: "Score Overlay", type: "overlay" }
    ],
    defaultOverlays: [],
    placeholders: {
      homeTeam: "Home",
      awayTeam: "Away"
    }
  },
  {
    id: "listicle-facts",
    name: "Listicle Facts",
    category: "listicles",
    aspectRatio: "1:1",
    trackBlueprints: [
      { name: "Media", type: "video" },
      { name: "Captions", type: "overlay" }
    ],
    defaultOverlays: [],
    placeholders: {
      headline: "5 Facts You Didn't Know"
    }
  }
];
