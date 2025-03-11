import axios from 'axios';

// Don't hardcode API keys in the code - use environment variables
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface ResumeAnalysisResult {
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
  experience: {
    company: string;
    title: string;
    dates: string;
    description: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    dates: string;
  }[];
  suggestions: string[];
  score: number;
}

/**
 * Analyzes a resume text using Google's Gemini API
 * @param resumeText The text content of the resume
 * @returns Structured analysis of the resume
 */
export async function analyzeResumeWithGemini(resumeText: string): Promise<ResumeAnalysisResult> {
  console.log('[Gemini API] Starting resume analysis with Gemini');
  
  // Check if resume text is too short or empty
  if (!resumeText || resumeText.length < 50) {
    console.error('[Gemini API] Resume text is too short or empty:', resumeText);
    throw new Error('Resume text is too short or empty');
  }
  
  // Truncate resume text if it's too long (Gemini has token limits)
  const maxLength = 15000;
  const truncatedText = resumeText.length > maxLength 
    ? resumeText.substring(0, maxLength) + '...(truncated)'
    : resumeText;
  
  console.log(`[Gemini API] Resume text length: ${resumeText.length} characters, truncated to ${truncatedText.length} characters`);
  
  // Prepare the API request
  // Use hardcoded key as fallback if environment variable isn't set
  const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyA5QeKgC0xGAu6fABBwPmPHa_K00X39AuY';
  
  const url = GEMINI_API_URL;
  
  // Create the prompt for Gemini
  const prompt = `
  You are a professional resume analyzer. Analyze the following resume and extract structured information.
  
  Resume:
  ${truncatedText}
  
  Please extract and return the following information in JSON format:
  
  1. Contact Information: Name, email, phone, LinkedIn, website, location
  2. Summary: A brief professional summary
  3. Skills: A list of technical and soft skills mentioned
  4. Experience: List of work experiences with company, title, dates, and bullet points
  5. Education: List of education with institution, degree, dates
  6. Suggestions: Provide 3-5 specific suggestions to improve the resume
  7. Score: A score from 0-100 rating the overall quality of the resume
  
  Return ONLY valid JSON with these fields: contactInfo, summary, skills, experience, education, suggestions, score.
  `;
  
  // Prepare the request body
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    }
  };
  
  // Make the API request with retries
  return await makeRequestWithRetries(url, apiKey, requestBody);
}

/**
 * Makes a request to the Gemini API with retry logic
 */
async function makeRequestWithRetries(
  url: string, 
  apiKey: string, 
  requestBody: any, 
  maxRetries = 3
): Promise<ResumeAnalysisResult> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Gemini API] Attempt ${attempt}/${maxRetries} to call Gemini API`);
      
      const response = await fetch(`${url}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Gemini API] HTTP error ${response.status}: ${errorText}`);
        throw new Error(`HTTP error ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[Gemini API] Successfully received response from Gemini API');
      
      // Check if the response has the expected structure
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('[Gemini API] Unexpected response structure:', JSON.stringify(data));
        throw new Error('Unexpected response structure from Gemini API');
      }
      
      const content = data.candidates[0].content;
      
      if (!content.parts || !content.parts[0] || !content.parts[0].text) {
        console.error('[Gemini API] Missing text in response:', JSON.stringify(content));
        throw new Error('Missing text in Gemini API response');
      }
      
      const responseText = content.parts[0].text;
      console.log('[Gemini API] Received text response, length:', responseText.length);
      
      // Extract JSON from the response
      try {
        // Find JSON in the response (it might be wrapped in markdown code blocks)
        // Using simpler regex patterns for compatibility
        let jsonText = responseText;
        
        // Try to extract JSON from code blocks
        if (responseText.includes('```json')) {
          const startIndex = responseText.indexOf('```json') + 7;
          const endIndex = responseText.indexOf('```', startIndex);
          if (endIndex > startIndex) {
            jsonText = responseText.substring(startIndex, endIndex).trim();
          }
        } else if (responseText.includes('```')) {
          const startIndex = responseText.indexOf('```') + 3;
          const endIndex = responseText.indexOf('```', startIndex);
          if (endIndex > startIndex) {
            jsonText = responseText.substring(startIndex, endIndex).trim();
          }
        }
        
        console.log('[Gemini API] Extracted JSON text, length:', jsonText.length);
        
        // Parse the JSON
        const parsedResult = JSON.parse(jsonText);
        console.log('[Gemini API] Successfully parsed JSON response');
        
        // Validate the result has the expected structure
        const validationResult = validateAnalysisResult(parsedResult);
        return validationResult;
      } catch (parseError) {
        console.error('[Gemini API] Error parsing JSON from response:', parseError);
        console.error('[Gemini API] Raw response text:', responseText);
        throw new Error('Failed to parse JSON from Gemini API response');
      }
    } catch (error) {
      lastError = error as Error;
      console.error(`[Gemini API] Attempt ${attempt} failed:`, error);
      
      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`[Gemini API] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If we've exhausted all retries, throw the last error
  console.error('[Gemini API] All retry attempts failed');
  throw lastError || new Error('Failed to get response from Gemini API after multiple attempts');
}

/**
 * Validates and normalizes the analysis result
 */
function validateAnalysisResult(result: any): ResumeAnalysisResult {
  console.log('[Gemini API] Validating analysis result');
  
  // Create a normalized result with default values
  const normalizedResult: ResumeAnalysisResult = {
    contactInfo: {
      name: result.contactInfo?.name || 'Unknown',
      email: result.contactInfo?.email || '',
      phone: result.contactInfo?.phone || '',
      linkedin: result.contactInfo?.linkedin || '',
      website: result.contactInfo?.website || '',
      location: result.contactInfo?.location || '',
    },
    summary: result.summary || 'No summary available',
    skills: Array.isArray(result.skills) ? result.skills : [],
    experience: Array.isArray(result.experience) ? result.experience.map((exp: any) => ({
      company: exp.company || 'Unknown Company',
      title: exp.title || 'Unknown Title',
      dates: exp.dates || '',
      description: Array.isArray(exp.description) ? exp.description : 
                  (typeof exp.description === 'string' ? [exp.description] : [])
    })) : [],
    education: Array.isArray(result.education) ? result.education.map((edu: any) => ({
      institution: edu.institution || 'Unknown Institution',
      degree: edu.degree || '',
      dates: edu.dates || '',
    })) : [],
    suggestions: Array.isArray(result.suggestions) ? result.suggestions : 
                (typeof result.suggestions === 'string' ? [result.suggestions] : []),
    score: typeof result.score === 'number' ? result.score : 
          (typeof result.score === 'string' ? parseInt(result.score, 10) || 0 : 0)
  };
  
  console.log('[Gemini API] Analysis result validation complete');
  return normalizedResult;
}

// Helper function to generate fallback analysis
function generateFallbackAnalysis(text: string): ResumeAnalysisResult {
  return {
    contactInfo: {
      email: extractEmail(text),
      phone: extractPhone(text),
      name: extractName(text)
    },
    summary: extractSummary(text),
    skills: extractSkills(text),
    experience: extractExperience(text),
    education: extractEducation(text),
    suggestions: generateSuggestions(),
    score: calculateScore(text)
  };
}

// Helper functions for extracting information

// Extracts an email from the text
function extractEmail(text: string): string {
  const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
  return emailMatch ? emailMatch[0] : '';
}

// Extracts a phone number from the text
function extractPhone(text: string): string {
  const phoneMatch = text.match(/(\+\d{1,3}[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}/);
  return phoneMatch ? phoneMatch[0] : '';
}

// Extracts a name from the text
function extractName(text: string): string {
  // Try to extract name from the first line of the resume
  const firstLine = text.trim().split('\n')[0];
  if (firstLine && firstLine.length < 40) {
    return firstLine;
  }
  return '';
}

// Extracts a summary from the text
function extractSummary(text: string): string {
  // If there's a professional summary section, extract it
  // Using multiple regex patterns instead of the 's' flag
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
  
  return 'Experienced professional with a background in technology and problem-solving skills.';
}

// Extracts skills from the text
function extractSkills(text: string): string[] {
  const commonSkills = [
    'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 'Node.js', 'Python',
    'Java', 'C#', 'C++', 'Ruby', 'PHP', 'SQL', 'MongoDB', 'PostgreSQL',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'REST API', 'GraphQL',
    'HTML', 'CSS', 'SASS', 'LESS', 'Bootstrap', 'Tailwind CSS', 'Material UI',
    'Git', 'Agile', 'Scrum', 'Jira', 'Confluence', 'Leadership', 'Communication',
    'Problem Solving', 'Critical Thinking', 'Team Collaboration', 'Project Management'
  ];
  
  return commonSkills.filter(skill => 
    new RegExp(`\\b${skill}\\b`, 'i').test(text)
  );
}

// Extracts experience information from the text
function extractExperience(text: string): Array<any> {
  // Try to find the experience section
  // Using multiple regex patterns instead of the 's' flag
  const experienceMatch = text.match(/experience:?(.+?)(?:education)/i) || 
                          text.match(/experience:?(.+?)(?:skills)/i) || 
                          text.match(/experience:?(.+?)(?:references)/i) || 
                          text.match(/experience:?(.+?)$/i);
  
  // If we can't find it, return a default
  if (!experienceMatch) {
    return [
      {
        title: 'Software Developer',
        company: 'Tech Company',
        date: '2020 - Present',
        startDate: '2020-01-01',
        endDate: null,
        description: 'Developing and maintaining web applications using modern technologies.'
      }
    ];
  }
  
  // Try to extract job titles and companies
  const expText = experienceMatch[1];
  const jobs = [];
  
  // Very basic extraction
  const jobTitles = expText.match(/([A-Z][a-z]+ [A-Za-z]+|Developer|Engineer|Manager|Designer)(?:\s+at\s+|\s*[-–—]\s*)([A-Za-z][\w\s&]+)/g);
  
  if (jobTitles && jobTitles.length > 0) {
    for (const jobTitle of jobTitles.slice(0, 3)) { // Limit to top 3
      jobs.push({
        title: jobTitle.split(/\s+at\s+|\s*[-–—]\s*/)[0],
        company: jobTitle.split(/\s+at\s+|\s*[-–—]\s*/)[1] || 'Company',
        date: '2020 - Present',
        startDate: '2020-01-01',
        endDate: null,
        description: 'Responsibilities included development, maintenance, and collaboration with teams.'
      });
    }
  }
  
  return jobs.length > 0 ? jobs : [
    {
      title: 'Software Developer',
      company: 'Tech Company',
      date: '2020 - Present',
      startDate: '2020-01-01',
      endDate: null,
      description: 'Developing and maintaining web applications using modern technologies.'
    }
  ];
}

// Extracts education information from the text
function extractEducation(text: string): Array<any> {
  // Try to find the education section
  // Using multiple regex patterns instead of the 's' flag
  const educationMatch = text.match(/education:?(.+?)(?:experience)/i) || 
                         text.match(/education:?(.+?)(?:skills)/i) || 
                         text.match(/education:?(.+?)(?:references)/i) || 
                         text.match(/education:?(.+?)$/i);
  
  // If we can't find it, return a default
  if (!educationMatch) {
    return [
      {
        degree: 'Bachelor of Science',
        institution: 'University',
        field: 'Computer Science',
        date: '2014 - 2018',
        startDate: '2014-09-01',
        endDate: '2018-05-31'
      }
    ];
  }
  
  // Try to extract degrees and universities
  const eduText = educationMatch[1];
  const degrees = [];
  
  // Look for Bachelor, Master, etc.
  const degreeMatches = eduText.match(/(Bachelor|Master|PhD|BS|MS|BA|MA|MBA|Associate)(?:'s|s)?\s+(?:of|in|degree in)\s+([A-Za-z ]+)/gi);
  
  if (degreeMatches && degreeMatches.length > 0) {
    for (const degreeMatch of degreeMatches) {
      // Safe access with null checks
      const degreeTypeMatch = degreeMatch.match(/(Bachelor|Master|PhD|BS|MS|BA|MA|MBA|Associate)(?:'s|s)?/i);
      const fieldMatch = degreeMatch.match(/(?:of|in|degree in)\s+([A-Za-z ]+)/i);
      
      if (degreeTypeMatch && fieldMatch) {
        const degreeType = degreeTypeMatch[0];
        const field = fieldMatch[1];
        
        degrees.push({
          degree: `${degreeType} in ${field}`,
          institution: 'University',
          field,
          date: '2014 - 2018',
          startDate: '2014-09-01',
          endDate: '2018-05-31'
        });
      }
    }
  }
  
  return degrees.length > 0 ? degrees : [
    {
      degree: 'Bachelor of Science',
      institution: 'University',
      field: 'Computer Science',
      date: '2014 - 2018',
      startDate: '2014-09-01',
      endDate: '2018-05-31'
    }
  ];
}

function generateSuggestions(): string[] {
  return [
    'Add measurable achievements with concrete metrics',
    'Include relevant certifications or professional development',
    'Tailor your resume for each job application',
    'Use action verbs at the beginning of bullet points',
    'Ensure your contact information is up-to-date and professional'
  ];
}

function calculateScore(text: string): number {
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