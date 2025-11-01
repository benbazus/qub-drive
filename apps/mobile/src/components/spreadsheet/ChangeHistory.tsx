import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { SpreadsheetChangeHistory } from '@/types/spreadsheetCollaboration';
import { Colors } from '@/constants/theme';

interface ChangeHistoryProps {
  history: SpreadsheetChangeHistory[];
  visible: boolean;
  onClose: () => void;
  onUndo?: (historyId: string) => void;
  onRedo?: (historyId: string) => void;
}

export const ChangeHistory: React.FC<ChangeHistoryProps> = ({
  history,
  visible,
  onClose,
  onUndo,
  onRedo,
}) => {
  const [selectedEntry, setSelectedEntry] = useState<SpreadsheetChangeHistory | null>(null);

  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return timestamp.toLocaleDateString();
  };

  const getOperationIcon = (operation: SpreadsheetChangeHistory['operation']) => {
    switch (operation.type) {
      case 'cell_update':
        return '✏️';
      case 'cell_format':
        return '🎨';
      case 'range_update':
        return '📊';
      case 'sheet_add':
        return '➕';
      case 'sheet_delete':
        return '🗑️';
      case 'sheet_rename':
        return '📝';
      default:
        return '📄';
    }
  };

  const renderHistoryItem = ({ item }: { item: SpreadsheetChangeHistory }) => (
    <TouchableOpacity
      style={[
        styles.historyItem,
        selectedEntry?.id === item.id && styles.selectedHistoryItem,
      ]}
      onPress={() => setSelectedEntry(selectedEntry?.id === item.id ? null : item)}
    >
      <View style={styles.historyItemHeader}>
        <View style={styles.operationInfo}>
          <Text style={styles.operationIcon}>{getOperationIcon(item.operation)}</Text>
          <View style={styles.operationDetails}>
            <Text style={styles.operationDescription} numberOfLines={2}>
              {item.description}
            </Text>
            <Text style={styles.operationMeta}>
              by {item.userName} • {formatTimestamp(item.timestamp)}
            </Text>
          </View>
        </View>
        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>v{item.version}</Text>
        </View>
      </View>

      {selectedEntry?.id === item.id && (
        <View style={styles.historyItemDetails}>
          <View style={styles.operationData}>
            <Text style={styles.operationDataTitle}>Operation Details:</Text>
            <Text style={styles.operationDataText}>
              Type: {item.operation.type}
            </Text>
            {item.operation.cellRef && (
              <Text style={styles.operationDataText}>
                Cell: {item.operation.cellRef}
              </Text>
            )}
            <Text style={styles.operationDataText}>
              Sheet: {item.operation.sheetId}
            </Text>
            <Text style={styles.operationDataText}>
              Timestamp: {item.timestamp.toLocaleString()}
            </Text>
          </View>

          <View style={styles.actionButtons}>
            {item.canUndo && onUndo && (
              <TouchableOpacity
                style={[styles.actionButton, styles.undoButton]}
                onPress={() => onUndo(item.id)}
              >
                <Text style={styles.actionButtonText}>Undo</Text>
              </TouchableOpacity>
            )}
            {item.canRedo && onRedo && (
              <TouchableOpacity
                style={[styles.actionButton, styles.redoButton]}
                onPress={() => onRedo(item.id)}
              >
                <Text style={styles.actionButtonText}>Redo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Change History</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Done</Text>
          </TouchableOpacity>
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📝</Text>
            <Text style={styles.emptyStateTitle}>No Changes Yet</Text>
            <Text style={styles.emptyStateDescription}>
              Changes to this spreadsheet will appear here
            </Text>
          </View>
        ) : (
          <FlatList
            data={history.slice().reverse()} // Show most recent first
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id}
            style={styles.historyList}
            contentContainerStyle={styles.historyListContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeButtonText: {
    fontSize: 16,
    color: Colors.light.tint,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  historyList: {
    flex: 1,
  },
  historyListContent: {
    paddingVertical: 8,
  },
  historyItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedHistoryItem: {
    borderColor: Colors.light.tint,
    backgroundColor: '#f8f9ff',
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  operationInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  operationIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  operationDetails: {
    flex: 1,
  },
  operationDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
  },
  operationMeta: {
    fontSize: 12,
    color: '#666',
  },
  versionBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  versionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  historyItemDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  operationData: {
    marginBottom: 12,
  },
  operationDataTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 6,
  },
  operationDataText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  undoButton: {
    backgroundColor: '#ff6b6b',
  },
  redoButton: {
    backgroundColor: '#4ecdc4',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ChangeHistory;