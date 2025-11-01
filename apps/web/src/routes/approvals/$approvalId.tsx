import { createFileRoute } from '@tanstack/react-router'
import { ApprovalPage } from '@/features/share/ApprovalPage'

export const Route = createFileRoute('/approvals/$approvalId')({
  component: ApprovalPage,
})