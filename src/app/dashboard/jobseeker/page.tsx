import { requireJobSeekerRole } from '@/lib/auth/session';
import Link from 'next/link';

export default async function JobSeekerDashboard() {
  const session = await requireJobSeekerRole();
  const user = session.user;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Job Seeker Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">My Applications</h3>
            <p className="mt-1 text-sm text-gray-500">
              Track your job applications and their status.
            </p>
            <div className="mt-4">
              <Link
                href="/dashboard/jobseeker/applications"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-500"
              >
                View Applications
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Resume Manager</h3>
            <p className="mt-1 text-sm text-gray-500">
              Upload and analyze your resume for better job matches.
            </p>
            <div className="mt-4">
              <Link
                href="/resume-analyzer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-500"
              >
                Manage Resume
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Job Recommendations</h3>
            <p className="mt-1 text-sm text-gray-500">
              View personalized job recommendations based on your profile.
            </p>
            <div className="mt-4">
              <Link
                href="/dashboard/jobseeker/recommendations"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-500"
              >
                View Recommendations
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Job Match Insights</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <p className="text-center text-gray-500 py-4">
              Upload your resume to get personalized job match insights.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Job Applications</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <p className="text-center text-gray-500 py-4">
              No recent applications to display.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 