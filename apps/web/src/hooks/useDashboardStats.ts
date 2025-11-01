import fileEndpoint from '@/api/endpoints/file.endpoint'
import { useQuery } from '@tanstack/react-query'


interface DashboardStats {
  totalFiles: {
    count: number
    growth: number
  }
  storageUsed: {
    bytes: number
    growth: number
  }
  sharedFiles: {
    count: number
    growth: number
  }
  teamMembers: {
    count: number
    growth: number
  }
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      try {
        const stats = await fileEndpoint.getDashboardStats()
        return stats
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
        // Fallback to mock data
        return {
          totalFiles: { count: 1247, growth: 12.5 },
          storageUsed: { bytes: 3.2 * 1024 * 1024 * 1024, growth: 8.3 },
          sharedFiles: { count: 89, growth: -2.1 },
          teamMembers: { count: 24, growth: 5.0 }
        }
      }
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
  })
}