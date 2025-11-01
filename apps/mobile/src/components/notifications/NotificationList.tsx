import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from '@/stores/notification';

interface NotificationListProps {
  onNotificationPress?: (notification: NotificationItem) => void;
  showActions?: boolean;
  maxItems?: number;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  onNotificationPress,
  showActions = true,
  maxItems,
}) => {
  const router = useRouter();
  const {
    notifications,
    isLoading,
    markAsRead,
    removeNotification,
    clearAllNotifications,
    syncNotificationHistory,
  } = useNotifications();

  const displayNotifications = maxItems ? notifications.slice(0, maxItems) : notifications;

  const handleNotificationPress = useCallback((notification: NotificationItem) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    if (onNotificationPress) {
      onNotificationPress(notification);
      return;
    }

    // Default navigation behavior
    if (notification.actionUrl) {
      router.push(notification.actionUrl as any);
    } else {
      // Handle specific notification types
      switch (notification.type) {
        case 'file_shared':
          if (notification.data?.fileId) {
            router.push(`/file/${notification.data.fileId}`);
          }
          break;
        case 'document_updated':
          if (notification.data?.documentId) {
            router.push(`/document/${notification.data.documentId}`);
          }
          break;
        case 'collaboration_invite':
          if (notification.data?.inviteId) {
            router.push(`/collaboration/invite/${notification.data.inviteId}`);
          }
          break;
        case 'upload_complete':
          router.push('/(tabs)/files');
          break;
        default:
          router.push('/(tabs)');
          break;
      }
    }
  }, [markAsRead, onNotificationPress, router]);

  const handleLongPress = useCallback((notification: NotificationItem) => {
    if (!showActions) return;

    Alert.alert(
      'Notification Options',
      notification.title,
      [
        {
          text: notification.isRead ? 'Mark as Unread' : 'Mark as Read',
          onPress: () => {
            // TODO: Implement mark as unread functionality
            if (!notification.isRead) {
              markAsRead(notification.id);
            }
          },
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeNotification(notification.id),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [showActions, markAsRead, removeNotification]);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: clearAllNotifications,
        },
      ]
    );
  }, [clearAllNotifications]);

  const getNotificationIcon = (type: NotificationItem['type']): string => {
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
  };

  const getNotificationColor = (type: NotificationItem['type']): string => {
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
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  const renderNotification = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => handleLongPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={getNotificationIcon(item.type) as any}
            size={24}
            color={getNotificationColor(item.type)}
          />
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, !item.isRead && styles.unreadTitle]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.body} numberOfLines={3}>
            {item.body}
          </Text>
          <Text style={styles.time}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyText}>
        You'll see notifications about file sharing, collaboration, and system updates here.
      </Text>
    </View>
  );

  const renderHeader = () => {
    if (!showActions || displayNotifications.length === 0) return null;

    return (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {displayNotifications.length} Notification{displayNotifications.length !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={displayNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={syncNotificationHistory}
            tintColor="#4A90E2"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={displayNotifications.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  notificationItem: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
    marginTop: 2,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4A90E2',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
    lineHeight: 20,
  },
  unreadTitle: {
    fontWeight: '600',
  },
  body: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  time: {
    fontSize: 12,
    color: '#999',
    fontWeight: '400',
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default NotificationList;