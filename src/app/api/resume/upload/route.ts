import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/db/prisma';
import fs from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Check user authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Make sure user is a job seeker
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { jobSeekerProfile: true },
    });

    if (user?.role !== 'JOBSEEKER') {
      return NextResponse.json({ 
        success: false, 
        error: 'Only job seekers can upload resumes' 
      }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    // Validate file
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 });
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        success: false, 
        error: 'File size exceeds limit (5MB)' 
      }, { status: 400 });
    }

    // Check file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ 
        success: false, 
        error: 'Only PDF files are supported' 
      }, { status: 400 });
    }

    // Create directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'resumes');
    if (!fs.existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const uniqueId = uuidv4();
    const fileName = `${user.id}_${uniqueId}.pdf`;
    const filePath = path.join(uploadDir, fileName);
    const relativePath = path.join('public', 'uploads', 'resumes', fileName);

    // Convert file to buffer and save to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Get or create JobSeekerProfile
    let jobSeekerProfile = user.jobSeekerProfile;
    
    if (!jobSeekerProfile) {
      jobSeekerProfile = await prisma.jobSeekerProfile.create({
        data: {
          userId: user.id,
          bio: '',
        },
      });
    }

    // Update JobSeekerProfile with the resume URL
    jobSeekerProfile = await prisma.jobSeekerProfile.update({
      where: { id: jobSeekerProfile.id },
      data: { resumeUrl: relativePath },
    });

    // Create or update ParsedResume
    let parsedResume = await prisma.parsedResume.findUnique({
      where: { jobSeekerProfileId: jobSeekerProfile.id },
    });

    if (parsedResume) {
      // Update existing resume
      parsedResume = await prisma.parsedResume.update({
        where: { id: parsedResume.id },
        data: {
          // Clear the text so it will be re-parsed on next analysis
          rawText: '',
          lastUpdated: new Date(),
        },
      });
    } else {
      // Create new resume entry
      parsedResume = await prisma.parsedResume.create({
        data: {
          jobSeekerProfileId: jobSeekerProfile.id,
          rawText: '',
          lastUpdated: new Date(),
        },
      });
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      message: 'Resume uploaded successfully',
      resumeUrl: relativePath,
      resumeId: parsedResume.id,
      profileId: jobSeekerProfile.id
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload resume',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
} 