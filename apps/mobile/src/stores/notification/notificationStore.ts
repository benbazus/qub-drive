import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { notificationService, NotificationPreferences, PushNotificationData } from '@/services/notificationService';

export interface NotificationState {
  isInitialized: boolean;
  pushToken: string | null;
  preferences: NotificationPreferences;
  unreadCount: number;
  notifications: NotificationItem[];
  isLoading: boolean;
  error: string | null;
}

export interface NotificationItem {
  id: string;
  type: PushNotificationData['type'];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface NotificationActions {
  initialize: () => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  sendLocalNotification: (notification: PushNotificationData) => Promise<void>;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'createdAt'>) => void;
  refreshPushToken: () => Promise<string | null>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

const initialState: NotificationState = {
  isInitialized: false,
  pushToken: null,
  preferences: {
    enabled: true,
    shareNotifications: true,
    collaborationNotifications: true,
    uploadNotifications: true,
    systemNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
    },
  },
  unreadCount: 0,
  notifications: [],
  isLoading: false,
  error: null,
};

export const useNotificationStore = create<NotificationState & NotificationActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    initialize: async () => {
      try {
        set({ isLoading: true, error: null });

        // Initialize notification service
        await notificationService.initialize();

        // Get current preferences and push token
        const preferences = notificationService.getPreferences();
        const pushToken = notificationService.getPushToken();

        set({
          isInitialized: true,
          preferences,
          pushToken,
          isLoading: false,
        });

        // Notification store initialized successfully
      } catch (error) {
        console.error('Failed to initialize notification store:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to initialize notifications',
          isLoading: false,
        });
      }
    },

    updatePreferences: async (newPreferences: Partial<NotificationPreferences>) => {
      try {
        set({ isLoading: true, error: null });

        // Update preferences in service
        await notificationService.updatePreferences(newPreferences);

        // Get updated preferences
        const preferences = notificationService.getPreferences();
        const pushToken = notificationService.getPushToken();

        set({
          preferences,
          pushToken,
          isLoading: false,
        });
      } catch (error) {
        console.error('Failed to update notification preferences:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to update preferences',
          isLoading: false,
        });
      }
    },

    sendLocalNotification: async (notification: PushNotificationData) => {
      try {
        await notificationService.sendLocalNotification(notification);

        // Add to local notification history
        get().addNotification({
          type: notification.type,
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          actionUrl: notification.actionUrl || '',
          isRead: false,
        });
      } catch (error) {
        console.error('Failed to send local notification:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to send notification',
        });
      }
    },

    addNotification: (notification: Omit<NotificationItem, 'id' | 'createdAt'>) => {
      const newNotification: NotificationItem = {
        ...notification,
        id: `notification_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        createdAt: new Date(),
      };

      set((state) => ({
        notifications: [newNotification, ...state.notifications].slice(0, 100), // Keep only last 100
        unreadCount: state.unreadCount + (newNotification.isRead ? 0 : 1),
      }));
    },

    markAsRead: (notificationId: string) => {
      set((state) => {
        const notifications = state.notifications.map((notification) => {
          if (notification.id === notificationId && !notification.isRead) {
            return { ...notification, isRead: true };
          }
          return notification;
        });

        const unreadCount = notifications.filter((n) => !n.isRead).length;

        return { notifications, unreadCount };
      });
    },

    markAllAsRead: () => {
      set((state) => ({
        notifications: state.notifications.map((notification) => ({
          ...notification,
          isRead: true,
        })),
        unreadCount: 0,
      }));
    },

    removeNotification: (notificationId: string) => {
      set((state) => {
        const notifications = state.notifications.filter((n) => n.id !== notificationId);
        const unreadCount = notifications.filter((n) => !n.isRead).length;
        return { notifications, unreadCount };
      });
    },

    clearAllNotifications: () => {
      set({
        notifications: [],
        unreadCount: 0,
      });

      // Also clear system notifications
      notificationService.dismissAllNotifications();
    },

    refreshPushToken: async () => {
      try {
        const pushToken = await notificationService.registerForPushNotifications();
        set({ pushToken });
        return pushToken;
      } catch (error) {
        console.error('Failed to refresh push token:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to refresh push token',
        });
        return null;
      }
    },

    setError: (error: string | null) => {
      set({ error });
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },
  }))
);

// Selectors for easier access to specific state
export const useNotificationPreferences = () => useNotificationStore((state) => state.preferences);
export const useUnreadNotificationCount = () => useNotificationStore((state) => state.unreadCount);
export const useNotifications = () => useNotificationStore((state) => state.notifications);
export const usePushToken = () => useNotificationStore((state) => state.pushToken);
export const useNotificationLoading = () => useNotificationStore((state) => state.isLoading);
export const useNotificationError = () => useNotificationStore((state) => state.error);