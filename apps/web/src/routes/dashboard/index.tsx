import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthUser } from '@/stores/authStore';
import { UserRole } from '@packages/shared-types';
import { UserDashboard, AdminDashboard, SuperAdminDashboard } from '@/components/dashboards';

export const Route = createFileRoute('/dashboard/')({
  beforeLoad: ({ context }) => {
    // Check if user is authenticated
    if (!context.auth?.user) {
      throw redirect({
        to: '/sign-in',
        search: {
          redirect: '/dashboard'
        }
      });
    }
  },
  component: DashboardPage
});

function DashboardPage() {
  const user = useAuthUser();
  
  if (!user) {
    return null; // This shouldn't happen due to beforeLoad check
  }

  // Get user role with fallback
  const userRole = (user.role?.[0] || UserRole.USER) as UserRole;

  // Render appropriate dashboard based on user role
  switch (userRole) {
    case UserRole.SUPER_ADMIN:
      return <SuperAdminDashboard />;
    case UserRole.ADMIN:
      return <AdminDashboard />;
    case UserRole.MANAGER:
      return <AdminDashboard />; // Managers use admin dashboard for now
    case UserRole.USER:
    case UserRole.VIEWER:
    case UserRole.GUEST:
    default:
      return <UserDashboard />;
  }
}