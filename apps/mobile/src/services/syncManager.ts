import NetInfo from '@react-native-community/netinfo'
import { syncService, SyncStatus, SyncResult, SyncConflict } from './syncService'
import { syncQueue, SyncQueueStats } from './syncQueue'
import { offlineStorage } from './storage/offlineStorage'

export interface SyncManagerStatus {
  isOnline: boolean
  isSyncing: boolean
  lastSyncTime?: Date
  nextSyncTime?: Date
  syncStats: SyncStatus
  queueStats: SyncQueueStats
  autoSyncEnabled: boolean
  syncInterval: number
}

export interface SyncManagerOptions {
  enableAutoSync?: boolean
  syncInterval?: number
  maxRetries?: number
  onStatusChange?: (status: SyncManagerStatus) => void
  onSyncComplete?: (result: SyncResult) => void
  onSyncError?: (error: Error) => void
  onConflictDetected?: (conflict: SyncConflict) => void
}

class SyncManager {
  private static instance: SyncManager
  private isInitialized = false
  private options: SyncManagerOptions = {}
  private statusListeners: Set<(status: SyncManagerStatus) => void> = new Set()
  private networkUnsubscribe?: () => void
  private syncStatusUnsubscribe?: () => void
  private queueStatusUnsubscribe?: () => void

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager()
    }
    return SyncManager.instance
  }

  /**
   * Initialize the sync manager
   */
  async initialize(options: SyncManagerOptions = {}): Promise<void> {
    if (this.isInitialized) return

    this.options = {
      enableAutoSync: true,
      syncInterval: 30000, // 30 seconds
      maxRetries: 3,
      ...options,
    }

    try {
      // Initialize sync queue
      await syncQueue.initialize()

      // Set up network monitoring
      this.setupNetworkMonitoring()

      // Set up sync service monitoring
      this.setupSyncServiceMonitoring()

      // Set up queue monitoring
      this.setupQueueMonitoring()

      // Start auto sync if enabled
      if (this.options.enableAutoSync) {
        this.startAutoSync()
      }

      this.isInitialized = true
      await this.notifyStatusChange()

    } catch (error) {
      console.error('Failed to initialize sync manager:', error)
      throw new Error('Failed to initialize sync manager')
    }
  }

  /**
   * Start automatic synchronization
   */
  startAutoSync(): void {
    syncService.startAutoSync()
    syncQueue.startProcessing()
  }

  /**
   * Stop automatic synchronization
   */
  stopAutoSync(): void {
    syncService.stopAutoSync()
    syncQueue.stopProcessing()
  }

  /**
   * Trigger manual sync
   */
  async triggerSync(forceSync = false): Promise<SyncResult> {
    try {
      const result = await syncService.syncAll({
        forceSync,
        onProgress: (progress) => {
          // Progress updates are handled by individual components
          console.warn(`Sync progress: ${progress.fileName} - ${progress.status}`)
        },
        onConflict: async (conflict) => {
          this.options.onConflictDetected?.(conflict)
          return 'manual' // Let user resolve manually
        },
        onComplete: (result) => {
          this.options.onSyncComplete?.(result)
        },
        onError: (error) => {
          this.options.onSyncError?.(error)
        }
      })

      await this.notifyStatusChange()
      return result

    } catch (error) {
      const syncError = error instanceof Error ? error : new Error('Sync failed')
      this.options.onSyncError?.(syncError)
      throw syncError
    }
  }

  /**
   * Add file to sync queue
   */
  async addFileToSyncQueue(
    fileId: string,
    fileName: string,
    operation: 'upload' | 'download' | 'update' | 'delete',
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<string> {
    const queueId = await syncQueue.addToQueue(fileId, fileName, operation, {
      priority,
      maxRetries: this.options.maxRetries,
    })

    await this.notifyStatusChange()
    return queueId
  }

  /**
   * Remove file from sync queue
   */
  async removeFileFromSyncQueue(queueId: string): Promise<void> {
    await syncQueue.removeFromQueue(queueId)
    await this.notifyStatusChange()
  }

  /**
   * Get current sync manager status
   */
  async getStatus(): Promise<SyncManagerStatus> {
    const syncStats = await syncService.getSyncStatus()
    const queueStats = await syncQueue.getQueueStats()

    return {
      isOnline: syncStats.isOnline,
      isSyncing: syncStats.isSyncing || queueStats.processingItems > 0,
      lastSyncTime: syncStats.lastSyncTime,
      nextSyncTime: syncStats.nextSyncTime,
      syncStats,
      queueStats,
      autoSyncEnabled: this.options.enableAutoSync || false,
      syncInterval: this.options.syncInterval || 30000,
    }
  }

  /**
   * Resolve sync conflict
   */
  async resolveConflict(
    conflict: SyncConflict,
    resolution: 'local' | 'remote' | 'merge'
  ): Promise<void> {
    try {
      const offlineFile = await offlineStorage.getOfflineFile(conflict.fileId)
      if (!offlineFile) {
        throw new Error('Offline file not found')
      }

      await syncService.syncFile(offlineFile, {
        resolveConflicts: resolution,
        forceSync: true,
      })

      await this.notifyStatusChange()

    } catch (error) {
      console.error('Failed to resolve conflict:', error)
      throw error
    }
  }

  /**
   * Get pending sync conflicts
   */
  async getPendingConflicts(): Promise<SyncConflict[]> {
    // This would typically be stored in the sync service or database
    // For now, we'll return an empty array as conflicts are handled in real-time
    return []
  }

  /**
   * Clear completed sync queue items
   */
  async clearCompletedQueueItems(): Promise<void> {
    await syncQueue.clearCompleted()
    await this.notifyStatusChange()
  }

  /**
   * Get sync statistics
   */
  async getSyncStatistics(): Promise<{
    totalFilesSynced: number
    totalFilesInQueue: number
    totalConflicts: number
    totalErrors: number
    lastSyncDuration?: number
    averageSyncTime?: number
  }> {
    const queueStats = await syncQueue.getQueueStats()
    const syncStats = await syncService.getSyncStatus()

    return {
      totalFilesSynced: queueStats.completedItems,
      totalFilesInQueue: queueStats.totalItems,
      totalConflicts: syncStats.conflictFiles,
      totalErrors: queueStats.failedItems,
      // These would be calculated from historical data
      lastSyncDuration: undefined,
      averageSyncTime: undefined,
    }
  }

  /**
   * Force sync with retry logic
   */
  async forceSyncWithRetry(maxRetries?: number): Promise<SyncResult> {
    try {
      const result = await syncService.forceSyncWithRetry(maxRetries)
      await this.notifyStatusChange()
      return result
    } catch (error) {
      const syncError = error instanceof Error ? error : new Error('Force sync failed')
      this.options.onSyncError?.(syncError)
      throw syncError
    }
  }

  /**
   * Add status change listener
   */
  addStatusListener(listener: (status: SyncManagerStatus) => void): () => void {
    this.statusListeners.add(listener)
    
    // Send initial status
    this.getStatus().then(listener).catch(console.error)
    
    return () => {
      this.statusListeners.delete(listener)
    }
  }

  /**
   * Update sync manager options
   */
  updateOptions(options: Partial<SyncManagerOptions>): void {
    this.options = { ...this.options, ...options }
    
    // Apply auto sync setting
    if (options.enableAutoSync !== undefined) {
      if (options.enableAutoSync) {
        this.startAutoSync()
      } else {
        this.stopAutoSync()
      }
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.networkUnsubscribe?.()
    this.syncStatusUnsubscribe?.()
    this.queueStatusUnsubscribe?.()
    
    syncService.cleanup()
    syncQueue.cleanup()
    
    this.statusListeners.clear()
    this.isInitialized = false
  }

  // Private methods

  private setupNetworkMonitoring(): void {
    this.networkUnsubscribe = NetInfo.addEventListener(async () => {
      await this.notifyStatusChange()
    })
  }

  private setupSyncServiceMonitoring(): void {
    this.syncStatusUnsubscribe = syncService.addStatusListener(async () => {
      await this.notifyStatusChange()
    })
  }

  private setupQueueMonitoring(): void {
    this.queueStatusUnsubscribe = syncQueue.addStatusListener(async () => {
      await this.notifyStatusChange()
    })
  }

  private async notifyStatusChange(): Promise<void> {
    try {
      const status = await this.getStatus()
      
      // Notify option callback
      this.options.onStatusChange?.(status)
      
      // Notify all listeners
      this.statusListeners.forEach(listener => {
        try {
          listener(status)
        } catch (error) {
          console.error('Error in sync manager status listener:', error)
        }
      })
    } catch (error) {
      console.error('Error getting sync manager status:', error)
    }
  }
}

// Export singleton instance
export const syncManager = SyncManager.getInstance()
export default syncManager