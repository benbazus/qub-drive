import { formsApi } from './api/formsApi'
import {
  Form,
  FormField,
  FormSection,
  FormFieldType,
  FormFieldTemplate,
  FormTemplate,
  FormVersion,
  FormHistory,
  FormListItem,
  CreateFormRequest,
  UpdateFormRequest,
  AddFormFieldRequest,
  CreateFormFromTemplateRequest,
  DuplicateFormRequest,
  RestoreFormVersionRequest,
  FieldWidth,
  FieldAlignment,
  FormStatus,
  FormTheme,
} from '@/types/forms'

class FormService {
  // Form field templates for drag-and-drop
  getFieldTemplates(): FormFieldTemplate[] {
    return [
      {
        id: 'short-text',
        name: 'Short Text',
        fieldType: FormFieldType.ShortText,
        icon: 'text-fields',
        description: 'Single line text input',
        defaultProperties: {
          label: 'Short Text',
          required: false,
          placeholder: 'Enter text...',
          properties: {
            width: FieldWidth.Full,
            alignment: FieldAlignment.Left,
            showTime: false,
            shuffleOptions: false,
            allowOther: false,
          },
        },
      },
      {
        id: 'long-text',
        name: 'Long Text',
        fieldType: FormFieldType.LongText,
        icon: 'subject',
        description: 'Multi-line text area',
        defaultProperties: {
          label: 'Long Text',
          required: false,
          placeholder: 'Enter detailed text...',
          properties: {
            width: FieldWidth.Full,
            alignment: FieldAlignment.Left,
            rows: 4,
            showTime: false,
            shuffleOptions: false,
            allowOther: false,
          },
        },
      },
      {
        id: 'email',
        name: 'Email',
        fieldType: FormFieldType.Email,
        icon: 'email',
        description: 'Email address input',
        defaultProperties: {
          label: 'Email Address',
          required: true,
          placeholder: 'Enter email address...',
          validation: {
            required: true,
            pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
            customMessage: 'Please enter a valid email address',
            fileTypes: [],
          },
          properties: {
            width: FieldWidth.Full,
            alignment: FieldAlignment.Left,
            showTime: false,
            shuffleOptions: false,
            allowOther: false,
          },
        },
      },
      {
        id: 'phone',
        name: 'Phone',
        fieldType: FormFieldType.Phone,
        icon: 'phone',
        description: 'Phone number input',
        defaultProperties: {
          label: 'Phone Number',
          required: false,
          placeholder: 'Enter phone number...',
          properties: {
            width: FieldWidth.Medium,
            alignment: FieldAlignment.Left,
            showTime: false,
            shuffleOptions: false,
            allowOther: false,
          },
        },
      },
      {
        id: 'number',
        name: 'Number',
        fieldType: FormFieldType.Number,
        icon: 'looks-one',
        description: 'Numeric input',
        defaultProperties: {
          label: 'Number',
          required: false,
          placeholder: 'Enter number...',
          properties: {
            width: FieldWidth.Medium,
            alignment: FieldAlignment.Left,
            showTime: false,
            shuffleOptions: false,
            allowOther: false,
          },
        },
      },
      {
        id: 'date',
        name: 'Date',
        fieldType: FormFieldType.Date,
        icon: 'event',
        description: 'Date picker',
        defaultProperties: {
          label: 'Date',
          required: false,
          properties: {
            width: FieldWidth.Medium,
            alignment: FieldAlignment.Left,
            showTime: false,
            dateFormat: 'MM/DD/YYYY',
            shuffleOptions: false,
            allowOther: false,
          },
        },
      },
      {
        id: 'time',
        name: 'Time',
        fieldType: FormFieldType.Time,
        icon: 'access-time',
        description: 'Time picker',
        defaultProperties: {
          label: 'Time',
          required: false,
          properties: {
            width: FieldWidth.Medium,
            alignment: FieldAlignment.Left,
            showTime: true,
            shuffleOptions: false,
            allowOther: false,
          },
        },
      },
      {
        id: 'dropdown',
        name: 'Dropdown',
        fieldType: FormFieldType.Dropdown,
        icon: 'arrow-drop-down',
        description: 'Single selection dropdown',
        defaultProperties: {
          label: 'Dropdown',
          required: false,
          options: [
            { id: '1', label: 'Option 1', value: 'option1', isOther: false, order: 0 },
            { id: '2', label: 'Option 2', value: 'option2', isOther: false, order: 1 },
            { id: '3', label: 'Option 3', value: 'option3', isOther: false, order: 2 },
          ],
          properties: {
            width: FieldWidth.Full,
            alignment: FieldAlignment.Left,
            showTime: false,
            shuffleOptions: false,
            allowOther: true,
          },
        },
      },
      {
        id: 'multiple-choice',
        name: 'Multiple Choice',
        fieldType: FormFieldType.MultipleChoice,
        icon: 'radio-button-checked',
        description: 'Single selection from options',
        defaultProperties: {
          label: 'Multiple Choice',
          required: false,
          options: [
            { id: '1', label: 'Option 1', value: 'option1', isOther: false, order: 0 },
            { id: '2', label: 'Option 2', value: 'option2', isOther: false, order: 1 },
            { id: '3', label: 'Option 3', value: 'option3', isOther: false, order: 2 },
          ],
          properties: {
            width: FieldWidth.Full,
            alignment: FieldAlignment.Left,
            showTime: false,
            shuffleOptions: false,
            allowOther: true,
          },
        },
      },
      {
        id: 'checkboxes',
        name: 'Checkboxes',
        fieldType: FormFieldType.Checkboxes,
        icon: 'check-box',
        description: 'Multiple selection from options',
        defaultProperties: {
          label: 'Checkboxes',
          required: false,
          options: [
            { id: '1', label: 'Option 1', value: 'option1', isOther: false, order: 0 },
            { id: '2', label: 'Option 2', value: 'option2', isOther: false, order: 1 },
            { id: '3', label: 'Option 3', value: 'option3', isOther: false, order: 2 },
          ],
          properties: {
            width: FieldWidth.Full,
            alignment: FieldAlignment.Left,
            showTime: false,
            shuffleOptions: false,
            allowOther: true,
          },
        },
      },
      {
        id: 'linear-scale',
        name: 'Linear Scale',
        fieldType: FormFieldType.LinearScale,
        icon: 'linear-scale',
        description: 'Rating scale from min to max',
        defaultProperties: {
          label: 'Linear Scale',
          required: false,
          properties: {
            width: FieldWidth.Full,
            alignment: FieldAlignment.Left,
            scaleMin: 1,
            scaleMax: 5,
            scaleMinLabel: 'Strongly Disagree',
            scaleMaxLabel: 'Strongly Agree',
            showTime: false,
            shuffleOptions: false,
            allowOther: false,
          },
        },
      },
      {
        id: 'file-upload',
        name: 'File Upload',
        fieldType: FormFieldType.FileUpload,
        icon: 'cloud-upload',
        description: 'File upload input',
        defaultProperties: {
          label: 'File Upload',
          required: false,
          validation: {
            required: false,
            fileTypes: ['pdf', 'doc', 'docx', 'txt'],
            maxFileSize: 10485760, // 10MB
            maxFiles: 5,
          },
          properties: {
            width: FieldWidth.Full,
            alignment: FieldAlignment.Left,
            showTime: false,
            shuffleOptions: false,
            allowOther: false,
          },
        },
      },
      {
        id: 'image-upload',
        name: 'Image Upload',
        fieldType: FormFieldType.ImageUpload,
        icon: 'image',
        description: 'Image upload input',
        defaultProperties: {
          label: 'Image Upload',
          required: false,
          validation: {
            required: false,
            fileTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            maxFileSize: 5242880, // 5MB
            maxFiles: 3,
          },
          properties: {
            width: FieldWidth.Full,
            alignment: FieldAlignment.Left,
            showTime: false,
            shuffleOptions: false,
            allowOther: false,
          },
        },
      },
      {
        id: 'section-break',
        name: 'Section Break',
        fieldType: FormFieldType.SectionBreak,
        icon: 'horizontal-rule',
        description: 'Visual section separator',
        defaultProperties: {
          label: 'Section Break',
          required: false,
          properties: {
            width: FieldWidth.Full,
            alignment: FieldAlignment.Center,
            showTime: false,
            shuffleOptions: false,
            allowOther: false,
          },
        },
      },
    ]
  }

  // Form templates - Local
  getLocalFormTemplates(): FormTemplate[] {
    return [
      {
        id: 'contact-form',
        name: 'Contact Form',
        description: 'Basic contact information form',
        category: 'General',
        form: {
          title: 'Contact Form',
          description: 'Please fill out your contact information',
          sections: [
            {
              id: 'contact-section',
              title: 'Contact Information',
              description: 'Your basic contact details',
              fields: [],
              order: 0,
              isRepeatable: false,
              conditions: [],
            },
          ],
        },
      },
      {
        id: 'feedback-form',
        name: 'Feedback Form',
        description: 'Customer feedback and satisfaction survey',
        category: 'Survey',
        form: {
          title: 'Customer Feedback',
          description: 'Help us improve by sharing your feedback',
          sections: [
            {
              id: 'feedback-section',
              title: 'Your Feedback',
              description: 'Please rate your experience',
              fields: [],
              order: 0,
              isRepeatable: false,
              conditions: [],
            },
          ],
        },
      },
      {
        id: 'registration-form',
        name: 'Registration Form',
        description: 'Event or service registration form',
        category: 'Registration',
        form: {
          title: 'Registration Form',
          description: 'Register for our event or service',
          sections: [
            {
              id: 'personal-info',
              title: 'Personal Information',
              description: 'Your personal details',
              fields: [],
              order: 0,
              isRepeatable: false,
              conditions: [],
            },
          ],
        },
      },
      {
        id: 'survey-form',
        name: 'Survey Form',
        description: 'General purpose survey template',
        category: 'Survey',
        form: {
          title: 'Survey',
          description: 'Please take a moment to complete this survey',
          sections: [
            {
              id: 'survey-section',
              title: 'Survey Questions',
              description: 'Your responses help us understand your needs',
              fields: [],
              order: 0,
              isRepeatable: false,
              conditions: [],
            },
          ],
        },
      },
    ]
  }

  // Create a new form field
  createFormField(fieldType: FormFieldType, label: string): FormField {
    const template = this.getFieldTemplates().find(t => t.fieldType === fieldType)
    const id = `field_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    
    const field: FormField = {
      id,
      fieldType,
      label: label || template?.defaultProperties.label || 'Untitled Field',
      required: template?.defaultProperties.required || false,
      order: 0,
      options: template?.defaultProperties.options || [],
      properties: template?.defaultProperties.properties || {
        width: FieldWidth.Full,
        alignment: FieldAlignment.Left,
        showTime: false,
        shuffleOptions: false,
        allowOther: false,
      },
      conditions: [],
    }

    // Add optional properties only if they exist
    if (template?.defaultProperties.description) {
      field.description = template.defaultProperties.description
    }
    if (template?.defaultProperties.placeholder) {
      field.placeholder = template.defaultProperties.placeholder
    }
    if (template?.defaultProperties.validation) {
      field.validation = template.defaultProperties.validation
    }
    if (template?.defaultProperties.defaultValue) {
      field.defaultValue = template.defaultProperties.defaultValue
    }

    return field
  }

  // Create a new form section
  createFormSection(title: string): FormSection {
    const id = `section_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    
    const section: FormSection = {
      id,
      title: title || 'Untitled Section',
      fields: [],
      order: 0,
      isRepeatable: false,
      conditions: [],
    }

    return section
  }

  // Create a new form template
  createFormTemplate(title: string, description?: string): Partial<Form> {
    const formTemplate: Partial<Form> = {
      title: title || 'Untitled Form',
      sections: [this.createFormSection('Section 1')],
      settings: {
        collectEmails: false,
        requireSignIn: false,
        allowMultipleResponses: true,
        allowResponseEditing: false,
        showProgressBar: true,
        showLinkToSubmitAnother: false,
        confirmationMessage: 'Thank you for your response!',
        notificationSettings: {
          notifyOnResponse: false,
          notificationEmails: [],
        },
        privacySettings: {
          collectIpAddresses: false,
          collectUserAgent: false,
          collectLocation: false,
          gdprCompliant: true,
        },
      },
      branding: {
        theme: FormTheme.Default,
        fontFamily: 'Arial, sans-serif',
        primaryColor: '#1a73e8',
        backgroundColor: '#ffffff',
      },
      status: FormStatus.Draft,
    }

    if (description) {
      formTemplate.description = description
    }

    return formTemplate
  }

  // Validate form field
  validateField(field: FormField): string[] {
    const errors: string[] = []

    if (!field.label.trim()) {
      errors.push('Field label is required')
    }

    if (field.fieldType === FormFieldType.Email && field.validation?.pattern) {
      try {
        new RegExp(field.validation.pattern)
      } catch {
        errors.push('Invalid email pattern')
      }
    }

    if (field.validation?.minLength && field.validation?.maxLength) {
      if (field.validation.minLength > field.validation.maxLength) {
        errors.push('Minimum length cannot be greater than maximum length')
      }
    }

    if (field.validation?.minValue && field.validation?.maxValue) {
      if (field.validation.minValue > field.validation.maxValue) {
        errors.push('Minimum value cannot be greater than maximum value')
      }
    }

    if ([FormFieldType.Dropdown, FormFieldType.MultipleChoice, FormFieldType.Checkboxes].includes(field.fieldType)) {
      if (field.options.length === 0) {
        errors.push('At least one option is required for selection fields')
      }
    }

    if (field.fieldType === FormFieldType.LinearScale) {
      if (!field.properties.scaleMin || !field.properties.scaleMax) {
        errors.push('Scale minimum and maximum values are required')
      } else if (field.properties.scaleMin >= field.properties.scaleMax) {
        errors.push('Scale minimum must be less than maximum')
      }
    }

    return errors
  }

  // Validate form
  validateForm(form: Form): string[] {
    const errors: string[] = []

    if (!form.title.trim()) {
      errors.push('Form title is required')
    }

    if (form.sections.length === 0) {
      errors.push('Form must have at least one section')
    }

    form.sections.forEach((section, sectionIndex) => {
      if (!section.title.trim()) {
        errors.push(`Section ${sectionIndex + 1} title is required`)
      }

      section.fields.forEach((field, fieldIndex) => {
        const fieldErrors = this.validateField(field)
        fieldErrors.forEach(error => {
          errors.push(`Section ${sectionIndex + 1}, Field ${fieldIndex + 1}: ${error}`)
        })
      })
    })

    return errors
  }

  // Get field type display name
  getFieldTypeDisplayName(fieldType: FormFieldType): string {
    const template = this.getFieldTemplates().find(t => t.fieldType === fieldType)
    return template?.name || fieldType
  }

  // Get field type icon
  getFieldTypeIcon(fieldType: FormFieldType): string {
    const template = this.getFieldTemplates().find(t => t.fieldType === fieldType)
    return template?.icon || 'help'
  }

  // Check if field type supports options
  fieldTypeSupportsOptions(fieldType: FormFieldType): boolean {
    return [
      FormFieldType.Dropdown,
      FormFieldType.MultipleChoice,
      FormFieldType.Checkboxes,
      FormFieldType.MultipleChoiceGrid,
      FormFieldType.CheckboxGrid,
    ].includes(fieldType)
  }

  // Check if field type supports validation
  fieldTypeSupportsValidation(fieldType: FormFieldType): boolean {
    return ![
      FormFieldType.SectionBreak,
      FormFieldType.PageBreak,
      FormFieldType.Image,
      FormFieldType.Video,
    ].includes(fieldType)
  }

  // API methods - Basic CRUD
  async createFormFromRequest(data: CreateFormRequest): Promise<Form> {
    return formsApi.createForm(data)
  }

  async getForms(): Promise<Form[]> {
    return formsApi.getForms()
  }

  async getForm(id: string): Promise<Form> {
    return formsApi.getForm(id)
  }

  async updateForm(id: string, data: UpdateFormRequest): Promise<Form> {
    return formsApi.updateForm(id, data)
  }

  async deleteForm(id: string): Promise<void> {
    return formsApi.deleteForm(id)
  }

  async addField(formId: string, data: AddFormFieldRequest): Promise<Form> {
    return formsApi.addField(formId, data)
  }

  async updateField(formId: string, fieldId: string, data: Partial<AddFormFieldRequest>): Promise<Form> {
    return formsApi.updateField(formId, fieldId, data)
  }

  async deleteField(formId: string, fieldId: string): Promise<Form> {
    return formsApi.deleteField(formId, fieldId)
  }

  async publishForm(id: string): Promise<Form> {
    return formsApi.publishForm(id)
  }

  async getFormShareLink(id: string): Promise<{ url: string; qrCode: string }> {
    return formsApi.getFormShareLink(id)
  }

  // Form management methods
  async getFormsList(): Promise<FormListItem[]> {
    return formsApi.getFormsList()
  }

  async duplicateForm(id: string): Promise<Form> {
    return formsApi.duplicateForm(id)
  }

  async duplicateFormAdvanced(id: string, data: DuplicateFormRequest): Promise<Form> {
    return formsApi.duplicateFormAdvanced(id, data)
  }

  // Template methods - API
  async getFormTemplatesFromApi(): Promise<FormTemplate[]> {
    return formsApi.getFormTemplates()
  }

  async createFormFromTemplate(data: CreateFormFromTemplateRequest): Promise<Form> {
    return formsApi.createFormFromTemplate(data)
  }

  async saveAsTemplate(formId: string, templateData: { name: string; description: string; category: string }): Promise<FormTemplate> {
    return formsApi.saveAsTemplate(formId, templateData)
  }

  // Versioning methods
  async getFormVersions(formId: string): Promise<FormVersion[]> {
    return formsApi.getFormVersions(formId)
  }

  async getFormVersion(formId: string, versionId: string): Promise<FormVersion> {
    return formsApi.getFormVersion(formId, versionId)
  }

  async createFormVersion(formId: string, changeLog: string): Promise<FormVersion> {
    return formsApi.createFormVersion(formId, changeLog)
  }

  async restoreFormVersion(formId: string, data: RestoreFormVersionRequest): Promise<Form> {
    return formsApi.restoreFormVersion(formId, data)
  }

  async deleteFormVersion(formId: string, versionId: string): Promise<void> {
    return formsApi.deleteFormVersion(formId, versionId)
  }

  // History methods
  async getFormHistory(formId: string): Promise<FormHistory[]> {
    return formsApi.getFormHistory(formId)
  }
}

export const formService = new FormService()