import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    recruiterProfileId?: string | null;
    jobSeekerProfileId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      recruiterProfileId?: string | null;
      jobSeekerProfileId?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    recruiterProfileId?: string | null;
    jobSeekerProfileId?: string | null;
  }
} 