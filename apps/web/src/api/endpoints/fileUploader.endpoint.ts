// Using native fetch API for file upload with progress support
interface ApiResponse<T> {
  data?: T;
  error?: string;
  status?: number;
  success?: boolean;
}

interface UploadInitializeRequest {
  fileName: string
  fileSize: number
  mimeType?: string
  parentId?: string
  totalChunks?: number
}

interface UploadInitializeResponse {
  uploadId: string
  message: string
}

interface ProgressCallbacks {
  onProgress?: (progress: { percentage: number; loaded: number; total: number }) => void
  onSuccess?: (response: any) => void
  onError?: (error: any) => void
}

interface UploadProgress {
  uploadId: string
  fileName: string
  totalSize: number
  uploadedSize: number
  progress: number
  status: 'initializing' | 'uploading' | 'completed' | 'failed' | 'cancelled'
  speed: number
  estimatedTime: number
  error?: string
}

class FileUploaderEndpoint {
  private baseUrl = '/api/file-uploader'

  // Initialize upload session
  async initializeUpload(request: UploadInitializeRequest): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(request)
      })

      const result: ApiResponse<UploadInitializeResponse> = await response.json()

      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to initialize upload')
      }

      return result.data.uploadId
    } catch (error: any) {
      throw new Error(error.message || 'Failed to initialize upload')
    }
  }

  // Upload file chunk
  async uploadChunk(
    uploadId: string,
    chunkIndex: number,
    chunkData: Blob
  ): Promise<any> {
    try {
      const formData = new FormData()
      formData.append('uploadId', uploadId)
      formData.append('chunkIndex', chunkIndex.toString())
      formData.append('chunk', chunkData)

      const response = await fetch(`${this.baseUrl}/chunk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: formData
      })

      const result: ApiResponse<any> = await response.json()

      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to upload chunk')
      }

      return result.data
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload chunk')
    }
  }

  // Upload complete file (non-chunked)
  async uploadFile(
    file: File,
    parentId?: string,
    callbacks?: ProgressCallbacks
  ): Promise<any> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (parentId) {
        formData.append('parentId', parentId)
      }

      const xhr = new XMLHttpRequest()

      return new Promise((resolve, reject) => {
        // Setup progress tracking
        if (callbacks?.onProgress) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percentage = (event.loaded / event.total) * 100
              callbacks.onProgress?.({
                percentage,
                loaded: event.loaded,
                total: event.total
              })
            }
          })
        }

        // Setup completion handlers
        xhr.addEventListener('load', () => {
          try {
            const result: ApiResponse<any> = JSON.parse(xhr.responseText)
            if (!result.error && result.data) {
              callbacks?.onSuccess?.(result.data)
              resolve(result.data)
            } else {
              const error = new Error(result.error || 'Upload failed')
              callbacks?.onError?.(error)
              reject(error)
            }
          } catch (error: any) {
            callbacks?.onError?.(error)
            reject(error)
          }
        })

        xhr.addEventListener('error', () => {
          const error = new Error('Network error during upload')
          callbacks?.onError?.(error)
          reject(error)
        })

        // Start upload
        xhr.open('POST', `${this.baseUrl}/file`)
        xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token') || ''}`)
        xhr.send(formData)
      })
    } catch (error: any) {
      callbacks?.onError?.(error)
      throw new Error(error.message || 'Failed to upload file')
    }
  }

  // Upload with chunking support
  async uploadFileChunked(
    file: File,
    parentId?: string,
    callbacks?: ProgressCallbacks,
    chunkSize: number = 1024 * 1024 // 1MB chunks
  ): Promise<any> {
    try {
      const totalChunks = Math.ceil(file.size / chunkSize)

      // Initialize upload
      const uploadId = await this.initializeUpload({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        parentId,
        totalChunks
      })

      // Upload chunks
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize
        const end = Math.min(start + chunkSize, file.size)
        const chunk = file.slice(start, end)

        await this.uploadChunk(uploadId, chunkIndex, chunk)

        // Update progress
        const progress = ((chunkIndex + 1) / totalChunks) * 100
        callbacks?.onProgress?.({
          percentage: progress,
          loaded: end,
          total: file.size
        })
      }

      // Get final result
      const finalProgress = await this.getUploadProgress(uploadId)
      callbacks?.onSuccess?.(finalProgress)
      return finalProgress

    } catch (error: any) {
      callbacks?.onError?.(error)
      throw new Error(error.message || 'Failed to upload file with chunks')
    }
  }

  // Get upload progress
  async getUploadProgress(uploadId: string): Promise<UploadProgress> {
    try {
      const response = await fetch(`${this.baseUrl}/progress/${uploadId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      })

      const result: ApiResponse<UploadProgress> = await response.json()

      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to get upload progress')
      }

      return result.data
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get upload progress')
    }
  }

  // Cancel upload
  async cancelUpload(uploadId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/cancel/${uploadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      })

      const result: ApiResponse<any> = await response.json()

      if (result.error) {
        throw new Error(result.error || 'Failed to cancel upload')
      }

      return result.data
    } catch (error: any) {
      throw new Error(error.message || 'Failed to cancel upload')
    }
  }

  // Get user uploads
  async getUserUploads(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/user-uploads`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      })

      const result: ApiResponse<any> = await response.json()

      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to get user uploads')
      }

      return result.data
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get user uploads')
    }
  }

  // Smart upload - automatically chooses chunked or regular based on file size
  async smartUpload(
    file: File,
    parentId?: string,
    callbacks?: ProgressCallbacks
  ): Promise<any> {
    const chunkThreshold = 5 * 1024 * 1024 // 5MB threshold

    if (file.size > chunkThreshold) {
      return this.uploadFileChunked(file, parentId, callbacks)
    } else {
      return this.uploadFile(file, parentId, callbacks)
    }
  }
}

export const fileUploaderEndpoint = new FileUploaderEndpoint()