import AsyncStorage from '@react-native-async-storage/async-storage';
import { offlineStorage } from './storage/offlineStorage';
import { DocumentService } from './documentService';
// import { SpreadsheetService } from './spreadsheetService';
// Import types for type checking only
// import { Document } from '../types/document';
// import { Spreadsheet } from '../types/spreadsheet';

export interface OfflineEdit {
  id: string;
  fileId: string;
  fileType: 'document' | 'spreadsheet';
  editType: 'content' | 'title' | 'cell' | 'formula';
  timestamp: Date;
  data: {
    content?: string;
    title?: string;
    cellRef?: string;
    cellValue?: unknown;
    formula?: string;
    previousValue?: unknown;
  };
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  error?: string;
}

export interface OfflineWorkQueue {
  edits: OfflineEdit[];
  lastSyncAttempt?: Date;
  isProcessing: boolean;
}

export interface OfflineEditingConfig {
  maxRetries: number;
  retryDelay: number;
  autoSyncInterval: number;
  maxQueueSize: number;
}

class OfflineEditingService {
  private static instance: OfflineEditingService;
  private workQueue: OfflineWorkQueue = {
    edits: [],
    isProcessing: false
  };
  
  private config: OfflineEditingConfig = {
    maxRetries: 3,
    retryDelay: 5000,
    autoSyncInterval: 30000,
    maxQueueSize: 100
  };

  private syncTimer?: ReturnType<typeof setInterval>;
  private isInitialized = false;

  static getInstance(): OfflineEditingService {
    if (!OfflineEditingService.instance) {
      OfflineEditingService.instance = new OfflineEditingService();
    }
    return OfflineEditingService.instance;
  }

  /**
   * Initialize the offline editing service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load existing work queue from storage
      await this.loadWorkQueue();
      
      // Start auto-sync timer
      this.startAutoSync();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize offline editing service:', error);
      throw error;
    }
  }

  /**
   * Check if a file is available for offline editing
   */
  async isFileAvailableForOfflineEditing(fileId: string): Promise<boolean> {
    try {
      return await offlineStorage.isFileAvailableOffline(fileId);
    } catch (error) {
      console.error('Error checking offline availability:', error);
      return false;
    }
  }

  /**
   * Get offline document content
   */
  async getOfflineDocumentContent(documentId: string): Promise<string | null> {
    try {
      const localPath = await offlineStorage.getLocalFilePath(documentId);
      if (!localPath) return null;

      // Check for pending edits in queue
      const pendingEdits = this.workQueue.edits.filter(
        edit => edit.fileId === documentId && edit.editType === 'content'
      );

      if (pendingEdits.length > 0) {
        // Return the latest pending content
        const latestEdit = pendingEdits[pendingEdits.length - 1];
        return latestEdit?.data.content || null;
      }

      // Load content from local storage
      const content = await AsyncStorage.getItem(`offline_document_${documentId}`);
      return content;
    } catch (error) {
      console.error('Error getting offline document content:', error);
      return null;
    }
  }

  /**
   * Save document content offline
   */
  async saveDocumentContentOffline(
    documentId: string, 
    content: string, 
    title?: string
  ): Promise<void> {
    try {
      // Save content to local storage
      await AsyncStorage.setItem(`offline_document_${documentId}`, content);
      
      // Add content edit to work queue
      const contentEdit: OfflineEdit = {
        id: `${documentId}_content_${Date.now()}`,
        fileId: documentId,
        fileType: 'document',
        editType: 'content',
        timestamp: new Date(),
        data: { content },
        syncStatus: 'pending',
        retryCount: 0
      };

      await this.addEditToQueue(contentEdit);

      // Add title edit if provided
      if (title) {
        const titleEdit: OfflineEdit = {
          id: `${documentId}_title_${Date.now()}`,
          fileId: documentId,
          fileType: 'document',
          editType: 'title',
          timestamp: new Date(),
          data: { title },
          syncStatus: 'pending',
          retryCount: 0
        };

        await this.addEditToQueue(titleEdit);
      }

      // Mark file as modified in offline storage
      await offlineStorage.markFileAsModified(documentId);
    } catch (error) {
      console.error('Error saving document content offline:', error);
      throw error;
    }
  }

  /**
   * Get offline spreadsheet data
   */
  async getOfflineSpreadsheetData(spreadsheetId: string): Promise<unknown | null> {
    try {
      const localPath = await offlineStorage.getLocalFilePath(spreadsheetId);
      if (!localPath) return null;

      // Check for pending edits in queue
      const pendingEdits = this.workQueue.edits.filter(
        edit => edit.fileId === spreadsheetId && 
        (edit.editType === 'cell' || edit.editType === 'formula')
      );

      // Load base data from local storage
      const dataStr = await AsyncStorage.getItem(`offline_spreadsheet_${spreadsheetId}`);
      const data = dataStr ? JSON.parse(dataStr) : null;

      if (!data) return null;

      // Apply pending edits
      for (const edit of pendingEdits) {
        if (edit.editType === 'cell' && edit.data.cellRef) {
          if (!data.cells) data.cells = {};
          data.cells[edit.data.cellRef] = {
            value: edit.data.cellValue,
            formula: edit.data.formula
          };
        }
      }

      return data;
    } catch (error) {
      console.error('Error getting offline spreadsheet data:', error);
      return null;
    }
  }

  /**
   * Save spreadsheet cell offline
   */
  async saveSpreadsheetCellOffline(
    spreadsheetId: string,
    cellRef: string,
    value: unknown,
    formula?: string
  ): Promise<void> {
    try {
      // Load current data
      const currentData = await this.getOfflineSpreadsheetData(spreadsheetId) || { cells: {} };
      
      // Update cell data
      if (!currentData.cells) currentData.cells = {};
      const previousValue = currentData.cells[cellRef]?.value;
      
      currentData.cells[cellRef] = { value, formula };

      // Save updated data
      await AsyncStorage.setItem(
        `offline_spreadsheet_${spreadsheetId}`, 
        JSON.stringify(currentData)
      );

      // Add edit to work queue
      const edit: OfflineEdit = {
        id: `${spreadsheetId}_${cellRef}_${Date.now()}`,
        fileId: spreadsheetId,
        fileType: 'spreadsheet',
        editType: 'cell',
        timestamp: new Date(),
        data: {
          cellRef,
          cellValue: value,
          ...(formula && { formula }),
          previousValue
        },
        syncStatus: 'pending',
        retryCount: 0
      };

      await this.addEditToQueue(edit);

      // Mark file as modified
      await offlineStorage.markFileAsModified(spreadsheetId);
    } catch (error) {
      console.error('Error saving spreadsheet cell offline:', error);
      throw error;
    }
  }

  /**
   * Get pending edits for a file
   */
  getPendingEdits(fileId: string): OfflineEdit[] {
    return this.workQueue.edits.filter(edit => edit.fileId === fileId);
  }

  /**
   * Get all pending edits
   */
  getAllPendingEdits(): OfflineEdit[] {
    return [...this.workQueue.edits];
  }

  /**
   * Get work queue status
   */
  getWorkQueueStatus(): {
    totalEdits: number;
    pendingEdits: number;
    failedEdits: number;
    isProcessing: boolean;
    lastSyncAttempt?: Date;
  } {
    const pendingEdits = this.workQueue.edits.filter(e => e.syncStatus === 'pending').length;
    const failedEdits = this.workQueue.edits.filter(e => e.syncStatus === 'failed').length;

    return {
      totalEdits: this.workQueue.edits.length,
      pendingEdits,
      failedEdits,
      isProcessing: this.workQueue.isProcessing,
      ...(this.workQueue.lastSyncAttempt && { lastSyncAttempt: this.workQueue.lastSyncAttempt })
    };
  }

  /**
   * Manually trigger sync
   */
  async syncPendingEdits(): Promise<void> {
    if (this.workQueue.isProcessing) {
      console.warn('Sync already in progress');
      return;
    }

    try {
      this.workQueue.isProcessing = true;
      this.workQueue.lastSyncAttempt = new Date();

      const pendingEdits = this.workQueue.edits.filter(
        edit => edit.syncStatus === 'pending' || edit.syncStatus === 'failed'
      );

      for (const edit of pendingEdits) {
        try {
          await this.syncEdit(edit);
        } catch (error) {
          console.error(`Failed to sync edit ${edit.id}:`, error);
          edit.syncStatus = 'failed';
          edit.retryCount++;
          edit.error = error instanceof Error ? error.message : 'Unknown error';

          // Remove edit if max retries exceeded
          if (edit.retryCount >= this.config.maxRetries) {
            this.removeEditFromQueue(edit.id);
          }
        }
      }

      // Save updated queue
      await this.saveWorkQueue();
    } finally {
      this.workQueue.isProcessing = false;
    }
  }

  /**
   * Clear all offline edits for a file
   */
  async clearOfflineEdits(fileId: string): Promise<void> {
    try {
      // Remove edits from queue
      this.workQueue.edits = this.workQueue.edits.filter(edit => edit.fileId !== fileId);
      
      // Clear local storage
      await AsyncStorage.removeItem(`offline_document_${fileId}`);
      await AsyncStorage.removeItem(`offline_spreadsheet_${fileId}`);
      
      // Save updated queue
      await this.saveWorkQueue();
    } catch (error) {
      console.error('Error clearing offline edits:', error);
      throw error;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<OfflineEditingConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart auto-sync with new interval
    if (config.autoSyncInterval) {
      this.stopAutoSync();
      this.startAutoSync();
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopAutoSync();
    this.isInitialized = false;
  }

  // Private methods

  private async addEditToQueue(edit: OfflineEdit): Promise<void> {
    // Check queue size limit
    if (this.workQueue.edits.length >= this.config.maxQueueSize) {
      // Remove oldest synced edits
      this.workQueue.edits = this.workQueue.edits.filter(e => e.syncStatus !== 'synced');
      
      // If still over limit, remove oldest edits
      if (this.workQueue.edits.length >= this.config.maxQueueSize) {
        this.workQueue.edits = this.workQueue.edits.slice(-this.config.maxQueueSize + 1);
      }
    }

    this.workQueue.edits.push(edit);
    await this.saveWorkQueue();
  }

  private removeEditFromQueue(editId: string): void {
    this.workQueue.edits = this.workQueue.edits.filter(edit => edit.id !== editId);
  }

  private async syncEdit(edit: OfflineEdit): Promise<void> {
    edit.syncStatus = 'syncing';

    try {
      if (edit.fileType === 'document') {
        await this.syncDocumentEdit(edit);
      } else if (edit.fileType === 'spreadsheet') {
        await this.syncSpreadsheetEdit(edit);
      }

      edit.syncStatus = 'synced';
    } catch (error) {
      edit.syncStatus = 'failed';
      throw error;
    }
  }

  private async syncDocumentEdit(edit: OfflineEdit): Promise<void> {
    switch (edit.editType) {
      case 'content':
        if (edit.data.content) {
          await DocumentService.saveDocumentContent(edit.fileId, edit.data.content);
        }
        break;
      case 'title':
        if (edit.data.title) {
          await DocumentService.updateDocument(edit.fileId, { title: edit.data.title });
        }
        break;
      default:
        throw new Error(`Unknown document edit type: ${edit.editType}`);
    }
  }

  private async syncSpreadsheetEdit(edit: OfflineEdit): Promise<void> {
    switch (edit.editType) {
      case 'cell':
        if (edit.data.cellRef && edit.data.cellValue !== undefined) {
          // For now, we'll use a placeholder since SpreadsheetService might not exist yet
          // This should be replaced with actual spreadsheet service calls
          console.warn('Syncing cell edit:', edit.data.cellRef, edit.data.cellValue);
        }
        break;
      case 'formula':
        if (edit.data.cellRef && edit.data.formula) {
          // For now, we'll use a placeholder since SpreadsheetService might not exist yet
          // This should be replaced with actual spreadsheet service calls
          console.warn('Syncing formula edit:', edit.data.cellRef, edit.data.formula);
        }
        break;
      default:
        throw new Error(`Unknown spreadsheet edit type: ${edit.editType}`);
    }
  }

  private async loadWorkQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem('offline_work_queue');
      if (queueData) {
        const parsed = JSON.parse(queueData);
        this.workQueue = {
          ...parsed,
          edits: parsed.edits.map((edit: unknown) => ({
            ...edit,
            timestamp: new Date(edit.timestamp)
          })),
          lastSyncAttempt: parsed.lastSyncAttempt ? new Date(parsed.lastSyncAttempt) : undefined,
          isProcessing: false // Reset processing state on load
        };
      }
    } catch (error) {
      console.error('Error loading work queue:', error);
      // Initialize empty queue on error
      this.workQueue = { edits: [], isProcessing: false };
    }
  }

  private async saveWorkQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('offline_work_queue', JSON.stringify(this.workQueue));
    } catch (error) {
      console.error('Error saving work queue:', error);
    }
  }

  private startAutoSync(): void {
    if (this.syncTimer) return;

    this.syncTimer = setInterval(async () => {
      try {
        await this.syncPendingEdits();
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }, this.config.autoSyncInterval);
  }

  private stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
  }
}

// Export singleton instance
export const offlineEditingService = OfflineEditingService.getInstance();
export default offlineEditingService;