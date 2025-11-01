

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}


// Utility functions
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const formatTime = (seconds: number | null): string => {
  if (!seconds || seconds <= 0) return '0s'

  if (seconds < 60) {
    return `${Math.round(seconds)}s`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num)
}

// Encode a folder ID
export function encodeFolderId(folderId: string): string {
  return btoa(folderId)
}

// Decode a folder ID
export function decodeFolder(encodedFolderId: string): string {
  return atob(encodedFolderId)
}


export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

/**
 * Check if file is image
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

/**
 * Check if file is video
 */
export function isVideoFile(mimeType: string): boolean {
  return mimeType.startsWith('video/')
}

/**
 * Check if file is document
 */
export function isDocumentFile(mimeType: string): boolean {
  const docTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ]

  return docTypes.includes(mimeType)
}