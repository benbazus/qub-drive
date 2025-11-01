import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, Alert, TouchableOpacity, Text, SafeAreaView, ActivityIndicator } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SpreadsheetGrid } from "./SpreadsheetGrid";
import OfflineModeIndicator from '../offline/OfflineModeIndicator';
import {
  Sheet,
  CellValue,
  CellSelection,
  SpreadsheetViewport,
  Spreadsheet,
} from "@/types/spreadsheet";
import {
  useIsOnline,
  useOfflineEditingActions,
  usePendingEdits,
} from '../../stores/offline/offlineEditingStore';
import { useOffline } from '../../hooks/useOffline';
import { SpreadsheetService } from '../../services/spreadsheetService';

interface OfflineSpreadsheetEditorProps {
  spreadsheetId?: string;
  spreadsheet?: Spreadsheet;
  sheet?: Sheet;
  onCellEdit?: (cellRef: string, value: CellValue, formula?: string) => void;
  onCellSelect?: (selection: CellSelection) => void;
  onFormulaEdit?: (cellRef: string, formula: string) => void;
  readOnly?: boolean;
  showFormulas?: boolean;
  selectedCell?: string;
  viewport?: SpreadsheetViewport;
  onViewportChange?: (viewport: SpreadsheetViewport) => void;
}

const OfflineSpreadsheetEditor: React.FC<OfflineSpreadsheetEditorProps> = ({
  spreadsheetId,
  spreadsheet: initialSpreadsheet,
  sheet: initialSheet,
  onCellEdit,
  onCellSelect,
  onFormulaEdit,
  readOnly = false,
  showFormulas = false,
  selectedCell = "A1",
  viewport,
  onViewportChange,
}) => {
  const router = useRouter();
  
  // State
  const [spreadsheet, setSpreadsheet] = useState<Spreadsheet | null>(initialSpreadsheet || null);
  const [sheet, setSheet] = useState<Sheet | null>(initialSheet || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Offline editing hooks
  const isOnline = useIsOnline();
  const pendingEdits = usePendingEdits();
  const {
    saveSpreadsheetCellOffline,
    getOfflineSpreadsheetData,
    isFileAvailableForOfflineEditing,
    syncPendingEdits,
  } = useOfflineEditingActions();
  
  const { isFileAvailableOffline } = useOffline();

  // Check if spreadsheet has pending edits
  const spreadsheetPendingEdits = pendingEdits.filter(edit => 
    edit.fileId === (spreadsheetId || spreadsheet?.id)
  );

  // Load spreadsheet data (online or offline)
  useEffect(() => {
    if (spreadsheetId && !initialSpreadsheet) {
      loadSpreadsheet();
    }
  }, [spreadsheetId, initialSpreadsheet]);

  // Check offline availability
  useEffect(() => {
    const checkOfflineAvailability = async () => {
      if (spreadsheetId || spreadsheet?.id) {
        const fileId = spreadsheetId || spreadsheet!.id;
        const isAvailable = await isFileAvailableForOfflineEditing(fileId);
        const isOfflineAvailable = isFileAvailableOffline(fileId);
        setIsOfflineMode(isAvailable || isOfflineAvailable);
      }
    };

    checkOfflineAvailability();
  }, [spreadsheetId, spreadsheet?.id, isFileAvailableForOfflineEditing, isFileAvailableOffline, spreadsheet]);

  const loadSpreadsheet = async () => {
    if (!spreadsheetId) return;
    
    setIsLoading(true);
    try {
      let spreadsheetData: Spreadsheet;
      let sheetData: Sheet;

      // For now, create a simple mock spreadsheet structure
      // This should be replaced with actual spreadsheet loading logic
      const mockSheet: Sheet = {
        id: 'sheet1',
        title: 'Sheet1',
        index: 0,
        gridProperties: {
          rowCount: 1000,
          columnCount: 26,
          frozenRowCount: 0,
          frozenColumnCount: 0,
          hideGridlines: false,
        },
        cells: {},
        mergedRanges: [],
        conditionalFormatting: [],
        protectedRanges: [],
        filterViews: [],
        isHidden: false,
      };

      spreadsheetData = {
        id: spreadsheetId,
        documentId: spreadsheetId,
        title: 'Offline Spreadsheet',
        sheets: [mockSheet],
        namedRanges: [],
        charts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerId: 'offline',
        permissions: {
          canEdit: true,
          canShare: false,
          canDelete: false,
          canComment: true,
          canExport: true,
        },
        version: 1,
        lastSavedAt: new Date(),
        autoSaveEnabled: true,
      };
      
      sheetData = mockSheet;

      setSpreadsheet(spreadsheetData);
      setSheet(sheetData);
    } catch (loadError) {
      console.error('Error loading spreadsheet:', loadError);
      Alert.alert('Error', 'Failed to load spreadsheet');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced cell edit handler with offline support
  const handleCellEditWithOffline = useCallback(
    async (cellRef: string, value: CellValue, formula?: string) => {
      if (readOnly || !sheet) return;

      const fileId = spreadsheetId || spreadsheet?.id;
      if (!fileId) return;

      setIsSaving(true);
      setHasUnsavedChanges(true);

      try {
        // Update local sheet data immediately
        const updatedSheet = {
          ...sheet,
          cells: {
            ...sheet.cells,
            [cellRef]: {
              value,
              formula,
              format: sheet.cells[cellRef]?.format || { numberFormat: { type: 'TEXT' } },
              note: sheet.cells[cellRef]?.note,
              textFormat: sheet.cells[cellRef]?.textFormat,
              dataValidation: sheet.cells[cellRef]?.dataValidation,
              pivotTable: sheet.cells[cellRef]?.pivotTable,
              textRotation: sheet.cells[cellRef]?.textRotation,
              hyperlink: sheet.cells[cellRef]?.hyperlink,
            },
          },
        };
        setSheet(updatedSheet);

        // Call parent handler if provided
        if (onCellEdit) {
          onCellEdit(cellRef, value, formula);
        }

        // Save based on online/offline status
        if (isOnline && !isOfflineMode) {
          // Save online - for now just log since service is not fully implemented
          console.warn('Online spreadsheet save not implemented:', { fileId, cellRef, value, formula });
          setHasUnsavedChanges(false);
        } else {
          // Save offline
          await saveSpreadsheetCellOffline(fileId, cellRef, String(value), formula);
        }
      } catch (error) {
        console.error('Error saving cell:', error);
        Alert.alert('Error', 'Failed to save cell changes');
        
        // Revert local changes on error
        if (sheet.cells[cellRef]) {
          const revertedSheet = {
            ...sheet,
            cells: {
              ...sheet.cells,
              [cellRef]: sheet.cells[cellRef],
            },
          };
          setSheet(revertedSheet);
        }
      } finally {
        setIsSaving(false);
      }
    },
    [
      readOnly,
      sheet,
      spreadsheetId,
      spreadsheet?.id,
      onCellEdit,
      isOnline,
      isOfflineMode,
      saveSpreadsheetCellOffline,
    ]
  );

  // Enhanced cell selection handler
  const handleCellSelectWithOffline = useCallback(
    (selection: CellSelection) => {
      if (onCellSelect) {
        onCellSelect(selection);
      }
    },
    [onCellSelect]
  );

  // Enhanced formula editing handler
  const handleFormulaEditWithOffline = useCallback(
    async (cellRef: string, formula: string) => {
      if (readOnly) return;

      if (onFormulaEdit) {
        onFormulaEdit(cellRef, formula);
      }

      // Save the formula as a cell edit
      await handleCellEditWithOffline(cellRef, '', formula);
    },
    [readOnly, onFormulaEdit, handleCellEditWithOffline]
  );

  const handleSync = async () => {
    if (!isOnline) {
      Alert.alert(
        'No Internet Connection',
        'Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await syncPendingEdits();
      setHasUnsavedChanges(false);
      Alert.alert('Success', 'Spreadsheet has been synced.');
    } catch (error) {
      Alert.alert('Sync Failed', 'Failed to sync spreadsheet. Please try again later.');
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges || spreadsheetPendingEdits.length > 0) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to sync before leaving?',
        [
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => router.back()
          },
          {
            text: 'Sync Later',
            onPress: () => router.back()
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } else {
      router.back();
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      
      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {spreadsheet?.title || 'Untitled Spreadsheet'}
        </Text>
        {sheet && (
          <Text style={styles.subtitle}>
            Sheet: {sheet.title || 'Sheet1'}
          </Text>
        )}
      </View>
      
      <View style={styles.headerActions}>
        <OfflineModeIndicator style={styles.offlineIndicator} />
        
        {spreadsheetPendingEdits.length > 0 && isOnline && (
          <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
            <Ionicons name="sync-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        )}
        
        {isSaving && (
          <ActivityIndicator size="small" color="#4A90E2" style={styles.savingIndicator} />
        )}
      </View>
    </View>
  );

  const renderStatusBar = () => {
    // Show offline mode status
    if (!isOnline || isOfflineMode) {
      return (
        <View style={[styles.statusBar, styles.offlineStatus]}>
          <Ionicons name="cloud-offline-outline" size={16} color="#FF9500" />
          <Text style={styles.offlineStatusText}>
            {spreadsheetPendingEdits.length > 0 
              ? `Offline • ${spreadsheetPendingEdits.length} pending changes`
              : 'Offline mode'
            }
          </Text>
        </View>
      );
    }

    if (isSaving) {
      return (
        <View style={[styles.statusBar, styles.saving]}>
          <ActivityIndicator size="small" color="#6c757d" />
          <Text style={styles.savingText}>Saving...</Text>
        </View>
      );
    }

    return null;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading spreadsheet...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!sheet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>Failed to load spreadsheet</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSpreadsheet}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderStatusBar()}
      
      <View style={styles.gridContainer}>
        <SpreadsheetGrid
          sheet={sheet}
          onCellEdit={handleCellEditWithOffline}
          onCellSelect={handleCellSelectWithOffline}
          onFormulaEdit={handleFormulaEditWithOffline}
          readOnly={readOnly}
          showFormulas={showFormulas}
          selectedCell={selectedCell}
          viewport={
            viewport || {
              startRow: 0,
              endRow: 20,
              startColumn: 0,
              endColumn: 10,
              scale: 1,
              offsetX: 0,
              offsetY: 0,
            }
          }
          onViewportChange={onViewportChange || (() => {})}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#333',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineIndicator: {
    marginRight: 4,
  },
  syncButton: {
    padding: 8,
  },
  savingIndicator: {
    marginRight: 8,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
  },
  saving: {
    backgroundColor: '#fff3cd',
  },
  offlineStatus: {
    backgroundColor: '#fff3cd',
  },
  savingText: {
    fontSize: 12,
    color: '#856404',
    marginLeft: 8,
  },
  offlineStatusText: {
    fontSize: 12,
    color: '#856404',
    marginLeft: 8,
  },
  gridContainer: {
    flex: 1,
  },
});

export default OfflineSpreadsheetEditor;