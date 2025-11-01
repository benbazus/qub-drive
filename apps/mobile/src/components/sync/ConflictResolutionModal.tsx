import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SyncConflict } from '../../services/syncService'
import { useTheme } from '../../hooks/useTheme'

interface ConflictResolutionModalProps {
  visible: boolean
  conflict: SyncConflict | null
  onResolve: (resolution: 'local' | 'remote' | 'merge') => void
  onCancel: () => void
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  visible,
  conflict,
  onResolve,
  onCancel
}) => {
  const [selectedResolution, setSelectedResolution] = useState<'local' | 'remote' | 'merge' | null>(null)
  const { colors } = useTheme()

  if (!conflict) return null

  const formatDate = (date: Date) => {
    return date.toLocaleString()
  }

  const formatSize = (size?: number) => {
    if (!size) return 'Unknown size'
    
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleResolve = () => {
    if (!selectedResolution) {
      Alert.alert('No Resolution Selected', 'Please select how to resolve this conflict.')
      return
    }
    
    onResolve(selectedResolution)
    setSelectedResolution(null)
  }

  const handleCancel = () => {
    setSelectedResolution(null)
    onCancel()
  }

  const renderVersionCard = (
    title: string,
    version: { content?: string; lastModified: Date; size?: number },
    isSelected: boolean,
    onSelect: () => void
  ) => (
    <TouchableOpacity
      style={[
        styles.versionCard,
        isSelected && { borderColor: colors.primary, borderWidth: 2 }
      ]}
      onPress={onSelect}
    >
      <View style={styles.versionHeader}>
        <Text style={styles.versionTitle}>{title}</Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
        )}
      </View>
      
      <View style={styles.versionDetails}>
        <Text style={styles.versionDetail}>
          Modified: {formatDate(version.lastModified)}
        </Text>
        <Text style={styles.versionDetail}>
          Size: {formatSize(version.size)}
        </Text>
      </View>
      
      {version.content && (
        <View style={styles.contentPreview}>
          <Text style={styles.contentPreviewTitle}>Content Preview:</Text>
          <Text style={styles.contentPreviewText} numberOfLines={3}>
            {version.content}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 20,
      width: '95%',
      maxHeight: '90%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    closeButton: {
      padding: 4,
    },
    conflictInfo: {
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 8,
      marginBottom: 20,
    },
    conflictFileName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 4,
    },
    conflictType: {
      fontSize: 14,
      color: colors.textSecondary,
      textTransform: 'capitalize',
    },
    conflictDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
      lineHeight: 20,
    },
    versionsContainer: {
      flex: 1,
      marginBottom: 20,
    },
    versionsTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 12,
    },
    versionCard: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    versionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    versionTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    versionDetails: {
      marginBottom: 8,
    },
    versionDetail: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    contentPreview: {
      marginTop: 8,
      padding: 8,
      backgroundColor: colors.background,
      borderRadius: 4,
    },
    contentPreviewTitle: {
      fontSize: 11,
      fontWeight: '500',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    contentPreviewText: {
      fontSize: 11,
      color: colors.text,
      fontFamily: 'monospace',
    },
    mergeOption: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    mergeOptionSelected: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    mergeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    mergeTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    mergeDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      lineHeight: 16,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    resolveButton: {
      backgroundColor: colors.primary,
    },
    resolveButtonDisabled: {
      backgroundColor: colors.border,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '500',
    },
    cancelButtonText: {
      color: colors.text,
    },
    resolveButtonText: {
      color: colors.background,
    },
    resolveButtonTextDisabled: {
      color: colors.textSecondary,
    },
  })

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Resolve Conflict</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.conflictInfo}>
            <Text style={styles.conflictFileName}>{conflict.fileName}</Text>
            <Text style={styles.conflictType}>
              {conflict.conflictType} conflict
            </Text>
            <Text style={styles.conflictDescription}>
              This file has been modified both locally and remotely. 
              Choose which version to keep or merge them together.
            </Text>
          </View>
          
          <ScrollView style={styles.versionsContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.versionsTitle}>Choose Resolution:</Text>
            
            {renderVersionCard(
              'Keep Local Version',
              conflict.localVersion,
              selectedResolution === 'local',
              () => setSelectedResolution('local')
            )}
            
            {renderVersionCard(
              'Keep Remote Version',
              conflict.remoteVersion,
              selectedResolution === 'remote',
              () => setSelectedResolution('remote')
            )}
            
            <TouchableOpacity
              style={[
                styles.mergeOption,
                selectedResolution === 'merge' && styles.mergeOptionSelected
              ]}
              onPress={() => setSelectedResolution('merge')}
            >
              <View style={styles.mergeHeader}>
                <Text style={styles.mergeTitle}>Merge Versions</Text>
                {selectedResolution === 'merge' && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </View>
              <Text style={styles.mergeDescription}>
                Attempt to combine both versions. This will append remote changes 
                to the local version. Review the result after merging.
              </Text>
            </TouchableOpacity>
          </ScrollView>
          
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.actionButton,
                selectedResolution ? styles.resolveButton : styles.resolveButtonDisabled
              ]}
              onPress={handleResolve}
              disabled={!selectedResolution}
            >
              <Text style={[
                styles.actionButtonText,
                selectedResolution ? styles.resolveButtonText : styles.resolveButtonTextDisabled
              ]}>
                Resolve
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default ConflictResolutionModal