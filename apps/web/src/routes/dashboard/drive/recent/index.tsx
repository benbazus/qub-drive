import RecentPage from '@/features/dashboard/drive/recent'
import { createFileRoute } from '@tanstack/react-router'


export const Route = createFileRoute('/dashboard/drive/recent/')({
  component: RecentPage,
})
