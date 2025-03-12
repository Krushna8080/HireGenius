'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

type Job = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  type: string;
  salary: string | null;
  description: string;
  createdAt: string;
  requiredSkills: Array<{ id: string; name: string }>;
  recruiterProfile: {
    user: {
      name: string | null;
    };
  };
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function JobsContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  
  // Fetch jobs
  const fetchJobs = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (search) {
        params.append('search', search);
      }
      
      const response = await fetch(`/api/jobs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const data = await response.json();
      setJobs(data.jobs);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load job listings');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    setSearchTerm(search);
    fetchJobs(page, search);
  }, [searchParams]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) {
      params.append('search', searchTerm);
    }
    params.append('page', '1');
    router.push(`/jobs?${params.toString()}`);
  };
  
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`/jobs?${params.toString()}`);
  };
  
  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Job Listings</h1>
        {session?.user.role === 'RECRUITER' && (
          <Link
            href="/dashboard/recruiter/jobs/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Post a Job
          </Link>
        )}
      </div>
      
      {/* Search bar */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search jobs by title, company, or keywords"
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Search
          </button>
        </form>
      </div>
      
      {/* Job listings */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900">No job listings found</h3>
          <p className="mt-2 text-gray-500">
            {searchTerm ? `No jobs match your search for "${searchTerm}"` : 'There are no active job listings at the moment.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      <Link href={`/jobs/${job.id}`} className="hover:text-blue-600">
                        {job.title}
                      </Link>
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      {job.company} • {job.location || 'Remote'} • {job.type}
                    </p>
                  </div>
                  {job.salary && (
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {job.salary}
                    </span>
                  )}
                </div>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <p className="text-sm text-gray-500 line-clamp-3">
                  {job.description.substring(0, 200)}
                  {job.description.length > 200 ? '...' : ''}
                </p>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {job.requiredSkills.map((skill) => (
                    <span
                      key={skill.id}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
                
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Posted by {job.recruiterProfile.user.name || 'Anonymous'} • 
                    {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                  
                  <Link
                    href={`/jobs/${job.id}`}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="mr-2 px-3 py-1 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
            >
              Previous
            </button>
            
            <div className="flex">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`mx-1 px-3 py-1 rounded-md text-sm font-medium ${
                    pagination.page === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="ml-2 px-3 py-1 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
} 