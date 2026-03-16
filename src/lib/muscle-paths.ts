// Muscle mapping for FalseStory SVG diagrams
// SVG files are in public/images/body-front.svg and public/images/body-back.svg

// Mapping of our DB muscle names to FalseStory SVG IDs
export const MUSCLE_MAPPING: Record<string, { front?: string; back?: string }> = {
  Chest: { front: 'pectorals' },
  Back: { back: 'trapezoidback' },
  Quads: { front: 'quadriceps' },
  Glutes: { back: 'gluteus' },
  Shoulders: { front: 'deltoids', back: 'backdeltoids' },
  Biceps: { front: 'biceps' },
  Triceps: { back: 'triceps' },
  Hamstrings: { back: 'hamstrings' },
};

// Get color for ranking tier
export const TIER_COLORS: Record<string, string> = {
  UNTRAINED: "#9CA3AF",
  BEGINNER: "#EF4444",
  NOVICE: "#F59E0B",
  INTERMEDIATE: "#22C55E",
  ADVANCED: "#8B5CF6",
  ELITE: "#EAB308",
};

// Get color for a muscle based on ranking
export function getMuscleColor(muscleName: string, rankings: Record<string, { tier: string; percentile: number; color: string }>): string {
  const ranking = rankings[muscleName];
  if (!ranking) return "#E5E7EB"; // Default gray if no ranking
  
  return ranking.color || TIER_COLORS[ranking.tier] || "#E5E7EB";
}

// Get the SVG element IDs for a muscle (can be in both front and back)
export function getMuscleIds(muscleName: string): string[] {
  const mapping = MUSCLE_MAPPING[muscleName];
  if (!mapping) return [];
  
  const ids: string[] = [];
  if (mapping.front) ids.push(mapping.front);
  if (mapping.back) ids.push(mapping.back);
  return ids;
}
