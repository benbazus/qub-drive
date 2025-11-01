import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'


export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ location }) => {
    const { user, isTokenExpired } = useAuthStore.getState()


    if (!user || isTokenExpired()) {

      throw redirect({
        to: '/sign-in',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: AuthenticatedLayout,
})
