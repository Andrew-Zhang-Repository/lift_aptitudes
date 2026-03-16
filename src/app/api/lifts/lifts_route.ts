
import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'
import { createServerClient } from '../../../lib/supabase-server'
import { one_rep_max } from '../../../lib/rep-max'

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const entries = await prisma.userLiftEntries.findMany({
    where: { user_id: user.id },
    include: { lift: true }
  })
  
  return NextResponse.json(entries)
}


export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const body = await request.json()
  const { lift_id, weight, reps } = body
  
  if (!lift_id || weight === undefined || !reps) {
    return NextResponse.json({ error: 'Missing required fields: lift_id, weight, reps' }, { status: 400 })
  }
  
  const estimated_1rm = one_rep_max(weight, reps)
  
  const entry = await prisma.userLiftEntries.create({
    data: {
      user_id: user.id,
      lift_id,
      weight,
      reps,
      estimated_1rm
    }
  })
  
  return NextResponse.json(entry, { status: 201 })
}


export async function PUT(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (!id) {
    return NextResponse.json({ error: 'Missing entry id' }, { status: 400 })
  }
  
  const entry = await prisma.userLiftEntries.findUnique({ where: { id: parseInt(id) } })
  
  if (!entry || entry.user_id !== user.id) {
    return NextResponse.json({ error: 'Entry not found or unauthorized' }, { status: 404 })
  }
  
  const body = await request.json()
  const { weight, reps } = body
  
  const estimated_1rm = one_rep_max(weight ?? entry.weight, reps ?? entry.reps)
  
  const updated = await prisma.userLiftEntries.update({
    where: { id: parseInt(id) },
    data: {
      weight: weight ?? entry.weight,
      reps: reps ?? entry.reps,
      estimated_1rm
    }
  })
  
  return NextResponse.json(updated)
}


export async function DELETE(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (!id) {
    return NextResponse.json({ error: 'Missing entry id' }, { status: 400 })
  }
  
  const entry = await prisma.userLiftEntries.findUnique({ where: { id: parseInt(id) } })
  
  if (!entry || entry.user_id !== user.id) {
    return NextResponse.json({ error: 'Entry not found or unauthorized' }, { status: 404 })
  }
  
  await prisma.userLiftEntries.delete({ where: { id: parseInt(id) } })
  
  return new NextResponse(null, { status: 204 })
}