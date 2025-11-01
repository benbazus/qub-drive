import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import {
  Spreadsheet,
  SpreadsheetCreateRequest,
  SpreadsheetUpdateRequest,
  CellValue,
  Sheet,
} from '@/types/spreadsheet';
import { SpreadsheetService } from '@/services/spreadsheetService';

interface UseSpreadsheetOptions {
  spreadsheetId?: string;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

interface UseSpreadsheetReturn {
  // State
  spreadsheet: Spreadsheet | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  
  // Actions
  createSpreadsheet: (data: SpreadsheetCreateRequest) => Promise<Spreadsheet | null>;
  updateSpreadsheet: (data: SpreadsheetUpdateRequest) => Promise<void>;
  deleteSpreadsheet: () => Promise<void>;
  saveSpreadsheet: () => Promise<void>;
  
  // Cell operations
  updateCell: (sheetId: string, cellRef: string, value: CellValue, formula?: string) => Promise<void>;
  batchUpdateCells: (updates: Array<{ sheetId: string; cellRef: string; value: CellValue; formula?: string }>) => Promise<void>;
  
  // Sheet operations
  addSheet: (title: string) => Promise<void>;
  renameSheet: (sheetId: string, title: string) => Promise<void>;
  deleteSheet: (sheetId: string) => Promise<void>;
  duplicateSheet: (sheetId: string) => Promise<void>;
  
  // Export
  exportSpreadsheet: (format: 'xlsx' | 'csv' | 'pdf' | 'ods') => Promise<Blob | null>;
  
  // Utility
  refresh: () => Promise<void>;
  hasUnsavedChanges: boolean;
}

export const useSpreadsheet = (options: UseSpreadsheetOptions = {}): UseSpreadsheetReturn => {
  const { spreadsheetId, autoSave = false, autoSaveInterval = 30000 } = options;
  
  // State
  const [spreadsheet, setSpreadsheet] = useState<Spreadsheet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);

  // Load spreadsheet
  const loadSpreadsheet = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await SpreadsheetService.getSpreadsheet(id);
      setSpreadsheet(data);
      setHasUnsavedChanges(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load spreadsheet';
      setError(errorMessage);
      console.error('Error loading spreadsheet:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize spreadsheet
  useEffect(() => {
    if (spreadsheetId) {
      loadSpreadsheet(spreadsheetId);
    }
  }, [spreadsheetId, loadSpreadsheet]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !hasUnsavedChanges || !spreadsheet) return;

    const autoSaveTimer = setTimeout(async () => {
      try {
        await saveSpreadsheet();
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    }, autoSaveInterval);

    return () => clearTimeout(autoSaveTimer);
  }, [autoSave, hasUnsavedChanges, autoSaveInterval, spreadsheet]);

  // Create spreadsheet
  const createSpreadsheet = useCallback(async (data: SpreadsheetCreateRequest): Promise<Spreadsheet | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const newSpreadsheet = await SpreadsheetService.createSpreadsheet(data);
      setSpreadsheet(newSpreadsheet);
      setHasUnsavedChanges(false);
      return newSpreadsheet;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create spreadsheet';
      setError(errorMessage);
      console.error('Error creating spreadsheet:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update spreadsheet metadata
  const updateSpreadsheet = useCallback(async (data: SpreadsheetUpdateRequest) => {
    if (!spreadsheet) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const updatedSpreadsheet = await SpreadsheetService.updateSpreadsheet(spreadsheet.id, data);
      setSpreadsheet(updatedSpreadsheet);
      setHasUnsavedChanges(false);
      setLastSaveTime(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update spreadsheet';
      setError(errorMessage);
      console.error('Error updating spreadsheet:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [spreadsheet]);

  // Delete spreadsheet
  const deleteSpreadsheet = useCallback(async () => {
    if (!spreadsheet) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await SpreadsheetService.deleteSpreadsheet(spreadsheet.id);
      setSpreadsheet(null);
      setHasUnsavedChanges(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete spreadsheet';
      setError(errorMessage);
      console.error('Error deleting spreadsheet:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [spreadsheet]);

  // Save spreadsheet
  const saveSpreadsheet = useCallback(async () => {
    if (!spreadsheet || !hasUnsavedChanges) return;
    
    setSaving(true);
    setError(null);
    
    try {
      // In a real implementation, you would send the changes to the server
      // For now, we'll just mark as saved
      setHasUnsavedChanges(false);
      setLastSaveTime(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save spreadsheet';
      setError(errorMessage);
      console.error('Error saving spreadsheet:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [spreadsheet, hasUnsavedChanges]);

  // Update cell
  const updateCell = useCallback(async (sheetId: string, cellRef: string, value: CellValue, formula?: string) => {
    if (!spreadsheet) return;
    
    try {
      await SpreadsheetService.updateCell(spreadsheet.id, sheetId, cellRef, value, formula);
      
      // Update local state
      setSpreadsheet(prev => {
        if (!prev) return prev;
        
        const updatedSheets = prev.sheets.map(sheet => {
          if (sheet.id === sheetId) {
            const updatedCells = { ...sheet.cells };
            updatedCells[cellRef] = {
              value,
              formula,
              format: SpreadsheetService.createDefaultCellFormat(),
            };
            
            return { ...sheet, cells: updatedCells };
          }
          return sheet;
        });
        
        return { ...prev, sheets: updatedSheets, version: prev.version + 1 };
      });
      
      setHasUnsavedChanges(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update cell';
      setError(errorMessage);
      console.error('Error updating cell:', err);
      throw err;
    }
  }, [spreadsheet]);

  // Batch update cells
  const batchUpdateCells = useCallback(async (updates: Array<{ sheetId: string; cellRef: string; value: CellValue; formula?: string }>) => {
    if (!spreadsheet) return;
    
    try {
      const batchUpdates = updates.map(update => ({
        sheetId: update.sheetId,
        cellReference: update.cellRef,
        value: update.value,
        formula: update.formula,
      }));
      
      await SpreadsheetService.batchUpdateCells(spreadsheet.id, batchUpdates);
      
      // Update local state
      setSpreadsheet(prev => {
        if (!prev) return prev;
        
        const updatedSheets = prev.sheets.map(sheet => {
          const sheetUpdates = updates.filter(update => update.sheetId === sheet.id);
          if (sheetUpdates.length === 0) return sheet;
          
          const updatedCells = { ...sheet.cells };
          sheetUpdates.forEach(update => {
            updatedCells[update.cellRef] = {
              value: update.value,
              formula: update.formula,
              format: SpreadsheetService.createDefaultCellFormat(),
            };
          });
          
          return { ...sheet, cells: updatedCells };
        });
        
        return { ...prev, sheets: updatedSheets, version: prev.version + 1 };
      });
      
      setHasUnsavedChanges(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update cells';
      setError(errorMessage);
      console.error('Error updating cells:', err);
      throw err;
    }
  }, [spreadsheet]);

  // Add sheet
  const addSheet = useCallback(async (title: string) => {
    if (!spreadsheet) return;
    
    try {
      const newSheet = await SpreadsheetService.createSheet(spreadsheet.id, title);
      
      setSpreadsheet(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          sheets: [...prev.sheets, newSheet],
          version: prev.version + 1,
        };
      });
      
      setHasUnsavedChanges(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add sheet';
      setError(errorMessage);
      console.error('Error adding sheet:', err);
      throw err;
    }
  }, [spreadsheet]);

  // Rename sheet
  const renameSheet = useCallback(async (sheetId: string, title: string) => {
    if (!spreadsheet) return;
    
    try {
      // In a real implementation, you would call the API to rename the sheet
      setSpreadsheet(prev => {
        if (!prev) return prev;
        
        const updatedSheets = prev.sheets.map(sheet =>
          sheet.id === sheetId ? { ...sheet, title } : sheet
        );
        
        return { ...prev, sheets: updatedSheets, version: prev.version + 1 };
      });
      
      setHasUnsavedChanges(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rename sheet';
      setError(errorMessage);
      console.error('Error renaming sheet:', err);
      throw err;
    }
  }, [spreadsheet]);

  // Delete sheet
  const deleteSheet = useCallback(async (sheetId: string) => {
    if (!spreadsheet || spreadsheet.sheets.length <= 1) {
      Alert.alert('Error', 'Cannot delete the last sheet');
      return;
    }
    
    try {
      await SpreadsheetService.deleteSheet(spreadsheet.id, sheetId);
      
      setSpreadsheet(prev => {
        if (!prev) return prev;
        
        const updatedSheets = prev.sheets.filter(sheet => sheet.id !== sheetId);
        return { ...prev, sheets: updatedSheets, version: prev.version + 1 };
      });
      
      setHasUnsavedChanges(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete sheet';
      setError(errorMessage);
      console.error('Error deleting sheet:', err);
      throw err;
    }
  }, [spreadsheet]);

  // Duplicate sheet
  const duplicateSheet = useCallback(async (sheetId: string) => {
    if (!spreadsheet) return;
    
    try {
      const originalSheet = spreadsheet.sheets.find(sheet => sheet.id === sheetId);
      if (!originalSheet) return;
      
      const newSheet = await SpreadsheetService.createSheet(spreadsheet.id, `${originalSheet.title} Copy`);
      
      setSpreadsheet(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          sheets: [...prev.sheets, newSheet],
          version: prev.version + 1,
        };
      });
      
      setHasUnsavedChanges(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate sheet';
      setError(errorMessage);
      console.error('Error duplicating sheet:', err);
      throw err;
    }
  }, [spreadsheet]);

  // Export spreadsheet
  const exportSpreadsheet = useCallback(async (format: 'xlsx' | 'csv' | 'pdf' | 'ods'): Promise<Blob | null> => {
    if (!spreadsheet) return null;
    
    try {
      return await SpreadsheetService.exportSpreadsheet(spreadsheet.id, format);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export spreadsheet';
      setError(errorMessage);
      console.error('Error exporting spreadsheet:', err);
      return null;
    }
  }, [spreadsheet]);

  // Refresh spreadsheet
  const refresh = useCallback(async () => {
    if (spreadsheetId) {
      await loadSpreadsheet(spreadsheetId);
    }
  }, [spreadsheetId, loadSpreadsheet]);

  return {
    // State
    spreadsheet,
    loading,
    error,
    saving,
    
    // Actions
    createSpreadsheet,
    updateSpreadsheet,
    deleteSpreadsheet,
    saveSpreadsheet,
    
    // Cell operations
    updateCell,
    batchUpdateCells,
    
    // Sheet operations
    addSheet,
    renameSheet,
    deleteSheet,
    duplicateSheet,
    
    // Export
    exportSpreadsheet,
    
    // Utility
    refresh,
    hasUnsavedChanges,
  };
};