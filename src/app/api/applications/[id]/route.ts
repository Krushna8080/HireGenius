import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET a specific application
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const applicationId = params.id;
    
    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }
    
    // Fetch the application with related data
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        jobPosting: {
          include: {
            recruiterProfile: {
              include: {
                user: true,
              },
            },
            requiredSkills: true,
          },
        },
        jobSeekerProfile: {
          include: {
            user: true,
            skills: true,
            parsedResume: true
          },
        },
      },
    });
    
    if (!application) {
      return NextResponse.json({ 
        error: 'Application not found',
        message: 'The requested application could not be found.' 
      }, { status: 404 });
    }
    
    // Check permissions
    const isRecruiter = session.user.role === 'RECRUITER';
    const isJobSeeker = session.user.role === 'JOBSEEKER';
    
    // Verify the application data is complete
    if (!application.jobPosting || 
        !application.jobPosting.recruiterProfile || 
        !application.jobPosting.recruiterProfile.user ||
        !application.jobSeekerProfile ||
        !application.jobSeekerProfile.user) {
      console.error('Incomplete application data:', applicationId);
      return NextResponse.json({ 
        error: 'Application data is incomplete',
        message: 'The application details are incomplete. This may be due to database inconsistencies.'
      }, { status: 500 });
    }
    
    // Only allow access if user is either the recruiter or the job seeker
    const isAuthorized = 
      (isRecruiter && application.jobPosting.recruiterProfile.user.email === session.user.email) ||
      (isJobSeeker && application.jobSeekerProfile.user.email === session.user.email);
    
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Transform the response to handle nulls more gracefully
    const responseData = {
      application: {
        ...application,
        // Ensure we always have required skills array even if null
        jobPosting: {
          ...application.jobPosting,
          requiredSkills: application.jobPosting.requiredSkills || []
        },
        // Ensure we handle null parsedResume gracefully
        jobSeekerProfile: {
          ...application.jobSeekerProfile,
          resumeData: application.jobSeekerProfile.parsedResume || {
            id: '',
            fullName: application.jobSeekerProfile.user.name,
            email: application.jobSeekerProfile.user.email,
            phone: null,
            education: null,
            experience: null,
            skills: [], // This will be populated later
            rawText: null
          },
          // Keep a reference to the actual skills for the frontend
          skills: application.jobSeekerProfile.skills || []
        }
      }
    };
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch application',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}

// Update application status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const applicationId = params.id;
    const body = await request.json();
    
    // Validate input
    if (!body.status || !['PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'SELECTED_FOR_INTERVIEW'].includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }
    
    // Get the application to check permissions
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        jobPosting: {
          include: {
            recruiterProfile: {
              include: {
                user: true,
              },
            },
          },
        },
        jobSeekerProfile: {
          include: {
            user: true,
          },
        },
      },
    });
    
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    
    // Check permissions
    const isRecruiter = session.user.role === 'RECRUITER';
    const isJobSeeker = session.user.role === 'JOBSEEKER';
    
    // Recruiters can change to APPROVED, REJECTED, or SELECTED_FOR_INTERVIEW
    // Job seekers can only change to WITHDRAWN
    if (
      (isRecruiter && 
       application.jobPosting.recruiterProfile.user.email === session.user.email &&
       ['APPROVED', 'REJECTED', 'SELECTED_FOR_INTERVIEW'].includes(body.status)) ||
      (isJobSeeker && 
       application.jobSeekerProfile.user.email === session.user.email &&
       body.status === 'WITHDRAWN')
    ) {
      // Update the application
      const updatedApplication = await prisma.application.update({
        where: { id: applicationId },
        data: { status: body.status },
      });
      
      return NextResponse.json({ application: updatedApplication });
    } else {
      return NextResponse.json({ error: 'Unauthorized action' }, { status: 403 });
    }
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}

// Delete application
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const applicationId = params.id;
    
    // Get the application to check permissions
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        jobPosting: {
          include: {
            recruiterProfile: {
              include: {
                user: true,
              },
            },
          },
        },
        jobSeekerProfile: {
          include: {
            user: true,
          },
        },
      },
    });
    
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    
    // Check permissions - only job seekers can delete their own applications
    const isJobSeeker = session.user.role === 'JOBSEEKER';
    
    if (isJobSeeker && application.jobSeekerProfile.user.email === session.user.email) {
      // Delete the application
      await prisma.application.delete({
        where: { id: applicationId },
      });
      
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Unauthorized action' }, { status: 403 });
    }
  } catch (error) {
    console.error('Error deleting application:', error);
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
  }
} 