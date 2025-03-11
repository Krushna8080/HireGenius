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
  description: string;
}> {
  // In a real application, you would use NLP to extract this information
  // For now, we'll return a simple default
  
  // Check if there's an experience section
  const experienceSection = text.match(/experience:?(.*?)(?:education|skills|references|$)/ism);
  
  if (!experienceSection) {
    return [];
  }
  
  // Try to extract information from the experience section
  const experienceText = experienceSection[1];
  
  // Very basic extraction - in production, this would be much more sophisticated
  const experiences = [];
  
  // Look for job titles and companies
  const jobMatches = experienceText.match(/([A-Z][a-z]+ [A-Za-z]+) at ([A-Za-z]+ [A-Za-z]+) \(([0-9]{4})-([0-9]{4}|present)\)/gi);
  
  if (jobMatches) {
    for (const match of jobMatches) {
      const parts = match.match(/([A-Za-z]+ [A-Za-z]+) at ([A-Za-z]+ [A-Za-z]+) \(([0-9]{4})-([0-9]{4}|present)\)/i);
      
      if (parts) {
        const [_, title, company, startYear, endYear] = parts;
        const endDate = endYear.toLowerCase() === 'present' ? null : `${endYear}-01-01`;
        
        experiences.push({
          title,
          company,
          date: `${startYear} - ${endYear}`,
          startDate: `${startYear}-01-01`,
          endDate,
          description: 'Worked on various projects and initiatives.'
        });
      }
    }
  }
  
  return experiences.length > 0 ? experiences : [
    {
      title: 'Software Developer',
      company: 'Tech Company',
      date: '2020 - Present',
      startDate: '2020-01-01',
      endDate: null,
      description: 'Developing and maintaining web applications.'
    }
  ];
}

/**
 * Extract education information from resume text
 * @param text Resume text content
 * @returns Array of education objects
 */
export function extractEducation(text: string): Array<{
  degree: string;
  institution: string;
  date: string;
  startDate: string;
  endDate: string | null;
  field: string;
}> {
  // In a real application, you would use NLP to extract this information
  // For now, we'll return a simple default
  
  // Check if there's an education section
  const educationSection = text.match(/education:?(.*?)(?:experience|skills|references|$)/ism);
  
  if (!educationSection) {
    return [];
  }
  
  // Try to extract degree information
  const degreeMatch = educationSection[1].match(/([A-Za-z]+ of [A-Za-z]+) in ([A-Za-z ]+), ([A-Za-z ]+) \(([0-9]{4})-([0-9]{4})\)/i);
  
  if (degreeMatch) {
    const [_, degree, field, institution, startYear, endYear] = degreeMatch;
    
    return [{
      degree,
      institution,
      field,
      date: `${startYear} - ${endYear}`,
      startDate: `${startYear}-01-01`,
      endDate: `${endYear}-01-01`
    }];
  }
  
  // Default education if extraction fails
  return [{
    degree: 'Bachelor of Science',
    institution: 'University',
    field: 'Computer Science',
    date: '2014 - 2018',
    startDate: '2014-09-01',
    endDate: '2018-05-31'
  }];
}

/**
 * Extract summary from resume text
 * @param text Resume text content
 * @returns Summary text
 */
export function extractSummary(text: string): string {
  // In a real application, we would use more sophisticated methods
  // For now, just take the first paragraph as summary
  const firstParagraph = text.split('\n\n')[0];
  
  if (firstParagraph.length > 50) {
    return firstParagraph;
  }
  
  // Default summary if extraction fails
  return 'Experienced professional with a strong background in technology and problem-solving.';
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
  
  // Add some general suggestions
  suggestions.push('Tailor your resume for each job application to improve your match score.');
  suggestions.push('Use action verbs to describe your responsibilities and achievements.');
  suggestions.push('Keep your resume concise and focused on relevant information.');
  
  return suggestions;
}

/**
 * Calculate a resume score based on completeness and content
 * @param data Resume data with skills, experience, etc.
 * @returns Score from 0-100
 */
export function calculateResumeScore(data: any): number {
  let score = 0;
  
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
      
      // If Gemini fails, fall back to basic analysis
      const basicAnalysisResult = {
        success: true,
        contactInfo: {
          name: extractName(resumeText) || 'Unknown',
          email: extractEmail(resumeText) || '',
          phone: extractPhone(resumeText) || '',
          linkedin: '',
          website: '',
          location: '',
        },
        summary: extractSummary(resumeText) || 'No summary available',
        skills: extractSkills(resumeText) || [],
        experience: extractExperience(resumeText) || [],
        education: extractEducation(resumeText) || [],
        suggestions: generateSuggestions(resumeText) || [],
        score: calculateResumeScore(resumeText) || 0,
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

// Helper functions for extraction

/**
 * Extract email from text
 */
function extractEmail(text: string): string {
  const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
  return emailMatch ? emailMatch[0] : '';
}

/**
 * Extract phone from text
 */
function extractPhone(text: string): string {
  const phoneMatch = text.match(/(\+\d{1,3}[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}/);
  return phoneMatch ? phoneMatch[0] : '';
}

/**
 * Extract name from text
 */
function extractName(text: string): string {
  // Try to extract name from the first line of the resume
  const firstLine = text.trim().split('\n')[0];
  if (firstLine && firstLine.length < 40) {
    return firstLine;
  }
  return '';
}

/**
 * Extract summary from text
 */
function extractSummary(text: string): string {
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
 * Extract skills from resume text
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
 * Extract experience information from resume text
 */
export function extractExperience(text: string): any[] {
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
          dates: '2020 - Present',
          description: ['Worked on various projects and initiatives.']
        });
      }
    }
  }
  
  return jobs;
}

/**
 * Extract education information from resume text
 */
export function extractEducation(text: string): any[] {
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
  const degrees = [];
  
  // Look for Bachelor, Master, etc.
  const degreeMatches = eduText.match(/(Bachelor|Master|PhD|BS|MS|BA|MBA)(?: of| in) ([A-Za-z ]+)/gi);
  
  if (degreeMatches) {
    for (const match of degreeMatches) {
      const parts = match.split(/(?: of| in) /);
      if (parts.length >= 2) {
        degrees.push({
          degree: parts[0],
          institution: 'University',
          dates: '2014 - 2018'
        });
      }
    }
  }
  
  return degrees;
}

/**
 * Generate suggestions for resume improvement
 */
export function generateSuggestions(data: any): string[] {
  return [
    'Add measurable achievements with concrete metrics',
    'Include relevant certifications or professional development',
    'Tailor your resume for each job application',
    'Use action verbs at the beginning of bullet points',
    'Ensure your contact information is up-to-date and professional'
  ];
}

/**
 * Calculate a resume score based on completeness and content
 */
export function calculateResumeScore(text: string): number {
  let score = 50; // Start with a base score
  
  // Adjust based on text length and content
  if (text.length > 2000) score += 10;
  if (text.length > 4000) score += 5;
  
  // Check for keywords that suggest a good resume
  if (/achievements|accomplishments|improved|increased|reduced|managed|led|created|designed|developed/i.test(text)) {
    score += 10;
  }
  
  // Check for quantifiable results
  if (/\d+%|\$\d+|\d+ people|\d+ team/i.test(text)) {
    score += 10;
  }
  
  // Check for education details
  if (/bachelor|master|phd|mba|degree|university|college/i.test(text)) {
    score += 5;
  }
  
  // Cap at 100
  return Math.min(score, 100);
} 