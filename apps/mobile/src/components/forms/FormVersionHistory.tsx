import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native'
import { Colors } from '@/constants/theme'
import { formService } from '@/services/formService'
import type {
  Form,
  FormVersion,
  FormHistory,
  RestoreFormVersionRequest,
} from '@/types/forms'
import { FormHistoryAction } from '@/types/forms'

interface FormVersionHistoryProps {
  form: Form
  onFormRestore?: (form: Form) => void
}

export const FormVersionHistory: React.FC<FormVersionHistoryProps> = ({
  form,
  onFormRestore,
}) => {
  const [versions, setVersions] = useState<FormVersion[]>([])
  const [history, setHistory] = useState<FormHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'versions' | 'history'>('versions')
  
  // Modal states
  const [showCreateVersionModal, setShowCreateVersionModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<FormVersion | null>(null)
  const [changeLog, setChangeLog] = useState('')
  const [createNewVersion, setCreateNewVersion] = useState(true)

  const loadVersions = async () => {
    try {
      setLoading(true)
      setError(null)
      const versionsData = await formService.getFormVersions(form.id)
      setVersions(versionsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load versions')
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    try {
      const historyData = await formService.getFormHistory(form.id)
      setHistory(historyData)
    } catch (error) {
      console.error('Failed to load history:', error)
    }
  }

  useEffect(() => {
    loadVersions()
    loadHistory()
  }, [form.id])

  const handleCreateVersion = async () => {
    if (!changeLog.trim()) {
      Alert.alert('Error', 'Please enter a change log message')
      return
    }

    try {
      setLoading(true)
      await formService.createFormVersion(form.id, changeLog)
      setShowCreateVersionModal(false)
      setChangeLog('')
      await loadVersions()
      await loadHistory()
      Alert.alert('Success', 'Version created successfully!')
    } catch (error) {
      Alert.alert('Error', 'Failed to create version')
    } finally {
      setLoading(false)
    }
  }

  const handleRestoreVersion = (version: FormVersion) => {
    setSelectedVersion(version)
    setShowRestoreModal(true)
  }

  const confirmRestore = async () => {
    if (!selectedVersion) return

    try {
      setLoading(true)
      const restoreData: RestoreFormVersionRequest = {
        versionId: selectedVersion.id,
        createNewVersion,
      }
      const restoredForm = await formService.restoreFormVersion(form.id, restoreData)
      setShowRestoreModal(false)
      setSelectedVersion(null)
      await loadVersions()
      await loadHistory()
      onFormRestore?.(restoredForm)
      Alert.alert('Success', 'Version restored successfully!')
    } catch (error) {
      Alert.alert('Error', 'Failed to restore version')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVersion = (version: FormVersion) => {
    if (version.isActive) {
      Alert.alert('Error', 'Cannot delete the active version')
      return
    }

    Alert.alert(
      'Delete Version',
      `Are you sure you want to delete version ${version.version}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true)
              await formService.deleteFormVersion(form.id, version.id)
              await loadVersions()
              Alert.alert('Success', 'Version deleted successfully!')
            } catch (error) {
              Alert.alert('Error', 'Failed to delete version')
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  }

  const getActionIcon = (action: FormHistoryAction): string => {
    switch (action) {
      case FormHistoryAction.Created:
        return '➕'
      case FormHistoryAction.Updated:
        return '✏️'
      case FormHistoryAction.Published:
        return '🚀'
      case FormHistoryAction.Unpublished:
        return '⏸️'
      case FormHistoryAction.Duplicated:
        return '📋'
      case FormHistoryAction.Restored:
        return '🔄'
      case FormHistoryAction.Deleted:
        return '🗑️'
      case FormHistoryAction.FieldAdded:
        return '➕'
      case FormHistoryAction.FieldUpdated:
        return '✏️'
      case FormHistoryAction.FieldDeleted:
        return '➖'
      case FormHistoryAction.SectionAdded:
        return '📄'
      case FormHistoryAction.SectionUpdated:
        return '📝'
      case FormHistoryAction.SectionDeleted:
        return '🗑️'
      default:
        return '📝'
    }
  }

  const getActionColor = (action: FormHistoryAction): string => {
    switch (action) {
      case FormHistoryAction.Created:
      case FormHistoryAction.FieldAdded:
      case FormHistoryAction.SectionAdded:
        return '#10b981'
      case FormHistoryAction.Updated:
      case FormHistoryAction.FieldUpdated:
      case FormHistoryAction.SectionUpdated:
        return '#3b82f6'
      case FormHistoryAction.Published:
        return '#8b5cf6'
      case FormHistoryAction.Unpublished:
        return '#f59e0b'
      case FormHistoryAction.Deleted:
      case FormHistoryAction.FieldDeleted:
      case FormHistoryAction.SectionDeleted:
        return '#ef4444'
      case FormHistoryAction.Duplicated:
      case FormHistoryAction.Restored:
        return '#6b7280'
      default:
        return '#6b7280'
    }
  }

  const renderVersionItem = (version: FormVersion) => (
    <View key={version.id} style={[styles.versionItem, version.isActive && styles.activeVersion]}>
      <View style={styles.versionHeader}>
        <View style={styles.versionInfo}>
          <Text style={styles.versionNumber}>Version {version.version}</Text>
          {version.isActive && <Text style={styles.activeLabel}>ACTIVE</Text>}
        </View>
        <Text style={styles.versionDate}>
          {new Date(version.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      <Text style={styles.versionTitle}>{version.title}</Text>
      {version.changeLog && (
        <Text style={styles.versionChangeLog}>{version.changeLog}</Text>
      )}
      
      <View style={styles.versionMeta}>
        <Text style={styles.versionAuthor}>By {version.createdBy}</Text>
        <Text style={styles.versionStatus}>{version.status}</Text>
      </View>

      {!version.isActive && (
        <View style={styles.versionActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleRestoreVersion(version)}
          >
            <Text style={styles.actionButtonText}>Restore</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteVersion(version)}
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )

  const renderHistoryItem = (historyItem: FormHistory) => (
    <View key={historyItem.id} style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <View style={styles.historyAction}>
          <Text style={styles.historyIcon}>{getActionIcon(historyItem.action)}</Text>
          <Text style={[styles.historyActionText, { color: getActionColor(historyItem.action) }]}>
            {historyItem.action}
          </Text>
        </View>
        <Text style={styles.historyDate}>
          {new Date(historyItem.performedAt).toLocaleDateString()}
        </Text>
      </View>
      
      <Text style={styles.historyDescription}>{historyItem.description}</Text>
      
      <View style={styles.historyMeta}>
        <Text style={styles.historyAuthor}>By {historyItem.performedBy}</Text>
        <Text style={styles.historyVersion}>v{historyItem.version}</Text>
      </View>

      {historyItem.changes.length > 0 && (
        <View style={styles.changesContainer}>
          <Text style={styles.changesTitle}>Changes:</Text>
          {historyItem.changes.slice(0, 3).map((change, index) => (
            <Text key={index} style={styles.changeItem}>
              • {change.type} {change.action}: {change.path}
            </Text>
          ))}
          {historyItem.changes.length > 3 && (
            <Text style={styles.moreChanges}>
              +{historyItem.changes.length - 3} more changes
            </Text>
          )}
        </View>
      )}
    </View>
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Version History</Text>
        <TouchableOpacity
          style={styles.createVersionButton}
          onPress={() => setShowCreateVersionModal(true)}
        >
          <Text style={styles.createVersionButtonText}>Create Version</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'versions' && styles.activeTab]}
          onPress={() => setActiveTab('versions')}
        >
          <Text style={[styles.tabText, activeTab === 'versions' && styles.activeTabText]}>
            Versions ({versions.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            History ({history.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {activeTab === 'versions' && (
          <View style={styles.versionsContainer}>
            {versions.map(renderVersionItem)}
          </View>
        )}

        {activeTab === 'history' && (
          <View style={styles.historyContainer}>
            {history.map(renderHistoryItem)}
          </View>
        )}
      </ScrollView>

      {/* Create Version Modal */}
      <Modal
        visible={showCreateVersionModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Version</Text>
            <TouchableOpacity onPress={() => setShowCreateVersionModal(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Change Log</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={changeLog}
                onChangeText={setChangeLog}
                placeholder="Describe what changed in this version..."
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCreateVersion}
              disabled={!changeLog.trim()}
            >
              <Text style={styles.primaryButtonText}>Create Version</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Restore Version Modal */}
      <Modal
        visible={showRestoreModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Restore Version</Text>
            <TouchableOpacity onPress={() => setShowRestoreModal(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.restoreWarning}>
              Are you sure you want to restore version {selectedVersion?.version}?
            </Text>
            
            <View style={styles.switchGroup}>
              <Text style={styles.switchLabel}>Create new version from current state</Text>
              <TouchableOpacity
                style={[styles.checkbox, createNewVersion && styles.checkboxChecked]}
                onPress={() => setCreateNewVersion(!createNewVersion)}
              >
                {createNewVersion && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={confirmRestore}
            >
              <Text style={styles.primaryButtonText}>Restore Version</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.light.tabIconDefault}20`,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
  },
  createVersionButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  createVersionButtonText: {
    color: Colors.light.background,
    fontSize: 14,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.light.tabIconDefault}20`,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.tint,
  },
  tabText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
  activeTabText: {
    color: Colors.light.tint,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  versionsContainer: {
    gap: 16,
  },
  historyContainer: {
    gap: 12,
  },
  versionItem: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: `${Colors.light.tabIconDefault}20`,
  },
  activeVersion: {
    borderColor: Colors.light.tint,
    backgroundColor: `${Colors.light.tint}05`,
  },
  versionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  versionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  versionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  activeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.tint,
    backgroundColor: `${Colors.light.tint}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  versionDate: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  versionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
  },
  versionChangeLog: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginBottom: 8,
  },
  versionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  versionAuthor: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  versionStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.tint,
  },
  versionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: `${Colors.light.tint}10`,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 12,
    color: Colors.light.tint,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  deleteButtonText: {
    color: '#dc2626',
  },
  historyItem: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: `${Colors.light.tabIconDefault}20`,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyIcon: {
    fontSize: 14,
  },
  historyActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  historyDate: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  historyDescription: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 4,
  },
  historyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyAuthor: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  historyVersion: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  changesContainer: {
    backgroundColor: `${Colors.light.tabIconDefault}05`,
    padding: 8,
    borderRadius: 6,
  },
  changesTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
  },
  changeItem: {
    fontSize: 11,
    color: Colors.light.tabIconDefault,
    marginBottom: 2,
  },
  moreChanges: {
    fontSize: 11,
    color: Colors.light.tint,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.light.tabIconDefault}20`,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  modalClose: {
    fontSize: 16,
    color: Colors.light.tint,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: `${Colors.light.tabIconDefault}20`,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: `${Colors.light.tabIconDefault}30`,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: Colors.light.text,
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.light.tint,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.light.tint,
  },
  checkmark: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  restoreWarning: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: '600',
  },
})