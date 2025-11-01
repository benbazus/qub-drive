import { useState, useCallback, useEffect } from 'react'
import { uploadManager, UploadQueueItem } from '@/services/uploadManager'
import { uploadQueueStore, UploadStats } from '@/stores/uploadQueue/uploadQueueStore'
import { FileItem } from '@/types/file'

export interface UseFileUploadOptions {
  onProgress?: (item: UploadQueueItem) => void
  onComplete?: (item: UploadQueueItem) => void
  onError?: (item: UploadQueueItem, error: Error) => void
  onAllComplete?: (results: FileItem[]) => void
}

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([])
  const [uploadStats, setUploadStats] = useState<UploadStats>(uploadQueueStore.getState().getStats())
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize upload manager
  useEffect(() => {
    const initializeManager = async () => {
      try {
        await uploadManager.initialize({
          maxConcurrentUploads: 3,
          enableBackgroundUploads: true,
          enableNotifications: true,
          retryOnNetworkReconnect: true,
          maxRetries: 3
        })
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize upload manager:', error)
      }
    }

    initializeManager()
  }, [])

  // Subscribe to upload queue changes
  useEffect(() => {
    const unsubscribe = uploadQueueStore.subscribe((state) => {
      setUploadQueue(state.queue)
      setUploadStats(state.getStats())
      
      // Trigger callbacks for completed/failed uploads
      state.queue.forEach(item => {
        if (item.status === 'completed' && item.result) {
          options.onComplete?.(item)
        } else if (item.status === 'failed' && item.error) {
          options.onError?.(item, new Error(item.error))
        }
      })
    })

    // Initial load
    setUploadQueue(uploadQueueStore.getState().queue)
    setUploadStats(uploadQueueStore.getState().getStats())

    return unsubscribe
  }, [options, options.onComplete, options.onError])

  const addToQueue = useCallback(async (files: {
    uri: string
    fileName: string
    size: number
    parentId?: string
  }[]) => {
    if (!isInitialized) {
      throw new Error('Upload manager not initialized')
    }

    try {
      const uploadIds = await uploadManager.addToQueue(files)
      return uploadIds
    } catch (error) {
      console.error('Failed to add files to upload queue:', error)
      throw error
    }
  }, [isInitialized])

  const pauseUpload = useCallback(async (uploadId: string) => {
    try {
      await uploadManager.pauseUpload(uploadId)
    } catch (error) {
      console.error('Failed to pause upload:', error)
      throw error
    }
  }, [])

  const resumeUpload = useCallback(async (uploadId: string) => {
    try {
      await uploadManager.resumeUpload(uploadId)
    } catch (error) {
      console.error('Failed to resume upload:', error)
      throw error
    }
  }, [])

  const cancelUpload = useCallback(async (uploadId: string) => {
    try {
      await uploadManager.cancelUpload(uploadId)
    } catch (error) {
      console.error('Failed to cancel upload:', error)
      throw error
    }
  }, [])

  const retryUpload = useCallback(async (uploadId: string) => {
    try {
      await uploadManager.retryUpload(uploadId)
    } catch (error) {
      console.error('Failed to retry upload:', error)
      throw error
    }
  }, [])

  const clearCompleted = useCallback(async () => {
    try {
      await uploadManager.clearCompleted()
    } catch (error) {
      console.error('Failed to clear completed uploads:', error)
      throw error
    }
  }, [])

  const clearAll = useCallback(async () => {
    try {
      await uploadManager.clearAll()
    } catch (error) {
      console.error('Failed to clear all uploads:', error)
      throw error
    }
  }, [])

  const getNetworkStatus = useCallback(() => {
    return uploadManager.getNetworkStatus()
  }, [])

  const hasActiveUploads = useCallback(() => {
    return uploadManager.hasActiveUploads()
  }, [])

  return {
    // State
    uploadQueue,
    uploadStats,
    isInitialized,
    
    // Actions
    addToQueue,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
    clearCompleted,
    clearAll,
    
    // Utils
    getNetworkStatus,
    hasActiveUploads,
  }
}

export default useFileUpload