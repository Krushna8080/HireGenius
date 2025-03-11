'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

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
    description: string;
    requirements: string | null;
    requiredSkills: Array<{ id: string; name: string }>;
  };
  jobSeekerProfile: {
    id: string;
    user: {
      name: string | null;
      email: string;
    };
    parsedResume: {
      id: string;
      fullName: string | null;
      email: string | null;
      phone: string | null;
      education: string | null;
      experience: string | null;
      rawText: string | null;
    } | null;
    skills: Array<{ id: string; name: string }>;
  };
};

export default function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchingSkills, setMatchingSkills] = useState<string[]>([]);
  const [missingSkills, setMissingSkills] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user.role !== 'RECRUITER') {
      router.push('/dashboard');
    } else {
      fetchApplication();
    }
  }, [status, session, params.id, router]);

  const fetchApplication = async () => {
    setLoading(true);
    setError(null);
    try {
      // Make sure we're using a real application ID
      if (!params.id || params.id === 'undefined') {
        setError('Invalid application ID');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/applications/${params.id}`);
      
      // Try to get the error message from the response if it's not OK
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || 'Failed to fetch application details';
        
        if (response.status === 404) {
          toast.error('Application not found');
          router.push('/dashboard/recruiter/applications');
          return;
        }
        
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      
      // Parse the response data
      const data = await response.json().catch(() => {
        setError('Failed to parse server response');
        return null;
      });
      
      if (!data || !data.application) {
        setError('Invalid response format - application data missing');
        throw new Error('Invalid response format - application data missing');
      }
      
      setApplication(data.application);
      
      // Safety checks before calculating matching and missing skills
      const hasResumeSkills = data.application.jobSeekerProfile?.skills && 
                             Array.isArray(data.application.jobSeekerProfile.skills);
      
      const hasJobSkills = data.application.jobPosting?.requiredSkills && 
                           Array.isArray(data.application.jobPosting.requiredSkills);
      
      // Calculate matching and missing skills if we have both sets of skills
      if (hasResumeSkills && hasJobSkills) {
        try {
          const requiredSkillNames = data.application.jobPosting.requiredSkills.map(
            (skill: { name: string }) => (skill?.name || '').toLowerCase()
          ).filter(Boolean);
          
          const applicantSkillNames = data.application.jobSeekerProfile.skills.map(
            (skill: { name: string }) => (skill?.name || '').toLowerCase()
          ).filter(Boolean);
          
          const matching = requiredSkillNames.filter((skill: string) => 
            applicantSkillNames.includes(skill)
          );
          
          const missing = requiredSkillNames.filter((skill: string) => 
            !applicantSkillNames.includes(skill)
          );
          
          setMatchingSkills(matching);
          setMissingSkills(missing);
        } catch (skillError) {
          console.error('Error calculating skills match:', skillError);
          // Don't fail the entire page load if skill calculation fails
        }
      }
    } catch (error) {
      console.error('Error fetching application:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/applications/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update application status');
      
      const data = await response.json();
      setApplication(prev => prev ? { ...prev, status: newStatus } : null);
      
      toast.success(`Application ${newStatus.toLowerCase()}`);
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Failed to update application status');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p>Loading application details...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
          <svg className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-500 text-xl mb-4">Failed to load application details.</p>
          <p className="text-gray-600 mb-6">
            {error || "The application details could not be loaded. This might be because the application no longer exists or there was an error connecting to the server."}
          </p>
          <button 
            onClick={() => router.push('/dashboard/recruiter/applications')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Return to Applications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Application Details</h1>
        <button
          onClick={() => router.push('/dashboard/recruiter/applications')}
          className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Back to Applications
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">{application.jobPosting.title}</h2>
              <p className="text-gray-600">{application.jobPosting.company}</p>
            </div>
            <div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium 
                ${application.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                application.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                application.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                'bg-gray-100 text-gray-800'}`}>
                {application.status}
              </span>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Applied on {formatDate(application.createdAt)}
          </p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Applicant Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">
                  {application.jobSeekerProfile.parsedResume?.fullName || 
                   application.jobSeekerProfile.user.name || 
                   'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">
                  {application.jobSeekerProfile.parsedResume?.email || 
                   application.jobSeekerProfile.user.email}
                </p>
              </div>
              {application.jobSeekerProfile.parsedResume?.phone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{application.jobSeekerProfile.parsedResume.phone}</p>
                </div>
              )}
              {application.jobSeekerProfile.parsedResume?.education && (
                <div>
                  <p className="text-sm text-gray-500">Education</p>
                  <p className="font-medium">{application.jobSeekerProfile.parsedResume.education}</p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <h4 className="text-md font-semibold mb-2">Match Score</h4>
              <div className="bg-gray-200 h-4 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full"
                  style={{ width: `${Math.round(application.matchScore)}%` }}
                ></div>
              </div>
              <p className="mt-1 text-sm text-center font-medium">
                {Math.round(application.matchScore)}% Match
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Skills Assessment</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">Matching Skills ({matchingSkills.length})</p>
                <div className="flex flex-wrap gap-2">
                  {matchingSkills.length > 0 ? (
                    matchingSkills.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No matching skills found</p>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-2">Missing Skills ({missingSkills.length})</p>
                <div className="flex flex-wrap gap-2">
                  {missingSkills.length > 0 ? (
                    missingSkills.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No missing skills!</p>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-2">All Applicant Skills</p>
                <div className="flex flex-wrap gap-2">
                  {application.jobSeekerProfile.skills &&
                   application.jobSeekerProfile.skills.length > 0 ? (
                    application.jobSeekerProfile.skills.map((skill) => (
                      <span key={skill.id} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                        {skill.name}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No skills found</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {application.coverLetter && (
          <div className="p-6 border-t">
            <h3 className="text-lg font-semibold mb-3">Cover Letter</h3>
            <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
              {application.coverLetter}
            </div>
          </div>
        )}

        {application.jobSeekerProfile.parsedResume?.experience && (
          <div className="p-6 border-t">
            <h3 className="text-lg font-semibold mb-3">Experience</h3>
            <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
              {application.jobSeekerProfile.parsedResume.experience}
            </div>
          </div>
        )}

        {application.jobSeekerProfile.parsedResume?.rawText && (
          <div className="p-6 border-t">
            <h3 className="text-lg font-semibold mb-3">Resume Full Text</h3>
            <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap text-sm max-h-96 overflow-y-auto">
              {application.jobSeekerProfile.parsedResume.rawText}
            </div>
          </div>
        )}

        {application.status === 'PENDING' && (
          <div className="p-6 border-t bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Decision</h3>
            <div className="flex space-x-4">
              <button
                onClick={() => handleStatusChange('APPROVED')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Approve Application
              </button>
              <button
                onClick={() => handleStatusChange('REJECTED')}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Reject Application
              </button>
            </div>
          </div>
        )}
        
        {application.status === 'APPROVED' && (
          <div className="p-6 border-t bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Next Steps</h3>
            <div className="flex space-x-4">
              <button
                onClick={() => handleStatusChange('SELECTED_FOR_INTERVIEW')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Select for Interview
              </button>
            </div>
          </div>
        )}
        
        {application.status === 'SELECTED_FOR_INTERVIEW' && (
          <div className="p-6 border-t bg-green-50">
            <div className="flex items-center">
              <div className="rounded-full bg-green-100 p-2 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-green-800 font-medium">
                Selected for Interview! You can contact the candidate to schedule.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 