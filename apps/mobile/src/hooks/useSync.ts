import { useEffect, useState, useCallback } from 'react'
import { syncService, SyncStatus, SyncProgress, SyncResult, SyncConflict } from '../services/syncService'
import { offlineStorage } from '../services/storage/offlineStorage'

export interface UseSyncOptions {
  autoStart?: boolean
  enableAutoSync?: boolean
}

export interface UseSyncReturn {
  // Status
  syncStatus: SyncStatus
  isOnline: boolean
  isSyncing: boolean
  lastSyncTime?: Date | undefined
  pendingFiles: number
  conflictFiles: number
  failedFiles: number

  // Progress tracking
  syncProgress: SyncProgress[]
  syncResult: SyncResult | null
  conflicts: SyncConflict[]

  // Actions
  startSync: (forceSync?: boolean) => Promise<SyncResult>
  startAutoSync: () => void
  stopAutoSync: () => void
  resolveConflict: (conflict: SyncConflict, resolution: 'local' | 'remote' | 'merge') => Promise<void>
  registerConflictResolver: (fileId: string, resolver: (conflict: SyncConflict) => Promise<'local' | 'remote' | 'merge' | 'manual'>) => void
  unregisterConflictResolver: (fileId: string) => void
  forceSyncWithRetry: (maxRetries?: number) => Promise<SyncResult>

  // Utilities
  clearProgress: () => void
  clearResult: () => void
  clearConflicts: () => void
}

export const useSync = (options: UseSyncOptions = {}): UseSyncReturn => {
  const { autoStart = false, enableAutoSync = true } = options

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: false,
    isSyncing: false,
    pendingFiles: 0,
    conflictFiles: 0,
    failedFiles: 0,
  })
  const [syncProgress, setSyncProgress] = useState<SyncProgress[]>([])
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [conflicts, setConflicts] = useState<SyncConflict[]>([])

  // Subscribe to sync status changes
  useEffect(() => {
    const unsubscribe = syncService.addStatusListener(setSyncStatus)
    
    // Get initial status
    syncService.getSyncStatus().then(setSyncStatus).catch(console.error)
    
    return unsubscribe
  }, [])

  // Auto-start sync and auto-sync
  useEffect(() => {
    if (enableAutoSync) {
      syncService.startAutoSync()
    }

    return () => {
      if (enableAutoSync) {
        syncService.stopAutoSync()
      }
    }
  }, [enableAutoSync])

  const startSync = useCallback(async (forceSync = false): Promise<SyncResult> => {
    setSyncProgress([])
    setSyncResult(null)
    setConflicts([])

    try {
      const result = await syncService.syncAll({
        forceSync,
        onProgress: (progress) => {
          setSyncProgress(prev => {
            const existing = prev.find(p => p.fileId === progress.fileId)
            if (existing) {
              return prev.map(p => p.fileId === progress.fileId ? progress : p)
            }
            return [...prev, progress]
          })

          // Track conflicts
          if (progress.conflict) {
            setConflicts(prev => {
              const existing = prev.find(c => c.fileId === progress.conflict!.fileId)
              if (!existing) {
                return [...prev, progress.conflict!]
              }
              return prev
            })
          }
        },
        onConflict: async (conflict) => {
          setConflicts(prev => {
            const existing = prev.find(c => c.fileId === conflict.fileId)
            if (!existing) {
              return [...prev, conflict]
            }
            return prev
          })
          return 'manual' // Let user resolve manually
        },
        onComplete: (result) => {
          setSyncResult(result)
        },
        onError: (error) => {
          console.error('Sync error:', error)
          throw error
        }
      })

      return result
    } catch (error) {
      console.error('Sync failed:', error)
      throw error
    }
  }, [])

  // Auto-start sync when conditions are met
  useEffect(() => {
    if (autoStart && syncStatus.isOnline && !syncStatus.isSyncing) {
      startSync(false).catch(console.error)
    }
  }, [autoStart, syncStatus.isOnline, syncStatus.isSyncing, startSync])

  const startAutoSync = useCallback(() => {
    syncService.startAutoSync()
  }, [])

  const stopAutoSync = useCallback(() => {
    syncService.stopAutoSync()
  }, [])

  const resolveConflict = useCallback(async (
    conflict: SyncConflict,
    resolution: 'local' | 'remote' | 'merge'
  ): Promise<void> => {
    try {
      // Get the actual offline file
      const offlineFile = await offlineStorage.getOfflineFile(conflict.fileId)
      if (!offlineFile) {
        throw new Error('Offline file not found')
      }

      // Apply resolution through sync service
      await syncService.syncFile(offlineFile, {
        resolveConflicts: resolution === 'merge' ? 'local' : resolution,
        onProgress: (_progress) => {
          setSyncProgress(prev => prev.map(p => 
            p.fileId === conflict.fileId 
                ? { ...p, status: 'completed', progress: 100 }
                : p
          ))
        }
      })

      // Remove conflict from list
      setConflicts(prev => prev.filter(c => c.fileId !== conflict.fileId))

    } catch (error) {
      console.error('Failed to resolve conflict:', error)
      throw error
    }
  }, [])

  const registerConflictResolver = useCallback((
    fileId: string,
    resolver: (conflict: SyncConflict) => Promise<'local' | 'remote' | 'merge' | 'manual'>
  ) => {
    syncService.registerConflictResolver(fileId, resolver)
  }, [])

  const unregisterConflictResolver = useCallback((fileId: string) => {
    syncService.unregisterConflictResolver(fileId)
  }, [])

  const forceSyncWithRetry = useCallback(async (maxRetries?: number): Promise<SyncResult> => {
    setSyncProgress([])
    setSyncResult(null)
    setConflicts([])

    try {
      const result = await syncService.forceSyncWithRetry(maxRetries)
      setSyncResult(result)
      return result
    } catch (error) {
      console.error('Force sync with retry failed:', error)
      throw error
    }
  }, [])

  const clearProgress = useCallback(() => {
    setSyncProgress([])
  }, [])

  const clearResult = useCallback(() => {
    setSyncResult(null)
  }, [])

  const clearConflicts = useCallback(() => {
    setConflicts([])
  }, [])

  return {
    // Status
    syncStatus,
    isOnline: syncStatus.isOnline,
    isSyncing: syncStatus.isSyncing,
    lastSyncTime: syncStatus.lastSyncTime,
    pendingFiles: syncStatus.pendingFiles,
    conflictFiles: syncStatus.conflictFiles,
    failedFiles: syncStatus.failedFiles,

    // Progress tracking
    syncProgress,
    syncResult,
    conflicts,

    // Actions
    startSync,
    startAutoSync,
    stopAutoSync,
    resolveConflict,
    registerConflictResolver,
    unregisterConflictResolver,
    forceSyncWithRetry,

    // Utilities
    clearProgress,
    clearResult,
    clearConflicts,
  }
}

export interface UseSyncFileOptions {
  fileId: string
  autoResolveConflicts?: 'local' | 'remote' | 'merge'
}

export interface UseSyncFileReturn {
  isFileOnline: boolean
  isFileSyncing: boolean
  fileProgress: SyncProgress | null
  fileConflict: SyncConflict | null
  
  syncFile: () => Promise<void>
  resolveFileConflict: (resolution: 'local' | 'remote' | 'merge') => Promise<void>
}

export const useSyncFile = (options: UseSyncFileOptions): UseSyncFileReturn => {
  const { fileId, autoResolveConflicts } = options
  const { syncProgress, conflicts, resolveConflict, syncStatus } = useSync()

  const fileProgress = syncProgress.find(p => p.fileId === fileId) || null
  const fileConflict = conflicts.find(c => c.fileId === fileId) || null

  const syncFile = useCallback(async () => {
    // This would trigger sync for a specific file
    // For now, we'll trigger a full sync
    await syncService.syncAll({ forceSync: true })
  }, [])

  const resolveFileConflict = useCallback(async (resolution: 'local' | 'remote' | 'merge') => {
    if (fileConflict) {
      await resolveConflict(fileConflict, resolution)
    }
  }, [fileConflict, resolveConflict])

  // Auto-resolve conflicts if specified
  useEffect(() => {
    if (fileConflict && autoResolveConflicts) {
      resolveFileConflict(autoResolveConflicts).catch(console.error)
    }
  }, [fileConflict, autoResolveConflicts, resolveFileConflict])

  return {
    isFileOnline: syncStatus.isOnline,
    isFileSyncing: fileProgress?.status === 'syncing' || false,
    fileProgress,
    fileConflict,
    syncFile,
    resolveFileConflict,
  }
}

export default useSync