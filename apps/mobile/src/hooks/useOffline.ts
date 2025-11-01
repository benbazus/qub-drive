import { useEffect, useState, useCallback } from 'react'
import { FileItem } from '@/types/file'
import { useOfflineStore, useOfflineActions } from '../stores/offline/offlineStore'
import { OfflineFileWithMetadata } from '../services/storage/offlineStorage'
import { OfflineFileInfo } from '../services/offlineFileManager'

export interface UseOfflineOptions {
  autoInitialize?: boolean
  refreshOnMount?: boolean
}

export interface UseOfflineReturn {
  // State
  offlineFiles: OfflineFileWithMetadata[]
  isLoading: boolean
  error: string | null
  isInitialized: boolean
  storageStats: any
  downloadProgress: Record<string, unknown>

  // Actions
  initialize: () => Promise<void>
  downloadFile: (file: FileItem) => Promise<void>
  downloadMultipleFiles: (files: FileItem[]) => Promise<void>
  removeFile: (fileId: string) => Promise<void>
  clearAllFiles: () => Promise<void>
  cleanupStorage: (targetFreeSpace?: number) => Promise<void>
  refreshFiles: () => Promise<void>
  refreshStats: () => Promise<void>

  // Utilities
  isFileAvailableOffline: (fileId: string) => boolean
  getLocalFilePath: (fileId: string) => string | null
  getFileWithOfflineStatus: (file: FileItem) => Promise<OfflineFileInfo>
  getFilesWithOfflineStatus: (files: FileItem[]) => Promise<OfflineFileInfo[]>
  markFileAsAccessed: (fileId: string) => Promise<void>
  markFileAsModified: (fileId: string) => Promise<void>
  validateStorageSpace: (fileSize: number) => Promise<{ canDownload: boolean; message?: string }>
}

export const useOffline = (options: UseOfflineOptions = {}): UseOfflineReturn => {
  const {
    autoInitialize = true,
    refreshOnMount = true,
  } = options

  const store = useOfflineStore()
  const actions = useOfflineActions()

  useEffect(() => {
    if (autoInitialize && !store.isInitialized) {
      actions.initialize()
    }
  }, [autoInitialize, store.isInitialized, actions.initialize])

  useEffect(() => {
    if (refreshOnMount && store.isInitialized) {
      actions.refreshOfflineFiles()
      actions.refreshStorageStats()
    }
  }, [refreshOnMount, store.isInitialized])

  return {
    // State
    offlineFiles: store.offlineFiles,
    isLoading: store.isLoading,
    error: store.error,
    isInitialized: store.isInitialized,
    storageStats: store.storageStats,
    downloadProgress: store.downloadProgress,

    // Actions
    initialize: actions.initialize,
    downloadFile: actions.downloadFileForOffline,
    downloadMultipleFiles: actions.downloadMultipleFilesForOffline,
    removeFile: actions.removeFileFromOffline,
    clearAllFiles: actions.clearAllOfflineFiles,
    cleanupStorage: actions.cleanupStorage,
    refreshFiles: actions.refreshOfflineFiles,
    refreshStats: actions.refreshStorageStats,

    // Utilities
    isFileAvailableOffline: actions.isFileAvailableOffline,
    getLocalFilePath: actions.getLocalFilePath,
    getFileWithOfflineStatus: actions.getFileWithOfflineStatus,
    getFilesWithOfflineStatus: actions.getFilesWithOfflineStatus,
    markFileAsAccessed: actions.markFileAsAccessed,
    markFileAsModified: actions.markFileAsModified,
    validateStorageSpace: actions.validateStorageSpace,
  }
}

export interface UseOfflineFileOptions {
  file: FileItem
  autoCheck?: boolean
}

export interface UseOfflineFileReturn {
  isAvailableOffline: boolean
  isDownloading: boolean
  downloadProgress: number
  syncStatus: 'synced' | 'modified' | 'conflict' | null
  localPath: string | null
  downloadedAt: Date | null
  accessedAt: Date | null
  
  download: () => Promise<void>
  remove: () => Promise<void>
  markAsAccessed: () => Promise<void>
  markAsModified: () => Promise<void>
  refresh: () => Promise<void>
}

export const useOfflineFile = (options: UseOfflineFileOptions): UseOfflineFileReturn => {
  const { file, autoCheck = true } = options
  const { downloadProgress, isFileAvailableOffline, getLocalFilePath } = useOffline()
  const actions = useOfflineActions()

  const [fileInfo, setFileInfo] = useState<OfflineFileInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const currentProgress = downloadProgress[file.id]
  const isDownloading = currentProgress?.status === 'downloading'

  const refreshFileInfo = useCallback(async () => {
    if (!autoCheck) return

    try {
      setIsLoading(true)
      const info = await actions.getFileWithOfflineStatus(file)
      setFileInfo(info)
    } catch (error) {
      console.error('Failed to refresh file info:', error)
    } finally {
      setIsLoading(false)
    }
  }, [file, autoCheck, actions.getFileWithOfflineStatus])

  useEffect(() => {
    refreshFileInfo()
  }, [refreshFileInfo])

  const download = useCallback(async () => {
    await actions.downloadFileForOffline(file)
    await refreshFileInfo()
  }, [file, actions.downloadFileForOffline, refreshFileInfo])

  const remove = useCallback(async () => {
    await actions.removeFileFromOffline(file.id)
    await refreshFileInfo()
  }, [file.id, actions.removeFileFromOffline, refreshFileInfo])

  const markAsAccessed = useCallback(async () => {
    await actions.markFileAsAccessed(file.id)
    await refreshFileInfo()
  }, [file.id, actions.markFileAsAccessed, refreshFileInfo])

  const markAsModified = useCallback(async () => {
    await actions.markFileAsModified(file.id)
    await refreshFileInfo()
  }, [file.id, actions.markFileAsModified, refreshFileInfo])

  return {
    isAvailableOffline: fileInfo?.isOfflineAvailable || false,
    isDownloading,
    downloadProgress: currentProgress?.progress || 0,
    syncStatus: fileInfo?.syncStatus || null,
    localPath: fileInfo?.localPath || null,
    downloadedAt: fileInfo?.downloadedAt || null,
    accessedAt: fileInfo?.accessedAt || null,
    
    download,
    remove,
    markAsAccessed,
    markAsModified,
    refresh: refreshFileInfo,
  }
}

export default useOffline