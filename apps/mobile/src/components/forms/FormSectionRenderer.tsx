import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/constants/theme'
import type { FormSection, FormField } from '@/types/forms'
import { FormFieldRenderer } from './FormFieldRenderer'

interface FormSectionRendererProps {
  section: FormSection
  sectionIndex: number
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
  onFieldReorder: (sectionId: string, fromIndex: number, toIndex: number) => void
}

export const FormSectionRenderer: React.FC<FormSectionRendererProps> = ({
  section,
  sectionIndex,
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
  onFieldReorder,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [titleValue, setTitleValue] = useState(section.title)
  const [descriptionValue, setDescriptionValue] = useState(section.description || '')

  const isSelected = selectedSection?.id === section.id

  const handleTitleSave = () => {
    onSectionUpdate(section.id, { title: titleValue })
    setIsEditingTitle(false)
  }

  const handleDescriptionSave = () => {
    onSectionUpdate(section.id, { description: descriptionValue || undefined })
    setIsEditingDescription(false)
  }

  const handleSectionPress = () => {
    if (!previewMode) {
      onSectionSelect(section)
    }
  }

  const renderSectionHeader = () => (
    <View style={[styles.sectionHeader, isSelected && styles.selectedSectionHeader]}>
      <TouchableOpacity
        style={styles.sectionTitleContainer}
        onPress={handleSectionPress}
        disabled={previewMode}
        activeOpacity={0.7}
      >
        <View style={styles.sectionInfo}>
          {isEditingTitle && !previewMode ? (
            <TextInput
              style={styles.titleInput}
              value={titleValue}
              onChangeText={setTitleValue}
              onBlur={handleTitleSave}
              onSubmitEditing={handleTitleSave}
              autoFocus
              selectTextOnFocus
            />
          ) : (
            <TouchableOpacity
              onPress={() => !previewMode && setIsEditingTitle(true)}
              disabled={previewMode}
            >
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </TouchableOpacity>
          )}

          {(section.description || isEditingDescription) && (
            <>
              {isEditingDescription && !previewMode ? (
                <TextInput
                  style={styles.descriptionInput}
                  value={descriptionValue}
                  onChangeText={setDescriptionValue}
                  onBlur={handleDescriptionSave}
                  onSubmitEditing={handleDescriptionSave}
                  placeholder="Add section description..."
                  multiline
                  autoFocus
                  selectTextOnFocus
                />
              ) : (
                <TouchableOpacity
                  onPress={() => !previewMode && setIsEditingDescription(true)}
                  disabled={previewMode}
                >
                  <Text style={styles.sectionDescription}>
                    {section.description || 'Add description...'}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {!previewMode && (
          <View style={styles.sectionActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setIsEditingDescription(true)}
              accessibilityLabel="Edit section description"
            >
              <Ionicons name="create-outline" size={20} color={Colors.light.tabIconDefault} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onSectionDelete(section.id)}
              accessibilityLabel="Delete section"
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </View>
  )

  const renderFields = () => (
    <View style={styles.fieldsContainer}>
      {section.fields.map((field, fieldIndex) => (
        <FormFieldRenderer
          key={field.id}
          field={field}
          fieldIndex={fieldIndex}
          sectionId={section.id}
          isSelected={selectedField?.id === field.id}
          previewMode={previewMode}
          onFieldSelect={onFieldSelect}
          onFieldUpdate={onFieldUpdate}
          onFieldDelete={onFieldDelete}
          onFieldDuplicate={onFieldDuplicate}
        />
      ))}

      {section.fields.length === 0 && !previewMode && (
        <View style={styles.emptyFieldsContainer}>
          <Ionicons name="add-circle-outline" size={32} color={Colors.light.tabIconDefault} />
          <Text style={styles.emptyFieldsText}>
            No fields yet. Drag fields from the palette or tap the + button to add fields.
          </Text>
        </View>
      )}
    </View>
  )

  return (
    <View style={[styles.container, isSelected && styles.selectedContainer]}>
      {renderSectionHeader()}
      {renderFields()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault + '20',
    backgroundColor: Colors.light.background,
    overflow: 'hidden',
  },
  selectedContainer: {
    borderColor: Colors.light.tint,
    borderWidth: 2,
  },
  sectionHeader: {
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tabIconDefault + '10',
  },
  selectedSectionHeader: {
    backgroundColor: Colors.light.tint + '05',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionInfo: {
    flex: 1,
    marginRight: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    lineHeight: 20,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tint,
    paddingVertical: 4,
    marginBottom: 4,
  },
  descriptionInput: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tint,
    paddingVertical: 4,
    minHeight: 40,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  fieldsContainer: {
    padding: 16,
  },
  emptyFieldsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.light.tabIconDefault + '20',
    borderStyle: 'dashed',
    backgroundColor: Colors.light.tabIconDefault + '05',
  },
  emptyFieldsText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
})