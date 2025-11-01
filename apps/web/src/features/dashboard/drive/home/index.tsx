
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useFileManager } from '@/hooks/useFileManager';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCards } from '@/components/StatCards';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FileGrid } from '@/components/FileGrid';
import { FileList } from '@/components/FileList';
import { DialogManager } from '@/components/layout/DialogManager';
import { PageControls } from '@/components/PageControls';
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/EmptyState';

const HomePage = () => {
  const {
    layout, setLayout,
    searchQuery, setSearchQuery,
    filter, setFilter,
    currentPath,
    dialogs,
    finalFilteredFiles,
    isLoadingFiles,
    handleFileDoubleClick,
    navigateToBreadcrumb,
    handleFileAction,
    closeDialog
  } = useFileManager();

  const { data: stats, isLoading: isLoadingStats } = useDashboardStats();

  return (
    <DashboardLayout>
      <StatCards displayStats={stats} isLoading={isLoadingStats} isAbsolute={false} />

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">

          {/* Mobile Breadcrumb - Show only current location */}
          <nav className='flex sm:hidden items-center text-sm min-w-0 flex-1'>
            {currentPath && currentPath.length > 0 && (
              <div className="flex items-center space-x-2">
                {currentPath.length > 1 && (
                  <button
                    onClick={() => navigateToBreadcrumb(currentPath.length - 2)}
                    className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Go back"
                  >
                    <ChevronRight className='h-4 w-4 rotate-180' />
                  </button>
                )}
                <span className="text-blue-600 dark:text-blue-400 font-medium truncate">
                  {currentPath[currentPath.length - 1]?.name}
                </span>
              </div>
            )}
          </nav>

          {/* Desktop Breadcrumb - Full path */}
          <nav className='hidden sm:flex items-center space-x-1 sm:space-x-2 text-sm min-w-0 flex-1'>
            {currentPath?.map((crumb, index) => (
              <React.Fragment key={crumb.id ?? 'root'}>
                <button
                  onClick={() => navigateToBreadcrumb(index)}
                  className={cn(
                    'hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 truncate max-w-[120px] sm:max-w-none',
                    index === currentPath.length - 1 &&
                    'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  )}
                  title={crumb.name}
                >
                  {crumb.name}
                </button>
                {index < currentPath.length - 1 && (
                  <ChevronRight className='text-gray-400 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0' />
                )}
              </React.Fragment>
            ))}
          </nav>


          <PageControls
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            layout={layout}
            onLayoutChange={setLayout}
            filter={filter}
            onFilterChange={setFilter}
          />
        </CardHeader>
        {finalFilteredFiles.length === 0 && !isLoadingFiles && ( // 👈 Use the new filtered array for the check
          <div className="text-center p-8 text-gray-500">
            <EmptyState />
          </div>
        )}
        <CardContent className='p-0'>
          {layout === 'grid' ? (
            <FileGrid
              files={finalFilteredFiles}
              isLoading={isLoadingFiles}
              onFileDoubleClick={handleFileDoubleClick}
              onFileAction={handleFileAction}
            />
          ) : (
            <FileList
              files={finalFilteredFiles}
              isLoading={isLoadingFiles}
              onFileDoubleClick={handleFileDoubleClick}
              onFileAction={handleFileAction}
              onSelectAll={() => { }} // TODO: Implement file selection
            />
          )}
          {finalFilteredFiles.length === 0 && !isLoadingFiles && (
            <div>{/* Empty State Component Here */}</div>
          )}
        </CardContent>
      </Card>


      {/* Render all dialogs with one line */}
      <DialogManager dialogs={dialogs} closeDialog={closeDialog} files={finalFilteredFiles} />
    </DashboardLayout>
  );
};

export default HomePage;