
import { Search, LayoutGrid, List, Folder, File, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PageControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  layout: 'grid' | 'list';
  onLayoutChange: (layout: 'grid' | 'list') => void;
  filter: 'all' | 'folders' | 'files';
  onFilterChange: (filter: 'all' | 'folders' | 'files') => void;
}

export const PageControls = ({
  searchQuery, onSearchChange, layout, onLayoutChange, filter, onFilterChange
}: PageControlsProps) => {
  const isMobile = useIsMobile();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const filterOptions = [
    { value: 'all' as const, label: 'All', icon: null },
    { value: 'folders' as const, label: 'Folders', icon: Folder },
    { value: 'files' as const, label: 'Files', icon: File },
  ];

  const currentFilter = filterOptions.find(option => option.value === filter);

  if (isMobile) {
    return (
      <div className='flex flex-col gap-3 w-full'>
        {/* Mobile Search - Full Width */}
        <div className='relative w-full'>
          <Search className='text-gray-400 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 z-10' />
          <input
            type='text'
            placeholder='Search files...'
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className='w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 pr-4 pl-10 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
            style={{ fontSize: '16px' }} // Prevent zoom on iOS
          />
        </div>

        {/* Mobile Controls Row */}
        <div className='flex items-center justify-between gap-2'>
          {/* Layout Toggle - Mobile Optimized */}
          <div className='bg-gray-100 dark:bg-gray-800 flex items-center rounded-xl p-1 shadow-inner'>
            <button 
              onClick={() => onLayoutChange('grid')} 
              className={cn(
                'rounded-lg p-3 transition-all touch-manipulation',
                layout === 'grid' && 'bg-white dark:bg-gray-700 shadow-md'
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className='h-5 w-5' />
            </button>
            <button 
              onClick={() => onLayoutChange('list')} 
              className={cn(
                'rounded-lg p-3 transition-all touch-manipulation',
                layout === 'list' && 'bg-white dark:bg-gray-700 shadow-md'
              )}
              aria-label="List view"
            >
              <List className='h-5 w-5' />
            </button>
          </div>

          {/* Mobile Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className='bg-gray-100 dark:bg-gray-800 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-inner transition-all touch-manipulation hover:bg-gray-200 dark:hover:bg-gray-700'>
                <Filter className='h-4 w-4' />
                <span className='hidden xs:inline'>{currentFilter?.label}</span>
                <span className='xs:hidden'>Filter</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {filterOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onFilterChange(option.value)}
                  className={cn(
                    'flex items-center gap-2 py-3 cursor-pointer',
                    filter === option.value && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  )}
                >
                  {option.icon && <option.icon className='h-4 w-4' />}
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className='flex flex-wrap items-center justify-between gap-4'>
      <div className='flex flex-wrap items-center gap-3'>
        {/* Desktop Search */}
        <div className='relative'>
          <Search className='text-gray-400 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <input
            type='text'
            placeholder='Search files...'
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className='bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pr-4 pl-10 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-64'
          />
        </div>

        {/* Desktop Layout Toggle */}
        <div className='bg-gray-100 dark:bg-gray-800 flex items-center rounded-xl p-1 shadow-inner'>
          <button 
            onClick={() => onLayoutChange('grid')} 
            className={cn(
              'rounded-lg p-2 transition-all',
              layout === 'grid' && 'bg-white dark:bg-gray-700 shadow-md'
            )}
            aria-label="Grid view"
          >
            <LayoutGrid className='h-4 w-4' />
          </button>
          <button 
            onClick={() => onLayoutChange('list')} 
            className={cn(
              'rounded-lg p-2 transition-all',
              layout === 'list' && 'bg-white dark:bg-gray-700 shadow-md'
            )}
            aria-label="List view"
          >
            <List className='h-4 w-4' />
          </button>
        </div>

        {/* Desktop Filter Toggle */}
        <div className='bg-gray-100 dark:bg-gray-800 flex items-center rounded-xl p-1 text-sm shadow-inner'>
          {filterOptions.map((option) => (
            <button 
              key={option.value}
              onClick={() => onFilterChange(option.value)} 
              className={cn(
                'rounded-lg px-3 py-2 flex items-center gap-2 transition-all',
                filter === option.value && 'bg-white dark:bg-gray-700 shadow-md'
              )}
            >
              {option.icon && <option.icon className='h-4 w-4' />}
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};