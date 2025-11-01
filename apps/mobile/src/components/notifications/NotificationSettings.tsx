import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationPreferences } from '@/services/notificationService';

interface NotificationSettingsProps {
  onClose?: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
  const { preferences, updatePreferences, isLoading, testNotification } = useNotifications();
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences>(preferences);

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...localPreferences, [key]: value };
    setLocalPreferences(newPreferences);
    updatePreferences({ [key]: value });
  };

  const handleQuietHoursToggle = (enabled: boolean) => {
    const newQuietHours = { ...localPreferences.quietHours, enabled };
    const newPreferences = { ...localPreferences, quietHours: newQuietHours };
    setLocalPreferences(newPreferences);
    updatePreferences({ quietHours: newQuietHours });
  };

  const handleTimeChange = (type: 'startTime' | 'endTime', time: string) => {
    const newQuietHours = { ...localPreferences.quietHours, [type]: time };
    const newPreferences = { ...localPreferences, quietHours: newQuietHours };
    setLocalPreferences(newPreferences);
    updatePreferences({ quietHours: newQuietHours });
  };

  const handleTestNotification = () => {
    Alert.alert(
      'Test Notification',
      'Choose a notification type to test:',
      [
        { text: 'File Shared', onPress: () => testNotification('file_shared') },
        { text: 'Document Updated', onPress: () => testNotification('document_updated') },
        { text: 'Upload Complete', onPress: () => testNotification('upload_complete') },
        { text: 'System Alert', onPress: () => testNotification('system_alert') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const SettingRow: React.FC<{
    title: string;
    description?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
  }> = ({ title, description, value, onValueChange, disabled = false }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, disabled && styles.disabledText]}>{title}</Text>
        {description && (
          <Text style={[styles.settingDescription, disabled && styles.disabledText]}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || isLoading}
        trackColor={{ false: '#767577', true: '#4A90E2' }}
        thumbColor={value ? '#ffffff' : '#f4f3f4'}
      />
    </View>
  );

  const TimePickerRow: React.FC<{
    title: string;
    time: string;
    onTimeChange: (time: string) => void;
    disabled?: boolean;
  }> = ({ title, time, onTimeChange, disabled = false }) => (
    <TouchableOpacity
      style={[styles.settingRow, disabled && styles.disabledRow]}
      onPress={() => {
        if (disabled) return;
        // TODO: Implement time picker
        Alert.alert('Time Picker', 'Time picker not implemented yet');
      }}
      disabled={disabled}
    >
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, disabled && styles.disabledText]}>{title}</Text>
      </View>
      <View style={styles.timeContainer}>
        <Text style={[styles.timeText, disabled && styles.disabledText]}>{time}</Text>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={disabled ? '#999' : '#666'}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Notification Settings</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>
        
        <SettingRow
          title="Enable Notifications"
          description="Allow the app to send push notifications"
          value={localPreferences.enabled}
          onValueChange={(value) => handleToggle('enabled', value)}
        />

        <SettingRow
          title="Sound"
          description="Play sound for notifications"
          value={localPreferences.soundEnabled}
          onValueChange={(value) => handleToggle('soundEnabled', value)}
          disabled={!localPreferences.enabled}
        />

        <SettingRow
          title="Vibration"
          description="Vibrate for notifications"
          value={localPreferences.vibrationEnabled}
          onValueChange={(value) => handleToggle('vibrationEnabled', value)}
          disabled={!localPreferences.enabled}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Types</Text>
        
        <SettingRow
          title="File Sharing"
          description="When files are shared with you"
          value={localPreferences.shareNotifications}
          onValueChange={(value) => handleToggle('shareNotifications', value)}
          disabled={!localPreferences.enabled}
        />

        <SettingRow
          title="Collaboration"
          description="Document updates and collaboration invites"
          value={localPreferences.collaborationNotifications}
          onValueChange={(value) => handleToggle('collaborationNotifications', value)}
          disabled={!localPreferences.enabled}
        />

        <SettingRow
          title="Uploads"
          description="Upload progress and completion"
          value={localPreferences.uploadNotifications}
          onValueChange={(value) => handleToggle('uploadNotifications', value)}
          disabled={!localPreferences.enabled}
        />

        <SettingRow
          title="System Alerts"
          description="Important system notifications"
          value={localPreferences.systemNotifications}
          onValueChange={(value) => handleToggle('systemNotifications', value)}
          disabled={!localPreferences.enabled}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quiet Hours</Text>
        
        <SettingRow
          title="Enable Quiet Hours"
          description="Silence notifications during specified hours"
          value={localPreferences.quietHours.enabled}
          onValueChange={handleQuietHoursToggle}
          disabled={!localPreferences.enabled}
        />

        <TimePickerRow
          title="Start Time"
          time={localPreferences.quietHours.startTime}
          onTimeChange={(time) => handleTimeChange('startTime', time)}
          disabled={!localPreferences.enabled || !localPreferences.quietHours.enabled}
        />

        <TimePickerRow
          title="End Time"
          time={localPreferences.quietHours.endTime}
          onTimeChange={(time) => handleTimeChange('endTime', time)}
          disabled={!localPreferences.enabled || !localPreferences.quietHours.enabled}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Testing</Text>
        
        <TouchableOpacity
          style={[styles.testButton, (!localPreferences.enabled || isLoading) && styles.disabledButton]}
          onPress={handleTestNotification}
          disabled={!localPreferences.enabled || isLoading}
        >
          <Ionicons name="notifications-outline" size={20} color="#4A90E2" />
          <Text style={[styles.testButtonText, (!localPreferences.enabled || isLoading) && styles.disabledText]}>
            Send Test Notification
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Notifications help you stay updated with file sharing, collaboration, and important system alerts.
        </Text>
      </View>
    </ScrollView>
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
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 20,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e5e9',
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  disabledRow: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#999',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    color: '#4A90E2',
    marginRight: 8,
    fontWeight: '500',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginVertical: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A90E2',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
  },
  footer: {
    padding: 20,
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationSettings;