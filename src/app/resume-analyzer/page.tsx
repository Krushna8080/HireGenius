'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function ResumeAnalyzer() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeData, setResumeData] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [hasUploadedResume, setHasUploadedResume] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === 'authenticated' && session?.user.role === 'JOBSEEKER') {
      // Check if the user already has a resume
      checkExistingResume();
    }
  }, [status, session]);

  const checkExistingResume = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.profile && data.profile.resumeUrl) {
          setHasUploadedResume(true);
          // Try to get the parsed resume data if available
          if (data.resumeData) {
            setResumeData({
              ...data.resumeData,
              fromCache: true
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking existing resume:', error);
    }
  };

  // Redirect if not logged in
  if (status === 'unauthenticated') {
    router.push('/login?callbackUrl=/resume-analyzer');
    return null;
  }

  // Redirect if user is not a job seeker
  if (status === 'authenticated' && session?.user.role !== 'JOBSEEKER') {
    router.push('/dashboard');
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (droppedFile.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      setFile(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to upload resume' }));
        throw new Error(errorData.error || 'Failed to upload resume');
      }
      
      const data = await response.json();
      
      setHasUploadedResume(true);
      toast.success('Resume uploaded successfully!');
      
      // Reset file input
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Now analyze the resume if we have a parsed resume ID or job seeker profile ID
      if (data.resumeId || data.profileId) {
        await analyzeResume(data.resumeId || data.profileId);
      } else {
        // If no IDs, try to get the current user's profile and analyze
        await analyzeCurrentUserResume();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload resume');
    } finally {
      setIsUploading(false);
    }
  };

  const analyzeCurrentUserResume = async () => {
    try {
      const profileResponse = await fetch('/api/profile');
      if (!profileResponse.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const profileData = await profileResponse.json();
      if (profileData.profile && profileData.profile.id) {
        await analyzeResume(profileData.profile.id);
      } else {
        throw new Error('Profile data not found');
      }
    } catch (error) {
      console.error('Error fetching profile for resume analysis:', error);
      toast.error('Failed to retrieve profile for analysis');
    }
  };

  const analyzeResume = async (resumeId: string) => {
    setAnalyzing(true);
    
    try {
      const response = await fetch(`/api/resume/analyze?resumeId=${resumeId}`);
      
      // Always attempt to parse the response, even for error status codes
      const data = await response.json().catch(() => ({
        success: false,
        error: 'Failed to parse server response'
      }));
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze resume');
      }

      // Set the resume data
      setResumeData(data);
      
      // Show appropriate notifications based on response
      if (data.isFallback) {
        toast('Your resume could not be processed completely. Please try uploading it again.', {
          icon: '⚠️',
        });
      } else {
        toast.success('Resume analysis complete');
      }
    } catch (error) {
      console.error('Error analyzing resume:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze resume');
      
      // Set a basic fallback UI state
      setResumeData({
        contactInfo: { email: '', phone: '' },
        summary: 'Resume analysis failed. Please try again or contact support if the issue persists.',
        skills: [],
        experience: [],
        education: [],
        suggestions: ['Try uploading your resume again', 'Make sure your resume is in PDF format'],
        score: 0,
        error: true
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Resume Analyzer</h1>
      
      <div className="mb-10">
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            accept=".pdf" 
            className="hidden" 
            onChange={handleFileChange}
            ref={fileInputRef}
          />
          <svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
            />
          </svg>
          <div className="mt-4 flex text-sm text-gray-600 justify-center">
            <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
              <span>Upload a file</span>
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            PDF up to 10MB
          </p>
        </div>
        
        {file && (
          <div className="mt-4 flex items-center justify-between bg-gray-50 p-4 rounded-md">
            <div className="flex items-center">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="ml-2 text-sm text-gray-700 truncate max-w-xs">
                {file.name}
              </span>
            </div>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        )}
      </div>

      {analyzing && (
        <div className="text-center py-10">
          <svg
            className="animate-spin h-10 w-10 text-blue-600 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-lg text-gray-600">Analyzing your resume...</p>
          <p className="text-sm text-gray-500">This may take a few moments</p>
        </div>
      )}

      {resumeData && !analyzing && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Resume Analysis</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              AI-powered analysis of your resume
            </p>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Extracted Skills</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex flex-wrap gap-2">
                    {resumeData.skills?.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {skill}
                      </span>
                    )) || 'No skills extracted'}
                  </div>
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Work Experience</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <ul className="divide-y divide-gray-200">
                    {resumeData.experience?.map((exp: any, index: number) => (
                      <li key={index} className="py-2">
                        <div className="font-medium">{exp.title}</div>
                        <div>{exp.company}</div>
                        <div className="text-gray-500">{exp.date}</div>
                        <div className="mt-1">{exp.description}</div>
                      </li>
                    )) || 'No work experience extracted'}
                  </ul>
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Education</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <ul className="divide-y divide-gray-200">
                    {resumeData.education?.map((edu: any, index: number) => (
                      <li key={index} className="py-2">
                        <div className="font-medium">{edu.degree}</div>
                        <div>{edu.institution}</div>
                        <div className="text-gray-500">{edu.date}</div>
                      </li>
                    )) || 'No education extracted'}
                  </ul>
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Resume Score</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex items-center">
                    <span className="text-2xl font-bold mr-2">{resumeData.score || 0}/100</span>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${resumeData.score || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Improvement Suggestions</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <ul className="divide-y divide-gray-200">
                    {resumeData.suggestions?.map((suggestion: string, index: number) => (
                      <li key={index} className="py-2 flex">
                        <svg
                          className="h-5 w-5 text-yellow-400 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {suggestion}
                      </li>
                    )) || 'No suggestions available'}
                  </ul>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
} 