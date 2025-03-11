'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

type Job = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  type: string;
  salary: string | null;
  description: string;
  requirements: string | null;
  createdAt: string;
  requiredSkills: Array<{ id: string; name: string }>;
  recruiterProfile: {
    id: string;
    user: {
      name: string | null;
      email: string;
    };
  };
};

export default function JobDetail({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  
  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/jobs/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Job not found');
          }
          throw new Error('Failed to fetch job details');
        }
        
        const data = await response.json();
        setJob(data);
        
        // Check if user has already applied
        if (session?.user.role === 'JOBSEEKER') {
          const applicationsResponse = await fetch(`/api/applications?jobPostingId=${params.id}`);
          if (applicationsResponse.ok) {
            const applicationsData = await applicationsResponse.json();
            setHasApplied(applicationsData.applications.length > 0);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast.error(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJob();
  }, [params.id, session]);
  
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session || status !== 'authenticated') {
      router.push(`/login?callbackUrl=/jobs/${params.id}`);
      return;
    }
    
    if (session.user.role !== 'JOBSEEKER') {
      toast.error('Only job seekers can apply for jobs');
      return;
    }
    
    setApplying(true);
    
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobPostingId: params.id,
          coverLetter,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply for job');
      }
      
      setMatchScore(data.matchScore);
      setHasApplied(true);
      toast.success('Application submitted successfully');
    } catch (err) {
      console.error('Error applying for job:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to apply for job');
    } finally {
      setApplying(false);
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-10">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (error || !job) {
    return (
      <div className="max-w-7xl mx-auto py-10">
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900">
            {error || 'Job not found'}
          </h3>
          <div className="mt-6">
            <Link
              href="/jobs"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Job Listings
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto py-10">
      <div className="mb-6">
        <Link
          href="/jobs"
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Job Listings
        </Link>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <p className="mt-1 text-sm text-gray-500">
                {job.company} • {job.location || 'Remote'} • {job.type}
              </p>
            </div>
            {job.salary && (
              <span className="mt-2 sm:mt-0 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {job.salary}
              </span>
            )}
          </div>
        </div>
        
        <div className="border-t border-gray-200">
          <div className="px-4 py-5 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-3">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">Job Description</h2>
                    <div className="mt-2 prose prose-blue text-gray-500">
                      {job.description.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                  
                  {job.requirements && (
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">Requirements</h2>
                      <div className="mt-2 prose prose-blue text-gray-500">
                        {job.requirements.split('\n').map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {job.requiredSkills.length > 0 && (
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">Required Skills</h2>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {job.requiredSkills.map(skill => (
                          <span
                            key={skill.id}
                            className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                          >
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="md:col-span-1">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-medium text-gray-900">About this role</h2>
                  <div className="mt-4 space-y-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Posted</span>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Company</span>
                      <p className="mt-1 text-sm text-gray-900">{job.company}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Posted by</span>
                      <p className="mt-1 text-sm text-gray-900">
                        {job.recruiterProfile.user.name || 'Recruiter'}
                      </p>
                    </div>
                    
                    {session?.user.role === 'JOBSEEKER' && !hasApplied && (
                      <div className="pt-4">
                        <button
                          onClick={() => {
                            const applicationSection = document.getElementById('application-section');
                            if (applicationSection) {
                              applicationSection.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Apply for this job
                        </button>
                      </div>
                    )}
                    
                    {session?.user.role === 'JOBSEEKER' && hasApplied && (
                      <div className="pt-4">
                        <div className="bg-green-50 border border-green-200 rounded-md p-3">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg
                                className="h-5 w-5 text-green-400"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-green-800">
                                Application Submitted
                              </h3>
                              {matchScore !== null && (
                                <div className="mt-2 text-sm text-green-700">
                                  <p>Your match score: {matchScore}%</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {session?.user.role === 'JOBSEEKER' && !hasApplied && (
        <div id="application-section" className="mt-10 bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900">Apply for this position</h2>
            <form onSubmit={handleApply} className="mt-5">
              <div>
                <label htmlFor="cover-letter" className="block text-sm font-medium text-gray-700">
                  Cover Letter (optional)
                </label>
                <div className="mt-1">
                  <textarea
                    id="cover-letter"
                    name="cover-letter"
                    rows={5}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Explain why you're a good fit for this role..."
                  />
                </div>
              </div>
              
              <div className="mt-5">
                <button
                  type="submit"
                  disabled={applying}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                >
                  {applying ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 