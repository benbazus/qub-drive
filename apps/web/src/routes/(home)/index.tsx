import { createFileRoute, redirect } from '@tanstack/react-router'

import HomePage from '@/features/home'
import { useAuthStore } from '@/stores/authStore';
import authEndPoint from '@/api/endpoints/auth.endpoint';

export const Route = createFileRoute('/(home)/')({
  beforeLoad: () => {
    const { user, isTokenExpired } = useAuthStore.getState();
    
    // Redirect authenticated users to dashboard
    if (user && !isTokenExpired()) {
      throw redirect({
        to: '/dashboard',
      });
    }
  },
  component: HomePage,
  loader: () => {
    const { user, isTokenExpired } = useAuthStore.getState();
    if (user && !isTokenExpired()) {
      return authEndPoint.getCurrentUser(); // Fetch user data
    }
    return null;
  },
})
