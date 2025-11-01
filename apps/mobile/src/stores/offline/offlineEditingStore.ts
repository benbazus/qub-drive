import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { offlineEditingService, OfflineEdit, OfflineEditingConfig } from '../../services/offlineEditingService';
import NetInfo from '@react-native-community/netinfo';

export interface OfflineEditingState {
  // State
  isInitialized: boolean;
  isOnline: boolean;
  pendingEdits: OfflineEdit[];
  workQueueStatus: {
    totalEdits: number;
    pendingEdits: number;
    failedEdits: number;
    isProcessing: boolean;
    lastSyncAttempt?: Date;
  };
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  refreshPendingEdits: () => void;
  refreshWorkQueueStatus: () => void;
  saveDocumentOffline: (documentId: string, content: string, title?: string) => Promise<void>;
  saveSpreadsheetCellOffline: (spreadsheetId: string, cellRef: string, value: unknown, formula?: string) => Promise<void>;
  getOfflineDocumentContent: (documentId: string) => Promise<string | null>;
  getOfflineSpreadsheetData: (spreadsheetId: string) => Promise<unknown | null>;
  syncPendingEdits: () => Promise<void>;
  clearOfflineEdits: (fileId: string) => Promise<void>;
  isFileAvailableForOfflineEditing: (fileId: string) => Promise<boolean>;
  getPendingEditsForFile: (fileId: string) => OfflineEdit[];
  updateConfig: (config: Partial<OfflineEditingConfig>) => void;
  
  // Internal actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setOnlineStatus: (isOnline: boolean) => void;
}

export const useOfflineEditingStore = create<OfflineEditingState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isInitialized: false,
    isOnline: true,
    pendingEdits: [],
    workQueueStatus: {
      totalEdits: 0,
      pendingEdits: 0,
      failedEdits: 0,
      isProcessing: false
    },
    isLoading: false,
    error: null,

    // Actions
    initialize: async () => {
      const { setLoading, setError, refreshPendingEdits, refreshWorkQueueStatus } = get();
      
      try {
        setLoading(true);
        setError(null);
        
        // Initialize offline editing service
        await offlineEditingService.initialize();
        
        // Set up network monitoring
        const unsubscribe = NetInfo.addEventListener(state => {
          get().setOnlineStatus(state.isConnected ?? false);
          
          // Auto-sync when coming back online
          if (state.isConnected && get().pendingEdits.length > 0) {
            get().syncPendingEdits();
          }
        });

        // Get initial network state
        const networkState = await NetInfo.fetch();
        get().setOnlineStatus(networkState.isConnected ?? false);
        
        // Load initial data
        refreshPendingEdits();
        refreshWorkQueueStatus();
        
        set({ isInitialized: true });
        
        // Store unsubscribe function for cleanup
        // Note: This is stored for cleanup but not exposed in the interface
        (get() as unknown as { _networkUnsubscribe: () => void })._networkUnsubscribe = unsubscribe;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize offline editing';
        setError(errorMessage);
        console.error('Failed to initialize offline editing store:', error);
      } finally {
        setLoading(false);
      }
    },

    refreshPendingEdits: () => {
      try {
        const pendingEdits = offlineEditingService.getAllPendingEdits();
        set({ pendingEdits });
      } catch (error) {
        console.error('Failed to refresh pending edits:', error);
        get().setError('Failed to load pending edits');
      }
    },

    refreshWorkQueueStatus: () => {
      try {
        const workQueueStatus = offlineEditingService.getWorkQueueStatus();
        set({ workQueueStatus });
      } catch (error) {
        console.error('Failed to refresh work queue status:', error);
        get().setError('Failed to load work queue status');
      }
    },

    saveDocumentOffline: async (documentId: string, content: string, title?: string) => {
      const { refreshPendingEdits, refreshWorkQueueStatus, setError } = get();
      
      try {
        setError(null);
        await offlineEditingService.saveDocumentContentOffline(documentId, content, title);
        
        // Refresh state
        refreshPendingEdits();
        refreshWorkQueueStatus();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save document offline';
        setError(errorMessage);
        throw error;
      }
    },

    saveSpreadsheetCellOffline: async (spreadsheetId: string, cellRef: string, value: unknown, formula?: string) => {
      const { refreshPendingEdits, refreshWorkQueueStatus, setError } = get();
      
      try {
        setError(null);
        await offlineEditingService.saveSpreadsheetCellOffline(spreadsheetId, cellRef, value, formula);
        
        // Refresh state
        refreshPendingEdits();
        refreshWorkQueueStatus();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save spreadsheet cell offline';
        setError(errorMessage);
        throw error;
      }
    },

    getOfflineDocumentContent: async (documentId: string) => {
      try {
        return await offlineEditingService.getOfflineDocumentContent(documentId);
      } catch (error) {
        console.error('Failed to get offline document content:', error);
        get().setError('Failed to load offline document content');
        return null;
      }
    },

    getOfflineSpreadsheetData: async (spreadsheetId: string) => {
      try {
        return await offlineEditingService.getOfflineSpreadsheetData(spreadsheetId);
      } catch (error) {
        console.error('Failed to get offline spreadsheet data:', error);
        get().setError('Failed to load offline spreadsheet data');
        return null;
      }
    },

    syncPendingEdits: async () => {
      const { refreshPendingEdits, refreshWorkQueueStatus, setError } = get();
      
      try {
        setError(null);
        await offlineEditingService.syncPendingEdits();
        
        // Refresh state
        refreshPendingEdits();
        refreshWorkQueueStatus();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to sync pending edits';
        setError(errorMessage);
        throw error;
      }
    },

    clearOfflineEdits: async (fileId: string) => {
      const { refreshPendingEdits, refreshWorkQueueStatus, setError } = get();
      
      try {
        setError(null);
        await offlineEditingService.clearOfflineEdits(fileId);
        
        // Refresh state
        refreshPendingEdits();
        refreshWorkQueueStatus();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to clear offline edits';
        setError(errorMessage);
        throw error;
      }
    },

    isFileAvailableForOfflineEditing: async (fileId: string) => {
      try {
        return await offlineEditingService.isFileAvailableForOfflineEditing(fileId);
      } catch (error) {
        console.error('Failed to check offline editing availability:', error);
        return false;
      }
    },

    getPendingEditsForFile: (fileId: string) => {
      return get().pendingEdits.filter(edit => edit.fileId === fileId);
    },

    updateConfig: (config: Partial<OfflineEditingConfig>) => {
      offlineEditingService.updateConfig(config);
    },

    // Internal actions
    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },

    setError: (error: string | null) => {
      set({ error });
    },

    setOnlineStatus: (isOnline: boolean) => {
      set({ isOnline });
    },
  }))
);

// Selectors for better performance
export const useOfflineEditingInitialized = () => useOfflineEditingStore(state => state.isInitialized);
export const useIsOnline = () => useOfflineEditingStore(state => state.isOnline);
export const usePendingEdits = () => useOfflineEditingStore(state => state.pendingEdits);
export const useWorkQueueStatus = () => useOfflineEditingStore(state => state.workQueueStatus);
export const useOfflineEditingLoading = () => useOfflineEditingStore(state => state.isLoading);
export const useOfflineEditingError = () => useOfflineEditingStore(state => state.error);

// Action selectors
export const useOfflineEditingActions = () => useOfflineEditingStore(state => ({
  initialize: state.initialize,
  refreshPendingEdits: state.refreshPendingEdits,
  refreshWorkQueueStatus: state.refreshWorkQueueStatus,
  saveDocumentOffline: state.saveDocumentOffline,
  saveSpreadsheetCellOffline: state.saveSpreadsheetCellOffline,
  getOfflineDocumentContent: state.getOfflineDocumentContent,
  getOfflineSpreadsheetData: state.getOfflineSpreadsheetData,
  syncPendingEdits: state.syncPendingEdits,
  clearOfflineEdits: state.clearOfflineEdits,
  isFileAvailableForOfflineEditing: state.isFileAvailableForOfflineEditing,
  getPendingEditsForFile: state.getPendingEditsForFile,
  updateConfig: state.updateConfig,
}));

export default useOfflineEditingStore;