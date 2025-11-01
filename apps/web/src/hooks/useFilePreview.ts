import { useState, useCallback } from 'react';
import { fileEndPoint } from '@/api/endpoints/file.endpoint';

interface FilePreviewOptions {
  fileId: string;
  fileName: string;
  fileType: string;
}

export type PreviewType = 'image' | 'pdf' | 'unsupported';

export const useFilePreview = (options?: FilePreviewOptions) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentFile, setCurrentFile] = useState<FilePreviewOptions | null>(
    options || null
  );

  const openPreview = useCallback((file: FilePreviewOptions) => {
    setCurrentFile(file);
    setIsOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setIsOpen(false);
    setIsFullscreen(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const getPreviewUrl = useCallback(() => {
    if (!currentFile?.fileId) return '';
    return fileEndPoint.getPreviewUrl(currentFile.fileId);
  }, [currentFile]);

  const isPreviewSupported = useCallback((): boolean => {
    if (!currentFile) return false;
    return fileEndPoint.isPreviewSupported(currentFile.fileType, currentFile.fileName);
  }, [currentFile]);

  const getPreviewType = useCallback((): PreviewType => {
    if (!currentFile) return 'unsupported';
    return fileEndPoint.getPreviewType(currentFile.fileType, currentFile.fileName);
  }, [currentFile]);

  return {
    isOpen,
    isFullscreen,
    currentFile,
    openPreview,
    closePreview,
    toggleFullscreen,
    getPreviewUrl,
    isPreviewSupported,
    getPreviewType,
  };
};

export default useFilePreview;
