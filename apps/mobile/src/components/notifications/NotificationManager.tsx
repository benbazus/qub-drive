import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { NotificationToast } from './NotificationToast';
import { NotificationCenter } from './NotificationCenter';
import { NotificationActionHandler } from './NotificationActionHandler';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from '@/stores/notification';

interface NotificationManagerProps {
  children: React.ReactNode;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({ children }) => {
  const { notifications } = useNotifications();
  
  const [currentToast, setCurrentToast] = useState<NotificationItem | null>(null);
  const [showCenter, setShowCenter] = useState(false);
  const [showActionHandler, setShowActionHandler] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  
  const toastQueue = useRef<NotificationItem[]>([]);
  const appState = useRef(AppState.currentState);
  const lastNotificationId = useRef<string | null>(null);

  const showNotificationToast = useCallback((notification: NotificationItem) => {
    if (currentToast) {
      // Queue the notification if one is already showing
      toastQueue.current.push(notification);
    } else {
      setCurrentToast(notification);
    }
  }, [currentToast]);

  const processToastQueue = useCallback(() => {
    if (toastQueue.current.length > 0 && !currentToast) {
      const nextNotification = toastQueue.current.shift();
      if (nextNotification) {
        setCurrentToast(nextNotification);
      }
    }
  }, [currentToast]);

  const handleToastDismiss = useCallback(() => {
    setCurrentToast(null);
    
    // Show next notification in queue after a short delay
    setTimeout(() => {
      processToastQueue();
    }, 300);
  }, [processToastQueue]);

  const handleToastPress = useCallback((notification: NotificationItem) => {
    setCurrentToast(null);
    setSelectedNotification(notification);
    setShowActionHandler(true);
  }, []);

  const handleNotificationAction = useCallback((actionIdentifier: string, _data: Record<string, unknown>) => {
    // Handle specific notification actions
    switch (actionIdentifier) {
      case 'view_file':
        // Handle view file action
        break;
      case 'open_document':
        // Handle open document action
        break;
      case 'accept_invite':
        // Handle accept collaboration invite
        break;
      case 'decline_invite':
        // Handle decline collaboration invite
        break;
      default:
        // Handle default action
        break;
    }
  }, []);

  // Handle new notifications
  useEffect(() => {
    if (notifications.length === 0) return;

    const latestNotification = notifications[0];
    if (!latestNotification) return;
    
    // Only show toast for new notifications
    if (latestNotification.id !== lastNotificationId.current) {
      lastNotificationId.current = latestNotification.id;
      
      // Only show toast if app is in foreground and notification is unread
      if (appState.current === 'active' && !latestNotification.isRead) {
        showNotificationToast(latestNotification);
      }
    }
  }, [notifications, showNotificationToast]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      appState.current = nextAppState;
      
      if (nextAppState === 'active') {
        // App came to foreground - process any queued notifications
        processToastQueue();
      } else {
        // App went to background - clear current toast
        setCurrentToast(null);
        toastQueue.current = [];
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [processToastQueue]);

  // Listen for notification responses
  useEffect(() => {
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> || {};
      const actionIdentifier = response.actionIdentifier;
      
      // Handle notification actions
      if (actionIdentifier && actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
        handleNotificationAction(actionIdentifier, data);
      }
    });

    return () => responseListener.remove();
  }, [handleNotificationAction]);

  const handleCenterClose = useCallback(() => {
    setShowCenter(false);
  }, []);

  const handleActionHandlerClose = useCallback(() => {
    setShowActionHandler(false);
    setSelectedNotification(null);
  }, []);

  // Expose methods to show notification center
  const showNotificationCenter = useCallback(() => {
    setShowCenter(true);
  }, []);

  // Add global notification center trigger (can be called from anywhere)
  useEffect(() => {
    // You can expose this globally if needed
    (global as { showNotificationCenter?: () => void }).showNotificationCenter = showNotificationCenter;
    
    return () => {
      delete (global as { showNotificationCenter?: () => void }).showNotificationCenter;
    };
  }, [showNotificationCenter]);

  return (
    <>
      {children}
      
      {/* Notification Toast */}
      <NotificationToast
        notification={currentToast}
        onDismiss={handleToastDismiss}
        onPress={handleToastPress}
        duration={5000}
      />
      
      {/* Notification Center */}
      <NotificationCenter
        visible={showCenter}
        onClose={handleCenterClose}
      />
      
      {/* Notification Action Handler */}
      <NotificationActionHandler
        notification={selectedNotification}
        visible={showActionHandler}
        onClose={handleActionHandlerClose}
      />
    </>
  );
};

export default NotificationManager;