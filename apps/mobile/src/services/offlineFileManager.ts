import { FileItem } from '../types/file'
import { offlineStorage, OfflineFileWithMetadata, OfflineStorageStats } from './storage/offlineStorage'
import { fileOperations } from './fileOperations'
import * as Network from 'expo-network'
import { Alert } from 'react-native'

export interface OfflineDownloadOptions {
  showProgress?: boolean
  onProgress?: (progress: number) => void
  onSuccess?: (file: OfflineFileWithMetadata) => void
  onError?: (error: Error) => void
}

export interface OfflineManagerConfig {
  autoDownloadStarred?: boolean
  autoDownloadRecent?: boolean
  maxAutoDownloadSize?: number
  wifiOnlyDownload?: boolean
}

export interface OfflineFileInfo extends FileItem {
  isOfflineAvailable: boolean
  localPath?: string
  syncStatus?: 'synced' | 'modified' | 'conflict'
  downloadedAt?: Date
  accessedAt?: Date
}

class OfflineFileManagerService {
  private config: OfflineManagerConfig = {
    autoDownloadStarred: false,
    autoDownloadRecent: false,
    maxAutoDownloadSize: 10 * 1024 * 1024, // 10MB
    wifiOnlyDownload: true,
  }

  private downloadQueue: Set<string> = new Set()
  private isInitialized = false

  /**
   * Initialize the offline file manager
   */
  async initialize(config?: Partial<OfflineManagerConfig>): Promise<void> {
    if (this.isInitialized) return

    this.config = { ...this.config, ...config }
    await offlineStorage.initialize()
    this.isInitialized = true
  }

  /**
   * Download file for offline access
   */
  async downloadForOffline(
    fileItem: FileItem,
    options: OfflineDownloadOptions = {}
  ): Promise<OfflineFileWithMetadata> {
    await this.ensureInitialized()

    // Check if already downloading
    if (this.downloadQueue.has(fileItem.id)) {
      throw new Error('File is already being downloaded')
    }

    // Check network conditions
    if (this.config.wifiOnlyDownload) {
      const networkState = await Network.getNetworkStateAsync()
      if (networkState.type !== Network.NetworkStateType.WIFI) {
        throw new Error('WiFi connection required for offline downloads')
      }
    }

    try {
      this.downloadQueue.add(fileItem.id)
      options.onProgress?.(0)

      const offlineFile = await offlineStorage.downloadFileForOffline(fileItem)
      
      options.onProgress?.(100)
      options.onSuccess?.(offlineFile)
      
      return offlineFile

    } catch (error) {
      const downloadError = error instanceof Error ? error : new Error('Download failed')
      options.onError?.(downloadError)
      throw downloadError
    } finally {
      this.downloadQueue.delete(fileItem.id)
    }
  }

  /**
   * Download multiple files for offline access
   */
  async downloadMultipleForOffline(
    fileItems: FileItem[],
    options: OfflineDownloadOptions = {}
  ): Promise<OfflineFileWithMetadata[]> {
    const results: OfflineFileWithMetadata[] = []
    const totalFiles = fileItems.length
    let completedFiles = 0

    for (const fileItem of fileItems) {
      try {
        const offlineFile = await this.downloadForOffline(fileItem, {
          ...options,
          onProgress: (progress) => {
            const overallProgress = ((completedFiles + progress / 100) / totalFiles) * 100
            options.onProgress?.(overallProgress)
          },
        })
        
        results.push(offlineFile)
        completedFiles++
      } catch (error) {
        console.error(`Failed to download ${fileItem.name} for offline:`, error)
        // Continue with other files
      }
    }

    return results
  }

  /**
   * Remove file from offline storage
   */
  async removeFromOffline(fileId: string): Promise<void> {
    await this.ensureInitialized()
    await offlineStorage.removeOfflineFile(fileId)
  }

  /**
   * Get all offline files
   */
  async getOfflineFiles(): Promise<OfflineFileWithMetadata[]> {
    await this.ensureInitialized()
    return offlineStorage.getAllOfflineFiles()
  }

  /**
   * Get offline file by ID
   */
  async getOfflineFile(fileId: string): Promise<OfflineFileWithMetadata | null> {
    await this.ensureInitialized()
    return offlineStorage.getOfflineFile(fileId)
  }

  /**
   * Check if file is available offline
   */
  async isFileAvailableOffline(fileId: string): Promise<boolean> {
    await this.ensureInitialized()
    return offlineStorage.isFileAvailableOffline(fileId)
  }

  /**
   * Get local file path for offline file
   */
  async getLocalFilePath(fileId: string): Promise<string | null> {
    await this.ensureInitialized()
    return offlineStorage.getLocalFilePath(fileId)
  }

  /**
   * Mark file as accessed (updates access time)
   */
  async markFileAsAccessed(fileId: string): Promise<void> {
    await this.ensureInitialized()
    await offlineStorage.updateAccessTime(fileId)
  }

  /**
   * Mark file as modified (for offline editing)
   */
  async markFileAsModified(fileId: string): Promise<void> {
    await this.ensureInitialized()
    await offlineStorage.markFileAsModified(fileId)
  }

  /**
   * Get files that need synchronization
   */
  async getModifiedFiles(): Promise<OfflineFileWithMetadata[]> {
    await this.ensureInitialized()
    return offlineStorage.getModifiedFiles()
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<OfflineStorageStats> {
    await this.ensureInitialized()
    return offlineStorage.getStorageStats()
  }

  /**
   * Clean up old files to free space
   */
  async cleanupStorage(targetFreeSpace?: number): Promise<void> {
    await this.ensureInitialized()
    
    const stats = await this.getStorageStats()
    const requiredSpace = targetFreeSpace || stats.totalSize * 0.1 // Free 10% by default
    
    if (stats.availableSize < requiredSpace) {
      const spaceToFree = requiredSpace - stats.availableSize
      await offlineStorage.cleanupOldFiles(spaceToFree)
    }
  }

  /**
   * Clear all offline files with confirmation
   */
  async clearAllOfflineFiles(skipConfirmation: boolean = false): Promise<void> {
    await this.ensureInitialized()

    if (!skipConfirmation) {
      return new Promise((resolve, reject) => {
        Alert.alert(
          'Clear Offline Files',
          'Are you sure you want to remove all offline files? This will free up storage space but you\'ll need to re-download files for offline access.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => reject(new Error('User cancelled')),
            },
            {
              text: 'Clear All',
              style: 'destructive',
              onPress: async () => {
                try {
                  await offlineStorage.clearAllOfflineFiles()
                  resolve()
                } catch (error) {
                  reject(error)
                }
              },
            },
          ]
        )
      })
    }

    await offlineStorage.clearAllOfflineFiles()
  }

  /**
   * Auto-download starred files
   */
  async autoDownloadStarredFiles(): Promise<void> {
    if (!this.config.autoDownloadStarred) return

    await this.ensureInitialized()

    try {
      const starredFiles = await fileOperations.getStarredFiles()
      const filesToDownload = starredFiles.filter(file => 
        file.type === 'file' && 
        file.size && 
        file.size <= (this.config.maxAutoDownloadSize || 0)
      )

      if (filesToDownload.length > 0) {
        await this.downloadMultipleForOffline(filesToDownload)
      }
    } catch (error) {
      console.error('Failed to auto-download starred files:', error)
    }
  }

  /**
   * Auto-download recent files
   */
  async autoDownloadRecentFiles(): Promise<void> {
    if (!this.config.autoDownloadRecent) return

    await this.ensureInitialized()

    try {
      const recentFiles = await fileOperations.getRecentFiles(10)
      const filesToDownload = recentFiles.filter(file => 
        file.type === 'file' && 
        file.size && 
        file.size <= (this.config.maxAutoDownloadSize || 0)
      )

      if (filesToDownload.length > 0) {
        await this.downloadMultipleForOffline(filesToDownload)
      }
    } catch (error) {
      console.error('Failed to auto-download recent files:', error)
    }
  }

  /**
   * Get file info with offline status
   */
  async getFileInfoWithOfflineStatus(fileItem: FileItem): Promise<OfflineFileInfo> {
    await this.ensureInitialized()
    
    const offlineFile = await this.getOfflineFile(fileItem.id)
    
    return {
      ...fileItem,
      isOfflineAvailable: !!offlineFile,
      localPath: offlineFile?.localPath,
      syncStatus: offlineFile?.syncStatus,
      downloadedAt: offlineFile?.downloadedAt,
      accessedAt: offlineFile?.accessedAt,
    }
  }

  /**
   * Get multiple files info with offline status
   */
  async getFilesInfoWithOfflineStatus(fileItems: FileItem[]): Promise<OfflineFileInfo[]> {
    await this.ensureInitialized()
    
    const results: OfflineFileInfo[] = []
    
    for (const fileItem of fileItems) {
      const fileInfo = await this.getFileInfoWithOfflineStatus(fileItem)
      results.push(fileInfo)
    }
    
    return results
  }

  /**
   * Check if download is in progress
   */
  isDownloadInProgress(fileId: string): boolean {
    return this.downloadQueue.has(fileId)
  }

  /**
   * Get current download queue
   */
  getDownloadQueue(): string[] {
    return Array.from(this.downloadQueue)
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<OfflineManagerConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): OfflineManagerConfig {
    return { ...this.config }
  }

  /**
   * Validate storage space before download
   */
  async validateStorageSpace(fileSize: number): Promise<{ canDownload: boolean; message?: string }> {
    const stats = await this.getStorageStats()
    
    if (fileSize > stats.availableSize) {
      return {
        canDownload: false,
        message: `Insufficient storage space. Need ${this.formatFileSize(fileSize)}, but only ${this.formatFileSize(stats.availableSize)} available.`
      }
    }
    
    // Check if download would exceed 90% of total storage
    if (stats.usedSize + fileSize > stats.totalSize * 0.9) {
      return {
        canDownload: false,
        message: 'Download would exceed storage limit. Please free up some space first.'
      }
    }
    
    return { canDownload: true }
  }

  /**
   * Get storage usage by file type
   */
  async getStorageUsageByType(): Promise<Record<string, { size: number; count: number }>> {
    await this.ensureInitialized()
    
    const offlineFiles = await this.getOfflineFiles()
    const usage: Record<string, { size: number; count: number }> = {}
    
    for (const file of offlineFiles) {
      const type = this.getFileTypeFromMimeType(file.mimeType)
      
      if (!usage[type]) {
        usage[type] = { size: 0, count: 0 }
      }
      
      usage[type].size += file.size
      usage[type].count += 1
    }
    
    return usage
  }

  // Private helper methods

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  private getFileTypeFromMimeType(mimeType?: string): string {
    if (!mimeType) return 'other'
    
    if (mimeType.startsWith('image/')) return 'images'
    if (mimeType.startsWith('video/')) return 'videos'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.includes('pdf')) return 'documents'
    if (mimeType.includes('document') || mimeType.includes('text')) return 'documents'
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheets'
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentations'
    
    return 'other'
  }
}

// Export singleton instance
export const offlineFileManager = new OfflineFileManagerService()
export default offlineFileManager