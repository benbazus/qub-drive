import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/constants/theme'
import type { Form, FormResponse, FieldValue, ResponseStatus } from '@/types/forms'
import { formsApi } from '@/services/api/formsApi'
import { FormFieldRenderer } from './FormFieldRenderer'

interface FormResponseCollectorProps {
  form: Form
  responseId?: string // For editing existing responses
  onSubmit?: (response: FormResponse) => void
  onSaveDraft?: (response: FormResponse) => void
  onCancel?: () => void
}

export const FormResponseCollector: React.FC<FormResponseCollectorProps> = ({
  form,
  responseId,
  onSubmit,
  onSaveDraft,
  onCancel,
}) => {
  const [responses, setResponses] = useState<Record<string, FieldValue>>({})
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [existingResponse, setExistingResponse] = useState<FormResponse | null>(null)

  useEffect(() => {
    if (responseId) {
      loadExistingResponse()
    }
  }, [responseId])

  const loadExistingResponse = async () => {
    if (!responseId) return

    try {
      setLoading(true)
      const response = await formsApi.getFormResponse(form.id, responseId)
      setExistingResponse(response)
      setResponses(response.responses)
    } catch (error) {
      Alert.alert('Error', 'Failed to load existing response')
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (fieldId: string, value: FieldValue) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value,
    }))

    // Clear validation error for this field
    if (validationErrors[fieldId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }

  const validateCurrentSection = (): boolean => {
    const currentSection = form.sections[currentSectionIndex]
    const errors: Record<string, string> = {}
    let isValid = true

    currentSection.fields.forEach(field => {
      const value = responses[field.id]
      
      // Check required fields
      if (field.required && (!value || (typeof value === 'object' && 'value' in value && !value.value))) {
        errors[field.id] = `${field.label} is required`
        isValid = false
      }

      // Field-specific validation
      if (value && field.validation) {
        const validation = field.validation
        
        if (value.type === 'text' && typeof value.value === 'string') {
          if (validation.minLength && value.value.length < validation.minLength) {
            errors[field.id] = `${field.label} must be at least ${validation.minLength} characters`
            isValid = false
          }
          if (validation.maxLength && value.value.length > validation.maxLength) {
            errors[field.id] = `${field.label} must be no more than ${validation.maxLength} characters`
            isValid = false
          }
          if (validation.pattern && !new RegExp(validation.pattern).test(value.value)) {
            errors[field.id] = validation.customMessage || `${field.label} format is invalid`
            isValid = false
          }
        }

        if (value.type === 'number' && typeof value.value === 'number') {
          if (validation.minValue !== undefined && value.value < validation.minValue) {
            errors[field.id] = `${field.label} must be at least ${validation.minValue}`
            isValid = false
          }
          if (validation.maxValue !== undefined && value.value > validation.maxValue) {
            errors[field.id] = `${field.label} must be no more than ${validation.maxValue}`
            isValid = false
          }
        }
      }
    })

    setValidationErrors(errors)
    return isValid
  }

  const handleNext = () => {
    if (!validateCurrentSection()) {
      Alert.alert('Validation Error', 'Please fix the errors before continuing')
      return
    }

    if (currentSectionIndex < form.sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1)
    }
  }

  const handleSaveDraft = async () => {
    try {
      setSubmitting(true)
      
      const responseData = {
        responses,
        saveAsDraft: true,
      }

      let response: FormResponse
      if (existingResponse) {
        response = await formsApi.updateFormResponse(form.id, existingResponse.id, responseData)
      } else {
        response = await formsApi.submitFormResponse(form.id, responseData)
      }

      onSaveDraft?.(response)
      Alert.alert('Success', 'Draft saved successfully')
    } catch (error) {
      Alert.alert('Error', 'Failed to save draft')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    // Validate all sections
    let allValid = true
    for (let i = 0; i < form.sections.length; i++) {
      setCurrentSectionIndex(i)
      if (!validateCurrentSection()) {
        allValid = false
        break
      }
    }

    if (!allValid) {
      Alert.alert('Validation Error', 'Please fix all errors before submitting')
      return
    }

    try {
      setSubmitting(true)
      
      const responseData = {
        responses,
        saveAsDraft: false,
      }

      let response: FormResponse
      if (existingResponse) {
        response = await formsApi.updateFormResponse(form.id, existingResponse.id, responseData)
      } else {
        response = await formsApi.submitFormResponse(form.id, responseData)
      }

      onSubmit?.(response)
      Alert.alert('Success', 'Form submitted successfully!')
    } catch (error) {
      Alert.alert('Error', 'Failed to submit form')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Loading form...</Text>
      </View>
    )
  }

  const currentSection = form.sections[currentSectionIndex]
  const progress = ((currentSectionIndex + 1) / form.sections.length) * 100
  const isLastSection = currentSectionIndex === form.sections.length - 1
  const isFirstSection = currentSectionIndex === 0

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.formTitle}>{form.title}</Text>
          {form.description && (
            <Text style={styles.formDescription}>{form.description}</Text>
          )}
        </View>
        {onCancel && (
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.light.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Bar */}
      {form.settings.showProgressBar && form.sections.length > 1 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Section {currentSectionIndex + 1} of {form.sections.length}
          </Text>
        </View>
      )}

      {/* Form Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{currentSection.title}</Text>
          {currentSection.description && (
            <Text style={styles.sectionDescription}>{currentSection.description}</Text>
          )}

          {currentSection.fields.map((field) => (
            <View key={field.id} style={styles.fieldContainer}>
              <FormFieldRenderer
                field={field}
                value={responses[field.id]}
                onChange={(value) => handleFieldChange(field.id, value)}
                error={validationErrors[field.id]}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <View style={styles.navigationButtons}>
          {!isFirstSection && (
            <TouchableOpacity
              style={[styles.navButton, styles.secondaryButton]}
              onPress={handlePrevious}
              disabled={submitting}
            >
              <Ionicons name="chevron-back" size={20} color={Colors.light.tint} />
              <Text style={styles.secondaryButtonText}>Previous</Text>
            </TouchableOpacity>
          )}

          <View style={styles.spacer} />

          {/* Save Draft Button */}
          <TouchableOpacity
            style={[styles.navButton, styles.draftButton]}
            onPress={handleSaveDraft}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={Colors.light.tabIconDefault} />
            ) : (
              <>
                <Ionicons name="bookmark" size={20} color={Colors.light.tabIconDefault} />
                <Text style={styles.draftButtonText}>Save Draft</Text>
              </>
            )}
          </TouchableOpacity>

          {isLastSection ? (
            <TouchableOpacity
              style={[styles.navButton, styles.primaryButton]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={Colors.light.background} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Submit</Text>
                  <Ionicons name="checkmark" size={20} color={Colors.light.background} />
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navButton, styles.primaryButton]}
              onPress={handleNext}
              disabled={submitting}
            >
              <Text style={styles.primaryButtonText}>Next</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.background} />
            </TouchableOpacity>
          )}
        </View>
      </View>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tabIconDefault + '20',
  },
  headerContent: {
    flex: 1,
    marginRight: 16,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  formDescription: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    lineHeight: 22,
  },
  closeButton: {
    padding: 4,
  },
  progressContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.light.tabIconDefault + '20',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.tint,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    lineHeight: 22,
    marginBottom: 24,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  navigation: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.tabIconDefault + '20',
    backgroundColor: Colors.light.background,
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  spacer: {
    flex: 1,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: Colors.light.tint,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.background,
  },
  secondaryButton: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  draftButton: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault + '40',
  },
  draftButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.tabIconDefault,
  },
})