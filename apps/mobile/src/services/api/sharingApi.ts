import { apiClient } from './client'
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

export interface ShareApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface ShareListParams {
  fileId?: string
  ownerId?: string
  limit?: number
  offset?: number
  includeInactive?: boolean
}

class SharingApiService {
  private readonly baseUrl = '/shares'

  /**
   * Get file sharing information
   */
  async getFileSharing(fileId: string): Promise<FileShare> {
    const response = await apiClient.get<ShareApiResponse<FileShare>>(
      `${this.baseUrl}/file/${fileId}`
    )
    return response.data.data
  }

  /**
   * Create a new share
   */
  async createShare(request: CreateShareRequest): Promise<FileShare> {
    const response = await apiClient.post<ShareApiResponse<FileShare>>(
      this.baseUrl,
      request
    )
    return response.data.data
  }

  /**
   * Update share permissions
   */
  async updateShare(shareId: string, request: UpdateShareRequest): Promise<FileShare> {
    const response = await apiClient.put<ShareApiResponse<FileShare>>(
      `${this.baseUrl}/${shareId}`,
      request
    )
    return response.data.data
  }

  /**
   * Delete/revoke a share
   */
  async deleteShare(shareId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${shareId}`)
  }

  /**
   * List user's shares
   */
  async listShares(params: ShareListParams = {}): Promise<FileShare[]> {
    const response = await apiClient.get<ShareApiResponse<FileShare[]>>(
      this.baseUrl,
      { params }
    )
    return response.data.data
  }

  /**
   * Get shares for a specific file
   */
  async getFileShares(fileId: string): Promise<FileShare[]> {
    const response = await apiClient.get<ShareApiResponse<FileShare[]>>(
      `${this.baseUrl}/file/${fileId}/all`
    )
    return response.data.data
  }

  /**
   * Share file with users by email
   */
  async shareWithUsers(fileId: string, invitations: ShareInvitation[]): Promise<FileShare> {
    const response = await apiClient.post<ShareApiResponse<FileShare>>(
      `${this.baseUrl}/invite`,
      {
        fileId,
        invitations,
      }
    )
    return response.data.data
  }

  /**
   * Create or update sharing link
   */
  async createSharingLink(fileId: string, settings: ShareLinkRequest): Promise<string> {
    const response = await apiClient.post<ShareApiResponse<{ url: string }>>(
      `${this.baseUrl}/link`,
      {
        fileId,
        ...settings,
      }
    )
    return response.data.data.url
  }

  /**
   * Update sharing link settings
   */
  async updateSharingLink(fileId: string, settings: Partial<ShareLinkRequest>): Promise<string> {
    const response = await apiClient.put<ShareApiResponse<{ url: string }>>(
      `${this.baseUrl}/link/${fileId}`,
      settings
    )
    return response.data.data.url
  }

  /**
   * Revoke sharing link
   */
  async revokeSharingLink(fileId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/link/${fileId}`)
  }

  /**
   * Update user permission in a share
   */
  async updateUserPermission(
    shareId: string,
    userId: string,
    role: 'viewer' | 'editor' | 'owner'
  ): Promise<void> {
    await apiClient.put(`${this.baseUrl}/${shareId}/permissions/${userId}`, {
      role,
    })
  }

  /**
   * Remove user from share
   */
  async removeUserFromShare(shareId: string, userId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${shareId}/permissions/${userId}`)
  }

  /**
   * Get shared files (files shared with current user)
   */
  async getSharedWithMe(limit: number = 50, offset: number = 0): Promise<FileShare[]> {
    const response = await apiClient.get<ShareApiResponse<FileShare[]>>(
      `${this.baseUrl}/shared-with-me`,
      {
        params: { limit, offset },
      }
    )
    return response.data.data
  }

  /**
   * Get files shared by current user
   */
  async getSharedByMe(limit: number = 50, offset: number = 0): Promise<FileShare[]> {
    const response = await apiClient.get<ShareApiResponse<FileShare[]>>(
      `${this.baseUrl}/shared-by-me`,
      {
        params: { limit, offset },
      }
    )
    return response.data.data
  }

  /**
   * Accept a share invitation
   */
  async acceptShare(shareId: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${shareId}/accept`)
  }

  /**
   * Decline a share invitation
   */
  async declineShare(shareId: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${shareId}/decline`)
  }

  /**
   * Get share by token (for public access)
   */
  async getShareByToken(token: string): Promise<FileShare> {
    const response = await apiClient.get<ShareApiResponse<FileShare>>(
      `${this.baseUrl}/token/${token}`
    )
    return response.data.data
  }

  /**
   * Access shared file by token
   */
  async accessSharedFile(token: string, password?: string): Promise<Blob> {
    const response = await apiClient.post(
      `${this.baseUrl}/token/${token}/access`,
      { password },
      { responseType: 'blob' }
    )
    return response.data as Blob
  }

  /**
   * Get share analytics
   */
  async getShareAnalytics(fileId: string): Promise<ShareAnalytics> {
    const response = await apiClient.get<ShareApiResponse<ShareAnalytics>>(
      `${this.baseUrl}/analytics/${fileId}`
    )
    return response.data.data
  }

  /**
   * Get share activity
   */
  async getShareActivity(
    shareId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ShareActivity[]> {
    const response = await apiClient.get<ShareApiResponse<ShareActivity[]>>(
      `${this.baseUrl}/${shareId}/activity`,
      {
        params: { limit, offset },
      }
    )
    return response.data.data
  }

  /**
   * Get share notifications
   */
  async getShareNotifications(
    limit: number = 20,
    offset: number = 0
  ): Promise<ShareNotification[]> {
    const response = await apiClient.get<ShareApiResponse<ShareNotification[]>>(
      `${this.baseUrl}/notifications`,
      {
        params: { limit, offset },
      }
    )
    return response.data.data
  }

  /**
   * Mark share notification as read
   */
  async markNotificationRead(notificationId: string): Promise<void> {
    await apiClient.put(`${this.baseUrl}/notifications/${notificationId}/read`)
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead(): Promise<void> {
    await apiClient.put(`${this.baseUrl}/notifications/mark-all-read`)
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/notifications/${notificationId}`)
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/notifications`)
  }

  /**
   * Get user's share settings
   */
  async getShareSettings(): Promise<ShareSettings> {
    const response = await apiClient.get<ShareApiResponse<ShareSettings>>(
      `${this.baseUrl}/settings`
    )
    return response.data.data
  }

  /**
   * Update user's share settings
   */
  async updateShareSettings(settings: Partial<ShareSettings>): Promise<ShareSettings> {
    const response = await apiClient.put<ShareApiResponse<ShareSettings>>(
      `${this.baseUrl}/settings`,
      settings
    )
    return response.data.data
  }

  /**
   * Search users for sharing
   */
  async searchUsers(query: string, limit: number = 10): Promise<{
    id: string
    email: string
    name?: string
    avatar?: string
  }[]> {
    const response = await apiClient.get<ShareApiResponse<{
      id: string
      email: string
      name?: string
      avatar?: string
    }[]>>(
      '/users/search',
      {
        params: { q: query, limit },
      }
    )
    return response.data.data
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
    const response = await apiClient.post<ShareApiResponse<{
      email: string
      isValid: boolean
      isRegistered: boolean
      userId?: string
      name?: string
    }[]>>(
      '/users/validate-emails',
      { emails }
    )
    return response.data.data
  }
}

export const sharingApi = new SharingApiService()
export default sharingApi