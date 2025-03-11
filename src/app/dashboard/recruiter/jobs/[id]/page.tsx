'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

type JobPosting = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  createdAt: string;
  status: string;
  salary: string;
  skills: { name: string }[];
  requirements: string;
  responsibilities: string;
  applicantCount: number;
};

export default function JobDetails({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    // Redirect if not logged in
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard/recruiter/jobs/' + params.id);
      return;
    }

    // Redirect if user is not a recruiter
    if (status === 'authenticated' && session?.user.role !== 'RECRUITER') {
      router.push('/dashboard');
      return;
    }

    // Fetch job details
    if (status === 'authenticated') {
      fetchJobDetails();
    }
  }, [status, session, router, params.id]);

  const fetchJobDetails = async () => {
    setIsLoading(true);
    try {
      // Fetch the job posting
      const response = await fetch(`/api/job-postings/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch job posting');
      }
      const data = await response.json();
      setJob(data.jobPosting);

      // Fetch applications for this job
      const applicationsResponse = await fetch(`/api/applications?jobPostingId=${params.id}`);
      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json();
        setApplications(applicationsData.applications || []);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error('Failed to load job details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!job) return;

    try {
      const response = await fetch(`/api/job-postings/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update job status');
      }

      // Update the local state
      setJob({ ...job, status: newStatus });
      toast.success(`Job status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error('Failed to update job status');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold text-gray-800">Job not found</h2>
        <p className="text-gray-600 mt-2">The job posting you're looking for doesn't exist or has been removed.</p>
        <Link href="/dashboard/recruiter/jobs" className="mt-4 inline-block text-blue-600 hover:underline">
          Back to Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <Link
          href="/dashboard/recruiter/jobs"
          className="mr-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Jobs
        </Link>
        <h1 className="text-2xl font-bold">{job.title}</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mr-2">
              {job.location}
            </span>
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
              {job.salary}
            </span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">Status:</span>
            <select
              value={job.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Job Description</h2>
            <div className="prose max-w-none">{job.description}</div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Requirements</h2>
            <div className="prose max-w-none">{job.requirements}</div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Responsibilities</h2>
            <div className="prose max-w-none">{job.responsibilities}</div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Required Skills</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {job.skills && job.skills.map((skill: any, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                >
                  {skill.name}
                </span>
              ))}
              {(!job.skills || job.skills.length === 0) && (
                <span className="text-gray-500">No specific skills required</span>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Applications</h2>
            <p className="text-gray-600 mb-4">
              Total applications: <span className="font-semibold">{applications.length}</span>
            </p>
            <Link
              href={`/dashboard/recruiter/applications?jobId=${job.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              View All Applications
            </Link>
          </div>

          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <Link
              href={`/dashboard/recruiter/jobs/${job.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Edit Job
            </Link>
            <div>
              <span className="text-gray-600 mr-2">Posted on:</span>
              <span className="font-medium">{new Date(job.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 