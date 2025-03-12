import 'next-auth';
import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface User extends DefaultUser {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    recruiterProfileId?: string | null;
    jobSeekerProfileId?: string | null;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      recruiterProfileId?: string | null;
      jobSeekerProfileId?: string | null;
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    email: string;
    role: string;
    recruiterProfileId?: string | null;
    jobSeekerProfileId?: string | null;
  }
} 