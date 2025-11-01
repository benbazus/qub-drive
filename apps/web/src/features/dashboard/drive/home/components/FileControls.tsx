import React from 'react'
import { cn } from '@/lib/utils'
import { Search, LayoutGrid, List, Folder, File } from 'lucide-react'

interface FileControlsProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  layout: 'grid' | 'list'
  setLayout: (layout: 'grid' | 'list') => void
  filter: 'all' | 'folders' | 'files'
  setFilter: (filter: 'all' | 'folders' | 'files') => void
}

const FileControls: React.FC<FileControlsProps> = ({
  searchQuery,
  setSearchQuery,
  layout,
  setLayout,
  filter,
  setFilter
}) => {
  return (
    <div className='flex flex-wrap items-center gap-3'>
      {/* Search */}
      <div className='relative'>
        <Search className='text-gray-400 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
        <input
          type='text'
          placeholder='Search files...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 w-48 rounded-xl py-2.5 pr-4 pl-10 text-sm transition-all duration-200 placeholder:text-gray-500 dark:placeholder:text-gray-400'
        />
      </div>

      {/* Layout Toggle */}
      <div className='bg-gray-100 dark:bg-gray-800 flex items-center rounded-xl p-1 shadow-inner'>
        <button
          onClick={() => setLayout('grid')}
          className={cn(
            'rounded-lg p-2 transition-all duration-200',
            layout === 'grid' &&
            'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md'
          )}
        >
          <LayoutGrid className='h-4 w-4' />
          <span className='sr-only'>Grid View</span>
        </button>
        <button
          onClick={() => setLayout('list')}
          className={cn(
            'rounded-lg p-2 transition-all duration-200',
            layout === 'list' &&
            'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md'
          )}
        >
          <List className='h-4 w-4' />
          <span className='sr-only'>List View</span>
        </button>
      </div>

      {/* Filter Toggle */}
      <div className='bg-gray-100 dark:bg-gray-800 flex items-center rounded-xl p-1 text-sm shadow-inner'>
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'rounded-lg px-3 py-2 transition-all duration-200 font-medium',
            filter === 'all' &&
            'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md'
          )}
        >
          All
        </button>
        <button
          onClick={() => setFilter('folders')}
          className={cn(
            'rounded-lg px-3 py-2 transition-all duration-200 font-medium flex items-center gap-2',
            filter === 'folders' &&
            'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md'
          )}
        >
          <Folder className='h-4 w-4' />
          Folders
        </button>
        <button
          onClick={() => setFilter('files')}
          className={cn(
            'rounded-lg px-3 py-2 transition-all duration-200 font-medium flex items-center gap-2',
            filter === 'files' &&
            'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md'
          )}
        >
          <File className='h-4 w-4' />
          Files
        </button>
      </div>
    </div>
  )
}

export default FileControls