import { createFileRoute } from '@tanstack/react-router'
import SharePage from '@/features/share'

export const Route = createFileRoute('/share/')({
  component: SharePage,
})
