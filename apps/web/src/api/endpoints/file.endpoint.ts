/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from '../api.client';
import { FileFilters, FilePagination, FileItem, DeleteFileResponse } from '@/types/file';
import { User } from '../types/file';
import { CreateShareRequest, CreateShareResponse } from '@/types/share.types';

interface MoveFileRequest {
  destinationId?: string | null;
}


export interface CopyLinkData {
  fileId: string;
  permission: 'VIEW' | 'COMMENT' | 'EDIT';
  shareType?: 'FILE' | 'LINK' | 'DOCUMENT';
  expiresAt?: string;
  downloadAllowed: boolean;
  password?: string;
  requirePassword?: boolean;
  maxDownloads?: number | null;
}

export interface CopyLinkResponse {
  shareId: string;
  shareUrl: string;
  expiresAt: string;
}

export interface ShareDocumentEmailData {
  email: string;
  permission: 'VIEW' | 'COMMENT' | 'EDIT';
  message?: string;
  expiresAt?: string;
  notifyUser?: boolean;
}

interface ShareDocumentEmailResponse {
  success: boolean;
  shareId: string;
  message: string;
}

// Preview-specific interfaces
export interface PreviewResponse {
  success: boolean;
  data: {
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    hasPermission: boolean;
    metadata?: {
      dimensions?: { width: number; height: number };
      pages?: number;
      title?: string;
      author?: string;
    };
  };
  error?: string;
}



export interface ThumbnailResponse {
  success: boolean;
  data: {
    thumbnailUrl: string;
    cacheExpiry: string;
  };
  error?: string;
}

export enum PreviewErrorType {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  LOADING_ERROR = 'LOADING_ERROR',
  CORRUPTED_FILE = 'CORRUPTED_FILE'
}

export interface PreviewError {
  type: PreviewErrorType;
  message: string;
  details?: any;
  recoverable: boolean;
}



class FileEndpoint {
  private readonly endpoints = {
    createFolder: '/files/v1/create-folder',
    filesList: '/files/list',
    folderList: '/files/folders/get-folder-list',
    folders: '/files/folders/get-folders',
    moveFile: (fileId: string) => `/files/${encodeURIComponent(fileId)}/move-file`,
    copyFile: (fileId: string) => `/files/${encodeURIComponent(fileId)}/make-copy`,
    rename: (fileId: string) => `/files/${encodeURIComponent(fileId)}/rename`,
    upload: '/upload',
    uploadProgress: '/upload/progress',
    cancelUpload: '/upload/cancel',
    batchUpload: '/upload/batch',
    resumeUpload: '/upload/resume',
    initializeUpload: '/files/initialize-upload',
    createShareLink: '/files/create-share-link',
    sharedFile: (token: string) => `/files/${encodeURIComponent(token)}/get-shared-file`,
    lockFile: (fileId: string) => `/files/${encodeURIComponent(fileId)}/lock`,
    starFile: (fileId: string) => `/files/${encodeURIComponent(fileId)}/star`,
    searchUsers: '/users/search',
    getCurrentUser: '/auth/profile',
    shareFile: (fileId: string) => `/files/${encodeURIComponent(fileId)}/share`,
    requestShareAccess: (shareToken: string) => `/files/share/${encodeURIComponent(shareToken)}/request-access`,
    downloadSharedFile: (shareToken: string) => `/files/share/${encodeURIComponent(shareToken)}/download`,
    getApprovalRequest: (approvalId: string) => `/files/approvals/${encodeURIComponent(approvalId)}`,
    approveShareRequest: (approvalId: string) => `/files/approvals/${encodeURIComponent(approvalId)}/approve`,
    rejectShareRequest: (approvalId: string) => `/files/approvals/${encodeURIComponent(approvalId)}/reject`,
    getPendingApprovals: '/files/approvals/pending',
    prepareDownload: (fileId: string) => `/files/${encodeURIComponent(fileId)}/prepare-download`,
    deleteFile: (fileId: string) => `/files/${encodeURIComponent(fileId)}`,
    downloadFile: (fileId: string) => `/files/${encodeURIComponent(fileId)}/download`,
    deleteInfo: (fileId: string) => `/files/${encodeURIComponent(fileId)}/delete-info`,
    getThumbnail: (fileId: string) => `/files/${encodeURIComponent(fileId)}/thumbnail`,
    // Preview endpoints
    getPreview: (fileId: string) => `/files/${encodeURIComponent(fileId)}/preview`,
    getPreviewContent: (fileId: string) => `/files/${encodeURIComponent(fileId)}/preview-content`,
    getPreviewThumbnail: (fileId: string) => `/files/${encodeURIComponent(fileId)}/preview-thumbnail`,
    // storageStats: '/storage/stats',
    // detailedStorageStats: '/storage/detailed', router.get('/:fileId/download', expressAuthenticate, wrapHandler(fileController.downloadFile));
    // storageByDateRange: '/storage/date-range',
    createShare: '/shares',
    dashboardStats: '/files/dashboard/stats',
    documentActiveUsers: (documentId: string) => `/documents/${encodeURIComponent(documentId)}/active-users`,
    shareDocumentEmail: (documentId: string) => `/documents/${encodeURIComponent(documentId)}/share-email`,
  };

  async createShareV1(request: CreateShareRequest, onProgress?: (progress: number) => void): Promise<CreateShareResponse> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();

      // Append metadata
      if (request.message) formData.append('message', request.message);
      if (request.recipientEmail) formData.append('recipientEmail', request.recipientEmail);
      if (request.password) formData.append('password', request.password);
      formData.append('expirationDays', request.expirationDays);
      formData.append('fileId', request.fileId);

      const xhr = new XMLHttpRequest();

      // Progress tracking
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress(progress);
          }
        });
      }

      // Success handler
      xhr.addEventListener('load', () => {
        if (xhr.status === 201) {
          try {
            const response = JSON.parse(xhr.responseText) as CreateShareResponse;
            console.log(" @@@@@@@@@@@@@@@ ")
            console.log(response)
            console.log(" @@@@@@@@@@@@@@@ ")


            resolve(response);
          } catch {
            reject(new Error('Failed to parse response'));
          }
        } else {
          reject(new Error('Upload failed. Please try again.'));
        }
      });

      // Error handler
      xhr.addEventListener('error', () => {
        reject(new Error('Network error. Please check your connection.'));
      });

      xhr.open('POST', `http://localhost:5001/api/shares`);
      xhr.send(formData);
    });
  }

  async createShare(request: CreateShareRequest): Promise<any> {

    const formData = new FormData();

    // Append metadata
    if (request.message) formData.append('message', request.message);
    if (request.recipientEmail) formData.append('recipientEmail', request.recipientEmail);
    if (request.password) formData.append('password', request.password);
    formData.append('expirationDays', request.expirationDays);
    formData.append('fileId', request.fileId);


    console.log(" +++++++ startUpload +++++++ ");
    console.log(request);
    console.log(" +++++++ startUpload+++++++ ");

    const response = await apiClient.post(this.endpoints.createShare, { data: request });
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to create share');
    }
    return response.data;
  }


  async getFolders(parentId: string | null = null): Promise<FileItem[]> {
    const params = new URLSearchParams();
    if (parentId) params.append('parentId', parentId);
    const response = await apiClient.get(`${this.endpoints.folders}?${params.toString()}`);
    return response.data;
  }

  async deleteFile(fileId: string, deletePermanently: boolean = false): Promise<void> {
    await apiClient.delete<DeleteFileResponse>(this.endpoints.deleteFile(fileId), { data: { deletePermanently }, });
  }

  //===================================================

  // Preview methods
  async getPreview(fileId: string): Promise<PreviewResponse> {
    try {
      const response = await apiClient.get<PreviewResponse>(this.endpoints.getPreview(fileId));

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to get preview information');
      }

      return response.data;
    } catch (error: any) {
      // Handle preview-specific errors
      const previewError: PreviewError = this.handlePreviewError(error);
      throw previewError;
    }
  }

  async getPreviewThumbnail(fileId: string, options?: { width?: number; height?: number; quality?: number }): Promise<ThumbnailResponse> {
    try {
      const params = new URLSearchParams();
      if (options?.width) params.append('width', options.width.toString());
      if (options?.height) params.append('height', options.height.toString());
      if (options?.quality) params.append('quality', options.quality.toString());

      const url = `${this.endpoints.getPreviewThumbnail(fileId)}${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiClient.get<ThumbnailResponse>(url);

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to get preview thumbnail');
      }

      return response.data;
    } catch (error: any) {
      const previewError: PreviewError = this.handlePreviewError(error);
      throw previewError;
    }
  }

  async getPreviewContent(fileId: string): Promise<string> {
    try {
      const response = await apiClient.get<{ data: { content: string } }>(
        this.endpoints.getPreviewContent(fileId)
      );

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data?.data?.content) {
        throw new Error('Preview content not available');
      }

      return response.data.data.content;
    } catch (error: any) {
      const previewError: PreviewError = this.handlePreviewError(error);
      throw previewError;
    }
  }

  getPreviewUrl(fileId: string): string {
    return this.endpoints.getPreviewContent(fileId);
  }

  isPreviewSupported(mimeType: string | null, fileName: string): boolean {
    const supportedImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
      'image/tiff'
    ];

    const supportedDocumentTypes = [
      'application/pdf'
    ];

    if (!mimeType) {
      // Try to determine from file extension
      const ext = fileName.toLowerCase().split('.').pop();
      const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'];
      const docExts = ['pdf'];

      return imageExts.includes(ext || '') || docExts.includes(ext || '');
    }

    return supportedImageTypes.includes(mimeType) || supportedDocumentTypes.includes(mimeType);
  }

  getPreviewType(mimeType: string | null, fileName: string): 'image' | 'pdf' | 'unsupported' {
    if (!mimeType) {
      const ext = fileName.toLowerCase().split('.').pop();
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'].includes(ext || '')) {
        return 'image';
      }
      if (ext === 'pdf') {
        return 'pdf';
      }
      return 'unsupported';
    }

    if (mimeType.startsWith('image/')) {
      return 'image';
    }
    if (mimeType === 'application/pdf') {
      return 'pdf';
    }
    return 'unsupported';
  }

  async generateThumbnail(fileId: string, options?: { width?: number; height?: number; quality?: number }): Promise<ThumbnailResponse> {
    try {
      // Use the existing getThumbnail endpoint for generating thumbnails
      const params = new URLSearchParams();
      if (options?.width) params.append('width', options.width.toString());
      if (options?.height) params.append('height', options.height.toString());
      if (options?.quality) params.append('quality', options.quality.toString());

      const url = `${this.endpoints.getThumbnail(fileId)}${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiClient.get<ThumbnailResponse>(url);

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to generate thumbnail');
      }

      return response.data;
    } catch (error: any) {
      const previewError: PreviewError = this.handlePreviewError(error);
      throw previewError;
    }
  }

  private handlePreviewError(error: any): PreviewError {
    // Handle different types of preview errors
    if (error.message?.includes('Permission denied') || error.message?.includes('Access denied')) {
      return {
        type: PreviewErrorType.PERMISSION_DENIED,
        message: 'You do not have permission to preview this file',
        details: error,
        recoverable: false
      };
    }

    if (error.message?.includes('File not found') || error.message?.includes('404')) {
      return {
        type: PreviewErrorType.FILE_NOT_FOUND,
        message: 'The file you are trying to preview was not found',
        details: error,
        recoverable: false
      };
    }

    if (error.message?.includes('Unsupported format') || error.message?.includes('not supported')) {
      return {
        type: PreviewErrorType.UNSUPPORTED_FORMAT,
        message: 'This file format is not supported for preview',
        details: error,
        recoverable: false
      };
    }

    if (error.message?.includes('network') || error.message?.includes('connection')) {
      return {
        type: PreviewErrorType.NETWORK_ERROR,
        message: 'Network error occurred while loading preview',
        details: error,
        recoverable: true
      };
    }

    if (error.message?.includes('corrupted') || error.message?.includes('invalid')) {
      return {
        type: PreviewErrorType.CORRUPTED_FILE,
        message: 'The file appears to be corrupted or invalid',
        details: error,
        recoverable: false
      };
    }

    // Default to loading error
    return {
      type: PreviewErrorType.LOADING_ERROR,
      message: error.message || 'Failed to load preview',
      details: error,
      recoverable: true
    };
  }

  async getDeleteInfo(fileId: string): Promise<any> {
    const response = await apiClient.get(this.endpoints.deleteInfo(fileId));
    return response;
  }


  async getSharedFile(token: string): Promise<any> {

    const response = await apiClient.get(this.endpoints.sharedFile(token));
    console.log(" ======== response ============= ")
    console.log(response.data)
    console.log(" ======= response ============== ")
    return response.data;

  }

  async getSharedFile1(token: string, password?: string): Promise<any> {
    console.log(" ======== HHHHHHHHHH ============= ")
    console.log(token)
    console.log(" ======= HHHHHHHHHH ============== ")

    if (password) {
      const response = await apiClient.get(this.endpoints.sharedFile(token), {
        headers: { 'X-Share-Password': password }
      });
      if (response.error) {
        throw new Error(response.error || 'Failed to get shared file');
      }
      return response.data;
    } else {
      const response = await apiClient.get(this.endpoints.sharedFile(token));
      if (response.error) {
        throw new Error(response.error || 'Failed to get shared file');
      }
      return response.data;
    }
  }


  async createFolder(name: string, parentId?: string): Promise<FileItem> {
    //Tempoeral
    //const currentParentId = localStorage.getItem("parentId")

    // console.log(" +++++++ startUpload +++++++ ");
    // console.log(currentParentId);
    // console.log(" +++++++ startUpload+++++++ ");

    const response = await apiClient.post<{ success: boolean; data: FileItem; metadata?: any }>(this.endpoints.createFolder, { name, parentId });
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to create folder');
    }
    return response.data.data;
  }

  async getFolderList(): Promise<{ success: boolean; data: { items: FileItem[]; total: number; hasMore: boolean; page: number; limit: number } }> {
    const response = await apiClient.get<{ success: boolean; data: { items: FileItem[]; total: number; hasMore: boolean; page: number; limit: number } }>(this.endpoints.folderList);

    if (response.error || !response.data?.success) {
      throw new Error(response.error || 'Failed to get folder list');
    }

    return response.data;
  }

  async moveFile(fileId: string, payload: MoveFileRequest): Promise<void> {
    const response = await apiClient.post(this.endpoints.moveFile(fileId), payload);
    if (response.error) {
      throw new Error(response.error || 'Failed to move file');
    }
  }

  async createShareLink(data: CopyLinkData): Promise<CopyLinkResponse> {
    const response = await apiClient.post(this.endpoints.createShareLink, data);



    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to create share link');
    }
    return response.data;
  }

  async copyFile(fileId: string, name: string): Promise<void> {
    const response = await apiClient.post(this.endpoints.copyFile(fileId), { name });
    if (response.error) {
      throw new Error(response.error || 'Failed to copy file');
    }
  }

  async rename(fileId: string, newName: string): Promise<void> {
    const response = await apiClient.post(this.endpoints.rename(fileId), { newName });
    if (response.error) {
      throw new Error(response.error || 'Failed to rename file');
    }
  }


  async getFileList(filters: FileFilters = {}, pagination: FilePagination = {}): Promise<any> {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);

    if (filters.type) params.append('type', filters.type);
    if (filters.starred !== undefined) params.append('starred', filters.starred.toString());
    if (filters.shared !== undefined) params.append('shared', filters.shared.toString());
    if (filters.parentId) params.append('parentId', filters.parentId);
    if (pagination.page) params.append('page', pagination.page.toString());
    if (pagination.limit) params.append('limit', pagination.limit.toString());
    if (pagination.sortBy) params.append('sortBy', pagination.sortBy);
    if (pagination.sortOrder) params.append('sortOrder', pagination.sortOrder);

    const url = `${this.endpoints.filesList}?${params.toString()}`;
    const response = await apiClient.get(url);

    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to get file list');
    }
    return response.data.data;
  }



  async getFileList1(filters: FileFilters = {}, pagination: FilePagination = {}): Promise<FileItem> {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.type) params.append('type', filters.type);
    if (filters.starred !== undefined) params.append('starred', filters.starred.toString());
    if (filters.shared !== undefined) params.append('shared', filters.shared.toString());
    if (filters.parentId) params.append('parentId', filters.parentId);
    if (pagination.page) params.append('page', pagination.page.toString());
    if (pagination.limit) params.append('limit', pagination.limit.toString());
    if (pagination.sortBy) params.append('sortBy', pagination.sortBy);
    if (pagination.sortOrder) params.append('sortOrder', pagination.sortOrder);

    const url = `${this.endpoints.filesList}?${params.toString()}`;
    const response = await apiClient.get<{ success: boolean; data: FileItem; metadata?: any }>(url);

    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to get file list');
    }
    return response.data.data;
  }
  async uploadFile(
    file: File,
    parentId: any,
    callbacks: {
      onProgress?: (progress: { percentage: number; loaded: number }) => void;
      onSuccess?: () => void;
      onError?: (error: any) => void;
    }
  ): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);

      // Handle parent folder - send 'null' string for root folder as expected by backend
      //   const parentId = folder?.id === 'ROOT' || !folder?.id ? 'null' : folder.id;
      formData.append('parentId', parentId);

      console.log(" EEEEEEEEEEE currentFolder EEEEEEEEEEE ")
      console.log(parentId)
      console.log(" EEEEEEEEE currentFolder EEEEEEEEEEEEEE ")

      // Make the actual upload request
      const response = await apiClient.upload(this.endpoints.upload, formData, (progress) => {
        callbacks.onProgress?.({
          percentage: progress,
          loaded: Math.floor((progress / 100) * file.size)
        });
      });

      if (response.error) {
        throw new Error(response.error);
      }

      callbacks.onSuccess?.();
    } catch (error) {
      console.error('Upload error:', error);
      callbacks.onError?.(error);
    }
  }

  // async uploadFile(file: File, parentId: any, callbacks: {
  //   onProgress?: (progress: { percentage: number; loaded: number }) => void; onSuccess?: () => void; onError?: (error: any) => void;
  // }
  // ): Promise<void> {
  //   try {
  //     const formData = new FormData();
  //     formData.append('file', file);
  //     formData.append('fileName', file.name);

  //     // Handle parent folder - send 'null' string for root folder as expected by backend
  //     //   const parentId = folder?.id === 'ROOT' || !folder?.id ? 'null' : folder.id;
  //     formData.append('parentId', parentId);

  //     console.log(" +++++++++ currentFolder +++++++++++++++ ")
  //     console.log(parentId)
  //     console.log(" ++++++++++ currentFolder ++++++++++++++ ")

  //     // Make the actual upload request
  //     const response = await apiClient.upload(this.endpoints.upload, formData, (progress) => {
  //       callbacks.onProgress?.({
  //         percentage: progress,
  //         loaded: Math.floor((progress / 100) * file.size)
  //       });
  //     });

  //     if (response.error) {
  //       throw new Error(response.error);
  //     }

  //     callbacks.onSuccess?.();
  //   } catch (error) {
  //     console.error('Upload error:', error);
  //     callbacks.onError?.(error);
  //   }
  // }

  async initializeUpload(file: File, folderId: string): Promise<string> {
    const response = await apiClient.post<{ data: { uploadId: string } }>(this.endpoints.initializeUpload, {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      folderId
    });

    if (response.error || !response.data?.data?.uploadId) {
      // Return mock upload ID for development
      return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return response.data.data.uploadId;
  }

  async getUploadProgress(uploadId: string): Promise<any> {
    try {
      const response = await apiClient.get<{ success: boolean; data: any }>(
        `${this.endpoints.uploadProgress}?uploadId=${encodeURIComponent(uploadId)}`
      );

      if (response.error || !response.data?.success) {
        throw new Error(response.error || 'Failed to get upload progress');
      }

      return response.data.data;
    } catch (error) {
      console.warn('Upload progress API error:', error);
      return null;
    }
  }

  async cancelUpload(uploadId: string): Promise<void> {
    try {
      const response = await apiClient.post<{ success: boolean }>(
        `${this.endpoints.cancelUpload}?uploadId=${encodeURIComponent(uploadId)}`
      );

      if (response.error || !response.data?.success) {
        throw new Error(response.error || 'Failed to cancel upload');
      }
    } catch (error) {
      console.warn('Cancel upload API error:', error);
      throw error;
    }
  }

  async lock(fileId: string): Promise<void> {
    const response = await apiClient.post(this.endpoints.lockFile(fileId));
    if (response.error) {
      throw new Error(response.error || 'Failed to toggle lock status');
    }
  }

  async star(fileId: string): Promise<void> {
    const response = await apiClient.post(this.endpoints.starFile(fileId));
    if (response.error) {
      throw new Error(response.error || 'Failed to toggle star status');
    }
  }

  async searchUsers(query: string): Promise<any> {
    const data = await apiClient.get<User[]>(`/users/search?query=${encodeURIComponent(query)}`);
    console.log(" =======000000000000000========== ")
    console.log(data)
    console.log(" ========000000000000000============= ")
    // const response = Array.isArray(data) ? data : [];
    return data.data;
  }



  async searchUsers3(query: string): Promise<User[]> {
    const response = await apiClient.get('/users/search', {
      params: { q: query, limit: 20 }
    });
    return response.data;
  }

  async searchUsers4(query: string): Promise<any[]> {

    // console.log(" ========= searchUsers ============ ");
    // console.log(`${this.endpoints.searchUsers}?q=${encodeURIComponent(query)}`);
    // console.log(" ========= searchUsers ============ ");

    const response = await apiClient.get(`${this.endpoints.searchUsers}?q=${encodeURIComponent(query)}`);



    // if (response.error || !response.data?.data) {
    //   throw new Error(response.error || 'Failed to search users');
    // }

    console.log(" ===================== ")
    console.log(response)
    console.log(" ===================== ")

    return response.data;
  }

  async getCurrentUser(): Promise<any> {
    const response = await apiClient.get<{ data: any }>(this.endpoints.getCurrentUser);
    if (response.error || !response.data?.data) {
      throw new Error(response.error || 'Failed to get current user');
    }
    return response.data.data;
  }

  async shareFile(fileId: string, data: any): Promise<any> {
    const response = await apiClient.post<any>(this.endpoints.shareFile(fileId), data);
    if (response.error) {
      throw new Error(response.error || 'Failed to share file');
    }
    return response.data;
  }

  async getDownloadInfo(fileId: string): Promise<any> {
    try {
      const response = await apiClient.get<{ data: any }>(`/files/${encodeURIComponent(fileId)}/download-info`);
      if (response.error || !response.data?.data) {
        throw new Error(response.error || 'Failed to get download info');
      }
      return response.data;
    } catch (error) {
      console.warn('Download info API not implemented yet, using fallback:', error);
      // Return mock download info for development
      return Promise.resolve({
        data: {
          downloadFormats: [
            { format: 'original', extension: 'original', description: 'Original format', size: 1024000, recommended: true }
          ],
          compressionOptions: [
            { level: 'none', name: 'No compression', ratio: 0, processingTime: 0 }
          ],
          quotaInfo: {
            used: 0,
            remaining: 5000000000, // 5GB
            limit: 5000000000
          },
          estimatedTime: 5
        }
      });
    }
  }

  //router.get('/:fileId/download', expressAuthenticate, wrapHandler(fileController.downloadFile));

  async prepareDownload(fileId: string): Promise<any> {
    const response = await apiClient.post<{ data: any }>(this.endpoints.downloadFile(fileId));
    if (response.error || !response.data?.data) {
      throw new Error(response.error || 'Failed to prepare download');
    }
    return response.data.data;
  }



  async downloadFile(fileId: string): Promise<{ success: boolean; downloadUrl?: string; message?: string }> {
    try {
      const response = await apiClient.get<{ data: { downloadUrl: string } }>(this.endpoints.downloadFile(fileId));
      if (response.error || !response.data?.data?.downloadUrl) {
        throw new Error(response.error || 'Failed to get download URL');
      }
      return {
        success: true,
        downloadUrl: response.data.data.downloadUrl,
        message: 'File download prepared successfully'
      };
    } catch {
      // Fallback for development
      return Promise.resolve({
        success: true,
        downloadUrl: `#download-${fileId}`,
        message: 'File download prepared successfully (mock)'
      });
    }
  }

  async getDashboardStats(): Promise<any> {
    try {
      const response = await apiClient.get<{ data: any }>(this.endpoints.dashboardStats);
      if (response.error || !response.data?.data) {
        throw new Error(response.error || 'Failed to get dashboard stats');
      }
      return response.data.data;
    } catch (error) {
      console.warn('Dashboard stats API not implemented yet, using fallback:', error);
      // Fallback for development
      return Promise.resolve({
        totalFiles: { count: 0, growth: 12.5 },
        storageUsed: { bytes: 0 * 1024 * 1024 * 1024, growth: 8.3 },
        sharedFiles: { count: 0, growth: -2.1 },
        teamMembers: { count: 0, growth: 5.0 }
      });
    }
  }

  // async getStorageStats(): Promise<any> {
  //   try {
  //     const response = await apiClient.get<{ data: any }>(this.endpoints.storageStats);
  //     if (response.error || !response.data?.data) {
  //       throw new Error(response.error || 'Failed to get storage stats');
  //     }
  //     return response.data.data;
  //   } catch (error) {
  //     console.warn('Storage stats API not implemented yet, using fallback:', error);
  //     return Promise.resolve({
  //       usedStorage: 0,
  //       totalStorage: 0,
  //       breakdown: {
  //         documents: 0,
  //         images: 0,
  //         videos: 0,
  //         audio: 0
  //       }
  //     });
  //   }
  // }

  // async getDetailedStorageStats(): Promise<any> {
  //   try {
  //     const response = await apiClient.get<{ data: any }>(this.endpoints.detailedStorageStats);
  //     if (response.error || !response.data?.data) {
  //       throw new Error(response.error || 'Failed to get detailed storage stats');
  //     }
  //     return response.data.data;
  //   } catch (error) {
  //     console.warn('Detailed storage stats API not implemented yet, using fallback:', error);
  //     return Promise.resolve({
  //       usedStorage: 0,
  //       totalStorage: 0,
  //       breakdown: {
  //         documents: 0,
  //         images: 0,
  //         videos: 0,
  //         audio: 0
  //       },
  //       trends: {
  //         daily: [12, 15, 18, 22, 25, 28, 30],
  //         weekly: [85, 90, 95, 100, 110, 115, 120]
  //       }
  //     });
  //   }
  // }

  // async getStorageByDateRange(params: { startDate: string; endDate: string }): Promise<any> {
  //   try {
  //     const response = await apiClient.get<{ data: any }>(
  //       `${this.endpoints.storageByDateRange}?startDate=${params.startDate}&endDate=${params.endDate}`
  //     );
  //     if (response.error || !response.data?.data) {
  //       throw new Error(response.error || 'Failed to get storage by date range');
  //     }
  //     return response.data.data;
  //   } catch (error) {
  //     console.warn('Storage by date range API not implemented yet, using fallback:', error);
  //     return Promise.resolve({
  //       usedStorage: 0,
  //       totalStorage: 0,
  //       breakdown: {
  //         documents: 0,
  //         images: 0,
  //         videos: 0,
  //         audio: 0
  //       },
  //       dateRange: {
  //         start: params.startDate,
  //         end: params.endDate
  //       }
  //     });
  //   }
  // }

  // async refreshStorageCache(): Promise<any> {
  //   try {
  //     const response = await apiClient.post<{ data: any }>(this.endpoints.refreshStorageCache);
  //     if (response.error || !response.data?.data) {
  //       throw new Error(response.error || 'Failed to refresh storage cache');
  //     }
  //     return response.data.data;
  //   } catch (error) {
  //     console.warn('Refresh storage cache API not implemented yet, using fallback:', error);
  //     return Promise.resolve({
  //       success: true,
  //       message: 'Storage cache refreshed successfully'
  //     });
  //   }
  // }

  // Additional methods needed by FilePreviewDialog
  async getFileDetails(fileId: string): Promise<FileItem> {
    try {
      const response = await apiClient.get<{ data: FileItem }>(`/files/${encodeURIComponent(fileId)}`);
      if (response.error || !response.data?.data) {
        throw new Error(response.error || 'Failed to get file details');
      }
      return response.data.data;
    } catch (error) {
      console.warn('File details API not implemented yet, using fallback:', error);
      // Return a basic file item structure for development
      return Promise.resolve({
        id: fileId,
        fileName: 'Unknown File',
        fileSize: '0',
        mimeType: 'application/octet-stream',
        type: 'application/octet-stream',
        fileType: 'file',
        modified: new Date().toISOString(),
        starred: false,
        shared: false,
        locked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parentId: null
      } as FileItem);
    }
  }

  async getFileContent(fileId: string): Promise<string> {
    try {
      const response = await apiClient.get<{ data: { content: string } }>(`/files/${encodeURIComponent(fileId)}/content`);
      if (response.error || !response.data?.data?.content) {
        throw new Error(response.error || 'Failed to get file content');
      }
      return response.data.data.content;
    } catch (error) {
      console.warn('File content API not implemented yet, using fallback:', error);
      // Return placeholder content for development
      return Promise.resolve('File content not available in development mode.');
    }
  }

  async toggleStar(fileId: string): Promise<{ starred: boolean }> {
    try {
      const response = await apiClient.post<{ data: { starred: boolean } }>(this.endpoints.starFile(fileId));
      if (response.error || response.data?.data === undefined) {
        throw new Error(response.error || 'Failed to toggle star status');
      }
      return response.data.data;
    } catch (error) {
      console.warn('Toggle star API not implemented yet, using fallback:', error);
      // Return mock response for development
      return Promise.resolve({ starred: true });
    }
  }

  getThumbnailUrl(fileId: string): string {
    return this.endpoints.getThumbnail(fileId);
  }

  async requestShareAccess(shareToken: string, data: any): Promise<any> {
    const response = await apiClient.post(this.endpoints.requestShareAccess(shareToken), data);
    if (response.error) {
      throw new Error(response.error || 'Failed to request share access');
    }
    return response.data;
  }

  async downloadSharedFile(shareToken: string): Promise<any> {
    try {
      const response = await apiClient.get(this.endpoints.downloadSharedFile(shareToken));
      if (response.error) {
        throw new Error(response.error || 'Failed to download shared file');
      }
      return response.data;
    } catch (error) {
      console.warn('Download shared file API error:', error);
      // Return fallback for development
      return Promise.resolve({
        success: true,
        downloadUrl: `#download-shared-${shareToken}`,
        message: 'Shared file download prepared successfully (mock)'
      });
    }
  }

  async getApprovalRequest(approvalId: string): Promise<any> {
    const response = await apiClient.get(this.endpoints.getApprovalRequest(approvalId));
    if (response.error) {
      throw new Error(response.error || 'Failed to get approval request');
    }
    return response.data;
  }

  async approveShareRequest(approvalId: string, data: { message?: string }): Promise<any> {
    const response = await apiClient.post(this.endpoints.approveShareRequest(approvalId), data);
    if (response.error) {
      throw new Error(response.error || 'Failed to approve share request');
    }
    return response.data;
  }

  async rejectShareRequest(approvalId: string, data: { message?: string }): Promise<any> {
    const response = await apiClient.post(this.endpoints.rejectShareRequest(approvalId), data);
    if (response.error) {
      throw new Error(response.error || 'Failed to reject share request');
    }
    return response.data;
  }

  async getPendingApprovals(): Promise<any> {
    const response = await apiClient.get(this.endpoints.getPendingApprovals);
    if (response.error) {
      throw new Error(response.error || 'Failed to get pending approvals');
    }
    return response.data;
  }

  async getDocumentActiveUsers(documentId: string): Promise<User[]> {
    try {
      const response = await apiClient.get<{ data: User[] }>(this.endpoints.documentActiveUsers(documentId));
      if (response.error || !response.data?.data) {
        throw new Error(response.error || 'Failed to get document active users');
      }
      return response.data.data;
    } catch (error) {
      console.warn('Document active users API not implemented yet, using fallback:', error);
      // Return mock data for development
      return Promise.resolve([
        {
          id: 'user-1',
          email: 'user@company.com',
          name: 'John Doe',
          role: 'editor',
          status: 'online'
        },
        {
          id: 'user-2',
          email: 'jane@company.com',
          name: 'Jane Smith',
          role: 'viewer',
          status: 'away'
        },
        {
          id: 'user-3',
          email: 'bob@company.com',
          name: 'Bob Wilson',
          role: 'editor',
          status: 'online'
        },
        {
          id: 'user-4',
          email: 'alice@company.com',
          name: 'Alice Johnson',
          role: 'commenter',
          status: 'online'
        }
      ]);
    }
  }

  async shareDocumentEmail(documentId: string, data: ShareDocumentEmailData): Promise<ShareDocumentEmailResponse> {
    try {
      const response = await apiClient.post<{ data: ShareDocumentEmailResponse }>(
        this.endpoints.shareDocumentEmail(documentId),
        data
      );
      if (response.error || !response.data?.data) {
        throw new Error(response.error || 'Failed to share document via email');
      }
      return response.data.data;
    } catch (error) {
      console.warn('Share document email API not implemented yet, using fallback:', error);
      // Return mock response for development
      return Promise.resolve({
        success: true,
        shareId: `share_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        message: `Document shared successfully with ${data.email}`
      });
    }
  }

}

// Create and export singleton instance

export const fileEndPoint = new FileEndpoint();
export default fileEndPoint;

// Types are already exported with their interface declarations above