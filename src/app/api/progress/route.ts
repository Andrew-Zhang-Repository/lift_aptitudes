import { NextResponse } from 'next/server'
import { createServerClient } from '../../../lib/supabase-server'
import prisma from '../../../lib/prisma'

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const history = await prisma.userMuscleHistory.findMany({
    where: { user_id: user.id },
    orderBy: { date: 'desc' },
  });
  
  return NextResponse.json(history)
}
