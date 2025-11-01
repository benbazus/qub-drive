import { useEffect, useState, useCallback } from 'react';
import {
  useOfflineEditingStore,
  useOfflineEditingActions,
  useIsOnline,
  usePendingEdits,
  useWorkQueueStatus,
} from '../stores/offline/offlineEditingStore';
import { OfflineEdit, OfflineEditingConfig } from '../services/offlineEditingService';

export interface UseOfflineEditingOptions {
  autoInitialize?: boolean;
  fileId?: string;
}

export interface UseOfflineEditingReturn {
  // State
  isInitialized: boolean;
  isOnline: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Work queue
  allPendingEdits: OfflineEdit[];
  filePendingEdits: OfflineEdit[];
  workQueueStatus: {
    totalEdits: number;
    pendingEdits: number;
    failedEdits: number;
    isProcessing: boolean;
    lastSyncAttempt?: Date;
  };

  // Actions
  initialize: () => Promise<void>;
  saveDocumentOffline: (documentId: string, content: string, title?: string) => Promise<void>;
  saveSpreadsheetCellOffline: (spreadsheetId: string, cellRef: string, value: any, formula?: string) => Promise<void>;
  getOfflineDocumentContent: (documentId: string) => Promise<string | null>;
  getOfflineSpreadsheetData: (spreadsheetId: string) => Promise<any | null>;
  syncPendingEdits: () => Promise<void>;
  syncFileEdits: (fileId: string) => Promise<void>;
  clearOfflineEdits: (fileId: string) => Promise<void>;
  clearAllOfflineEdits: () => Promise<void>;
  isFileAvailableForOfflineEditing: (fileId: string) => Promise<boolean>;
  updateConfig: (config: Partial<OfflineEditingConfig>) => void;
  
  // Utilities
  hasUnsavedChanges: (fileId?: string) => boolean;
  getEditCount: (fileId?: string) => number;
  getLastEditTime: (fileId?: string) => Date | null;
}

export const useOfflineEditing = (options: UseOfflineEditingOptions = {}): UseOfflineEditingReturn => {
  const {
    autoInitialize = true,
    fileId,
  } = options;

  const store = useOfflineEditingStore();
  const actions = useOfflineEditingActions();
  const isOnline = useIsOnline();
  const allPendingEdits = usePendingEdits();
  const workQueueStatus = useWorkQueueStatus();

  // Filter edits for specific file if provided
  const filePendingEdits = fileId 
    ? allPendingEdits.filter(edit => edit.fileId === fileId)
    : [];

  // Auto-initialize if requested
  useEffect(() => {
    if (autoInitialize && !store.isInitialized) {
      actions.initialize();
    }
  }, [autoInitialize, store.isInitialized, actions.initialize]);

  // Sync file-specific edits
  const syncFileEdits = useCallback(async (targetFileId: string) => {
    const fileEdits = allPendingEdits.filter(edit => edit.fileId === targetFileId);
    if (fileEdits.length === 0) return;

    // For now, we sync all pending edits since the service doesn't support file-specific sync
    // This could be optimized in the future
    await actions.syncPendingEdits();
  }, [allPendingEdits, actions.syncPendingEdits]);

  // Clear all offline edits
  const clearAllOfflineEdits = useCallback(async () => {
    const uniqueFileIds = [...new Set(allPendingEdits.map(edit => edit.fileId))];
    for (const fileId of uniqueFileIds) {
      await actions.clearOfflineEdits(fileId);
    }
  }, [allPendingEdits, actions.clearOfflineEdits]);

  // Check if file has unsaved changes
  const hasUnsavedChanges = useCallback((targetFileId?: string) => {
    if (targetFileId) {
      return allPendingEdits.some(edit => edit.fileId === targetFileId);
    }
    return allPendingEdits.length > 0;
  }, [allPendingEdits]);

  // Get edit count for file or all files
  const getEditCount = useCallback((targetFileId?: string) => {
    if (targetFileId) {
      return allPendingEdits.filter(edit => edit.fileId === targetFileId).length;
    }
    return allPendingEdits.length;
  }, [allPendingEdits]);

  // Get last edit time for file or all files
  const getLastEditTime = useCallback((targetFileId?: string) => {
    const edits = targetFileId 
      ? allPendingEdits.filter(edit => edit.fileId === targetFileId)
      : allPendingEdits;
    
    if (edits.length === 0) return null;
    
    const sortedEdits = edits.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return sortedEdits[0].timestamp;
  }, [allPendingEdits]);

  return {
    // State
    isInitialized: store.isInitialized,
    isOnline,
    isLoading: store.isLoading,
    error: store.error,
    
    // Work queue
    allPendingEdits,
    filePendingEdits,
    workQueueStatus,

    // Actions
    initialize: actions.initialize,
    saveDocumentOffline: actions.saveDocumentOffline,
    saveSpreadsheetCellOffline: actions.saveSpreadsheetCellOffline,
    getOfflineDocumentContent: actions.getOfflineDocumentContent,
    getOfflineSpreadsheetData: actions.getOfflineSpreadsheetData,
    syncPendingEdits: actions.syncPendingEdits,
    syncFileEdits,
    clearOfflineEdits: actions.clearOfflineEdits,
    clearAllOfflineEdits,
    isFileAvailableForOfflineEditing: actions.isFileAvailableForOfflineEditing,
    updateConfig: actions.updateConfig,
    
    // Utilities
    hasUnsavedChanges,
    getEditCount,
    getLastEditTime,
  };
};

export interface UseOfflineFileEditingOptions {
  fileId: string;
  fileType: 'document' | 'spreadsheet';
  autoSync?: boolean;
}

export interface UseOfflineFileEditingReturn {
  // File-specific state
  pendingEdits: OfflineEdit[];
  hasUnsavedChanges: boolean;
  editCount: number;
  lastEditTime: Date | null;
  isAvailableOffline: boolean;
  
  // Actions
  saveDocument: (content: string, title?: string) => Promise<void>;
  saveSpreadsheetCell: (cellRef: string, value: any, formula?: string) => Promise<void>;
  getDocumentContent: () => Promise<string | null>;
  getSpreadsheetData: () => Promise<any | null>;
  syncEdits: () => Promise<void>;
  clearEdits: () => Promise<void>;
  checkAvailability: () => Promise<boolean>;
}

export const useOfflineFileEditing = (options: UseOfflineFileEditingOptions): UseOfflineFileEditingReturn => {
  const { fileId, fileType, autoSync = false } = options;
  
  const [isAvailableOffline, setIsAvailableOffline] = useState(false);
  
  const {
    filePendingEdits,
    hasUnsavedChanges,
    getEditCount,
    getLastEditTime,
    saveDocumentOffline,
    saveSpreadsheetCellOffline,
    getOfflineDocumentContent,
    getOfflineSpreadsheetData,
    syncFileEdits,
    clearOfflineEdits,
    isFileAvailableForOfflineEditing,
    isOnline,
  } = useOfflineEditing({ fileId });

  // Check offline availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      const available = await isFileAvailableForOfflineEditing(fileId);
      setIsAvailableOffline(available);
    };
    
    checkAvailability();
  }, [fileId, isFileAvailableForOfflineEditing]);

  // Auto-sync when coming online
  useEffect(() => {
    if (autoSync && isOnline && hasUnsavedChanges) {
      syncFileEdits(fileId).catch(console.error);
    }
  }, [autoSync, isOnline, hasUnsavedChanges, fileId, syncFileEdits]);

  const saveDocument = useCallback(async (content: string, title?: string) => {
    if (fileType !== 'document') {
      throw new Error('File type must be document for document operations');
    }
    await saveDocumentOffline(fileId, content, title);
  }, [fileType, fileId, saveDocumentOffline]);

  const saveSpreadsheetCell = useCallback(async (cellRef: string, value: any, formula?: string) => {
    if (fileType !== 'spreadsheet') {
      throw new Error('File type must be spreadsheet for spreadsheet operations');
    }
    await saveSpreadsheetCellOffline(fileId, cellRef, value, formula);
  }, [fileType, fileId, saveSpreadsheetCellOffline]);

  const getDocumentContent = useCallback(async () => {
    if (fileType !== 'document') return null;
    return await getOfflineDocumentContent(fileId);
  }, [fileType, fileId, getOfflineDocumentContent]);

  const getSpreadsheetData = useCallback(async () => {
    if (fileType !== 'spreadsheet') return null;
    return await getOfflineSpreadsheetData(fileId);
  }, [fileType, fileId, getOfflineSpreadsheetData]);

  const syncEdits = useCallback(async () => {
    await syncFileEdits(fileId);
  }, [fileId, syncFileEdits]);

  const clearEdits = useCallback(async () => {
    await clearOfflineEdits(fileId);
  }, [fileId, clearOfflineEdits]);

  const checkAvailability = useCallback(async () => {
    const available = await isFileAvailableForOfflineEditing(fileId);
    setIsAvailableOffline(available);
    return available;
  }, [fileId, isFileAvailableForOfflineEditing]);

  return {
    // File-specific state
    pendingEdits: filePendingEdits,
    hasUnsavedChanges,
    editCount: getEditCount(fileId),
    lastEditTime: getLastEditTime(fileId),
    isAvailableOffline,
    
    // Actions
    saveDocument,
    saveSpreadsheetCell,
    getDocumentContent,
    getSpreadsheetData,
    syncEdits,
    clearEdits,
    checkAvailability,
  };
};

export default useOfflineEditing;