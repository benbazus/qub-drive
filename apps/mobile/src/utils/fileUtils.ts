import React from 'react'
import { FileItem } from '@/types/file'
import * as FileSystem from 'expo-file-system'
import { Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export interface FileTypeInfo {
  category: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'code' | 'other'
  icon: string
  color: string
  canPreview: boolean
}

export interface SortOptions {
  field: 'name' | 'size' | 'modified' | 'type'
  direction: 'asc' | 'desc'
}

/**
 * File type mappings and utilities
 */
export class FileUtils {
  private static readonly fileTypeMap: Record<string, FileTypeInfo> = {
    // Images
    '.jpg': { category: 'image', icon: 'image', color: '#4CAF50', canPreview: true },
    '.jpeg': { category: 'image', icon: 'image', color: '#4CAF50', canPreview: true },
    '.png': { category: 'image', icon: 'image', color: '#4CAF50', canPreview: true },
    '.gif': { category: 'image', icon: 'image', color: '#4CAF50', canPreview: true },
    '.webp': { category: 'image', icon: 'image', color: '#4CAF50', canPreview: true },
    '.svg': { category: 'image', icon: 'image', color: '#4CAF50', canPreview: true },
    '.bmp': { category: 'image', icon: 'image', color: '#4CAF50', canPreview: true },
    '.tiff': { category: 'image', icon: 'image', color: '#4CAF50', canPreview: true },

    // Videos
    '.mp4': { category: 'video', icon: 'play-circle', color: '#FF5722', canPreview: true },
    '.avi': { category: 'video', icon: 'play-circle', color: '#FF5722', canPreview: true },
    '.mov': { category: 'video', icon: 'play-circle', color: '#FF5722', canPreview: true },
    '.wmv': { category: 'video', icon: 'play-circle', color: '#FF5722', canPreview: true },
    '.flv': { category: 'video', icon: 'play-circle', color: '#FF5722', canPreview: true },
    '.webm': { category: 'video', icon: 'play-circle', color: '#FF5722', canPreview: true },
    '.mkv': { category: 'video', icon: 'play-circle', color: '#FF5722', canPreview: true },

    // Audio
    '.mp3': { category: 'audio', icon: 'music', color: '#9C27B0', canPreview: true },
    '.wav': { category: 'audio', icon: 'music', color: '#9C27B0', canPreview: true },
    '.flac': { category: 'audio', icon: 'music', color: '#9C27B0', canPreview: true },
    '.aac': { category: 'audio', icon: 'music', color: '#9C27B0', canPreview: true },
    '.ogg': { category: 'audio', icon: 'music', color: '#9C27B0', canPreview: true },
    '.m4a': { category: 'audio', icon: 'music', color: '#9C27B0', canPreview: true },

    // Documents
    '.pdf': { category: 'document', icon: 'file-text', color: '#F44336', canPreview: true },
    '.doc': { category: 'document', icon: 'file-text', color: '#2196F3', canPreview: false },
    '.docx': { category: 'document', icon: 'file-text', color: '#2196F3', canPreview: false },
    '.xls': { category: 'document', icon: 'grid', color: '#4CAF50', canPreview: false },
    '.xlsx': { category: 'document', icon: 'grid', color: '#4CAF50', canPreview: false },
    '.ppt': { category: 'document', icon: 'presentation', color: '#FF9800', canPreview: false },
    '.pptx': { category: 'document', icon: 'presentation', color: '#FF9800', canPreview: false },
    '.txt': { category: 'document', icon: 'file-text', color: '#607D8B', canPreview: true },
    '.rtf': { category: 'document', icon: 'file-text', color: '#607D8B', canPreview: true },

    // Archives
    '.zip': { category: 'archive', icon: 'archive', color: '#795548', canPreview: false },
    '.rar': { category: 'archive', icon: 'archive', color: '#795548', canPreview: false },
    '.7z': { category: 'archive', icon: 'archive', color: '#795548', canPreview: false },
    '.tar': { category: 'archive', icon: 'archive', color: '#795548', canPreview: false },
    '.gz': { category: 'archive', icon: 'archive', color: '#795548', canPreview: false },

    // Code files
    '.js': { category: 'code', icon: 'code', color: '#FFC107', canPreview: true },
    '.ts': { category: 'code', icon: 'code', color: '#2196F3', canPreview: true },
    '.jsx': { category: 'code', icon: 'code', color: '#61DAFB', canPreview: true },
    '.tsx': { category: 'code', icon: 'code', color: '#61DAFB', canPreview: true },
    '.html': { category: 'code', icon: 'code', color: '#FF5722', canPreview: true },
    '.css': { category: 'code', icon: 'code', color: '#2196F3', canPreview: true },
    '.json': { category: 'code', icon: 'code', color: '#FFC107', canPreview: true },
    '.xml': { category: 'code', icon: 'code', color: '#FF9800', canPreview: true },
    '.py': { category: 'code', icon: 'code', color: '#3776AB', canPreview: true },
    '.java': { category: 'code', icon: 'code', color: '#ED8B00', canPreview: true },
    '.cpp': { category: 'code', icon: 'code', color: '#00599C', canPreview: true },
    '.c': { category: 'code', icon: 'code', color: '#A8B9CC', canPreview: true },
    '.php': { category: 'code', icon: 'code', color: '#777BB4', canPreview: true },
    '.rb': { category: 'code', icon: 'code', color: '#CC342D', canPreview: true },
    '.go': { category: 'code', icon: 'code', color: '#00ADD8', canPreview: true },
    '.rs': { category: 'code', icon: 'code', color: '#000000', canPreview: true },
    '.swift': { category: 'code', icon: 'code', color: '#FA7343', canPreview: true },
    '.kt': { category: 'code', icon: 'code', color: '#7F52FF', canPreview: true },
    '.dart': { category: 'code', icon: 'code', color: '#0175C2', canPreview: true },
  }

  /**
   * Get file extension from filename
   */
  static getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.')
    return lastDot !== -1 ? filename.substring(lastDot).toLowerCase() : ''
  }

  /**
   * Get file type information
   */
  static getFileTypeInfo(filename: string): FileTypeInfo {
    const extension = this.getFileExtension(filename)
    return this.fileTypeMap[extension] || {
      category: 'other',
      icon: 'file',
      color: '#9E9E9E',
      canPreview: false,
    }
  }

  /**
   * Check if file can be previewed
   */
  static canPreviewFile(filename: string): boolean {
    return this.getFileTypeInfo(filename).canPreview
  }

  /**
   * Get file category
   */
  static getFileCategory(filename: string): string {
    return this.getFileTypeInfo(filename).category
  }

  /**
   * Format file size
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`
  }

  /**
   * Format date for display
   */
  static formatDate(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return 'Today'
    } else if (diffDays === 2) {
      return 'Yesterday'
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  /**
   * Get file icon based on mime type or file type
   */
  static getFileIcon(mimeType?: string, size: number = 24, color: string = '#666'): React.ReactElement {
    if (!mimeType) {
      return React.createElement(Ionicons, { name: 'document-outline', size, color })
    }

    // Folder
    if (mimeType === 'folder') {
      return React.createElement(Ionicons, { name: 'folder', size, color })
    }

    // Images
    if (mimeType.startsWith('image/')) {
      return React.createElement(Ionicons, { name: 'image-outline', size, color })
    }

    // Videos
    if (mimeType.startsWith('video/')) {
      return React.createElement(Ionicons, { name: 'videocam-outline', size, color })
    }

    // Audio
    if (mimeType.startsWith('audio/')) {
      return React.createElement(Ionicons, { name: 'musical-notes-outline', size, color })
    }

    // Documents
    if (mimeType === 'application/pdf') {
      return React.createElement(Ionicons, { name: 'document-text-outline', size, color })
    }

    if (mimeType.includes('word') || mimeType.includes('document')) {
      return React.createElement(Ionicons, { name: 'document-text-outline', size, color })
    }

    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return React.createElement(Ionicons, { name: 'grid-outline', size, color })
    }

    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
      return React.createElement(Ionicons, { name: 'easel-outline', size, color })
    }

    // Text files
    if (mimeType.startsWith('text/')) {
      return React.createElement(Ionicons, { name: 'document-text-outline', size, color })
    }

    // Archives
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('7z')) {
      return React.createElement(Ionicons, { name: 'archive-outline', size, color })
    }

    // Code files
    if (mimeType.includes('javascript') || mimeType.includes('typescript') || 
        mimeType.includes('json') || mimeType.includes('xml') || mimeType.includes('html')) {
      return React.createElement(Ionicons, { name: 'code-outline', size, color })
    }

    // Default
    return React.createElement(Ionicons, { name: 'document-outline', size, color })
  }

  /**
   * Sort files array
   */
  static sortFiles(files: FileItem[], options: SortOptions): FileItem[] {
    const { field, direction } = options
    
    return [...files].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (field) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'size':
          aValue = a.size || 0
          bValue = b.size || 0
          break
        case 'modified':
          aValue = new Date(a.updatedAt).getTime()
          bValue = new Date(b.updatedAt).getTime()
          break
        case 'type':
          aValue = a.type === 'folder' ? 0 : 1 // Folders first
          bValue = b.type === 'folder' ? 0 : 1
          if (aValue === bValue) {
            // If both are same type, sort by name
            aValue = a.name.toLowerCase()
            bValue = b.name.toLowerCase()
          }
          break
        default:
          return 0
      }

      if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }

  /**
   * Filter files by search query
   */
  static filterFiles(files: FileItem[], query: string): FileItem[] {
    if (!query.trim()) {
      return files
    }

    const searchTerm = query.toLowerCase().trim()
    
    return files.filter(file => 
      file.name.toLowerCase().includes(searchTerm) ||
      (file.type === 'file' && this.getFileCategory(file.name).includes(searchTerm))
    )
  }

  /**
   * Group files by category
   */
  static groupFilesByCategory(files: FileItem[]): Record<string, FileItem[]> {
    const groups: Record<string, FileItem[]> = {
      folders: [],
      images: [],
      videos: [],
      audio: [],
      documents: [],
      archives: [],
      code: [],
      other: [],
    }

    files.forEach(file => {
      if (file.type === 'folder') {
        groups.folders?.push(file)
      } else {
        const category = this.getFileCategory(file.name)
        const categoryGroup = groups[category]
        if (categoryGroup) {
          categoryGroup.push(file)
        } else {
          groups.other?.push(file)
        }
      }
    })

    return groups
  }

  /**
   * Get breadcrumb path from file path
   */
  static getBreadcrumbPath(currentPath: string): { name: string; id: string }[] {
    if (!currentPath || currentPath === '/') {
      return [{ name: 'Home', id: '' }]
    }

    const parts = currentPath.split('/').filter(Boolean)
    const breadcrumbs = [{ name: 'Home', id: '' }]

    let currentId = ''
    parts.forEach((part) => {
      currentId += `/${part}`
      breadcrumbs.push({
        name: part,
        id: currentId,
      })
    })

    return breadcrumbs
  }

  /**
   * Validate filename
   */
  static validateFilename(filename: string): { valid: boolean; error?: string } {
    if (!filename || !filename.trim()) {
      return { valid: false, error: 'Filename cannot be empty' }
    }

    const trimmedName = filename.trim()

    // Check length
    if (trimmedName.length > 255) {
      return { valid: false, error: 'Filename is too long (max 255 characters)' }
    }

    // Check for invalid characters
    const invalidChars = Platform.OS === 'ios' 
      ? /[:]/ 
      : /[<>:"/\\|?*]/

    if (invalidChars.test(trimmedName)) {
      const invalidCharsList = Platform.OS === 'ios' ? ':' : '<>:"/\\|?*'
      return { 
        valid: false, 
        error: `Filename contains invalid characters: ${invalidCharsList}` 
      }
    }

    // Check for reserved names (Windows)
    if (Platform.OS === 'android') {
      const reservedNames = [
        'CON', 'PRN', 'AUX', 'NUL',
        'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
        'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
      ]

      const nameWithoutExt = trimmedName.split('.')[0]?.toUpperCase()
      if (nameWithoutExt && reservedNames.includes(nameWithoutExt)) {
        return { valid: false, error: 'Filename is reserved and cannot be used' }
      }
    }

    return { valid: true }
  }

  /**
   * Generate unique filename if file already exists
   */
  static generateUniqueFilename(originalName: string, existingNames: string[]): string {
    if (!existingNames.includes(originalName)) {
      return originalName
    }

    const extension = this.getFileExtension(originalName)
    const nameWithoutExt = extension 
      ? originalName.substring(0, originalName.lastIndexOf('.'))
      : originalName

    let counter = 1
    let newName: string

    do {
      newName = extension 
        ? `${nameWithoutExt} (${counter})${extension}`
        : `${nameWithoutExt} (${counter})`
      counter++
    } while (existingNames.includes(newName))

    return newName
  }

  /**
   * Check if file is an image
   */
  static isImage(filename: string): boolean {
    return this.getFileCategory(filename) === 'image'
  }

  /**
   * Check if file is a video
   */
  static isVideo(filename: string): boolean {
    return this.getFileCategory(filename) === 'video'
  }

  /**
   * Check if file is audio
   */
  static isAudio(filename: string): boolean {
    return this.getFileCategory(filename) === 'audio'
  }

  /**
   * Check if file is a document
   */
  static isDocument(filename: string): boolean {
    return this.getFileCategory(filename) === 'document'
  }

  /**
   * Get MIME type from filename
   */
  static getMimeType(filename: string): string {
    const extension = this.getFileExtension(filename)
    
    const mimeTypes: Record<string, string> = {
      // Images
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.bmp': 'image/bmp',
      '.tiff': 'image/tiff',

      // Videos
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.wmv': 'video/x-ms-wmv',
      '.flv': 'video/x-flv',
      '.webm': 'video/webm',
      '.mkv': 'video/x-matroska',

      // Audio
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.flac': 'audio/flac',
      '.aac': 'audio/aac',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/mp4',

      // Documents
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain',
      '.rtf': 'application/rtf',

      // Archives
      '.zip': 'application/zip',
      '.rar': 'application/vnd.rar',
      '.7z': 'application/x-7z-compressed',
      '.tar': 'application/x-tar',
      '.gz': 'application/gzip',

      // Code
      '.js': 'text/javascript',
      '.ts': 'text/typescript',
      '.jsx': 'text/jsx',
      '.tsx': 'text/tsx',
      '.html': 'text/html',
      '.css': 'text/css',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.py': 'text/x-python',
      '.java': 'text/x-java-source',
      '.cpp': 'text/x-c++src',
      '.c': 'text/x-csrc',
      '.php': 'text/x-php',
      '.rb': 'text/x-ruby',
      '.go': 'text/x-go',
      '.rs': 'text/x-rust',
      '.swift': 'text/x-swift',
      '.kt': 'text/x-kotlin',
      '.dart': 'text/x-dart',
    }

    return mimeTypes[extension] || 'application/octet-stream'
  }

  /**
   * Share file using native sharing (placeholder - requires expo-sharing)
   */
  static async shareFile(fileUri: string, filename: string): Promise<void> {
    try {
      // TODO: Install and import expo-sharing
      // const isAvailable = await Sharing.isAvailableAsync()
      // if (!isAvailable) {
      //   throw new Error('Sharing is not available on this device')
      // }
      // await Sharing.shareAsync(fileUri, {
      //   mimeType: this.getMimeType(filename),
      //   dialogTitle: `Share ${filename}`,
      //   UTI: this.getMimeType(filename),
      // })
      
      // Placeholder implementation
      if (__DEV__) {
        console.warn('Share file not implemented:', fileUri, filename)
      }
      throw new Error('Sharing not implemented - install expo-sharing')
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to share file')
    }
  }

  /**
   * Get file info from URI
   */
  static async getFileInfo(uri: string): Promise<{
    exists: boolean
    size?: number
    isDirectory?: boolean
    modificationTime?: number
  }> {
    try {
      return await FileSystem.getInfoAsync(uri)
    } catch (error) {
      return { exists: false }
    }
  }

  /**
   * Create cache key for file
   */
  static createCacheKey(fileId: string, type: 'thumbnail' | 'preview' | 'download' = 'download'): string {
    return `file_${type}_${fileId}`
  }

  /**
   * Get file cache directory
   */
  static getCacheDirectory(type: 'thumbnails' | 'previews' | 'downloads' = 'downloads'): string {
    return `${FileSystem.cacheDirectory}${type}/`
  }

  /**
   * Clean up cache directory
   */
  static async cleanupCache(type: 'thumbnails' | 'previews' | 'downloads' = 'downloads', maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const cacheDir = this.getCacheDirectory(type)
      const dirInfo = await FileSystem.getInfoAsync(cacheDir)
      
      if (!dirInfo.exists) {
        return
      }

      const files = await FileSystem.readDirectoryAsync(cacheDir)
      const now = Date.now()

      for (const file of files) {
        const filePath = `${cacheDir}${file}`
        const fileInfo = await FileSystem.getInfoAsync(filePath)
        
        if (fileInfo.exists && fileInfo.modificationTime) {
          const age = now - fileInfo.modificationTime * 1000
          if (age > maxAge) {
            await FileSystem.deleteAsync(filePath, { idempotent: true })
          }
        }
      }
    } catch (cleanupError) {
      // Silently ignore cleanup errors
      if (__DEV__) {
        console.warn('Cache cleanup failed:', cleanupError)
      }
    }
  }
}

export default FileUtils

// Convenience functions for easier imports
export const formatFileSize = FileUtils.formatFileSize
export const formatDate = FileUtils.formatDate
export const getFileIcon = FileUtils.getFileIcon
export const getFileExtension = FileUtils.getFileExtension
export const getFileTypeInfo = FileUtils.getFileTypeInfo
export const canPreviewFile = FileUtils.canPreviewFile
export const getFileCategory = FileUtils.getFileCategory
export const sortFiles = FileUtils.sortFiles
export const filterFiles = FileUtils.filterFiles
export const groupFilesByCategory = FileUtils.groupFilesByCategory
export const getBreadcrumbPath = FileUtils.getBreadcrumbPath
export const validateFilename = FileUtils.validateFilename
export const generateUniqueFilename = FileUtils.generateUniqueFilename
export const isImage = FileUtils.isImage
export const isVideo = FileUtils.isVideo
export const isAudio = FileUtils.isAudio
export const isDocument = FileUtils.isDocument
export const getMimeType = FileUtils.getMimeType