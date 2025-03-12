import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/db/prisma';
import { readFile } from 'fs/promises';
import { join } from 'path';
import fs from 'fs';
import { PdfReader } from '@/lib/utils/pdf-reader';
import { analyzeResume } from '@/lib/resume/analyzer';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    let resumeId = searchParams.get('resumeId');
    
    if (!resumeId) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { jobSeekerProfile: true },
      });
      
      if (!user?.jobSeekerProfile) {
        return NextResponse.json({ 
          success: false, 
          error: 'No profile or resume found' 
        }, { status: 404 });
      }
      
      resumeId = user.jobSeekerProfile.id;
    }
    
    console.log(`[Resume Analysis] Starting analysis for resumeId: ${resumeId}`);
    
    // Ensure resumeId is not null at this point
    const resumeAnalysis = await getResumeAnalysis(resumeId as string);
    
    if (!resumeAnalysis) {
      console.error(`[Resume Analysis] Failed to get analysis result for resumeId: ${resumeId}`);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to process resume data',
        details: 'Analysis returned null or undefined result'
      }, { status: 500 });
    }
    
    console.log(`[Resume Analysis] Successfully completed analysis for resumeId: ${resumeId}`);
    return NextResponse.json(resumeAnalysis);
  } catch (error) {
    console.error('[Resume Analysis] Error in resume analysis endpoint:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process resume data',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

async function getResumeAnalysis(resumeId: string) {
  try {
    console.log(`Getting resume analysis for ID: ${resumeId}`);
    
    // First check if this is a JobSeekerProfile ID
    const jobSeekerProfile = await prisma.jobSeekerProfile.findUnique({
      where: { id: resumeId },
      include: {
        parsedResume: true,
        skills: true,
        user: true,
      },
    });

    // If we found a JobSeekerProfile, use its parsedResume
    if (jobSeekerProfile) {
      console.log('Found JobSeekerProfile:', jobSeekerProfile.id);
      
      if (!jobSeekerProfile.parsedResume) {
        console.log('No parsed resume found, creating one');
        
        // Create a new parsed resume
        const newParsedResume = await prisma.parsedResume.create({
          data: {
            jobSeekerProfileId: jobSeekerProfile.id,
            rawText: '',
            lastUpdated: new Date(),
          },
        });
        
        // Update the job seeker profile with the new parsed resume
        await prisma.jobSeekerProfile.update({
          where: { id: jobSeekerProfile.id },
          data: {
            parsedResume: {
              connect: { id: newParsedResume.id }
            }
          },
        });
        
        // Retry with the updated profile
        return await processResumeForProfile(jobSeekerProfile, newParsedResume);
      }
      
      return await formatResumeResponse(
        jobSeekerProfile.parsedResume, 
        jobSeekerProfile.skills,
        jobSeekerProfile,
      );
    }

    // If not found by JobSeekerProfile ID, try to find the ParsedResume directly
    console.log('Trying to find ParsedResume directly');
    const parsedResume = await prisma.parsedResume.findUnique({
      where: { id: resumeId },
    });

    if (!parsedResume) {
      console.error('No resume found with ID:', resumeId);
      return null;
    }

    // Find the JobSeekerProfile associated with this ParsedResume to get skills
    const profileWithResume = await prisma.jobSeekerProfile.findFirst({
      where: { 
        parsedResume: {
          id: parsedResume.id
        }
      },
      include: { 
        skills: true,
        user: true,
      },
    });

    if (!profileWithResume) {
      console.error('No job seeker profile found for ParsedResume:', parsedResume.id);
      return createFallbackResponse({ user: { email: '' } });
    }

    return await formatResumeResponse(parsedResume, profileWithResume.skills, profileWithResume);
  } catch (error) {
    console.error('Error in getResumeAnalysis:', error);
    return null;
  }
}

// Combined and improved formatResumeResponse function
async function formatResumeResponse(parsedResume: any, skills: any[], jobSeekerProfile: any) {
  try {
    if (!parsedResume) {
      console.error('[Resume Analysis] Resume data not found');
      return null;
    }
    
    console.log(`[Resume Analysis] Formatting resume response for resume ID: ${parsedResume.id}`);
    
    // Check if we need to extract text from the PDF
    let resumeText = parsedResume.rawText;
    if (!resumeText) {
      console.log('[Resume Analysis] No raw text found, extracting from PDF');
      
      if (!jobSeekerProfile?.resumeUrl) {
        console.error('[Resume Analysis] No resume URL available in job seeker profile');
        return createFallbackResponse(jobSeekerProfile);
      }
      
      try {
        // Try multiple possible file paths
        const possiblePaths = [
          join(process.cwd(), jobSeekerProfile.resumeUrl),
          join(process.cwd(), 'public', jobSeekerProfile.resumeUrl.replace('public/', '')),
          jobSeekerProfile.resumeUrl,
        ];
        
        console.log('[Resume Analysis] Trying these possible file paths:', possiblePaths);
        
        let fileBuffer = null;
        let usedPath = '';
        
        // Try each path until we find one that exists
        for (const path of possiblePaths) {
          console.log(`[Resume Analysis] Checking if file exists at: ${path}`);
          
          if (fs.existsSync(path)) {
            console.log(`[Resume Analysis] Found file at: ${path}`);
            try {
              fileBuffer = await readFile(path);
              usedPath = path;
              console.log(`[Resume Analysis] Successfully read file, size: ${fileBuffer.length} bytes`);
              break;
            } catch (readError) {
              console.error(`[Resume Analysis] Error reading file at ${path}:`, readError);
            }
          } else {
            console.log(`[Resume Analysis] File not found at: ${path}`);
          }
        }
        
        if (!fileBuffer) {
          console.error('[Resume Analysis] Could not find or read file at any of the possible paths');
          resumeText = "Could not read resume file. Please try uploading again.";
        } else {
          console.log(`[Resume Analysis] Successfully read file from: ${usedPath}`);
          
          // Extract text from the PDF using our simplified PdfReader
          const pdfReader = new PdfReader();
          console.log('[Resume Analysis] Attempting to extract text from PDF');
          resumeText = await pdfReader.extractText(fileBuffer);
          console.log(`[Resume Analysis] Text extraction complete, extracted ${resumeText.length} characters`);
        }
        
        // Update the parsedResume with the extracted text
        console.log('[Resume Analysis] Updating parsedResume with extracted text');
        await prisma.parsedResume.update({
          where: { id: parsedResume.id },
          data: { 
            rawText: resumeText,
            lastUpdated: new Date()
          },
        });
        
        parsedResume.rawText = resumeText;
        console.log('[Resume Analysis] Updated parsedResume.rawText');
      } catch (error) {
        console.error('[Resume Analysis] Error handling PDF:', error);
        return createFallbackResponse(jobSeekerProfile);
      }
    }
    
    // Analyze the resume text using our analyzer utility
    console.log('[Resume Analysis] Analyzing resume text');
    
    let analysis;
    try {
      analysis = await analyzeResume(parsedResume.rawText);
      console.log('[Resume Analysis] Resume analysis complete');
    } catch (analysisError) {
      console.error('[Resume Analysis] Error analyzing resume:', analysisError);
      return createFallbackResponse(jobSeekerProfile);
    }
    
    // Get skill names from the database skills
    const skillNames = skills.map(skill => skill.name);
    
    // If the analysis extracted skills that aren't in the DB, we'll use them too
    const combinedSkills = [...new Set([...skillNames, ...analysis.skills])];
    
    // Store new skills in the database
    try {
      await updateSkills(jobSeekerProfile.id, combinedSkills);
    } catch (skillsError) {
      console.error('Error updating skills:', skillsError);
      // Continue even if skills update fails
    }
    
    // Format experience and education data if available from analysis
    const experience = analysis.experience || [];
    const education = analysis.education || [];
    
    // Create the formatted response
    const formattedData = {
      contactInfo: analysis.contactInfo || {
        email: jobSeekerProfile.user?.email || '',
        phone: '',
        name: '',
      },
      summary: analysis.summary || 'No summary available',
      skills: combinedSkills,
      experience: experience,
      education: education,
      suggestions: analysis.suggestions || [
        'Add a clear professional summary', 
        'Include specific achievements', 
        'List relevant skills'
      ],
      score: analysis.score || 0,
      success: true
    };
    
    return formattedData;
  } catch (error) {
    console.error('Error in formatResumeResponse:', error);
    return createFallbackResponse(jobSeekerProfile);
  }
}

// Helper function to update skills in the database
async function updateSkills(profileId: string, skills: string[]) {
  try {
    // First, disconnect all existing skills
    await prisma.jobSeekerProfile.update({
      where: { id: profileId },
      data: {
        skills: {
          set: [],
        },
      },
    });
    
    // Then, add or connect each skill
    for (const skillName of skills) {
      if (!skillName) continue;
      
      // First try to find the skill by name
      let skill = await prisma.skill.findFirst({
        where: { name: skillName }
      });

      // If skill doesn't exist, create it
      if (!skill) {
        skill = await prisma.skill.create({
          data: { name: skillName }
        });
      }
      
      // Connect the skill to the profile
      await prisma.jobSeekerProfile.update({
        where: { id: profileId },
        data: {
          skills: {
            connect: { id: skill.id },
          },
        },
      });
    }
  } catch (error) {
    console.error('Error updating skills:', error);
  }
}

// Process a resume for a profile with proper error handling
async function processResumeForProfile(profile: any, parsedResume: any) {
  try {
    if (!profile.resumeUrl) {
      console.error('No resume URL found for profile:', profile.id);
      return createFallbackResponse(profile);
    }
    
    return await formatResumeResponse(parsedResume, profile.skills || [], profile);
  } catch (error) {
    console.error('Error processing resume for profile:', error);
    return createFallbackResponse(profile);
  }
}

/**
 * Create a fallback response when resume processing fails
 */
function createFallbackResponse(profile: any) {
  console.log('Creating fallback response');
  return {
    success: true,
    contactInfo: { 
      email: profile.user?.email || '',
      phone: '',
      name: ''
    },
    summary: 'Resume could not be processed. Please try uploading again.',
    skills: [],
    experience: [],
    education: [],
    suggestions: [
      'Please upload your resume again',
      'Make sure the file is a valid PDF',
      'Ensure your resume has clear sections for experience, education, and skills'
    ],
    score: 0,
    isFallback: true
  };
} 