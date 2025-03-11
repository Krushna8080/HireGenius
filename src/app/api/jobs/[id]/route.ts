import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Schema for job posting updates
const jobUpdateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').optional(),
  location: z.string().optional(),
  type: z.string().optional(),
  description: z.string().min(20, 'Description must be at least 20 characters').optional(),
  requirements: z.string().optional(),
  salary: z.string().optional(),
  isActive: z.boolean().optional(),
  skills: z.array(z.string()).optional(),
});

// GET a specific job posting
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Get job posting with related data
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id },
      include: {
        recruiterProfile: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        requiredSkills: true,
        applications: {
          select: {
            id: true,
            status: true,
            appliedAt: true,
          },
        },
      },
    });
    
    if (!jobPosting) {
      return NextResponse.json({ error: 'Job posting not found' }, { status: 404 });
    }
    
    return NextResponse.json(jobPosting);
  } catch (error) {
    console.error('Error fetching job posting:', error);
    return NextResponse.json({ error: 'Failed to fetch job posting' }, { status: 500 });
  }
}

// PATCH - update a job posting
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the job posting
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id },
      include: {
        recruiterProfile: true,
      },
    });
    
    if (!jobPosting) {
      return NextResponse.json({ error: 'Job posting not found' }, { status: 404 });
    }
    
    // Verify ownership - only the recruiter who created the job can update it
    if (jobPosting.recruiterProfile.userId !== session.user.id) {
      return NextResponse.json({ error: 'You do not have permission to update this job posting' }, { status: 403 });
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate update data
    const result = jobUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 });
    }
    
    const updateData = result.data;
    
    // Update job posting
    const updatedJob = await prisma.jobPosting.update({
      where: { id },
      data: {
        ...(updateData.title && { title: updateData.title }),
        ...(updateData.location && { location: updateData.location }),
        ...(updateData.type && { type: updateData.type }),
        ...(updateData.description && { description: updateData.description }),
        ...(updateData.requirements !== undefined && { requirements: updateData.requirements }),
        ...(updateData.salary !== undefined && { salary: updateData.salary }),
        ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
        updatedAt: new Date(),
      },
    });
    
    // Update skills if provided
    if (updateData.skills && updateData.skills.length > 0) {
      // First remove all existing skills
      await prisma.jobPosting.update({
        where: { id },
        data: {
          requiredSkills: {
            set: [],
          },
        },
      });
      
      // Add new skills
      for (const skillName of updateData.skills) {
        // Find or create skill
        const skill = await prisma.skill.upsert({
          where: { name: skillName },
          update: {},
          create: { name: skillName },
        });
        
        // Connect skill to job posting
        await prisma.jobPosting.update({
          where: { id },
          data: {
            requiredSkills: {
              connect: { id: skill.id },
            },
          },
        });
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      job: updatedJob,
      message: 'Job posting updated successfully'
    });
  } catch (error) {
    console.error('Error updating job posting:', error);
    return NextResponse.json({ error: 'Failed to update job posting' }, { status: 500 });
  }
}

// DELETE - remove a job posting
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the job posting
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id },
      include: {
        recruiterProfile: true,
      },
    });
    
    if (!jobPosting) {
      return NextResponse.json({ error: 'Job posting not found' }, { status: 404 });
    }
    
    // Verify ownership - only the recruiter who created the job can delete it
    if (jobPosting.recruiterProfile.userId !== session.user.id) {
      return NextResponse.json({ error: 'You do not have permission to delete this job posting' }, { status: 403 });
    }
    
    // Instead of hard delete, we'll mark it as inactive
    await prisma.jobPosting.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Job posting deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job posting:', error);
    return NextResponse.json({ error: 'Failed to delete job posting' }, { status: 500 });
  }
} 