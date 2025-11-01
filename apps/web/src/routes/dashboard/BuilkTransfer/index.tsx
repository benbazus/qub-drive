import { DashboardLayout } from '@/components/layout/DashboardLayout'
import BuilkTransfer from '@/features/BuilkTransfer'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/BuilkTransfer/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <DashboardLayout>
      <BuilkTransfer />
    </DashboardLayout>

  </div>
}

