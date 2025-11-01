import { useFileManager } from '../../../../hooks/useFileManager';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FileGrid } from '@/components/FileGrid';
import { FileList } from '@/components/FileList';
import { PageControls } from '@/components/PageControls'
import { DialogManager } from '@/components/layout/DialogManager';
import { FileItem } from '@/types/file';
import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

const RecentPage = () => {
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

    // 👇 Filter out trashed files and sort by most recently updated
    const recentFiles = finalFilteredFiles
        .filter((file: FileItem) => !file.deleted)
        .sort((a: FileItem, b: FileItem) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime());


    return (
        <DashboardLayout>
            <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between">
                    <nav className='hidden sm:flex items-center space-x-1 sm:space-x-2 text-sm min-w-0 flex-1'>
                        {/* The breadcrumb might not be as relevant on a "Recent" page, 
                            but we'll leave it in case it's part of the required layout. */}
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
                {recentFiles.length === 0 && !isLoadingFiles && ( // 👈 Use the new filtered array for the check
                    <div className="text-center p-8 text-gray-500">
                        <EmptyState />
                    </div>
                )}
                <CardContent className='p-0'>
                    {layout === 'grid' ? (
                        <FileGrid
                            files={recentFiles} // 👈 Use the new sorted and filtered array
                            isLoading={isLoadingFiles}
                            onFileDoubleClick={handleFileDoubleClick}
                            onFileAction={handleFileAction}
                        />
                    ) : (
                        <FileList
                            files={recentFiles} // 👈 Use the new sorted and filtered array
                            isLoading={isLoadingFiles}
                            onFileDoubleClick={handleFileDoubleClick}
                            onFileAction={handleFileAction}
                            onSelectAll={() => { }} // TODO: Implement file selection
                        />
                    )}
                    {recentFiles.length === 0 && !isLoadingFiles && ( // 👈 Use the new array for the check
                        <div className="text-center p-8 text-gray-500">
                            No recent files found.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Render all dialogs with one line */}
            <DialogManager dialogs={dialogs} closeDialog={closeDialog} files={recentFiles} /> {/* 👈 Pass recent files to dialogs */}
        </DashboardLayout>
    );
};

export default RecentPage;