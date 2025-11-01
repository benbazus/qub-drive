import { User } from "./auth"

export interface FileItem {
  id: string
  fileName: string
  fileSize: string
  mimeType: string
  location?: string
  type: string
  fileType: 'file' | 'folder'
  modified: string
  starred: boolean
  shared: boolean
  locked: boolean
  deleted: boolean
  parentId?: string | null
  path?: string
  filePath?: string
  createdAt?: string
  updatedAt?: string
  ownerId?: string
  permissions?: string[]
  isFolder?: boolean
  owner?: User
}

export interface MoveFileRequest {

}
export interface DownloadPrepareResponse {
  success: boolean;
  data?: {
    downloadUrl: string;
  };
  message?: string;
}

export interface DownloadOptions {
  format: string;
  compression: 'none' | 'low' | 'medium' | 'high';
  includeMetadata: boolean;
  includeVersionHistory: boolean;
  notifyOnComplete: boolean;
  trackAnalytics: boolean;
}
export interface FileFilters {
  search?: string
  type?: string
  parentId?: string | null
  starred?: boolean
  shared?: boolean
  mimeType?: string
}

export interface FilePagination {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FileListResponse {
  files: FileItem[]
  totalCount: number
  totalPages: number
  currentPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PathCrumb {
  id: string | null
  name: string
}

export type FileAction =
  | 'preview'
  | 'download'
  | 'share'
  | 'rename'
  | 'move'
  | 'copy'
  | 'star'
  | 'unstar'
  | 'lock'
  | 'unlock'
  | 'delete'
  | 'details'
  | 'copyLink'

export interface FileActionEvent {
  action: FileAction
  file: FileItem
}



export interface DeleteFileResponse {
  data: {
    success: boolean;
    message?: string;
  };

}