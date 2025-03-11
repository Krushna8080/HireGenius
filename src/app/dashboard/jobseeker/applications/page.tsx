'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

type Application = {
  id: string;
  status: string;
  matchScore: number;
  coverLetter: string | null;
  createdAt: string;
  jobPosting: {
    id: string;
    title: string;
    company: string;
    location: string | null;
  };
};

export default function JobSeekerApplicationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user.role !== 'JOBSEEKER') {
      router.push('/dashboard');
    } else {
      fetchApplications();
    }
  }, [status, session, router, statusFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/applications?applicant_only=true&${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      
      const data = await response.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawApplication = async (applicationId: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'WITHDRAWN' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to withdraw application');
      }
      
      toast.success('Application withdrawn successfully');
      fetchApplications();
    } catch (error) {
      console.error('Error withdrawing application:', error);
      toast.error('Failed to withdraw application');
    }
  };

  const handleDeleteApplication = async (applicationId: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete application');
      }
      
      toast.success('Application deleted successfully');
      fetchApplications();
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Failed to delete application');
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

  const getStatusCount = (status: string) => {
    if (status === 'ALL') {
      return applications.length;
    }
    return applications.filter(app => app.status === status).length;
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">My Applications</h1>
      
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-4 py-2 rounded-md ${
            statusFilter === 'ALL'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          All ({getStatusCount('ALL')})
        </button>
        <button
          onClick={() => setStatusFilter('APPLIED')}
          className={`px-4 py-2 rounded-md ${
            statusFilter === 'APPLIED'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          Applied ({getStatusCount('APPLIED')})
        </button>
        <button
          onClick={() => setStatusFilter('REVIEWING')}
          className={`px-4 py-2 rounded-md ${
            statusFilter === 'REVIEWING'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          Reviewing ({getStatusCount('REVIEWING')})
        </button>
        <button
          onClick={() => setStatusFilter('INTERVIEWED')}
          className={`px-4 py-2 rounded-md ${
            statusFilter === 'INTERVIEWED'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          Interviewed ({getStatusCount('INTERVIEWED')})
        </button>
        <button
          onClick={() => setStatusFilter('OFFERED')}
          className={`px-4 py-2 rounded-md ${
            statusFilter === 'OFFERED'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          Offered ({getStatusCount('OFFERED')})
        </button>
        <button
          onClick={() => setStatusFilter('REJECTED')}
          className={`px-4 py-2 rounded-md ${
            statusFilter === 'REJECTED'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          Rejected ({getStatusCount('REJECTED')})
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-16 text-center">
            <p className="text-gray-500">You haven't applied to any jobs yet.</p>
            <Link
              href="/jobs"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-500"
            >
              Browse Jobs
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Job
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date Applied
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Match Score
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((application) => (
                <tr key={application.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      <Link
                        href={`/jobs/${application.jobPosting.id}`}
                        className="hover:text-blue-600"
                      >
                        {application.jobPosting.title}
                      </Link>
                    </div>
                    <div className="text-sm text-gray-500">
                      {application.jobPosting.company}
                      {application.jobPosting.location && ` • ${application.jobPosting.location}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(application.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        application.status === 'APPLIED'
                          ? 'bg-blue-100 text-blue-800'
                          : application.status === 'REVIEWING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : application.status === 'INTERVIEWED'
                          ? 'bg-purple-100 text-purple-800'
                          : application.status === 'OFFERED'
                          ? 'bg-green-100 text-green-800'
                          : application.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : application.status === 'WITHDRAWN'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {application.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {application.matchScore ? `${application.matchScore}%` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      {application.status !== 'WITHDRAWN' && application.status !== 'REJECTED' && (
                        <button
                          onClick={() => handleWithdrawApplication(application.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Withdraw
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteApplication(application.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 