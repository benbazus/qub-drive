import { createFileRoute } from '@tanstack/react-router'
import SettingsDisplay from '@/features/settings/display'

export const Route = createFileRoute('/dashboard/settings/display')({
  component: SettingsDisplay,
})
