import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { secureStorage } from '@/utils/storage';
import { STORAGE_KEYS } from '@/config/constants';

export interface NotificationPreferences {
  enabled: boolean;
  shareNotifications: boolean;
  collaborationNotifications: boolean;
  uploadNotifications: boolean;
  systemNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
  };
}

export interface PushNotificationData {
  type: 'file_shared' | 'document_updated' | 'upload_complete' | 'system_alert' | 'collaboration_invite';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  priority?: 'low' | 'normal' | 'high';
  silent?: boolean;
}

export interface NotificationToken {
  token: string;
  deviceId: string;
  platform: 'ios' | 'android';
  createdAt: Date;
  lastUpdated: Date;
}

class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;
  private pushToken: string | null = null;
  private preferences: NotificationPreferences = {
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
  };

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize the notification service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load preferences from storage
      await this.loadPreferences();

      // Configure notification handler
      await this.configureNotificationHandler();

      // Setup notification categories
      await this.setupNotificationCategories();

      // Request permissions and register for push notifications
      await this.requestPermissions();

      // Register for push notifications if permissions granted
      if (this.preferences.enabled) {
        await this.registerForPushNotifications();
      }

      this.isInitialized = true;
      // Notification service initialized successfully
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      throw error;
    }
  }

  /**
   * Configure notification handler behavior
   */
  private async configureNotificationHandler(): Promise<void> {
    await Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const data = notification.request.content.data;
        const isQuietHours = this.isQuietHours();
        const isSilent = data?.silent === true;

        return {
          shouldShowAlert: !isSilent,
          shouldPlaySound: this.preferences.soundEnabled && !isQuietHours && !isSilent,
          shouldSetBadge: true,
          shouldShowBanner: !isSilent,
          shouldShowList: !isSilent,
        };
      },
    });
  }

  /**
   * Setup notification categories with actions
   */
  private async setupNotificationCategories(): Promise<void> {
    try {
      // File sharing notifications
      await Notifications.setNotificationCategoryAsync('file_shared', [
        {
          identifier: 'view_file',
          buttonTitle: 'View File',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'dismiss',
          buttonTitle: 'Dismiss',
          options: { opensAppToForeground: false },
        },
      ]);

      // Document collaboration notifications
      await Notifications.setNotificationCategoryAsync('document_updated', [
        {
          identifier: 'open_document',
          buttonTitle: 'Open Document',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'view_changes',
          buttonTitle: 'View Changes',
          options: { opensAppToForeground: true },
        },
      ]);

      // Upload completion notifications
      await Notifications.setNotificationCategoryAsync('upload_complete', [
        {
          identifier: 'view_files',
          buttonTitle: 'View Files',
          options: { opensAppToForeground: true },
        },
      ]);

      // System notifications
      await Notifications.setNotificationCategoryAsync('system_alert', [
        {
          identifier: 'open_app',
          buttonTitle: 'Open App',
          options: { opensAppToForeground: true },
        },
      ]);

      // Collaboration invite notifications
      await Notifications.setNotificationCategoryAsync('collaboration_invite', [
        {
          identifier: 'accept_invite',
          buttonTitle: 'Accept',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'decline_invite',
          buttonTitle: 'Decline',
          options: { opensAppToForeground: false },
        },
      ]);
    } catch (error) {
      console.error('Failed to setup notification categories:', error);
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        this.preferences.enabled = false;
        await this.savePreferences();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  /**
   * Register for push notifications and get token
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return null;
      }

      // Get push notification token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      this.pushToken = tokenData.data;

      // Store token information
      const tokenInfo: NotificationToken = {
        token: this.pushToken,
        deviceId: Constants.deviceId || 'unknown',
        platform: Platform.OS as 'ios' | 'android',
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      await secureStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, JSON.stringify(tokenInfo));

      // Configure platform-specific settings
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        await Notifications.setNotificationChannelAsync('file_sharing', {
          name: 'File Sharing',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4A90E2',
        });

        await Notifications.setNotificationChannelAsync('collaboration', {
          name: 'Collaboration',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#7ED321',
        });

        await Notifications.setNotificationChannelAsync('uploads', {
          name: 'Uploads',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250],
          lightColor: '#F5A623',
        });
      }

      // Push notification token registered
      return this.pushToken;
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
      return null;
    }
  }

  /**
   * Send local notification
   */
  async sendLocalNotification(notificationData: PushNotificationData): Promise<void> {
    try {
      if (!this.preferences.enabled) return;

      // Check if notification type is enabled
      if (!this.isNotificationTypeEnabled(notificationData.type)) return;

      // Check quiet hours
      if (this.isQuietHours() && notificationData.priority !== 'high') return;

      const channelId = this.getChannelId(notificationData.type);
      const categoryIdentifier = this.getCategoryIdentifier(notificationData.type);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: {
            type: notificationData.type,
            actionUrl: notificationData.actionUrl,
            ...notificationData.data,
          },
          categoryIdentifier,
          sound: this.preferences.soundEnabled && !notificationData.silent ? 'default' : false,
          ...(Platform.OS === 'android' && { channelId }),
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to send local notification:', error);
    }
  }

  /**
   * Schedule notification for later delivery
   */
  async scheduleNotification(
    notificationData: PushNotificationData,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string> {
    try {
      if (!this.preferences.enabled) throw new Error('Notifications are disabled');

      const channelId = this.getChannelId(notificationData.type);
      const categoryIdentifier = this.getCategoryIdentifier(notificationData.type);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: {
            type: notificationData.type,
            actionUrl: notificationData.actionUrl,
            ...notificationData.data,
          },
          categoryIdentifier,
          sound: this.preferences.soundEnabled && !notificationData.silent ? 'default' : false,
          ...(Platform.OS === 'android' && { channelId }),
        },
        trigger,
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      throw error;
    }
  }

  /**
   * Cancel scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  /**
   * Get all presented notifications
   */
  async getPresentedNotifications(): Promise<Notifications.Notification[]> {
    try {
      return await Notifications.getPresentedNotificationsAsync();
    } catch (error) {
      console.error('Failed to get presented notifications:', error);
      return [];
    }
  }

  /**
   * Dismiss notification
   */
  async dismissNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.dismissNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  }

  /**
   * Dismiss all notifications
   */
  async dismissAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Failed to dismiss all notifications:', error);
    }
  }

  /**
   * Handle notification response (when user interacts with notification)
   */
  handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { notification, actionIdentifier } = response;
    const data = notification.request.content.data;

    // Handle notification response

    // Handle different action types
    switch (actionIdentifier) {
      case 'view_file':
        this.navigateToFile(data.fileId as string);
        break;
      case 'open_document':
        this.navigateToDocument(data.documentId as string);
        break;
      case 'view_changes':
        this.navigateToDocumentHistory(data.documentId as string);
        break;
      case 'view_files':
        this.navigateToFiles();
        break;
      case 'accept_invite':
        this.handleCollaborationInvite(data.inviteId as string, true);
        break;
      case 'decline_invite':
        this.handleCollaborationInvite(data.inviteId as string, false);
        break;
      case 'open_app':
        this.navigateToApp();
        break;
      default:
        // Handle default tap action
        if (data.actionUrl && typeof data.actionUrl === 'string') {
          this.navigateToUrl(data.actionUrl);
        } else {
          this.navigateToApp();
        }
        break;
    }
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.pushToken;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    this.preferences = { ...this.preferences, ...preferences };
    await this.savePreferences();

    // Re-register for push notifications if enabled status changed
    if (preferences.enabled !== undefined) {
      if (preferences.enabled && !this.pushToken) {
        await this.registerForPushNotifications();
      }
    }
  }

  /**
   * Get current preferences
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Load preferences from storage
   */
  private async loadPreferences(): Promise<void> {
    try {
      const stored = await secureStorage.getItem(STORAGE_KEYS.NOTIFICATION_PREFERENCES);
      if (stored) {
        const preferences = JSON.parse(stored);
        this.preferences = { ...this.preferences, ...preferences };
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  }

  /**
   * Save preferences to storage
   */
  private async savePreferences(): Promise<void> {
    try {
      await secureStorage.setItem(
        STORAGE_KEYS.NOTIFICATION_PREFERENCES,
        JSON.stringify(this.preferences)
      );
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }

  /**
   * Check if it's currently quiet hours
   */
  private isQuietHours(): boolean {
    if (!this.preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const { startTime, endTime } = this.preferences.quietHours;
    
    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }
    
    // Handle same-day quiet hours (e.g., 12:00 to 14:00)
    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Check if notification type is enabled
   */
  private isNotificationTypeEnabled(type: PushNotificationData['type']): boolean {
    switch (type) {
      case 'file_shared':
        return this.preferences.shareNotifications;
      case 'document_updated':
      case 'collaboration_invite':
        return this.preferences.collaborationNotifications;
      case 'upload_complete':
        return this.preferences.uploadNotifications;
      case 'system_alert':
        return this.preferences.systemNotifications;
      default:
        return true;
    }
  }

  /**
   * Get channel ID for notification type (Android)
   */
  private getChannelId(type: PushNotificationData['type']): string {
    switch (type) {
      case 'file_shared':
        return 'file_sharing';
      case 'document_updated':
      case 'collaboration_invite':
        return 'collaboration';
      case 'upload_complete':
        return 'uploads';
      default:
        return 'default';
    }
  }

  /**
   * Get category identifier for notification type
   */
  private getCategoryIdentifier(type: PushNotificationData['type']): string {
    return type;
  }

  // Navigation helper methods (to be implemented based on app's navigation structure)
  private navigateToFile(_fileId: string): void {
    // TODO: Implement navigation to file
  }

  private navigateToDocument(_documentId: string): void {
    // TODO: Implement navigation to document
  }

  private navigateToDocumentHistory(_documentId: string): void {
    // TODO: Implement navigation to document history
  }

  private navigateToFiles(): void {
    // TODO: Implement navigation to files screen
  }

  private navigateToApp(): void {
    // TODO: Implement navigation to main app
  }

  private navigateToUrl(_url: string): void {
    // TODO: Implement navigation to specific URL
    // console.log('Navigate to URL:', url);
  }

  private handleCollaborationInvite(_inviteId: string, _accept: boolean): void {
    // TODO: Implement collaboration invite handling
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.isInitialized = false;
    this.pushToken = null;
  }
}

export const notificationService = NotificationService.getInstance();
export default notificationService;