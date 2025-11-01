import MyDrivePage from '@/features/dashboard/drive/my-drive'
import { createFileRoute } from '@tanstack/react-router'



export const Route = createFileRoute('/dashboard/drive/my-drive/')({
  component: MyDrivePage,
})
