import { useCallback, useEffect } from 'react';
import { useNotificationStore } from '@/stores/notification';
import { notificationApi } from '@/services/api/notificationApi';
import { PushNotificationData } from '@/services/notificationService';

export const useNotifications = () => {
  const {
    isInitialized,
    pushToken,
    preferences,
    unreadCount,
    notifications,
    isLoading,
    error,
    initialize,
    updatePreferences,
    sendLocalNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    refreshPushToken,
    setError,
  } = useNotificationStore();

  // Initialize notifications on first use
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  const registerTokenWithServer = useCallback(async () => {
    if (!pushToken) return;

    try {
      await notificationApi.registerToken({
        token: pushToken,
        deviceId: 'device-id', // TODO: Get actual device ID
        platform: 'android', // TODO: Get actual platform
      });
      // Push token registered with server
    } catch (error) {
      console.error('Failed to register push token with server:', error);
    }
  }, [pushToken]);

  // Register push token with server when available
  useEffect(() => {
    if (pushToken && isInitialized) {
      registerTokenWithServer();
    }
  }, [pushToken, isInitialized, registerTokenWithServer]);

  const sendNotification = useCallback(async (notification: PushNotificationData) => {
    try {
      await sendLocalNotification(notification);
    } catch (error) {
      console.error('Failed to send notification:', error);
      setError(error instanceof Error ? error.message : 'Failed to send notification');
    }
  }, [sendLocalNotification, setError]);

  const updateNotificationPreferences = useCallback(async (newPreferences: Partial<typeof preferences>) => {
    try {
      await updatePreferences(newPreferences);
      
      // Sync with server
      if (newPreferences.shareNotifications !== undefined ||
          newPreferences.collaborationNotifications !== undefined ||
          newPreferences.uploadNotifications !== undefined ||
          newPreferences.systemNotifications !== undefined) {
        
        const subscriptions = [
          { type: 'file_shared', enabled: newPreferences.shareNotifications ?? preferences.shareNotifications },
          { type: 'document_updated', enabled: newPreferences.collaborationNotifications ?? preferences.collaborationNotifications },
          { type: 'collaboration_invite', enabled: newPreferences.collaborationNotifications ?? preferences.collaborationNotifications },
          { type: 'upload_complete', enabled: newPreferences.uploadNotifications ?? preferences.uploadNotifications },
          { type: 'system_alert', enabled: newPreferences.systemNotifications ?? preferences.systemNotifications },
        ];

        await notificationApi.updateSubscriptions({ subscriptions: subscriptions.map(s => ({ type: s.type, enabled: s.enabled })) });
      }
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      setError(error instanceof Error ? error.message : 'Failed to update preferences');
    }
  }, [updatePreferences, preferences, setError]);

  const syncNotificationHistory = useCallback(async () => {
    try {
      await notificationApi.getNotificationHistory(50, 0);
      // TODO: Merge server history with local notifications
      // Notification history synced
    } catch (error) {
      console.error('Failed to sync notification history:', error);
    }
  }, []);

  const getUnreadCount = useCallback(async () => {
    try {
      const { count } = await notificationApi.getUnreadCount();
      return count;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return unreadCount;
    }
  }, [unreadCount]);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      markAsRead(notificationId);
      
      // Sync with server if it's a server notification
      const notification = notifications.find(n => n.id === notificationId);
      if (notification?.data?.serverId && typeof notification.data.serverId === 'string') {
        await notificationApi.markAsRead(notification.data.serverId);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [markAsRead, notifications]);

  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      markAllAsRead();
      
      // Sync with server
      await notificationApi.markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [markAllAsRead]);

  const testNotification = useCallback(async (type: string = 'system_alert') => {
    try {
      await notificationApi.testNotification(type, { test: true });
      // Test notification sent
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  }, []);

  return {
    // State
    isInitialized,
    pushToken,
    preferences,
    unreadCount,
    notifications,
    isLoading,
    error,

    // Actions
    sendNotification,
    updatePreferences: updateNotificationPreferences,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    removeNotification,
    clearAllNotifications,
    refreshPushToken,
    syncNotificationHistory,
    getUnreadCount,
    testNotification,
  };
};

export default useNotifications;