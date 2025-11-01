import * as FileSystem from 'expo-file-system'
import * as SQLite from 'expo-sqlite'
import { FileItem, OfflineFile } from '../../types/file'
import { fileApi } from '../api/fileApi'

export interface OfflineStorageConfig {
  maxStorageSize: number // in bytes
  maxFileSize: number // in bytes
  cacheDirectory: string
  dbName: string
}

export interface OfflineStorageStats {
  totalSize: number
  usedSize: number
  availableSize: number
  fileCount: number
  oldestFile?: Date | undefined
  newestFile?: Date | undefined
}

export interface OfflineFileWithMetadata extends OfflineFile {
  id: string
  fileId: string
  localPath: string
  originalName: string
  size: number
  mimeType?: string | undefined
  lastModified: Date
  syncStatus: 'synced' | 'modified' | 'conflict'
  downloadedAt: Date
  accessedAt: Date
  isStarred: boolean
  parentId?: string | undefined
}

class OfflineStorageService {
  private db: SQLite.SQLiteDatabase | null = null
  private config: OfflineStorageConfig
  private isInitialized = false

  constructor(config?: Partial<OfflineStorageConfig>) {
    this.config = {
      maxStorageSize: 2 * 1024 * 1024 * 1024, // 2GB default
      maxFileSize: 100 * 1024 * 1024, // 100MB default
      cacheDirectory: `${FileSystem.documentDirectory}offline_files/`,
      dbName: 'offline_storage.db',
      ...config,
    }
  }

  /**
   * Initialize the offline storage system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Create cache directory
      const dirInfo = await FileSystem.getInfoAsync(this.config.cacheDirectory)
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.config.cacheDirectory, { intermediates: true })
      }

      // Initialize SQLite database
      this.db = await SQLite.openDatabaseAsync(this.config.dbName)
      await this.createTables()

      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize offline storage:', error)
      throw new Error('Failed to initialize offline storage')
    }
  }

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS offline_files (
        id TEXT PRIMARY KEY,
        file_id TEXT NOT NULL UNIQUE,
        local_path TEXT NOT NULL,
        original_name TEXT NOT NULL,
        size INTEGER NOT NULL,
        mime_type TEXT,
        last_modified INTEGER NOT NULL,
        sync_status TEXT DEFAULT 'synced',
        downloaded_at INTEGER NOT NULL,
        accessed_at INTEGER NOT NULL,
        is_starred INTEGER DEFAULT 0,
        parent_id TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_offline_files_file_id ON offline_files(file_id);
      CREATE INDEX IF NOT EXISTS idx_offline_files_sync_status ON offline_files(sync_status);
      CREATE INDEX IF NOT EXISTS idx_offline_files_accessed_at ON offline_files(accessed_at);
    `)
  }

  /**
   * Download file for offline access
   */
  async downloadFileForOffline(fileItem: FileItem): Promise<OfflineFileWithMetadata> {
    await this.ensureInitialized()

    // Check if file is already cached
    const existingFile = await this.getOfflineFile(fileItem.id)
    if (existingFile) {
      // Update access time
      await this.updateAccessTime(fileItem.id)
      return existingFile
    }

    // Validate file size
    if (fileItem.size && fileItem.size > this.config.maxFileSize) {
      throw new Error(`File size (${this.formatFileSize(fileItem.size)}) exceeds maximum allowed size (${this.formatFileSize(this.config.maxFileSize)})`)
    }

    // Check available storage
    const stats = await this.getStorageStats()
    const requiredSpace = fileItem.size || 0
    if (stats.usedSize + requiredSpace > this.config.maxStorageSize) {
      // Try to free up space
      await this.cleanupOldFiles(requiredSpace)
      
      // Check again
      const newStats = await this.getStorageStats()
      if (newStats.usedSize + requiredSpace > this.config.maxStorageSize) {
        throw new Error('Insufficient storage space for offline download')
      }
    }

    try {
      // Get download URL
      const downloadUrl = await fileApi.getDownloadUrl(fileItem.id)
      
      // Generate local file path
      const fileName = this.sanitizeFileName(fileItem.name)
      const localPath = `${this.config.cacheDirectory}${fileItem.id}_${fileName}`

      // Download file
      const downloadResult = await FileSystem.downloadAsync(downloadUrl, localPath)
      
      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status: ${downloadResult.status}`)
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(localPath)
      if (!fileInfo.exists) {
        throw new Error('Downloaded file not found')
      }

      // Create offline file record
      const now = new Date()
      const offlineFile: OfflineFileWithMetadata = {
        id: this.generateId(),
        fileId: fileItem.id,
        localPath,
        originalName: fileItem.name,
        size: fileInfo.size || fileItem.size || 0,
        mimeType: fileItem.mimeType || undefined,
        lastModified: new Date(fileItem.updatedAt),
        syncStatus: 'synced',
        downloadedAt: now,
        accessedAt: now,
        isStarred: fileItem.isStarred || false,
        parentId: fileItem.parentId || undefined,
      }

      // Save to database
      await this.saveOfflineFile(offlineFile)

      return offlineFile

    } catch (error) {
      console.error('Failed to download file for offline access:', error)
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get offline file by file ID
   */
  async getOfflineFile(fileId: string): Promise<OfflineFileWithMetadata | null> {
    await this.ensureInitialized()
    if (!this.db) return null

    try {
      const result = await this.db.getFirstAsync<any>(
        'SELECT * FROM offline_files WHERE file_id = ?',
        [fileId]
      )

      if (!result) return null

      return this.mapDbRowToOfflineFile(result)
    } catch (error) {
      console.error('Failed to get offline file:', error)
      return null
    }
  }

  /**
   * Get all offline files
   */
  async getAllOfflineFiles(): Promise<OfflineFileWithMetadata[]> {
    await this.ensureInitialized()
    if (!this.db) return []

    try {
      const results = await this.db.getAllAsync<any>(
        'SELECT * FROM offline_files ORDER BY accessed_at DESC'
      )

      return results.map(row => this.mapDbRowToOfflineFile(row))
    } catch (error) {
      console.error('Failed to get offline files:', error)
      return []
    }
  }

  /**
   * Remove file from offline storage
   */
  async removeOfflineFile(fileId: string): Promise<void> {
    await this.ensureInitialized()
    if (!this.db) return

    try {
      const offlineFile = await this.getOfflineFile(fileId)
      if (!offlineFile) return

      // Delete local file
      const fileInfo = await FileSystem.getInfoAsync(offlineFile.localPath)
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(offlineFile.localPath)
      }

      // Remove from database
      await this.db.runAsync('DELETE FROM offline_files WHERE file_id = ?', [fileId])
    } catch (error) {
      console.error('Failed to remove offline file:', error)
      throw new Error('Failed to remove offline file')
    }
  }

  /**
   * Update file access time
   */
  async updateAccessTime(fileId: string): Promise<void> {
    await this.ensureInitialized()
    if (!this.db) return

    try {
      const now = Math.floor(Date.now() / 1000)
      await this.db.runAsync(
        'UPDATE offline_files SET accessed_at = ? WHERE file_id = ?',
        [now, fileId]
      )
    } catch (error) {
      console.error('Failed to update access time:', error)
    }
  }

  /**
   * Mark file as modified (for offline editing)
   */
  async markFileAsModified(fileId: string): Promise<void> {
    await this.ensureInitialized()
    if (!this.db) return

    try {
      const now = Math.floor(Date.now() / 1000)
      await this.db.runAsync(
        'UPDATE offline_files SET sync_status = ?, last_modified = ? WHERE file_id = ?',
        ['modified', now, fileId]
      )
    } catch (error) {
      console.error('Failed to mark file as modified:', error)
      throw new Error('Failed to mark file as modified')
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<OfflineStorageStats> {
    await this.ensureInitialized()
    if (!this.db) {
      return {
        totalSize: this.config.maxStorageSize,
        usedSize: 0,
        availableSize: this.config.maxStorageSize,
        fileCount: 0,
      }
    }

    try {
      const result = await this.db.getFirstAsync<{
        total_size: number
        file_count: number
        oldest_file: number | null
        newest_file: number | null
      }>(`
        SELECT 
          COALESCE(SUM(size), 0) as total_size,
          COUNT(*) as file_count,
          MIN(downloaded_at) as oldest_file,
          MAX(downloaded_at) as newest_file
        FROM offline_files
      `)

      const usedSize = result?.total_size || 0
      const fileCount = result?.file_count || 0

      return {
        totalSize: this.config.maxStorageSize,
        usedSize,
        availableSize: this.config.maxStorageSize - usedSize,
        fileCount,
        oldestFile: result?.oldest_file ? new Date(result.oldest_file * 1000) : undefined,
        newestFile: result?.newest_file ? new Date(result.newest_file * 1000) : undefined,
      }
    } catch (error) {
      console.error('Failed to get storage stats:', error)
      return {
        totalSize: this.config.maxStorageSize,
        usedSize: 0,
        availableSize: this.config.maxStorageSize,
        fileCount: 0,
      }
    }
  }

  /**
   * Clean up old files to free space
   */
  async cleanupOldFiles(requiredSpace: number): Promise<void> {
    await this.ensureInitialized()
    if (!this.db) return

    try {
      // Get files ordered by access time (oldest first)
      const oldFiles = await this.db.getAllAsync<any>(`
        SELECT file_id, size, local_path 
        FROM offline_files 
        ORDER BY accessed_at ASC
      `)

      let freedSpace = 0
      for (const file of oldFiles) {
        if (freedSpace >= requiredSpace) break

        try {
          // Delete local file
          const fileInfo = await FileSystem.getInfoAsync(file.local_path)
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(file.local_path)
          }

          // Remove from database
          await this.db.runAsync('DELETE FROM offline_files WHERE file_id = ?', [file.file_id])
          
          freedSpace += file.size
        } catch (error) {
          console.error(`Failed to cleanup file ${file.file_id}:`, error)
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old files:', error)
    }
  }

  /**
   * Clear all offline files
   */
  async clearAllOfflineFiles(): Promise<void> {
    await this.ensureInitialized()
    if (!this.db) return

    try {
      // Get all files
      const files = await this.getAllOfflineFiles()

      // Delete local files
      for (const file of files) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(file.localPath)
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(file.localPath)
          }
        } catch (error) {
          console.error(`Failed to delete local file ${file.localPath}:`, error)
        }
      }

      // Clear database
      await this.db.runAsync('DELETE FROM offline_files')
    } catch (error) {
      console.error('Failed to clear offline files:', error)
      throw new Error('Failed to clear offline files')
    }
  }

  /**
   * Get files that need synchronization
   */
  async getModifiedFiles(): Promise<OfflineFileWithMetadata[]> {
    await this.ensureInitialized()
    if (!this.db) return []

    try {
      const results = await this.db.getAllAsync<any>(
        'SELECT * FROM offline_files WHERE sync_status = ? ORDER BY last_modified DESC',
        ['modified']
      )

      return results.map(row => this.mapDbRowToOfflineFile(row))
    } catch (error) {
      console.error('Failed to get modified files:', error)
      return []
    }
  }

  /**
   * Check if file is available offline
   */
  async isFileAvailableOffline(fileId: string): Promise<boolean> {
    const offlineFile = await this.getOfflineFile(fileId)
    if (!offlineFile) return false

    // Check if local file still exists
    try {
      const fileInfo = await FileSystem.getInfoAsync(offlineFile.localPath)
      return fileInfo.exists
    } catch {
      return false
    }
  }

  /**
   * Get local file path for offline file
   */
  async getLocalFilePath(fileId: string): Promise<string | null> {
    const offlineFile = await this.getOfflineFile(fileId)
    if (!offlineFile) return null

    // Verify file exists
    try {
      const fileInfo = await FileSystem.getInfoAsync(offlineFile.localPath)
      return fileInfo.exists ? offlineFile.localPath : null
    } catch {
      return null
    }
  }

  /**
   * Update offline file sync status
   */
  async updateSyncStatus(fileId: string, status: 'synced' | 'modified' | 'conflict'): Promise<void> {
    await this.ensureInitialized()
    if (!this.db) return

    try {
      await this.db.runAsync(
        'UPDATE offline_files SET sync_status = ? WHERE file_id = ?',
        [status, fileId]
      )
    } catch (error) {
      console.error('Failed to update sync status:', error)
      throw new Error('Failed to update sync status')
    }
  }

  /**
   * Mark file as synced after successful sync
   */
  async markFileAsSynced(fileId: string): Promise<void> {
    await this.updateSyncStatus(fileId, 'synced')
  }

  /**
   * Read file content from local storage
   */
  async readFileContent(fileId: string): Promise<string | null> {
    try {
      const offlineFile = await this.getOfflineFile(fileId)
      if (!offlineFile) return null

      const fileInfo = await FileSystem.getInfoAsync(offlineFile.localPath)
      if (!fileInfo.exists) return null

      const content = await FileSystem.readAsStringAsync(offlineFile.localPath)
      return content
    } catch (error) {
      console.error('Failed to read file content:', error)
      return null
    }
  }

  /**
   * Update file content in local storage
   */
  async updateFileContent(fileId: string, content: string): Promise<void> {
    try {
      const offlineFile = await this.getOfflineFile(fileId)
      if (!offlineFile) {
        throw new Error('File not found in offline storage')
      }

      await FileSystem.writeAsStringAsync(offlineFile.localPath, content)
      await this.markFileAsModified(fileId)
    } catch (error) {
      console.error('Failed to update file content:', error)
      throw new Error('Failed to update file content')
    }
  }

  /**
   * Get files with conflicts
   */
  async getConflictFiles(): Promise<OfflineFileWithMetadata[]> {
    await this.ensureInitialized()
    if (!this.db) return []

    try {
      const results = await this.db.getAllAsync<any>(
        'SELECT * FROM offline_files WHERE sync_status = ? ORDER BY last_modified DESC',
        ['conflict']
      )

      return results.map(row => this.mapDbRowToOfflineFile(row))
    } catch (error) {
      console.error('Failed to get conflict files:', error)
      return []
    }
  }

  /**
   * Get files that failed to sync
   */
  async getFailedFiles(): Promise<OfflineFileWithMetadata[]> {
    await this.ensureInitialized()
    if (!this.db) return []

    try {
      // For now, we'll consider files that have been modified for a long time as potentially failed
      const oneDayAgo = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000)
      const results = await this.db.getAllAsync<unknown>(
        'SELECT * FROM offline_files WHERE sync_status = ? AND last_modified < ? ORDER BY last_modified DESC',
        ['modified', oneDayAgo]
      )

      return results.map(row => this.mapDbRowToOfflineFile(row))
    } catch (error) {
      console.error('Failed to get failed files:', error)
      return []
    }
  }

  /**
   * Get count of files by sync status
   */
  async getSyncStatusCounts(): Promise<{
    synced: number
    modified: number
    conflict: number
    failed: number
  }> {
    await this.ensureInitialized()
    if (!this.db) return { synced: 0, modified: 0, conflict: 0, failed: 0 }

    try {
      const result = await this.db.getFirstAsync<{
        synced_count: number
        modified_count: number
        conflict_count: number
      }>(`
        SELECT 
          SUM(CASE WHEN sync_status = 'synced' THEN 1 ELSE 0 END) as synced_count,
          SUM(CASE WHEN sync_status = 'modified' THEN 1 ELSE 0 END) as modified_count,
          SUM(CASE WHEN sync_status = 'conflict' THEN 1 ELSE 0 END) as conflict_count
        FROM offline_files
      `)

      // Calculate failed files (modified for more than 24 hours)
      const oneDayAgo = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000)
      const failedResult = await this.db.getFirstAsync<{ failed_count: number }>(`
        SELECT COUNT(*) as failed_count
        FROM offline_files 
        WHERE sync_status = 'modified' AND last_modified < ?
      `, [oneDayAgo])

      return {
        synced: result?.synced_count || 0,
        modified: (result?.modified_count || 0) - (failedResult?.failed_count || 0),
        conflict: result?.conflict_count || 0,
        failed: failedResult?.failed_count || 0,
      }
    } catch (error) {
      console.error('Failed to get sync status counts:', error)
      return { synced: 0, modified: 0, conflict: 0, failed: 0 }
    }
  }

  // Private helper methods

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }

  private async saveOfflineFile(offlineFile: OfflineFileWithMetadata): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    const downloadedAtTimestamp = Math.floor(offlineFile.downloadedAt.getTime() / 1000)
    const accessedAtTimestamp = Math.floor(offlineFile.accessedAt.getTime() / 1000)
    const lastModifiedTimestamp = Math.floor(offlineFile.lastModified.getTime() / 1000)

    await this.db.runAsync(`
      INSERT OR REPLACE INTO offline_files (
        id, file_id, local_path, original_name, size, mime_type,
        last_modified, sync_status, downloaded_at, accessed_at,
        is_starred, parent_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      offlineFile.id,
      offlineFile.fileId,
      offlineFile.localPath,
      offlineFile.originalName,
      offlineFile.size,
      offlineFile.mimeType || null,
      lastModifiedTimestamp,
      offlineFile.syncStatus,
      downloadedAtTimestamp,
      accessedAtTimestamp,
      offlineFile.isStarred ? 1 : 0,
      offlineFile.parentId || null,
    ])
  }

  private mapDbRowToOfflineFile(row: unknown): OfflineFileWithMetadata {
    const r = row as Record<string, unknown>
    return {
      id: r.id as string,
      fileId: r.file_id as string,
      localPath: r.local_path as string,
      originalName: r.original_name as string,
      size: r.size as number,
      mimeType: r.mime_type as string | undefined,
      lastModified: new Date((r.last_modified as number) * 1000),
      syncStatus: r.sync_status as 'synced' | 'modified' | 'conflict',
      downloadedAt: new Date((r.downloaded_at as number) * 1000),
      accessedAt: new Date((r.accessed_at as number) * 1000),
      isStarred: r.is_starred === 1,
      parentId: r.parent_id as string | undefined,
    }
  }

  private sanitizeFileName(fileName: string): string {
    // Remove or replace invalid characters for file system
    return fileName.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_')
  }

  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageService()
export default offlineStorage