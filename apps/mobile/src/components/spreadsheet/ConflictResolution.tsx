import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {
  SpreadsheetConflict,
  SpreadsheetCellEdit,
  CellUpdateData,
} from '@/types/spreadsheetCollaboration';
import { Colors } from '@/constants/theme';

interface ConflictResolutionProps {
  conflicts: SpreadsheetConflict[];
  visible: boolean;
  onClose: () => void;
  onResolve: (conflictId: string, resolution: 'accept' | 'reject', winningEdit?: SpreadsheetCellEdit) => void;
}

export const ConflictResolution: React.FC<ConflictResolutionProps> = ({
  conflicts,
  visible,
  onClose,
  onResolve,
}) => {
  const [selectedConflict, setSelectedConflict] = useState<SpreadsheetConflict | null>(null);

  const formatCellValue = (edit: SpreadsheetCellEdit): string => {
    if (edit.operation.type === 'cell_update') {
      const data = edit.operation.data as CellUpdateData;
      if (data.formula) {
        return `=${data.formula}`;
      }
      switch (data.value.type) {
        case 'string':
          return data.value.value;
        case 'number':
          return data.value.value.toString();
        case 'boolean':
          return data.value.value ? 'TRUE' : 'FALSE';
        case 'date':
          return data.value.value.toLocaleDateString();
        case 'empty':
          return '(empty)';
        case 'error':
          return `#${data.value.value}`;
        default:
          return 'Unknown';
      }
    }
    return 'N/A';
  };

  const getConflictTypeDescription = (type: SpreadsheetConflict['conflictType']): string => {
    switch (type) {
      case 'concurrent_edit':
        return 'Multiple users edited the same cell simultaneously';
      case 'version_mismatch':
        return 'Changes were made to an outdated version';
      case 'lock_conflict':
        return 'Cell was locked by another user';
      default:
        return 'Unknown conflict type';
    }
  };

  const renderConflictItem = (conflict: SpreadsheetConflict) => (
    <TouchableOpacity
      key={conflict.id}
      style={[
        styles.conflictItem,
        selectedConflict?.id === conflict.id && styles.selectedConflictItem,
      ]}
      onPress={() => setSelectedConflict(selectedConflict?.id === conflict.id ? null : conflict)}
    >
      <View style={styles.conflictHeader}>
        <View style={styles.conflictInfo}>
          <Text style={styles.conflictTitle}>
            Cell {conflict.cellRef} Conflict
          </Text>
          <Text style={styles.conflictDescription}>
            {getConflictTypeDescription(conflict.conflictType)}
          </Text>
          <Text style={styles.conflictMeta}>
            {conflict.conflictingEdits.length} conflicting changes
          </Text>
        </View>
        <View style={[styles.conflictTypeBadge, getConflictTypeStyle(conflict.conflictType)]}>
          <Text style={styles.conflictTypeText}>
            {conflict.conflictType.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      {selectedConflict?.id === conflict.id && (
        <View style={styles.conflictDetails}>
          <Text style={styles.conflictDetailsTitle}>Conflicting Changes:</Text>
          
          {conflict.conflictingEdits.map((edit, index) => (
            <View key={edit.id} style={styles.editOption}>
              <View style={styles.editHeader}>
                <Text style={styles.editUser}>
                  Change {index + 1} by User {edit.userId}
                </Text>
                <Text style={styles.editTimestamp}>
                  {edit.timestamp.toLocaleTimeString()}
                </Text>
              </View>
              
              <View style={styles.editContent}>
                <Text style={styles.editValue}>
                  Value: {formatCellValue(edit)}
                </Text>
                {edit.operation.type === 'cell_update' && (edit.operation.data as CellUpdateData).previousValue && (
                  <Text style={styles.editPreviousValue}>
                    Previous: {formatCellValue({
                      ...edit,
                      operation: {
                        ...edit.operation,
                        data: {
                          ...edit.operation.data,
                          value: (edit.operation.data as CellUpdateData).previousValue!,
                          formula: (edit.operation.data as CellUpdateData).previousFormula,
                        }
                      }
                    })}
                  </Text>
                )}
              </View>

              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.acceptButton]}
                  onPress={() => onResolve(conflict.id, 'accept', edit)}
                >
                  <Text style={styles.actionButtonText}>Accept This</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => onResolve(conflict.id, 'reject')}
                >
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={styles.conflictActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.autoResolveButton]}
              onPress={() => {
                // Auto-resolve by accepting the most recent edit
                const mostRecentEdit = conflict.conflictingEdits.reduce((latest, current) =>
                  current.timestamp > latest.timestamp ? current : latest
                );
                onResolve(conflict.id, 'accept', mostRecentEdit);
              }}
            >
              <Text style={styles.actionButtonText}>Auto-Resolve (Most Recent)</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const getConflictTypeStyle = (type: SpreadsheetConflict['conflictType']) => {
    switch (type) {
      case 'concurrent_edit':
        return { backgroundColor: '#ff6b6b' };
      case 'version_mismatch':
        return { backgroundColor: '#ffa726' };
      case 'lock_conflict':
        return { backgroundColor: '#ab47bc' };
      default:
        return { backgroundColor: '#666' };
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Resolve Conflicts</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>

        {conflicts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>✅</Text>
            <Text style={styles.emptyStateTitle}>No Conflicts</Text>
            <Text style={styles.emptyStateDescription}>
              All changes have been successfully synchronized
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.conflictsList}
            contentContainerStyle={styles.conflictsListContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.conflictsHeader}>
              <Text style={styles.conflictsCount}>
                {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} need{conflicts.length === 1 ? 's' : ''} resolution
              </Text>
              <Text style={styles.conflictsDescription}>
                Tap on a conflict to see details and resolve it
              </Text>
            </View>

            {conflicts.map(renderConflictItem)}
          </ScrollView>
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
  conflictsList: {
    flex: 1,
  },
  conflictsListContent: {
    paddingVertical: 16,
  },
  conflictsHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  conflictsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  conflictsDescription: {
    fontSize: 14,
    color: '#666',
  },
  conflictItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedConflictItem: {
    borderColor: '#ff6b6b',
    backgroundColor: '#fff5f5',
  },
  conflictHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  conflictInfo: {
    flex: 1,
  },
  conflictTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  conflictDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  conflictMeta: {
    fontSize: 12,
    color: '#999',
  },
  conflictTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  conflictTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  conflictDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  conflictDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  editOption: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editUser: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  },
  editTimestamp: {
    fontSize: 11,
    color: '#666',
  },
  editContent: {
    marginBottom: 12,
  },
  editValue: {
    fontSize: 13,
    color: Colors.light.text,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  editPreviousValue: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    fontStyle: 'italic',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  conflictActions: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 80,
  },
  acceptButton: {
    backgroundColor: '#28a745',
  },
  rejectButton: {
    backgroundColor: '#dc3545',
  },
  autoResolveButton: {
    backgroundColor: Colors.light.tint,
    flex: 1,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ConflictResolution;