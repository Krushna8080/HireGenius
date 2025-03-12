import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { redirect } from 'next/navigation';

export async function getSessionServer() {
  return await getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSessionServer();
  
  if (!session) {
    redirect('/login');
  }
  
  return session;
}

export async function requireRecruiterRole() {
  const session = await requireAuth();
  
  if (session.user.role !== 'RECRUITER') {
    redirect('/dashboard/jobseeker');
  }
  
  return session;
}

export async function requireJobSeekerRole() {
  const session = await requireAuth();
  
  if (session.user.role !== 'JOBSEEKER') {
    redirect('/dashboard/recruiter');
  }
  
  return session;
} 