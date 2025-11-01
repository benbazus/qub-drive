import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native'
import { Colors } from '@/constants/theme'
import type { FormFieldType } from '@/types/forms'
import { useFormBuilder } from '@/hooks/useFormBuilder'
import { FieldPalette } from './FieldPalette'
import { FormCanvas } from './FormCanvas'
import { FieldPropertiesPanel } from './FieldPropertiesPanel'
import { FormBuilderToolbar } from './FormBuilderToolbar'

interface FormBuilderProps {
  formId?: string
  onSave?: () => void
  onPublish?: () => void
  onPreview?: () => void
}

const { width: screenWidth } = Dimensions.get('window')
const PANEL_WIDTH = screenWidth * 0.3
const MIN_PANEL_WIDTH = 280

export const FormBuilder: React.FC<FormBuilderProps> = ({
  formId,
  onSave,
  onPublish,
  onPreview,
}) => {
  const [showFieldPalette, setShowFieldPalette] = useState(true)
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false)

  const {
    form,
    selectedField,
    selectedSection,
    previewMode,
    unsavedChanges,
    loading,
    error,
    saveForm,
    addSection,
    updateSection,
    deleteSection,
    addField,
    updateField,
    deleteField,
    duplicateField,
    selectField,
    selectSection,
    togglePreviewMode,
    validateForm,
    publishForm,
    getShareLink,
    fieldTemplates,
  } = useFormBuilder(formId)

  const handleFieldSelect = (fieldType: FormFieldType) => {
    if (!form || form.sections.length === 0) {
      Alert.alert('No Section', 'Please add a section first before adding fields.')
      return
    }

    // Add field to the first section or selected section
    const targetSection = selectedSection || form.sections[0]
    addField(targetSection.id, fieldType)
    setShowPropertiesPanel(true)
  }

  const handleFieldSelectFromCanvas = (field: any) => {
    selectField(field)
    setShowPropertiesPanel(true)
  }

  const handleSectionSelectFromCanvas = (section: any) => {
    selectSection(section)
    setShowPropertiesPanel(true)
  }

  const handleSave = async () => {
    try {
      await saveForm()
      onSave?.()
      Alert.alert('Success', 'Form saved successfully!')
    } catch (error) {
      Alert.alert('Error', 'Failed to save form. Please try again.')
    }
  }

  const handlePublish = async () => {
    const errors = validateForm()
    if (errors.length > 0) {
      Alert.alert(
        'Validation Errors',
        `Please fix the following issues:\n\n${errors.join('\n')}`,
        [{ text: 'OK' }]
      )
      return
    }

    try {
      await publishForm()
      onPublish?.()
      Alert.alert('Success', 'Form published successfully!')
    } catch (error) {
      Alert.alert('Error', 'Failed to publish form. Please try again.')
    }
  }

  const handlePreview = () => {
    togglePreviewMode()
    onPreview?.()
  }

  const handleShare = async () => {
    if (!form) return

    try {
      const shareData = await getShareLink()
      if (shareData) {
        Alert.alert(
          'Share Form',
          `Share this link with others:\n\n${shareData.url}`,
          [
            { text: 'Copy Link', onPress: () => {
              // In a real app, you would copy to clipboard
              Alert.alert('Copied', 'Link copied to clipboard!')
            }},
            { text: 'Close', style: 'cancel' },
          ]
        )
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get share link. Please try again.')
    }
  }

  const handleCloseProperties = () => {
    setShowPropertiesPanel(false)
    selectField(null)
    selectSection(null)
  }

  const panelWidth = Math.max(PANEL_WIDTH, MIN_PANEL_WIDTH)
  const canvasWidth = screenWidth - (showFieldPalette ? panelWidth : 0) - (showPropertiesPanel ? panelWidth : 0)

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <FormBuilderToolbar
        form={form}
        previewMode={previewMode}
        unsavedChanges={unsavedChanges}
        loading={loading}
        onSave={handleSave}
        onPublish={handlePublish}
        onPreview={handlePreview}
        onShare={handleShare}
        onToggleFieldPalette={() => setShowFieldPalette(!showFieldPalette)}
        onTogglePropertiesPanel={() => setShowPropertiesPanel(!showPropertiesPanel)}
        showFieldPalette={showFieldPalette}
        showPropertiesPanel={showPropertiesPanel}
      />

      <View style={styles.content}>
        {/* Field Palette */}
        {showFieldPalette && (
          <View style={[styles.panel, { width: panelWidth }]}>
            <FieldPalette
              fieldTemplates={fieldTemplates}
              onFieldSelect={handleFieldSelect}
            />
          </View>
        )}

        {/* Form Canvas */}
        <View style={[styles.canvas, { width: canvasWidth }]}>
          <FormCanvas
            form={form}
            selectedField={selectedField}
            selectedSection={selectedSection}
            previewMode={previewMode}
            onFieldSelect={handleFieldSelectFromCanvas}
            onSectionSelect={handleSectionSelectFromCanvas}
            onFieldUpdate={updateField}
            onFieldDelete={deleteField}
            onFieldDuplicate={duplicateField}
            onSectionUpdate={updateSection}
            onSectionDelete={deleteSection}
            onAddSection={addSection}
            onFieldReorder={(sectionId, fromIndex, toIndex) => {
              // TODO: Implement field reordering
              console.log('Reorder fields:', sectionId, fromIndex, toIndex)
            }}
          />
        </View>

        {/* Properties Panel */}
        {showPropertiesPanel && (
          <View style={[styles.panel, { width: panelWidth }]}>
            <FieldPropertiesPanel
              field={selectedField}
              section={selectedSection}
              onFieldUpdate={updateField}
              onSectionUpdate={updateSection}
              onClose={handleCloseProperties}
            />
          </View>
        )}
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
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
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  panel: {
    borderRightWidth: 1,
    borderRightColor: Colors.light.tabIconDefault + '20',
    backgroundColor: Colors.light.background,
  },
  canvas: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  errorContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    zIndex: 1000,
  },
  errorText: {
    color: Colors.light.background,
    fontSize: 14,
    textAlign: 'center',
  },
})