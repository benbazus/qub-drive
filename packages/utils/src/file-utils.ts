import { FileType } from '@kingshare/shared-types';

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

export const getFileTypeFromMime = (mimeType: string): FileType => {
  if (mimeType.startsWith('image/')) return FileType.FILE;
  if (mimeType.startsWith('video/')) return FileType.FILE;
  if (mimeType.startsWith('audio/')) return FileType.FILE;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileType.SPREADSHEET;
  if (mimeType.includes('document') || mimeType.includes('word')) return FileType.DOCUMENT;
  return FileType.FILE;
};

export const isImageFile = (mimeType: string): boolean => {
  return mimeType.startsWith('image/');
};

export const isVideoFile = (mimeType: string): boolean => {
  return mimeType.startsWith('video/');
};

export const isDocumentFile = (mimeType: string): boolean => {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/rtf'
  ];
  return documentTypes.includes(mimeType);
};

export const isSpreadsheetFile = (mimeType: string): boolean => {
  const spreadsheetTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ];
  return spreadsheetTypes.includes(mimeType);
};

export const generateFileName = (originalName: string, suffix?: string): string => {
  const extension = getFileExtension(originalName);
  const nameWithoutExt = originalName.replace(`.${extension}`, '');
  const timestamp = Date.now();
  
  if (suffix) {
    return `${nameWithoutExt}_${suffix}_${timestamp}.${extension}`;
  }
  
  return `${nameWithoutExt}_${timestamp}.${extension}`;
};