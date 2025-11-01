/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from 'sonner';
import { fileEndPoint } from '@/api/endpoints/file.endpoint';
import { collaborationApi, CreateDocumentRequest } from '@/api/endpoints/collaboration.endpoint';
import { fileUploaderEndpoint } from '@/api/endpoints/fileUploader.endpoint';
import { FileItem } from '@/types/file';

export interface UploadProgress {
  percentage: number;
  loaded: number;
  total: number;
  speed?: number;
  estimatedTime?: number;
}

export interface UploadCallbacks {
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (file: FileItem) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
  onComplete?: () => void;
}

export interface CreateFolderOptions {
  name: string;
  parentId?: string | null;
}

export interface CreateDocumentOptions extends CreateDocumentRequest {
  parentId?: string | null;
}

export interface UploadFileOptions {
  file: File;
  parentId?: string | null;
  callbacks?: UploadCallbacks;
  useChunking?: boolean;
  chunkSize?: number;
}

class FileOperationsService {
  /**
   * Upload a single file with progress tracking
   */
  async uploadFile(options: UploadFileOptions): Promise<FileItem | void> {
    const { file, parentId, callbacks, useChunking = false, chunkSize = 5 * 1024 * 1024 } = options;

    try {
      callbacks?.onStart?.();

      // Show initial toast
      const uploadToast = toast.loading(`Uploading ${file.name}...`, {
        description: 'Preparing upload...',
      });

      // Determine upload method based on file size and user preference
      const shouldUseChunking = useChunking || file.size > chunkSize;

      let result: any;

      if (shouldUseChunking) {
        // Use chunked upload for large files
        result = await fileUploaderEndpoint.smartUpload(file, parentId || undefined, {
          onProgress: (progress) => {
            callbacks?.onProgress?.(progress);
            toast.loading(`Uploading ${file.name}...`, {
              id: uploadToast,
              description: `${Math.round(progress.percentage)}% complete`,
            });
          },
          onSuccess: (data) => {
            callbacks?.onSuccess?.(data);
          },
          onError: (error) => {
            callbacks?.onError?.(error);
          },
        });
      } else {
        // Use regular upload for smaller files
        result = await new Promise<FileItem>((resolve, reject) => {
          fileEndPoint.uploadFile(file, parentId, {
            onProgress: (progress) => {
              callbacks?.onProgress?.(progress);
              toast.loading(`Uploading ${file.name}...`, {
                id: uploadToast,
                description: `${Math.round(progress.percentage)}% complete`,
              });
            },
            onSuccess: () => {
              // Since the original uploadFile doesn't return the created file,
              // we'll need to create a mock FileItem or refetch the file list
              const mockFile: FileItem = {
                id: `temp_${Date.now()}`,
                fileName: file.name,
                fileSize: this.formatFileSize(file.size),
                fileType: file.type || 'application/octet-stream',
                mimeType: file.type,
                modified: new Date().toLocaleDateString(),
                starred: false,
                shared: false,
                locked: false,
                deleted: false,
                parentId: parentId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              callbacks?.onSuccess?.(mockFile);
              resolve(mockFile);
            },
            onError: (error) => {
              callbacks?.onError?.(error);
              reject(error);
            },
          });
        });
      }

      // Success toast
      toast.success(`${file.name} uploaded successfully!`, {
        id: uploadToast,
        description: 'File is now available in your drive',
      });

      callbacks?.onComplete?.();
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';

      toast.error(`Failed to upload ${file.name}`, {
        description: errorMessage,
      });

      callbacks?.onError?.(error instanceof Error ? error : new Error(errorMessage));
      callbacks?.onComplete?.();
      throw error;
    }
  }

  /**
   * Upload multiple files with progress tracking
   */
  async uploadFiles(files: File[], parentId?: string | null, callbacks?: UploadCallbacks): Promise<FileItem[]> {
    const results: FileItem[] = [];
    const totalFiles = files.length;
    let completedFiles = 0;

    try {
      callbacks?.onStart?.();

      const uploadPromises = files.map(async (file, _index) => {
        try {
          const result = await this.uploadFile({
            file,
            parentId,
            callbacks: {
              onProgress: (progress) => {
                // Calculate overall progress
                const overallProgress = {
                  percentage: ((completedFiles + progress.percentage / 100) / totalFiles) * 100,
                  loaded: progress.loaded,
                  total: progress.total,
                };
                callbacks?.onProgress?.(overallProgress);
              },
              onSuccess: (uploadedFile) => {
                completedFiles++;
                results.push(uploadedFile);
                callbacks?.onSuccess?.(uploadedFile);
              },
              onError: callbacks?.onError,
            },
          });
          return result;
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          throw error;
        }
      });

      await Promise.allSettled(uploadPromises);

      toast.success(`Uploaded ${results.length} of ${totalFiles} files successfully!`);
      callbacks?.onComplete?.();

      return results;

    } catch (error) {
      toast.error('Some files failed to upload');
      callbacks?.onError?.(error instanceof Error ? error : new Error('Upload failed'));
      callbacks?.onComplete?.();
      throw error;
    }
  }

  /**
   * Create a new folder
   */
  async createFolder(options: CreateFolderOptions): Promise<FileItem> {
    const { name, parentId } = options;

    try {
      // Validate folder name
      if (!name || !name.trim()) {
        throw new Error('Folder name cannot be empty');
      }

      const trimmedName = name.trim();

      // Check for invalid characters
      const invalidChars = /[<>:"/\\|?*]/;
      if (invalidChars.test(trimmedName)) {
        throw new Error('Folder name contains invalid characters');
      }

      // Show loading toast
      const createToast = toast.loading(`Creating folder "${trimmedName}"...`);

      // Create folder via API
      const folder = await fileEndPoint.createFolder(trimmedName, parentId || undefined);

      // Success toast
      toast.success(`Folder "${trimmedName}" created successfully!`, {
        id: createToast,
        description: 'You can now add files to this folder',
      });

      return folder;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create folder';

      toast.error(`Failed to create folder "${name}"`, {
        description: errorMessage,
      });

      throw error;
    }
  }

  /**
   * Create a new document
   */
  async createDocument(options: CreateDocumentOptions): Promise<any> {
    const { title = 'Untitled Document', parentId, ...documentOptions } = options;

    try {
      // Validate document title
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        throw new Error('Document title cannot be empty');
      }

      // Show loading toast
      const createToast = toast.loading(`Creating document "${trimmedTitle}"...`);

      // Create document via collaboration API
      const document = await collaborationApi.createDocument({
        title: trimmedTitle,
        pageFormat: documentOptions.pageFormat || 'A4',
        marginSize: documentOptions.marginSize || 'normal',
        fontSize: documentOptions.fontSize || 12,
        fontFamily: documentOptions.fontFamily || 'Arial',
      });

      // Success toast
      toast.success(`Document "${trimmedTitle}" created successfully!`, {
        id: createToast,
        description: 'Document is ready for editing',
      });

      return document;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create document';

      toast.error(`Failed to create document "${title}"`, {
        description: errorMessage,
      });

      throw error;
    }
  }

  /**
   * Handle file input change for uploads
   */
  handleFileInputChange(
    event: Event,
    parentId?: string | null,
    callbacks?: UploadCallbacks
  ): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || files.length === 0) {
      return;
    }

    const fileArray = Array.from(files);

    // Reset input value to allow selecting the same file again
    input.value = '';

    if (fileArray.length === 1) {
      this.uploadFile({
        file: fileArray[0],
        parentId,
        callbacks,
      });
    } else {
      this.uploadFiles(fileArray, parentId, callbacks);
    }
  }

  /**
   * Create file input element and trigger file selection
   */
  triggerFileUpload(
    parentId?: string | null,
    callbacks?: UploadCallbacks,
    options?: {
      multiple?: boolean;
      accept?: string;
    }
  ): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = options?.multiple ?? true;

    if (options?.accept) {
      input.accept = options.accept;
    }

    input.onchange = (event) => {
      this.handleFileInputChange(event, parentId, callbacks);
    };

    input.click();
  }

  /**
   * Handle drag and drop file uploads
   */
  handleFileDrop(
    event: DragEvent,
    parentId?: string | null,
    callbacks?: UploadCallbacks
  ): void {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) {
      return;
    }

    const fileArray = Array.from(files);

    if (fileArray.length === 1) {
      this.uploadFile({
        file: fileArray[0],
        parentId,
        callbacks,
      });
    } else {
      this.uploadFiles(fileArray, parentId, callbacks);
    }
  }

  /**
   * Prompt user for folder name and create folder
   */
  async promptCreateFolder(parentId?: string | null): Promise<FileItem | null> {
    const folderName = prompt('Enter folder name:');

    if (!folderName || !folderName.trim()) {
      return null;
    }

    try {
      return await this.createFolder({
        name: folderName.trim(),
        parentId,
      });
    } catch (error) {
      console.error('Failed to create folder:', error);
      return null;
    }
  }

  /**
   * Prompt user for document name and create document
   */
  async promptCreateDocument(parentId?: string | null): Promise<any | null> {
    const documentName = prompt('Enter document name:');

    if (!documentName || !documentName.trim()) {
      return null;
    }

    try {
      return await this.createDocument({
        title: documentName.trim(),
        parentId,
      });
    } catch (error) {
      console.error('Failed to create document:', error);
      return null;
    }
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, options?: {
    maxSize?: number;
    allowedTypes?: string[];
    blockedTypes?: string[];
  }): { valid: boolean; error?: string } {
    const { maxSize, allowedTypes, blockedTypes } = options || {};

    // Check file size
    if (maxSize && file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${this.formatFileSize(maxSize)}`,
      };
    }

    // Check allowed types
    if (allowedTypes && allowedTypes.length > 0) {
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.split('.').pop() || '';

      const isAllowed = allowedTypes.some(type =>
        fileType.includes(type.toLowerCase()) ||
        fileName.endsWith(`.${type.toLowerCase()}`) ||
        fileExtension === type.toLowerCase()
      );

      if (!isAllowed) {
        return {
          valid: false,
          error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
        };
      }
    }

    // Check blocked types
    if (blockedTypes && blockedTypes.length > 0) {
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.split('.').pop() || '';

      const isBlocked = blockedTypes.some(type =>
        fileType.includes(type.toLowerCase()) ||
        fileName.endsWith(`.${type.toLowerCase()}`) ||
        fileExtension === type.toLowerCase()
      );

      if (isBlocked) {
        return {
          valid: false,
          error: `File type not allowed. Blocked types: ${blockedTypes.join(', ')}`,
        };
      }
    }

    return { valid: true };
  }
}

// Export singleton instance
export const fileOperationsService = new FileOperationsService();
export default fileOperationsService;