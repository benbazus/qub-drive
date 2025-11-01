import { apiClient } from './client';

export interface RegisterTokenRequest {
  token: string;
  deviceId: string;
  platform: 'ios' | 'android';
  userId?: string;
}

export interface RegisterTokenResponse {
  success: boolean;
  tokenId: string;
  message?: string;
}

export interface NotificationSubscription {
  id: string;
  userId: string;
  type: 'file_shared' | 'document_updated' | 'collaboration_invite' | 'system_alert';
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSubscriptionRequest {
  subscriptions: {
    type: string;
    enabled: boolean;
  }[];
}

export interface SendNotificationRequest {
  userId: string;
  type: 'file_shared' | 'document_updated' | 'collaboration_invite' | 'system_alert';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  priority?: 'low' | 'normal' | 'high';
  silent?: boolean;
}

export interface NotificationHistory {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  sentAt: string;
  readAt?: string;
}

class NotificationApiService {
  /**
   * Register push notification token with server
   */
  async registerToken(request: RegisterTokenRequest): Promise<RegisterTokenResponse> {
    try {
      const response = await apiClient.post<RegisterTokenResponse>('/notifications/register-token', request);
      return response.data;
    } catch (error) {
      console.error('Failed to register push token:', error);
      throw error;
    }
  }

  /**
   * Update push notification token
   */
  async updateToken(tokenId: string, request: Partial<RegisterTokenRequest>): Promise<RegisterTokenResponse> {
    try {
      const response = await apiClient.put<RegisterTokenResponse>(`/notifications/tokens/${tokenId}`, request);
      return response.data;
    } catch (error) {
      console.error('Failed to update push token:', error);
      throw error;
    }
  }

  /**
   * Remove push notification token
   */
  async removeToken(tokenId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.delete<{ success: boolean }>(`/notifications/tokens/${tokenId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to remove push token:', error);
      throw error;
    }
  }

  /**
   * Get user's notification subscriptions
   */
  async getSubscriptions(): Promise<NotificationSubscription[]> {
    try {
      const response = await apiClient.get<NotificationSubscription[]>('/notifications/subscriptions');
      return response.data;
    } catch (error) {
      console.error('Failed to get notification subscriptions:', error);
      throw error;
    }
  }

  /**
   * Update notification subscriptions
   */
  async updateSubscriptions(request: UpdateSubscriptionRequest): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.put<{ success: boolean }>('/notifications/subscriptions', request);
      return response.data;
    } catch (error) {
      console.error('Failed to update notification subscriptions:', error);
      throw error;
    }
  }

  /**
   * Send notification to user (admin/system use)
   */
  async sendNotification(request: SendNotificationRequest): Promise<{ success: boolean; messageId: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; messageId: string }>('/notifications/send', request);
      return response.data;
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Get notification history for user
   */
  async getNotificationHistory(limit = 50, offset = 0): Promise<{
    notifications: NotificationHistory[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const response = await apiClient.get<{
        notifications: NotificationHistory[];
        total: number;
        hasMore: boolean;
      }>('/notifications/history', {
        params: { limit, offset }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get notification history:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.put<{ success: boolean }>(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ success: boolean; count: number }> {
    try {
      const response = await apiClient.put<{ success: boolean; count: number }>('/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.delete<{ success: boolean }>(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<{ count: number }> {
    try {
      const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
      return response.data;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      throw error;
    }
  }

  /**
   * Test notification (development/testing)
   */
  async testNotification(type: string, data?: Record<string, unknown>): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.post<{ success: boolean }>('/notifications/test', { type, data });
      return response.data;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }
}

export const notificationApi = new NotificationApiService();
export default notificationApi;