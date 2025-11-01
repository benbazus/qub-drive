import ReactSpreadsheet from '@/features/spreadsheet'
import { createFileRoute } from '@tanstack/react-router'
import { v4 as uuidv4 } from 'uuid';

export const Route = createFileRoute('/spreadsheet/')({
  component: () => {
    const { token } = Route.useSearch()
    const generatedToken = token || uuidv4()

    return <ReactSpreadsheet token={generatedToken} />
  },
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: search.token as string | undefined,
    }
  },
})

