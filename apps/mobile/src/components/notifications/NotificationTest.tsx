import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '@/hooks/useNotifications';
import { sendTestNotifications } from '@/utils/notificationHelpers';

export const NotificationTest: React.FC = () => {
  const { 
    isInitialized, 
    pushToken, 
    preferences, 
    unreadCount,
    sendNotification,
    testNotification 
  } = useNotifications();

  const handleTestSingleNotification = async () => {
    try {
      await sendNotification({
        type: 'system_alert',
        title: 'Test Notification',
        body: 'This is a test notification to verify the system is working correctly.',
        priority: 'normal',
      });
      Alert.alert('Success', 'Test notification sent!');
    } catch {
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const handleTestMultipleNotifications = async () => {
    try {
      await sendTestNotifications();
      Alert.alert('Success', 'Multiple test notifications sent! Check your notification center.');
    } catch {
      Alert.alert('Error', 'Failed to send test notifications');
    }
  };

  const handleTestServerNotification = async () => {
    try {
      await testNotification('system_alert');
      Alert.alert('Success', 'Server test notification sent!');
    } catch {
      Alert.alert('Error', 'Failed to send server test notification');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification System Test</Text>
      
      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Initialized:</Text>
          <View style={[styles.statusIndicator, isInitialized ? styles.success : styles.error]}>
            <Text style={styles.statusText}>{isInitialized ? 'Yes' : 'No'}</Text>
          </View>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Push Token:</Text>
          <View style={[styles.statusIndicator, pushToken ? styles.success : styles.warning]}>
            <Text style={styles.statusText}>{pushToken ? 'Available' : 'Not Available'}</Text>
          </View>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Notifications Enabled:</Text>
          <View style={[styles.statusIndicator, preferences.enabled ? styles.success : styles.error]}>
            <Text style={styles.statusText}>{preferences.enabled ? 'Yes' : 'No'}</Text>
          </View>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Unread Count:</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{unreadCount}</Text>
          </View>
        </View>
      </View>

      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>Test Notifications</Text>
        
        <TouchableOpacity 
          style={styles.testButton} 
          onPress={handleTestSingleNotification}
          disabled={!isInitialized || !preferences.enabled}
        >
          <Ionicons name="notifications-outline" size={20} color="#4A90E2" />
          <Text style={styles.testButtonText}>Send Single Test Notification</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.testButton} 
          onPress={handleTestMultipleNotifications}
          disabled={!isInitialized || !preferences.enabled}
        >
          <Ionicons name="notifications" size={20} color="#4A90E2" />
          <Text style={styles.testButtonText}>Send Multiple Test Notifications</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.testButton} 
          onPress={handleTestServerNotification}
          disabled={!isInitialized || !preferences.enabled || !pushToken}
        >
          <Ionicons name="server-outline" size={20} color="#4A90E2" />
          <Text style={styles.testButtonText}>Send Server Test Notification</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Push Token (for debugging)</Text>
        <Text style={styles.infoText} numberOfLines={3}>
          {pushToken || 'No push token available'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  success: {
    backgroundColor: '#E8F5E8',
  },
  warning: {
    backgroundColor: '#FFF3CD',
  },
  error: {
    backgroundColor: '#F8D7DA',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  countBadge: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  testSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A90E2',
    marginLeft: 8,
  },
  infoSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});

export default NotificationTest;