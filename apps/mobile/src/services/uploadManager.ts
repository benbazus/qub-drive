import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'
import * as BackgroundFetch from 'expo-background-fetch'
import NetInfo, { NetInfoState } from '@react-native-community/netinfo'
import { fileApi } from './api/fileApi'
import { FileItem, UploadProgress } from '@/types/file'
import { uploadQueueStore } from '@/stores/uploadQueue/uploadQueueStore'
import { secureStorage } from '@/utils/storage'
import { STORAGE_KEYS } from '@/config/constants'

// Background task name
const BACKGROUND_UPLOAD_TASK = 'background-upload-task'

export interface UploadQueueItem {
  id: string
  uri: string
  fileName: string
  size: number
  parentId?: string | undefined
  progress: UploadProgress
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'paused' | 'cancelled'
  error?: string
  result?: FileItem
  retryCount: number
  maxRetries: number
  createdAt: Date
  updatedAt: Date
}

export interface UploadManagerOptions {
  maxConcurrentUploads?: number
  enableBackgroundUploads?: boolean
  enableNotifications?: boolean
  retryOnNetworkReconnect?: boolean
  maxRetries?: number
}

export interface NetworkStatus {
  isConnected: boolean
  type: string | null
  isInternetReachable: boolean | null
}

class UploadManagerService {
  private static instance: UploadManagerService
  private isInitialized = false
  private activeUploads = new Map<string, AbortController>()
  private networkStatus: NetworkStatus = {
    isConnected: true,
    type: null,
    isInternetReachable: null
  }
  private options: Required<UploadManagerOptions> = {
    maxConcurrentUploads: 3,
    enableBackgroundUploads: true,
    enableNotifications: true,
    retryOnNetworkReconnect: true,
    maxRetries: 3
  }

  private constructor() {}

  static getInstance(): UploadManagerService {
    if (!UploadManagerService.instance) {
      UploadManagerService.instance = new UploadManagerService()
    }
    return UploadManagerService.instance
  }

  /**
   * Initialize the upload manager
   */
  async initialize(options: UploadManagerOptions = {}): Promise<void> {
    if (this.isInitialized) return

    this.options = { ...this.options, ...options }

    // Setup notifications
    if (this.options.enableNotifications) {
      await this.setupNotifications()
    }

    // Setup background tasks
    if (this.options.enableBackgroundUploads) {
      await this.setupBackgroundTasks()
    }

    // Setup network monitoring
    await this.setupNetworkMonitoring()

    // Restore pending uploads from storage
    await this.restorePendingUploads()

    this.isInitialized = true
  }

  /**
   * Setup push notifications
   */
  private async setupNotifications(): Promise<void> {
    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync()
      if (status !== 'granted') {
        console.warn('Notification permissions not granted')
        return
      }

      // Configure notification behavior
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      })

      // Configure notification categories
      await Notifications.setNotificationCategoryAsync('upload', [
        {
          identifier: 'pause',
          buttonTitle: 'Pause',
          options: { opensAppToForeground: false }
        },
        {
          identifier: 'cancel',
          buttonTitle: 'Cancel',
          options: { opensAppToForeground: false, isDestructive: true }
        }
      ])

    } catch (error) {
      console.error('Failed to setup notifications:', error)
    }
  }

  /**
   * Setup background tasks
   */
  private async setupBackgroundTasks(): Promise<void> {
    try {
      // Define background task
      TaskManager.defineTask(BACKGROUND_UPLOAD_TASK, async () => {
        try {
          await this.processBackgroundUploads()
          return BackgroundFetch.BackgroundFetchResult.NewData
        } catch (error) {
          console.error('Background upload task failed:', error)
          return BackgroundFetch.BackgroundFetchResult.Failed
        }
      })

      // Register background fetch
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_UPLOAD_TASK)
      if (!isRegistered) {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_UPLOAD_TASK, {
          minimumInterval: 15000, // 15 seconds
          stopOnTerminate: false,
          startOnBoot: true,
        })
      }

    } catch (error) {
      console.error('Failed to setup background tasks:', error)
    }
  }

  /**
   * Setup network monitoring
   */
  private async setupNetworkMonitoring(): Promise<void> {
    try {
      // Get initial network state
      const netInfo = await NetInfo.fetch()
      this.networkStatus = {
        isConnected: netInfo.isConnected ?? false,
        type: netInfo.type,
        isInternetReachable: netInfo.isInternetReachable
      }

      // Listen for network changes
      NetInfo.addEventListener((state: NetInfoState) => {
        const wasConnected = this.networkStatus.isConnected
        this.networkStatus = {
          isConnected: state.isConnected ?? false,
          type: state.type,
          isInternetReachable: state.isInternetReachable
        }

        // Resume uploads when network reconnects
        if (!wasConnected && this.networkStatus.isConnected && this.options.retryOnNetworkReconnect) {
          this.resumeFailedUploads()
        }
      })

    } catch (error) {
      console.error('Failed to setup network monitoring:', error)
    }
  }

  /**
   * Restore pending uploads from storage
   */
  private async restorePendingUploads(): Promise<void> {
    try {
      const storedQueue = await secureStorage.getItem(STORAGE_KEYS.UPLOAD_QUEUE)
      if (storedQueue) {
        const queue: UploadQueueItem[] = JSON.parse(storedQueue)
        
        // Filter out completed/cancelled uploads and restore pending ones
        const pendingUploads = queue.filter(item => 
          item.status === 'pending' || item.status === 'failed'
        ).map(item => ({
          ...item,
          status: 'pending' as const,
          progress: { ...item.progress, status: 'pending' as const }
        }))

        if (pendingUploads.length > 0) {
          uploadQueueStore.getState().restoreQueue(pendingUploads)
          
          // Auto-start uploads if network is available
          if (this.networkStatus.isConnected) {
            this.processQueue()
          }
        }
      }
    } catch (error) {
      console.error('Failed to restore pending uploads:', error)
    }
  }

  /**
   * Add files to upload queue
   */
  async addToQueue(files: {
    uri: string
    fileName: string
    size: number
    parentId?: string
  }[]): Promise<string[]> {
    const queueItems: UploadQueueItem[] = files.map(file => ({
      id: this.generateUploadId(),
      uri: file.uri,
      fileName: file.fileName,
      size: file.size,
      parentId: file.parentId || undefined,
      progress: {
        id: this.generateUploadId(),
        fileName: file.fileName,
        progress: 0,
        status: 'pending',
        loaded: 0,
        total: file.size
      },
      status: 'pending',
      retryCount: 0,
      maxRetries: this.options.maxRetries,
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    // Add to store
    uploadQueueStore.getState().addItems(queueItems)

    // Save to storage
    await this.saveQueueToStorage()

    // Start processing if network is available
    if (this.networkStatus.isConnected) {
      this.processQueue()
    }

    return queueItems.map(item => item.id)
  }

  /**
   * Process upload queue
   */
  async processQueue(): Promise<void> {
    if (!this.networkStatus.isConnected) {
      return
    }

    const queue = uploadQueueStore.getState().queue
    const pendingItems = queue.filter(item => item.status === 'pending')
    const activeCount = Array.from(this.activeUploads.keys()).length

    if (pendingItems.length === 0 || activeCount >= this.options.maxConcurrentUploads) {
      return
    }

    // Process items up to the concurrent limit
    const itemsToProcess = pendingItems.slice(0, this.options.maxConcurrentUploads - activeCount)
    
    for (const item of itemsToProcess) {
      this.uploadSingleFile(item)
    }
  }

  /**
   * Upload a single file
   */
  private async uploadSingleFile(item: UploadQueueItem): Promise<void> {
    const controller = new AbortController()
    this.activeUploads.set(item.id, controller)

    try {
      // Update status to uploading
      uploadQueueStore.getState().updateItem(item.id, {
        status: 'uploading',
        progress: { ...item.progress, status: 'uploading' },
        updatedAt: new Date()
      })

      // Show notification for upload start
      if (this.options.enableNotifications) {
        await this.showUploadNotification(item, 'started')
      }

      // Create blob from file URI
      const response = await fetch(item.uri)
      const blob = await response.blob()

      // Upload file with progress tracking
      const result = await fileApi.uploadFile(
        blob,
        item.fileName,
        item.parentId,
        {
          signal: controller.signal,
          onProgress: (progress) => {
            uploadQueueStore.getState().updateItem(item.id, {
              progress: {
                ...progress,
                id: item.id,
                fileName: item.fileName
              },
              updatedAt: new Date()
            })
          }
        }
      )

      // Upload completed successfully
      uploadQueueStore.getState().updateItem(item.id, {
        status: 'completed',
        result,
        progress: {
          ...item.progress,
          progress: 100,
          status: 'completed'
        },
        updatedAt: new Date()
      })

      // Show completion notification
      if (this.options.enableNotifications) {
        await this.showUploadNotification(item, 'completed')
      }

    } catch (error) {
      const isAborted = error instanceof Error && error.name === 'AbortError'
      
      if (!isAborted) {
        // Handle upload failure
        const shouldRetry = item.retryCount < item.maxRetries && this.shouldRetryError(error)
        
        if (shouldRetry) {
          // Retry upload
          uploadQueueStore.getState().updateItem(item.id, {
            status: 'pending',
            retryCount: item.retryCount + 1,
            progress: { ...item.progress, status: 'pending', progress: 0 },
            updatedAt: new Date()
          })
          
          // Retry after delay
          setTimeout(() => {
            if (this.networkStatus.isConnected) {
              this.uploadSingleFile(item)
            }
          }, this.calculateRetryDelay(item.retryCount))
          
        } else {
          // Mark as failed
          uploadQueueStore.getState().updateItem(item.id, {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Upload failed',
            progress: { ...item.progress, status: 'failed' },
            updatedAt: new Date()
          })

          // Show failure notification
          if (this.options.enableNotifications) {
            await this.showUploadNotification(item, 'failed', error instanceof Error ? error.message : 'Upload failed')
          }
        }
      }

    } finally {
      this.activeUploads.delete(item.id)
      await this.saveQueueToStorage()
      
      // Continue processing queue
      setTimeout(() => this.processQueue(), 100)
    }
  }

  /**
   * Pause upload
   */
  async pauseUpload(uploadId: string): Promise<void> {
    const controller = this.activeUploads.get(uploadId)
    if (controller) {
      controller.abort()
      this.activeUploads.delete(uploadId)
    }

    const currentItem = uploadQueueStore.getState().getItem(uploadId)
    if (currentItem) {
      uploadQueueStore.getState().updateItem(uploadId, {
        status: 'paused',
        progress: { ...currentItem.progress, status: 'paused' },
        updatedAt: new Date()
      })
    }

    await this.saveQueueToStorage()
  }

  /**
   * Resume upload
   */
  async resumeUpload(uploadId: string): Promise<void> {
    const item = uploadQueueStore.getState().getItem(uploadId)
    if (item && (item.status === 'paused' || item.status === 'failed')) {
      uploadQueueStore.getState().updateItem(uploadId, {
        status: 'pending',
        progress: { ...item.progress, status: 'pending' },
        updatedAt: new Date()
      })

      await this.saveQueueToStorage()

      if (this.networkStatus.isConnected) {
        this.processQueue()
      }
    }
  }

  /**
   * Cancel upload
   */
  async cancelUpload(uploadId: string): Promise<void> {
    const controller = this.activeUploads.get(uploadId)
    if (controller) {
      controller.abort()
      this.activeUploads.delete(uploadId)
    }

    const currentItem = uploadQueueStore.getState().getItem(uploadId)
    if (currentItem) {
      uploadQueueStore.getState().updateItem(uploadId, {
        status: 'cancelled',
        progress: { ...currentItem.progress, status: 'cancelled' },
        updatedAt: new Date()
      })
    }

    await this.saveQueueToStorage()
  }

  /**
   * Retry failed upload
   */
  async retryUpload(uploadId: string): Promise<void> {
    const item = uploadQueueStore.getState().getItem(uploadId)
    if (item && item.status === 'failed') {
      uploadQueueStore.getState().updateItem(uploadId, {
        status: 'pending',
        retryCount: 0,
        progress: { ...item.progress, status: 'pending', progress: 0 },
        updatedAt: new Date()
      })

      await this.saveQueueToStorage()

      if (this.networkStatus.isConnected) {
        this.processQueue()
      }
    }
  }

  /**
   * Clear completed uploads
   */
  async clearCompleted(): Promise<void> {
    uploadQueueStore.getState().clearCompleted()
    await this.saveQueueToStorage()
  }

  /**
   * Clear all uploads
   */
  async clearAll(): Promise<void> {
    // Cancel all active uploads
    for (const controller of this.activeUploads.values()) {
      controller.abort()
    }
    this.activeUploads.clear()

    uploadQueueStore.getState().clearAll()
    await this.saveQueueToStorage()
  }

  /**
   * Resume failed uploads when network reconnects
   */
  private async resumeFailedUploads(): Promise<void> {
    const queue = uploadQueueStore.getState().queue
    const failedItems = queue.filter(item => item.status === 'failed' && item.retryCount < item.maxRetries)

    for (const item of failedItems) {
      uploadQueueStore.getState().updateItem(item.id, {
        status: 'pending',
        progress: { ...item.progress, status: 'pending' },
        updatedAt: new Date()
      })
    }

    if (failedItems.length > 0) {
      await this.saveQueueToStorage()
      this.processQueue()
    }
  }

  /**
   * Process background uploads
   */
  private async processBackgroundUploads(): Promise<void> {
    if (!this.networkStatus.isConnected) return

    const queue = uploadQueueStore.getState().queue
    const pendingItems = queue.filter(item => item.status === 'pending')

    // Process a limited number of uploads in background
    const backgroundLimit = Math.min(2, this.options.maxConcurrentUploads)
    const itemsToProcess = pendingItems.slice(0, backgroundLimit)

    for (const item of itemsToProcess) {
      try {
        await this.uploadSingleFile(item)
      } catch (error) {
        console.error('Background upload failed:', error)
      }
    }
  }

  /**
   * Show upload notification
   */
  private async showUploadNotification(
    item: UploadQueueItem, 
    type: 'started' | 'completed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    try {
      let title: string
      let body: string
      let categoryIdentifier: string | undefined

      switch (type) {
        case 'started':
          title = 'Upload Started'
          body = `Uploading ${item.fileName}...`
          categoryIdentifier = 'upload'
          break
        case 'completed':
          title = 'Upload Complete'
          body = `${item.fileName} uploaded successfully`
          break
        case 'failed':
          title = 'Upload Failed'
          body = `Failed to upload ${item.fileName}${errorMessage ? `: ${errorMessage}` : ''}`
          break
      }

      const notificationContent: Notifications.NotificationContentInput = {
        title,
        body,
        data: { uploadId: item.id, type }
      }
      
      if (categoryIdentifier) {
        notificationContent.categoryIdentifier = categoryIdentifier
      }

      await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null
      })

    } catch (error) {
      console.error('Failed to show notification:', error)
    }
  }

  /**
   * Save queue to storage
   */
  private async saveQueueToStorage(): Promise<void> {
    try {
      const queue = uploadQueueStore.getState().queue
      await secureStorage.setItem(STORAGE_KEYS.UPLOAD_QUEUE, JSON.stringify(queue))
    } catch (error) {
      console.error('Failed to save queue to storage:', error)
    }
  }

  /**
   * Generate unique upload ID
   */
  private generateUploadId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Check if error should be retried
   */
  private shouldRetryError(error: unknown): boolean {
    if (error instanceof Error) {
      const nonRetryableErrors = [
        'Authentication required',
        'Access denied',
        'File not found',
        'Invalid file type',
        'File too large',
        'Validation failed'
      ]
      
      return !nonRetryableErrors.some(msg => 
        error.message.toLowerCase().includes(msg.toLowerCase())
      )
    }
    return true
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(retryCount: number): number {
    return Math.min(1000 * Math.pow(2, retryCount), 30000) // Max 30 seconds
  }

  /**
   * Get upload statistics
   */
  getUploadStats() {
    return uploadQueueStore.getState().getStats()
  }

  /**
   * Get network status
   */
  getNetworkStatus(): NetworkStatus {
    return this.networkStatus
  }

  /**
   * Check if uploads are active
   */
  hasActiveUploads(): boolean {
    return this.activeUploads.size > 0
  }
}

export const uploadManager = UploadManagerService.getInstance()
export default uploadManager