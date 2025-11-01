import { notificationService, PushNotificationData } from '@/services/notificationService';

/**
 * Helper functions for sending specific types of notifications
 */

export interface FileSharedNotificationData {
  fileId: string;
  fileName: string;
  sharedBy: string;
  shareType: 'view' | 'edit' | 'admin';
}

export interface DocumentUpdatedNotificationData {
  documentId: string;
  documentTitle: string;
  updatedBy: string;
  changeType: 'content' | 'title' | 'permissions';
  changeDescription?: string;
}

export interface CollaborationInviteNotificationData {
  inviteId: string;
  documentId: string;
  documentTitle: string;
  invitedBy: string;
  role: 'viewer' | 'editor' | 'admin';
}

export interface UploadCompleteNotificationData {
  uploadId: string;
  fileName: string;
  fileSize: number;
  uploadDuration: number;
}

export interface SystemAlertNotificationData {
  alertType: 'maintenance' | 'security' | 'feature' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  actionRequired?: boolean;
  actionUrl?: string;
}

/**
 * Send file shared notification
 */
export const sendFileSharedNotification = async (data: FileSharedNotificationData): Promise<void> => {
  const notification: PushNotificationData = {
    type: 'file_shared',
    title: 'File Shared',
    body: `${data.sharedBy} shared "${data.fileName}" with you`,
    data: {
      fileId: data.fileId,
      fileName: data.fileName,
      sharedBy: data.sharedBy,
      shareType: data.shareType,
    },
    actionUrl: `/file/${data.fileId}`,
    priority: 'normal',
  };

  await notificationService.sendLocalNotification(notification);
};

/**
 * Send document updated notification
 */
export const sendDocumentUpdatedNotification = async (data: DocumentUpdatedNotificationData): Promise<void> => {
  let bodyText = `${data.updatedBy} updated "${data.documentTitle}"`;
  
  if (data.changeDescription) {
    bodyText += ` - ${data.changeDescription}`;
  }

  const notification: PushNotificationData = {
    type: 'document_updated',
    title: 'Document Updated',
    body: bodyText,
    data: {
      documentId: data.documentId,
      documentTitle: data.documentTitle,
      updatedBy: data.updatedBy,
      changeType: data.changeType,
      changeDescription: data.changeDescription,
    },
    actionUrl: `/document/${data.documentId}`,
    priority: 'normal',
  };

  await notificationService.sendLocalNotification(notification);
};

/**
 * Send collaboration invite notification
 */
export const sendCollaborationInviteNotification = async (data: CollaborationInviteNotificationData): Promise<void> => {
  const notification: PushNotificationData = {
    type: 'collaboration_invite',
    title: 'Collaboration Invite',
    body: `${data.invitedBy} invited you to collaborate on "${data.documentTitle}" as ${data.role}`,
    data: {
      inviteId: data.inviteId,
      documentId: data.documentId,
      documentTitle: data.documentTitle,
      invitedBy: data.invitedBy,
      role: data.role,
    },
    actionUrl: `/collaboration/invite/${data.inviteId}`,
    priority: 'high',
  };

  await notificationService.sendLocalNotification(notification);
};

/**
 * Send upload complete notification
 */
export const sendUploadCompleteNotification = async (data: UploadCompleteNotificationData): Promise<void> => {
  const fileSizeText = formatFileSize(data.fileSize);
  const durationText = formatDuration(data.uploadDuration);

  const notification: PushNotificationData = {
    type: 'upload_complete',
    title: 'Upload Complete',
    body: `"${data.fileName}" (${fileSizeText}) uploaded successfully in ${durationText}`,
    data: {
      uploadId: data.uploadId,
      fileName: data.fileName,
      fileSize: data.fileSize,
      uploadDuration: data.uploadDuration,
    },
    actionUrl: '/(tabs)/files',
    priority: 'low',
  };

  await notificationService.sendLocalNotification(notification);
};

/**
 * Send system alert notification
 */
export const sendSystemAlertNotification = async (
  title: string,
  body: string,
  data: SystemAlertNotificationData
): Promise<void> => {
  const notification: PushNotificationData = {
    type: 'system_alert',
    title,
    body,
    data: {
      alertType: data.alertType,
      severity: data.severity,
      actionRequired: data.actionRequired,
    },
    actionUrl: data.actionUrl,
    priority: data.severity === 'critical' || data.severity === 'high' ? 'high' : 'normal',
  };

  await notificationService.sendLocalNotification(notification);
};

/**
 * Send batch upload complete notification
 */
export const sendBatchUploadCompleteNotification = async (
  completedCount: number,
  failedCount: number,
  totalCount: number
): Promise<void> => {
  let title: string;
  let body: string;
  let priority: 'low' | 'normal' | 'high' = 'low';

  if (failedCount === 0) {
    title = 'All Uploads Complete';
    body = `Successfully uploaded ${completedCount} file${completedCount > 1 ? 's' : ''}`;
  } else if (completedCount === 0) {
    title = 'Upload Failed';
    body = `Failed to upload ${failedCount} file${failedCount > 1 ? 's' : ''}`;
    priority = 'normal';
  } else {
    title = 'Uploads Complete';
    body = `${completedCount} successful, ${failedCount} failed out of ${totalCount} files`;
    priority = 'normal';
  }

  const notification: PushNotificationData = {
    type: 'upload_complete',
    title,
    body,
    data: {
      batchUpload: true,
      completedCount,
      failedCount,
      totalCount,
    },
    actionUrl: '/(tabs)/files',
    priority,
  };

  await notificationService.sendLocalNotification(notification);
};

/**
 * Schedule a reminder notification
 */
export const scheduleReminderNotification = async (
  title: string,
  body: string,
  triggerDate: Date,
  data?: Record<string, any>
): Promise<string> => {
  const notification: PushNotificationData = {
    type: 'system_alert',
    title,
    body,
    data: {
      reminder: true,
      ...data,
    },
    priority: 'normal',
  };

  const trigger = {
    date: triggerDate,
  };

  return await notificationService.scheduleNotification(notification, trigger);
};

/**
 * Send maintenance notification
 */
export const sendMaintenanceNotification = async (
  startTime: Date,
  duration: number,
  description?: string
): Promise<void> => {
  const startTimeText = startTime.toLocaleString();
  const durationText = formatDuration(duration);
  
  let body = `Scheduled maintenance from ${startTimeText} for ${durationText}`;
  if (description) {
    body += `. ${description}`;
  }

  await sendSystemAlertNotification(
    'Scheduled Maintenance',
    body,
    {
      alertType: 'maintenance',
      severity: 'medium',
      actionRequired: false,
    }
  );
};

/**
 * Send security alert notification
 */
export const sendSecurityAlertNotification = async (
  alertType: string,
  description: string,
  actionRequired: boolean = true,
  actionUrl?: string
): Promise<void> => {
  await sendSystemAlertNotification(
    'Security Alert',
    `${alertType}: ${description}`,
    {
      alertType: 'security',
      severity: 'high',
      actionRequired,
      actionUrl,
    }
  );
};

/**
 * Utility functions
 */

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Notification testing helpers
 */
export const sendTestNotifications = async (): Promise<void> => {
  // Test file shared notification
  await sendFileSharedNotification({
    fileId: 'test-file-1',
    fileName: 'Test Document.pdf',
    sharedBy: 'John Doe',
    shareType: 'edit',
  });

  // Test document updated notification
  setTimeout(async () => {
    await sendDocumentUpdatedNotification({
      documentId: 'test-doc-1',
      documentTitle: 'Project Proposal',
      updatedBy: 'Jane Smith',
      changeType: 'content',
      changeDescription: 'Added new section on budget',
    });
  }, 2000);

  // Test collaboration invite notification
  setTimeout(async () => {
    await sendCollaborationInviteNotification({
      inviteId: 'test-invite-1',
      documentId: 'test-doc-2',
      documentTitle: 'Marketing Strategy',
      invitedBy: 'Mike Johnson',
      role: 'editor',
    });
  }, 4000);

  // Test upload complete notification
  setTimeout(async () => {
    await sendUploadCompleteNotification({
      uploadId: 'test-upload-1',
      fileName: 'presentation.pptx',
      fileSize: 2048576, // 2MB
      uploadDuration: 5000, // 5 seconds
    });
  }, 6000);

  // Test system alert notification
  setTimeout(async () => {
    await sendSystemAlertNotification(
      'New Feature Available',
      'Check out the new collaborative spreadsheet editor!',
      {
        alertType: 'feature',
        severity: 'low',
        actionRequired: false,
        actionUrl: '/spreadsheet/new',
      }
    );
  }, 8000);
};