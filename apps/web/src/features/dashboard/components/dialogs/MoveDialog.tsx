

import React, { useState, useEffect } from 'react';
import { ChevronRight, Folder, FolderSymlink, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fileEndPoint } from '@/api/endpoints/file.endpoint';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileItem, MoveFileRequest } from '../../../../types/file';

// Type definitions
interface PathCrumb {
    id: string | null;
    name: string;
}

function useGetFolders() {
    return useQuery<FileItem[]>({
        queryKey: ['folders'],
        queryFn: async () => {
            const response = await fileEndPoint.getFolderList();
            return response.data.items;
        },
        enabled: true,
    });
}

function useMoveFile() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, { fileId: string; destinationFolderId: string }>({
        mutationFn: ({ fileId, destinationFolderId }) => {
            const payload: MoveFileRequest = { destinationFolderId };
            return fileEndPoint.moveFile(fileId, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            queryClient.invalidateQueries({ queryKey: ['folders'] });
        },
    });
}

interface MoveDialogProps {
    isOpen: boolean;
    file: FileItem | null;
    onClose: () => void;
}

const MoveDialog: React.FC<MoveDialogProps> = ({ isOpen, file, onClose }) => {
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [folderPath, setFolderPath] = useState<PathCrumb[]>([{ id: null, name: 'Root' }]);
    const [isMoving, setIsMoving] = useState(false);

    const { data: folders = [], isError: isInfoError, isLoading: isLoadingInfo } = useGetFolders();
    const moveMutation = useMoveFile();

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (!isOpen) {
            setFolderPath([{ id: null, name: 'Root' }]);
            setSelectedFolder(null);
            setIsMoving(false);
        }
    }, [isOpen]);

    console.log(" ========getFolderList============= ")
    console.log(folders)
    console.log(" ========getFolderList============= ")

    const getCurrentFolders = () => {
        const currentParent = folderPath[folderPath.length - 1]?.id;
        // Ensure folders is an array before filtering
        const folderArray: FileItem[] = Array.isArray(folders) ? folders : [];
        return folderArray.filter((f: FileItem) => f.fileType === 'folder' && f.parentId === currentParent && f.id !== file?.id);
    };

    const navigateToFolder = (folder: FileItem) => {
        setFolderPath(prev => [...prev, { id: folder.id, name: folder.fileName }]);
        setSelectedFolder(null);
    };

    const navigateBack = (index: number) => {
        setFolderPath(prev => prev.slice(0, index + 1));
        setSelectedFolder(null);
    };

    const handleMove = async () => {
        if (!file) return;

        // Determine destination - either selected folder or current location
        const currentLocationId = folderPath[folderPath.length - 1]?.id;
        const destinationId = selectedFolder || currentLocationId || '';

        // Don't move if no destination is selected and we're at root with no selection
        if (!selectedFolder && folderPath.length === 1) {
            return;
        }

        setIsMoving(true);
        try {
            await moveMutation.mutateAsync({
                fileId: file.id,
                destinationFolderId: destinationId,
            });

            onClose();
        } catch (error) {
            console.error('Failed to move file:', error);
        } finally {
            setIsMoving(false);
        }
    };

    const handleClose = () => {
        setFolderPath([{ id: null, name: 'Root' }]);
        setSelectedFolder(null);
        setIsMoving(false);
        onClose();
    };

    // Get the display name for the file
    const getFileName = () => file?.fileName || 'Unknown file';
    const getFileType = () => file?.fileType || 'item';

    if (!file) return null;

    const canMove = selectedFolder || folderPath.length > 1;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
                    <DialogTitle className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <FolderSymlink className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <span className="text-lg font-semibold">Move "{getFileName()}"</span>
                            <p className="text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
                                Choose a destination folder for your {getFileType() === 'folder' ? 'folder' : 'file'}
                            </p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-6 space-y-6">
                    {/* Current Path Display */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Folder className="h-4 w-4" />
                            Current Location
                        </label>
                        <div className="flex items-center space-x-2 text-sm bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                            <Folder className="h-5 w-5 text-blue-500 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                                {folderPath.map(p => p.name).join(' / ')}
                            </span>
                        </div>
                    </div>

                    {/* Navigation Breadcrumb */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Navigate to Destination
                        </label>
                        <div className="flex items-center flex-wrap gap-2 text-sm bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
                            {folderPath.map((crumb, index) => (
                                <React.Fragment key={`${crumb.id || 'root'}-${index}`}>
                                    <button
                                        onClick={() => navigateBack(index)}
                                        className={cn(
                                            'px-3 py-1.5 rounded-lg transition-all duration-200 font-medium text-sm',
                                            index === folderPath.length - 1
                                                ? 'bg-blue-600 text-white cursor-not-allowed'
                                                : 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:scale-105 shadow-sm'
                                        )}
                                        disabled={index === folderPath.length - 1}
                                    >
                                        {crumb.name}
                                    </button>
                                    {index < folderPath.length - 1 && (
                                        <ChevronRight className="h-4 w-4 text-blue-400 dark:text-blue-500" />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* Folder List */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Available Folders
                        </label>
                        <div className="border border-gray-200 dark:border-gray-600 rounded-xl max-h-80 overflow-y-auto bg-white dark:bg-gray-900 shadow-sm">
                            {isLoadingInfo ? (
                                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                                    <p className="text-sm font-medium">Loading folders...</p>
                                    <p className="text-xs mt-1 text-gray-400">Please wait while we fetch your folders</p>
                                </div>
                            ) : isInfoError ? (
                                <div className="p-12 text-center text-red-500 dark:text-red-400">
                                    <AlertTriangle className="h-10 w-10 mx-auto mb-4" />
                                    <p className="text-sm font-medium">Failed to load folders</p>
                                    <p className="text-xs mt-1">Please check your connection and try again</p>
                                </div>
                            ) : getCurrentFolders().length === 0 ? (
                                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                                    <Folder className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                    <p className="text-sm font-medium">No folders available at this location</p>
                                    <p className="text-xs mt-2 text-gray-400 dark:text-gray-500">
                                        Navigate back to see parent folders or create a new folder
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {getCurrentFolders().map((folder, _index) => (
                                        <div
                                            key={folder.id}
                                            className={cn(
                                                'group flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all duration-200',
                                                selectedFolder === folder.id.toString() &&
                                                'bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 shadow-sm'
                                            )}
                                            onClick={() => setSelectedFolder(folder.id.toString())}
                                            onDoubleClick={() => navigateToFolder(folder)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    'p-2 rounded-lg transition-colors',
                                                    selectedFolder === folder.id.toString()
                                                        ? 'bg-blue-100 dark:bg-blue-900/50'
                                                        : 'bg-blue-50 dark:bg-blue-950/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30'
                                                )}>
                                                    <Folder className="h-5 w-5 text-blue-500" />
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                                        {folder.fileName}
                                                    </span>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        Click to select • Double-click to navigate
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {selectedFolder === folder.id.toString() && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                                                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Selected</span>
                                                    </div>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigateToFolder(folder);
                                                    }}
                                                    className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 p-2"
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Destination Selection */}
                    <div className="space-y-4 p-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Destination Options
                        </h4>
                        <div className="space-y-3">
                            <label className={cn(
                                'flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all duration-200',
                                !selectedFolder && folderPath.length > 1
                                    ? 'border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-700'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500',
                                folderPath.length === 1 && 'opacity-50 cursor-not-allowed'
                            )}>
                                <input
                                    type="radio"
                                    name="destination"
                                    checked={!selectedFolder}
                                    onChange={() => setSelectedFolder(null)}
                                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                                    disabled={folderPath.length === 1}
                                />
                                <div className="text-sm">
                                    <span className={cn(
                                        "block font-medium",
                                        folderPath.length === 1 && "text-gray-400 dark:text-gray-600"
                                    )}>
                                        Move to current location
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-400 mt-1 block">
                                        <strong>{folderPath[folderPath.length - 1]?.name}</strong>
                                        {folderPath.length === 1 && " (Not available at root level)"}
                                    </span>
                                </div>
                            </label>
                            {selectedFolder && (
                                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-700 transition-all duration-200">
                                    <input
                                        type="radio"
                                        name="destination"
                                        checked={!!selectedFolder}
                                        onChange={() => { }}
                                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div className="text-sm">
                                        <span className="block font-medium">Move to selected folder</span>
                                        <span className="text-gray-600 dark:text-gray-400 mt-1 block">
                                            <strong>
                                                {getCurrentFolders().find(f => f.id.toString() === selectedFolder)?.fileName ||
                                                    'Selected folder'}
                                            </strong>
                                        </span>
                                    </div>
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Enhanced Warning Message */}
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <AlertTriangle className="w-4 h-4 text-white" />
                            </div>
                            <div className="text-sm">
                                <p className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                                    Move Operation Details
                                </p>
                                <div className="text-amber-700 dark:text-amber-300 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                                        <span>The {getFileType() === 'folder' ? 'folder' : 'file'} will be moved to the selected location</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                                        <span>All sharing permissions and links will be preserved</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                                        <span>This action can be undone by moving the item back</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="pt-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isMoving}
                        className="px-6"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleMove}
                        disabled={isMoving || isLoadingInfo || isInfoError || !canMove}
                        className={cn(
                            "min-w-32 px-6",
                            canMove && !isMoving && "bg-blue-600 hover:bg-blue-700"
                        )}
                    >
                        {isMoving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                Moving...
                            </>
                        ) : (
                            'Move Here'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default MoveDialog;