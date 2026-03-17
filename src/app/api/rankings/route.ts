import { NextResponse } from 'next/server'
import { createServerClient } from '../../../lib/supabase-server'
import { calculateAllRankings, saveRankingsToCache, RankingResult } from '../../../lib/rankings'
import prisma from '../../../lib/prisma'

// GET /api/rankings
export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Try to read from cache first
  const cachedRankings = await prisma.userRankings.findMany({
    where: { user_id: user.id }
  });
  
  let result: Record<string, RankingResult>;
  
  if (cachedRankings.length > 0) {
    // Use cached rankings
    result = {};
    for (const r of cachedRankings) {
      result[r.muscle_group] = {
        tier: r.tier as RankingResult['tier'],
        percentile: r.percentile,
        color: r.color
      };
    }
  } else {
    // Calculate fresh and save to cache
    const rankings = await calculateAllRankings(user.id);
    await saveRankingsToCache(user.id);
    
    // Convert Map to plain object
    result = {};
    for (const [key, value] of rankings) {
      result[key] = value;
    }
  }
  
  return NextResponse.json(result)
}