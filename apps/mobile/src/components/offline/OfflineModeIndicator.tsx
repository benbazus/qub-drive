import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsOnline, useWorkQueueStatus, useOfflineEditingActions } from '../../stores/offline/offlineEditingStore';

interface OfflineModeIndicatorProps {
  style?: object;
  showDetails?: boolean;
  onPress?: () => void;
}

const OfflineModeIndicator: React.FC<OfflineModeIndicatorProps> = ({
  style,
  showDetails = false,
  onPress
}) => {
  const isOnline = useIsOnline();
  const workQueueStatus = useWorkQueueStatus();
  const { syncPendingEdits } = useOfflineEditingActions();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (!isOnline && workQueueStatus.pendingEdits > 0) {
      // Try to sync when tapped in offline mode
      syncPendingEdits().catch(console.error);
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return '#FF3B30'; // Red for offline
    if (workQueueStatus.pendingEdits > 0) return '#FF9500'; // Orange for pending edits
    if (workQueueStatus.isProcessing) return '#007AFF'; // Blue for syncing
    return '#4CAF50'; // Green for online and synced
  };

  const getStatusText = () => {
    if (!isOnline) {
      if (workQueueStatus.pendingEdits > 0) {
        return `Offline • ${workQueueStatus.pendingEdits} pending`;
      }
      return 'Offline';
    }
    
    if (workQueueStatus.isProcessing) {
      return 'Syncing...';
    }
    
    if (workQueueStatus.pendingEdits > 0) {
      return `${workQueueStatus.pendingEdits} pending`;
    }
    
    if (workQueueStatus.failedEdits > 0) {
      return `${workQueueStatus.failedEdits} failed`;
    }
    
    return 'Online';
  };

  const getStatusIcon = () => {
    if (!isOnline) return 'cloud-offline-outline';
    if (workQueueStatus.isProcessing) return 'sync-outline';
    if (workQueueStatus.pendingEdits > 0) return 'cloud-upload-outline';
    if (workQueueStatus.failedEdits > 0) return 'warning-outline';
    return 'cloud-done-outline';
  };

  const shouldShowIndicator = () => {
    // Always show if offline
    if (!isOnline) return true;
    
    // Show if there are pending or failed edits
    if (workQueueStatus.pendingEdits > 0 || workQueueStatus.failedEdits > 0) return true;
    
    // Show if currently syncing
    if (workQueueStatus.isProcessing) return true;
    
    // Don't show if everything is synced and online
    return false;
  };

  if (!shouldShowIndicator()) {
    return null;
  }

  const statusColor = getStatusColor();
  const statusText = getStatusText();
  const statusIcon = getStatusIcon();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: statusColor }, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {workQueueStatus.isProcessing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name={statusIcon as keyof typeof Ionicons.glyphMap} size={16} color="white" />
          )}
        </View>
        
        <Text style={styles.statusText}>{statusText}</Text>
        
        {showDetails && workQueueStatus.lastSyncAttempt && (
          <Text style={styles.detailText}>
            Last sync: {formatLastSync(workQueueStatus.lastSyncAttempt)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const formatLastSync = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 min ago';
  if (minutes < 60) return `${minutes} mins ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  
  return date.toLocaleDateString();
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  detailText: {
    color: 'white',
    fontSize: 10,
    opacity: 0.8,
    marginLeft: 8,
  },
});

export default OfflineModeIndicator;