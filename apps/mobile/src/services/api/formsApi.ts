import { apiClient } from './client'
import type {
  Form,
  FormResponse,
  FormTemplate,
  FormVersion,
  FormHistory,
  FormListItem,
  CreateFormRequest,
  UpdateFormRequest,
  AddFormFieldRequest,
  SubmitFormResponseRequest,
  FormAnalyticsQuery,
  CreateFormFromTemplateRequest,
  DuplicateFormRequest,
  RestoreFormVersionRequest,
} from '@/types/forms'

export const formsApi = {
  // Form management
  async createForm(data: CreateFormRequest): Promise<Form> {
    const response = await apiClient.post('/forms', data)
    return response.data as Form
  },

  async getForms(): Promise<Form[]> {
    const response = await apiClient.get('/forms')
    return response.data as Form[]
  },

  async getForm(id: string): Promise<Form> {
    const response = await apiClient.get(`/forms/${id}`)
    return response.data as Form
  },

  async updateForm(id: string, data: UpdateFormRequest): Promise<Form> {
    const response = await apiClient.put(`/forms/${id}`, data)
    return response.data as Form
  },

  async deleteForm(id: string): Promise<void> {
    await apiClient.delete(`/forms/${id}`)
  },

  async duplicateForm(id: string): Promise<Form> {
    const response = await apiClient.post(`/forms/${id}/duplicate`)
    return response.data as Form
  },

  // Form publishing
  async publishForm(id: string): Promise<Form> {
    const response = await apiClient.post(`/forms/${id}/publish`)
    return response.data as Form
  },

  async unpublishForm(id: string): Promise<Form> {
    const response = await apiClient.post(`/forms/${id}/unpublish`)
    return response.data as Form
  },

  async pauseForm(id: string): Promise<Form> {
    const response = await apiClient.post(`/forms/${id}/pause`)
    return response.data as Form
  },

  async closeForm(id: string): Promise<Form> {
    const response = await apiClient.post(`/forms/${id}/close`)
    return response.data as Form
  },

  // Form fields
  async addField(formId: string, data: AddFormFieldRequest): Promise<Form> {
    const response = await apiClient.post(`/forms/${formId}/fields`, data)
    return response.data as Form
  },

  async updateField(formId: string, fieldId: string, data: Partial<AddFormFieldRequest>): Promise<Form> {
    const response = await apiClient.put(`/forms/${formId}/fields/${fieldId}`, data)
    return response.data as Form
  },

  async deleteField(formId: string, fieldId: string): Promise<Form> {
    const response = await apiClient.delete(`/forms/${formId}/fields/${fieldId}`)
    return response.data as Form
  },

  async reorderFields(formId: string, sectionId: string, fieldIds: string[]): Promise<Form> {
    const response = await apiClient.post(`/forms/${formId}/sections/${sectionId}/reorder`, {
      fieldIds,
    })
    return response.data as Form
  },

  // Form sections
  async addSection(formId: string, title: string): Promise<Form> {
    const response = await apiClient.post(`/forms/${formId}/sections`, { title })
    return response.data as Form
  },

  async updateSection(formId: string, sectionId: string, data: { title?: string; description?: string }): Promise<Form> {
    const response = await apiClient.put(`/forms/${formId}/sections/${sectionId}`, data)
    return response.data as Form
  },

  async deleteSection(formId: string, sectionId: string): Promise<Form> {
    const response = await apiClient.delete(`/forms/${formId}/sections/${sectionId}`)
    return response.data as Form
  },

  // Form responses
  async getFormResponses(formId: string): Promise<FormResponse[]> {
    const response = await apiClient.get(`/forms/${formId}/responses`)
    return response.data as FormResponse[]
  },

  async getFormResponse(formId: string, responseId: string): Promise<FormResponse> {
    const response = await apiClient.get(`/forms/${formId}/responses/${responseId}`)
    return response.data as FormResponse
  },

  async submitFormResponse(formId: string, data: SubmitFormResponseRequest): Promise<FormResponse> {
    const response = await apiClient.post(`/forms/${formId}/responses`, data)
    return response.data as FormResponse
  },

  async updateFormResponse(formId: string, responseId: string, data: SubmitFormResponseRequest): Promise<FormResponse> {
    const response = await apiClient.put(`/forms/${formId}/responses/${responseId}`, data)
    return response.data as FormResponse
  },

  async deleteFormResponse(formId: string, responseId: string): Promise<void> {
    await apiClient.delete(`/forms/${formId}/responses/${responseId}`)
  },

  // Form analytics
  async getFormAnalytics(formId: string, query?: FormAnalyticsQuery): Promise<Record<string, unknown>> {
    const response = await apiClient.get(`/forms/${formId}/analytics`, { params: query })
    return response.data as Record<string, unknown>
  },

  async exportFormResponses(formId: string, format: 'csv' | 'xlsx' | 'json'): Promise<Blob> {
    const response = await apiClient.get(`/forms/${formId}/export`, {
      params: { format },
      responseType: 'blob',
    })
    return response.data as Blob
  },

  // Form sharing
  async getFormShareLink(formId: string): Promise<{ url: string; qrCode: string }> {
    const response = await apiClient.get(`/forms/${formId}/share`)
    return response.data as { url: string; qrCode: string }
  },

  async updateFormShareSettings(formId: string, settings: { public: boolean; password?: string }): Promise<Form> {
    const response = await apiClient.put(`/forms/${formId}/share`, settings)
    return response.data as Form
  },

  // Form templates
  async getFormTemplates(): Promise<FormTemplate[]> {
    const response = await apiClient.get('/forms/templates')
    return response.data as FormTemplate[]
  },

  async createFormFromTemplate(data: CreateFormFromTemplateRequest): Promise<Form> {
    const response = await apiClient.post('/forms/from-template', data)
    return response.data as Form
  },

  // Form versioning
  async getFormVersions(formId: string): Promise<FormVersion[]> {
    const response = await apiClient.get(`/forms/${formId}/versions`)
    return response.data as FormVersion[]
  },

  async getFormVersion(formId: string, versionId: string): Promise<FormVersion> {
    const response = await apiClient.get(`/forms/${formId}/versions/${versionId}`)
    return response.data as FormVersion
  },

  async createFormVersion(formId: string, changeLog: string): Promise<FormVersion> {
    const response = await apiClient.post(`/forms/${formId}/versions`, { changeLog })
    return response.data as FormVersion
  },

  async restoreFormVersion(formId: string, data: RestoreFormVersionRequest): Promise<Form> {
    const response = await apiClient.post(`/forms/${formId}/restore`, data)
    return response.data as Form
  },

  async deleteFormVersion(formId: string, versionId: string): Promise<void> {
    await apiClient.delete(`/forms/${formId}/versions/${versionId}`)
  },

  // Form history
  async getFormHistory(formId: string): Promise<FormHistory[]> {
    const response = await apiClient.get(`/forms/${formId}/history`)
    return response.data as FormHistory[]
  },

  // Enhanced duplication
  async duplicateFormAdvanced(id: string, data: DuplicateFormRequest): Promise<Form> {
    const response = await apiClient.post(`/forms/${id}/duplicate-advanced`, data)
    return response.data as Form
  },

  // Form management
  async getFormsList(): Promise<FormListItem[]> {
    const response = await apiClient.get('/forms/list')
    return response.data as FormListItem[]
  },

  async saveAsTemplate(formId: string, templateData: { name: string; description: string; category: string }): Promise<FormTemplate> {
    const response = await apiClient.post(`/forms/${formId}/save-as-template`, templateData)
    return response.data as FormTemplate
  },
}