import { NextResponse } from 'next/server'
import { createServerClient } from '../../../lib/supabase-server'
import { calculateAllRankings, RankingResult } from '../../../lib/rankings'
// GET /api/rankings
export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const rankings = await calculateAllRankings(user.id)
  
  // Convert Map to plain object
  const result: Record<string, RankingResult> = {}
  for (const [key, value] of rankings) {
    result[key] = value
  }
  
  return NextResponse.json(result)
}