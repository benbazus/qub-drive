import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { NotificationItem } from '@/stores/notification';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationAction {
  id: string;
  title: string;
  icon: string;
  style?: 'default' | 'destructive' | 'primary';
  handler: (notification: NotificationItem) => void | Promise<void>;
}

interface NotificationActionHandlerProps {
  notification: NotificationItem | null;
  visible: boolean;
  onClose: () => void;
}

export const NotificationActionHandler: React.FC<NotificationActionHandlerProps> = ({
  notification,
  visible,
  onClose,
}) => {
  const router = useRouter();
  const { markAsRead, removeNotification } = useNotifications();

  const handleCollaborationInvite = useCallback(async (notification: NotificationItem, accept: boolean) => {
    try {
      if (accept) {
        // Navigate to collaboration screen
        router.push('/collaboration' as '/collaboration');
        Alert.alert('Success', 'Collaboration invite accepted!');
      } else {
        Alert.alert('Declined', 'Collaboration invite declined.');
      }
      
      // Mark as read and remove
      markAsRead(notification.id);
      removeNotification(notification.id);
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to handle collaboration invite');
    }
  }, [router, markAsRead, removeNotification, onClose]);

  const handleFileShare = useCallback(async (notification: NotificationItem) => {
    try {
      if (notification.data?.fileId) {
        router.push(`/file/${notification.data.fileId}` as '/file/[id]');
      } else {
        router.push('/(tabs)/files');
      }
      
      markAsRead(notification.id);
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to open file');
    }
  }, [router, markAsRead, onClose]);

  const handleDocumentUpdate = useCallback(async (notification: NotificationItem) => {
    try {
      if (notification.data?.documentId) {
        router.push(`/document/${notification.data.documentId}` as '/document/[id]');
      } else {
        router.push('/(tabs)');
      }
      
      markAsRead(notification.id);
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to open document');
    }
  }, [router, markAsRead, onClose]);

  const handleUploadComplete = useCallback(async (notification: NotificationItem) => {
    try {
      router.push('/(tabs)/files');
      markAsRead(notification.id);
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to navigate to files');
    }
  }, [router, markAsRead, onClose]);

  const handleSystemAlert = useCallback(async (notification: NotificationItem) => {
    try {
      if (notification.actionUrl) {
        // Handle custom action URL
        router.push(notification.actionUrl as any);
      } else {
        router.push('/(tabs)');
      }
      
      markAsRead(notification.id);
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to handle system alert');
    }
  }, [router, markAsRead, onClose]);

  const getActionsForNotification = useCallback((notification: NotificationItem): NotificationAction[] => {
    const commonActions: NotificationAction[] = [
      {
        id: 'mark_read',
        title: notification.isRead ? 'Mark as Unread' : 'Mark as Read',
        icon: notification.isRead ? 'mail-outline' : 'mail-open-outline',
        handler: (notif) => {
          markAsRead(notif.id);
          onClose();
        },
      },
      {
        id: 'remove',
        title: 'Remove',
        icon: 'trash-outline',
        style: 'destructive' as const,
        handler: (notif) => {
          removeNotification(notif.id);
          onClose();
        },
      },
    ];

    switch (notification.type) {
      case 'file_shared':
        return [
          {
            id: 'view_file',
            title: 'View File',
            icon: 'document-outline',
            style: 'primary' as const,
            handler: handleFileShare,
          },
          {
            id: 'open_folder',
            title: 'Open Folder',
            icon: 'folder-outline',
            handler: () => {
              router.push('/(tabs)/files');
              markAsRead(notification.id);
              onClose();
            },
          },
          ...commonActions,
        ];

      case 'document_updated':
        return [
          {
            id: 'open_document',
            title: 'Open Document',
            icon: 'document-text-outline',
            style: 'primary' as const,
            handler: handleDocumentUpdate,
          },
          {
            id: 'view_changes',
            title: 'View Changes',
            icon: 'git-compare-outline',
            handler: (notif) => {
              if (notif.data?.documentId) {
                router.push(`/document/${notif.data.documentId}?view=history` as any);
              }
              markAsRead(notif.id);
              onClose();
            },
          },
          ...commonActions,
        ];

      case 'collaboration_invite':
        return [
          {
            id: 'accept_invite',
            title: 'Accept Invite',
            icon: 'checkmark-circle-outline',
            style: 'primary' as const,
            handler: (notif) => handleCollaborationInvite(notif, true),
          },
          {
            id: 'decline_invite',
            title: 'Decline Invite',
            icon: 'close-circle-outline',
            style: 'destructive' as const,
            handler: (notif) => handleCollaborationInvite(notif, false),
          },
          ...commonActions,
        ];

      case 'upload_complete':
        return [
          {
            id: 'view_files',
            title: 'View Files',
            icon: 'folder-open-outline',
            style: 'primary' as const,
            handler: handleUploadComplete,
          },
          {
            id: 'upload_more',
            title: 'Upload More',
            icon: 'cloud-upload-outline',
            handler: () => {
              router.push('/upload' as '/upload');
              markAsRead(notification.id);
              onClose();
            },
          },
          ...commonActions,
        ];

      case 'system_alert':
        return [
          {
            id: 'view_details',
            title: 'View Details',
            icon: 'information-circle-outline',
            style: 'primary' as const,
            handler: handleSystemAlert,
          },
          ...commonActions,
        ];

      default:
        return commonActions;
    }
  }, [
    markAsRead,
    removeNotification,
    onClose,
    router,
    handleFileShare,
    handleDocumentUpdate,
    handleCollaborationInvite,
    handleUploadComplete,
    handleSystemAlert,
  ]);

  const handleActionPress = useCallback(async (action: NotificationAction) => {
    if (!notification) return;

    try {
      await action.handler(notification);
    } catch (error) {
      console.error('Failed to handle notification action:', error);
      Alert.alert('Error', 'Failed to perform action');
    }
  }, [notification]);

  if (!notification || !visible) {
    return null;
  }

  const actions = getActionsForNotification(notification);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={styles.container}>
          {/* Notification Preview */}
          <View style={styles.notificationPreview}>
            <View style={styles.previewHeader}>
              <Ionicons
                name={getNotificationIcon(notification.type) as any}
                size={20}
                color={getNotificationColor(notification.type)}
              />
              <Text style={styles.previewTitle} numberOfLines={1}>
                {notification.title}
              </Text>
            </View>
            <Text style={styles.previewBody} numberOfLines={2}>
              {notification.body}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {actions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.actionButton,
                  action.style === 'primary' && styles.primaryAction,
                  action.style === 'destructive' && styles.destructiveAction,
                ]}
                onPress={() => handleActionPress(action)}
              >
                <Ionicons
                  name={action.icon as unknown}
                  size={20}
                  color={
                    action.style === 'primary'
                      ? '#ffffff'
                      : action.style === 'destructive'
                      ? '#F44336'
                      : '#4A90E2'
                  }
                />
                <Text
                  style={[
                    styles.actionText,
                    action.style === 'primary' && styles.primaryActionText,
                    action.style === 'destructive' && styles.destructiveActionText,
                  ]}
                >
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel Button */}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  function getNotificationIcon(type: NotificationItem['type']): string {
    switch (type) {
      case 'file_shared':
        return 'share-outline';
      case 'document_updated':
        return 'document-text-outline';
      case 'collaboration_invite':
        return 'people-outline';
      case 'upload_complete':
        return 'cloud-upload-outline';
      case 'system_alert':
        return 'alert-circle-outline';
      default:
        return 'notifications-outline';
    }
  }

  function getNotificationColor(type: NotificationItem['type']): string {
    switch (type) {
      case 'file_shared':
        return '#4A90E2';
      case 'document_updated':
        return '#7ED321';
      case 'collaboration_invite':
        return '#9013FE';
      case 'upload_complete':
        return '#F5A623';
      case 'system_alert':
        return '#F44336';
      default:
        return '#666';
    }
  }
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  notificationPreview: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
    flex: 1,
  },
  previewBody: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#f0f7ff',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  primaryAction: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  destructiveAction: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A90E2',
    marginLeft: 12,
  },
  primaryActionText: {
    color: '#ffffff',
  },
  destructiveActionText: {
    color: '#F44336',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
});

export default NotificationActionHandler;