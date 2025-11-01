import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/constants/theme'
import type { FormField, FormSection, FieldOption, FormFieldType } from '@/types/forms'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { formService } from '@/services/formService'

interface FieldPropertiesPanelProps {
  field: FormField | null
  section: FormSection | null
  onFieldUpdate: (sectionId: string, fieldId: string, updates: Partial<FormField>) => void
  onSectionUpdate: (sectionId: string, updates: Partial<FormSection>) => void
  onClose: () => void
}

export const FieldPropertiesPanel: React.FC<FieldPropertiesPanelProps> = ({
  field,
  section,
  onFieldUpdate,
  onSectionUpdate,
  onClose,
}) => {
  const [localField, setLocalField] = useState<FormField | null>(field)
  const [localSection, setLocalSection] = useState<FormSection | null>(section)

  React.useEffect(() => {
    setLocalField(field)
    setLocalSection(section)
  }, [field, section])

  const handleFieldUpdate = (updates: Partial<FormField>) => {
    if (!localField || !section) return
    
    const updatedField = { ...localField, ...updates }
    setLocalField(updatedField)
    onFieldUpdate(section.id, localField.id, updates)
  }

  const handleSectionUpdate = (updates: Partial<FormSection>) => {
    if (!localSection) return
    
    const updatedSection = { ...localSection, ...updates }
    setLocalSection(updatedSection)
    onSectionUpdate(localSection.id, updates)
  }

  const addOption = () => {
    if (!localField) return

    const newOption: FieldOption = {
      id: `option_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      label: `Option ${localField.options.length + 1}`,
      value: `option${localField.options.length + 1}`,
      isOther: false,
      order: localField.options.length,
    }

    handleFieldUpdate({
      options: [...localField.options, newOption],
    })
  }

  const updateOption = (optionId: string, updates: Partial<FieldOption>) => {
    if (!localField) return

    const updatedOptions = localField.options.map(option =>
      option.id === optionId ? { ...option, ...updates } : option
    )

    handleFieldUpdate({ options: updatedOptions })
  }

  const deleteOption = (optionId: string) => {
    if (!localField) return

    const updatedOptions = localField.options.filter(option => option.id !== optionId)
    handleFieldUpdate({ options: updatedOptions })
  }

  const renderFieldProperties = () => {
    if (!localField) return null

    const supportsOptions = formService.fieldTypeSupportsOptions(localField.fieldType)
    const supportsValidation = formService.fieldTypeSupportsValidation(localField.fieldType)

    return (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Basic Properties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Properties</Text>
          
          <Input
            label="Field Label"
            value={localField.label}
            onChangeText={(text) => handleFieldUpdate({ label: text })}
            placeholder="Enter field label"
          />

          <Input
            label="Description (Optional)"
            value={localField.description || ''}
            onChangeText={(text) => handleFieldUpdate({ description: text || undefined })}
            placeholder="Add field description"
            multiline
            numberOfLines={3}
          />

          <Input
            label="Placeholder (Optional)"
            value={localField.placeholder || ''}
            onChangeText={(text) => handleFieldUpdate({ placeholder: text || undefined })}
            placeholder="Enter placeholder text"
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Required Field</Text>
            <Switch
              value={localField.required}
              onValueChange={(value) => handleFieldUpdate({ required: value })}
              trackColor={{ false: Colors.light.tabIconDefault + '30', true: Colors.light.tint + '30' }}
              thumbColor={localField.required ? Colors.light.tint : Colors.light.background}
            />
          </View>
        </View>

        {/* Options (for selection fields) */}
        {supportsOptions && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Options</Text>
              <Button
                title="Add Option"
                onPress={addOption}
                size="small"
                variant="outline"
              />
            </View>

            {localField.options.map((option, index) => (
              <View key={option.id} style={styles.optionRow}>
                <View style={styles.optionInputs}>
                  <Input
                    label={`Option ${index + 1} Label`}
                    value={option.label}
                    onChangeText={(text) => updateOption(option.id, { label: text })}
                    placeholder="Option label"
                    containerStyle={styles.optionInput}
                  />
                  <Input
                    label="Value"
                    value={option.value}
                    onChangeText={(text) => updateOption(option.id, { value: text })}
                    placeholder="Option value"
                    containerStyle={styles.optionInput}
                  />
                </View>
                <TouchableOpacity
                  style={styles.deleteOptionButton}
                  onPress={() => deleteOption(option.id)}
                  accessibilityLabel="Delete option"
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}

            {localField.options.length === 0 && (
              <View style={styles.emptyOptions}>
                <Text style={styles.emptyOptionsText}>No options added yet</Text>
                <Button
                  title="Add First Option"
                  onPress={addOption}
                  size="small"
                />
              </View>
            )}

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Allow "Other" Option</Text>
              <Switch
                value={localField.properties.allowOther}
                onValueChange={(value) => handleFieldUpdate({
                  properties: { ...localField.properties, allowOther: value }
                })}
                trackColor={{ false: Colors.light.tabIconDefault + '30', true: Colors.light.tint + '30' }}
                thumbColor={localField.properties.allowOther ? Colors.light.tint : Colors.light.background}
              />
            </View>
          </View>
        )}

        {/* Scale Properties (for LinearScale) */}
        {localField.fieldType === FormFieldType.LinearScale && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scale Properties</Text>
            
            <View style={styles.scaleRow}>
              <Input
                label="Minimum Value"
                value={localField.properties.scaleMin?.toString() || '1'}
                onChangeText={(text) => handleFieldUpdate({
                  properties: { ...localField.properties, scaleMin: parseInt(text) || 1 }
                })}
                keyboardType="numeric"
                containerStyle={styles.scaleInput}
              />
              <Input
                label="Maximum Value"
                value={localField.properties.scaleMax?.toString() || '5'}
                onChangeText={(text) => handleFieldUpdate({
                  properties: { ...localField.properties, scaleMax: parseInt(text) || 5 }
                })}
                keyboardType="numeric"
                containerStyle={styles.scaleInput}
              />
            </View>

            <Input
              label="Minimum Label (Optional)"
              value={localField.properties.scaleMinLabel || ''}
              onChangeText={(text) => handleFieldUpdate({
                properties: { ...localField.properties, scaleMinLabel: text || undefined }
              })}
              placeholder="e.g., Strongly Disagree"
            />

            <Input
              label="Maximum Label (Optional)"
              value={localField.properties.scaleMaxLabel || ''}
              onChangeText={(text) => handleFieldUpdate({
                properties: { ...localField.properties, scaleMaxLabel: text || undefined }
              })}
              placeholder="e.g., Strongly Agree"
            />
          </View>
        )}

        {/* Validation Rules */}
        {supportsValidation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Validation Rules</Text>
            
            {[FormFieldType.ShortText, FormFieldType.LongText].includes(localField.fieldType) && (
              <>
                <Input
                  label="Minimum Length"
                  value={localField.validation?.minLength?.toString() || ''}
                  onChangeText={(text) => handleFieldUpdate({
                    validation: {
                      ...localField.validation,
                      minLength: text ? parseInt(text) : undefined,
                      required: localField.validation?.required || false,
                      fileTypes: localField.validation?.fileTypes || [],
                    }
                  })}
                  keyboardType="numeric"
                  placeholder="0"
                />

                <Input
                  label="Maximum Length"
                  value={localField.validation?.maxLength?.toString() || ''}
                  onChangeText={(text) => handleFieldUpdate({
                    validation: {
                      ...localField.validation,
                      maxLength: text ? parseInt(text) : undefined,
                      required: localField.validation?.required || false,
                      fileTypes: localField.validation?.fileTypes || [],
                    }
                  })}
                  keyboardType="numeric"
                  placeholder="No limit"
                />
              </>
            )}

            {localField.fieldType === FormFieldType.Number && (
              <>
                <Input
                  label="Minimum Value"
                  value={localField.validation?.minValue?.toString() || ''}
                  onChangeText={(text) => handleFieldUpdate({
                    validation: {
                      ...localField.validation,
                      minValue: text ? parseFloat(text) : undefined,
                      required: localField.validation?.required || false,
                      fileTypes: localField.validation?.fileTypes || [],
                    }
                  })}
                  keyboardType="numeric"
                  placeholder="No minimum"
                />

                <Input
                  label="Maximum Value"
                  value={localField.validation?.maxValue?.toString() || ''}
                  onChangeText={(text) => handleFieldUpdate({
                    validation: {
                      ...localField.validation,
                      maxValue: text ? parseFloat(text) : undefined,
                      required: localField.validation?.required || false,
                      fileTypes: localField.validation?.fileTypes || [],
                    }
                  })}
                  keyboardType="numeric"
                  placeholder="No maximum"
                />
              </>
            )}

            <Input
              label="Custom Error Message"
              value={localField.validation?.customMessage || ''}
              onChangeText={(text) => handleFieldUpdate({
                validation: {
                  ...localField.validation,
                  customMessage: text || undefined,
                  required: localField.validation?.required || false,
                  fileTypes: localField.validation?.fileTypes || [],
                }
              })}
              placeholder="Enter custom validation message"
              multiline
              numberOfLines={2}
            />
          </View>
        )}

        {/* Advanced Properties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced Properties</Text>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Shuffle Options</Text>
            <Switch
              value={localField.properties.shuffleOptions}
              onValueChange={(value) => handleFieldUpdate({
                properties: { ...localField.properties, shuffleOptions: value }
              })}
              trackColor={{ false: Colors.light.tabIconDefault + '30', true: Colors.light.tint + '30' }}
              thumbColor={localField.properties.shuffleOptions ? Colors.light.tint : Colors.light.background}
              disabled={!supportsOptions}
            />
          </View>
        </View>
      </ScrollView>
    )
  }

  const renderSectionProperties = () => {
    if (!localSection) return null

    return (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Section Properties</Text>
          
          <Input
            label="Section Title"
            value={localSection.title}
            onChangeText={(text) => handleSectionUpdate({ title: text })}
            placeholder="Enter section title"
          />

          <Input
            label="Description (Optional)"
            value={localSection.description || ''}
            onChangeText={(text) => handleSectionUpdate({ description: text || undefined })}
            placeholder="Add section description"
            multiline
            numberOfLines={3}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Repeatable Section</Text>
            <Switch
              value={localSection.isRepeatable}
              onValueChange={(value) => handleSectionUpdate({ isRepeatable: value })}
              trackColor={{ false: Colors.light.tabIconDefault + '30', true: Colors.light.tint + '30' }}
              thumbColor={localSection.isRepeatable ? Colors.light.tint : Colors.light.background}
            />
          </View>
        </View>
      </ScrollView>
    )
  }

  if (!field && !section) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Properties</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="settings-outline" size={48} color={Colors.light.tabIconDefault} />
          <Text style={styles.emptyStateText}>
            Select a field or section to edit its properties
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {field ? 'Field Properties' : 'Section Properties'}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      {field ? renderFieldProperties() : renderSectionProperties()}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tabIconDefault + '20',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: Colors.light.text,
    flex: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  optionInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  optionInput: {
    flex: 1,
    marginBottom: 0,
  },
  deleteOptionButton: {
    padding: 8,
    marginLeft: 8,
    marginBottom: 16,
  },
  emptyOptions: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault + '20',
    borderStyle: 'dashed',
    backgroundColor: Colors.light.tabIconDefault + '05',
  },
  emptyOptionsText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    marginBottom: 16,
  },
  scaleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  scaleInput: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
})