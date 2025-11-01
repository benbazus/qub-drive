import React from 'react'
import { File, HardDrive, Share2, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBytes, formatNumber } from '@/utils/file.utils'
import { GrowthIndicator } from './GrowthIndicator'



interface StatCardsProps {
  displayStats: unknown
  isAbsolute: boolean
  isLoading?: boolean
}

// Skeleton component for stats cards
const StatCardSkeleton: React.FC<{ gradient: string; border: string }> = ({ gradient, border }) => (
  <Card className={`group transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${gradient} ${border}`}>
    <CardContent className='p-3 sm:p-4 lg:p-6'>
      <div className='flex items-center justify-between'>
        <div className="min-w-0 flex-1">
          <Skeleton className="h-3 sm:h-4 w-16 sm:w-20 mb-2" />
          <Skeleton className="h-5 sm:h-6 lg:h-8 w-12 sm:w-16" />
        </div>
        <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-xl sm:rounded-2xl flex-shrink-0" />
      </div>
      <div className='mt-2 sm:mt-4 flex items-center text-xs sm:text-sm'>
        <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
      </div>
    </CardContent>
  </Card>
)

export const StatCards: React.FC<StatCardsProps> = ({ displayStats, isAbsolute, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className='grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-in slide-in-from-bottom-4 duration-700'>
        <StatCardSkeleton
          gradient="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900"
          border="border-blue-200 dark:border-blue-800"
        />
        <StatCardSkeleton
          gradient="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900"
          border="border-purple-200 dark:border-purple-800"
        />
        <StatCardSkeleton
          gradient="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900"
          border="border-emerald-200 dark:border-emerald-800"
        />
        <StatCardSkeleton
          gradient="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900"
          border="border-orange-200 dark:border-orange-800"
        />
      </div>
    )
  }

  return (
    <div className='grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-in slide-in-from-bottom-4 duration-700'>
      <Card className='group transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800'>
        <CardContent className='p-3 sm:p-4 lg:p-6'>
          <div className='flex items-center justify-between'>
            <div className="min-w-0 flex-1">
              <p className='text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 truncate'>
                Total Files
              </p>
              <p className='text-lg sm:text-2xl lg:text-3xl font-bold text-blue-900 dark:text-blue-100 animate-in fade-in duration-1000'>{formatNumber(displayStats?.totalFiles?.count ?? 0)}</p>
            </div>
            <div className='flex h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0'>
              <File className='h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white' />
            </div>
          </div>
          <div className='mt-2 sm:mt-4 flex items-center text-xs sm:text-sm'>
            <GrowthIndicator growth={displayStats?.totalFiles?.growth ?? 0} isAbsolute={isAbsolute} />
          </div>
        </CardContent>
      </Card>

      <Card className='group transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800'>
        <CardContent className='p-3 sm:p-4 lg:p-6'>
          <div className='flex items-center justify-between'>
            <div className="min-w-0 flex-1">
              <p className='text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400 truncate'>
                Storage Used
              </p>
              <p className='text-lg sm:text-2xl lg:text-3xl font-bold text-purple-900 dark:text-purple-100 animate-in fade-in duration-1000 delay-100'>{formatBytes(displayStats?.storageUsed?.bytes ?? 0)}</p>
            </div>
            <div className='flex h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0'>
              <HardDrive className='h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white' />
            </div>
          </div>
          <div className='mt-2 sm:mt-4 flex items-center text-xs sm:text-sm'>
            <GrowthIndicator growth={displayStats?.storageUsed?.growth ?? 0} isAbsolute={isAbsolute} />
          </div>
        </CardContent>
      </Card>

      <Card className='group transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800'>
        <CardContent className='p-3 sm:p-4 lg:p-6'>
          <div className='flex items-center justify-between'>
            <div className="min-w-0 flex-1">
              <p className='text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400 truncate'>
                Shared Files
              </p>
              <p className='text-lg sm:text-2xl lg:text-3xl font-bold text-emerald-900 dark:text-emerald-100 animate-in fade-in duration-1000 delay-200'>{formatNumber(displayStats?.sharedFiles?.count ?? 0)}</p>
            </div>
            <div className='flex h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0'>
              <Share2 className='h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white' />
            </div>
          </div>
          <div className='mt-2 sm:mt-4 flex items-center text-xs sm:text-sm'>
            <GrowthIndicator growth={displayStats?.sharedFiles?.growth ?? 0} isAbsolute={isAbsolute} />
          </div>
        </CardContent>
      </Card>

      <Card className='group transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800'>
        <CardContent className='p-3 sm:p-4 lg:p-6'>
          <div className='flex items-center justify-between'>
            <div className="min-w-0 flex-1">
              <p className='text-xs sm:text-sm font-medium text-orange-600 dark:text-orange-400 truncate'>
                Team Members
              </p>
              <p className='text-lg sm:text-2xl lg:text-3xl font-bold text-orange-900 dark:text-orange-100 animate-in fade-in duration-1000 delay-300'>{formatNumber(displayStats?.teamMembers?.count ?? 0)}</p>
            </div>
            <div className='flex h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0'>
              <Users className='h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white' />
            </div>
          </div>
          <div className='mt-2 sm:mt-4 flex items-center text-xs sm:text-sm'>
            <GrowthIndicator growth={displayStats?.teamMembers?.growth ?? 0} isAbsolute={isAbsolute} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}