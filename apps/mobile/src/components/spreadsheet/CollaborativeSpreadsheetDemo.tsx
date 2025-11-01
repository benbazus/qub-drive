import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { CollaborativeSpreadsheet } from './CollaborativeSpreadsheet';
import { SpreadsheetService } from '@/services/spreadsheetService';
import {
  Spreadsheet,
  Sheet,
  CellValue,
  CellSelection,
  SpreadsheetViewport,
} from '@/types/spreadsheet';
import { Colors } from '@/constants/theme';

export const CollaborativeSpreadsheetDemo: React.FC = () => {
  const [spreadsheet, setSpreadsheet] = useState<Spreadsheet | null>(null);
  const [activeSheet, setActiveSheet] = useState<Sheet | null>(null);
  const [selectedCell, setSelectedCell] = useState<string>('A1');
  const [viewport, setViewport] = useState<SpreadsheetViewport>({
    startRow: 0,
    endRow: 20,
    startColumn: 0,
    endColumn: 10,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });

  // Initialize demo spreadsheet
  useEffect(() => {
    const initializeDemoSpreadsheet = () => {
      const demoSpreadsheet: Spreadsheet = {
        id: 'demo-collaborative-spreadsheet',
        documentId: 'demo-doc-1',
        title: 'Collaborative Demo Spreadsheet',
        sheets: [
          {
            id: 'sheet-1',
            title: 'Budget Planning',
            index: 0,
            gridProperties: {
              rowCount: 100,
              columnCount: 26,
              frozenRowCount: 1,
              frozenColumnCount: 1,
              hideGridlines: false,
              rowGroupControlAfter: false,
              columnGroupControlAfter: false,
            },
            cells: {
              'A1': {
                value: { type: 'string', value: 'Item' },
                format: SpreadsheetService.createDefaultCellFormat(),
              },
              'B1': {
                value: { type: 'string', value: 'Budget' },
                format: SpreadsheetService.createDefaultCellFormat(),
              },
              'C1': {
                value: { type: 'string', value: 'Actual' },
                format: SpreadsheetService.createDefaultCellFormat(),
              },
              'D1': {
                value: { type: 'string', value: 'Variance' },
                format: SpreadsheetService.createDefaultCellFormat(),
              },
              'A2': {
                value: { type: 'string', value: 'Marketing' },
                format: SpreadsheetService.createDefaultCellFormat(),
              },
              'B2': {
                value: { type: 'number', value: 10000 },
                format: SpreadsheetService.createDefaultCellFormat(),
              },
              'C2': {
                value: { type: 'number', value: 8500 },
                format: SpreadsheetService.createDefaultCellFormat(),
              },
              'D2': {
                value: { type: 'number', value: 1500 },
                formula: '=B2-C2',
                format: SpreadsheetService.createDefaultCellFormat(),
              },
              'A3': {
                value: { type: 'string', value: 'Development' },
                format: SpreadsheetService.createDefaultCellFormat(),
              },
              'B3': {
                value: { type: 'number', value: 25000 },
                format: SpreadsheetService.createDefaultCellFormat(),
              },
              'C3': {
                value: { type: 'number', value: 27500 },
                format: SpreadsheetService.createDefaultCellFormat(),
              },
              'D3': {
                value: { type: 'number', value: -2500 },
                formula: '=B3-C3',
                format: SpreadsheetService.createDefaultCellFormat(),
              },
            },
            mergedRanges: [],
            conditionalFormatting: [],
            protectedRanges: [],
            filterViews: [],
            isHidden: false,
          },
          {
            id: 'sheet-2',
            title: 'Sales Data',
            index: 1,
            gridProperties: {
              rowCount: 100,
              columnCount: 26,
              frozenRowCount: 0,
              frozenColumnCount: 0,
              hideGridlines: false,
              rowGroupControlAfter: false,
              columnGroupControlAfter: false,
            },
            cells: {
              'A1': {
                value: { type: 'string', value: 'Month' },
                format: SpreadsheetService.createDefaultCellFormat(),
              },
              'B1': {
                value: { type: 'string', value: 'Sales' },
                format: SpreadsheetService.createDefaultCellFormat(),
              },
              'A2': {
                value: { type: 'string', value: 'January' },
                format: SpreadsheetService.createDefaultCellFormat(),
              },
              'B2': {
                value: { type: 'number', value: 50000 },
                format: SpreadsheetService.createDefaultCellFormat(),
              },
            },
            mergedRanges: [],
            conditionalFormatting: [],
            protectedRanges: [],
            filterViews: [],
            isHidden: false,
          },
        ],
        namedRanges: {},
        charts: [],
        pivotTables: [],
        dataValidationRules: [],
        conditionalFormatting: [],
        protectedRanges: [],
        settings: {
          locale: 'en-US',
          timeZone: 'America/New_York',
          defaultFormat: SpreadsheetService.createDefaultCellFormat(),
          iterativeCalculationSettings: {
            maxIterations: 50,
            convergenceThreshold: 0.001,
          },
        },
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setSpreadsheet(demoSpreadsheet);
      setActiveSheet(demoSpreadsheet.sheets[0]);
    };

    initializeDemoSpreadsheet();
  }, []);

  // Handle cell edit
  const handleCellEdit = (cellRef: string, value: CellValue, formula?: string) => {
    if (!activeSheet || !spreadsheet) return;

    // Update the cell in the active sheet
    const updatedSheet: Sheet = {
      ...activeSheet,
      cells: {
        ...activeSheet.cells,
        [cellRef]: {
          value,
          formula: formula || undefined,
          format: SpreadsheetService.createDefaultCellFormat(),
        },
      },
    };

    // Update the spreadsheet
    const updatedSpreadsheet: Spreadsheet = {
      ...spreadsheet,
      sheets: spreadsheet.sheets.map(sheet =>
        sheet.id === activeSheet.id ? updatedSheet : sheet
      ),
      version: spreadsheet.version + 1,
      updatedAt: new Date(),
    };

    setSpreadsheet(updatedSpreadsheet);
    setActiveSheet(updatedSheet);

    console.log(`Cell ${cellRef} updated:`, { value, formula });
  };

  // Handle cell selection
  const handleCellSelect = (selection: CellSelection) => {
    setSelectedCell(selection.startCell);
    console.log('Cell selected:', selection);
  };

  // Handle formula edit
  const handleFormulaEdit = (cellRef: string, formula: string) => {
    console.log(`Formula edit for ${cellRef}:`, formula);
    Alert.alert(
      'Formula Editor',
      `Edit formula for cell ${cellRef}:\n${formula}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: () => {
            // In a real app, this would open a formula editor
            handleCellEdit(cellRef, { type: 'string', value: 'Formula result' }, formula);
          },
        },
      ]
    );
  };

  // Handle sheet change
  const handleSheetChange = (sheetId: string) => {
    if (!spreadsheet) return;
    
    const sheet = spreadsheet.sheets.find(s => s.id === sheetId);
    if (sheet) {
      setActiveSheet(sheet);
      setSelectedCell('A1');
    }
  };

  // Handle viewport change
  const handleViewportChange = (newViewport: SpreadsheetViewport) => {
    setViewport(newViewport);
  };

  // Simulate other users joining
  const simulateUserActivity = () => {
    Alert.alert(
      'Collaboration Demo',
      'In a real app, you would see other users\' cursors, cell locks, and real-time edits here.',
      [{ text: 'OK' }]
    );
  };

  if (!spreadsheet || !activeSheet) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading collaborative spreadsheet...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Collaborative Spreadsheet Demo</Text>
        <TouchableOpacity
          style={styles.simulateButton}
          onPress={simulateUserActivity}
        >
          <Text style={styles.simulateButtonText}>Simulate Users</Text>
        </TouchableOpacity>
      </View>

      {/* Sheet tabs */}
      <ScrollView
        horizontal
        style={styles.sheetTabs}
        contentContainerStyle={styles.sheetTabsContent}
        showsHorizontalScrollIndicator={false}
      >
        {spreadsheet.sheets.map((sheet) => (
          <TouchableOpacity
            key={sheet.id}
            style={[
              styles.sheetTab,
              sheet.id === activeSheet.id && styles.activeSheetTab,
            ]}
            onPress={() => handleSheetChange(sheet.id)}
          >
            <Text
              style={[
                styles.sheetTabText,
                sheet.id === activeSheet.id && styles.activeSheetTabText,
              ]}
            >
              {sheet.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Collaborative spreadsheet */}
      <View style={styles.spreadsheetContainer}>
        <CollaborativeSpreadsheet
          spreadsheetId={spreadsheet.id}
          sheet={activeSheet}
          onCellEdit={handleCellEdit}
          onCellSelect={handleCellSelect}
          onFormulaEdit={handleFormulaEdit}
          selectedCell={selectedCell}
          viewport={viewport}
          onViewportChange={handleViewportChange}
        />
      </View>

      {/* Info panel */}
      <View style={styles.infoPanel}>
        <Text style={styles.infoPanelTitle}>Collaboration Features:</Text>
        <Text style={styles.infoPanelText}>
          • Real-time multi-user editing{'\n'}
          • Cell locking and edit indicators{'\n'}
          • Change tracking and history{'\n'}
          • Conflict resolution{'\n'}
          • User presence indicators
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  simulateButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  simulateButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  sheetTabs: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sheetTabsContent: {
    paddingHorizontal: 16,
  },
  sheetTab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
  },
  activeSheetTab: {
    backgroundColor: Colors.light.tint,
  },
  sheetTabText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  activeSheetTabText: {
    color: 'white',
  },
  spreadsheetContainer: {
    flex: 1,
  },
  infoPanel: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  infoPanelTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  infoPanelText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});

export default CollaborativeSpreadsheetDemo;