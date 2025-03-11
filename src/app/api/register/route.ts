import { createUser } from '@/lib/db/user-service';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Define schema for validation
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  role: z.enum(['RECRUITER', 'JOBSEEKER']),
  company: z.string().optional(),
  title: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate incoming data
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 });
    }
    
    const userData = result.data;
    
    // Check for required fields based on role
    if (userData.role === 'RECRUITER' && !userData.company) {
      return NextResponse.json({ error: 'Company name is required for recruiters' }, { status: 400 });
    }
    
    const userResult = await createUser(userData);
    
    if (!userResult.success) {
      return NextResponse.json({ error: userResult.error }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, userId: userResult.userId }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
} 