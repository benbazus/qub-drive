import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  usePendingEdits,
  useWorkQueueStatus,
  useIsOnline,
  useOfflineEditingActions,
} from '../../stores/offline/offlineEditingStore';
import { OfflineEdit } from '../../services/offlineEditingService';

interface OfflineWorkQueueManagerProps {
  visible: boolean;
  onClose: () => void;
}

const OfflineWorkQueueManager: React.FC<OfflineWorkQueueManagerProps> = ({
  visible,
  onClose,
}) => {
  const pendingEdits = usePendingEdits();
  const workQueueStatus = useWorkQueueStatus();
  const isOnline = useIsOnline();
  const {
    syncPendingEdits,
    clearOfflineEdits,
    refreshPendingEdits,
    refreshWorkQueueStatus,
  } = useOfflineEditingActions();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      refreshPendingEdits();
      refreshWorkQueueStatus();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSyncAll = async () => {
    if (!isOnline) {
      Alert.alert(
        'No Internet Connection',
        'Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await syncPendingEdits();
      Alert.alert('Success', 'All pending edits have been synced.');
    } catch (error) {
      Alert.alert(
        'Sync Failed',
        'Some edits could not be synced. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Edits',
      'Are you sure you want to clear all pending edits? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear edits for each unique file
              const uniqueFileIds = [...new Set(pendingEdits.map(edit => edit.fileId))];
              for (const fileId of uniqueFileIds) {
                await clearOfflineEdits(fileId);
              }
              Alert.alert('Success', 'All pending edits have been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear all edits.');
            }
          },
        },
      ]
    );
  };

  const handleClearFileEdits = (fileId: string) => {
    const fileEdits = pendingEdits.filter(edit => edit.fileId === fileId);
    const fileName = fileEdits[0]?.fileId || 'Unknown file';

    Alert.alert(
      'Clear File Edits',
      `Are you sure you want to clear all pending edits for ${fileName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearOfflineEdits(fileId);
              Alert.alert('Success', 'File edits have been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear file edits.');
            }
          },
        },
      ]
    );
  };

  const renderEditItem = ({ item }: { item: OfflineEdit }) => {
    const getEditTypeIcon = () => {
      switch (item.editType) {
        case 'content': return 'document-text-outline';
        case 'title': return 'text-outline';
        case 'cell': return 'grid-outline';
        case 'formula': return 'calculator-outline';
        default: return 'create-outline';
      }
    };

    const getStatusColor = () => {
      switch (item.syncStatus) {
        case 'pending': return '#FF9500';
        case 'syncing': return '#007AFF';
        case 'synced': return '#4CAF50';
        case 'failed': return '#FF3B30';
        default: return '#8E8E93';
      }
    };

    const getStatusText = () => {
      switch (item.syncStatus) {
        case 'pending': return 'Pending';
        case 'syncing': return 'Syncing';
        case 'synced': return 'Synced';
        case 'failed': return `Failed (${item.retryCount} retries)`;
        default: return 'Unknown';
      }
    };

    return (
      <View style={styles.editItem}>
        <View style={styles.editHeader}>
          <View style={styles.editInfo}>
            <Ionicons
              name={getEditTypeIcon() as any}
              size={20}
              color="#666"
              style={styles.editIcon}
            />
            <View style={styles.editDetails}>
              <Text style={styles.editTitle}>
                {item.fileType === 'document' ? 'Document' : 'Spreadsheet'} • {item.editType}
              </Text>
              <Text style={styles.editSubtitle}>
                {item.fileId} • {formatTimestamp(item.timestamp)}
              </Text>
              {item.data.cellRef && (
                <Text style={styles.editSubtitle}>Cell: {item.data.cellRef}</Text>
              )}
            </View>
          </View>
          
          <View style={styles.editStatus}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor() }
              ]}
            />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>

        {item.error && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color="#FF3B30" />
            <Text style={styles.errorText}>{item.error}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.title}>Offline Work Queue</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{workQueueStatus.totalEdits}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#FF9500' }]}>
            {workQueueStatus.pendingEdits}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#FF3B30' }]}>
            {workQueueStatus.failedEdits}
          </Text>
          <Text style={styles.statLabel}>Failed</Text>
        </View>
      </View>

      {workQueueStatus.lastSyncAttempt && (
        <Text style={styles.lastSync}>
          Last sync attempt: {formatTimestamp(workQueueStatus.lastSyncAttempt)}
        </Text>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.syncButton,
            (!isOnline || workQueueStatus.isProcessing) && styles.disabledButton
          ]}
          onPress={handleSyncAll}
          disabled={!isOnline || workQueueStatus.isProcessing}
        >
          <Ionicons
            name={workQueueStatus.isProcessing ? "sync" : "cloud-upload-outline"}
            size={16}
            color="white"
          />
          <Text style={styles.actionButtonText}>
            {workQueueStatus.isProcessing ? 'Syncing...' : 'Sync All'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.clearButton]}
          onPress={handleClearAll}
          disabled={workQueueStatus.isProcessing}
        >
          <Ionicons name="trash-outline" size={16} color="white" />
          <Text style={styles.actionButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="checkmark-circle-outline" size={64} color="#4CAF50" />
      <Text style={styles.emptyTitle}>All Caught Up!</Text>
      <Text style={styles.emptySubtitle}>
        No pending edits in the work queue.
      </Text>
    </View>
  );

  // Group edits by file
  const groupedEdits = pendingEdits.reduce((groups, edit) => {
    if (!groups[edit.fileId]) {
      groups[edit.fileId] = [];
    }
    groups[edit.fileId].push(edit);
    return groups;
  }, {} as Record<string, OfflineEdit[]>);

  const renderFileGroup = ({ item }: { item: [string, OfflineEdit[]] }) => {
    const [fileId, edits] = item;
    const sortedEdits = edits.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return (
      <View style={styles.fileGroup}>
        <View style={styles.fileHeader}>
          <Text style={styles.fileName}>{fileId}</Text>
          <TouchableOpacity
            style={styles.clearFileButton}
            onPress={() => handleClearFileEdits(fileId)}
          >
            <Ionicons name="trash-outline" size={16} color="#FF3B30" />
          </TouchableOpacity>
        </View>
        {sortedEdits.map((edit, index) => (
          <View key={edit.id}>
            {renderEditItem({ item: edit })}
            {index < sortedEdits.length - 1 && <View style={styles.editSeparator} />}
          </View>
        ))}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        
        {pendingEdits.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={Object.entries(groupedEdits)}
            renderItem={renderFileGroup}
            keyExtractor={([fileId]) => fileId}
            style={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const formatTimestamp = (date: Date): string => {
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
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  lastSync: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  syncButton: {
    backgroundColor: '#007AFF',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  fileGroup: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  clearFileButton: {
    padding: 4,
  },
  editItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  editInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  editIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  editDetails: {
    flex: 1,
  },
  editTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  editSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  editStatus: {
    alignItems: 'flex-end',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f8d7da',
    backgroundColor: '#f8d7da',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#721c24',
    marginLeft: 8,
    flex: 1,
  },
  editSeparator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default OfflineWorkQueueManager;