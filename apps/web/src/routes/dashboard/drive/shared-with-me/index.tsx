import SharedWithMePage from '@/features/dashboard/drive/share-with-me'
import { createFileRoute } from '@tanstack/react-router'


export const Route = createFileRoute('/dashboard/drive/shared-with-me/')({
    component: SharedWithMePage,
})
