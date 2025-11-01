import TrashPage from '@/features/dashboard/drive/trash'
import { createFileRoute } from '@tanstack/react-router'



export const Route = createFileRoute('/dashboard/drive/trash/')({
  component: TrashPage,
})
