import StarredPage from '@/features/dashboard/drive/starred'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/drive/starred/')({
  component: StarredPage,
})
