// File related type definitions
export interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  size?: number
  mimeType?: string
  createdAt: string
  updatedAt: string
  parentId?: string
  isShared?: boolean
  isStarred?: boolean
  isPublic?: boolean
  thumbnailUrl?: string
  downloadUrl?: string
  previewUrl?: string
  // Additional metadata
  originalFilename?: string
  contentType?: string
  expiresAt?: string
  // Permissions
  canEdit?: boolean
  canDelete?: boolean
  canShare?: boolean
  // Offline support
  isOfflineAvailable?: boolean
  lastSyncedAt?: string
  localPath?: string
  syncStatus?: 'synced' | 'modified' | 'conflict' | 'pending'
}

export interface UploadProgress {
  id: string
  fileName: string
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'paused' | 'cancelled'
  error?: string
  loaded?: number
  total?: number
  speed?: number
  estimatedTime?: number
}

export interface FolderContents {
  folders: FileItem[]
  files: FileItem[]
  totalCount: number
  hasMore?: boolean
}

export interface FileMetadata {
  id: string
  filename: string
  originalFilename: string
  size: number
  contentType: string
  isPublic: boolean
  expiresAt?: string
  createdAt: string
  updatedAt: string
  userId: string
}

export interface DriveItem {
  id: string
  name: string
  type: 'file' | 'folder'
  parentId?: string
  driveId: string
  size?: number
  mimeType?: string
  isShared: boolean
  isStarred: boolean
  isTrashed: boolean
  createdAt: string
  updatedAt: string
  permissions: {
    canView: boolean
    canEdit: boolean
    canDelete: boolean
    canShare: boolean
  }
}

export interface SharePermission {
  userId: string
  email: string
  role: 'viewer' | 'editor' | 'owner'
  grantedAt: string
  grantedBy: string
}

export interface SharingInfo {
  isShared: boolean
  shareLink?: string
  linkAccessLevel?: 'view' | 'edit'
  permissions: SharePermission[]
}

export interface UploadQueueItem {
  id: string
  file: {
    uri: string
    name: string
    size: number
    type?: string
  }
  parentId?: string | undefined
  progress: UploadProgress
  retryCount: number
  maxRetries: number
}

export interface OfflineFile {
  fileId: string
  localPath: string
  originalName: string
  size: number
  mimeType?: string
  lastModified: Date
  syncStatus: 'synced' | 'modified' | 'conflict'
  downloadedAt: Date
}

export interface FileFilter {
  type?: 'all' | 'files' | 'folders' | 'images' | 'videos' | 'documents' | 'audio'
  starred?: boolean
  shared?: boolean
  recent?: boolean
  trashed?: boolean
}

export interface SortOption {
  field: 'name' | 'size' | 'modified' | 'created' | 'type'
  direction: 'asc' | 'desc'
}

export interface SearchResult {
  items: FileItem[]
  totalCount: number
  hasMore: boolean
  query: string
  filters?: FileFilter
}