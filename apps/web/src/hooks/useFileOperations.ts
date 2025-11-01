/* eslint-disable no-console */
import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useFolder } from '@/context/folder-context';
import { fileOperationsService, UploadCallbacks, CreateFolderOptions, CreateDocumentOptions } from '@/services/file-operations.service';
import { toast } from 'sonner';

export interface UseFileOperationsOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  invalidateQueries?: boolean;
}

export const useFileOperations = (options: UseFileOperationsOptions = {}) => {
  const { getParentFolder } = useFolder();
  const queryClient = useQueryClient();
  const { onSuccess, onError, invalidateQueries = true } = options;

  // Helper function to invalidate file queries
  const invalidateFileQueries = useCallback(() => {
    if (invalidateQueries) {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
  }, [queryClient, invalidateQueries]);

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async ({ file, parentId, callbacks }: {
      file: File;
      parentId?: string | null;
      callbacks?: UploadCallbacks;
    }) => {
      return fileOperationsService.uploadFile({
        file,
        parentId: parentId ?? getParentFolder,
        callbacks,
      });
    },
    onSuccess: (result) => {
      invalidateFileQueries();
      onSuccess?.(result);
    },
    onError: (error) => {
      console.error('Upload failed:', error);
      onError?.(error as Error);
    },
  });

  // Multiple files upload mutation
  const uploadFilesMutation = useMutation({
    mutationFn: async ({ files, parentId, callbacks }: {
      files: File[];
      parentId?: string | null;
      callbacks?: UploadCallbacks;
    }) => {
      return fileOperationsService.uploadFiles(
        files,
        parentId ?? getParentFolder,
        callbacks
      );
    },
    onSuccess: (result) => {
      invalidateFileQueries();
      onSuccess?.(result);
    },
    onError: (error) => {
      console.error('Multiple upload failed:', error);
      onError?.(error as Error);
    },
  });

  // Folder creation mutation
  const createFolderMutation = useMutation({
    mutationFn: async (options: CreateFolderOptions) => {
      return fileOperationsService.createFolder({
        ...options,
        parentId: options.parentId ?? getParentFolder,
      });
    },
    onSuccess: (result) => {
      invalidateFileQueries();
      onSuccess?.(result);
    },
    onError: (error) => {
      console.error('Folder creation failed:', error);
      onError?.(error as Error);
    },
  });

  // Document creation mutation
  const createDocumentMutation = useMutation({
    mutationFn: async (options: CreateDocumentOptions) => {
      return fileOperationsService.createDocument({
        ...options,
        parentId: options.parentId ?? getParentFolder,
      });
    },
    onSuccess: (result) => {
      invalidateFileQueries();
      onSuccess?.(result);
    },
    onError: (error) => {
      console.error('Document creation failed:', error);
      onError?.(error as Error);
    },
  });

  // Upload single file
  const uploadFile = useCallback(
    (file: File, callbacks?: UploadCallbacks, parentId?: string | null) => {
      return uploadFileMutation.mutateAsync({
        file,
        parentId,
        callbacks,
      });
    },
    [uploadFileMutation]
  );

  // Upload multiple files
  const uploadFiles = useCallback(
    (files: File[], callbacks?: UploadCallbacks, parentId?: string | null) => {
      return uploadFilesMutation.mutateAsync({
        files,
        parentId,
        callbacks,
      });
    },
    [uploadFilesMutation]
  );

  // Create folder
  const createFolder = useCallback(
    (name: string, parentId?: string | null) => {
      return createFolderMutation.mutateAsync({
        name,
        parentId,
      });
    },
    [createFolderMutation]
  );

  // Create document
  const createDocument = useCallback(
    (title: string, options?: Omit<CreateDocumentOptions, 'title'>, parentId?: string | null) => {
      return createDocumentMutation.mutateAsync({
        title,
        ...options,
        parentId,
      });
    },
    [createDocumentMutation]
  );

  // Trigger file upload dialog
  const triggerFileUpload = useCallback(
    (callbacks?: UploadCallbacks, options?: { multiple?: boolean; accept?: string }) => {
      fileOperationsService.triggerFileUpload(
        getParentFolder,
        {
          ...callbacks,
          onSuccess: (result) => {
            invalidateFileQueries();
            callbacks?.onSuccess?.(result);
          },
          onError: (error) => {
            callbacks?.onError?.(error);
          },
        },
        options
      );
    },
    [getParentFolder, invalidateFileQueries]
  );

  // Handle file drop
  const handleFileDrop = useCallback(
    (event: DragEvent, callbacks?: UploadCallbacks) => {
      fileOperationsService.handleFileDrop(
        event,
        getParentFolder,
        {
          ...callbacks,
          onSuccess: (result) => {
            invalidateFileQueries();
            callbacks?.onSuccess?.(result);
          },
          onError: (error) => {
            callbacks?.onError?.(error);
          },
        }
      );
    },
    [getParentFolder, invalidateFileQueries]
  );

  // Prompt and create folder
  const promptCreateFolder = useCallback(async () => {
    try {
      const result = await fileOperationsService.promptCreateFolder(getParentFolder);
      if (result) {
        invalidateFileQueries();
        onSuccess?.(result);
      }
      return result;
    } catch (error) {
      onError?.(error as Error);
      throw error;
    }
  }, [getParentFolder, invalidateFileQueries, onSuccess, onError]);

  // Prompt and create document
  const promptCreateDocument = useCallback(async () => {
    try {
      const result = await fileOperationsService.promptCreateDocument(getParentFolder);
      if (result) {
        invalidateFileQueries();
        onSuccess?.(result);
      }
      return result;
    } catch (error) {
      onError?.(error as Error);
      throw error;
    }
  }, [getParentFolder, invalidateFileQueries, onSuccess, onError]);

  // Handle file input change
  const handleFileInputChange = useCallback(
    (event: Event, callbacks?: UploadCallbacks) => {
      fileOperationsService.handleFileInputChange(
        event,
        getParentFolder,
        {
          ...callbacks,
          onSuccess: (result) => {
            invalidateFileQueries();
            callbacks?.onSuccess?.(result);
          },
          onError: (error) => {
            callbacks?.onError?.(error);
          },
        }
      );
    },
    [getParentFolder, invalidateFileQueries]
  );

  // Validate file before upload
  const validateFile = useCallback(
    (file: File, options?: {
      maxSize?: number;
      allowedTypes?: string[];
      blockedTypes?: string[];
    }) => {
      return fileOperationsService.validateFile(file, options);
    },
    []
  );

  // Upload with validation
  const uploadFileWithValidation = useCallback(
    async (
      file: File,
      validationOptions?: {
        maxSize?: number;
        allowedTypes?: string[];
        blockedTypes?: string[];
      },
      callbacks?: UploadCallbacks,
      parentId?: string | null
    ) => {
      // Validate file first
      const validation = validateFile(file, validationOptions);
      if (!validation.valid) {
        const error = new Error(validation.error);
        toast.error('File validation failed', {
          description: validation.error,
        });
        callbacks?.onError?.(error);
        throw error;
      }

      // Upload if validation passes
      return uploadFile(file, callbacks, parentId);
    },
    [validateFile, uploadFile]
  );

  return {
    // Mutation states
    isUploading: uploadFileMutation.isPending || uploadFilesMutation.isPending,
    isCreatingFolder: createFolderMutation.isPending,
    isCreatingDocument: createDocumentMutation.isPending,

    // Upload functions
    uploadFile,
    uploadFiles,
    uploadFileWithValidation,
    triggerFileUpload,
    handleFileDrop,
    handleFileInputChange,

    // Creation functions
    createFolder,
    createDocument,
    promptCreateFolder,
    promptCreateDocument,

    // Utility functions
    validateFile,
    invalidateFileQueries,

    // Current folder context
    currentFolder: getParentFolder,
  };
};