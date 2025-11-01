import { createFileRoute } from '@tanstack/react-router'
import AdminSettings from '@/features/settings/admin'

export const Route = createFileRoute('/dashboard/settings/admin')({
  component: AdminSettings,
})