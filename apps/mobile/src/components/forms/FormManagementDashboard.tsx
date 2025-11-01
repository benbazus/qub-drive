import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/constants/theme'
import type { Form, FormListItem } from '@/types/forms'
import { formsApi } from '@/services/api/formsApi'
import { FormSharingManager } from './FormSharingManager'
import { FormAnalytics } from './FormAnalytics'
import { FormResponseCollector } from './FormResponseCollector'

interface FormManagementDashboardProps {
  onFormSelect?: (form: Form) => void
  onFormEdit?: (form: Form) => void
  onFormCreate?: () => void
}

export const FormManagementDashboard: React.FC<FormManagementDashboardProps> = ({
  onFormSelect,
  onFormEdit,
  onFormCreate,
}) => {
  const [forms, setForms] = useState<FormListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [selectedForm, setSelectedForm] = useState<Form | null>(null)
  const [showSharingModal, setShowSharingModal] = useState(false)
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)
  const [showResponseModal, setShowResponseModal] = useState(false)

  useEffect(() => {
    loadForms()
  }, [])

  const loadForms = async () => {
    try {
      setLoading(true)
      setError(null)
      const formsData = await formsApi.getFormsList()
      setForms(formsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load forms')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadForms()
    setRefreshing(false)
  }

  const handleFormAction = async (formItem: FormListItem, action: string) => {
    try {
      setLoading(true)
      const form = await formsApi.getForm(formItem.id)
      setSelectedForm(form)

      switch (action) {
        case 'share':
          setShowSharingModal(true)
          break
        case 'analytics':
          setShowAnalyticsModal(true)
          break
        case 'responses':
          setShowResponseModal(true)
          break
        case 'edit':
          onFormEdit?.(form)
          break
        case 'view':
          onFormSelect?.(form)
          break
        case 'publish':
          await handlePublishForm(form)
          break
        case 'unpublish':
          await handleUnpublishForm(form)
          break
        case 'duplicate':
          await handleDuplicateForm(form)
          break
        case 'delete':
          await handleDeleteForm(form)
          break
      }
    } catch {
      Alert.alert('Error', 'Failed to perform action')
    } finally {
      setLoading(false)
    }
  }

  const handlePublishForm = async (form: Form) => {
    try {
      await formsApi.publishForm(form.id)
      await loadForms()
      Alert.alert('Success', 'Form published successfully!')
    } catch {
      Alert.alert('Error', 'Failed to publish form')
    }
  }

  const handleUnpublishForm = async (form: Form) => {
    try {
      await formsApi.unpublishForm(form.id)
      await loadForms()
      Alert.alert('Success', 'Form unpublished successfully!')
    } catch {
      Alert.alert('Error', 'Failed to unpublish form')
    }
  }

  const handleDuplicateForm = async (form: Form) => {
    try {
      await formsApi.duplicateForm(form.id)
      await loadForms()
      Alert.alert('Success', 'Form duplicated successfully!')
    } catch {
      Alert.alert('Error', 'Failed to duplicate form')
    }
  }

  const handleDeleteForm = async (form: Form) => {
    Alert.alert(
      'Delete Form',
      `Are you sure you want to delete "${form.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await formsApi.deleteForm(form.id)
              await loadForms()
              Alert.alert('Success', 'Form deleted successfully!')
            } catch {
              Alert.alert('Error', 'Failed to delete form')
            }
          },
        },
      ]
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published':
        return '#10b981'
      case 'Draft':
        return '#f59e0b'
      case 'Paused':
        return '#ef4444'
      case 'Closed':
        return '#6b7280'
      default:
        return Colors.light.tabIconDefault
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Published':
        return 'checkmark-circle'
      case 'Draft':
        return 'create'
      case 'Paused':
        return 'pause-circle'
      case 'Closed':
        return 'stop-circle'
      default:
        return 'help-circle'
    }
  }

  const renderFormCard = (formItem: FormListItem) => (
    <View key={formItem.id} style={styles.formCard}>
      <TouchableOpacity
        style={styles.formContent}
        onPress={() => handleFormAction(formItem, 'view')}
      >
        <View style={styles.formHeader}>
          <Text style={styles.formTitle} numberOfLines={2}>
            {formItem.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(formItem.status) }]}>
            <Ionicons 
              name={getStatusIcon(formItem.status)} 
              size={12} 
              color={Colors.light.background} 
            />
            <Text style={styles.statusText}>{formItem.status}</Text>
          </View>
        </View>

        {formItem.description && (
          <Text style={styles.formDescription} numberOfLines={2}>
            {formItem.description}
          </Text>
        )}

        <View style={styles.formStats}>
          <View style={styles.statItem}>
            <Ionicons name="eye" size={16} color={Colors.light.tabIconDefault} />
            <Text style={styles.statText}>0 views</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="document-text" size={16} color={Colors.light.tabIconDefault} />
            <Text style={styles.statText}>{formItem.responseCount} responses</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time" size={16} color={Colors.light.tabIconDefault} />
            <Text style={styles.statText}>
              {new Date(formItem.lastModified).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.formActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleFormAction(formItem, 'share')}
        >
          <Ionicons name="share" size={20} color={Colors.light.tint} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleFormAction(formItem, 'analytics')}
        >
          <Ionicons name="analytics" size={20} color={Colors.light.tint} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleFormAction(formItem, 'responses')}
        >
          <Ionicons name="list" size={20} color={Colors.light.tint} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleFormAction(formItem, 'edit')}
        >
          <Ionicons name="create" size={20} color={Colors.light.tint} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => showMoreActions(formItem)}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.light.tabIconDefault} />
        </TouchableOpacity>
      </View>
    </View>
  )

  const showMoreActions = (formItem: FormListItem) => {
    const actions = [
      { text: 'Duplicate', onPress: () => handleFormAction(formItem, 'duplicate') },
      { text: 'Delete', onPress: () => handleFormAction(formItem, 'delete'), style: 'destructive' },
    ]

    if (formItem.status === 'Draft') {
      actions.unshift({ text: 'Publish', onPress: () => handleFormAction(formItem, 'publish') })
    } else if (formItem.status === 'Published') {
      actions.unshift({ text: 'Unpublish', onPress: () => handleFormAction(formItem, 'unpublish') })
    }

    Alert.alert('Form Actions', 'Choose an action', [
      ...actions.map(action => ({
        text: action.text,
        onPress: action.onPress,
        style: action.style as 'default' | 'cancel' | 'destructive',
      })),
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-outline" size={64} color={Colors.light.tabIconDefault} />
      <Text style={styles.emptyStateTitle}>No forms yet</Text>
      <Text style={styles.emptyStateText}>
        Create your first form to start collecting responses
      </Text>
      <TouchableOpacity style={styles.createButton} onPress={onFormCreate}>
        <Ionicons name="add" size={20} color={Colors.light.background} />
        <Text style={styles.createButtonText}>Create Form</Text>
      </TouchableOpacity>
    </View>
  )

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Ionicons name="alert-circle" size={64} color="#ef4444" />
      <Text style={styles.errorTitle}>Failed to load forms</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadForms}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  )

  if (loading && forms.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Loading forms...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Form Management</Text>
        <TouchableOpacity style={styles.createHeaderButton} onPress={onFormCreate}>
          <Ionicons name="add" size={24} color={Colors.light.tint} />
        </TouchableOpacity>
      </View>

      {error ? (
        renderErrorState()
      ) : forms.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View style={styles.formsGrid}>
            {forms.map(renderFormCard)}
          </View>
        </ScrollView>
      )}

      {/* Sharing Modal */}
      <Modal
        visible={showSharingModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedForm && (
          <FormSharingManager
            form={selectedForm}
            onClose={() => {
              setShowSharingModal(false)
              setSelectedForm(null)
            }}
            onFormUpdate={(updatedForm) => {
              setSelectedForm(updatedForm)
              loadForms()
            }}
          />
        )}
      </Modal>

      {/* Analytics Modal */}
      <Modal
        visible={showAnalyticsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedForm && (
          <FormAnalytics
            form={selectedForm}
            onClose={() => {
              setShowAnalyticsModal(false)
              setSelectedForm(null)
            }}
          />
        )}
      </Modal>

      {/* Response Modal */}
      <Modal
        visible={showResponseModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedForm && (
          <FormResponseCollector
            form={selectedForm}
            onCancel={() => {
              setShowResponseModal(false)
              setSelectedForm(null)
            }}
            onSubmit={() => {
              setShowResponseModal(false)
              setSelectedForm(null)
              loadForms()
            }}
          />
        )}
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.light.tabIconDefault}20`,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  createHeaderButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  formsGrid: {
    padding: 16,
    gap: 16,
  },
  formCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: `${Colors.light.tabIconDefault}20`,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formContent: {
    marginBottom: 16,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  formTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginRight: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.background,
  },
  formDescription: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    lineHeight: 20,
    marginBottom: 12,
  },
  formStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: `${Colors.light.tabIconDefault}20`,
  },
  actionButton: {
    padding: 8,
  },
  moreButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.background,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.background,
  },
})