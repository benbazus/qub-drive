import NetInfo from '@react-native-community/netinfo'
import { offlineStorage, OfflineFileWithMetadata } from './storage/offlineStorage'
import { fileApi } from './api/fileApi'
import { offlineEditingService } from './offlineEditingService'
import { FileItem } from '../types/file'

export interface SyncConflict {
  fileId: string
  fileName: string
  conflictType: 'content' | 'metadata' | 'both'
  localVersion: {
    content?: string
    lastModified: Date
    size?: number
  }
  remoteVersion: {
    content?: string
    lastModified: Date
    size?: number
  }
  resolution?: 'local' | 'remote' | 'merge' | 'manual'
}

export interface SyncProgress {
  fileId: string
  fileName: string
  status: 'pending' | 'syncing' | 'completed' | 'failed' | 'conflict'
  progress: number
  error?: string
  conflict?: SyncConflict
}

export interface SyncResult {
  totalFiles: number
  syncedFiles: number
  failedFiles: number
  conflictFiles: number
  conflicts: SyncConflict[]
  errors: { fileId: string; error: string }[]
}

export interface SyncOptions {
  forceSync?: boolean
  resolveConflicts?: 'local' | 'remote' | 'manual'
  onProgress?: (progress: SyncProgress) => void
  onConflict?: (conflict: SyncConflict) => Promise<'local' | 'remote' | 'merge' | 'manual'>
  onComplete?: (result: SyncResult) => void
  onError?: (error: Error) => void
}

export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  lastSyncTime?: Date | undefined
  pendingFiles: number
  conflictFiles: number
  failedFiles: number
  nextSyncTime?: Date | undefined
}

class SyncService {
  private static instance: SyncService
  private isOnline = false
  private isSyncing = false
  private lastSyncTime?: Date
  private syncTimer?: ReturnType<typeof setInterval> | undefined
  private retryTimer?: ReturnType<typeof setTimeout> | undefined
  private listeners: Set<(status: SyncStatus) => void> = new Set()
  private conflictResolvers: Map<string, (conflict: SyncConflict) => Promise<'local' | 'remote' | 'merge' | 'manual'>> = new Map()

  private readonly SYNC_INTERVAL = 30000 // 30 seconds
  private readonly RETRY_DELAY = 5000 // 5 seconds
  private readonly MAX_RETRIES = 3

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService()
    }
    return SyncService.instance
  }

  constructor() {
    this.initializeNetworkListener()
  }

  /**
   * Initialize network connectivity monitoring
   */
  private initializeNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline
      this.isOnline = state.isConnected === true

      if (!wasOnline && this.isOnline) {
        // Connectivity restored - trigger sync
        this.onConnectivityRestored()
      }

      this.notifyListeners()
    })

    // Get initial network state
    NetInfo.fetch().then(state => {
      this.isOnline = state.isConnected === true
      this.notifyListeners()
    })
  }

  /**
   * Handle connectivity restoration
   */
  private async onConnectivityRestored(): Promise<void> {
    console.warn('Connectivity restored - starting sync')
    
    // Wait a moment for connection to stabilize
    setTimeout(() => {
      this.syncAll({
        forceSync: true,
        onProgress: (progress) => {
          console.warn(`Sync progress: ${progress.fileName} - ${progress.status}`)
        },
        onComplete: (result) => {
          console.warn(`Sync completed: ${result.syncedFiles}/${result.totalFiles} files synced`)
        },
        onError: (error) => {
          console.error('Sync failed after connectivity restoration:', error)
        }
      })
    }, 2000)
  }

  /**
   * Start automatic sync monitoring
   */
  startAutoSync(): void {
    if (this.syncTimer) return

    this.syncTimer = setInterval(async () => {
      if (this.isOnline && !this.isSyncing) {
        try {
          await this.syncAll({ forceSync: false })
        } catch (error) {
          console.error('Auto-sync failed:', error)
        }
      }
    }, this.SYNC_INTERVAL)
  }

  /**
   * Stop automatic sync monitoring
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = undefined
    }
  }

  /**
   * Sync all modified files
   */
  async syncAll(options: SyncOptions = {}): Promise<SyncResult> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline')
    }

    if (this.isSyncing && !options.forceSync) {
      throw new Error('Sync already in progress')
    }

    this.isSyncing = true
    this.notifyListeners()

    const result: SyncResult = {
      totalFiles: 0,
      syncedFiles: 0,
      failedFiles: 0,
      conflictFiles: 0,
      conflicts: [],
      errors: []
    }

    try {
      // Get all modified files
      const modifiedFiles = await offlineStorage.getModifiedFiles()
      result.totalFiles = modifiedFiles.length

      if (modifiedFiles.length === 0) {
        this.lastSyncTime = new Date()
        return result
      }

      // Sync each file
      for (const file of modifiedFiles) {
        const progress: SyncProgress = {
          fileId: file.fileId,
          fileName: file.originalName,
          status: 'pending',
          progress: 0
        }

        options.onProgress?.(progress)

        try {
          progress.status = 'syncing'
          progress.progress = 50
          options.onProgress?.(progress)

          const syncFileResult = await this.syncFile(file, options)
          
          if (syncFileResult.conflict) {
            result.conflicts.push(syncFileResult.conflict)
            result.conflictFiles++
            progress.status = 'conflict'
            progress.conflict = syncFileResult.conflict
          } else {
            result.syncedFiles++
            progress.status = 'completed'
          }

          progress.progress = 100
          options.onProgress?.(progress)

        } catch (error) {
          result.failedFiles++
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          result.errors.push({ fileId: file.fileId, error: errorMessage })
          
          progress.status = 'failed'
          progress.error = errorMessage
          options.onProgress?.(progress)
        }
      }

      // Sync offline edits
      await this.syncOfflineEdits(options)

      this.lastSyncTime = new Date()
      options.onComplete?.(result)

    } catch (error) {
      const syncError = error instanceof Error ? error : new Error('Sync failed')
      options.onError?.(syncError)
      throw syncError
    } finally {
      this.isSyncing = false
      this.notifyListeners()
    }

    return result
  }

  /**
   * Sync a single file
   */
  async syncFile(
    offlineFile: OfflineFileWithMetadata, 
    options: SyncOptions = {}
  ): Promise<{ success: boolean; conflict?: SyncConflict }> {
    try {
      // Get remote file info
      const remoteFile = await fileApi.getFileInfo(offlineFile.fileId)
      
      // Check for conflicts
      const conflict = await this.detectConflict(offlineFile, remoteFile)
      
      if (conflict) {
        const resolution = await this.resolveConflict(conflict, options)
        
        if (resolution === 'manual') {
          return { success: false, conflict }
        }
        
        await this.applyConflictResolution(conflict, resolution)
      } else {
        // No conflict - upload changes
        await this.uploadFileChanges(offlineFile)
      }

      // Mark as synced
      await offlineStorage.markFileAsSynced(offlineFile.fileId)
      
      return { success: true }

    } catch (error) {
      console.error(`Failed to sync file ${offlineFile.fileId}:`, error)
      throw error
    }
  }

  /**
   * Detect conflicts between local and remote versions
   */
  private async detectConflict(
    localFile: OfflineFileWithMetadata,
    remoteFile: FileItem
  ): Promise<SyncConflict | null> {
    // Check if remote file was modified after local file
    const localModified = localFile.lastModified
    const remoteModified = new Date(remoteFile.updatedAt)

    if (remoteModified > localModified) {
      // Potential conflict - need to compare content
      const hasContentConflict = await this.hasContentConflict(localFile, remoteFile)
      const hasMetadataConflict = this.hasMetadataConflict(localFile, remoteFile)

      if (hasContentConflict || hasMetadataConflict) {
        return {
          fileId: localFile.fileId,
          fileName: localFile.originalName,
          conflictType: hasContentConflict && hasMetadataConflict ? 'both' : 
                       hasContentConflict ? 'content' : 'metadata',
          localVersion: {
            content: await this.getLocalFileContent(localFile),
            lastModified: localModified,
            size: localFile.size
          },
          remoteVersion: {
            content: await this.getRemoteFileContent(remoteFile),
            lastModified: remoteModified,
            size: remoteFile.size
          }
        }
      }
    }

    return null
  }

  /**
   * Check for content conflicts
   */
  private async hasContentConflict(
    localFile: OfflineFileWithMetadata,
    remoteFile: FileItem
  ): Promise<boolean> {
    try {
      const localContent = await this.getLocalFileContent(localFile)
      const remoteContent = await this.getRemoteFileContent(remoteFile)
      
      return localContent !== remoteContent
    } catch (error) {
      console.error('Error checking content conflict:', error)
      return true // Assume conflict on error
    }
  }

  /**
   * Check for metadata conflicts
   */
  private hasMetadataConflict(
    localFile: OfflineFileWithMetadata,
    remoteFile: FileItem
  ): boolean {
    return localFile.originalName !== remoteFile.name ||
           localFile.size !== remoteFile.size
  }

  /**
   * Resolve conflict based on options or user input
   */
  private async resolveConflict(
    conflict: SyncConflict,
    options: SyncOptions
  ): Promise<'local' | 'remote' | 'merge' | 'manual'> {
    // Check for predefined resolution
    if (options.resolveConflicts && options.resolveConflicts !== 'manual') {
      return options.resolveConflicts
    }

    // Check for custom conflict resolver
    if (options.onConflict) {
      return await options.onConflict(conflict)
    }

    // Check for registered conflict resolver
    const resolver = this.conflictResolvers.get(conflict.fileId)
    if (resolver) {
      return await resolver(conflict)
    }

    // Default to manual resolution
    return 'manual'
  }

  /**
   * Apply conflict resolution
   */
  private async applyConflictResolution(
    conflict: SyncConflict,
    resolution: 'local' | 'remote' | 'merge'
  ): Promise<void> {
    switch (resolution) {
      case 'local':
        // Keep local version - upload to server
        await this.uploadLocalVersion(conflict)
        break
        
      case 'remote':
        // Keep remote version - download and replace local
        await this.downloadRemoteVersion(conflict)
        break
        
      case 'merge':
        // Attempt to merge versions
        await this.mergeVersions(conflict)
        break
    }
  }

  /**
   * Upload local version to server
   */
  private async uploadLocalVersion(conflict: SyncConflict): Promise<void> {
    const content = conflict.localVersion.content
    if (content !== null && content !== undefined) {
      await fileApi.updateFileContent(conflict.fileId, content)
    }
  }

  /**
   * Download remote version and replace local
   */
  private async downloadRemoteVersion(conflict: SyncConflict): Promise<void> {
    const content = conflict.remoteVersion.content
    if (content !== null && content !== undefined) {
      await offlineStorage.updateFileContent(conflict.fileId, content)
    }
  }

  /**
   * Attempt to merge versions (basic implementation)
   */
  private async mergeVersions(conflict: SyncConflict): Promise<void> {
    // This is a simplified merge - in practice, you'd want more sophisticated merging
    const localContent = conflict.localVersion.content || ''
    const remoteContent = conflict.remoteVersion.content || ''
    
    // Simple merge: append remote changes to local
    const mergedContent = `${localContent}\n\n--- Remote Changes ---\n\n${remoteContent}`
    
    await fileApi.updateFileContent(conflict.fileId, mergedContent)
    await offlineStorage.updateFileContent(conflict.fileId, mergedContent)
  }

  /**
   * Upload file changes to server
   */
  private async uploadFileChanges(offlineFile: OfflineFileWithMetadata): Promise<void> {
    const content = await this.getLocalFileContent(offlineFile)
    if (content) {
      await fileApi.updateFileContent(offlineFile.fileId, content)
    }
  }

  /**
   * Sync offline edits from editing service
   */
  private async syncOfflineEdits(_options: SyncOptions): Promise<void> {
    try {
      await offlineEditingService.syncPendingEdits()
    } catch (error) {
      console.error('Failed to sync offline edits:', error)
      // Don't throw - continue with file sync
    }
  }

  /**
   * Get local file content
   */
  private async getLocalFileContent(offlineFile: OfflineFileWithMetadata): Promise<string | null> {
    try {
      // Try to get content from offline editing service first
      if (offlineFile.mimeType?.includes('document')) {
        return await offlineEditingService.getOfflineDocumentContent(offlineFile.fileId)
      }
      
      // Fallback to reading from local file
      return await offlineStorage.readFileContent(offlineFile.fileId)
    } catch (error) {
      console.error('Error reading local file content:', error)
      return null
    }
  }

  /**
   * Get remote file content
   */
  private async getRemoteFileContent(remoteFile: FileItem): Promise<string | null> {
    try {
      const content = await fileApi.getFileContent(remoteFile.id)
      return content || null
    } catch (error) {
      console.error('Error reading remote file content:', error)
      return null
    }
  }

  /**
   * Register a conflict resolver for a specific file
   */
  registerConflictResolver(
    fileId: string,
    resolver: (conflict: SyncConflict) => Promise<'local' | 'remote' | 'merge' | 'manual'>
  ): void {
    this.conflictResolvers.set(fileId, resolver)
  }

  /**
   * Unregister conflict resolver
   */
  unregisterConflictResolver(fileId: string): void {
    this.conflictResolvers.delete(fileId)
  }

  /**
   * Get current sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const statusCounts = await offlineStorage.getSyncStatusCounts()
    
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      pendingFiles: statusCounts.modified,
      conflictFiles: statusCounts.conflict,
      failedFiles: statusCounts.failed,
      nextSyncTime: this.syncTimer ? new Date(Date.now() + this.SYNC_INTERVAL) : undefined
    }
  }

  /**
   * Add sync status listener
   */
  addStatusListener(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener)
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Notify all listeners of status change
   */
  private async notifyListeners(): Promise<void> {
    try {
      const status = await this.getSyncStatus()
      this.listeners.forEach(listener => {
        try {
          listener(status)
        } catch (error) {
          console.error('Error in sync status listener:', error)
        }
      })
    } catch (error) {
      console.error('Error getting sync status for listeners:', error)
    }
  }

  /**
   * Force sync with retry logic
   */
  async forceSyncWithRetry(maxRetries: number = this.MAX_RETRIES): Promise<SyncResult> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.syncAll({ forceSync: true })
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Sync failed')
        console.error(`Sync attempt ${attempt} failed:`, lastError.message)
        
        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw lastError || new Error('All sync attempts failed')
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopAutoSync()
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
      this.retryTimer = undefined
    }
    this.listeners.clear()
    this.conflictResolvers.clear()
  }
}

// Export singleton instance
export const syncService = SyncService.getInstance()
export default syncService