import { DocumentApi } from './api/documentApi';
import { 
  Document, 
  DocumentCreateRequest, 
  DocumentUpdateRequest, 
  DocumentTemplate,
  DocumentTemplateType,
  DocumentAutoSaveConfig,
  DocumentSaveState
} from '../types/document';

export class DocumentService {
  private static autoSaveTimers: Map<string, NodeJS.Timeout> = new Map();
  private static saveStates: Map<string, DocumentSaveState> = new Map();

  private static defaultAutoSaveConfig: DocumentAutoSaveConfig = {
    enabled: true,
    interval: 30000, // 30 seconds
    maxRetries: 3,
    retryDelay: 5000 // 5 seconds
  };

  /**
   * Get all documents
   */
  static async getDocuments(folderId?: string): Promise<Document[]> {
    try {
      return await DocumentApi.getDocuments(folderId);
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw new Error('Failed to fetch documents');
    }
  }

  /**
   * Get a specific document
   */
  static async getDocument(id: string): Promise<Document> {
    try {
      return await DocumentApi.getDocument(id);
    } catch (error) {
      console.error('Error fetching document:', error);
      throw new Error('Failed to fetch document');
    }
  }

  /**
   * Create a new document
   */
  static async createDocument(data: DocumentCreateRequest): Promise<Document> {
    try {
      // Validate title
      if (!data.title || data.title.trim().length === 0) {
        throw new Error('Document title is required');
      }

      const document = await DocumentApi.createDocument({
        ...data,
        title: data.title.trim()
      });

      // Initialize save state
      this.initializeSaveState(document.id);

      return document;
    } catch (error) {
      console.error('Error creating document:', error);
      throw new Error('Failed to create document');
    }
  }

  /**
   * Create document from template
   */
  static async createFromTemplate(
    templateId: string, 
    title: string, 
    folderId?: string
  ): Promise<Document> {
    try {
      if (!title || title.trim().length === 0) {
        throw new Error('Document title is required');
      }

      const document = await DocumentApi.createFromTemplate(templateId, title.trim(), folderId);
      this.initializeSaveState(document.id);
      return document;
    } catch (error) {
      console.error('Error creating document from template:', error);
      throw new Error('Failed to create document from template');
    }
  }

  /**
   * Update document
   */
  static async updateDocument(id: string, data: DocumentUpdateRequest): Promise<Document> {
    try {
      const document = await DocumentApi.updateDocument(id, data);
      this.updateSaveState(id, { hasUnsavedChanges: false, lastSaved: new Date() });
      return document;
    } catch (error) {
      console.error('Error updating document:', error);
      this.updateSaveState(id, { saveError: 'Failed to save document' });
      throw new Error('Failed to update document');
    }
  }

  /**
   * Save document content with auto-save support
   */
  static async saveDocumentContent(
    id: string, 
    content: string, 
    config?: Partial<DocumentAutoSaveConfig>
  ): Promise<void> {
    const saveConfig = { ...this.defaultAutoSaveConfig, ...config };
    
    try {
      this.updateSaveState(id, { isSaving: true, saveError: undefined as string | undefined });
      
      await DocumentApi.saveDocumentContent(id, content);
      
      this.updateSaveState(id, {
        isSaving: false,
        hasUnsavedChanges: false,
        lastSaved: new Date()
      });
    } catch (error) {
      console.error('Error saving document content:', error);
      this.updateSaveState(id, {
        isSaving: false,
        saveError: 'Failed to save document'
      });
      
      // Retry logic for auto-save
      if (saveConfig.enabled) {
        this.retryAutoSave(id, content, saveConfig);
      }
      
      throw new Error('Failed to save document content');
    }
  }

  /**
   * Enable auto-save for a document
   */
  static enableAutoSave(
    id: string, 
    getContent: () => string, 
    config?: Partial<DocumentAutoSaveConfig>
  ): void {
    const saveConfig = { ...this.defaultAutoSaveConfig, ...config };
    
    // Clear existing timer
    this.disableAutoSave(id);
    
    if (!saveConfig.enabled) return;

    const timer = setInterval(async () => {
      const saveState = this.getSaveState(id);
      
      if (saveState.hasUnsavedChanges && !saveState.isSaving) {
        try {
          const content = getContent();
          await this.saveDocumentContent(id, content, saveConfig);
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }, saveConfig.interval);

    this.autoSaveTimers.set(id, timer);
  }

  /**
   * Disable auto-save for a document
   */
  static disableAutoSave(id: string): void {
    const timer = this.autoSaveTimers.get(id);
    if (timer) {
      clearInterval(timer);
      this.autoSaveTimers.delete(id);
    }
  }

  /**
   * Mark document as having unsaved changes
   */
  static markAsChanged(id: string): void {
    this.updateSaveState(id, { hasUnsavedChanges: true });
  }

  /**
   * Get document templates
   */
  static async getTemplates(): Promise<DocumentTemplate[]> {
    try {
      return await DocumentApi.getTemplates();
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw new Error('Failed to fetch templates');
    }
  }

  /**
   * Get templates by type
   */
  static async getTemplatesByType(type: DocumentTemplateType): Promise<DocumentTemplate[]> {
    try {
      return await DocumentApi.getTemplatesByType(type);
    } catch (error) {
      console.error('Error fetching templates by type:', error);
      throw new Error('Failed to fetch templates');
    }
  }

  /**
   * Delete document
   */
  static async deleteDocument(id: string): Promise<void> {
    try {
      await DocumentApi.deleteDocument(id);
      this.cleanupDocument(id);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error('Failed to delete document');
    }
  }

  /**
   * Search documents
   */
  static async searchDocuments(query: string, folderId?: string): Promise<Document[]> {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }
      return await DocumentApi.searchDocuments(query.trim(), folderId);
    } catch (error) {
      console.error('Error searching documents:', error);
      throw new Error('Failed to search documents');
    }
  }

  /**
   * Get recent documents
   */
  static async getRecentDocuments(limit: number = 10): Promise<Document[]> {
    try {
      return await DocumentApi.getRecentDocuments(limit);
    } catch (error) {
      console.error('Error fetching recent documents:', error);
      throw new Error('Failed to fetch recent documents');
    }
  }

  /**
   * Get save state for a document
   */
  static getSaveState(id: string): DocumentSaveState {
    return this.saveStates.get(id) || {
      isSaving: false,
      hasUnsavedChanges: false
    };
  }

  /**
   * Initialize save state for a document
   */
  private static initializeSaveState(id: string): void {
    this.saveStates.set(id, {
      isSaving: false,
      hasUnsavedChanges: false
    });
  }

  /**
   * Update save state for a document
   */
  private static updateSaveState(id: string, updates: Partial<DocumentSaveState>): void {
    const currentState = this.getSaveState(id);
    this.saveStates.set(id, { ...currentState, ...updates });
  }

  /**
   * Retry auto-save with exponential backoff
   */
  private static async retryAutoSave(
    id: string, 
    content: string, 
    config: DocumentAutoSaveConfig,
    attempt: number = 1
  ): Promise<void> {
    if (attempt > config.maxRetries) {
      console.error(`Auto-save failed after ${config.maxRetries} attempts for document ${id}`);
      return;
    }

    const delay = config.retryDelay * Math.pow(2, attempt - 1);
    
    setTimeout(async () => {
      try {
        await this.saveDocumentContent(id, content, config);
      } catch (error) {
        console.error(`Auto-save retry ${attempt} failed for document ${id}:`, error);
        this.retryAutoSave(id, content, config, attempt + 1);
      }
    }, delay);
  }

  /**
   * Cleanup document resources
   */
  private static cleanupDocument(id: string): void {
    this.disableAutoSave(id);
    this.saveStates.delete(id);
  }

  /**
   * Cleanup all resources (call on app shutdown)
   */
  static cleanup(): void {
    // Clear all auto-save timers
    this.autoSaveTimers.forEach((timer) => clearInterval(timer));
    this.autoSaveTimers.clear();
    this.saveStates.clear();
  }
}