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
  Switch,
} from 'react-native'
import { Colors } from '@/constants/theme'
import { formService } from '@/services/formService'
import type {
  Form,
  FormListItem,
  FormTemplate,
  DuplicateFormRequest,
  CreateFormFromTemplateRequest,
} from '@/types/forms'

interface FormManagementProps {
  onFormSelect?: (form: Form) => void
  onFormCreate?: (form: Form) => void
}

export const FormManagement: React.FC<FormManagementProps> = ({
  onFormSelect,
  onFormCreate,
}) => {
  const [forms, setForms] = useState<FormListItem[]>([])
  const [templates, setTemplates] = useState<FormTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'forms' | 'templates'>('forms')
  
  // Modal states
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showCreateFromTemplateModal, setShowCreateFromTemplateModal] = useState(false)
  const [selectedForm, setSelectedForm] = useState<FormListItem | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null)

  // Form states
  const [duplicateData, setDuplicateData] = useState<DuplicateFormRequest>({
    title: '',
    description: '',
    includeResponses: false,
    copySettings: true,
    copyBranding: true,
  })

  const [templateData, setTemplateData] = useState({
    name: '',
    description: '',
    category: 'General',
  })

  const [createFromTemplateData, setCreateFromTemplateData] = useState<CreateFormFromTemplateRequest>({
    templateId: '',
    title: '',
    description: '',
  })

  useEffect(() => {
    loadForms()
    loadTemplates()
  }, [])

  const loadForms = async () => {
    try {
      setLoading(true)
      setError(null)
      const formsData = await formService.getFormsList()
      setForms(formsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load forms')
    } finally {
      setLoading(false)
    }
  }

  const loadTemplates = async () => {
    try {
      const templatesData = await formService.getLocalFormTemplates()
      setTemplates(templatesData)
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  const handleFormSelect = async (formItem: FormListItem) => {
    try {
      setLoading(true)
      const form = await formService.getForm(formItem.id)
      onFormSelect?.(form)
    } catch (err) {
      Alert.alert('Error', 'Failed to load form')
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicateForm = (formItem: FormListItem) => {
    setSelectedForm(formItem)
    setDuplicateData({
      title: `${formItem.title} (Copy)`,
      description: formItem.description || '',
      includeResponses: false,
      copySettings: true,
      copyBranding: true,
    })
    setShowDuplicateModal(true)
  }

  const handleSaveAsTemplate = (formItem: FormListItem) => {
    setSelectedForm(formItem)
    setTemplateData({
      name: formItem.title,
      description: formItem.description || '',
      category: 'General',
    })
    setShowTemplateModal(true)
  }

  const handleCreateFromTemplate = (template: FormTemplate) => {
    setSelectedTemplate(template)
    setCreateFromTemplateData({
      templateId: template.id,
      title: template.name,
      description: template.description,
    })
    setShowCreateFromTemplateModal(true)
  }

  const confirmDuplicate = async () => {
    if (!selectedForm) return

    try {
      setLoading(true)
      const duplicatedForm = await formService.duplicateFormAdvanced(selectedForm.id, duplicateData)
      setShowDuplicateModal(false)
      setSelectedForm(null)
      await loadForms()
      onFormCreate?.(duplicatedForm)
      Alert.alert('Success', 'Form duplicated successfully!')
    } catch (error) {
      Alert.alert('Error', 'Failed to duplicate form')
    } finally {
      setLoading(false)
    }
  }

  const confirmSaveAsTemplate = async () => {
    if (!selectedForm) return

    try {
      setLoading(true)
      await formService.saveAsTemplate(selectedForm.id, templateData)
      setShowTemplateModal(false)
      setSelectedForm(null)
      await loadTemplates()
      Alert.alert('Success', 'Form saved as template successfully!')
    } catch (error) {
      Alert.alert('Error', 'Failed to save as template')
    } finally {
      setLoading(false)
    }
  }

  const confirmCreateFromTemplate = async () => {
    if (!selectedTemplate) return

    try {
      setLoading(true)
      const newForm = await formService.createFormFromTemplate(createFromTemplateData)
      setShowCreateFromTemplateModal(false)
      setSelectedTemplate(null)
      await loadForms()
      onFormCreate?.(newForm)
      Alert.alert('Success', 'Form created from template successfully!')
    } catch (error) {
      Alert.alert('Error', 'Failed to create form from template')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteForm = (formItem: FormListItem) => {
    Alert.alert(
      'Delete Form',
      `Are you sure you want to delete "${formItem.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true)
              await formService.deleteForm(formItem.id)
              await loadForms()
              Alert.alert('Success', 'Form deleted successfully!')
            } catch (error) {
              Alert.alert('Error', 'Failed to delete form')
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  }

  const renderFormItem = (formItem: FormListItem) => (
    <View key={formItem.id} style={styles.formItem}>
      <TouchableOpacity
        style={styles.formContent}
        onPress={() => handleFormSelect(formItem)}
      >
        <Text style={styles.formTitle}>{formItem.title}</Text>
        {formItem.description && (
          <Text style={styles.formDescription}>{formItem.description}</Text>
        )}
        <View style={styles.formMeta}>
          <Text style={styles.formStatus}>{formItem.status}</Text>
          <Text style={styles.formVersion}>v{formItem.version}</Text>
          <Text style={styles.formResponses}>{formItem.responseCount} responses</Text>
        </View>
        <Text style={styles.formDate}>
          Modified: {new Date(formItem.lastModified).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
      
      <View style={styles.formActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDuplicateForm(formItem)}
        >
          <Text style={styles.actionButtonText}>Duplicate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleSaveAsTemplate(formItem)}
        >
          <Text style={styles.actionButtonText}>Save as Template</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteForm(formItem)}
        >
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderTemplateItem = (template: FormTemplate) => (
    <View key={template.id} style={styles.templateItem}>
      <TouchableOpacity
        style={styles.templateContent}
        onPress={() => handleCreateFromTemplate(template)}
      >
        <Text style={styles.templateName}>{template.name}</Text>
        <Text style={styles.templateDescription}>{template.description}</Text>
        <Text style={styles.templateCategory}>{template.category}</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'forms' && styles.activeTab]}
          onPress={() => setActiveTab('forms')}
        >
          <Text style={[styles.tabText, activeTab === 'forms' && styles.activeTabText]}>
            My Forms
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'templates' && styles.activeTab]}
          onPress={() => setActiveTab('templates')}
        >
          <Text style={[styles.tabText, activeTab === 'templates' && styles.activeTabText]}>
            Templates
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

        {activeTab === 'forms' && (
          <View style={styles.formsContainer}>
            {forms.map(renderFormItem)}
          </View>
        )}

        {activeTab === 'templates' && (
          <View style={styles.templatesContainer}>
            {templates.map(renderTemplateItem)}
          </View>
        )}
      </ScrollView>

      {/* Duplicate Form Modal */}
      <Modal
        visible={showDuplicateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Duplicate Form</Text>
            <TouchableOpacity onPress={() => setShowDuplicateModal(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.textInput}
                value={duplicateData.title}
                onChangeText={(text) => setDuplicateData(prev => ({ ...prev, title: text }))}
                placeholder="Enter form title"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={duplicateData.description}
                onChangeText={(text) => setDuplicateData(prev => ({ ...prev, description: text }))}
                placeholder="Enter form description"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.switchGroup}>
              <Text style={styles.switchLabel}>Include Responses</Text>
              <Switch
                value={duplicateData.includeResponses}
                onValueChange={(value) => setDuplicateData(prev => ({ ...prev, includeResponses: value }))}
              />
            </View>

            <View style={styles.switchGroup}>
              <Text style={styles.switchLabel}>Copy Settings</Text>
              <Switch
                value={duplicateData.copySettings}
                onValueChange={(value) => setDuplicateData(prev => ({ ...prev, copySettings: value }))}
              />
            </View>

            <View style={styles.switchGroup}>
              <Text style={styles.switchLabel}>Copy Branding</Text>
              <Switch
                value={duplicateData.copyBranding}
                onValueChange={(value) => setDuplicateData(prev => ({ ...prev, copyBranding: value }))}
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={confirmDuplicate}
              disabled={!duplicateData.title.trim()}
            >
              <Text style={styles.primaryButtonText}>Duplicate Form</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Save as Template Modal */}
      <Modal
        visible={showTemplateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Save as Template</Text>
            <TouchableOpacity onPress={() => setShowTemplateModal(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Template Name</Text>
              <TextInput
                style={styles.textInput}
                value={templateData.name}
                onChangeText={(text) => setTemplateData(prev => ({ ...prev, name: text }))}
                placeholder="Enter template name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={templateData.description}
                onChangeText={(text) => setTemplateData(prev => ({ ...prev, description: text }))}
                placeholder="Enter template description"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <TextInput
                style={styles.textInput}
                value={templateData.category}
                onChangeText={(text) => setTemplateData(prev => ({ ...prev, category: text }))}
                placeholder="Enter category"
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={confirmSaveAsTemplate}
              disabled={!templateData.name.trim()}
            >
              <Text style={styles.primaryButtonText}>Save Template</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create from Template Modal */}
      <Modal
        visible={showCreateFromTemplateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create from Template</Text>
            <TouchableOpacity onPress={() => setShowCreateFromTemplateModal(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Form Title</Text>
              <TextInput
                style={styles.textInput}
                value={createFromTemplateData.title}
                onChangeText={(text) => setCreateFromTemplateData(prev => ({ ...prev, title: text }))}
                placeholder="Enter form title"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={createFromTemplateData.description}
                onChangeText={(text) => setCreateFromTemplateData(prev => ({ ...prev, description: text }))}
                placeholder="Enter form description"
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={confirmCreateFromTemplate}
              disabled={!createFromTemplateData.title.trim()}
            >
              <Text style={styles.primaryButtonText}>Create Form</Text>
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
  formsContainer: {
    gap: 16,
  },
  templatesContainer: {
    gap: 16,
  },
  formItem: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault + '20',
  },
  formContent: {
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  formDescription: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginBottom: 8,
  },
  formMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  formStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.tint,
  },
  formVersion: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  formResponses: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  formDate: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  formActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
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
  templateItem: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: `${Colors.light.tabIconDefault}20`,
  },
  templateContent: {
    flex: 1,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginBottom: 8,
  },
  templateCategory: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.tint,
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
    height: 80,
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