import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Schema for application validation
const applicationSchema = z.object({
  jobPostingId: z.string(),
  coverLetter: z.string().optional(),
});

// Define some TypeScript interfaces based on our Prisma schema
interface JobPostingWithId {
  id: string;
  [key: string]: any;
}

interface SkillWithName {
  name: string;
  [key: string]: any;
}

interface Experience {
  startDate: string | Date;
  endDate: string | Date | null;
  [key: string]: any;
}

// GET applications for the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    const status = searchParams.get('status');
    const jobPostingId = searchParams.get('jobPostingId');
    
    // Base query
    let whereClause: any = {};
    
    // Add job posting filter if provided
    if (jobPostingId) {
      whereClause.jobPostingId = jobPostingId;
    }
    
    // Different queries based on user role
    if (session.user.role === 'JOBSEEKER') {
      // Get the job seeker profile
      const jobSeekerProfile = await prisma.jobSeekerProfile.findUnique({
        where: { userId: session.user.id },
      });
      
      if (!jobSeekerProfile) {
        return NextResponse.json({ error: 'Job seeker profile not found' }, { status: 404 });
      }
      
      whereClause.jobSeekerProfileId = jobSeekerProfile.id;
      
      // Add status filter if provided
      if (status) {
        whereClause.status = status;
      }
      
      // Get applications for the job seeker
      const applications = await prisma.application.findMany({
        where: whereClause,
        include: {
          jobPosting: true,
        },
        orderBy: {
          appliedAt: 'desc',
        },
        skip,
        take: limit,
      });
      
      // Get total count for pagination
      const total = await prisma.application.count({
        where: whereClause,
      });
      
      return NextResponse.json({
        applications,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } else if (session.user.role === 'RECRUITER') {
      // Get the recruiter profile
      const recruiterProfile = await prisma.recruiterProfile.findUnique({
        where: { userId: session.user.id },
      });
      
      if (!recruiterProfile) {
        return NextResponse.json({ error: 'Recruiter profile not found' }, { status: 404 });
      }
      
      // If jobPostingId is provided, verify it belongs to this recruiter
      if (jobPostingId) {
        const jobPosting = await prisma.jobPosting.findFirst({
          where: {
            id: jobPostingId,
            recruiterProfileId: recruiterProfile.id,
          },
        });
        
        if (!jobPosting) {
          return NextResponse.json({ error: 'Job posting not found or not yours' }, { status: 403 });
        }
      } else {
        // If no jobPostingId specified, get all job postings by this recruiter
        const jobPostings = await prisma.jobPosting.findMany({
          where: {
            recruiterProfileId: recruiterProfile.id,
          },
          select: {
            id: true,
          },
        });
        
        const jobPostingIds = jobPostings.map((job: JobPostingWithId) => job.id);
        
        whereClause.jobPostingId = {
          in: jobPostingIds,
        };
      }
      
      // Add status filter if provided
      if (status) {
        whereClause.status = status;
      }
      
      // Get applications for all jobs posted by the recruiter
      const applications = await prisma.application.findMany({
        where: whereClause,
        include: {
          jobPosting: true,
          jobSeekerProfile: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
              skills: true,
            },
          },
        },
        orderBy: {
          appliedAt: 'desc',
        },
        skip,
        take: limit,
      });
      
      // Get total count for pagination
      const total = await prisma.application.count({
        where: whereClause,
      });
      
      return NextResponse.json({
        applications,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } else {
      return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

// POST - create a new job application
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify user is a job seeker
    if (session.user.role !== 'JOBSEEKER') {
      return NextResponse.json({ error: 'Only job seekers can apply for jobs' }, { status: 403 });
    }
    
    // Get the job seeker profile
    const jobSeekerProfile = await prisma.jobSeekerProfile.findUnique({
      where: { userId: session.user.id },
    });
    
    if (!jobSeekerProfile) {
      return NextResponse.json({ error: 'Job seeker profile not found' }, { status: 404 });
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate application data
    const result = applicationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 });
    }
    
    const applicationData = result.data;
    
    // Check if the job posting exists
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: applicationData.jobPostingId },
    });
    
    if (!jobPosting) {
      return NextResponse.json({ error: 'Job posting not found' }, { status: 404 });
    }
    
    // Check if an application already exists
    const existingApplication = await prisma.application.findFirst({
      where: {
        jobPostingId: applicationData.jobPostingId,
        jobSeekerProfileId: jobSeekerProfile.id,
      },
    });
    
    if (existingApplication) {
      return NextResponse.json({ error: 'You have already applied for this job' }, { status: 400 });
    }
    
    // Calculate match score between job and candidate
    const matchScore = await calculateMatchScore(jobSeekerProfile.id, applicationData.jobPostingId);
    
    // Create the application
    const application = await prisma.application.create({
      data: {
        jobPostingId: applicationData.jobPostingId,
        jobSeekerProfileId: jobSeekerProfile.id,
        status: 'Applied',
        coverLetter: applicationData.coverLetter,
        matchScore,
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      applicationId: application.id,
      message: 'Application submitted successfully',
      matchScore,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating job application:', error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}

// Calculate match score between job and candidate
async function calculateMatchScore(jobSeekerProfileId: string, jobPostingId: string): Promise<number> {
  try {
    // Get job seeker profile with skills
    const jobSeekerProfile = await prisma.jobSeekerProfile.findUnique({
      where: { id: jobSeekerProfileId },
      include: {
        skills: true,
        experiences: true,
        educations: true,
      },
    });
    
    // Get job posting with required skills
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
      include: {
        requiredSkills: true,
      },
    });
    
    if (!jobSeekerProfile || !jobPosting) {
      return 0;
    }
    
    let score = 50; // Base score
    
    // Match skills
    const candidateSkills = jobSeekerProfile.skills.map((skill: SkillWithName) => skill.name.toLowerCase());
    const requiredSkills = jobPosting.requiredSkills.map((skill: SkillWithName) => skill.name.toLowerCase());
    
    if (requiredSkills.length > 0) {
      const matchedSkills = candidateSkills.filter((skill: string) => requiredSkills.includes(skill));
      const skillMatchPercentage = (matchedSkills.length / requiredSkills.length) * 100;
      
      // Skills contribute up to 30 points
      score += Math.min(skillMatchPercentage * 0.3, 30);
    } else {
      // If no required skills specified, give some points for having any skills
      score += Math.min(candidateSkills.length * 2, 15);
    }
    
    // Experience contributes up to 15 points
    const experienceYears = jobSeekerProfile.experiences.reduce((total: number, exp: Experience) => {
      const startDate = new Date(exp.startDate);
      const endDate = exp.endDate ? new Date(exp.endDate) : new Date();
      const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      return total + years;
    }, 0);
    
    score += Math.min(experienceYears * 3, 15);
    
    // Education contributes up to 5 points
    if (jobSeekerProfile.educations.length > 0) {
      score += 5;
    }
    
    return Math.min(Math.round(score), 100);
  } catch (error) {
    console.error('Error calculating match score:', error);
    return 50; // Default score on error
  }
} 