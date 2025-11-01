import { fileApi, UploadOptions, FileListParams, SearchParams } from './api/fileApi'
import { FileItem, UploadProgress } from '@/types/file'
import * as FileSystem from 'expo-file-system'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { Alert } from 'react-native'

export interface FileOperationCallbacks {
  onProgress?: (progress: UploadProgress) => void
  onSuccess?: (result: FileItem) => void
  onError?: (error: Error) => void
  onStart?: () => void
  onComplete?: () => void
}

export interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  backoffMultiplier?: number
}

export interface ValidationOptions {
  maxSize?: number
  allowedTypes?: string[]
  blockedTypes?: string[]
}

export interface UploadFileOptions extends UploadOptions {
  parentId?: string | null
  validation?: ValidationOptions
  retry?: RetryOptions
  callbacks?: FileOperationCallbacks
}

export interface CreateFolderOptions {
  name: string
  parentId?: string | null
  validation?: {
    maxNameLength?: number
    forbiddenNames?: string[]
  }
}

class FileOperationsService {
  private readonly defaultRetryOptions: RetryOptions = {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
  }

  private readonly defaultValidation: ValidationOptions = {
    maxSize: 100 * 1024 * 1024, // 100MB
    blockedTypes: ['.exe', '.bat', '.cmd', '.scr', '.pif'],
  }

  /**
   * Retry wrapper for API operations
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const { maxRetries, retryDelay, backoffMultiplier } = {
      ...this.defaultRetryOptions,
      ...options,
    }

    let lastError: Error
    let delay = retryDelay || 1000

    for (let attempt = 0; attempt <= (maxRetries || 3); attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(lastError) || attempt === maxRetries) {
          throw lastError
        }

        // Wait before retrying
        await this.delay(delay)
        delay *= backoffMultiplier || 2
      }
    }

    throw lastError!
  }

  /**
   * Check if error should not be retried
   */
  private isNonRetryableError(error: Error): boolean {
    const nonRetryableMessages = [
      'Authentication required',
      'Access denied',
      'File not found',
      'Invalid file type',
      'File too large',
      'Validation failed',
    ]

    return nonRetryableMessages.some(msg => 
      error.message.toLowerCase().includes(msg.toLowerCase())
    )
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Validate file before upload
   */
  validateFile(file: { size: number; name: string; type?: string }, options: ValidationOptions = {}): {
    valid: boolean
    error?: string
  } {
    const validation = { ...this.defaultValidation, ...options }

    // Check file size
    if (validation.maxSize && file.size > validation.maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${this.formatFileSize(validation.maxSize)}`,
      }
    }

    // Check allowed types
    if (validation.allowedTypes && validation.allowedTypes.length > 0) {
      const fileExtension = this.getFileExtension(file.name)
      const mimeType = file.type?.toLowerCase() || ''
      
      const isAllowed = validation.allowedTypes.some(type => 
        mimeType.includes(type.toLowerCase()) || 
        fileExtension.toLowerCase() === type.toLowerCase()
      )

      if (!isAllowed) {
        return {
          valid: false,
          error: `File type not allowed. Allowed types: ${validation.allowedTypes.join(', ')}`,
        }
      }
    }

    // Check blocked types
    if (validation.blockedTypes && validation.blockedTypes.length > 0) {
      const fileExtension = this.getFileExtension(file.name)
      const mimeType = file.type?.toLowerCase() || ''

      const isBlocked = validation.blockedTypes.some(type => 
        mimeType.includes(type.toLowerCase()) || 
        fileExtension.toLowerCase() === type.toLowerCase()
      )

      if (isBlocked) {
        return {
          valid: false,
          error: `File type not allowed. Blocked types: ${validation.blockedTypes.join(', ')}`,
        }
      }
    }

    return { valid: true }
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.')
    return lastDot !== -1 ? filename.substring(lastDot) : ''
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`
  }

  /**
   * Get files and folders
   */
  async getFiles(params: FileListParams = {}): Promise<FileItem[]> {
    return this.withRetry(() => fileApi.getFiles(params))
  }

  /**
   * Get folder contents
   */
  async getFolderContents(driveId: string, folderId?: string, params: Omit<FileListParams, 'parentId'> = {}): Promise<{
    folders: FileItem[]
    files: FileItem[]
    totalCount: number
  }> {
    return this.withRetry(() => fileApi.getFolderContents(driveId, folderId, params))
  }

  /**
   * Upload file from URI with validation and retry
   */
  async uploadFileFromUri(
    uri: string,
    fileName: string,
    options: UploadFileOptions = {}
  ): Promise<FileItem> {
    const { validation, retry, callbacks, ...uploadOptions } = options

    try {
      callbacks?.onStart?.()

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri)
      if (!fileInfo.exists) {
        throw new Error('File does not exist')
      }

      // Validate file
      if (validation) {
        const validationResult = this.validateFile({
          size: fileInfo.size || 0,
          name: fileName,
        }, validation)

        if (!validationResult.valid) {
          throw new Error(validationResult.error)
        }
      }

      // Create blob from file URI
      const response = await fetch(uri)
      const blob = await response.blob()

      // Upload with retry
      const result = await this.withRetry(
        () => fileApi.uploadFile(blob, fileName, options.parentId || undefined, uploadOptions),
        retry
      )

      callbacks?.onSuccess?.(result)
      callbacks?.onComplete?.()
      return result

    } catch (error) {
      const uploadError = error instanceof Error ? error : new Error('Upload failed')
      callbacks?.onError?.(uploadError)
      callbacks?.onComplete?.()
      throw uploadError
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: { uri: string; fileName: string }[],
    options: UploadFileOptions = {}
  ): Promise<FileItem[]> {
    const results: FileItem[] = []
    const totalFiles = files.length
    let completedFiles = 0

    try {
      options.callbacks?.onStart?.()

      const uploadPromises = files.map(async ({ uri, fileName }) => {
        try {
          const result = await this.uploadFileFromUri(uri, fileName, {
            ...options,
            callbacks: {
              onProgress: (progress: UploadProgress) => {
                // Calculate overall progress
                const overallProgress: UploadProgress = {
                  ...progress,
                  progress: ((completedFiles + progress.progress / 100) / totalFiles) * 100,
                }
                options.callbacks?.onProgress?.(overallProgress)
              },
              onSuccess: (uploadedFile: FileItem) => {
                completedFiles++
                results.push(uploadedFile)
                options.callbacks?.onSuccess?.(uploadedFile)
              },
              onError: options.callbacks?.onError || (() => {}),
            },
          })
          return result
        } catch (error) {
          console.error(`Failed to upload ${fileName}:`, error)
          throw error
        }
      })

      await Promise.allSettled(uploadPromises)
      options.callbacks?.onComplete?.()
      return results

    } catch (error) {
      options.callbacks?.onError?.(error instanceof Error ? error : new Error('Upload failed'))
      options.callbacks?.onComplete?.()
      throw error
    }
  }

  /**
   * Pick and upload files from device
   */
  async pickAndUploadFiles(options: UploadFileOptions & {
    allowMultiple?: boolean
    mediaTypes?: DocumentPicker.DocumentPickerOptions['type']
  } = {}): Promise<FileItem[]> {
    try {
      const { allowMultiple = true, mediaTypes, ...uploadOptions } = options

      // Pick files
      const result = await DocumentPicker.getDocumentAsync({
        type: mediaTypes || '*/*',
        multiple: allowMultiple,
        copyToCacheDirectory: true,
      })

      if (result.canceled) {
        return []
      }

      const files = result.assets.map(asset => ({
        uri: asset.uri,
        fileName: asset.name,
      }))

      // Upload files
      if (files.length === 1) {
        const uploadedFile = await this.uploadFileFromUri(
          files[0].uri,
          files[0].fileName,
          uploadOptions
        )
        return [uploadedFile]
      } else {
        return this.uploadMultipleFiles(files, uploadOptions)
      }

    } catch (error) {
      // Check if user cancelled the picker
      if (error && typeof error === 'object' && 'code' in error && error.code === 'DOCUMENT_PICKER_CANCELED') {
        return []
      }
      throw error
    }
  }

  /**
   * Pick and upload image from camera or gallery
   */
  async pickAndUploadImage(options: UploadFileOptions & {
    source: 'camera' | 'gallery'
    quality?: number
    allowsEditing?: boolean
  }): Promise<FileItem | null> {
    try {
      const { source, quality = 0.8, allowsEditing = true, ...uploadOptions } = options

      let result: ImagePicker.ImagePickerResult

      if (source === 'camera') {
        // Request camera permissions
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync()
        if (permissionResult.status !== 'granted') {
          throw new Error('Camera permission is required')
        }

        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing,
          aspect: [4, 3],
          quality,
        })
      } else {
        // Request media library permissions
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (permissionResult.status !== 'granted') {
          throw new Error('Media library permission is required')
        }

        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing,
          aspect: [4, 3],
          quality,
        })
      }

      if (result.canceled || !result.assets[0]) {
        return null
      }

      const asset = result.assets[0]
      const fileName = asset.fileName || `image_${Date.now()}.jpg`

      return this.uploadFileFromUri(asset.uri, fileName, uploadOptions)

    } catch (error) {
      throw error instanceof Error ? error : new Error('Image upload failed')
    }
  }

  /**
   * Create folder with validation
   */
  async createFolder(options: CreateFolderOptions): Promise<FileItem> {
    const { validation, ...createOptions } = options

    // Validate folder name
    if (validation) {
      if (validation.maxNameLength && createOptions.name.length > validation.maxNameLength) {
        throw new Error(`Folder name exceeds maximum length of ${validation.maxNameLength} characters`)
      }

      if (validation.forbiddenNames?.includes(createOptions.name.toLowerCase())) {
        throw new Error('Folder name is not allowed')
      }
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/
    if (invalidChars.test(createOptions.name)) {
      throw new Error('Folder name contains invalid characters')
    }

    return this.withRetry(() => fileApi.createFolder({
      name: createOptions.name,
      parentId: createOptions.parentId || undefined,
    }))
  }

  /**
   * Delete file with confirmation
   */
  async deleteFile(fileId: string, fileName: string, skipConfirmation: boolean = false): Promise<void> {
    if (!skipConfirmation) {
      return new Promise((resolve, reject) => {
        Alert.alert(
          'Delete File',
          `Are you sure you want to delete "${fileName}"?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => reject(new Error('User cancelled deletion')),
            },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  await this.withRetry(() => fileApi.deleteFile(fileId))
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

    return this.withRetry(() => fileApi.deleteFile(fileId))
  }

  /**
   * Move item to trash
   */
  async moveToTrash(itemId: string): Promise<void> {
    return this.withRetry(() => fileApi.moveToTrash(itemId))
  }

  /**
   * Restore from trash
   */
  async restoreFromTrash(itemId: string): Promise<void> {
    return this.withRetry(() => fileApi.restoreFromTrash(itemId))
  }

  /**
   * Move item to different folder
   */
  async moveItem(itemId: string, newParentId?: string): Promise<void> {
    return this.withRetry(() => fileApi.moveItem(itemId, { newParentId: newParentId || null }))
  }

  /**
   * Copy item
   */
  async copyItem(itemId: string, newParentId?: string, newName?: string): Promise<FileItem> {
    return this.withRetry(() => fileApi.copyItem(itemId, { 
      newParentId: newParentId || null, 
      newName
    }))
  }

  /**
   * Star/unstar item
   */
  async toggleStar(itemId: string, isStarred: boolean): Promise<void> {
    return this.withRetry(() => 
      isStarred ? fileApi.unstarItem(itemId) : fileApi.starItem(itemId)
    )
  }

  /**
   * Download file to device
   */
  async downloadFile(fileId: string, fileName: string): Promise<string> {
    try {
      // Get download URL
      const downloadUrl = await this.withRetry(() => fileApi.getDownloadUrl(fileId))
      
      // Create download directory if it doesn't exist
      const downloadDir = `${FileSystem.documentDirectory}downloads/`
      const dirInfo = await FileSystem.getInfoAsync(downloadDir)
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true })
      }

      // Download file
      const localUri = `${downloadDir}${fileName}`
      const downloadResult = await FileSystem.downloadAsync(downloadUrl, localUri)
      
      return downloadResult.uri

    } catch (error) {
      throw error instanceof Error ? error : new Error('Download failed')
    }
  }

  /**
   * Search files
   */
  async searchFiles(query: string, options: Omit<SearchParams, 'query'> = {}): Promise<FileItem[]> {
    if (!query.trim()) {
      return []
    }

    return this.withRetry(() => fileApi.searchFiles({ query: query.trim(), ...options }))
  }

  /**
   * Get recent files
   */
  async getRecentFiles(limit: number = 20): Promise<FileItem[]> {
    return this.withRetry(() => fileApi.getRecentFiles(limit))
  }

  /**
   * Get starred files
   */
  async getStarredFiles(): Promise<FileItem[]> {
    return this.withRetry(() => fileApi.getStarredFiles())
  }

  /**
   * Get shared files
   */
  async getSharedFiles(): Promise<FileItem[]> {
    return this.withRetry(() => fileApi.getSharedFiles())
  }

  /**
   * Get trash items
   */
  async getTrashItems(driveId?: string): Promise<FileItem[]> {
    return this.withRetry(() => fileApi.getTrashItems(driveId))
  }

  /**
   * Empty trash with confirmation
   */
  async emptyTrash(driveId?: string, skipConfirmation: boolean = false): Promise<void> {
    if (!skipConfirmation) {
      return new Promise((resolve, reject) => {
        Alert.alert(
          'Empty Trash',
          'Are you sure you want to permanently delete all items in trash? This action cannot be undone.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => reject(new Error('User cancelled')),
            },
            {
              text: 'Empty Trash',
              style: 'destructive',
              onPress: async () => {
                try {
                  await this.withRetry(() => fileApi.emptyTrash(driveId))
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

    return this.withRetry(() => fileApi.emptyTrash(driveId))
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    fileCount: number
    totalSize: number
    usedSpace: number
    availableSpace: number
    usageByType: Record<string, number>
  }> {
    return this.withRetry(() => fileApi.getStorageStats())
  }

  /**
   * Share file with users
   */
  async shareFile(fileId: string, userIds: string[], role: 'viewer' | 'editor' | 'owner' = 'viewer'): Promise<void> {
    return this.withRetry(() => fileApi.shareFile(fileId, userIds, role))
  }

  /**
   * Create sharing link
   */
  async createSharingLink(fileId: string, accessLevel: 'view' | 'edit' = 'view'): Promise<string> {
    return this.withRetry(() => fileApi.createSharingLink(fileId, accessLevel))
  }

  /**
   * Revoke sharing link
   */
  async revokeSharingLink(fileId: string): Promise<void> {
    return this.withRetry(() => fileApi.revokeSharingLink(fileId))
  }

  /**
   * Get file sharing info
   */
  async getFileSharing(fileId: string): Promise<{
    isShared: boolean
    shareLink?: string
    permissions: {
      userId: string
      email: string
      role: string
    }[]
  }> {
    return this.withRetry(() => fileApi.getFileSharing(fileId))
  }

  /**
   * Share file with users by email
   */
  async shareWithUsers(fileId: string, emails: string[], role: 'viewer' | 'editor' = 'viewer'): Promise<void> {
    return this.withRetry(() => fileApi.shareFile(fileId, emails, role))
  }

  /**
   * Check if file exists
   */
  async fileExists(fileName: string, parentId?: string): Promise<boolean> {
    return this.withRetry(() => fileApi.fileExists(fileName, parentId))
  }
}

export const fileOperations = new FileOperationsService()
export default fileOperations