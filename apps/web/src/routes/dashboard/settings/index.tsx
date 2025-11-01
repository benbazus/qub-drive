import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useAuthUser } from '@/stores/authStore'

function SettingsRedirect() {
  const user = useAuthUser();

  // Check if user is admin or super admin (assuming user.role can be a string or an array of strings)
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || (Array.isArray(user?.role) && user.role.includes('ADMIN'));

  // Redirect based on role
  if (isAdmin) {
    return <Navigate to="/dashboard/settings/admin" />;
  }

  return <Navigate to="/dashboard/settings/user" />;
}

export const Route = createFileRoute('/dashboard/settings/')({
  component: SettingsRedirect,
})
