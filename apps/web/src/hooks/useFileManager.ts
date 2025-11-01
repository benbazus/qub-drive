/* eslint-disable no-console */
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFolder } from '@/context/folder-context';
import fileEndpoint from '@/api/endpoints/file.endpoint';
import { FileFilters, FileItem, FilePagination, PathCrumb } from '@/types/file';
import { setCurrentParentFolder } from '@/utils/parent-folder.utils';

// The state shape for our dialogs, can be defined once here
export type DialogType = 'preview' | 'move' | 'share' | 'rename' | 'delete' | 'details' | 'lock' | 'star' | 'copyFile' | 'download' | 'copyLink';

// The hook
export const useFileManager = () => {
    // State management
    const { getParentFolder, setParentFolder } = useFolder();
    const [layout, setLayout] = useState<'grid' | 'list'>('grid');
    const [sortBy] = useState('name');
    const [sortOrder] = useState<'asc' | 'desc'>('asc');
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'folders' | 'files'>('all');
    const [currentPath, setCurrentPath] = useState<PathCrumb[]>([{ id: null, name: 'Home' }]);
    const [dialogs, setDialogs] = useState({
        preview: { open: false, file: null as FileItem | null },
        move: { open: false, file: null as FileItem | null },
        share: { open: false, file: null as FileItem | null },
        rename: { open: false, file: null as FileItem | null },
        delete: { open: false, file: null as FileItem | null },
        details: { open: false, file: null as FileItem | null },
        lock: { open: false, file: null as FileItem | null },
        star: { open: false, file: null as FileItem | null },
        copyFile: { open: false, file: null as FileItem | null },
        download: { open: false, file: null as FileItem | null },
        copyLink: { open: false, file: null as FileItem | null }
    });

    // Ensure context and currentPath are synchronized
    useEffect(() => {
        console.log("=== CONTEXT SYNC DEBUG ===");
        console.log("getParentFolder from context:", getParentFolder);
        console.log("currentPath:", currentPath);
        console.log("currentPath last item:", currentPath[currentPath.length - 1]);

        // If context is null but currentPath shows we're at root, ensure they match
        const currentFolderId = currentPath[currentPath.length - 1]?.id;
        if (getParentFolder !== currentFolderId) {
            console.log("Syncing context with currentPath - setting to:", currentFolderId);
            setParentFolder(currentFolderId);
        }
    }, [currentPath, getParentFolder, setParentFolder]);

    // Data fetching - Use getParentFolder from context instead of currentPath
    const apiFilters: FileFilters = { search: searchQuery || undefined, parentId: getParentFolder };
    const pagination: FilePagination = { page: 1, limit: 100, sortBy, sortOrder };

    const { data: filesData, isLoading: isLoadingFiles } = useQuery({
        queryKey: ['files', apiFilters, pagination],
        queryFn: () => fileEndpoint.getFileList(apiFilters, pagination),
    });


    const allFiles = Array.isArray(filesData?.files) ? filesData.files : (filesData as unknown as FileItem[]) || [];

    // Memoized filtering
    const finalFilteredFiles = useMemo(() => {
        if (filter === 'all') return allFiles;
        return allFiles.filter((file: { fileType: string; }) => (filter === 'folders' ? file.fileType === 'folder' : file.fileType !== 'folder'));
    }, [allFiles, filter]);

    // Dialog handlers
    const openDialog = (type: DialogType, file: FileItem) => {
        setDialogs(prev => ({ ...prev, [type]: { open: true, file } }));
    };
    const closeDialog = (type: DialogType) => {
        setDialogs(prev => ({ ...prev, [type]: { open: false, file: null } }));
    };

    // Navigation and action handlers
    const openFolder = useCallback((folder: FileItem) => {
        if (folder.fileType !== 'folder' || folder.id === getParentFolder) return;

        // Update both context and persistent storage
        setParentFolder(folder.id);
        setCurrentParentFolder(folder.id);
        setCurrentPath(prev => [...prev, { id: folder.id, name: folder.fileName }]);

        console.log(" 888888888888 setParentFolder 888888888888 ")
        console.log(folder.id)
        console.log("  888888888888 setParentFolder 888888888888 ")
    }, [getParentFolder, setParentFolder]);

    // Enhanced file double-click handler that supports preview for previewable files
    const handleFileDoubleClick = useCallback((file: FileItem) => {


        if (file.fileType === 'folder') {
            openFolder(file);
        } else {
            // Import isPreviewable function dynamically to avoid circular dependency
            // import('@/components/dialogs/FilePreviewDialog').then(({ isPreviewable }) => {
            //     if (isPreviewable(file.fileName)) {
            //         openDialog('preview', file);
            //     } else {
            //         // For non-previewable files, trigger download
            //         openDialog('download', file);
            //     }
            // });
        }
    }, [openFolder]);

    const navigateToBreadcrumb = useCallback((index: number) => {
        const newPath = currentPath.slice(0, index + 1);
        const newFolderId = newPath[newPath.length - 1]?.id;

        setCurrentPath(newPath);
        // Update both context and persistent storage
        setParentFolder(newFolderId);
        setCurrentParentFolder(newFolderId);
    }, [currentPath, setParentFolder]);

    const handleFileAction = useCallback((action: DialogType, file: FileItem) => {

        openDialog(action, file);
    }, []);


    return {
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
    };
};