import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { offlineFileManager, OfflineFileInfo } from '../../services/offlineFileManager'
import { OfflineFileWithMetadata, OfflineStorageStats } from '../../services/storage/offlineStorage'
import { FileItem } from '../../types/file'

export interface OfflineDownloadProgress {
  fileId: string
  fileName: string
  progress: number
  status: 'downloading' | 'completed' | 'failed' | 'cancelled'
  error?: string
}

interface OfflineState {
  // State
  offlineFiles: OfflineFileWithMetadata[]
  downloadProgress: Record<string, OfflineDownloadProgress>
  storageStats: OfflineStorageStats | null
  isInitialized: boolean
  isLoading: boolean
  error: string | null

  // Actions
  initialize: () => Promise<void>
  refreshOfflineFiles: () => Promise<void>
  refreshStorageStats: () => Promise<void>
  downloadFileForOffline: (fileItem: FileItem) => Promise<void>
  downloadMultipleFilesForOffline: (fileItems: FileItem[]) => Promise<void>
  removeFileFromOffline: (fileId: string) => Promise<void>
  clearAllOfflineFiles: () => Promise<void>
  cleanupStorage: (targetFreeSpace?: number) => Promise<void>
  markFileAsAccessed: (fileId: string) => Promise<void>
  markFileAsModified: (fileId: string) => Promise<void>
  getFileWithOfflineStatus: (fileItem: FileItem) => Promise<OfflineFileInfo>
  getFilesWithOfflineStatus: (fileItems: FileItem[]) => Promise<OfflineFileInfo[]>
  isFileAvailableOffline: (fileId: string) => boolean
  getLocalFilePath: (fileId: string) => string | null
  getModifiedFiles: () => Promise<OfflineFileWithMetadata[]>
  validateStorageSpace: (fileSize: number) => Promise<{ canDownload: boolean; message?: string }>
  getStorageUsageByType: () => Promise<Record<string, { size: number; count: number }>>
  
  // Internal actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  updateDownloadProgress: (fileId: string, progress: OfflineDownloadProgress) => void
  removeDownloadProgress: (fileId: string) => void
}

export const useOfflineStore = create<OfflineState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    offlineFiles: [],
    downloadProgress: {},
    storageStats: null,
    isInitialized: false,
    isLoading: false,
    error: null,

    // Actions
    initialize: async () => {
      const { setLoading, setError } = get()
      
      try {
        setLoading(true)
        setError(null)
        
        await offlineFileManager.initialize()
        
        // Load initial data
        await Promise.all([
          get().refreshOfflineFiles(),
          get().refreshStorageStats(),
        ])
        
        set({ isInitialized: true })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize offline storage'
        setError(errorMessage)
        console.error('Failed to initialize offline store:', error)
      } finally {
        setLoading(false)
      }
    },

    refreshOfflineFiles: async () => {
      try {
        const offlineFiles = await offlineFileManager.getOfflineFiles()
        set({ offlineFiles })
      } catch (error) {
        console.error('Failed to refresh offline files:', error)
        get().setError('Failed to load offline files')
      }
    },

    refreshStorageStats: async () => {
      try {
        const storageStats = await offlineFileManager.getStorageStats()
        set({ storageStats })
      } catch (error) {
        console.error('Failed to refresh storage stats:', error)
        get().setError('Failed to load storage statistics')
      }
    },

    downloadFileForOffline: async (fileItem: FileItem) => {
      const { updateDownloadProgress, removeDownloadProgress, refreshOfflineFiles, refreshStorageStats } = get()
      
      try {
        // Initialize progress
        updateDownloadProgress(fileItem.id, {
          fileId: fileItem.id,
          fileName: fileItem.name,
          progress: 0,
          status: 'downloading',
        })

        await offlineFileManager.downloadForOffline(fileItem, {
          onProgress: (progress) => {
            updateDownloadProgress(fileItem.id, {
              fileId: fileItem.id,
              fileName: fileItem.name,
              progress,
              status: 'downloading',
            })
          },
          onSuccess: () => {
            updateDownloadProgress(fileItem.id, {
              fileId: fileItem.id,
              fileName: fileItem.name,
              progress: 100,
              status: 'completed',
            })
            
            // Remove progress after a delay
            setTimeout(() => removeDownloadProgress(fileItem.id), 2000)
          },
          onError: (error) => {
            updateDownloadProgress(fileItem.id, {
              fileId: fileItem.id,
              fileName: fileItem.name,
              progress: 0,
              status: 'failed',
              error: error.message,
            })
            
            // Remove progress after a delay
            setTimeout(() => removeDownloadProgress(fileItem.id), 5000)
          },
        })

        // Refresh data
        await Promise.all([
          refreshOfflineFiles(),
          refreshStorageStats(),
        ])

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Download failed'
        updateDownloadProgress(fileItem.id, {
          fileId: fileItem.id,
          fileName: fileItem.name,
          progress: 0,
          status: 'failed',
          error: errorMessage,
        })
        
        // Remove progress after a delay
        setTimeout(() => removeDownloadProgress(fileItem.id), 5000)
        throw error
      }
    },

    downloadMultipleFilesForOffline: async (fileItems: FileItem[]) => {
      const { updateDownloadProgress, removeDownloadProgress, refreshOfflineFiles, refreshStorageStats } = get()
      
      try {
        // Initialize progress for all files
        fileItems.forEach(fileItem => {
          updateDownloadProgress(fileItem.id, {
            fileId: fileItem.id,
            fileName: fileItem.name,
            progress: 0,
            status: 'downloading',
          })
        })

        await offlineFileManager.downloadMultipleForOffline(fileItems, {
          onProgress: (overallProgress) => {
            // Update progress for all files (simplified)
            fileItems.forEach(fileItem => {
              updateDownloadProgress(fileItem.id, {
                fileId: fileItem.id,
                fileName: fileItem.name,
                progress: overallProgress,
                status: 'downloading',
              })
            })
          },
        })

        // Mark all as completed
        fileItems.forEach(fileItem => {
          updateDownloadProgress(fileItem.id, {
            fileId: fileItem.id,
            fileName: fileItem.name,
            progress: 100,
            status: 'completed',
          })
          
          // Remove progress after a delay
          setTimeout(() => removeDownloadProgress(fileItem.id), 2000)
        })

        // Refresh data
        await Promise.all([
          refreshOfflineFiles(),
          refreshStorageStats(),
        ])

      } catch (error) {
        // Mark all as failed
        fileItems.forEach(fileItem => {
          updateDownloadProgress(fileItem.id, {
            fileId: fileItem.id,
            fileName: fileItem.name,
            progress: 0,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Download failed',
          })
          
          // Remove progress after a delay
          setTimeout(() => removeDownloadProgress(fileItem.id), 5000)
        })
        
        throw error
      }
    },

    removeFileFromOffline: async (fileId: string) => {
      const { refreshOfflineFiles, refreshStorageStats } = get()
      
      try {
        await offlineFileManager.removeFromOffline(fileId)
        
        // Refresh data
        await Promise.all([
          refreshOfflineFiles(),
          refreshStorageStats(),
        ])
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to remove file from offline storage'
        get().setError(errorMessage)
        throw error
      }
    },

    clearAllOfflineFiles: async () => {
      const { refreshOfflineFiles, refreshStorageStats } = get()
      
      try {
        await offlineFileManager.clearAllOfflineFiles()
        
        // Refresh data
        await Promise.all([
          refreshOfflineFiles(),
          refreshStorageStats(),
        ])
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to clear offline files'
        get().setError(errorMessage)
        throw error
      }
    },

    cleanupStorage: async (targetFreeSpace?: number) => {
      const { refreshOfflineFiles, refreshStorageStats } = get()
      
      try {
        await offlineFileManager.cleanupStorage(targetFreeSpace)
        
        // Refresh data
        await Promise.all([
          refreshOfflineFiles(),
          refreshStorageStats(),
        ])
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to cleanup storage'
        get().setError(errorMessage)
        throw error
      }
    },

    markFileAsAccessed: async (fileId: string) => {
      try {
        await offlineFileManager.markFileAsAccessed(fileId)
        // Optionally refresh offline files to update access time
        await get().refreshOfflineFiles()
      } catch (error) {
        console.error('Failed to mark file as accessed:', error)
      }
    },

    markFileAsModified: async (fileId: string) => {
      try {
        await offlineFileManager.markFileAsModified(fileId)
        await get().refreshOfflineFiles()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to mark file as modified'
        get().setError(errorMessage)
        throw error
      }
    },

    getFileWithOfflineStatus: async (fileItem: FileItem): Promise<OfflineFileInfo> => {
      return offlineFileManager.getFileInfoWithOfflineStatus(fileItem)
    },

    getFilesWithOfflineStatus: async (fileItems: FileItem[]): Promise<OfflineFileInfo[]> => {
      return offlineFileManager.getFilesInfoWithOfflineStatus(fileItems)
    },

    isFileAvailableOffline: (fileId: string): boolean => {
      const { offlineFiles } = get()
      return offlineFiles.some(file => file.fileId === fileId)
    },

    getLocalFilePath: (fileId: string): string | null => {
      const { offlineFiles } = get()
      const offlineFile = offlineFiles.find(file => file.fileId === fileId)
      return offlineFile?.localPath || null
    },

    getModifiedFiles: async (): Promise<OfflineFileWithMetadata[]> => {
      return offlineFileManager.getModifiedFiles()
    },

    validateStorageSpace: async (fileSize: number) => {
      return offlineFileManager.validateStorageSpace(fileSize)
    },

    getStorageUsageByType: async () => {
      return offlineFileManager.getStorageUsageByType()
    },

    // Internal actions
    setLoading: (loading: boolean) => {
      set({ isLoading: loading })
    },

    setError: (error: string | null) => {
      set({ error })
    },

    updateDownloadProgress: (fileId: string, progress: OfflineDownloadProgress) => {
      set(state => ({
        downloadProgress: {
          ...state.downloadProgress,
          [fileId]: progress,
        },
      }))
    },

    removeDownloadProgress: (fileId: string) => {
      set(state => {
        const { [fileId]: removed, ...rest } = state.downloadProgress
        return { downloadProgress: rest }
      })
    },
  }))
)

// Selectors for better performance
export const useOfflineFiles = () => useOfflineStore(state => state.offlineFiles)
export const useStorageStats = () => useOfflineStore(state => state.storageStats)
export const useDownloadProgress = () => useOfflineStore(state => state.downloadProgress)
export const useOfflineLoading = () => useOfflineStore(state => state.isLoading)
export const useOfflineError = () => useOfflineStore(state => state.error)
export const useOfflineInitialized = () => useOfflineStore(state => state.isInitialized)

// Action selectors
export const useOfflineActions = () => useOfflineStore(state => ({
  initialize: state.initialize,
  refreshOfflineFiles: state.refreshOfflineFiles,
  refreshStorageStats: state.refreshStorageStats,
  downloadFileForOffline: state.downloadFileForOffline,
  downloadMultipleFilesForOffline: state.downloadMultipleFilesForOffline,
  removeFileFromOffline: state.removeFileFromOffline,
  clearAllOfflineFiles: state.clearAllOfflineFiles,
  cleanupStorage: state.cleanupStorage,
  markFileAsAccessed: state.markFileAsAccessed,
  markFileAsModified: state.markFileAsModified,
  getFileWithOfflineStatus: state.getFileWithOfflineStatus,
  getFilesWithOfflineStatus: state.getFilesWithOfflineStatus,
  isFileAvailableOffline: state.isFileAvailableOffline,
  getLocalFilePath: state.getLocalFilePath,
  getModifiedFiles: state.getModifiedFiles,
  validateStorageSpace: state.validateStorageSpace,
  getStorageUsageByType: state.getStorageUsageByType,
}))

export default useOfflineStore