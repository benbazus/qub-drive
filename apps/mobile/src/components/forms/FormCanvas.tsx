import React from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/constants/theme'
import type { Form, FormSection, FormField } from '@/types/forms'
import { FormSectionRenderer } from './FormSectionRenderer'
import { Button } from '@/components/ui/Button'

interface FormCanvasProps {
  form: Form | null
  selectedField: FormField | null
  selectedSection: FormSection | null
  previewMode: boolean
  onFieldSelect: (field: FormField) => void
  onSectionSelect: (section: FormSection) => void
  onFieldUpdate: (sectionId: string, fieldId: string, updates: Partial<FormField>) => void
  onFieldDelete: (sectionId: string, fieldId: string) => void
  onFieldDuplicate: (sectionId: string, fieldId: string) => void
  onSectionUpdate: (sectionId: string, updates: Partial<FormSection>) => void
  onSectionDelete: (sectionId: string) => void
  onAddSection: () => void
  onFieldReorder: (sectionId: string, fromIndex: number, toIndex: number) => void
}

export const FormCanvas: React.FC<FormCanvasProps> = ({
  form,
  selectedField,
  selectedSection,
  previewMode,
  onFieldSelect,
  onSectionSelect,
  onFieldUpdate,
  onFieldDelete,
  onFieldDuplicate,
  onSectionUpdate,
  onSectionDelete,
  onAddSection,
  onFieldReorder,
}) => {
  if (!form) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-outline" size={64} color={Colors.light.tabIconDefault} />
        <Text style={styles.emptyTitle}>No Form Selected</Text>
        <Text style={styles.emptySubtitle}>Create a new form to get started</Text>
      </View>
    )
  }

  const handleSectionDelete = (sectionId: string) => {
    const section = form.sections.find(s => s.id === sectionId)
    if (!section) return

    if (section.fields.length > 0) {
      Alert.alert(
        'Delete Section',
        `Are you sure you want to delete "${section.title}"? This will also delete all ${section.fields.length} field(s) in this section.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => onSectionDelete(sectionId) },
        ]
      )
    } else {
      onSectionDelete(sectionId)
    }
  }

  const handleFieldDelete = (sectionId: string, fieldId: string) => {
    const section = form.sections.find(s => s.id === sectionId)
    const field = section?.fields.find(f => f.id === fieldId)
    if (!field) return

    Alert.alert(
      'Delete Field',
      `Are you sure you want to delete "${field.label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onFieldDelete(sectionId, fieldId) },
      ]
    )
  }

  return (
    <View style={styles.container}>
      {/* Form Header */}
      <View style={styles.formHeader}>
        <View style={styles.formTitleContainer}>
          <Text style={styles.formTitle}>{form.title}</Text>
          {form.description && (
            <Text style={styles.formDescription}>{form.description}</Text>
          )}
        </View>
        <View style={styles.formStatus}>
          <View style={[styles.statusBadge, styles[`status${form.status}`]]}>
            <Text style={[styles.statusText, styles[`status${form.status}Text`]]}>
              {form.status}
            </Text>
          </View>
        </View>
      </View>

      {/* Form Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContent}>
          {form.sections.map((section, sectionIndex) => (
            <FormSectionRenderer
              key={section.id}
              section={section}
              sectionIndex={sectionIndex}
              selectedField={selectedField}
              selectedSection={selectedSection}
              previewMode={previewMode}
              onFieldSelect={onFieldSelect}
              onSectionSelect={onSectionSelect}
              onFieldUpdate={onFieldUpdate}
              onFieldDelete={handleFieldDelete}
              onFieldDuplicate={onFieldDuplicate}
              onSectionUpdate={onSectionUpdate}
              onSectionDelete={handleSectionDelete}
              onFieldReorder={onFieldReorder}
            />
          ))}

          {/* Add Section Button */}
          {!previewMode && (
            <TouchableOpacity
              style={styles.addSectionButton}
              onPress={onAddSection}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Add new section"
            >
              <Ionicons name="add-circle-outline" size={24} color={Colors.light.tint} />
              <Text style={styles.addSectionText}>Add Section</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Empty State for Sections */}
      {form.sections.length === 0 && (
        <View style={styles.emptySectionsContainer}>
          <Ionicons name="layers-outline" size={48} color={Colors.light.tabIconDefault} />
          <Text style={styles.emptySectionsTitle}>No Sections Yet</Text>
          <Text style={styles.emptySectionsSubtitle}>
            Add your first section to start building your form
          </Text>
          <Button
            title="Add Section"
            onPress={onAddSection}
            style={styles.addFirstSectionButton}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tabIconDefault + '20',
    backgroundColor: Colors.light.background,
  },
  formTitleContainer: {
    flex: 1,
    marginRight: 16,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  formDescription: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    lineHeight: 22,
  },
  formStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusDraft: {
    backgroundColor: Colors.light.tabIconDefault + '10',
    borderColor: Colors.light.tabIconDefault + '30',
  },
  statusDraftText: {
    color: Colors.light.tabIconDefault,
  },
  statusPublished: {
    backgroundColor: '#10b981' + '10',
    borderColor: '#10b981' + '30',
  },
  statusPublishedText: {
    color: '#10b981',
  },
  statusPaused: {
    backgroundColor: '#f59e0b' + '10',
    borderColor: '#f59e0b' + '30',
  },
  statusPausedText: {
    color: '#f59e0b',
  },
  statusClosed: {
    backgroundColor: '#ef4444' + '10',
    borderColor: '#ef4444' + '30',
  },
  statusClosedText: {
    color: '#ef4444',
  },
  scrollView: {
    flex: 1,
  },
  formContent: {
    padding: 16,
  },
  addSectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.light.tint,
    borderStyle: 'dashed',
    backgroundColor: Colors.light.tint + '05',
  },
  addSectionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.tint,
    marginLeft: 8,
  },
  emptySectionsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptySectionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySectionsSubtitle: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    marginBottom: 24,
  },
  addFirstSectionButton: {
    minWidth: 150,
  },
})