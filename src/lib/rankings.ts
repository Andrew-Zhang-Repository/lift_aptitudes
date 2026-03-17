import prisma from "./prisma";
import { Gender, ExperienceLevel } from "../generated/prisma/client";

export type RankingResult = {
  tier: ExperienceLevel | "UNTRAINED";
  percentile: number;
  color: string;
};

type TierThresholds = {
  [key in ExperienceLevel]: number;
};

const TIER_ORDER: ExperienceLevel[] = [
  "BEGINNER",
  "NOVICE",
  "INTERMEDIATE",
  "ADVANCED",
  "ELITE",
];

const TIER_PERCENTILE_RANGES: { [key: string]: [number, number] } = {
  UNTRAINED: [0, 20],
  BEGINNER: [20, 40],
  NOVICE: [40, 60],
  INTERMEDIATE: [60, 80],
  ADVANCED: [80, 95],
  ELITE: [95, 100],
};

const TIER_COLORS: { [key: string]: string } = {
  UNTRAINED: "#9CA3AF",
  BEGINNER: "#EF4444",
  NOVICE: "#F59E0B",
  INTERMEDIATE: "#22C55E",
  ADVANCED: "#8B5CF6",
  ELITE: "#EAB308",
};

const BODYWEIGHT_RANGES: { [key in Gender]: { min: number; max: number } } = {
  MALE: { min: 50, max: 140 },
  FEMALE: { min: 40, max: 120 },
};

const BRACKET_STEP = 5;

function clampBodyweight(bodyweight: number, gender: Gender): number {
  const range = BODYWEIGHT_RANGES[gender];
  return Math.max(range.min, Math.min(range.max, bodyweight));
}

function getBrackets(bodyweight: number): { lower: number; upper: number } {
  const lower = Math.floor(bodyweight / BRACKET_STEP) * BRACKET_STEP;
  const upper = Math.ceil(bodyweight / BRACKET_STEP) * BRACKET_STEP;

  if (lower === upper) {
    return { lower, upper: lower + BRACKET_STEP };
  }

  return { lower, upper };
}

function interpolate(
  value: number,
  lowerBracket: number,
  upperBracket: number,
  lowerStandard: number,
  upperStandard: number
): number {
  if (lowerBracket === upperBracket) {
    return lowerStandard;
  }

  const ratio = (value - lowerBracket) / (upperBracket - lowerBracket);
  return lowerStandard + ratio * (upperStandard - lowerStandard);
}

function determineTier(
  oneRM: number,
  thresholds: TierThresholds
): { tier: ExperienceLevel | "UNTRAINED"; nextThreshold: number | null } {
  if (oneRM < thresholds.BEGINNER) {
    return { tier: "UNTRAINED", nextThreshold: thresholds.BEGINNER };
  }

  for (let i = 0; i < TIER_ORDER.length; i++) {
    const currentTier = TIER_ORDER[i];
    const currentThreshold = thresholds[currentTier];
    const nextTier = TIER_ORDER[i + 1];
    const nextThreshold = nextTier ? thresholds[nextTier] : null;

    if (nextThreshold === null || oneRM < nextThreshold) {
      return { tier: currentTier, nextThreshold };
    }
  }

  return { tier: "ELITE", nextThreshold: null };
}

function calculatePercentile(
  oneRM: number,
  tier: ExperienceLevel | "UNTRAINED",
  thresholds: TierThresholds
): number {
  const [percentileStart, percentileEnd] = TIER_PERCENTILE_RANGES[tier];

  if (tier === "ELITE") {
    return percentileStart;
  }

  let currentThreshold: number;
  let nextThreshold: number;

  if (tier === "UNTRAINED") {
    currentThreshold = 0;
    nextThreshold = thresholds.BEGINNER;
  } else {
    const tierIndex = TIER_ORDER.indexOf(tier);
    currentThreshold = thresholds[tier];
    const nextTier = TIER_ORDER[tierIndex + 1];
    nextThreshold = nextTier ? thresholds[nextTier] : thresholds[tier] * 1.2;
  }

  if (nextThreshold === currentThreshold) {
    return percentileStart;
  }

  const position = (oneRM - currentThreshold) / (nextThreshold - currentThreshold);
  return Math.min(percentileEnd, percentileStart + position * (percentileEnd - percentileStart));
}

export async function calculateRanking(
  liftId: number,
  estimated1RM: number,
  bodyweight: number,
  gender: Gender,
  reps?: number
): Promise<RankingResult> {
  const lift = await prisma.lifts.findUnique({
    where: { id: liftId },
  });

  const isBodyweight = lift?.is_bodyweight || false;
  const clampedBodyweight = clampBodyweight(bodyweight, gender);
  const { lower, upper } = getBrackets(clampedBodyweight);

  const standards = await prisma.strengthStandards.findMany({
    where: {
      lift_id: liftId,
      gender: gender,
      bodyweight: { in: [lower, upper] },
    },
  });

  if (standards.length === 0) {
    return {
      tier: "UNTRAINED",
      percentile: 0,
      color: TIER_COLORS.UNTRAINED,
    };
  }

  const lowerStandards = standards.filter((s) => s.bodyweight === lower);
  const upperStandards = standards.filter((s) => s.bodyweight === upper);

  // For bodyweight exercises, compare reps directly instead of 1RM
  if (isBodyweight && reps !== undefined) {
    const userReps = reps;

    // For bodyweight, standards.standard represents reps, not weight
    // Find which tier the user's reps fall into
    let tier: ExperienceLevel | "UNTRAINED" = "UNTRAINED";
    let percentile = 0;

    const tierReps: { tier: ExperienceLevel; reps: number }[] = [];
    for (const tierName of TIER_ORDER) {
      const lowerStd = lowerStandards.find((s) => s.experience_level === tierName);
      const upperStd = upperStandards.find((s) => s.experience_level === tierName);
      
      if (lowerStd || upperStd) {
        const repsValue = (lowerStd?.standard || upperStd?.standard) || 0;
        tierReps.push({ tier: tierName, reps: repsValue });
      }
    }

    // Find which tier the user's reps fall into
    for (let i = 0; i < tierReps.length; i++) {
      const currentTier = tierReps[i];
      const nextTier = tierReps[i + 1];

      if (userReps >= currentTier.reps) {
        tier = currentTier.tier;
        
        // Calculate percentile within this tier
        if (nextTier) {
          const range = nextTier.reps - currentTier.reps;
          if (range > 0) {
            const position = (userReps - currentTier.reps) / range;
            const tierStart = TIER_PERCENTILE_RANGES[currentTier.tier][0];
            const tierEnd = TIER_PERCENTILE_RANGES[currentTier.tier][1];
            percentile = Math.min(tierEnd, tierStart + position * (tierEnd - tierStart));
          } else {
            percentile = TIER_PERCENTILE_RANGES[currentTier.tier][0];
          }
        } else {
          // Highest tier (ELITE)
          percentile = TIER_PERCENTILE_RANGES[currentTier.tier][0];
        }
      }
    }

    // If still untrained, check if above beginner
    if (tier === "UNTRAINED" && tierReps.length > 0) {
      if (userReps >= tierReps[0].reps) {
        tier = tierReps[0].tier;
        percentile = 20;
      }
    }

    return {
      tier,
      percentile: Math.round(percentile),
      color: TIER_COLORS[tier],
    };
  }

  // Original logic for weighted exercises
  const thresholds: TierThresholds = {
    BEGINNER: 0,
    NOVICE: 0,
    INTERMEDIATE: 0,
    ADVANCED: 0,
    ELITE: 0,
  };

  for (const tier of TIER_ORDER) {
    const lowerStandard = lowerStandards.find((s) => s.experience_level === tier);
    const upperStandard = upperStandards.find((s) => s.experience_level === tier);

    if (lowerStandard && upperStandard) {
      thresholds[tier] = interpolate(
        clampedBodyweight,
        lower,
        upper,
        lowerStandard.standard,
        upperStandard.standard
      );
    } else if (lowerStandard) {
      thresholds[tier] = lowerStandard.standard;
    } else if (upperStandard) {
      thresholds[tier] = upperStandard.standard;
    }
  }

  const { tier } = determineTier(estimated1RM, thresholds);
  const percentile = calculatePercentile(estimated1RM, tier, thresholds);

  return {
    tier,
    percentile: Math.round(percentile),
    color: TIER_COLORS[tier],
  };
}

export async function calculateAllRankings(
  userId: string
): Promise<Map<string, RankingResult>> {
  const profile = await prisma.userProfiles.findUnique({
    where: { user_id: userId },
  });

  if (!profile) {
    throw new Error("User profile not found");
  }

  const bodyweightKg =
    profile.bodyweight_unit === "KILOGRAMS"
      ? profile.bodyweight
      : profile.bodyweight * 0.453592;

  const liftEntries = await prisma.userLiftEntries.findMany({
    where: { user_id: userId },
    include: { lift: true },
    orderBy: { date: "desc" },
  });

  const latestEntriesPerLift = new Map<number, (typeof liftEntries)[0]>();
  for (const entry of liftEntries) {
    if (!latestEntriesPerLift.has(entry.lift_id)) {
      latestEntriesPerLift.set(entry.lift_id, entry);
    }
  }

  const results = new Map<string, RankingResult>();

  for (const [, entry] of latestEntriesPerLift) {
    const ranking = await calculateRanking(
      entry.lift_id,
      entry.estimated_1rm,
      bodyweightKg,
      profile.gender,
      entry.reps
    );

    // Only rank the primary muscle group, not secondary muscles
    const primaryGroup = entry.lift.muscle_group;

    const existingPrimary = results.get(primaryGroup);
    if (!existingPrimary || ranking.percentile > existingPrimary.percentile) {
      results.set(primaryGroup, ranking);
    }
  }

  return results;
}

export async function saveRankingsToCache(userId: string): Promise<void> {
  const rankings = await calculateAllRankings(userId);
  
  const data = Array.from(rankings.entries()).map(([muscleGroup, rankingData]) => ({
    user_id: userId,
    muscle_group: muscleGroup,
    tier: rankingData.tier,
    percentile: rankingData.percentile,
    color: rankingData.color,
  }));
  
  await prisma.userRankings.deleteMany({ where: { user_id: userId } });
  await prisma.userRankings.createMany({ data });
}

