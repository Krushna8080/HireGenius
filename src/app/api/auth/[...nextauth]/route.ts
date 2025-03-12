import { prisma } from '@/lib/db/prisma';
import { compare } from 'bcrypt';
import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authOptions } from './auth-options';

const handler = NextAuth(authOptions);

// Explicitly type the handlers as NextApiHandler
export const GET = handler;
export const POST = handler; 