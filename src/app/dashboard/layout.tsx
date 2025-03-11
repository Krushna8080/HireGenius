import { requireAuth } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  // Redirect to the appropriate dashboard based on role
  if (!session.user.role) {
    redirect('/login');
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="p-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
} 