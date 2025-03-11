# HireGenius - Intelligent Recruitment Platform

HireGenius is a modern recruitment platform that leverages intelligent resume processing and job-candidate matching to streamline the hiring process for both recruiters and job seekers.

## Features

### For Job Seekers
- **User-friendly Profile Management**: Create and manage your professional profile
- **Resume Upload and Analysis**: Upload your resume and get it automatically parsed
- **Intelligent Job Matching**: Receive job recommendations based on your skills and experience
- **Application Tracking**: Monitor the status of your job applications in one place
- **Simplified Application Process**: Apply to jobs with just a few clicks

### For Recruiters
- **Comprehensive Applicant Management**: Organize and review applications efficiently
- **Smart Candidate Matching**: Find candidates with the best skill match for your job postings
- **Job Posting Management**: Create, edit, and manage job listings with ease
- **Application Review Tools**: Evaluate candidates based on match scores and parsed resume data
- **Dashboard Analytics**: Track application statistics and recruitment pipeline

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **File Processing**: PDF.js for resume parsing
- **Form Handling**: React Hook Form, Zod for validation

## Getting Started

### Prerequisites
- Node.js 18.x or higher
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/hiregenius.git
   cd hiregenius
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/hiregenius"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secure-nextauth-secret"
   ```

4. Initialize the database
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
hiregenius/
├── prisma/               # Database schema and migrations
├── public/               # Static assets
├── src/
│   ├── app/              # Next.js 14 App Router
│   │   ├── api/          # API endpoints
│   │   ├── dashboard/    # Dashboard pages for different user roles
│   │   ├── jobs/         # Job listing and detail pages
│   │   ├── login/        # Authentication pages
│   │   └── register/     # User registration
│   ├── components/       # Reusable UI components
│   ├── lib/              # Utility functions and shared code
│   │   ├── auth/         # Authentication configuration
│   │   ├── db/           # Database utilities
│   │   └── utils/        # Helper functions
```

## Key Features Implementation

### Resume Parsing

The platform uses PDF.js to extract text from uploaded resumes and applies pattern matching to identify key information such as:
- Contact details (email, phone)
- Education history
- Work experience
- Skills

This data is structured and stored in the database for efficient candidate matching.

### Job-Candidate Matching

The matching algorithm calculates a score based on:
1. Skills overlap between the job requirements and candidate's resume
2. Experience relevance
3. Education requirements

This provides recruiters with an objective measure of candidate suitability for specific roles.

### Role-based Access Control

The application implements three user roles:
- **Job Seeker**: Can browse jobs, submit applications, and manage their profile
- **Recruiter**: Can post jobs, review applications, and interact with candidates
- **Admin**: Has full system access for user management and platform configuration

## Future Improvements

- Implementation of AI-powered resume analysis for more accurate skill extraction
- Integration with calendar systems for interview scheduling
- Enhanced analytics and reporting for recruiters
- Mobile app development
- Integration with popular job boards
