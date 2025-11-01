import { createFileRoute } from '@tanstack/react-router'
import UserSettings from '@/features/settings/user'

export const Route = createFileRoute('/dashboard/settings/user')({
  component: UserSettings,
})
