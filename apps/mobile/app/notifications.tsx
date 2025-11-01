import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { NotificationList } from '@/components/notifications/NotificationList';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from '@/stores/notification';

export default function NotificationsScreen() {
  const router = useRouter();
  const { 
    notifications, 
    unreadCount, 
    markAllAsRead, 
    clearAllNotifications,
    syncNotificationHistory 
  } = useNotifications();
  
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'unread'>('all');

  const filteredNotifications = selectedTab === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const handleNotificationPress = useCallback((notification: NotificationItem) => {
    // Handle notification tap - navigate to relevant screen
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
  }, [router]);

  const handleMarkAllAsRead = useCallback(() => {
    if (unreadCount === 0) return;
    
    Alert.alert(
      'Mark All as Read',
      `Mark all ${unreadCount} notifications as read?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Mark All Read', 
          onPress: markAllAsRead 
        },
      ]
    );
  }, [unreadCount, markAllAsRead]);

  const handleClearAll = useCallback(() => {
    if (notifications.length === 0) return;
    
    Alert.alert(
      'Clear All Notifications',
      'This will permanently delete all notifications. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: clearAllNotifications 
        },
      ]
    );
  }, [notifications.length, clearAllNotifications]);

  const handleRefresh = useCallback(() => {
    syncNotificationHistory();
  }, [syncNotificationHistory]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        
        <Text style={styles.title}>Notifications</Text>
        
        <TouchableOpacity 
          onPress={() => setShowSettings(true)} 
          style={styles.settingsButton}
        >
          <Ionicons name="settings-outline" size={24} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.activeTab]}
          onPress={() => setSelectedTab('all')}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && styles.activeTabText]}>
            All ({notifications.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'unread' && styles.activeTab]}
          onPress={() => setSelectedTab('unread')}
        >
          <Text style={[styles.tabText, selectedTab === 'unread' && styles.activeTabText]}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Bar */}
      {notifications.length > 0 && (
        <View style={styles.actionBar}>
          <TouchableOpacity 
            onPress={handleRefresh} 
            style={styles.actionButton}
          >
            <Ionicons name="refresh-outline" size={18} color="#4A90E2" />
            <Text style={styles.actionButtonText}>Refresh</Text>
          </TouchableOpacity>
          
          {unreadCount > 0 && (
            <TouchableOpacity 
              onPress={handleMarkAllAsRead} 
              style={styles.actionButton}
            >
              <Ionicons name="checkmark-done-outline" size={18} color="#4A90E2" />
              <Text style={styles.actionButtonText}>Mark All Read</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            onPress={handleClearAll} 
            style={[styles.actionButton, styles.destructiveButton]}
          >
            <Ionicons name="trash-outline" size={18} color="#F44336" />
            <Text style={[styles.actionButtonText, styles.destructiveText]}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notification List */}
      <View style={styles.listContainer}>
        <NotificationList
          onNotificationPress={handleNotificationPress}
          showActions={true}
        />
        {/* Display filtered count */}
        {filteredNotifications.length !== notifications.length && (
          <Text style={{ textAlign: 'center', color: '#666', padding: 10 }}>
            Showing {filteredNotifications.length} of {notifications.length} notifications
          </Text>
        )}
      </View>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <NotificationSettings onClose={() => setShowSettings(false)} />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  settingsButton: {
    padding: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4A90E2',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f0f7ff',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A90E2',
    marginLeft: 4,
  },
  destructiveButton: {
    backgroundColor: '#fef2f2',
  },
  destructiveText: {
    color: '#F44336',
  },
  listContainer: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});