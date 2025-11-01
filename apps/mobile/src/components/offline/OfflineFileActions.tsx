import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface OfflineFileActionsProps {
  selectedCount: number
  isSelectionMode: boolean
  onRemoveSelected: () => void
  onClearAll: () => void
  onCleanupStorage: () => void
  onCancelSelection: () => void
}

export const OfflineFileActions: React.FC<OfflineFileActionsProps> = ({
  selectedCount,
  isSelectionMode,
  onRemoveSelected,
  onClearAll,
  onCleanupStorage,
  onCancelSelection,
}) => {
  if (isSelectionMode) {
    return (
      <View style={styles.selectionActions}>
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionText}>
            {selectedCount} file{selectedCount !== 1 ? 's' : ''} selected
          </Text>
        </View>
        
        <View style={styles.selectionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancelSelection}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.removeButton, selectedCount === 0 && styles.disabledButton]}
            onPress={onRemoveSelected}
            disabled={selectedCount === 0}
          >
            <Ionicons name="trash-outline" size={16} color="#fff" />
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onCleanupStorage}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="refresh-outline" size={20} color="#007AFF" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Cleanup Storage</Text>
            <Text style={styles.actionSubtitle}>Remove old files</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onClearAll}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={[styles.actionTitle, { color: '#FF3B30' }]}>Clear All</Text>
            <Text style={styles.actionSubtitle}>Remove all files</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  
  // Selection mode styles
  selectionActions: {
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionInfo: {
    flex: 1,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  selectionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginLeft: 4,
  },
})

export default OfflineFileActions