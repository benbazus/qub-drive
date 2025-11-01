import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DocumentConflict, DocumentOperation } from '../../types/collaboration';

interface ConflictResolutionProps {
  conflicts: DocumentConflict[];
  onResolveConflict: (conflictId: string, resolution: 'accept' | 'reject', operations?: DocumentOperation[]) => void;
  onDismiss: () => void;
  visible: boolean;
}

export const ConflictResolution: React.FC<ConflictResolutionProps> = ({
  conflicts,
  onResolveConflict,
  onDismiss,
  visible,
}) => {
  const [selectedConflict, setSelectedConflict] = useState<DocumentConflict | null>(null);
  const [selectedOperations, setSelectedOperations] = useState<Set<string>>(new Set());

  const handleResolveConflict = (conflict: DocumentConflict, resolution: 'accept' | 'reject') => {
    if (resolution === 'accept' && selectedOperations.size > 0) {
      const operations = conflict.operations.filter(op => selectedOperations.has(op.id));
      onResolveConflict(conflict.id, resolution, operations);
    } else {
      onResolveConflict(conflict.id, resolution);
    }
    
    setSelectedConflict(null);
    setSelectedOperations(new Set());
  };

  const toggleOperationSelection = (operationId: string) => {
    const newSelection = new Set(selectedOperations);
    if (newSelection.has(operationId)) {
      newSelection.delete(operationId);
    } else {
      newSelection.add(operationId);
    }
    setSelectedOperations(newSelection);
  };

  const renderConflictType = (type: DocumentConflict['conflictType']) => {
    const typeConfig = {
      concurrent_edit: {
        icon: 'git-merge' as const,
        color: '#FF9500',
        label: 'Concurrent Edit',
        description: 'Multiple users edited the same content simultaneously'
      },
      version_mismatch: {
        icon: 'refresh' as const,
        color: '#FF3B30',
        label: 'Version Mismatch',
        description: 'Document versions are out of sync'
      },
      format_conflict: {
        icon: 'text' as const,
        color: '#5856D6',
        label: 'Format Conflict',
        description: 'Conflicting formatting changes detected'
      }
    };

    const config = typeConfig[type];
    
    return (
      <View style={styles.conflictType}>
        <Ionicons name={config.icon} size={16} color={config.color} />
        <Text style={[styles.conflictTypeText, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
    );
  };

  const renderOperation = (operation: DocumentOperation, isSelected: boolean) => {
    const getOperationDescription = () => {
      switch (operation.type) {
        case 'insert':
          return `Insert "${operation.content?.slice(0, 50)}${operation.content && operation.content.length > 50 ? '...' : ''}" at position ${operation.position}`;
        case 'delete':
          return `Delete ${operation.length} characters at position ${operation.position}`;
        case 'format':
          return `Apply formatting at position ${operation.position}`;
        default:
          return `${operation.type} operation at position ${operation.position}`;
      }
    };

    return (
      <TouchableOpacity
        key={operation.id}
        style={[
          styles.operation,
          isSelected && styles.selectedOperation
        ]}
        onPress={() => toggleOperationSelection(operation.id)}
      >
        <View style={styles.operationHeader}>
          <View style={styles.operationInfo}>
            <Text style={styles.operationType}>{operation.type.toUpperCase()}</Text>
            <Text style={styles.operationTime}>
              {new Date(operation.timestamp).toLocaleTimeString()}
            </Text>
          </View>
          
          <View style={[
            styles.checkbox,
            isSelected && styles.checkedCheckbox
          ]}>
            {isSelected && (
              <Ionicons name="checkmark" size={12} color="#ffffff" />
            )}
          </View>
        </View>
        
        <Text style={styles.operationDescription}>
          {getOperationDescription()}
        </Text>
        
        <Text style={styles.operationUser}>
          by User {operation.userId}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderConflictDetails = (conflict: DocumentConflict) => (
    <View style={styles.conflictDetails}>
      <View style={styles.conflictHeader}>
        <View>
          {renderConflictType(conflict.conflictType)}
          <Text style={styles.conflictId}>ID: {conflict.id.slice(-8)}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setSelectedConflict(null)}
        >
          <Ionicons name="close" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Conflicting Operations</Text>
      <Text style={styles.sectionDescription}>
        Select which operations to keep when resolving this conflict:
      </Text>

      <ScrollView style={styles.operationsList}>
        {conflict.operations.map(operation => 
          renderOperation(operation, selectedOperations.has(operation.id))
        )}
      </ScrollView>

      <View style={styles.resolutionActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleResolveConflict(conflict, 'reject')}
        >
          <Ionicons name="close-circle" size={16} color="#ffffff" />
          <Text style={styles.actionButtonText}>Reject All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton, 
            styles.acceptButton,
            selectedOperations.size === 0 && styles.disabledButton
          ]}
          onPress={() => handleResolveConflict(conflict, 'accept')}
          disabled={selectedOperations.size === 0}
        >
          <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
          <Text style={styles.actionButtonText}>
            Accept Selected ({selectedOperations.size})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderConflictList = () => (
    <View style={styles.conflictList}>
      <View style={styles.header}>
        <Text style={styles.title}>Document Conflicts</Text>
        <Text style={styles.subtitle}>
          {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} need resolution
        </Text>
      </View>

      <ScrollView style={styles.conflictItems}>
        {conflicts.map(conflict => (
          <TouchableOpacity
            key={conflict.id}
            style={styles.conflictItem}
            onPress={() => setSelectedConflict(conflict)}
          >
            <View style={styles.conflictItemHeader}>
              {renderConflictType(conflict.conflictType)}
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </View>
            
            <Text style={styles.conflictItemDescription}>
              {conflict.operations.length} operation{conflict.operations.length !== 1 ? 's' : ''} in conflict
            </Text>
            
            <Text style={styles.conflictItemTime}>
              {new Date(conflict.operations[0]?.timestamp || Date.now()).toLocaleString()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.globalActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => {
            Alert.alert(
              'Reject All Conflicts',
              'Are you sure you want to reject all conflicts? This will discard all conflicting changes.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reject All',
                  style: 'destructive',
                  onPress: () => {
                    conflicts.forEach(conflict => {
                      onResolveConflict(conflict.id, 'reject');
                    });
                    onDismiss();
                  }
                }
              ]
            );
          }}
        >
          <Text style={styles.actionButtonText}>Reject All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.neutralButton]}
          onPress={onDismiss}
        >
          <Text style={[styles.actionButtonText, { color: '#333' }]}>
            Resolve Later
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <View style={styles.container}>
        {selectedConflict ? renderConflictDetails(selectedConflict) : renderConflictList()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  conflictList: {
    flex: 1,
  },
  conflictItems: {
    flex: 1,
    padding: 16,
  },
  conflictItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  conflictItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  conflictType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conflictTypeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  conflictItemDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  conflictItemTime: {
    fontSize: 12,
    color: '#666',
  },
  conflictDetails: {
    flex: 1,
    padding: 16,
  },
  conflictHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  conflictId: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  operationsList: {
    flex: 1,
    marginBottom: 20,
  },
  operation: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedOperation: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  operationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  operationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  operationType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  operationTime: {
    fontSize: 12,
    color: '#666',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckbox: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  operationDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  operationUser: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  resolutionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  globalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  neutralButton: {
    backgroundColor: '#E0E0E0',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default ConflictResolution;