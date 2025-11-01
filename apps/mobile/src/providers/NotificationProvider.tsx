import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { AppState, AppStateStatus } from 'react-native';
import { useNotificationStore } from '@/stores/notification';
import { notificationService } from '@/services/notificationService';

interface NotificationContextType {
  initialized: boolean;
}

const NotificationContext = createContext<NotificationContextType>({ initialized: false });

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const router = useRouter();
  const initialize = useNotificationStore((state) => state.initialize);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const appState = useRef(AppState.currentState);

  const navigateToUrl = useCallback((url: string) => {
    try {
      // Parse the URL and navigate accordingly
      if (url.startsWith('/')) {
        router.push(url as '/(tabs)');
      } else {
        // Handle external URLs if needed
        // External URL navigation not implemented
      }
    } catch (error) {
      console.error('Failed to navigate to URL:', url, error);
    }
  }, [router]);

  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const { notification } = response;
    const data = notification.request.content.data as Record<string, unknown> || {};

    // Let the notification service handle the response
    notificationService.handleNotificationResponse(response);

    // Handle navigation based on notification data
    if (data.actionUrl && typeof data.actionUrl === 'string') {
      navigateToUrl(data.actionUrl);
    } else {
      // Handle specific notification types
      switch (data.type) {
        case 'file_shared':
          if (data.fileId && typeof data.fileId === 'string') {
            router.push(`/file/${data.fileId}` as '/file/[id]');
          }
          break;
        case 'document_updated':
          if (data.documentId && typeof data.documentId === 'string') {
            router.push(`/document/${data.documentId}` as '/document/[id]');
          }
          break;
        case 'collaboration_invite':
          if (data.inviteId && typeof data.inviteId === 'string') {
            router.push('/(tabs)' as '/(tabs)');
          }
          break;
        case 'upload_complete':
          router.push('/(tabs)/files');
          break;
        default:
          // Navigate to main screen
          router.push('/(tabs)');
          break;
      }
    }
  }, [router, navigateToUrl]);

  const setupNotificationListeners = useCallback(() => {
    // Listen for notifications received while app is running
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      // Handle received notification
      
      // Add to local notification store
      const data = notification.request.content.data as Record<string, unknown> || {};
      const notificationType = (data.type as string) || 'system_alert';
      
      // Validate notification type
      const validTypes = ['file_shared', 'document_updated', 'upload_complete', 'system_alert', 'collaboration_invite'];
      const type = validTypes.includes(notificationType) ? (notificationType as 'file_shared' | 'document_updated' | 'upload_complete' | 'system_alert' | 'collaboration_invite') : 'system_alert';
      
      addNotification({
        type,
        title: notification.request.content.title || 'Notification',
        body: notification.request.content.body || '',
        data,
        actionUrl: data.actionUrl as string || '',
        isRead: false,
      });
    });

    // Listen for notification responses (when user taps notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      // Handle notification response
      handleNotificationResponse(response);
    });
  }, [addNotification, handleNotificationResponse]);

  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground
      // Refresh notification badge count
      Notifications.getBadgeCountAsync().then(() => {
        // Badge count refreshed
      });
    }

    appState.current = nextAppState;
  }, []);

  useEffect(() => {
    // Initialize notification store
    initialize();

    // Set up notification listeners
    setupNotificationListeners();

    // Set up app state listener
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      // Clean up listeners
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      appStateSubscription?.remove();
      
      // Clean up notification service
      notificationService.cleanup();
    };
  }, [initialize, setupNotificationListeners, handleAppStateChange]);

  const contextValue: NotificationContextType = {
    initialized: true,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};