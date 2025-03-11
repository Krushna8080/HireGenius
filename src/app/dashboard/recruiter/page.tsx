import { requireRecruiterRole } from '@/lib/auth/session';
import Link from 'next/link';

export default async function RecruiterDashboard() {
  const session = await requireRecruiterRole();
  const user = session.user;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Recruiter Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Job Postings</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage your job listings.
            </p>
            <div className="mt-4">
              <Link
                href="/dashboard/recruiter/jobs"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-500"
              >
                Manage Jobs
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Applications</h3>
            <p className="mt-1 text-sm text-gray-500">
              Review and manage job applications.
            </p>
            <div className="mt-4">
              <Link
                href="/dashboard/recruiter/applications"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-500"
              >
                View Applications
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Analytics</h3>
            <p className="mt-1 text-sm text-gray-500">
              View insights about your job postings and applicants.
            </p>
            <div className="mt-4">
              <Link
                href="/dashboard/recruiter/analytics"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-500"
              >
                View Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Applications</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-md font-medium text-gray-700">
                Latest applicants for your job postings
              </p>
              <Link
                href="/dashboard/recruiter/applications"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                View all
              </Link>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <p className="text-center text-gray-500 py-4">
                You'll see recent applications here.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-md font-medium text-gray-700">
                Summary of your recruitment metrics
              </p>
              <Link
                href="/dashboard/recruiter/analytics"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Full analytics
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-500 mb-1">Active Jobs</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-500 mb-1">Total Applicants</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-500 mb-1">Avg. Match Score</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}