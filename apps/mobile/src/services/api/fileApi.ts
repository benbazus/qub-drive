import { apiClient } from './client'
import { FileItem, UploadProgress } from '@/types/file'
import { AxiosProgressEvent, AxiosRequestConfig } from 'axios'

export interface FileListParams {
  parentId?: string
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  publicOnly?: boolean
}

export interface CreateFolderRequest {
  name: string
  parentId?: string
}

export interface UpdateFileRequest {
  filename?: string
  isPublic?: boolean
  expiresAt?: string
}

export interface MoveItemRequest {
  newParentId?: string | null
}

export interface CopyItemRequest {
  newParentId?: string | null
  newName?: string
}

export interface SearchParams {
  query?: string
  fileType?: string
  modifiedAfter?: string
  modifiedBefore?: string
  driveId?: string
}

export interface StorageStats {
  fileCount: number
  totalSize: number
  usedSpace: number
  availableSpace: number
  usageByType: Record<string, number>
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void
  onSuccess?: (file: FileItem) => void
  onError?: (error: Error) => void
  signal?: AbortSignal
}

export interface FileApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

class FileApiService {
  private readonly baseUrl = '/files'
  private readonly driveUrl = '/drive'

  /**
   * Get list of files and folders
   */
  async getFiles(params: FileListParams = {}): Promise<FileItem[]> {
    const response = await apiClient.get<FileApiResponse<FileItem[]>>(this.baseUrl, {
      params: {
        parent_id: params.parentId,
        limit: params.limit || 50,
        offset: params.offset || 0,
        sort_by: params.sortBy,
        sort_order: params.sortOrder,
        public_only: params.publicOnly || false,
      },
    })
    return response.data.data
  }

  /**
   * Get folder contents using drive API
   */
  async getFolderContents(driveId: string, folderId?: string, params: Omit<FileListParams, 'parentId'> = {}): Promise<{
    folders: FileItem[]
    files: FileItem[]
    totalCount: number
  }> {
    const url = folderId 
      ? `${this.driveUrl}/${driveId}/folders/${folderId}/contents`
      : `${this.driveUrl}/${driveId}/contents`
    
    const response = await apiClient.get<FileApiResponse<{
      folders: FileItem[]
      files: FileItem[]
      totalCount: number
    }>>(url, {
      params: {
        limit: params.limit || 50,
        offset: params.offset || 0,
        sort_by: params.sortBy,
        sort_order: params.sortOrder,
      },
    })
    return response.data.data
  }

  /**
   * Get file metadata by ID
   */
  async getFile(fileId: string): Promise<FileItem> {
    const response = await apiClient.get<FileApiResponse<FileItem>>(`${this.baseUrl}/${fileId}`)
    return response.data.data
  }

  /**
   * Upload a single file
   */
  async uploadFile(
    file: File | Blob,
    fileName: string,
    parentId?: string,
    options: UploadOptions = {}
  ): Promise<FileItem> {
    const formData = new FormData()
    formData.append('file', file, fileName)
    if (parentId) {
      formData.append('parent_id', parentId)
    }

    const config: AxiosRequestConfig = {
      ...(options.signal && { signal: options.signal }),
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (options.onProgress && progressEvent.total) {
          const progress: UploadProgress = {
            id: `upload_${Date.now()}`,
            fileName,
            progress: Math.round((progressEvent.loaded * 100) / progressEvent.total),
            status: 'uploading',
          }
          options.onProgress(progress)
        }
      },
    }

    try {
      const response = await apiClient.upload<FileApiResponse<FileItem>>(
        this.baseUrl,
        formData,
        undefined,
        config
      )
      
      const uploadedFile = response.data.data
      options.onSuccess?.(uploadedFile)
      return uploadedFile
    } catch (error) {
      const uploadError = error instanceof Error ? error : new Error('Upload failed')
      options.onError?.(uploadError)
      throw uploadError
    }
  }

  /**
   * Upload multiple files with progress tracking
   */
  async uploadFiles(
    files: { file: File | Blob; fileName: string }[],
    parentId?: string,
    options: UploadOptions = {}
  ): Promise<FileItem[]> {
    const uploadPromises = files.map(({ file, fileName }, index) => 
      this.uploadFile(file, fileName, parentId, {
        ...options,
        onProgress: (progress) => {
          // Adjust progress to account for multiple files
          const adjustedProgress: UploadProgress = {
            ...progress,
            id: `upload_${index}_${Date.now()}`,
            progress: (index * 100 + progress.progress) / files.length,
          }
          options.onProgress?.(adjustedProgress)
        },
      })
    )

    return Promise.all(uploadPromises)
  }

  /**
   * Create a new folder
   */
  async createFolder(request: CreateFolderRequest): Promise<FileItem> {
    const driveId = 'default' // TODO: Get from context or user preference
    const response = await apiClient.post<FileApiResponse<FileItem>>(
      `${this.driveUrl}/${driveId}/folders`,
      request
    )
    return response.data.data
  }

  /**
   * Update file metadata
   */
  async updateFile(fileId: string, updates: UpdateFileRequest): Promise<FileItem> {
    const response = await apiClient.put<FileApiResponse<FileItem>>(
      `${this.baseUrl}/${fileId}`,
      updates
    )
    return response.data.data
  }

  /**
   * Delete a file or folder
   */
  async deleteFile(fileId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${fileId}`)
  }

  /**
   * Move file or folder to trash
   */
  async moveToTrash(itemId: string): Promise<void> {
    await apiClient.post(`${this.driveUrl}/items/${itemId}/trash`)
  }

  /**
   * Restore file or folder from trash
   */
  async restoreFromTrash(itemId: string): Promise<void> {
    await apiClient.post(`${this.driveUrl}/items/${itemId}/restore`)
  }

  /**
   * Move item to different folder
   */
  async moveItem(itemId: string, request: MoveItemRequest): Promise<void> {
    await apiClient.post(`${this.driveUrl}/items/${itemId}/move`, request)
  }

  /**
   * Copy item
   */
  async copyItem(itemId: string, request: CopyItemRequest): Promise<FileItem> {
    const response = await apiClient.post<FileApiResponse<FileItem>>(
      `${this.driveUrl}/items/${itemId}/copy`,
      request
    )
    return response.data.data
  }

  /**
   * Star/favorite an item
   */
  async starItem(itemId: string): Promise<void> {
    await apiClient.post(`${this.driveUrl}/items/${itemId}/star`)
  }

  /**
   * Unstar/unfavorite an item
   */
  async unstarItem(itemId: string): Promise<void> {
    await apiClient.delete(`${this.driveUrl}/items/${itemId}/star`)
  }

  /**
   * Download file
   */
  async downloadFile(fileId: string): Promise<Blob> {
    const response = await apiClient.get(`${this.baseUrl}/${fileId}/download`, {
      responseType: 'blob',
    })
    return response.data as Blob
  }

  /**
   * Get download URL for file
   */
  async getDownloadUrl(fileId: string): Promise<string> {
    const response = await apiClient.get<FileApiResponse<{ url: string }>>(`${this.baseUrl}/${fileId}/download-url`)
    return response.data.data.url
  }

  /**
   * Search files and folders
   */
  async searchFiles(params: SearchParams): Promise<FileItem[]> {
    const driveId = params.driveId || 'default'
    const response = await apiClient.get<FileApiResponse<FileItem[]>>(
      `${this.driveUrl}/${driveId}/search`,
      {
        params: {
          q: params.query,
          file_type: params.fileType,
          modified_after: params.modifiedAfter,
          modified_before: params.modifiedBefore,
        },
      }
    )
    return response.data.data
  }

  /**
   * Get recent files
   */
  async getRecentFiles(limit: number = 20): Promise<FileItem[]> {
    const response = await apiClient.get<FileApiResponse<FileItem[]>>(
      `${this.driveUrl}/recent`,
      {
        params: { limit },
      }
    )
    return response.data.data
  }

  /**
   * Get starred files
   */
  async getStarredFiles(): Promise<FileItem[]> {
    const response = await apiClient.get<FileApiResponse<FileItem[]>>(
      `${this.driveUrl}/starred`
    )
    return response.data.data
  }

  /**
   * Get shared files
   */
  async getSharedFiles(): Promise<FileItem[]> {
    const response = await apiClient.get<FileApiResponse<FileItem[]>>(
      `${this.driveUrl}/shared-with-me`
    )
    return response.data.data
  }

  /**
   * Get trash items
   */
  async getTrashItems(driveId: string = 'default'): Promise<FileItem[]> {
    const response = await apiClient.get<FileApiResponse<FileItem[]>>(
      `${this.driveUrl}/${driveId}/trash`
    )
    return response.data.data
  }

  /**
   * Empty trash
   */
  async emptyTrash(driveId: string = 'default'): Promise<void> {
    await apiClient.delete(`${this.driveUrl}/${driveId}/trash`)
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    const response = await apiClient.get<FileApiResponse<StorageStats>>(
      `${this.baseUrl}/storage-stats`
    )
    return response.data.data
  }

  /**
   * Get file thumbnail
   */
  async getFileThumbnail(fileId: string, size: 'small' | 'medium' | 'large' = 'medium'): Promise<string> {
    const response = await apiClient.get<{ url: string }>(
      `${this.baseUrl}/${fileId}/thumbnail`,
      {
        params: { size },
      }
    )
    return response.data.url
  }

  /**
   * Check if file exists
   */
  async fileExists(fileName: string, parentId?: string): Promise<boolean> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/exists`, {
        params: {
          filename: fileName,
          parent_id: parentId,
        },
      })
      return response.data.exists
    } catch {
      return false
    }
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
    const response = await apiClient.get<{
      isShared: boolean
      shareLink?: string
      permissions: {
        userId: string
        email: string
        role: string
      }[]
    }>(`${this.baseUrl}/${fileId}/sharing`)
    return response.data
  }

  /**
   * Share file with users
   */
  async shareFile(fileId: string, userIds: string[], role: 'viewer' | 'editor' | 'owner'): Promise<void> {
    await apiClient.post(`${this.driveUrl}/items/${fileId}/share`, {
      user_ids: userIds,
      role,
    })
  }

  /**
   * Create sharing link
   */
  async createSharingLink(fileId: string, accessLevel: 'view' | 'edit' = 'view'): Promise<string> {
    const response = await apiClient.post<{ link: string }>(
      `${this.driveUrl}/items/${fileId}/sharing-link`,
      {
        access_level: accessLevel,
      }
    )
    return response.data.link
  }

  /**
   * Revoke sharing link
   */
  async revokeSharingLink(fileId: string): Promise<void> {
    await apiClient.delete(`${this.driveUrl}/items/${fileId}/sharing-link`)
  }

  /**
   * Get file info for sync purposes
   */
  async getFileInfo(fileId: string): Promise<FileItem> {
    return this.getFile(fileId)
  }

  /**
   * Get file content for sync comparison
   */
  async getFileContent(fileId: string): Promise<string> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${fileId}/content`, {
        responseType: 'text',
      })
      return response.data as string
    } catch (error) {
      console.error('Failed to get file content:', error)
      throw new Error('Failed to get file content')
    }
  }

  /**
   * Update file content for sync
   */
  async updateFileContent(fileId: string, content: string): Promise<void> {
    try {
      await apiClient.put(`${this.baseUrl}/${fileId}/content`, {
        content,
      })
    } catch (error) {
      console.error('Failed to update file content:', error)
      throw new Error('Failed to update file content')
    }
  }

  /**
   * Get file version history
   */
  async getFileVersions(fileId: string): Promise<Array<{
    id: string
    version: number
    createdAt: string
    size: number
    checksum?: string
  }>> {
    try {
      const response = await apiClient.get<FileApiResponse<Array<{
        id: string
        version: number
        createdAt: string
        size: number
        checksum?: string
      }>>>(`${this.baseUrl}/${fileId}/versions`)
      return response.data.data
    } catch (error) {
      console.error('Failed to get file versions:', error)
      return []
    }
  }

  /**
   * Create file version checkpoint
   */
  async createFileVersion(fileId: string, content: string): Promise<string> {
    try {
      const response = await apiClient.post<FileApiResponse<{ versionId: string }>>(
        `${this.baseUrl}/${fileId}/versions`,
        { content }
      )
      return response.data.data.versionId
    } catch (error) {
      console.error('Failed to create file version:', error)
      throw new Error('Failed to create file version')
    }
  }

  /**
   * Get file checksum for conflict detection
   */
  async getFileChecksum(fileId: string): Promise<string> {
    try {
      const response = await apiClient.get<FileApiResponse<{ checksum: string }>>(
        `${this.baseUrl}/${fileId}/checksum`
      )
      return response.data.data.checksum
    } catch (error) {
      console.error('Failed to get file checksum:', error)
      throw new Error('Failed to get file checksum')
    }
  }
}

export const fileApi = new FileApiService()
export default fileApi