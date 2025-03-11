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
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Job Recommendations</h1>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading recommendations...</p>
        </div>
      ) : !hasResume ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-16 text-center">
            <p className="text-gray-500">Please upload your resume to get personalized job recommendations.</p>
            <Link
              href="/resume-analyzer"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-500"
            >
              Upload Resume
            </Link>
          </div>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-16 text-center">
            <p className="text-gray-500">No job recommendations found. Check back later.</p>
            <Link
              href="/jobs"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-500"
            >
              Browse All Jobs
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {recommendations.map((job) => (
            <div key={job.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    <Link href={`/jobs/${job.id}`} className="hover:text-blue-600">
                      {job.title}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {job.company}
                    {job.location && ` • ${job.location}`}
                  </p>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-semibold text-gray-700">Match:</span>
                  <div className="ml-2 flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${job.matchScore}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-700">{job.matchScore}%</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-3">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">{job.type}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Posted</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(job.createdAt)}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Salary</dt>
                    <dd className="mt-1 text-sm text-gray-900">{job.salary || 'Not specified'}</dd>
                  </div>
                  <div className="sm:col-span-3">
                    <dt className="text-sm font-medium text-gray-500">Skills Match</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <div className="flex flex-wrap gap-2">
                        {job.skills && job.skills.map((skill) => (
                          <span
                            key={skill.id}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {skill.name}
                          </span>
                        ))}
                        {(!job.skills || job.skills.length === 0) && (
                          <span className="text-gray-500">No skills listed</span>
                        )}
                      </div>
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="bg-gray-50 px-4 py-4 sm:px-6">
                <div className="flex justify-end">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-500"
                  >
                    View Job
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 