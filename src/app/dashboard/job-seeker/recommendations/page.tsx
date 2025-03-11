'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

type Job = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  type: string;
  salary: string | null;
  matchScore: number;
  skills: Array<{ id: string; name: string }>;
  createdAt: string;
};

export default function JobRecommendationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasResume, setHasResume] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user.role !== 'JOBSEEKER') {
      router.push('/dashboard');
    } else {
      fetchRecommendations();
    }
  }, [status, session, router]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      // Check if the user has a resume uploaded
      const profileResponse = await fetch('/api/profile');
      if (!profileResponse.ok) {
        throw new Error('Failed to fetch profile data');
      }
      
      const profileData = await profileResponse.json();
      const hasUploadedResume = profileData.resumeData !== null;
      setHasResume(hasUploadedResume);
      
      if (!hasUploadedResume) {
        setLoading(false);
        return;
      }
      
      // Fetch job recommendations - in a real app, this would be a separate API endpoint
      // for demo purposes, we're using the regular job search API with some filters
      const jobsResponse = await fetch('/api/jobs?limit=10');
      if (!jobsResponse.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const jobsData = await jobsResponse.json();
      
      // Add mock match scores to jobs
      // In a real application, this would be calculated by the backend
      const jobsWithScores = jobsData.jobs.map((job: any) => ({
        ...job,
        matchScore: Math.floor(Math.random() * 100) // Mock score between 0-100
      }));
      
      // Sort by match score (highest first)
      const sortedJobs = jobsWithScores.sort((a: Job, b: Job) => b.matchScore - a.matchScore);
      
      setRecommendations(sortedJobs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching job recommendations:', error);
      toast.error('Failed to load job recommendations');
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p>Loading job recommendations...</p>
        </div>
      </div>
    );
  }

  if (!hasResume) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Job Recommendations</h1>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Upload your resume to get recommendations</h2>
          <p className="text-gray-600 mb-6">
            We need to analyze your resume to provide personalized job recommendations 
            based on your skills and experience.
          </p>
          <Link 
            href="/resume-analyzer" 
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Upload Resume
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Job Recommendations</h1>
      
      <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">
          These recommendations are based on the skills and experience we found in your resume. 
          The match score indicates how well your profile matches the job requirements.
        </p>
      </div>
      
      {recommendations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-500">No job recommendations found at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {recommendations.map((job) => (
            <div key={job.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {job.title}
                  </h2>
                  <p className="text-gray-600">
                    {job.company} {job.location && `• ${job.location}`}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {job.type} {job.salary && `• ${job.salary}`}
                  </p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-800 font-bold text-lg">
                    {job.matchScore}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Match</p>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Skills match:</p>
                <div className="flex flex-wrap gap-2">
                  {job.skills?.map((skill) => (
                    <span 
                      key={skill.id} 
                      className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Posted on {formatDate(job.createdAt)}
                </p>
                <Link 
                  href={`/jobs/${job.id}`}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  View Job
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 