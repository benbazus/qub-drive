import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import {
  Spreadsheet,
  Sheet,
  CellValue,
  CellSelection,
  SpreadsheetViewport,
  MobileSpreadsheetProps,
  CellEditingState,
  FormulaInputState,
} from '@/types/spreadsheet';
import { SpreadsheetService } from '@/services/spreadsheetService';
import { CollaborativeSpreadsheet } from './CollaborativeSpreadsheet';
import { CellEditor } from './CellEditor';
import { FormulaInput } from './FormulaInput';
import { SpreadsheetToolbar } from './SpreadsheetToolbar';
import { SheetTabs } from './SheetTabs';

interface SpreadsheetInterfaceProps extends Omit<MobileSpreadsheetProps, 'activeSheetId'> {
  onSave?: () => Promise<void>;
  onExport?: (format: 'xlsx' | 'csv' | 'pdf') => Promise<void>;
  onShare?: () => void;
  loading?: boolean;
  error?: string;
}

export const SpreadsheetInterface: React.FC<SpreadsheetInterfaceProps> = ({
  spreadsheet,
  onCellEdit,
  onSheetChange,
  onZoom,
  onSave,
  onExport,
  onShare,
  readOnly = false,
  showFormulas = false,
  loading = false,
  error,
}) => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // State
  const [activeSheetId, setActiveSheetId] = useState<string>(
    spreadsheet.sheets[0]?.id || ''
  );
  const [selectedCell, setSelectedCell] = useState<string>('A1');
  const [selection, setSelection] = useState<CellSelection | null>(null);
  const [viewport, setViewport] = useState<SpreadsheetViewport>({
    startRow: 0,
    endRow: Math.ceil(screenHeight / 32) + 5,
    startColumn: 0,
    endColumn: Math.ceil(screenWidth / 80) + 5,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  
  // Editor states
  const [cellEditorVisible, setCellEditorVisible] = useState(false);
  const [formulaInputVisible, setFormulaInputVisible] = useState(false);
  const [editingCell, setEditingCell] = useState<string | null>(null);

  // Get active sheet
  const activeSheet = useMemo(() => {
    return spreadsheet.sheets.find(sheet => sheet.id === activeSheetId) || spreadsheet.sheets[0];
  }, [spreadsheet.sheets, activeSheetId]);

  // Handle sheet change
  const handleSheetChange = useCallback((sheetId: string) => {
    setActiveSheetId(sheetId);
    onSheetChange(sheetId);
    
    // Reset selection when changing sheets
    setSelectedCell('A1');
    setSelection(null);
  }, [onSheetChange]);

  // Handle cell selection
  const handleCellSelect = useCallback((newSelection: CellSelection) => {
    setSelection(newSelection);
    setSelectedCell(newSelection.startCell);
  }, []);

  // Handle cell edit (double tap or edit button)
  const handleCellEditStart = useCallback((cellRef: string, value: CellValue, formula?: string) => {
    if (readOnly) return;
    
    setEditingCell(cellRef);
    
    if (formula) {
      // Open formula editor for formulas
      setFormulaInputVisible(true);
    } else {
      // Open cell editor for regular values
      setCellEditorVisible(true);
    }
  }, [readOnly]);

  // Handle formula edit
  const handleFormulaEdit = useCallback((cellRef: string, formula: string) => {
    if (readOnly) return;
    
    setEditingCell(cellRef);
    setFormulaInputVisible(true);
  }, [readOnly]);

  // Handle cell value save
  const handleCellSave = useCallback(async (value: CellValue, formula?: string) => {
    if (!editingCell || !activeSheet) return;
    
    try {
      await onCellEdit(activeSheet.id, editingCell, value, formula);
      setCellEditorVisible(false);
      setEditingCell(null);
    } catch (error) {
      console.error('Error saving cell:', error);
      Alert.alert('Error', 'Failed to save cell value');
    }
  }, [editingCell, activeSheet, onCellEdit]);

  // Handle formula save
  const handleFormulaSave = useCallback(async (formula: string) => {
    if (!editingCell || !activeSheet) return;
    
    try {
      // Formula will be calculated by the backend
      await onCellEdit(activeSheet.id, editingCell, { type: 'string', value: '' }, formula);
      setFormulaInputVisible(false);
      setEditingCell(null);
    } catch (error) {
      console.error('Error saving formula:', error);
      Alert.alert('Error', 'Failed to save formula');
    }
  }, [editingCell, activeSheet, onCellEdit]);

  // Handle editor cancel
  const handleEditorCancel = useCallback(() => {
    setCellEditorVisible(false);
    setFormulaInputVisible(false);
    setEditingCell(null);
  }, []);

  // Handle formula preview
  const handleFormulaPreview = useCallback(async (formula: string): Promise<CellValue> => {
    if (!activeSheet) {
      return { type: 'error', value: 'INVALID_VALUE' };
    }
    
    try {
      return await SpreadsheetService.calculateFormula(spreadsheet.id, activeSheet.id, formula);
    } catch (error) {
      return { type: 'error', value: 'INVALID_VALUE' };
    }
  }, [spreadsheet.id, activeSheet]);

  // Handle viewport change
  const handleViewportChange = useCallback((newViewport: SpreadsheetViewport) => {
    setViewport(newViewport);
    onZoom(newViewport.scale);
  }, [onZoom]);

  // Handle toolbar actions
  const handleToolbarAction = useCallback((action: string) => {
    switch (action) {
      case 'save':
        onSave?.();
        break;
      case 'export':
        // Show export options
        Alert.alert(
          'Export Spreadsheet',
          'Choose export format',
          [
            { text: 'Excel (.xlsx)', onPress: () => onExport?.('xlsx') },
            { text: 'CSV', onPress: () => onExport?.('csv') },
            { text: 'PDF', onPress: () => onExport?.('pdf') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        break;
      case 'share':
        onShare?.();
        break;
      case 'formula':
        if (selectedCell) {
          handleFormulaEdit(selectedCell, '');
        }
        break;
      case 'format':
        // TODO: Implement cell formatting
        break;
      default:
        break;
    }
  }, [selectedCell, onSave, onExport, onShare, handleFormulaEdit]);

  // Get current cell for editing
  const getCurrentCell = useCallback(() => {
    if (!editingCell || !activeSheet) return undefined;
    return activeSheet.cells[editingCell];
  }, [editingCell, activeSheet]);

  // Handle zoom gesture
  const handleZoom = useCallback((scale: number) => {
    setViewport(prev => ({ ...prev, scale }));
    onZoom(scale);
  }, [onZoom]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#f44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!activeSheet) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading spreadsheet...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Toolbar */}
      <SpreadsheetToolbar
        selectedCell={selectedCell}
        onAction={handleToolbarAction}
        readOnly={readOnly}
        showFormulas={showFormulas}
        loading={loading}
      />

      {/* Sheet Tabs */}
      <SheetTabs
        sheets={spreadsheet.sheets}
        activeSheetId={activeSheetId}
        onSheetChange={handleSheetChange}
        readOnly={readOnly}
      />

      {/* Main Grid */}
      <View style={styles.gridContainer}>
        <CollaborativeSpreadsheet
          spreadsheetId={spreadsheet.id}
          sheet={activeSheet}
          onCellEdit={handleCellEditStart}
          onCellSelect={handleCellSelect}
          onFormulaEdit={handleFormulaEdit}
          readOnly={readOnly}
          showFormulas={showFormulas}
          selectedCell={selectedCell}
          viewport={viewport}
          onViewportChange={handleViewportChange}
        />
      </View>

      {/* Cell Editor Modal */}
      <CellEditor
        isVisible={cellEditorVisible}
        cellRef={editingCell || undefined}
        cell={getCurrentCell()}
        onSave={handleCellSave}
        onCancel={handleEditorCancel}
        onFormulaMode={() => {
          setCellEditorVisible(false);
          setFormulaInputVisible(true);
        }}
        readOnly={readOnly}
      />

      {/* Formula Input Modal */}
      <FormulaInput
        isVisible={formulaInputVisible}
        cellRef={editingCell || undefined}
        initialFormula={getCurrentCell()?.formula || ''}
        onSave={handleFormulaSave}
        onCancel={handleEditorCancel}
        onPreview={handleFormulaPreview}
        readOnly={readOnly}
      />

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {selectedCell} • {activeSheet.title} • {spreadsheet.sheets.length} sheet{spreadsheet.sheets.length !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.statusText}>
          Scale: {Math.round(viewport.scale * 100)}%
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  gridContainer: {
    flex: 1,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statusText: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
});