import DocumentPage from '@/features/document'
import { createFileRoute } from '@tanstack/react-router'


export const Route = createFileRoute('/document/$documentId')({
  component: DocumentPage,
})
