import { ExperienceLevel } from "../generated/prisma/client";
import { Gender, WeightUnit } from "../generated/prisma/client";

export type RankingResult = {
    tier: ExperienceLevel | "UNTRAINED";
    percentile: number;
    color: string;
};


export type MuscleGroupRanking = {
    [muscleGroup: string]: RankingResult;
};


export type LiftEntryInput = {
    lift_id: number;
    weight: number;
    reps: number;
};


export type UserProfileInput = {
    display_name: string;
    gender: Gender;
    bodyweight: number;
    bodyweight_unit: WeightUnit;
    experience_level: ExperienceLevel;
};
