


import React, { useState } from 'react'
import { ChevronRight, Folder, FolderSymlink } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '../../lib/utils'
import { FileItem, PathCrumb } from '../../api/types/file'
import fileEndpoint from '@/api/endpoints/file.endpoint'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
interface MoveDialogProps {
    isOpen: boolean
    file: FileItem | null
    onClose: () => void

}


function useGetFolders(currentLocationId: string) {
    return useQuery<FileItem[]>({
        queryKey: ['folders'],
        queryFn: () => fileEndpoint.getFolders(currentLocationId),
        enabled: true,
    });
}


function useMoveFile() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, { fileId: string; destinationId: string | null }>({
        mutationFn: ({ fileId, destinationId }) =>
            fileEndpoint.moveFile(fileId, { destinationId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            queryClient.invalidateQueries({ queryKey: ['folders'] });
        },
    });
}


const MoveDialog: React.FC<MoveDialogProps> = ({
    isOpen,
    file,
    onClose,

}) => {
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
    const [folderPath, setFolderPath] = useState<PathCrumb[]>([
        { id: null, name: 'Root' }
    ])
    const [isMoving, setIsMoving] = useState(false)
    const moveMutation = useMoveFile();
    //// Mock folder structure - in real app, this would come from API
    // const folders = [
    //     { id: 'documents', name: 'Documents', type: 'folder', parentId: null },
    //     { id: 'projects', name: 'Projects', type: 'folder', parentId: null },
    //     { id: 'archives', name: 'Archives', type: 'folder', parentId: null },
    //     { id: 'personal', name: 'Personal', type: 'folder', parentId: null },
    //     { id: 'work', name: 'Work Files', type: 'folder', parentId: null },
    //     { id: 'project-a', name: 'Project Alpha', type: 'folder', parentId: 'projects' },
    //     { id: 'project-b', name: 'Project Beta', type: 'folder', parentId: 'projects' },
    //     { id: 'client-docs', name: 'Client Documents', type: 'folder', parentId: 'work' },
    //     { id: 'templates', name: 'Templates', type: 'folder', parentId: 'work' }
    // ]

    const currentLocationId = folderPath[folderPath.length - 1]?.id;
    const { data: folderList } = useGetFolders(currentLocationId || '');
    const folders = folderList || [];

    const getCurrentFolders = () => {
        const currentParent = folderPath[folderPath.length - 1]?.id
        return folders.filter(f => f.parentId === currentParent && f.id !== file?.id)
    }

    const navigateToFolder = (folder: any) => {
        setFolderPath(prev => [...prev, { id: folder.id, name: folder.fileName }])
        setSelectedFolder(null)
    }

    const navigateBack = (index: number) => {
        setFolderPath(prev => prev.slice(0, index + 1))
        setSelectedFolder(null)
    }

    const handleClose = () => {
        setFolderPath([{ id: null, name: 'Root' }])
        setSelectedFolder(null)
        onClose()
    }


    const handleMove = async () => {
        if (!file) return;

        // Determine destination - either selected folder or current location
        const currentLocationId = folderPath[folderPath.length - 1]?.id;
        const destinationId = selectedFolder || currentLocationId || '';

        // Don't move if no destination is selected and we're at root with no selection
        if (!selectedFolder && folderPath.length === 1) {
            return;
        }

        // Prevent moving to the same location
        const currentParentId = file.parentId;
        if (destinationId === currentParentId) {
            console.warn('File is already in the selected location');
            return;
        }

        setIsMoving(true);
        try {
            await moveMutation.mutateAsync({
                fileId: file.id.toString(),
                destinationId: destinationId ? destinationId.toString() : null,
            });

            onClose();
        } catch (error) {
            console.error('Failed to move file:', error);
        } finally {
            setIsMoving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FolderSymlink className="h-5 w-5 text-blue-600" />
                        Move "{file?.fileName}"
                    </DialogTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Choose a destination folder for your {file?.fileType === 'folder' ? 'folder' : 'file'}
                    </p>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Current Path Breadcrumb */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Current Location
                        </label>
                        <div className="flex items-center space-x-2 text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                            <Folder className="h-4 w-4 text-blue-500" />
                            <span className="text-gray-600 dark:text-gray-300">
                                {folderPath.map(p => p.name).join(' / ')}
                            </span>
                        </div>
                    </div>

                    {/* Navigation Breadcrumb */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Navigate to Destination
                        </label>
                        <div className="flex items-center space-x-2 text-sm bg-blue-50 dark:bg-blue-950/20 p-2 rounded border border-blue-200 dark:border-blue-800">
                            {folderPath.map((crumb, index) => (
                                <React.Fragment key={crumb.id || 'root'}>
                                    <button
                                        onClick={() => navigateBack(index)}
                                        className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                                        disabled={index === folderPath.length - 1}
                                    >
                                        {crumb.name}
                                    </button>
                                    {index < folderPath.length - 1 && (
                                        <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* Folder List */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Available Folders
                        </label>
                        <div className="border rounded-lg max-h-64 overflow-y-auto bg-white dark:bg-gray-900">
                            {getCurrentFolders().length === 0 ? (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    <Folder className="h-12 w-12 mx-auto mb-2 text-gray-400 dark:text-gray-600" />
                                    <p className="text-sm">No folders available at this location</p>
                                    <p className="text-xs mt-1">Navigate back or create a new folder</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {getCurrentFolders().map((folder) => (
                                        <div
                                            key={folder.id}
                                            className={cn(
                                                "flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors",
                                                selectedFolder === folder.id && "bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500"
                                            )}
                                            onClick={() => setSelectedFolder(folder.id)}
                                            onDoubleClick={() => navigateToFolder(folder)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Folder className="h-5 w-5 text-blue-500" />
                                                <div>
                                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                                        {folder?.fileName}
                                                    </span>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Click to select • Double-click to open
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {selectedFolder === folder.id && (
                                                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        navigateToFolder(folder)
                                                    }}
                                                    className="text-blue-600 hover:text-blue-700"
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
                    <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">Destination Options</h4>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="destination"
                                    checked={!selectedFolder}
                                    onChange={() => setSelectedFolder(null)}
                                    className="text-blue-600"
                                />
                                <span className="text-sm">
                                    Move to current location: <strong>{folderPath[folderPath.length - 1]?.name}</strong>
                                </span>
                            </label>

                            {selectedFolder && (
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="destination"
                                        checked={!!selectedFolder}
                                        readOnly
                                        className="text-blue-600"
                                    />
                                    <span className="text-sm">
                                        Move to selected folder: <strong>{getCurrentFolders().find(f => f.id === selectedFolder)?.fileName}</strong>
                                    </span>
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Warning Message */}
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-white text-xs font-bold">!</span>
                            </div>
                            <div className="text-sm">
                                <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                                    Move Operation
                                </p>
                                <div className="text-yellow-700 dark:text-yellow-300 space-y-1">
                                    <p>• The {file?.fileType === 'folder' ? 'folder' : 'file'} will be moved to the selected location</p>
                                    <p>• All sharing permissions and links will be preserved</p>
                                    <p>• This action can be undone by moving the item back</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isMoving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleMove}
                        disabled={isMoving}
                        className="min-w-20"
                    >
                        {isMoving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Moving...
                            </>
                        ) : (
                            'Move Here'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default MoveDialog;