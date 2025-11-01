import { sharingApi } from './api/sharingApi'
import {
  FileShare,
  CreateShareRequest,
  UpdateShareRequest,
  ShareLinkRequest,
  ShareInvitation,
  ShareSettings,
  ShareAnalytics,
  ShareNotification,
  ShareActivity,
} from '@/types/sharing'

export interface SharingServiceOptions {
  maxRetries?: number
  retryDelay?: number
  onError?: (error: Error) => void
  onSuccess?: (message: string) => void
}

class SharingService {
  private maxRetries: number
  private retryDelay: number
  private onError?: ((error: Error) => void) | undefined
  private onSuccess?: ((message: string) => void) | undefined

  constructor(options: SharingServiceOptions = {}) {
    this.maxRetries = options.maxRetries || 3
    this.retryDelay = options.retryDelay || 1000
    this.onError = options.onError
    this.onSuccess = options.onSuccess
  }

  /**
   * Retry wrapper for API calls
   */
  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        if (attempt === this.maxRetries) {
          this.onError?.(lastError)
          throw lastError
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt))
      }
    }
    
    throw lastError!
  }

  /**
   * Get file sharing information
   */
  async getFileSharing(fileId: string): Promise<FileShare> {
    return this.withRetry(() => sharingApi.getFileSharing(fileId))
  }

  /**
   * Create a new share
   */
  async createShare(request: CreateShareRequest): Promise<FileShare> {
    const share = await this.withRetry(() => sharingApi.createShare(request))
    this.onSuccess?.('Share created successfully')
    return share
  }

  /**
   * Update share permissions
   */
  async updateShare(shareId: string, request: UpdateShareRequest): Promise<FileShare> {
    const share = await this.withRetry(() => sharingApi.updateShare(shareId, request))
    this.onSuccess?.('Share updated successfully')
    return share
  }

  /**
   * Delete/revoke a share
   */
  async deleteShare(shareId: string): Promise<void> {
    await this.withRetry(() => sharingApi.deleteShare(shareId))
    this.onSuccess?.('Share revoked successfully')
  }

  /**
   * List user's shares
   */
  async listShares(params: Parameters<typeof sharingApi.listShares>[0] = {}): Promise<FileShare[]> {
    return this.withRetry(() => sharingApi.listShares(params))
  }

  /**
   * Get shares for a specific file
   */
  async getFileShares(fileId: string): Promise<FileShare[]> {
    return this.withRetry(() => sharingApi.getFileShares(fileId))
  }

  /**
   * Share file with users by email
   */
  async shareWithUsers(fileId: string, invitations: ShareInvitation[]): Promise<FileShare> {
    const share = await this.withRetry(() => sharingApi.shareWithUsers(fileId, invitations))
    this.onSuccess?.(`Shared with ${invitations.length} user(s)`)
    return share
  }

  /**
   * Create or update sharing link
   */
  async createSharingLink(fileId: string, settings: ShareLinkRequest): Promise<string> {
    const url = await this.withRetry(() => sharingApi.createSharingLink(fileId, settings))
    this.onSuccess?.('Sharing link created')
    return url
  }

  /**
   * Update sharing link settings
   */
  async updateSharingLink(fileId: string, settings: Partial<ShareLinkRequest>): Promise<string> {
    const url = await this.withRetry(() => sharingApi.updateSharingLink(fileId, settings))
    this.onSuccess?.('Sharing link updated')
    return url
  }

  /**
   * Revoke sharing link
   */
  async revokeSharingLink(fileId: string): Promise<void> {
    await this.withRetry(() => sharingApi.revokeSharingLink(fileId))
    this.onSuccess?.('Sharing link revoked')
  }

  /**
   * Update user permission in a share
   */
  async updateUserPermission(
    shareId: string,
    userId: string,
    role: 'viewer' | 'editor' | 'owner'
  ): Promise<void> {
    await this.withRetry(() => sharingApi.updateUserPermission(shareId, userId, role))
    this.onSuccess?.('Permission updated')
  }

  /**
   * Remove user from share
   */
  async removeUserFromShare(shareId: string, userId: string): Promise<void> {
    await this.withRetry(() => sharingApi.removeUserFromShare(shareId, userId))
    this.onSuccess?.('User removed from share')
  }

  /**
   * Get shared files (files shared with current user)
   */
  async getSharedWithMe(limit?: number, offset?: number): Promise<FileShare[]> {
    return this.withRetry(() => sharingApi.getSharedWithMe(limit, offset))
  }

  /**
   * Get files shared by current user
   */
  async getSharedByMe(limit?: number, offset?: number): Promise<FileShare[]> {
    return this.withRetry(() => sharingApi.getSharedByMe(limit, offset))
  }

  /**
   * Accept a share invitation
   */
  async acceptShare(shareId: string): Promise<void> {
    await this.withRetry(() => sharingApi.acceptShare(shareId))
    this.onSuccess?.('Share accepted')
  }

  /**
   * Decline a share invitation
   */
  async declineShare(shareId: string): Promise<void> {
    await this.withRetry(() => sharingApi.declineShare(shareId))
    this.onSuccess?.('Share declined')
  }

  /**
   * Get share by token (for public access)
   */
  async getShareByToken(token: string): Promise<FileShare> {
    return this.withRetry(() => sharingApi.getShareByToken(token))
  }

  /**
   * Access shared file by token
   */
  async accessSharedFile(token: string, password?: string): Promise<Blob> {
    return this.withRetry(() => sharingApi.accessSharedFile(token, password))
  }

  /**
   * Get share analytics
   */
  async getShareAnalytics(fileId: string): Promise<ShareAnalytics> {
    return this.withRetry(() => sharingApi.getShareAnalytics(fileId))
  }

  /**
   * Get share activity
   */
  async getShareActivity(shareId: string, limit?: number, offset?: number): Promise<ShareActivity[]> {
    return this.withRetry(() => sharingApi.getShareActivity(shareId, limit, offset))
  }

  /**
   * Get share notifications
   */
  async getShareNotifications(limit?: number, offset?: number): Promise<ShareNotification[]> {
    return this.withRetry(() => sharingApi.getShareNotifications(limit, offset))
  }

  /**
   * Mark share notification as read
   */
  async markNotificationRead(notificationId: string): Promise<void> {
    await this.withRetry(() => sharingApi.markNotificationRead(notificationId))
  }

  /**
   * Get notifications for collaboration
   */
  async getNotifications(limit?: number, offset?: number): Promise<ShareNotification[]> {
    return this.withRetry(() => sharingApi.getShareNotifications(limit, offset))
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead(): Promise<void> {
    await this.withRetry(() => sharingApi.markAllNotificationsRead())
    this.onSuccess?.('All notifications marked as read')
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await this.withRetry(() => sharingApi.deleteNotification(notificationId))
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    await this.withRetry(() => sharingApi.clearAllNotifications())
    this.onSuccess?.('All notifications cleared')
  }

  /**
   * Get user's share settings
   */
  async getShareSettings(): Promise<ShareSettings> {
    return this.withRetry(() => sharingApi.getShareSettings())
  }

  /**
   * Update user's share settings
   */
  async updateShareSettings(settings: Partial<ShareSettings>): Promise<ShareSettings> {
    const updatedSettings = await this.withRetry(() => sharingApi.updateShareSettings(settings))
    this.onSuccess?.('Share settings updated')
    return updatedSettings
  }

  /**
   * Search users for sharing
   */
  async searchUsers(query: string, limit?: number): Promise<{
    id: string
    email: string
    name?: string
    avatar?: string
  }[]> {
    return this.withRetry(() => sharingApi.searchUsers(query, limit))
  }

  /**
   * Validate email addresses for sharing
   */
  async validateEmails(emails: string[]): Promise<{
    email: string
    isValid: boolean
    isRegistered: boolean
    userId?: string
    name?: string
  }[]> {
    return this.withRetry(() => sharingApi.validateEmails(emails))
  }

  /**
   * Quick share with default settings
   */
  async quickShare(fileId: string, emails: string[], role: 'viewer' | 'editor' = 'viewer'): Promise<FileShare> {
    const invitations: ShareInvitation[] = emails.map(email => ({
      email,
      role,
    }))
    
    return this.shareWithUsers(fileId, invitations)
  }

  /**
   * Create public link with default settings
   */
  async createPublicLink(fileId: string, accessLevel: 'view' | 'edit' = 'view'): Promise<string> {
    return this.createSharingLink(fileId, { accessLevel })
  }

  /**
   * Create secure link with password and expiration
   */
  async createSecureLink(
    fileId: string,
    password: string,
    expiresInDays: number = 7,
    accessLevel: 'view' | 'edit' = 'view'
  ): Promise<string> {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)
    
    return this.createSharingLink(fileId, {
      accessLevel,
      password,
      expiresAt: expiresAt.toISOString(),
    })
  }

  /**
   * Bulk share multiple files
   */
  async bulkShare(fileIds: string[], invitations: ShareInvitation[]): Promise<FileShare[]> {
    const shares = await Promise.all(
      fileIds.map(fileId => this.shareWithUsers(fileId, invitations))
    )
    this.onSuccess?.(`Shared ${fileIds.length} files with ${invitations.length} user(s)`)
    return shares
  }

  /**
   * Copy sharing settings from one file to another
   */
  async copyShareSettings(fromFileId: string, toFileId: string): Promise<FileShare> {
    const sourceShare = await this.getFileSharing(fromFileId)
    
    const invitations: ShareInvitation[] = sourceShare.permissions.map(permission => ({
      email: permission.email,
      role: permission.role === 'owner' ? 'editor' : permission.role,
    }))
    
    const request: CreateShareRequest = {
      fileId: toFileId,
      userEmails: invitations.map(inv => inv.email),
      role: 'viewer',
    }
    
    if (sourceShare.shareLink) {
      request.createLink = true
      request.linkSettings = {
        accessLevel: sourceShare.shareLink.accessLevel,
      }
    }
    
    return this.createShare(request)
  }
}

export const sharingService = new SharingService()
export default sharingService