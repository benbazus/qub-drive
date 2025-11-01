



import { useFileManager } from '@/hooks/useFileManager'; // 👈 Import the custom hook
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageControls } from '@/components/PageControls'
import { FileGrid } from '@/components/FileGrid';
import { FileList } from '@/components/FileList';
import { DialogManager } from '@/components/layout/DialogManager';
import { cn } from '@/lib/utils';
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

const SharedWithMePage = () => {
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



    // 👇 Filter the files to only include those marked as trashed
    const sharedFiles = finalFilteredFiles.filter((file: { deleted: any; shared: any; }) => file.shared && !file.deleted);

    console.log(" 7777777777777777777777777777777 ")
    console.log(sharedFiles)
    console.log(" 7777777777777777777777777777777 ")


    return (
        <DashboardLayout>


            <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between">
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
                {sharedFiles.length === 0 && !isLoadingFiles && ( // 👈 Use the new filtered array for the check
                    <div className="text-center p-8 text-gray-500">
                        <EmptyState />
                    </div>
                )}
                <CardContent className='p-0'>
                    {layout === 'grid' ? (
                        <FileGrid
                            files={sharedFiles}
                            isLoading={isLoadingFiles}
                            onFileDoubleClick={handleFileDoubleClick}
                            onFileAction={handleFileAction}
                        />
                    ) : (
                        <FileList
                            files={sharedFiles}
                            isLoading={isLoadingFiles}
                            onFileDoubleClick={handleFileDoubleClick}
                            onFileAction={handleFileAction}
                            onSelectAll={() => {}} // TODO: Implement file selection
                        />
                    )}
                    {sharedFiles.length === 0 && !isLoadingFiles && (
                        <div>{/* Empty State Component Here */}</div>
                    )}
                </CardContent>
            </Card>

            {/* Render all dialogs with one line */}
            <DialogManager dialogs={dialogs} closeDialog={closeDialog} files={sharedFiles} />
        </DashboardLayout>
    );
};

export default SharedWithMePage;