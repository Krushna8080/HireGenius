import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET all skills
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Base query
    const whereClause: any = {};
    
    // Add search filter if provided
    if (search) {
      whereClause.name = {
        contains: search,
        mode: 'insensitive',
      };
    }
    
    // Get skills
    const skills = await prisma.skill.findMany({
      where: whereClause,
      orderBy: {
        name: 'asc',
      },
      take: limit,
    });
    
    return NextResponse.json({ skills });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
  }
}

// POST - create a new skill (used when there's no matching skill)
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json({ error: 'Skill name is required' }, { status: 400 });
    }
    
    // Check if skill already exists
    const existingSkill = await prisma.skill.findFirst({
      where: {
        name: {
          equals: body.name,
          mode: 'insensitive',
        },
      },
    });
    
    if (existingSkill) {
      return NextResponse.json({ skill: existingSkill });
    }
    
    // Create new skill
    const skill = await prisma.skill.create({
      data: {
        name: body.name,
      },
    });
    
    return NextResponse.json({ skill }, { status: 201 });
  } catch (error) {
    console.error('Error creating skill:', error);
    return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
  }
} 