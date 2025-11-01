import { createFileRoute } from '@tanstack/react-router'
import HomePage from '@/features/dashboard/drive/home'

export const Route = createFileRoute('/dashboard/drive/')({
  component: HomePage,
})
