import { Suspense } from 'react';
import JobsContent from './JobsContent';

export default function JobsPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-pulse text-gray-600">Loading jobs...</div>
        </div>
      </div>
    }>
      <JobsContent />
    </Suspense>
  );
} 