import { apiClient } from './client';
import { 
  Document, 
  DocumentCreateRequest, 
  DocumentUpdateRequest, 
  DocumentTemplate,
  DocumentTemplateType,
  DocumentExportOptions
} from '../../types/document';

export class DocumentApi {
  private static readonly BASE_PATH = '/documents';

  /**
   * Get all documents for the current user
   */
  static async getDocuments(folderId?: string): Promise<Document[]> {
    const params = folderId ? { folderId } : {};
    const response = await apiClient.get(this.BASE_PATH, { params });
    return (response.data as any[]).map(this.transformDocument);
  }

  /**
   * Get a specific document by ID
   */
  static async getDocument(id: string): Promise<Document> {
    const response = await apiClient.get(`${this.BASE_PATH}/${id}`);
    return this.transformDocument(response.data);
  }

  /**
   * Create a new document
   */
  static async createDocument(data: DocumentCreateRequest): Promise<Document> {
    const response = await apiClient.post(this.BASE_PATH, data);
    return this.transformDocument(response.data);
  }

  /**
   * Update an existing document
   */
  static async updateDocument(id: string, data: DocumentUpdateRequest): Promise<Document> {
    const response = await apiClient.put(`${this.BASE_PATH}/${id}`, data);
    return this.transformDocument(response.data);
  }

  /**
   * Save document content (for auto-save)
   */
  static async saveDocumentContent(id: string, content: string): Promise<void> {
    await apiClient.patch(`${this.BASE_PATH}/${id}/content`, { content });
  }

  /**
   * Delete a document
   */
  static async deleteDocument(id: string): Promise<void> {
    await apiClient.delete(`${this.BASE_PATH}/${id}`);
  }

  /**
   * Get document templates
   */
  static async getTemplates(): Promise<DocumentTemplate[]> {
    const response = await apiClient.get(`${this.BASE_PATH}/templates`);
    return response.data as DocumentTemplate[];
  }

  /**
   * Get templates by type
   */
  static async getTemplatesByType(type: DocumentTemplateType): Promise<DocumentTemplate[]> {
    const response = await apiClient.get(`${this.BASE_PATH}/templates`, {
      params: { type }
    });
    return response.data as DocumentTemplate[];
  }

  /**
   * Create document from template
   */
  static async createFromTemplate(templateId: string, title: string, folderId?: string): Promise<Document> {
    const response = await apiClient.post(`${this.BASE_PATH}/from-template`, {
      templateId,
      title,
      folderId
    });
    return this.transformDocument(response.data);
  }

  /**
   * Export document
   */
  static async exportDocument(id: string, options: DocumentExportOptions): Promise<Blob> {
    const response = await apiClient.post(`${this.BASE_PATH}/${id}/export`, options, {
      responseType: 'blob'
    });
    return response.data as Blob;
  }

  /**
   * Get document version history
   */
  static async getVersionHistory(id: string): Promise<Document[]> {
    const response = await apiClient.get(`${this.BASE_PATH}/${id}/versions`);
    return (response.data as any[]).map(this.transformDocument);
  }

  /**
   * Restore document to a specific version
   */
  static async restoreVersion(id: string, version: number): Promise<Document> {
    const response = await apiClient.post(`${this.BASE_PATH}/${id}/restore`, { version });
    return this.transformDocument(response.data);
  }

  /**
   * Share document with users
   */
  static async shareDocument(id: string, userEmails: string[], permission: 'view' | 'edit'): Promise<void> {
    await apiClient.post(`${this.BASE_PATH}/${id}/share`, {
      userEmails,
      permission
    });
  }

  /**
   * Get document collaborators
   */
  static async getCollaborators(id: string) {
    const response = await apiClient.get(`${this.BASE_PATH}/${id}/collaborators`);
    return response.data;
  }

  /**
   * Remove collaborator from document
   */
  static async removeCollaborator(id: string, userId: string): Promise<void> {
    await apiClient.delete(`${this.BASE_PATH}/${id}/collaborators/${userId}`);
  }

  /**
   * Update collaborator permissions
   */
  static async updateCollaboratorPermission(
    id: string, 
    userId: string, 
    permission: 'view' | 'edit' | 'admin'
  ): Promise<void> {
    await apiClient.patch(`${this.BASE_PATH}/${id}/collaborators/${userId}`, {
      permission
    });
  }

  /**
   * Search documents
   */
  static async searchDocuments(query: string, folderId?: string): Promise<Document[]> {
    const params = { query, ...(folderId && { folderId }) };
    const response = await apiClient.get(`${this.BASE_PATH}/search`, { params });
    return (response.data as any[]).map(this.transformDocument);
  }

  /**
   * Get recent documents
   */
  static async getRecentDocuments(limit: number = 10): Promise<Document[]> {
    const response = await apiClient.get(`${this.BASE_PATH}/recent`, {
      params: { limit }
    });
    return (response.data as any[]).map(this.transformDocument);
  }

  /**
   * Transform API response to Document type
   */
  private static transformDocument(data: any): Document {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      lastSavedAt: data.lastSavedAt ? new Date(data.lastSavedAt) : undefined,
      autoSaveEnabled: data.autoSaveEnabled ?? true,
      collaborators: data.collaborators?.map((collab: unknown) => ({
        ...collab,
        joinedAt: new Date(collab.joinedAt)
      })) || []
    };
  }
}