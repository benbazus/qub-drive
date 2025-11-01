import HomePage from '@/features/dashboard/drive/home'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/drive/home/')({
  component: HomePage,
})
