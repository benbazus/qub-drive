import { useState, useCallback, useEffect } from 'react'
import { Alert } from 'react-native'
import type {
  Form,
  FormField,
  FormSection,
  FormFieldType,
  FormBuilderState,
  CreateFormRequest,
  UpdateFormRequest,
} from '@/types/forms'
import { formService } from '@/services/formService'

export const useFormBuilder = (formId?: string) => {
  const [state, setState] = useState<FormBuilderState>({
    form: null,
    selectedField: null,
    selectedSection: null,
    isDragging: false,
    previewMode: false,
    unsavedChanges: false,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load form
  const loadForm = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      const form = await formService.getForm(id)
      setState(prev => ({ ...prev, form, unsavedChanges: false }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load form')
    } finally {
      setLoading(false)
    }
  }, [])

  // Create new form
  const createForm = useCallback(async (data: CreateFormRequest) => {
    try {
      setLoading(true)
      setError(null)
      const form = await formService.createForm(data)
      setState(prev => ({ ...prev, form, unsavedChanges: false }))
      return form
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create form')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Save form
  const saveForm = useCallback(async () => {
    if (!state.form) return

    try {
      setLoading(true)
      setError(null)
      
      const updateData: UpdateFormRequest = {
        title: state.form.title,
        description: state.form.description,
        sections: state.form.sections,
        settings: state.form.settings,
        branding: state.form.branding,
      }

      const updatedForm = await formService.updateForm(state.form.id, updateData)
      setState(prev => ({ ...prev, form: updatedForm, unsavedChanges: false }))
      return updatedForm
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save form')
      throw err
    } finally {
      setLoading(false)
    }
  }, [state.form])

  // Update form locally (marks as unsaved)
  const updateFormLocally = useCallback((updates: Partial<Form>) => {
    setState(prev => ({
      ...prev,
      form: prev.form ? { ...prev.form, ...updates } : null,
      unsavedChanges: true,
    }))
  }, [])

  // Add section
  const addSection = useCallback((title: string = 'New Section') => {
    if (!state.form) return

    const newSection = formService.createFormSection(title)
    newSection.order = state.form.sections.length

    const updatedSections = [...state.form.sections, newSection]
    updateFormLocally({ sections: updatedSections })
  }, [state.form, updateFormLocally])

  // Update section
  const updateSection = useCallback((sectionId: string, updates: Partial<FormSection>) => {
    if (!state.form) return

    const updatedSections = state.form.sections.map(section =>
      section.id === sectionId ? { ...section, ...updates } : section
    )
    updateFormLocally({ sections: updatedSections })
  }, [state.form, updateFormLocally])

  // Delete section
  const deleteSection = useCallback((sectionId: string) => {
    if (!state.form) return

    const updatedSections = state.form.sections.filter(section => section.id !== sectionId)
    updateFormLocally({ sections: updatedSections })

    // Clear selection if deleted section was selected
    if (state.selectedSection?.id === sectionId) {
      setState(prev => ({ ...prev, selectedSection: null }))
    }
  }, [state.form, state.selectedSection, updateFormLocally])

  // Add field to section
  const addField = useCallback((sectionId: string, fieldType: FormFieldType, label?: string) => {
    if (!state.form) return

    const newField = formService.createFormField(fieldType, label || '')
    const section = state.form.sections.find(s => s.id === sectionId)
    if (!section) return

    newField.order = section.fields.length

    const updatedSections = state.form.sections.map(section =>
      section.id === sectionId
        ? { ...section, fields: [...section.fields, newField] }
        : section
    )
    updateFormLocally({ sections: updatedSections })
    
    // Select the new field
    setState(prev => ({ ...prev, selectedField: newField }))
  }, [state.form, updateFormLocally])

  // Update field
  const updateField = useCallback((sectionId: string, fieldId: string, updates: Partial<FormField>) => {
    if (!state.form) return

    const updatedSections = state.form.sections.map(section =>
      section.id === sectionId
        ? {
            ...section,
            fields: section.fields.map(field =>
              field.id === fieldId ? { ...field, ...updates } : field
            ),
          }
        : section
    )
    updateFormLocally({ sections: updatedSections })

    // Update selected field if it's the one being updated
    if (state.selectedField?.id === fieldId) {
      setState(prev => ({
        ...prev,
        selectedField: prev.selectedField ? { ...prev.selectedField, ...updates } : null,
      }))
    }
  }, [state.form, state.selectedField, updateFormLocally])

  // Delete field
  const deleteField = useCallback((sectionId: string, fieldId: string) => {
    if (!state.form) return

    const updatedSections = state.form.sections.map(section =>
      section.id === sectionId
        ? { ...section, fields: section.fields.filter(field => field.id !== fieldId) }
        : section
    )
    updateFormLocally({ sections: updatedSections })

    // Clear selection if deleted field was selected
    if (state.selectedField?.id === fieldId) {
      setState(prev => ({ ...prev, selectedField: null }))
    }
  }, [state.form, state.selectedField, updateFormLocally])

  // Duplicate field
  const duplicateField = useCallback((sectionId: string, fieldId: string) => {
    if (!state.form) return

    const section = state.form.sections.find(s => s.id === sectionId)
    const field = section?.fields.find(f => f.id === fieldId)
    if (!section || !field) return

    const duplicatedField: FormField = {
      ...field,
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      label: `${field.label} (Copy)`,
      order: field.order + 1,
    }

    const updatedFields = [...section.fields]
    updatedFields.splice(field.order + 1, 0, duplicatedField)
    
    // Update order for fields after the duplicated one
    updatedFields.forEach((f, index) => {
      f.order = index
    })

    const updatedSections = state.form.sections.map(s =>
      s.id === sectionId ? { ...s, fields: updatedFields } : s
    )
    updateFormLocally({ sections: updatedSections })
  }, [state.form, updateFormLocally])

  // Reorder fields
  const reorderFields = useCallback((sectionId: string, fromIndex: number, toIndex: number) => {
    if (!state.form) return

    const section = state.form.sections.find(s => s.id === sectionId)
    if (!section) return

    const updatedFields = [...section.fields]
    const [movedField] = updatedFields.splice(fromIndex, 1)
    updatedFields.splice(toIndex, 0, movedField)

    // Update order property
    updatedFields.forEach((field, index) => {
      field.order = index
    })

    const updatedSections = state.form.sections.map(s =>
      s.id === sectionId ? { ...s, fields: updatedFields } : s
    )
    updateFormLocally({ sections: updatedSections })
  }, [state.form, updateFormLocally])

  // Select field
  const selectField = useCallback((field: FormField | null) => {
    setState(prev => ({ ...prev, selectedField: field, selectedSection: null }))
  }, [])

  // Select section
  const selectSection = useCallback((section: FormSection | null) => {
    setState(prev => ({ ...prev, selectedSection: section, selectedField: null }))
  }, [])

  // Toggle preview mode
  const togglePreviewMode = useCallback(() => {
    setState(prev => ({ ...prev, previewMode: !prev.previewMode }))
  }, [])

  // Set dragging state
  const setDragging = useCallback((isDragging: boolean) => {
    setState(prev => ({ ...prev, isDragging }))
  }, [])

  // Validate form
  const validateForm = useCallback(() => {
    if (!state.form) return []
    return formService.validateForm(state.form)
  }, [state.form])

  // Publish form
  const publishForm = useCallback(async () => {
    if (!state.form) return

    const errors = validateForm()
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'))
      return
    }

    try {
      setLoading(true)
      setError(null)
      const publishedForm = await formService.publishForm(state.form.id)
      setState(prev => ({ ...prev, form: publishedForm }))
      return publishedForm
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish form')
      throw err
    } finally {
      setLoading(false)
    }
  }, [state.form, validateForm])

  // Get form share link
  const getShareLink = useCallback(async () => {
    if (!state.form) return null

    try {
      return await formService.getFormShareLink(state.form.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get share link')
      return null
    }
  }, [state.form])

  // Load form on mount if formId provided
  useEffect(() => {
    if (formId) {
      loadForm(formId)
    }
  }, [formId, loadForm])

  // Enhanced form management methods
  const duplicateFormAdvanced = useCallback(async (formId: string, data: any) => {
    try {
      setLoading(true)
      setError(null)
      const duplicatedForm = await formService.duplicateFormAdvanced(formId, data)
      setState(prev => ({ ...prev, form: duplicatedForm, unsavedChanges: false }))
      return duplicatedForm
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate form')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createFromTemplate = useCallback(async (data: any) => {
    try {
      setLoading(true)
      setError(null)
      const newForm = await formService.createFormFromTemplate(data)
      setState(prev => ({ ...prev, form: newForm, unsavedChanges: false }))
      return newForm
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create form from template')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const saveAsTemplate = useCallback(async (templateData: any) => {
    if (!state.form) return null

    try {
      setLoading(true)
      setError(null)
      const template = await formService.saveAsTemplate(state.form.id, templateData)
      return template
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save as template')
      throw err
    } finally {
      setLoading(false)
    }
  }, [state.form])

  return {
    // State
    form: state.form,
    selectedField: state.selectedField,
    selectedSection: state.selectedSection,
    isDragging: state.isDragging,
    previewMode: state.previewMode,
    unsavedChanges: state.unsavedChanges,
    loading,
    error,

    // Actions
    loadForm,
    createForm,
    saveForm,
    updateFormLocally,
    addSection,
    updateSection,
    deleteSection,
    addField,
    updateField,
    deleteField,
    duplicateField,
    reorderFields,
    selectField,
    selectSection,
    togglePreviewMode,
    setDragging,
    validateForm,
    publishForm,
    getShareLink,

    // Enhanced actions
    duplicateFormAdvanced,
    createFromTemplate,
    saveAsTemplate,

    // Utilities
    fieldTemplates: formService.getFieldTemplates(),
    formTemplates: formService.getLocalFormTemplates(),
  }
}