import * as SQLite from 'expo-sqlite'
import { syncService, SyncProgress } from './syncService'
import { offlineStorage } from './storage/offlineStorage'

export interface SyncQueueItem {
  id: string
  fileId: string
  fileName: string
  operation: 'upload' | 'download' | 'update' | 'delete'
  priority: 'low' | 'normal' | 'high'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  retryCount: number
  maxRetries: number
  createdAt: Date
  updatedAt: Date
  error?: string | undefined
  metadata?: Record<string, unknown> | undefined
}

export interface SyncQueueStats {
  totalItems: number
  pendingItems: number
  processingItems: number
  completedItems: number
  failedItems: number
}

class SyncQueueService {
  private static instance: SyncQueueService
  private db: SQLite.SQLiteDatabase | null = null
  private isInitialized = false
  private isProcessing = false
  private processingInterval?: ReturnType<typeof setInterval> | undefined
  private listeners: Set<(stats: SyncQueueStats) => void> = new Set()

  private readonly PROCESSING_INTERVAL = 5000 // 5 seconds
  private readonly MAX_CONCURRENT_OPERATIONS = 3
  private readonly DEFAULT_MAX_RETRIES = 3

  static getInstance(): SyncQueueService {
    if (!SyncQueueService.instance) {
      SyncQueueService.instance = new SyncQueueService()
    }
    return SyncQueueService.instance
  }

  /**
   * Initialize the sync queue
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      this.db = await SQLite.openDatabaseAsync('sync_queue.db')
      await this.createTables()
      this.isInitialized = true
      
      // Start processing queue
      this.startProcessing()
    } catch (error) {
      console.error('Failed to initialize sync queue:', error)
      throw new Error('Failed to initialize sync queue')
    }
  }

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        file_id TEXT NOT NULL,
        file_name TEXT NOT NULL,
        operation TEXT NOT NULL,
        priority TEXT DEFAULT 'normal',
        status TEXT DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        error TEXT,
        metadata TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_priority ON sync_queue(priority, created_at);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_file_id ON sync_queue(file_id);
    `)
  }

  /**
   * Add item to sync queue
   */
  async addToQueue(
    fileId: string,
    fileName: string,
    operation: SyncQueueItem['operation'],
    options: {
      priority?: SyncQueueItem['priority']
      maxRetries?: number
      metadata?: Record<string, unknown>
    } = {}
  ): Promise<string> {
    await this.ensureInitialized()
    if (!this.db) throw new Error('Database not initialized')

    const id = this.generateId()
    const now = Date.now()
    const { priority = 'normal', maxRetries = this.DEFAULT_MAX_RETRIES, metadata } = options

    try {
      await this.db.runAsync(`
        INSERT INTO sync_queue (
          id, file_id, file_name, operation, priority, status,
          retry_count, max_retries, created_at, updated_at, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        fileId,
        fileName,
        operation,
        priority,
        'pending',
        0,
        maxRetries,
        now,
        now,
        metadata ? JSON.stringify(metadata) : null
      ])

      this.notifyListeners()
      return id
    } catch (error) {
      console.error('Failed to add item to sync queue:', error)
      throw new Error('Failed to add item to sync queue')
    }
  }

  /**
   * Remove item from queue
   */
  async removeFromQueue(itemId: string): Promise<void> {
    await this.ensureInitialized()
    if (!this.db) return

    try {
      await this.db.runAsync('DELETE FROM sync_queue WHERE id = ?', [itemId])
      this.notifyListeners()
    } catch (error) {
      console.error('Failed to remove item from sync queue:', error)
    }
  }

  /**
   * Update queue item status
   */
  async updateItemStatus(
    itemId: string,
    status: SyncQueueItem['status'],
    error?: string
  ): Promise<void> {
    await this.ensureInitialized()
    if (!this.db) return

    try {
      const now = Date.now()
      await this.db.runAsync(
        'UPDATE sync_queue SET status = ?, updated_at = ?, error = ? WHERE id = ?',
        [status, now, error || null, itemId]
      )
      this.notifyListeners()
    } catch (error) {
      console.error('Failed to update queue item status:', error)
    }
  }

  /**
   * Increment retry count for failed item
   */
  async incrementRetryCount(itemId: string): Promise<boolean> {
    await this.ensureInitialized()
    if (!this.db) return false

    try {
      const item = await this.getQueueItem(itemId)
      if (!item) return false

      const newRetryCount = item.retryCount + 1
      const newStatus = newRetryCount >= item.maxRetries ? 'failed' : 'pending'

      await this.db.runAsync(
        'UPDATE sync_queue SET retry_count = ?, status = ?, updated_at = ? WHERE id = ?',
        [newRetryCount, newStatus, Date.now(), itemId]
      )

      this.notifyListeners()
      return newStatus === 'pending'
    } catch (error) {
      console.error('Failed to increment retry count:', error)
      return false
    }
  }

  /**
   * Get queue item by ID
   */
  async getQueueItem(itemId: string): Promise<SyncQueueItem | null> {
    await this.ensureInitialized()
    if (!this.db) return null

    try {
      const result = await this.db.getFirstAsync<unknown>(
        'SELECT * FROM sync_queue WHERE id = ?',
        [itemId]
      )

      if (!result) return null
      return this.mapDbRowToQueueItem(result)
    } catch (error) {
      console.error('Failed to get queue item:', error)
      return null
    }
  }

  /**
   * Get pending queue items
   */
  async getPendingItems(limit?: number): Promise<SyncQueueItem[]> {
    await this.ensureInitialized()
    if (!this.db) return []

    try {
      const query = `
        SELECT * FROM sync_queue 
        WHERE status = 'pending' 
        ORDER BY 
          CASE priority 
            WHEN 'high' THEN 1 
            WHEN 'normal' THEN 2 
            WHEN 'low' THEN 3 
          END,
          created_at ASC
        ${limit ? `LIMIT ${limit}` : ''}
      `

      const results = await this.db.getAllAsync<unknown>(query)
      return results.map(row => this.mapDbRowToQueueItem(row))
    } catch (error) {
      console.error('Failed to get pending items:', error)
      return []
    }
  }

  /**
   * Get all queue items
   */
  async getAllItems(): Promise<SyncQueueItem[]> {
    await this.ensureInitialized()
    if (!this.db) return []

    try {
      const results = await this.db.getAllAsync<unknown>(
        'SELECT * FROM sync_queue ORDER BY created_at DESC'
      )
      return results.map(row => this.mapDbRowToQueueItem(row))
    } catch (error) {
      console.error('Failed to get all queue items:', error)
      return []
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<SyncQueueStats> {
    await this.ensureInitialized()
    if (!this.db) {
      return {
        totalItems: 0,
        pendingItems: 0,
        processingItems: 0,
        completedItems: 0,
        failedItems: 0,
      }
    }

    try {
      const result = await this.db.getFirstAsync<{
        total_items: number
        pending_items: number
        processing_items: number
        completed_items: number
        failed_items: number
      }>(`
        SELECT 
          COUNT(*) as total_items,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_items,
          SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_items,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_items,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_items
        FROM sync_queue
      `)

      return {
        totalItems: result?.total_items || 0,
        pendingItems: result?.pending_items || 0,
        processingItems: result?.processing_items || 0,
        completedItems: result?.completed_items || 0,
        failedItems: result?.failed_items || 0,
      }
    } catch (error) {
      console.error('Failed to get queue stats:', error)
      return {
        totalItems: 0,
        pendingItems: 0,
        processingItems: 0,
        completedItems: 0,
        failedItems: 0,
      }
    }
  }

  /**
   * Clear completed items from queue
   */
  async clearCompleted(): Promise<void> {
    await this.ensureInitialized()
    if (!this.db) return

    try {
      await this.db.runAsync('DELETE FROM sync_queue WHERE status = ?', ['completed'])
      this.notifyListeners()
    } catch (error) {
      console.error('Failed to clear completed items:', error)
    }
  }

  /**
   * Clear all items from queue
   */
  async clearAll(): Promise<void> {
    await this.ensureInitialized()
    if (!this.db) return

    try {
      await this.db.runAsync('DELETE FROM sync_queue')
      this.notifyListeners()
    } catch (error) {
      console.error('Failed to clear all items:', error)
    }
  }

  /**
   * Start processing queue items
   */
  startProcessing(): void {
    if (this.processingInterval) return

    this.processingInterval = setInterval(async () => {
      if (!this.isProcessing) {
        await this.processQueue()
      }
    }, this.PROCESSING_INTERVAL)
  }

  /**
   * Stop processing queue items
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = undefined
    }
  }

  /**
   * Process queue items
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return

    this.isProcessing = true

    try {
      const pendingItems = await this.getPendingItems(this.MAX_CONCURRENT_OPERATIONS)
      
      if (pendingItems.length === 0) {
        return
      }

      // Process items concurrently
      const processingPromises = pendingItems.map(item => this.processQueueItem(item))
      await Promise.allSettled(processingPromises)

    } catch (error) {
      console.error('Error processing sync queue:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Process a single queue item
   */
  private async processQueueItem(item: SyncQueueItem): Promise<void> {
    try {
      // Mark as processing
      await this.updateItemStatus(item.id, 'processing')

      // Execute the operation based on type
      switch (item.operation) {
        case 'upload':
          await this.processUploadOperation(item)
          break
        case 'download':
          await this.processDownloadOperation(item)
          break
        case 'update':
          await this.processUpdateOperation(item)
          break
        case 'delete':
          await this.processDeleteOperation(item)
          break
        default:
          throw new Error(`Unknown operation: ${item.operation}`)
      }

      // Mark as completed
      await this.updateItemStatus(item.id, 'completed')

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`Failed to process queue item ${item.id}:`, errorMessage)

      // Try to retry or mark as failed
      const canRetry = await this.incrementRetryCount(item.id)
      if (!canRetry) {
        await this.updateItemStatus(item.id, 'failed', errorMessage)
      }
    }
  }

  /**
   * Process upload operation
   */
  private async processUploadOperation(item: SyncQueueItem): Promise<void> {
    // Check if file is available offline and modified
    const offlineFile = await offlineStorage.getOfflineFile(item.fileId)
    if (!offlineFile || offlineFile.syncStatus !== 'modified') {
      throw new Error('File not available for upload or not modified')
    }

    // Trigger sync for this specific file
    await syncService.syncFile(offlineFile, {
      forceSync: true,
      onProgress: (progress: SyncProgress) => {
        // Progress is handled by the sync service
        console.warn(`Upload progress for ${item.fileName}: ${progress.progress}%`)
      }
    })
  }

  /**
   * Process download operation
   */
  private async processDownloadOperation(item: SyncQueueItem): Promise<void> {
    // This would typically involve downloading a file for offline access
    // For now, we'll just mark it as completed since the offline storage
    // handles downloads through its own mechanism
    console.warn(`Download operation for ${item.fileName} - delegating to offline storage`)
  }

  /**
   * Process update operation
   */
  private async processUpdateOperation(item: SyncQueueItem): Promise<void> {
    // Similar to upload, but for metadata updates
    const offlineFile = await offlineStorage.getOfflineFile(item.fileId)
    if (!offlineFile) {
      throw new Error('File not found for update')
    }

    await syncService.syncFile(offlineFile, { forceSync: true })
  }

  /**
   * Process delete operation
   */
  private async processDeleteOperation(item: SyncQueueItem): Promise<void> {
    // Remove from offline storage
    await offlineStorage.removeOfflineFile(item.fileId)
  }

  /**
   * Add status listener
   */
  addStatusListener(listener: (stats: SyncQueueStats) => void): () => void {
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
      const stats = await this.getQueueStats()
      this.listeners.forEach(listener => {
        try {
          listener(stats)
        } catch (error) {
          console.error('Error in sync queue status listener:', error)
        }
      })
    } catch (error) {
      console.error('Error getting sync queue stats for listeners:', error)
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopProcessing()
    this.listeners.clear()
  }

  // Private helper methods

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }

  private mapDbRowToQueueItem(row: unknown): SyncQueueItem {
    const r = row as Record<string, unknown>
    return {
      id: r.id as string,
      fileId: r.file_id as string,
      fileName: r.file_name as string,
      operation: r.operation as SyncQueueItem['operation'],
      priority: r.priority as SyncQueueItem['priority'],
      status: r.status as SyncQueueItem['status'],
      retryCount: r.retry_count as number,
      maxRetries: r.max_retries as number,
      createdAt: new Date(r.created_at as number),
      updatedAt: new Date(r.updated_at as number),
      error: r.error as string | undefined || undefined,
      metadata: r.metadata ? JSON.parse(r.metadata as string) : undefined,
    }
  }

  private generateId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const syncQueue = SyncQueueService.getInstance()
export default syncQueue