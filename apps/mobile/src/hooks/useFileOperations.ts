import { useState, useCallback, useRef } from 'react'
import { fileOperations, FileOperationCallbacks, UploadFileOptions, CreateFolderOptions, ValidationOptions } from '@/services/fileOperations'
import { FileItem, UploadProgress, UploadQueueItem } from '@/types/file'

export interface UseFileOperationsOptions {
  onSuccess?: (result: FileItem | { action: string; [key: string]: unknown }) => void
  onError?: (error: Error) => void
  autoRefresh?: boolean
}

export interface UseFileOperationsReturn {
  // State
  isUploading: boolean
  isCreating: boolean
  uploadQueue: UploadQueueItem[]
  uploadProgress: Record<string, UploadProgress>
  
  // File operations
  uploadFile: (uri: string, fileName: string, options?: UploadFileOptions) => Promise<FileItem>
  uploadMultipleFiles: (files: { uri: string; fileName: string }[], options?: UploadFileOptions) => Promise<FileItem[]>
  pickAndUploadFiles: (options?: UploadFileOptions & { allowMultiple?: boolean }) => Promise<FileItem[]>
  pickAndUploadImage: (source: 'camera' | 'gallery', options?: UploadFileOptions) => Promise<FileItem | null>
  
  // Folder operations
  createFolder: (name: string, parentId?: string, options?: Omit<CreateFolderOptions, 'name' | 'parentId'>) => Promise<FileItem>
  
  // File management
  deleteFile: (fileId: string, fileName: string, skipConfirmation?: boolean) => Promise<void>
  moveToTrash: (itemId: string) => Promise<void>
  restoreFromTrash: (itemId: string) => Promise<void>
  moveItem: (itemId: string, newParentId?: string) => Promise<void>
  copyItem: (itemId: string, newParentId?: string, newName?: string) => Promise<FileItem>
  
  // Starring
  toggleStar: (itemId: string, isStarred: boolean) => Promise<void>
  
  // Download
  downloadFile: (fileId: string, fileName: string) => Promise<string>
  
  // Sharing
  shareFile: (fileId: string, userIds: string[], role?: 'viewer' | 'editor' | 'owner') => Promise<void>
  createSharingLink: (fileId: string, accessLevel?: 'view' | 'edit') => Promise<string>
  revokeSharingLink: (fileId: string) => Promise<void>
  
  // Queue management
  pauseUpload: (uploadId: string) => void
  resumeUpload: (uploadId: string) => void
  cancelUpload: (uploadId: string) => void
  clearQueue: () => void
  retryFailedUploads: () => Promise<void>
  
  // Utilities
  validateFile: (file: { size: number; name: string; type?: string }, options?: ValidationOptions) => { valid: boolean; error?: string }
  formatFileSize: (bytes: number) => string
}

export const useFileOperations = (options: UseFileOperationsOptions = {}): UseFileOperationsReturn => {
  const { onSuccess, onError } = options
  
  // State
  const [isUploading, setIsUploading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({})
  
  // Refs for managing uploads
  const uploadControllers = useRef<Record<string, AbortController>>({})
  const pausedUploads = useRef<Set<string>>(new Set())

  // Helper to create callbacks
  const createCallbacks = useCallback((uploadId?: string): FileOperationCallbacks => ({
    onStart: () => {
      setIsUploading(true)
    },
    onProgress: (progress: UploadProgress) => {
      if (uploadId) {
        setUploadProgress(prev => ({
          ...prev,
          [uploadId]: progress,
        }))
        
        // Update queue item
        setUploadQueue(prev => prev.map(item => 
          item.id === uploadId 
            ? { ...item, progress }
            : item
        ))
      }
    },
    onSuccess: (result) => {
      if (uploadId) {
        // Remove from queue
        setUploadQueue(prev => prev.filter(item => item.id !== uploadId))
        setUploadProgress(prev => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [uploadId]: _, ...rest } = prev
          return rest
        })
        delete uploadControllers.current[uploadId]
      }
      
      onSuccess?.(result)
      
      // Check if all uploads are complete
      setUploadQueue(prev => {
        if (prev.length <= 1) {
          setIsUploading(false)
        }
        return prev
      })
    },
    onError: (error) => {
      if (uploadId) {
        // Update queue item with error
        setUploadQueue(prev => prev.map(item => 
          item.id === uploadId 
            ? { 
                ...item, 
                progress: { ...item.progress, status: 'failed', error: error.message },
                retryCount: item.retryCount + 1
              }
            : item
        ))
      }
      
      onError?.(error)
      setIsUploading(false)
    },
    onComplete: () => {
      // This will be handled in onSuccess or onError
    },
  }), [onSuccess, onError])

  // Upload file
  const uploadFile = useCallback(async (
    uri: string, 
    fileName: string, 
    options: UploadFileOptions = {}
  ): Promise<FileItem> => {
    const uploadId = `upload_${Date.now()}_${Math.random()}`
    const controller = new AbortController()
    uploadControllers.current[uploadId] = controller

    // Add to queue
    const queueItem: UploadQueueItem = {
      id: uploadId,
      file: { uri, name: fileName, size: 0 },
      parentId: options.parentId || undefined,
      progress: {
        id: uploadId,
        fileName,
        progress: 0,
        status: 'pending',
      },
      retryCount: 0,
      maxRetries: 3,
    }
    
    setUploadQueue(prev => [...prev, queueItem])

    try {
      const result = await fileOperations.uploadFileFromUri(uri, fileName, {
        ...options,
        callbacks: createCallbacks(uploadId),
        signal: controller.signal,
      })
      
      return result
    } catch (error) {
      // Error handling is done in callbacks
      throw error
    }
  }, [createCallbacks])

  // Upload multiple files
  const uploadMultipleFiles = useCallback(async (
    files: { uri: string; fileName: string }[],
    options: UploadFileOptions = {}
  ): Promise<FileItem[]> => {
    const uploadPromises = files.map(({ uri, fileName }) => 
      uploadFile(uri, fileName, options)
    )
    
    return Promise.allSettled(uploadPromises).then(results => 
      results
        .filter((result): result is PromiseFulfilledResult<FileItem> => result.status === 'fulfilled')
        .map(result => result.value)
    )
  }, [uploadFile])

  // Pick and upload files
  const pickAndUploadFiles = useCallback(async (
    options: UploadFileOptions & { allowMultiple?: boolean } = {}
  ): Promise<FileItem[]> => {
    try {
      return await fileOperations.pickAndUploadFiles(options)
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to pick and upload files'))
      return []
    }
  }, [createCallbacks, onError])

  // Pick and upload image
  const pickAndUploadImage = useCallback(async (
    source: 'camera' | 'gallery',
    options: UploadFileOptions = {}
  ): Promise<FileItem | null> => {
    try {
      return await fileOperations.pickAndUploadImage({
        source,
        ...options,
      })
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to pick and upload image'))
      return null
    }
  }, [onError])

  // Create folder
  const createFolder = useCallback(async (
    name: string,
    parentId?: string,
    options: Omit<CreateFolderOptions, 'name' | 'parentId'> = {}
  ): Promise<FileItem> => {
    setIsCreating(true)
    try {
      const result = await fileOperations.createFolder({
        name,
        parentId: parentId || null,
        ...options,
      })
      onSuccess?.(result)
      return result
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to create folder'))
      throw error
    } finally {
      setIsCreating(false)
    }
  }, [onSuccess, onError])

  // Delete file
  const deleteFile = useCallback(async (
    fileId: string,
    fileName: string,
    skipConfirmation: boolean = false
  ): Promise<void> => {
    try {
      await fileOperations.deleteFile(fileId, fileName, skipConfirmation)
      onSuccess?.({ action: 'delete', fileId, fileName })
    } catch (error) {
      if (error instanceof Error && error.message !== 'User cancelled deletion') {
        onError?.(error)
      }
      throw error
    }
  }, [onSuccess, onError])

  // Move to trash
  const moveToTrash = useCallback(async (itemId: string): Promise<void> => {
    try {
      await fileOperations.moveToTrash(itemId)
      onSuccess?.({ action: 'moveToTrash', itemId })
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to move to trash'))
      throw error
    }
  }, [onSuccess, onError])

  // Restore from trash
  const restoreFromTrash = useCallback(async (itemId: string): Promise<void> => {
    try {
      await fileOperations.restoreFromTrash(itemId)
      onSuccess?.({ action: 'restore', itemId })
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to restore from trash'))
      throw error
    }
  }, [onSuccess, onError])

  // Move item
  const moveItem = useCallback(async (itemId: string, newParentId?: string): Promise<void> => {
    try {
      await fileOperations.moveItem(itemId, newParentId)
      onSuccess?.({ action: 'move', itemId, newParentId })
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to move item'))
      throw error
    }
  }, [onSuccess, onError])

  // Copy item
  const copyItem = useCallback(async (
    itemId: string,
    newParentId?: string,
    newName?: string
  ): Promise<FileItem> => {
    try {
      const result = await fileOperations.copyItem(itemId, newParentId, newName)
      onSuccess?.(result)
      return result
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to copy item'))
      throw error
    }
  }, [onSuccess, onError])

  // Toggle star
  const toggleStar = useCallback(async (itemId: string, isStarred: boolean): Promise<void> => {
    try {
      await fileOperations.toggleStar(itemId, isStarred)
      onSuccess?.({ action: 'toggleStar', itemId, isStarred: !isStarred })
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to toggle star'))
      throw error
    }
  }, [onSuccess, onError])

  // Download file
  const downloadFile = useCallback(async (fileId: string, fileName: string): Promise<string> => {
    try {
      const localUri = await fileOperations.downloadFile(fileId, fileName)
      onSuccess?.({ action: 'download', fileId, fileName, localUri })
      return localUri
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to download file'))
      throw error
    }
  }, [onSuccess, onError])

  // Share file
  const shareFile = useCallback(async (
    fileId: string,
    userIds: string[],
    role: 'viewer' | 'editor' | 'owner' = 'viewer'
  ): Promise<void> => {
    try {
      await fileOperations.shareFile(fileId, userIds, role)
      onSuccess?.({ action: 'share', fileId, userIds, role })
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to share file'))
      throw error
    }
  }, [onSuccess, onError])

  // Create sharing link
  const createSharingLink = useCallback(async (
    fileId: string,
    accessLevel: 'view' | 'edit' = 'view'
  ): Promise<string> => {
    try {
      const link = await fileOperations.createSharingLink(fileId, accessLevel)
      onSuccess?.({ action: 'createSharingLink', fileId, link, accessLevel })
      return link
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to create sharing link'))
      throw error
    }
  }, [onSuccess, onError])

  // Revoke sharing link
  const revokeSharingLink = useCallback(async (fileId: string): Promise<void> => {
    try {
      await fileOperations.revokeSharingLink(fileId)
      onSuccess?.({ action: 'revokeSharingLink', fileId })
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to revoke sharing link'))
      throw error
    }
  }, [onSuccess, onError])

  // Queue management
  const pauseUpload = useCallback((uploadId: string) => {
    pausedUploads.current.add(uploadId)
    uploadControllers.current[uploadId]?.abort()
    
    setUploadQueue(prev => prev.map(item => 
      item.id === uploadId 
        ? { ...item, progress: { ...item.progress, status: 'paused' } }
        : item
    ))
  }, [])

  const resumeUpload = useCallback(async (uploadId: string) => {
    pausedUploads.current.delete(uploadId)
    
    const queueItem = uploadQueue.find(item => item.id === uploadId)
    if (queueItem) {
      // Restart the upload
      try {
        await uploadFile(queueItem.file.uri, queueItem.file.name, {
          parentId: queueItem.parentId || null,
        })
      } catch (error) {
        console.error('Failed to resume upload:', error)
      }
    }
  }, [uploadQueue, uploadFile])

  const cancelUpload = useCallback((uploadId: string) => {
    uploadControllers.current[uploadId]?.abort()
    delete uploadControllers.current[uploadId]
    pausedUploads.current.delete(uploadId)
    
    setUploadQueue(prev => prev.filter(item => item.id !== uploadId))
    setUploadProgress(prev => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [uploadId]: _, ...rest } = prev
      return rest
    })
  }, [])

  const clearQueue = useCallback(() => {
    // Cancel all uploads
    Object.values(uploadControllers.current).forEach(controller => controller.abort())
    uploadControllers.current = {}
    pausedUploads.current.clear()
    
    setUploadQueue([])
    setUploadProgress({})
    setIsUploading(false)
  }, [])

  const retryFailedUploads = useCallback(async () => {
    const failedUploads = uploadQueue.filter(item => 
      item.progress.status === 'failed' && item.retryCount < item.maxRetries
    )
    
    for (const item of failedUploads) {
      try {
        await uploadFile(item.file.uri, item.file.name, {
          parentId: item.parentId || null,
        })
      } catch (error) {
        console.error(`Failed to retry upload for ${item.file.name}:`, error)
      }
    }
  }, [uploadQueue, uploadFile])

  // Utility functions
  const validateFile = useCallback((
    file: { size: number; name: string; type?: string },
    options?: any
  ) => {
    return fileOperations.validateFile(file, options)
  }, [])

  const formatFileSize = useCallback((bytes: number) => {
    return fileOperations.formatFileSize(bytes)
  }, [])

  return {
    // State
    isUploading,
    isCreating,
    uploadQueue,
    uploadProgress,
    
    // File operations
    uploadFile,
    uploadMultipleFiles,
    pickAndUploadFiles,
    pickAndUploadImage,
    
    // Folder operations
    createFolder,
    
    // File management
    deleteFile,
    moveToTrash,
    restoreFromTrash,
    moveItem,
    copyItem,
    
    // Starring
    toggleStar,
    
    // Download
    downloadFile,
    
    // Sharing
    shareFile,
    createSharingLink,
    revokeSharingLink,
    
    // Queue management
    pauseUpload,
    resumeUpload,
    cancelUpload,
    clearQueue,
    retryFailedUploads,
    
    // Utilities
    validateFile,
    formatFileSize,
  }
}

export default useFileOperations