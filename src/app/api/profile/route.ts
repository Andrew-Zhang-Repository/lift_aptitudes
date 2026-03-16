
import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'
import { createServerClient } from '../../../lib/supabase-server'

export async function GET() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.userProfiles.findUnique({
        where: { user_id: user.id }
    })

    if (!profile) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(profile)
}

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const body = await request.json()
  
  const { gender, display_name, bodyweight, bodyweight_unit, experience_level } = body
  
  if (!gender || !display_name || bodyweight === undefined || !bodyweight_unit || !experience_level) {
    return NextResponse.json({ error: 'Missing required fields: gender, display_name, bodyweight, bodyweight_unit, experience_level' }, { status: 400 })
  }
  
  const existingProfile = await prisma.userProfiles.findUnique({
    where: { user_id: user.id }
  })
  
  if (existingProfile) {
    return NextResponse.json({ error: 'Profile already exists' }, { status: 409 })
  }
  
  
  const profile = await prisma.userProfiles.create({
    data: {
      user_id: user.id,
      gender,
      display_name,
      bodyweight,
      bodyweight_unit,
      experience_level,
    }
  })
  
  return NextResponse.json(profile, { status: 201 })
}

export async function PUT(request: Request) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    const { gender, display_name, bodyweight, bodyweight_unit, experience_level } = body
    
    if (!gender || !display_name || bodyweight === undefined || !bodyweight_unit || !experience_level) {
        return NextResponse.json({ error: 'Missing required fields: gender, display_name, bodyweight, bodyweight_unit, experience_level' }, { status: 400 })
    }

    const existingProfile = await prisma.userProfiles.findUnique({
        where: { user_id: user.id }
    })

    if (!existingProfile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    
    const updatedProfile = await prisma.userProfiles.update({
        where: { user_id: user.id },
        data: {
            gender,
            display_name,
            bodyweight,
            bodyweight_unit,
            experience_level,
        },
    })

    return NextResponse.json(updatedProfile)
}