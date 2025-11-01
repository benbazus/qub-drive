// Sharing related type definitions
export interface SharePermission {
  id: string
  userId: string
  email: string
  name?: string
  role: 'viewer' | 'editor' | 'owner'
  grantedAt: string
  grantedBy: string
  canEdit?: boolean
  canDelete?: boolean
}

export interface ShareLink {
  id: string
  token: string
  url: string
  accessLevel: 'view' | 'edit'
  isActive: boolean
  hasPassword: boolean
  maxDownloads?: number
  downloadCount: number
  expiresAt?: string
  createdAt: string
}

export interface FileShare {
  id: string
  fileId: string
  fileName: string
  fileType: 'file' | 'folder'
  ownerId: string
  ownerEmail: string
  ownerName?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  shareLink?: ShareLink
  permissions: SharePermission[]
}

export interface CreateShareRequest {
  fileId: string
  userEmails?: string[]
  role?: 'viewer' | 'editor'
  message?: string
  createLink?: boolean
  linkSettings?: {
    accessLevel: 'view' | 'edit'
    password?: string
    expiresAt?: string
    maxDownloads?: number
  }
}

export interface UpdateShareRequest {
  role?: 'viewer' | 'editor' | 'owner'
  isActive?: boolean
}

export interface ShareLinkRequest {
  accessLevel: 'view' | 'edit'
  password?: string
  expiresAt?: string
  maxDownloads?: number
}

export interface ShareInvitation {
  email: string
  role: 'viewer' | 'editor'
  message?: string
}

export interface ShareSettings {
  allowPublicSharing: boolean
  defaultLinkAccess: 'view' | 'edit'
  requirePassword: boolean
  defaultExpiration?: number // days
  maxDownloads?: number
}

export interface ShareActivity {
  id: string
  type: 'shared' | 'accessed' | 'downloaded' | 'permission_changed' | 'revoked'
  userId?: string
  userEmail?: string
  userName?: string
  timestamp: string
  details?: string
}

export interface ShareAnalytics {
  totalShares: number
  activeShares: number
  totalViews: number
  totalDownloads: number
  recentActivity: ShareActivity[]
}

export interface ShareNotification {
  id: string
  type: 'share_received' | 'share_accessed' | 'permission_changed'
  fileId: string
  fileName: string
  fromUserId: string
  fromUserEmail: string
  fromUserName?: string
  message?: string
  timestamp: string
  isRead: boolean
}