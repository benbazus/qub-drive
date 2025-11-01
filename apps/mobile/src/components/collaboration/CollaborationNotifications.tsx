import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ShareNotification } from '@/types/sharing';
import { useThemeColor } from '@/hooks/use-theme-color';
import { sharingService } from '@/services/sharingService';

interface CollaborationNotificationsProps {
  visible: boolean;
  onClose: () => void;
  onNotificationPress?: (notification: ShareNotification) => void;
}

interface NotificationItemProps {
  notification: ShareNotification;
  onPress: (notification: ShareNotification) => void;
  onMarkRead: (notificationId: string) => void;
  onDelete: (notificationId: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onMarkRead,
  onDelete,
}) => {
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  const [slideAnim] = useState(new Animated.Value(0));
  const [showActions, setShowActions] = useState(false);

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'share_received':
        return 'share';
      case 'share_accessed':
        return 'eye';
      case 'permission_changed':
        return 'settings';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = () => {
    switch (notification.type) {
      case 'share_received':
        return '#4CAF50';
      case 'share_accessed':
        return '#2196F3';
      case 'permission_changed':
        return '#FF9500';
      default:
        return tintColor;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    if (diffMinutes < 10080) return `${Math.floor(diffMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationMessage = () => {
    const fromName = notification.fromUserName || notification.fromUserEmail;
    
    switch (notification.type) {
      case 'share_received':
        return `${fromName} shared "${notification.fileName}" with you`;
      case 'share_accessed':
        return `${fromName} accessed "${notification.fileName}"`;
      case 'permission_changed':
        return `Your permissions for "${notification.fileName}" were updated`;
      default:
        return notification.message || 'New notification';
    }
  };

  const handleLongPress = () => {
    setShowActions(!showActions);
    Animated.timing(slideAnim, {
      toValue: showActions ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleMarkRead = () => {
    onMarkRead?.(notification.id);
    setShowActions(false);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete?.(notification.id);
            setShowActions(false);
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }).start();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.notificationContainer}>
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !notification.isRead && styles.unreadNotification,
          { backgroundColor: !notification.isRead ? `${tintColor}0A` : 'transparent' }
        ]}
        onPress={() => onPress?.(notification)}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
      >
        <View style={[styles.notificationIcon, { backgroundColor: `${getNotificationColor()}26` }]}>
          <Ionicons
            name={getNotificationIcon()}
            size={20}
            color={getNotificationColor()}
          />
        </View>
        
        <View style={styles.notificationContent}>
          <Text
            style={[
              styles.notificationMessage,
              { color: textColor },
              !notification.isRead && styles.unreadText
            ]}
            numberOfLines={2}
          >
            {getNotificationMessage()}
          </Text>
          
          <View style={styles.notificationMeta}>
            <Text style={[styles.notificationTime, { color: iconColor }]}>
              {formatTime(notification.timestamp)}
            </Text>
            {!notification.isRead && (
              <View style={[styles.unreadDot, { backgroundColor: tintColor }]} />
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Action Buttons */}
      <Animated.View
        style={[
          styles.actionButtons,
          {
            height: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 50],
            }),
            opacity: slideAnim,
          },
        ]}
      >
        {!notification.isRead && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: `${tintColor}26` }]}
            onPress={handleMarkRead}
          >
            <Ionicons name="checkmark" size={16} color={tintColor} />
            <Text style={[styles.actionButtonText, { color: tintColor }]}>
              Mark Read
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#F4433626' }]}
          onPress={handleDelete}
        >
          <Ionicons name="trash" size={16} color="#F44336" />
          <Text style={[styles.actionButtonText, { color: '#F44336' }]}>
            Delete
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export const CollaborationNotifications: React.FC<CollaborationNotificationsProps> = ({
  visible,
  onClose,
  onNotificationPress,
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  const [notifications, setNotifications] = useState<ShareNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadNotifications = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const notificationData = await sharingService.getNotifications();
      setNotifications(notificationData);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible, loadNotifications]);

  const handleMarkRead = async (notificationId: string) => {
    try {
      await sharingService.markNotificationRead(notificationId);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await sharingService.deleteNotification(notificationId);
      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await sharingService.markAllNotificationsRead();
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await sharingService.clearAllNotifications();
              setNotifications([]);
            } catch (error) {
              console.error('Failed to clear notifications:', error);
            }
          },
        },
      ]
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: `${iconColor}33` }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={iconColor} />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={[styles.title, { color: textColor }]}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: tintColor }]}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity
            onPress={handleMarkAllRead}
            style={styles.markAllButton}
            disabled={unreadCount === 0}
          >
            <Text style={[
              styles.markAllButtonText,
              { color: unreadCount > 0 ? tintColor : iconColor }
            ]}>
              Mark All
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tintColor} />
            <Text style={[styles.loadingText, { color: textColor }]}>
              Loading notifications...
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => loadNotifications(true)}
                tintColor={tintColor}
              />
            }
          >
            {notifications.length > 0 ? (
              <>
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onPress={onNotificationPress || (() => {})}
                    onMarkRead={handleMarkRead}
                    onDelete={handleDeleteNotification}
                  />
                ))}
                
                {/* Clear All Button */}
                <TouchableOpacity
                  style={[styles.clearAllButton, { borderColor: `${iconColor}33` }]}
                  onPress={handleClearAll}
                >
                  <Ionicons name="trash-outline" size={16} color="#F44336" />
                  <Text style={[styles.clearAllButtonText, { color: '#F44336' }]}>
                    Clear All Notifications
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-outline" size={48} color={`${iconColor}66`} />
                <Text style={[styles.emptyText, { color: textColor }]}>
                  No notifications
                </Text>
                <Text style={[styles.emptySubtext, { color: iconColor }]}>
                  You'll see collaboration updates here
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  unreadBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  markAllButton: {
    padding: 8,
  },
  markAllButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  notificationContainer: {
    overflow: 'hidden',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#00000033',
  },
  unreadNotification: {
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: '500',
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationTime: {
    fontSize: 12,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  clearAllButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});