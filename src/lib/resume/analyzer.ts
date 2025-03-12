/**
 * Resume Analyzer Utility
 * 
 * This module provides functions to analyze resume text and extract structured information
 */

import { analyzeResumeWithGemini } from '../utils/gemini-api';

// Define the response interface
export interface ResumeAnalysisResponse {
  success: boolean;
  contactInfo: {
    name: string;
    email: string;
    phone: string;
    linkedin?: string;
    website?: string;
    location?: string;
  };
  summary: string;
  skills: string[];
  experience: any[];
  education: any[];
  suggestions: string[];
  score: number;
}

// Define education interface
interface Education {
  degree: string;
  institution: string;
  date: string;
  startDate: string;
  endDate: string | null;
  field: string;
}

/**
 * Extract skills from resume text
 * @param text Resume text content
 * @returns Array of skill names
 */
export function extractSkills(text: string): string[] {
  // Common skills to look for in resumes
  const commonSkills = [
    'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 'Node.js', 'Python',
    'Java', 'C#', 'C++', 'Ruby', 'PHP', 'SQL', 'MongoDB', 'PostgreSQL',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'REST API', 'GraphQL',
    'HTML', 'CSS', 'SASS', 'LESS', 'Bootstrap', 'Tailwind CSS', 'Material UI',
    'Git', 'Agile', 'Scrum', 'Jira', 'Confluence', 'Leadership', 'Communication',
    'Problem Solving', 'Critical Thinking', 'Team Collaboration', 'Project Management'
  ];
  
  // Extract skills by checking for matches in the text
  return commonSkills.filter(skill => 
    new RegExp(`\\b${skill}\\b`, 'i').test(text)
  );
}

/**
 * Extract contact information from resume text
 * @param text Resume text content
 * @returns Contact information object
 */
export function extractContactInfo(text: string): { email: string, phone: string, name: string } {
  const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const phonePattern = /(\+\d{1,3}[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}/g;
  
  // Simple name extraction (very basic - would need improvement in production)
  const namePattern = /^([A-Z][a-z]+ [A-Z][a-z]+)/m;
  
  const emails = text.match(emailPattern) || [];
  const phones = text.match(phonePattern) || [];
  const names = text.match(namePattern) || [];
  
  return {
    email: emails[0] || '',
    phone: phones[0] || '',
    name: names[0] || ''
  };
}

/**
 * Extract experience information from resume text
 * @param text Resume text content
 * @returns Array of experience objects
 */
export function extractExperience(text: string): Array<{
  title: string;
  company: string;
  date: string;
  startDate: string;
  endDate: string | null;
  description: string[];
}> {
  // Try to find the experience section
  const experienceMatch = text.match(/experience:?(.+?)(?:education)/i) ||
                         text.match(/experience:?(.+?)(?:skills)/i) ||
                         text.match(/experience:?(.+?)(?:references)/i) ||
                         text.match(/experience:?(.+?)$/i);

  if (!experienceMatch) {
    return [];
  }

  // Try to extract job titles and companies
  const expText = experienceMatch[1];
  const jobs = [];

  // Very basic extraction - in production, this would be much more sophisticated
  const jobMatches = expText.match(/([A-Z][a-z]+ [A-Za-z]+|Developer|Engineer|Manager|Designer)(?:\s+at\s+|\s*[-–—]\s*)([A-Za-z][\w\s&]+)/g);

  if (jobMatches) {
    for (const match of jobMatches.slice(0, 3)) { // Limit to top 3
      const parts = match.split(/\s+at\s+|\s*[-–—]\s*/);
      if (parts.length >= 2) {
        jobs.push({
          title: parts[0],
          company: parts[1],
          date: '2020 - Present',
          startDate: '2020-01-01',
          endDate: null,
          description: ['Worked on various projects and initiatives.']
        });
      }
    }
  }

  return jobs;
}

/**
 * Extract education information from resume text
 * @param text Resume text content
 * @returns Array of education objects
 */
export function extractEducation(text: string): Education[] {
  // Try to find the education section
  const educationMatch = text.match(/education:?(.+?)(?:experience)/i) ||
                        text.match(/education:?(.+?)(?:skills)/i) ||
                        text.match(/education:?(.+?)(?:references)/i) ||
                        text.match(/education:?(.+?)$/i);

  if (!educationMatch) {
    return [];
  }

  // Try to extract degree information
  const eduText = educationMatch[1];
  const degrees: Education[] = [];

  // Look for Bachelor, Master, etc.
  const degreeMatches = eduText.match(/(Bachelor|Master|PhD|BS|MS|BA|MBA)(?: of| in) ([A-Za-z ]+)/gi);

  if (degreeMatches) {
    for (const match of degreeMatches) {
      const parts = match.split(/(?: of| in) /);
      if (parts.length >= 2) {
        degrees.push({
          degree: parts[0],
          field: parts[1] || 'Not Specified',
          institution: 'University',
          date: '2014 - 2018',
          startDate: '2014-09-01',
          endDate: '2018-05-31'
        });
      }
    }
  }

  return degrees;
}

/**
 * Extract summary from text
 * @param text Resume text content
 * @returns Summary text
 */
export function extractSummary(text: string): string {
  // If there's a professional summary section, extract it
  const summaryMatch = text.match(/professional\s+summary:?\s+(.*?)(?:\n\n)/i) ||
                      text.match(/professional\s+summary:?\s+(.*?)(?:\n\w+:)/i);
  if (summaryMatch && summaryMatch[1]) {
    return summaryMatch[1].trim();
  }

  // Otherwise, take the first paragraph
  const paragraphs = text.split('\n\n');
  for (const para of paragraphs) {
    if (para.length > 50 && para.length < 500) {
      return para;
    }
  }

  return 'Experienced professional with a background in technology.';
}

/**
 * Generate suggestions for resume improvement
 * @param data Resume data with skills, experience, etc.
 * @returns Array of suggestion strings
 */
export function generateSuggestions(data: any): string[] {
  const suggestions = [];

  // Skill-based suggestions
  if (!data.skills || data.skills.length < 5) {
    suggestions.push('Add more specific skills to your resume to improve matching with job requirements.');
  }

  // Experience-based suggestions
  if (!data.experience || data.experience.length < 2) {
    suggestions.push('Add more detailed work experience with descriptions of your responsibilities and achievements.');
  } else {
    suggestions.push('Quantify your achievements with metrics and results to make your experience more impactful.');
  }

  // Education-based suggestions
  if (!data.education || data.education.length === 0) {
    suggestions.push('Include your educational background with degrees, institutions, and graduation dates.');
  }

  // Add general suggestions
  suggestions.push('Add measurable achievements with concrete metrics');
  suggestions.push('Include relevant certifications or professional development');
  suggestions.push('Tailor your resume for each job application');
  suggestions.push('Use action verbs at the beginning of bullet points');
  suggestions.push('Ensure your contact information is up-to-date and professional');

  return suggestions;
}

/**
 * Calculate a resume score based on completeness and content
 * @param data Resume data with skills, experience, etc.
 * @returns Score from 0-100
 */
export function calculateResumeScore(data: any): number {
  let score = 50; // Start with a base score

  // Basic scoring based on completeness
  if (data.contactInfo?.email) score += 5;
  if (data.contactInfo?.phone) score += 5;
  if (data.contactInfo?.name) score += 5;
  if (data.summary) score += 10;

  // Skills scoring
  const skillsLength = Array.isArray(data.skills) ? data.skills.length : 0;
  score += Math.min(skillsLength * 2, 20);

  // Experience scoring (more weight)
  const experienceLength = Array.isArray(data.experience) ? data.experience.length : 0;
  score += Math.min(experienceLength * 10, 30);

  // Education scoring
  const educationLength = Array.isArray(data.education) ? data.education.length : 0;
  score += Math.min(educationLength * 5, 15);

  // Cap the score at 100
  return Math.min(score, 100);
}

/**
 * Analyzes a resume text and extracts structured information
 * @param resumeText The text content of the resume
 * @returns Structured analysis of the resume
 */
export async function analyzeResume(resumeText: string): Promise<ResumeAnalysisResponse> {
  console.log('[Resume Analyzer] Starting resume analysis');

  try {
    if (!resumeText || resumeText.trim().length < 50) {
      console.error('[Resume Analyzer] Resume text is too short or empty:', resumeText);
      return createFallbackResponse('Resume text is too short or empty');
    }

    console.log(`[Resume Analyzer] Analyzing resume text of length: ${resumeText.length} characters`);

    // Try to analyze the resume with Gemini
    try {
      console.log('[Resume Analyzer] Attempting to analyze with Gemini API');
      const analysis = await analyzeResumeWithGemini(resumeText);
      console.log('[Resume Analyzer] Successfully analyzed resume with Gemini API');

      // Format the response
      return {
        success: true,
        contactInfo: {
          name: analysis.contactInfo.name || 'Unknown',
          email: analysis.contactInfo.email || '',
          phone: analysis.contactInfo.phone || '',
          linkedin: analysis.contactInfo.linkedin || '',
          website: analysis.contactInfo.website || '',
          location: analysis.contactInfo.location || '',
        },
        summary: analysis.summary || 'No summary available',
        skills: analysis.skills || [],
        experience: analysis.experience || [],
        education: analysis.education || [],
        suggestions: analysis.suggestions || [],
        score: analysis.score || 0,
      };
    } catch (geminiError) {
      console.error('[Resume Analyzer] Gemini API analysis failed:', geminiError);
      console.log('[Resume Analyzer] Falling back to basic analysis');

      // Extract contact info
      const contactInfo = extractContactInfo(resumeText);

      // If Gemini fails, fall back to basic analysis
      const basicAnalysisResult = {
        success: true,
        contactInfo: {
          name: contactInfo.name || 'Unknown',
          email: contactInfo.email || '',
          phone: contactInfo.phone || '',
          linkedin: '',
          website: '',
          location: '',
        },
        summary: extractSummary(resumeText) || 'No summary available',
        skills: extractSkills(resumeText) || [],
        experience: extractExperience(resumeText) || [],
        education: extractEducation(resumeText) || [],
        suggestions: generateSuggestions({ skills: [], experience: [], education: [] }) || [],
        score: calculateResumeScore({ skills: [], experience: [], education: [] }) || 0,
      };

      console.log('[Resume Analyzer] Basic analysis completed successfully');
      return basicAnalysisResult;
    }
  } catch (error) {
    console.error('[Resume Analyzer] Error analyzing resume:', error);
    return createFallbackResponse('Failed to analyze resume');
  }
}

/**
 * Creates a fallback response when resume analysis fails
 * @param errorMessage The error message to include in the response
 * @returns A structured fallback response
 */
function createFallbackResponse(errorMessage: string): ResumeAnalysisResponse {
  console.log(`[Resume Analyzer] Creating fallback response with error: ${errorMessage}`);

  return {
    success: false,
    contactInfo: {
      name: 'Unknown',
      email: '',
      phone: '',
      linkedin: '',
      website: '',
      location: '',
    },
    summary: `We couldn't properly analyze your resume. Error: ${errorMessage}`,
    skills: [],
    experience: [],
    education: [],
    suggestions: [
      'Please try re-uploading your resume',
      'Ensure your resume is in PDF format',
      'Make sure your resume has clear sections for experience, education, and skills',
      'Check that your PDF is not password protected or corrupted'
    ],
    score: 0,
  };
} 