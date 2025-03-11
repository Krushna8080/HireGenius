import { hash } from 'bcrypt';
import { prisma } from './prisma';

export type CreateUserData = {
  email: string;
  password: string;
  name?: string;
  role: 'RECRUITER' | 'JOBSEEKER';
  company?: string; // For recruiters
  title?: string; // For job seekers
};

export async function createUser({ email, password, name, role, company, title }: CreateUserData) {
  const hashedPassword = await hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
    });

    // Create the respective profile based on the role
    if (role === 'RECRUITER' && company) {
      await prisma.recruiterProfile.create({
        data: {
          userId: user.id,
          company,
          position: title,
        },
      });
    } else if (role === 'JOBSEEKER') {
      await prisma.jobSeekerProfile.create({
        data: {
          userId: user.id,
          title,
        },
      });
    }

    return { success: true, userId: user.id };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: 'Failed to create user' };
  }
}

export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
    include: {
      recruiterProfile: true,
      jobSeekerProfile: true,
    },
  });
}

export async function getUserById(id: string) {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      recruiterProfile: true,
      jobSeekerProfile: true,
    },
  });
} 