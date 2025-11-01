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
import type { FormField, FormFieldType } from '@/types/forms'
import { formService } from '@/services/formService'

interface FormFieldRendererProps {
  field: FormField
  fieldIndex: number
  sectionId: string
  isSelected: boolean
  previewMode: boolean
  onFieldSelect: (field: FormField) => void
  onFieldUpdate: (sectionId: string, fieldId: string, updates: Partial<FormField>) => void
  onFieldDelete: (sectionId: string, fieldId: string) => void
  onFieldDuplicate: (sectionId: string, fieldId: string) => void
}

export const FormFieldRenderer: React.FC<FormFieldRendererProps> = ({
  field,
  fieldIndex,
  sectionId,
  isSelected,
  previewMode,
  onFieldSelect,
  onFieldUpdate,
  onFieldDelete,
  onFieldDuplicate,
}) => {
  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const [labelValue, setLabelValue] = useState(field.label)

  const handleFieldPress = () => {
    if (!previewMode) {
      onFieldSelect(field)
    }
  }

  const handleLabelSave = () => {
    onFieldUpdate(sectionId, field.id, { label: labelValue })
    setIsEditingLabel(false)
  }

  const handleRequiredToggle = () => {
    onFieldUpdate(sectionId, field.id, { required: !field.required })
  }

  const getFieldIcon = () => {
    const iconName = formService.getFieldTypeIcon(field.fieldType)
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      'text-fields': 'text',
      'subject': 'document-text',
      'email': 'mail',
      'phone': 'call',
      'looks-one': 'calculator',
      'event': 'calendar',
      'access-time': 'time',
      'arrow-drop-down': 'chevron-down',
      'radio-button-checked': 'radio-button-on',
      'check-box': 'checkbox',
      'linear-scale': 'stats-chart',
      'cloud-upload': 'cloud-upload',
      'image': 'image',
      'horizontal-rule': 'remove',
    }
    return iconMap[iconName] || 'help-circle'
  }

  const renderFieldPreview = () => {
    switch (field.fieldType) {
      case FormFieldType.ShortText:
      case FormFieldType.Email:
      case FormFieldType.Phone:
        return (
          <TextInput
            style={styles.previewInput}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
            editable={false}
            pointerEvents="none"
          />
        )

      case FormFieldType.LongText:
        return (
          <TextInput
            style={[styles.previewInput, styles.previewTextArea]}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
            multiline
            numberOfLines={4}
            editable={false}
            pointerEvents="none"
          />
        )

      case FormFieldType.Number:
        return (
          <TextInput
            style={styles.previewInput}
            placeholder="0"
            keyboardType="numeric"
            editable={false}
            pointerEvents="none"
          />
        )

      case FormFieldType.Date:
        return (
          <View style={styles.previewDatePicker}>
            <Ionicons name="calendar" size={20} color={Colors.light.tabIconDefault} />
            <Text style={styles.previewDateText}>Select date</Text>
          </View>
        )

      case FormFieldType.Time:
        return (
          <View style={styles.previewDatePicker}>
            <Ionicons name="time" size={20} color={Colors.light.tabIconDefault} />
            <Text style={styles.previewDateText}>Select time</Text>
          </View>
        )

      case FormFieldType.Dropdown:
        return (
          <View style={styles.previewDropdown}>
            <Text style={styles.previewDropdownText}>
              {field.options.length > 0 ? 'Choose an option' : 'No options available'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={Colors.light.tabIconDefault} />
          </View>
        )

      case FormFieldType.MultipleChoice:
        return (
          <View style={styles.previewOptions}>
            {field.options.slice(0, 3).map((option, index) => (
              <View key={option.id} style={styles.previewOption}>
                <Ionicons name="radio-button-off" size={20} color={Colors.light.tabIconDefault} />
                <Text style={styles.previewOptionText}>{option.label}</Text>
              </View>
            ))}
            {field.options.length > 3 && (
              <Text style={styles.previewMoreOptions}>
                +{field.options.length - 3} more options
              </Text>
            )}
          </View>
        )

      case FormFieldType.Checkboxes:
        return (
          <View style={styles.previewOptions}>
            {field.options.slice(0, 3).map((option, index) => (
              <View key={option.id} style={styles.previewOption}>
                <Ionicons name="square-outline" size={20} color={Colors.light.tabIconDefault} />
                <Text style={styles.previewOptionText}>{option.label}</Text>
              </View>
            ))}
            {field.options.length > 3 && (
              <Text style={styles.previewMoreOptions}>
                +{field.options.length - 3} more options
              </Text>
            )}
          </View>
        )

      case FormFieldType.LinearScale:
        return (
          <View style={styles.previewScale}>
            <Text style={styles.previewScaleLabel}>
              {field.properties.scaleMinLabel || field.properties.scaleMin}
            </Text>
            <View style={styles.previewScaleOptions}>
              {Array.from({ length: (field.properties.scaleMax || 5) - (field.properties.scaleMin || 1) + 1 }, (_, i) => (
                <View key={i} style={styles.previewScaleOption}>
                  <Text style={styles.previewScaleNumber}>
                    {(field.properties.scaleMin || 1) + i}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={styles.previewScaleLabel}>
              {field.properties.scaleMaxLabel || field.properties.scaleMax}
            </Text>
          </View>
        )

      case FormFieldType.FileUpload:
      case FormFieldType.ImageUpload:
        return (
          <View style={styles.previewFileUpload}>
            <Ionicons name="cloud-upload" size={24} color={Colors.light.tabIconDefault} />
            <Text style={styles.previewFileUploadText}>
              {field.fieldType === FormFieldType.ImageUpload ? 'Upload images' : 'Upload files'}
            </Text>
          </View>
        )

      case FormFieldType.SectionBreak:
        return (
          <View style={styles.previewSectionBreak}>
            <View style={styles.previewSectionBreakLine} />
          </View>
        )

      default:
        return (
          <View style={styles.previewPlaceholder}>
            <Text style={styles.previewPlaceholderText}>
              {formService.getFieldTypeDisplayName(field.fieldType)} field
            </Text>
          </View>
        )
    }
  }

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={handleFieldPress}
      activeOpacity={0.7}
      disabled={previewMode}
    >
      {/* Field Header */}
      <View style={styles.fieldHeader}>
        <View style={styles.fieldIcon}>
          <Ionicons
            name={getFieldIcon()}
            size={16}
            color={isSelected ? Colors.light.background : Colors.light.tint}
          />
        </View>

        <View style={styles.fieldInfo}>
          {isEditingLabel && !previewMode ? (
            <TextInput
              style={styles.labelInput}
              value={labelValue}
              onChangeText={setLabelValue}
              onBlur={handleLabelSave}
              onSubmitEditing={handleLabelSave}
              autoFocus
              selectTextOnFocus
            />
          ) : (
            <TouchableOpacity
              onPress={() => !previewMode && setIsEditingLabel(true)}
              disabled={previewMode}
            >
              <Text style={styles.fieldLabel}>
                {field.label}
                {field.required && <Text style={styles.requiredAsterisk}> *</Text>}
              </Text>
            </TouchableOpacity>
          )}

          <Text style={styles.fieldType}>
            {formService.getFieldTypeDisplayName(field.fieldType)}
          </Text>
        </View>

        {!previewMode && (
          <View style={styles.fieldActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleRequiredToggle}
              accessibilityLabel={`Toggle required field`}
            >
              <Ionicons
                name={field.required ? 'star' : 'star-outline'}
                size={16}
                color={field.required ? '#f59e0b' : Colors.light.tabIconDefault}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onFieldDuplicate(sectionId, field.id)}
              accessibilityLabel="Duplicate field"
            >
              <Ionicons name="copy-outline" size={16} color={Colors.light.tabIconDefault} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onFieldDelete(sectionId, field.id)}
              accessibilityLabel="Delete field"
            >
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Field Description */}
      {field.description && (
        <Text style={styles.fieldDescription}>{field.description}</Text>
      )}

      {/* Field Preview */}
      <View style={styles.fieldPreview}>
        {renderFieldPreview()}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault + '20',
    backgroundColor: Colors.light.background,
  },
  selectedContainer: {
    borderColor: Colors.light.tint,
    borderWidth: 2,
    backgroundColor: Colors.light.tint + '05',
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fieldIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fieldInfo: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 2,
  },
  requiredAsterisk: {
    color: '#ef4444',
  },
  fieldType: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  labelInput: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tint,
    paddingVertical: 2,
    marginBottom: 2,
  },
  fieldActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 6,
    marginLeft: 4,
  },
  fieldDescription: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginBottom: 12,
    lineHeight: 18,
  },
  fieldPreview: {
    marginTop: 8,
  },
  previewInput: {
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault + '30',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    backgroundColor: Colors.light.tabIconDefault + '05',
  },
  previewTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  previewDatePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault + '30',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.light.tabIconDefault + '05',
  },
  previewDateText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    marginLeft: 8,
  },
  previewDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault + '30',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.light.tabIconDefault + '05',
  },
  previewDropdownText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
  previewOptions: {
    gap: 8,
  },
  previewOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewOptionText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    marginLeft: 8,
  },
  previewMoreOptions: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    fontStyle: 'italic',
    marginLeft: 28,
  },
  previewScale: {
    alignItems: 'center',
  },
  previewScaleOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 12,
  },
  previewScaleOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault + '30',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tabIconDefault + '05',
  },
  previewScaleNumber: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    fontWeight: '500',
  },
  previewScaleLabel: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  previewFileUpload: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.light.tabIconDefault + '30',
    borderStyle: 'dashed',
    borderRadius: 6,
    paddingVertical: 24,
    backgroundColor: Colors.light.tabIconDefault + '05',
  },
  previewFileUploadText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    marginTop: 8,
  },
  previewSectionBreak: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  previewSectionBreakLine: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.light.tabIconDefault + '30',
  },
  previewPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault + '30',
    borderRadius: 6,
    backgroundColor: Colors.light.tabIconDefault + '05',
  },
  previewPlaceholderText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
})