import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { SpreadsheetInterface } from './SpreadsheetInterface';
import { useSpreadsheet } from '@/hooks/useSpreadsheet';
import {
  Spreadsheet,
  Sheet,
  CellValue,
  GridProperties,
} from '@/types/spreadsheet';

export const SpreadsheetDemo: React.FC = () => {
  const [demoSpreadsheet, setDemoSpreadsheet] = useState<Spreadsheet | null>(null);
  const [currentZoom, setCurrentZoom] = useState(1);

  const {
    spreadsheet,
    loading,
    error,
    saving,
    updateCell,
    addSheet,
    renameSheet,
    deleteSheet,
    duplicateSheet,
    exportSpreadsheet,
    saveSpreadsheet,
  } = useSpreadsheet({
    autoSave: true,
    autoSaveInterval: 10000, // Auto-save every 10 seconds
  });

  // Create demo spreadsheet data
  useEffect(() => {
    const createDemoSpreadsheet = (): Spreadsheet => {
      const now = new Date();
      
      const defaultGridProperties: GridProperties = {
        rowCount: 100,
        columnCount: 26,
        frozenRowCount: 0,
        frozenColumnCount: 0,
        hideGridlines: false,
        rowGroupControlAfter: true,
        columnGroupControlAfter: true,
      };

      const demoSheet: Sheet = {
        id: 'demo-sheet-1',
        title: 'Budget 2024',
        index: 0,
        gridProperties: defaultGridProperties,
        cells: {
          'A1': {
            value: { type: 'string', value: 'Item' },
            format: {
              numberFormat: { formatType: 'TEXT', pattern: 'General' },
              borders: { top: undefined, bottom: undefined, left: undefined, right: undefined },
              padding: { top: 2, right: 3, bottom: 2, left: 3 },
              horizontalAlignment: 'LEFT',
              verticalAlignment: 'BOTTOM',
              wrapStrategy: 'OVERFLOW_CELL',
              textDirection: 'LEFT_TO_RIGHT',
              textFormat: {
                fontFamily: 'Arial',
                fontSize: 12,
                bold: true,
                italic: false,
                strikethrough: false,
                underline: false,
              },
              textRotation: { angle: 0, vertical: false },
            },
          },
          'B1': {
            value: { type: 'string', value: 'Amount' },
            format: {
              numberFormat: { formatType: 'TEXT', pattern: 'General' },
              borders: { top: undefined, bottom: undefined, left: undefined, right: undefined },
              padding: { top: 2, right: 3, bottom: 2, left: 3 },
              horizontalAlignment: 'LEFT',
              verticalAlignment: 'BOTTOM',
              wrapStrategy: 'OVERFLOW_CELL',
              textDirection: 'LEFT_TO_RIGHT',
              textFormat: {
                fontFamily: 'Arial',
                fontSize: 12,
                bold: true,
                italic: false,
                strikethrough: false,
                underline: false,
              },
              textRotation: { angle: 0, vertical: false },
            },
          },
          'C1': {
            value: { type: 'string', value: 'Category' },
            format: {
              numberFormat: { formatType: 'TEXT', pattern: 'General' },
              borders: { top: undefined, bottom: undefined, left: undefined, right: undefined },
              padding: { top: 2, right: 3, bottom: 2, left: 3 },
              horizontalAlignment: 'LEFT',
              verticalAlignment: 'BOTTOM',
              wrapStrategy: 'OVERFLOW_CELL',
              textDirection: 'LEFT_TO_RIGHT',
              textFormat: {
                fontFamily: 'Arial',
                fontSize: 12,
                bold: true,
                italic: false,
                strikethrough: false,
                underline: false,
              },
              textRotation: { angle: 0, vertical: false },
            },
          },
          'A2': {
            value: { type: 'string', value: 'Rent' },
            format: {
              numberFormat: { formatType: 'TEXT', pattern: 'General' },
              borders: { top: undefined, bottom: undefined, left: undefined, right: undefined },
              padding: { top: 2, right: 3, bottom: 2, left: 3 },
              horizontalAlignment: 'LEFT',
              verticalAlignment: 'BOTTOM',
              wrapStrategy: 'OVERFLOW_CELL',
              textDirection: 'LEFT_TO_RIGHT',
              textFormat: {
                fontFamily: 'Arial',
                fontSize: 10,
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
              },
              textRotation: { angle: 0, vertical: false },
            },
          },
          'B2': {
            value: { type: 'number', value: 1200 },
            format: {
              numberFormat: { formatType: 'CURRENCY', pattern: '$#,##0.00' },
              borders: { top: undefined, bottom: undefined, left: undefined, right: undefined },
              padding: { top: 2, right: 3, bottom: 2, left: 3 },
              horizontalAlignment: 'RIGHT',
              verticalAlignment: 'BOTTOM',
              wrapStrategy: 'OVERFLOW_CELL',
              textDirection: 'LEFT_TO_RIGHT',
              textFormat: {
                fontFamily: 'Arial',
                fontSize: 10,
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
              },
              textRotation: { angle: 0, vertical: false },
            },
          },
          'C2': {
            value: { type: 'string', value: 'Housing' },
            format: {
              numberFormat: { formatType: 'TEXT', pattern: 'General' },
              borders: { top: undefined, bottom: undefined, left: undefined, right: undefined },
              padding: { top: 2, right: 3, bottom: 2, left: 3 },
              horizontalAlignment: 'LEFT',
              verticalAlignment: 'BOTTOM',
              wrapStrategy: 'OVERFLOW_CELL',
              textDirection: 'LEFT_TO_RIGHT',
              textFormat: {
                fontFamily: 'Arial',
                fontSize: 10,
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
              },
              textRotation: { angle: 0, vertical: false },
            },
          },
          'A3': {
            value: { type: 'string', value: 'Groceries' },
            format: {
              numberFormat: { formatType: 'TEXT', pattern: 'General' },
              borders: { top: undefined, bottom: undefined, left: undefined, right: undefined },
              padding: { top: 2, right: 3, bottom: 2, left: 3 },
              horizontalAlignment: 'LEFT',
              verticalAlignment: 'BOTTOM',
              wrapStrategy: 'OVERFLOW_CELL',
              textDirection: 'LEFT_TO_RIGHT',
              textFormat: {
                fontFamily: 'Arial',
                fontSize: 10,
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
              },
              textRotation: { angle: 0, vertical: false },
            },
          },
          'B3': {
            value: { type: 'number', value: 400 },
            format: {
              numberFormat: { formatType: 'CURRENCY', pattern: '$#,##0.00' },
              borders: { top: undefined, bottom: undefined, left: undefined, right: undefined },
              padding: { top: 2, right: 3, bottom: 2, left: 3 },
              horizontalAlignment: 'RIGHT',
              verticalAlignment: 'BOTTOM',
              wrapStrategy: 'OVERFLOW_CELL',
              textDirection: 'LEFT_TO_RIGHT',
              textFormat: {
                fontFamily: 'Arial',
                fontSize: 10,
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
              },
              textRotation: { angle: 0, vertical: false },
            },
          },
          'C3': {
            value: { type: 'string', value: 'Food' },
            format: {
              numberFormat: { formatType: 'TEXT', pattern: 'General' },
              borders: { top: undefined, bottom: undefined, left: undefined, right: undefined },
              padding: { top: 2, right: 3, bottom: 2, left: 3 },
              horizontalAlignment: 'LEFT',
              verticalAlignment: 'BOTTOM',
              wrapStrategy: 'OVERFLOW_CELL',
              textDirection: 'LEFT_TO_RIGHT',
              textFormat: {
                fontFamily: 'Arial',
                fontSize: 10,
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
              },
              textRotation: { angle: 0, vertical: false },
            },
          },
          'A4': {
            value: { type: 'string', value: 'Transportation' },
            format: {
              numberFormat: { formatType: 'TEXT', pattern: 'General' },
              borders: { top: undefined, bottom: undefined, left: undefined, right: undefined },
              padding: { top: 2, right: 3, bottom: 2, left: 3 },
              horizontalAlignment: 'LEFT',
              verticalAlignment: 'BOTTOM',
              wrapStrategy: 'OVERFLOW_CELL',
              textDirection: 'LEFT_TO_RIGHT',
              textFormat: {
                fontFamily: 'Arial',
                fontSize: 10,
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
              },
              textRotation: { angle: 0, vertical: false },
            },
          },
          'B4': {
            value: { type: 'number', value: 300 },
            format: {
              numberFormat: { formatType: 'CURRENCY', pattern: '$#,##0.00' },
              borders: { top: undefined, bottom: undefined, left: undefined, right: undefined },
              padding: { top: 2, right: 3, bottom: 2, left: 3 },
              horizontalAlignment: 'RIGHT',
              verticalAlignment: 'BOTTOM',
              wrapStrategy: 'OVERFLOW_CELL',
              textDirection: 'LEFT_TO_RIGHT',
              textFormat: {
                fontFamily: 'Arial',
                fontSize: 10,
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
              },
              textRotation: { angle: 0, vertical: false },
            },
          },
          'C4': {
            value: { type: 'string', value: 'Transport' },
            format: {
              numberFormat: { formatType: 'TEXT', pattern: 'General' },
              borders: { top: undefined, bottom: undefined, left: undefined, right: undefined },
              padding: { top: 2, right: 3, bottom: 2, left: 3 },
              horizontalAlignment: 'LEFT',
              verticalAlignment: 'BOTTOM',
              wrapStrategy: 'OVERFLOW_CELL',
              textDirection: 'LEFT_TO_RIGHT',
              textFormat: {
                fontFamily: 'Arial',
                fontSize: 10,
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
              },
              textRotation: { angle: 0, vertical: false },
            },
          },
          'A5': {
            value: { type: 'string', value: 'Total' },
            format: {
              numberFormat: { formatType: 'TEXT', pattern: 'General' },
              borders: { top: undefined, bottom: undefined, left: undefined, right: undefined },
              padding: { top: 2, right: 3, bottom: 2, left: 3 },
              horizontalAlignment: 'LEFT',
              verticalAlignment: 'BOTTOM',
              wrapStrategy: 'OVERFLOW_CELL',
              textDirection: 'LEFT_TO_RIGHT',
              textFormat: {
                fontFamily: 'Arial',
                fontSize: 12,
                bold: true,
                italic: false,
                strikethrough: false,
                underline: false,
              },
              textRotation: { angle: 0, vertical: false },
            },
          },
          'B5': {
            value: { type: 'string', value: '' },
            formula: '=SUM(B2:B4)',
            format: {
              numberFormat: { formatType: 'CURRENCY', pattern: '$#,##0.00' },
              borders: { top: undefined, bottom: undefined, left: undefined, right: undefined },
              padding: { top: 2, right: 3, bottom: 2, left: 3 },
              horizontalAlignment: 'RIGHT',
              verticalAlignment: 'BOTTOM',
              wrapStrategy: 'OVERFLOW_CELL',
              textDirection: 'LEFT_TO_RIGHT',
              textFormat: {
                fontFamily: 'Arial',
                fontSize: 12,
                bold: true,
                italic: false,
                strikethrough: false,
                underline: false,
              },
              textRotation: { angle: 0, vertical: false },
            },
          },
        },
        mergedRanges: [],
        conditionalFormatting: [],
        protectedRanges: [],
        filterViews: [],
        isHidden: false,
      };

      const expensesSheet: Sheet = {
        id: 'demo-sheet-2',
        title: 'Expenses',
        index: 1,
        gridProperties: defaultGridProperties,
        cells: {},
        mergedRanges: [],
        conditionalFormatting: [],
        protectedRanges: [],
        filterViews: [],
        isHidden: false,
      };

      return {
        id: 'demo-spreadsheet',
        documentId: 'demo-document',
        title: 'Demo Spreadsheet',
        sheets: [demoSheet, expensesSheet],
        namedRanges: {},
        charts: [],
        pivotTables: [],
        dataValidationRules: [],
        conditionalFormatting: [],
        protectedRanges: [],
        settings: {
          locale: 'en_US',
          timeZone: 'UTC',
          defaultFormat: {
            numberFormat: { formatType: 'TEXT', pattern: 'General' },
            borders: { top: undefined, bottom: undefined, left: undefined, right: undefined },
            padding: { top: 2, right: 3, bottom: 2, left: 3 },
            horizontalAlignment: 'LEFT',
            verticalAlignment: 'BOTTOM',
            wrapStrategy: 'OVERFLOW_CELL',
            textDirection: 'LEFT_TO_RIGHT',
            textFormat: {
              fontFamily: 'Arial',
              fontSize: 10,
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
            },
            textRotation: { angle: 0, vertical: false },
          },
          iterativeCalculationSettings: {
            maxIterations: 50,
            convergenceThreshold: 0.05,
          },
        },
        version: 1,
        createdAt: now,
        updatedAt: now,
      };
    };

    setDemoSpreadsheet(createDemoSpreadsheet());
  }, []);

  // Handle cell edit
  const handleCellEdit = async (sheetId: string, cellRef: string, value: CellValue, formula?: string) => {
    if (!demoSpreadsheet) return;

    // Update demo spreadsheet locally
    setDemoSpreadsheet(prev => {
      if (!prev) return prev;

      const updatedSheets = prev.sheets.map(sheet => {
        if (sheet.id === sheetId) {
          const updatedCells = { ...sheet.cells };
          updatedCells[cellRef] = {
            value,
            formula,
            format: sheet.cells[cellRef]?.format || {
              numberFormat: { formatType: 'TEXT', pattern: 'General' },
              borders: { top: undefined, bottom: undefined, left: undefined, right: undefined },
              padding: { top: 2, right: 3, bottom: 2, left: 3 },
              horizontalAlignment: 'LEFT',
              verticalAlignment: 'BOTTOM',
              wrapStrategy: 'OVERFLOW_CELL',
              textDirection: 'LEFT_TO_RIGHT',
              textFormat: {
                fontFamily: 'Arial',
                fontSize: 10,
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
              },
              textRotation: { angle: 0, vertical: false },
            },
          };

          return { ...sheet, cells: updatedCells };
        }
        return sheet;
      });

      return { ...prev, sheets: updatedSheets, version: prev.version + 1 };
    });

    console.log(`Cell ${cellRef} updated:`, { value, formula });
  };

  // Handle sheet change
  const handleSheetChange = (sheetId: string) => {
    console.log('Sheet changed to:', sheetId);
  };

  // Handle zoom
  const handleZoom = (scale: number) => {
    setCurrentZoom(scale);
  };

  // Handle save
  const handleSave = async () => {
    try {
      await saveSpreadsheet();
      Alert.alert('Success', 'Spreadsheet saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save spreadsheet');
    }
  };

  // Handle export
  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    try {
      const blob = await exportSpreadsheet(format);
      if (blob) {
        Alert.alert('Success', `Spreadsheet exported as ${format.toUpperCase()}`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to export as ${format.toUpperCase()}`);
    }
  };

  // Handle share
  const handleShare = () => {
    Alert.alert('Share', 'Share functionality would be implemented here');
  };

  if (!demoSpreadsheet) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Loading spreadsheet...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="grid" size={24} color={Colors.light.tint} />
          <Text style={styles.headerTitle}>Spreadsheet Demo</Text>
        </View>
        
        <View style={styles.headerRight}>
          {saving && <ActivityIndicator size="small" color={Colors.light.tint} />}
          <Text style={styles.zoomText}>{Math.round(currentZoom * 100)}%</Text>
        </View>
      </View>

      {/* Spreadsheet Interface */}
      <SpreadsheetInterface
        spreadsheet={demoSpreadsheet}
        onCellEdit={handleCellEdit}
        onSheetChange={handleSheetChange}
        onZoom={handleZoom}
        onSave={handleSave}
        onExport={handleExport}
        onShare={handleShare}
        loading={loading}
        error={error}
      />

      {/* Demo Info */}
      <View style={styles.demoInfo}>
        <Text style={styles.demoInfoText}>
          📱 Touch-optimized spreadsheet interface with zoom, scroll, and cell editing
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  zoomText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    fontFamily: 'monospace',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
  demoInfo: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  demoInfoText: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
  },
});