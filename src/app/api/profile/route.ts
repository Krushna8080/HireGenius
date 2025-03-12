import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';

// GET user profile data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get profile data based on role
    let profile;
    let resumeData = null;
    
    if (session.user.role === 'RECRUITER') {
      profile = await prisma.recruiterProfile.findUnique({
        where: { userId: user.id },
      });
    } else if (session.user.role === 'JOBSEEKER') {
      profile = await prisma.jobSeekerProfile.findUnique({
        where: { userId: user.id },
        include: {
          skills: true,
          experiences: true,
          educations: true,
        }
      });
      
      // If job seeker, also fetch parsed resume data
      if (profile) {
        const parsedResume = await prisma.parsedResume.findUnique({
          where: { jobSeekerProfileId: profile.id },
        });
        
        if (parsedResume) {
          resumeData = parsedResume;
        }
      }
    }
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    // Return user profile data
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      profile,
      resumeData,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Update user in the database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: body.name,
      },
    });
    
    // Update profile data based on role
    if (session.user.role === 'RECRUITER') {
      // Get or create the recruiter profile
      let recruiterProfile = await prisma.recruiterProfile.findUnique({
        where: { userId: user.id },
      });
      
      if (!recruiterProfile) {
        // If profile doesn't exist, create it
        recruiterProfile = await prisma.recruiterProfile.create({
          data: {
            userId: user.id,
            company: body.company || '',
          },
        });
      }
      
      // Update the recruiter profile
      await prisma.recruiterProfile.update({
        where: { id: recruiterProfile.id },
        data: {
          company: body.company || null,
          position: body.title || null,
          bio: body.bio || null,
        },
      });
    } else if (session.user.role === 'JOBSEEKER') {
      // Get or create the job seeker profile
      let jobSeekerProfile = await prisma.jobSeekerProfile.findUnique({
        where: { userId: user.id },
      });
      
      if (!jobSeekerProfile) {
        // If profile doesn't exist, create it
        jobSeekerProfile = await prisma.jobSeekerProfile.create({
          data: {
            userId: user.id,
            title: body.title || '',
          },
        });
      }
      
      // Update the job seeker profile
      await prisma.jobSeekerProfile.update({
        where: { id: jobSeekerProfile.id },
        data: {
          title: body.title || null,
          bio: body.bio || null,
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: body.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
} 