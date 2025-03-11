import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Schema for job posting validation
const jobPostingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  company: z.string().min(2, 'Company name is required'),
  location: z.string().optional(),
  type: z.string(),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  requirements: z.string().optional(),
  salary: z.string().optional(),
  skills: z.array(z.string()).optional(),
});

// GET all job postings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    const recruiterOnly = searchParams.get('recruiter_only') === 'true';
    
    // Check if it's a recruiter-only request
    if (recruiterOnly) {
      const session = await getServerSession(authOptions);
      
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      if (session.user.role !== 'RECRUITER') {
        return NextResponse.json({ error: 'Only recruiters can access this data' }, { status: 403 });
      }
      
      // Get the recruiter profile
      const recruiterProfile = await prisma.recruiterProfile.findUnique({
        where: { userId: session.user.id },
      });
      
      if (!recruiterProfile) {
        return NextResponse.json({ error: 'Recruiter profile not found' }, { status: 404 });
      }
      
      // Get job postings for this recruiter
      const jobPostings = await prisma.jobPosting.findMany({
        where: {
          recruiterProfileId: recruiterProfile.id,
        },
        include: {
          requiredSkills: true,
          applications: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      // Format the response
      const jobs = jobPostings.map(job => ({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        createdAt: job.createdAt,
        status: job.isActive ? 'active' : 'inactive',
        applicantCount: job.applications.length,
        type: job.type,
        salary: job.salary,
        skills: job.requiredSkills,
      }));
      
      return NextResponse.json({ jobs });
    }
    
    // Base query for regular job listings
    const whereClause: any = {
      isActive: true,
    };
    
    // Add search filter if provided
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Get active job postings with recruiter info
    const jobPostings = await prisma.jobPosting.findMany({
      where: whereClause,
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
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });
    
    // Get total count for pagination
    const total = await prisma.jobPosting.count({
      where: whereClause,
    });
    
    return NextResponse.json({
      jobs: jobPostings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching job postings:', error);
    return NextResponse.json({ error: 'Failed to fetch job postings' }, { status: 500 });
  }
}

// POST - create a new job posting
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify user is a recruiter
    if (session.user.role !== 'RECRUITER') {
      return NextResponse.json({ error: 'Only recruiters can create job postings' }, { status: 403 });
    }
    
    // Get recruiter profile
    const recruiterProfile = await prisma.recruiterProfile.findUnique({
      where: { userId: session.user.id },
    });
    
    if (!recruiterProfile) {
      return NextResponse.json({ error: 'Recruiter profile not found' }, { status: 404 });
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate job posting data
    const result = jobPostingSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 });
    }
    
    const jobData = result.data;
    
    // Create the job posting
    const jobPosting = await prisma.jobPosting.create({
      data: {
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        type: jobData.type,
        description: jobData.description,
        requirements: jobData.requirements,
        salary: jobData.salary,
        recruiterProfileId: recruiterProfile.id,
      },
    });
    
    // Add skills if provided
    if (jobData.skills && jobData.skills.length > 0) {
      for (const skillName of jobData.skills) {
        // Find or create skill
        const skill = await prisma.skill.upsert({
          where: { name: skillName },
          update: {},
          create: { name: skillName },
        });
        
        // Connect skill to job posting
        await prisma.jobPosting.update({
          where: { id: jobPosting.id },
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
      jobId: jobPosting.id,
      message: 'Job posting created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating job posting:', error);
    return NextResponse.json({ error: 'Failed to create job posting' }, { status: 500 });
  }
} 