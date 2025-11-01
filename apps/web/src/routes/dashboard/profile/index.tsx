
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import SettingsProfile from '@/features/settings/profile'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/profile/')({
  component: SettingsProfilePage,
})


function SettingsProfilePage() {
  return (
    <DashboardLayout>
      <SettingsProfile />
    </DashboardLayout>
  )
}