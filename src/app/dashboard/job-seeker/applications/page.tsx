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
  }, [status, session, router]);

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
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'WITHDRAWN' }),
      });

      if (!response.ok) throw new Error('Failed to withdraw application');
      
      // Update local state
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: 'WITHDRAWN' } : app
      ));
      
      toast.success('Application withdrawn successfully');
    } catch (error) {
      console.error('Error withdrawing application:', error);
      toast.error('Failed to withdraw application');
    }
  };

  const handleDeleteApplication = async (applicationId: string) => {
    if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete application');
      
      // Update local state
      setApplications(applications.filter(app => app.id !== applicationId));
      
      toast.success('Application deleted successfully');
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Failed to delete application');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredApplications = applications.filter(app => {
    if (statusFilter === 'ALL') return true;
    return app.status === statusFilter;
  });

  const getStatusCount = (status: string) => {
    return applications.filter(app => app.status === status).length;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Applications</h1>
      
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium ${
            statusFilter === 'ALL' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          All ({applications.length})
        </button>
        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium ${
            statusFilter === 'PENDING' 
              ? 'bg-yellow-500 text-white' 
              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
          }`}
        >
          Pending ({getStatusCount('PENDING')})
        </button>
        <button
          onClick={() => setStatusFilter('APPROVED')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium ${
            statusFilter === 'APPROVED' 
              ? 'bg-green-600 text-white' 
              : 'bg-green-100 text-green-800 hover:bg-green-200'
          }`}
        >
          Approved ({getStatusCount('APPROVED')})
        </button>
        <button
          onClick={() => setStatusFilter('REJECTED')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium ${
            statusFilter === 'REJECTED' 
              ? 'bg-red-600 text-white' 
              : 'bg-red-100 text-red-800 hover:bg-red-200'
          }`}
        >
          Rejected ({getStatusCount('REJECTED')})
        </button>
        <button
          onClick={() => setStatusFilter('WITHDRAWN')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium ${
            statusFilter === 'WITHDRAWN' 
              ? 'bg-gray-600 text-white' 
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Withdrawn ({getStatusCount('WITHDRAWN')})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p>Loading applications...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">No applications found.</p>
          <Link 
            href="/jobs" 
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredApplications.map((application) => (
            <div key={application.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {application.jobPosting.title}
                  </h2>
                  <p className="text-gray-600">
                    {application.jobPosting.company}
                    {application.jobPosting.location && ` • ${application.jobPosting.location}`}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Applied on {formatDate(application.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium 
                    ${application.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                    application.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                    application.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                    'bg-gray-100 text-gray-800'}`}>
                    {application.status}
                  </span>
                  {application.matchScore !== null && (
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                      {Math.round(application.matchScore)}% Match
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                <Link 
                  href={`/jobs/${application.jobPosting.id}`}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  View Job
                </Link>
                
                {application.status === 'PENDING' && (
                  <button
                    onClick={() => handleWithdrawApplication(application.id)}
                    className="px-3 py-1.5 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
                  >
                    Withdraw
                  </button>
                )}
                
                <button
                  onClick={() => handleDeleteApplication(application.id)}
                  className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 