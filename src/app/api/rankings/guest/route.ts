import { NextResponse } from 'next/server'
import { calculateRanking, RankingResult } from '../../../../lib/rankings'
import { Gender } from '../../../../generated/prisma/client'

type GuestEntry = {
  lift_id: number;
  estimated_1rm: number;
  reps: number;
  muscle_group: string;
  lift_name: string;
  date: Date;
};

type GuestRequestBody = {
  bodyweight: number;
  unit: 'POUNDS' | 'KILOGRAMS';
  gender: 'MALE' | 'FEMALE';
  entries: GuestEntry[];
};

// POST /api/rankings/guest
export async function POST(request: Request) {
  try {
    const body: GuestRequestBody = await request.json();
    
    const { bodyweight, unit, gender, entries } = body;
    
    if (!bodyweight || !unit || !gender || !entries) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Convert bodyweight to kg
    const bodyweightKg = unit === 'POUNDS' ? bodyweight * 0.453592 : bodyweight;
    
    // Get the latest entry for each muscle group (same logic as calculateAllRankings)
    const latestEntriesPerMuscle = new Map<string, GuestEntry>();
    for (const entry of entries) {
      const existing = latestEntriesPerMuscle.get(entry.muscle_group);
      if (!existing || new Date(entry.date) > new Date(existing.date)) {
        latestEntriesPerMuscle.set(entry.muscle_group, entry);
      }
    }
    
    // Calculate rankings for each muscle group
    const rankings: Record<string, RankingResult> = {};
    
    for (const [muscleGroup, entry] of latestEntriesPerMuscle) {
      const ranking = await calculateRanking(
        entry.lift_id,
        entry.estimated_1rm,
        bodyweightKg,
        gender as Gender,
        entry.reps
      );
      
      rankings[muscleGroup] = ranking;
    }
    
    return NextResponse.json(rankings);
  } catch (error) {
    console.error('Error calculating guest rankings:', error);
    return NextResponse.json({ error: 'Failed to calculate rankings' }, { status: 500 });
  }
}
