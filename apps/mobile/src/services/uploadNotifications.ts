import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { UploadQueueItem } from "./uploadManager";
import { secureStorage } from "@/utils/storage";
import { STORAGE_KEYS } from "@/config/constants";

export interface UploadNotificationOptions {
  enableStartNotifications?: boolean;
  enableProgressNotifications?: boolean;
  enableCompletionNotifications?: boolean;
  enableFailureNotifications?: boolean;
  enableBatchNotifications?: boolean;
  progressNotificationInterval?: number; // in seconds
}

interface NotificationPreferences {
  enabled: boolean;
  options: UploadNotificationOptions;
}

class UploadNotificationService {
  private static instance: UploadNotificationService;
  private isInitialized = false;
  private preferences: NotificationPreferences = {
    enabled: true,
    options: {
      enableStartNotifications: true,
      enableProgressNotifications: false, // Disabled by default to avoid spam
      enableCompletionNotifications: true,
      enableFailureNotifications: true,
      enableBatchNotifications: true,
      progressNotificationInterval: 30, // 30 seconds
    },
  };
  private progressNotificationTimers = new Map<string, NodeJS.Timeout>();

  private constructor() {}

  static getInstance(): UploadNotificationService {
    if (!UploadNotificationService.instance) {
      UploadNotificationService.instance = new UploadNotificationService();
    }
    return UploadNotificationService.instance;
  }

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load preferences from storage
      await this.loadPreferences();

      // Request notification permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.warn("Notification permissions not granted");
        this.preferences.enabled = false;
        return;
      }

      // Configure notification behavior
      await Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
          const isUploadNotification =
            notification.request.content.data?.type?.startsWith("upload");

          return {
            shouldShowAlert: true,
            shouldPlaySound: isUploadNotification ? false : true, // Quiet for upload notifications
            shouldSetBadge: false,
          };
        },
      });

      // Configure notification categories for interactive notifications
      await this.setupNotificationCategories();

      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize upload notifications:", error);
    }
  }

  /**
   * Setup notification categories with actions
   */
  private async setupNotificationCategories(): Promise<void> {
    try {
      await Notifications.setNotificationCategoryAsync("upload_progress", [
        {
          identifier: "view_progress",
          buttonTitle: "View Progress",
          options: { opensAppToForeground: true },
        },
        {
          identifier: "pause_all",
          buttonTitle: "Pause All",
          options: { opensAppToForeground: false },
        },
      ]);

      await Notifications.setNotificationCategoryAsync("upload_failed", [
        {
          identifier: "retry",
          buttonTitle: "Retry",
          options: { opensAppToForeground: true },
        },
        {
          identifier: "view_details",
          buttonTitle: "View Details",
          options: { opensAppToForeground: true },
        },
      ]);

      await Notifications.setNotificationCategoryAsync("upload_complete", [
        {
          identifier: "view_files",
          buttonTitle: "View Files",
          options: { opensAppToForeground: true },
        },
      ]);
    } catch (error) {
      console.error("Failed to setup notification categories:", error);
    }
  }

  /**
   * Show upload started notification
   */
  async notifyUploadStarted(item: UploadQueueItem): Promise<void> {
    if (!this.shouldShowNotification("enableStartNotifications")) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Upload Started",
          body: `Uploading ${item.fileName}...`,
          data: {
            type: "upload_started",
            uploadId: item.id,
            fileName: item.fileName,
          },
          sound: false,
        },
        trigger: null,
      });

      // Schedule progress notifications if enabled
      if (this.preferences.options.enableProgressNotifications) {
        this.scheduleProgressNotifications(item);
      }
    } catch (error) {
      console.error("Failed to show upload started notification:", error);
    }
  }

  /**
   * Show upload progress notification
   */
  async notifyUploadProgress(item: UploadQueueItem): Promise<void> {
    if (!this.shouldShowNotification("enableProgressNotifications")) return;

    try {
      const progress = Math.round(item.progress.progress);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Uploading ${item.fileName}`,
          body: `${progress}% complete`,
          data: {
            type: "upload_progress",
            uploadId: item.id,
            fileName: item.fileName,
            progress,
          },
          categoryIdentifier: "upload_progress",
          sound: false,
        },
        trigger: null,
      });
    } catch (error) {
      console.error("Failed to show upload progress notification:", error);
    }
  }

  /**
   * Show upload completed notification
   */
  async notifyUploadCompleted(item: UploadQueueItem): Promise<void> {
    if (!this.shouldShowNotification("enableCompletionNotifications")) return;

    try {
      // Clear any progress notification timers
      this.clearProgressNotifications(item.id);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Upload Complete",
          body: `${item.fileName} uploaded successfully`,
          data: {
            type: "upload_completed",
            uploadId: item.id,
            fileName: item.fileName,
            fileId: item.result?.id,
          },
          categoryIdentifier: "upload_complete",
          sound: Platform.OS === "ios" ? "default" : undefined,
        },
        trigger: null,
      });

      // Add to upload history
      await this.addToHistory(item, "completed");
    } catch (error) {
      console.error("Failed to show upload completed notification:", error);
    }
  }

  /**
   * Show upload failed notification
   */
  async notifyUploadFailed(
    item: UploadQueueItem,
    error: string
  ): Promise<void> {
    if (!this.shouldShowNotification("enableFailureNotifications")) return;

    try {
      // Clear any progress notification timers
      this.clearProgressNotifications(item.id);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Upload Failed",
          body: `Failed to upload ${item.fileName}`,
          data: {
            type: "upload_failed",
            uploadId: item.id,
            fileName: item.fileName,
            error,
          },
          categoryIdentifier: "upload_failed",
          sound: Platform.OS === "ios" ? "default" : undefined,
        },
        trigger: null,
      });

      // Add to upload history
      await this.addToHistory(item, "failed", error);
    } catch (error) {
      console.error("Failed to show upload failed notification:", error);
    }
  }

  /**
   * Show batch upload notification
   */
  async notifyBatchUploadStatus(
    completed: number,
    failed: number,
    total: number
  ): Promise<void> {
    if (!this.shouldShowNotification("enableBatchNotifications") || total <= 1)
      return;

    try {
      let title: string;
      let body: string;

      if (failed === 0) {
        title = "All Uploads Complete";
        body = `Successfully uploaded ${completed} file${
          completed > 1 ? "s" : ""
        }`;
      } else if (completed === 0) {
        title = "All Uploads Failed";
        body = `Failed to upload ${failed} file${failed > 1 ? "s" : ""}`;
      } else {
        title = "Uploads Complete";
        body = `${completed} successful, ${failed} failed out of ${total} files`;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: "batch_upload_complete",
            completed,
            failed,
            total,
          },
          categoryIdentifier: "upload_complete",
          sound: Platform.OS === "ios" ? "default" : undefined,
        },
        trigger: null,
      });
    } catch (error) {
      console.error("Failed to show batch upload notification:", error);
    }
  }

  /**
   * Schedule periodic progress notifications
   */
  private scheduleProgressNotifications(item: UploadQueueItem): void {
    const interval =
      (this.preferences.options.progressNotificationInterval || 30) * 1000;

    const timer = setInterval(() => {
      // Check if upload is still active
      if (item.status === "uploading" && item.progress.progress < 100) {
        this.notifyUploadProgress(item);
      } else {
        this.clearProgressNotifications(item.id);
      }
    }, interval);

    this.progressNotificationTimers.set(item.id, timer);
  }

  /**
   * Clear progress notification timers
   */
  private clearProgressNotifications(uploadId: string): void {
    const timer = this.progressNotificationTimers.get(uploadId);
    if (timer) {
      clearInterval(timer);
      this.progressNotificationTimers.delete(uploadId);
    }
  }

  /**
   * Add upload to history
   */
  private async addToHistory(
    item: UploadQueueItem,
    status: "completed" | "failed",
    error?: string
  ): Promise<void> {
    try {
      const historyItem = {
        id: item.id,
        fileName: item.fileName,
        size: item.size,
        uploadedAt: new Date(),
        status,
        error,
        result: item.result,
      };

      // Load existing history
      const existingHistory = await secureStorage.getItem(
        STORAGE_KEYS.UPLOAD_HISTORY
      );
      const history = existingHistory ? JSON.parse(existingHistory) : [];

      // Add new item and limit to 100 items
      history.unshift(historyItem);
      const limitedHistory = history.slice(0, 100);

      // Save back to storage
      await secureStorage.setItem(
        STORAGE_KEYS.UPLOAD_HISTORY,
        JSON.stringify(limitedHistory)
      );
    } catch (error) {
      console.error("Failed to add upload to history:", error);
    }
  }

  /**
   * Load notification preferences from storage
   */
  private async loadPreferences(): Promise<void> {
    try {
      const stored = await secureStorage.getItem(
        STORAGE_KEYS.NOTIFICATION_PREFERENCES
      );
      if (stored) {
        const preferences = JSON.parse(stored);
        this.preferences = { ...this.preferences, ...preferences };
      }
    } catch (error) {
      console.error("Failed to load notification preferences:", error);
    }
  }

  /**
   * Save notification preferences to storage
   */
  async savePreferences(): Promise<void> {
    try {
      await secureStorage.setItem(
        STORAGE_KEYS.NOTIFICATION_PREFERENCES,
        JSON.stringify(this.preferences)
      );
    } catch (error) {
      console.error("Failed to save notification preferences:", error);
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    options: Partial<UploadNotificationOptions>
  ): Promise<void> {
    this.preferences.options = { ...this.preferences.options, ...options };
    await this.savePreferences();
  }

  /**
   * Enable/disable notifications
   */
  async setNotificationsEnabled(enabled: boolean): Promise<void> {
    this.preferences.enabled = enabled;
    await this.savePreferences();
  }

  /**
   * Get current notification preferences
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Check if specific notification type should be shown
   */
  private shouldShowNotification(
    type: keyof UploadNotificationOptions
  ): boolean {
    return (
      this.isInitialized &&
      this.preferences.enabled &&
      (this.preferences.options[type] ?? false)
    );
  }

  /**
   * Clear all upload notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      const notifications =
        await Notifications.getAllPresentedNotificationsAsync();
      const uploadNotifications = notifications.filter((n) =>
        n.request.content.data?.type?.startsWith("upload")
      );

      for (const notification of uploadNotifications) {
        await Notifications.dismissNotificationAsync(
          notification.request.identifier
        );
      }
    } catch (error) {
      console.error("Failed to clear upload notifications:", error);
    }
  }

  /**
   * Handle notification response (when user taps notification)
   */
  handleNotificationResponse(
    response: Notifications.NotificationResponse
  ): void {
    const { notification, actionIdentifier } = response;
    const data = notification.request.content.data;

    if (!data?.type?.startsWith("upload")) return;

    switch (actionIdentifier) {
      case "view_progress":
        // Navigate to upload progress screen
        break;
      case "pause_all":
        // Pause all uploads
        break;
      case "retry":
        // Retry failed upload
        break;
      case "view_details":
        // Navigate to upload details
        break;
      case "view_files":
        // Navigate to files screen
        break;
      default:
        // Default tap action - navigate to relevant screen
        break;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Clear all progress notification timers
    for (const timer of this.progressNotificationTimers.values()) {
      clearInterval(timer);
    }
    this.progressNotificationTimers.clear();
  }
}

export const uploadNotifications = UploadNotificationService.getInstance();
export default uploadNotifications;
