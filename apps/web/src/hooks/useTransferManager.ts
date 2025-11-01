
import { useState, useCallback } from 'react'
import { fileEndPoint } from '@/api/endpoints/file.endpoint'
import { useFileQueryInvalidation } from './useFileQueryInvalidation'

type TransferStatus = 'active' | 'paused' | 'completed' | 'failed' | 'pending'

interface FileTransfer {
    id: string
    name: string
    size: number
    progress: number
    status: TransferStatus
    type: 'upload' | 'download'
    speed: number
    timeRemaining: number
    fileType?: string
    error?: string
}

export const useTransferManager = () => {
    const [transfers, setTransfers] = useState<FileTransfer[]>([])
    const { invalidateFileQueries } = useFileQueryInvalidation()

    // Remove simulation - real uploads will handle progress updates via callbacks

    const addFilesForUpload = useCallback((files: File[], currentFolder?: { id: string | null } | null) => {
        const newTransfers = files.map((file) => {
            const transferId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const transfer: FileTransfer = {
                id: transferId,
                name: file.name,
                size: file.size,
                progress: 0,
                status: 'active',
                type: 'upload',
                speed: 0,
                timeRemaining: 0,
                fileType: file.type.startsWith('image/')
                    ? 'image'
                    : file.name.split('.').pop()?.toLowerCase(),
            };



            // Start the upload immediately
            fileEndPoint.uploadFile(file, currentFolder, {
                onProgress: (progress) => {
                    setTransfers((prev) =>
                        prev.map((t) =>
                            t.id === transferId ? {
                                ...t,
                                progress: progress.percentage,
                                speed: progress.loaded,
                            } : t
                        )
                    );
                },
                onSuccess: () => {
                    setTransfers((prev) =>
                        prev.map((t) =>
                            t.id === transferId ? {
                                ...t,
                                status: 'completed',
                                progress: 100,
                                speed: 0,
                                timeRemaining: 0,
                            } : t
                        )
                    );

                    // Invalidate all file-related queries for immediate UI updates
                    invalidateFileQueries(currentFolder);
                },
                onError: (error: any) => {
                    const errorMessage = error?.message || error?.toString() || 'Upload failed';
                    setTransfers((prev) =>
                        prev.map((t) =>
                            t.id === transferId ? {
                                ...t,
                                status: 'failed',
                                error: errorMessage,
                                speed: 0,
                                timeRemaining: 0,
                            } : t
                        )
                    );
                    console.error(`Upload failed for ${file.name}:`, error);
                },
            });

            return transfer;
        });

        setTransfers((prev) => [...prev, ...newTransfers]);
    }, [invalidateFileQueries])

    const addFolderForUpload = useCallback(
        (fileList: FileList, currentFolder?: { id: string | null } | null) => {
            const files = Array.from(fileList)
            addFilesForUpload(files, currentFolder)
        },
        [addFilesForUpload]
    )

    const addDownload = useCallback(
        (transferInfo: {
            id: string
            name: string
            size: number
            fileType?: string
        }) => {
            const newTransfer: FileTransfer = {
                ...transferInfo,
                progress: 0,
                status: 'active',
                type: 'download',
                speed: Math.random() * 800000 + 200000,
                timeRemaining: Math.random() * 240 + 60,
            }
            setTransfers((prev) => [...prev, newTransfer])
        },
        []
    )

    const pauseAll = useCallback(() => {
        setTransfers((prev) =>
            prev.map((t) =>
                ['active', 'pending'].includes(t.status)
                    ? { ...t, status: 'paused' }
                    : t
            )
        )
    }, [])

    const cancelTransfer = useCallback(async (transferId: string) => {
        // Remove the transfer from the list
        setTransfers((prev) => prev.filter((t) => t.id !== transferId));

        // TODO: Implement server-side upload cancellation if needed
        // This would require storing upload IDs and making API calls to cancel
    }, []);

    const cancelAll = useCallback(async () => {
        // Remove all active, pending, and paused transfers
        setTransfers((prev) =>
            prev.filter((t) => !['active', 'pending', 'paused'].includes(t.status))
        );

        // TODO: Implement server-side cancellation for active uploads
        // This would require iterating through active transfers and cancelling each upload
    }, [])

    const clearDownloads = useCallback(() => {
        setTransfers((prev) => prev.filter((t) => t.type !== 'download'))
    }, [])

    const restartAll = useCallback(() => {
        setTransfers((prev) =>
            prev.map((t) =>
                t.status === 'failed'
                    ? {
                        ...t,
                        status: 'active',
                        progress: 0,
                        error: undefined,
                    }
                    : t
            )
        )
    }, [])

    const removeTransfer = useCallback((id: string) => {
        setTransfers((prev) => prev.filter((t) => t.id !== id))
    }, [])

    const pauseTransfer = useCallback((id: string) => {
        setTransfers((prev) =>
            prev.map((t) =>
                t.id === id ? { ...t, status: 'paused' } : t
            )
        )
    }, [])

    const resumeTransfer = useCallback((id: string) => {
        setTransfers((prev) =>
            prev.map((t) =>
                t.id === id ? { ...t, status: 'active' } : t
            )
        )
    }, [])

    const retryTransfer = useCallback((id: string) => {
        setTransfers((prev) =>
            prev.map((t) =>
                t.id === id
                    ? {
                        ...t,
                        status: 'active',
                        progress: 0,
                        error: undefined,
                    }
                    : t
            )
        )
    }, [])

    return {
        transfers,
        addFilesForUpload,
        addFolderForUpload,
        addDownload,
        pauseAll,
        cancelAll,
        cancelTransfer,
        clearDownloads,
        restartAll,
        removeTransfer,
        pauseTransfer,
        resumeTransfer,
        retryTransfer,
    }
}
