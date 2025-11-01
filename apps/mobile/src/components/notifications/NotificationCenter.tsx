import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { NotificationList } from './NotificationList';
import { NotificationBadge } from './NotificationBadge';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from '@/stores/notification';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const NOTIFICATION_CENTER_HEIGHT = SCREEN_HEIGHT * 0.7;

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  visible,
  onClose,
}) => {
  const router = useRouter();
  const { 
    notifications, 
    unreadCount, 
    markAllAsRead, 
    syncNotificationHistory 
  } = useNotifications();

  const [translateY] = useState(new Animated.Value(NOTIFICATION_CENTER_HEIGHT));
  const [selectedTab, setSelectedTab] = useState<'all' | 'unread'>('all');

  const filteredNotifications = selectedTab === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.spring(translateY, {
        toValue: NOTIFICATION_CENTER_HEIGHT,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [visible, translateY]);

  const handleNotificationPress = useCallback((notification: NotificationItem) => {
    onClose();
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'file_shared':
        if (notification.data?.fileId) {
          router.push(`/file/${notification.data.fileId}` as '/file/[id]');
        }
        break;
      case 'document_updated':
        if (notification.data?.documentId) {
          router.push(`/document/${notification.data.documentId}` as '/document/[id]');
        }
        break;
      case 'collaboration_invite':
        if (notification.data?.inviteId) {
          router.push('/collaboration' as '/collaboration');
        }
        break;
      case 'upload_complete':
        router.push('/(tabs)/files');
        break;
      default:
        router.push('/(tabs)');
        break;
    }
  }, [router, onClose]);

  const handleViewAll = useCallback(() => {
    onClose();
    router.push('/notifications' as unknown);
  }, [router, onClose]);

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true }
  );

  const handleStateChange = useCallback((event: { nativeEvent: { state: number; translationY: number; velocityY: number } }) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY, velocityY } = event.nativeEvent;
      
      if (translationY > 100 || velocityY > 500) {
        onClose();
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    }
  }, [translateY, onClose]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={onClose}
      />
      
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleStateChange}
      >
        <Animated.View 
          style={[
            styles.container,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handle} />
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Notifications</Text>
              {unreadCount > 0 && (
                <NotificationBadge 
                  size="small" 
                  maxCount={99}
                />
              )}
            </View>
            
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Tab Bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'all' && styles.activeTab]}
              onPress={() => setSelectedTab('all')}
            >
              <Text style={[styles.tabText, selectedTab === 'all' && styles.activeTabText]}>
                All
              </Text>
              {notifications.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{notifications.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'unread' && styles.activeTab]}
              onPress={() => setSelectedTab('unread')}
            >
              <Text style={[styles.tabText, selectedTab === 'unread' && styles.activeTabText]}>
                Unread
              </Text>
              {unreadCount > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          {notifications.length > 0 && (
            <View style={styles.quickActions}>
              <TouchableOpacity 
                onPress={syncNotificationHistory} 
                style={styles.quickActionButton}
              >
                <Ionicons name="refresh-outline" size={16} color="#4A90E2" />
                <Text style={styles.quickActionText}>Refresh</Text>
              </TouchableOpacity>
              
              {unreadCount > 0 && (
                <TouchableOpacity 
                  onPress={markAllAsRead} 
                  style={styles.quickActionButton}
                >
                  <Ionicons name="checkmark-done-outline" size={16} color="#4A90E2" />
                  <Text style={styles.quickActionText}>Mark All Read</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Notification List */}
          <View style={styles.listContainer}>
            <NotificationList
              onNotificationPress={handleNotificationPress}
              showActions={false}
              maxItems={10}
            />
            {/* Use filteredNotifications for display logic if needed */}
            {filteredNotifications.length === 0 && (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#666' }}>No notifications</Text>
              </View>
            )}
          </View>

          {/* Footer */}
          {notifications.length > 10 && (
            <View style={styles.footer}>
              <TouchableOpacity onPress={handleViewAll} style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All Notifications</Text>
                <Ionicons name="chevron-forward" size={16} color="#4A90E2" />
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: NOTIFICATION_CENTER_HEIGHT,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 8,
  },
  closeButton: {
    padding: 4,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f5f5f5',
  },
  activeTab: {
    backgroundColor: '#e3f2fd',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f7ff',
    marginRight: 12,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4A90E2',
    marginLeft: 4,
  },
  listContainer: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f7ff',
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A90E2',
    marginRight: 4,
  },
});

export default NotificationCenter;