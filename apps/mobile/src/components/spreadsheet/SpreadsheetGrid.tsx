import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  PanGestureHandler,
  PinchGestureHandler,
  TapGestureHandler,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import {
  Sheet,
  Cell,
  CellValue,
  SpreadsheetViewport,
  CellSelection,

} from '@/types/spreadsheet';
import { SpreadsheetService } from '@/services/spreadsheetService';

interface SpreadsheetGridProps {
  sheet: Sheet;
  onCellEdit: (cellRef: string, value: CellValue, formula?: string) => void;
  onCellSelect: (selection: CellSelection) => void;
  onFormulaEdit: (cellRef: string, formula: string) => void;
  readOnly?: boolean;
  showFormulas?: boolean;
  selectedCell?: string;
  viewport?: SpreadsheetViewport;
  onViewportChange?: (viewport: SpreadsheetViewport) => void;
}

const CELL_WIDTH = 80;
const CELL_HEIGHT = 32;
const HEADER_HEIGHT = 32;
const ROW_HEADER_WIDTH = 40;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3.0;

export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  sheet,
  onCellEdit,
  onCellSelect,
  onFormulaEdit,
  readOnly = false,
  showFormulas = false,
  selectedCell,
  viewport: initialViewport,
  onViewportChange,
}) => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Viewport state
  const [viewport, setViewport] = useState<SpreadsheetViewport>(
    initialViewport || {
      startRow: 0,
      endRow: Math.ceil(screenHeight / CELL_HEIGHT) + 5,
      startColumn: 0,
      endColumn: Math.ceil(screenWidth / CELL_WIDTH) + 5,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    }
  );

  // Gesture values
  const scale = useSharedValue(viewport.scale);
  const translateX = useSharedValue(viewport.offsetX);
  const translateY = useSharedValue(viewport.offsetY);
  const lastScale = useSharedValue(viewport.scale);
  const lastTranslateX = useSharedValue(viewport.offsetX);
  const lastTranslateY = useSharedValue(viewport.offsetY);

  // Selection state
  const [selection, setSelection] = useState<CellSelection | null>(null);

  // Refs
  const panRef = useRef<PanGestureHandler>(null);
  const pinchRef = useRef<PinchGestureHandler>(null);
  const tapRef = useRef<TapGestureHandler>(null);

  // Update viewport when props change
  useEffect(() => {
    if (initialViewport) {
      setViewport(initialViewport);
      scale.value = initialViewport.scale;
      translateX.value = initialViewport.offsetX;
      translateY.value = initialViewport.offsetY;
    }
  }, [initialViewport]);

  // Notify parent of viewport changes
  const notifyViewportChange = useCallback((newViewport: SpreadsheetViewport) => {
    setViewport(newViewport);
    onViewportChange?.(newViewport);
  }, [onViewportChange]);

  // Handle pan gesture
  const handlePanGesture = useCallback((event: any) => {
    'worklet';
    translateX.value = lastTranslateX.value + event.translationX;
    translateY.value = lastTranslateY.value + event.translationY;
  }, []);

  // Handle pinch gesture
  const handlePinchGesture = useCallback((event: any) => {
    'worklet';
    scale.value = Math.max(MIN_SCALE, Math.min(MAX_SCALE, lastScale.value * event.scale));
  }, []);

  // Handle tap gesture
  const handleTapGesture = useCallback((event: any) => {
    'worklet';
    runOnJS(handleCellTap)(event.x, event.y);
  }, [handleCellTap]);

  // Handle cell tap
  const handleCellTap = useCallback((x: number, y: number) => {
    const adjustedX = (x - translateX.value - ROW_HEADER_WIDTH) / scale.value;
    const adjustedY = (y - translateY.value - HEADER_HEIGHT) / scale.value;
    
    const column = Math.floor(adjustedX / CELL_WIDTH);
    const row = Math.floor(adjustedY / CELL_HEIGHT);
    
    if (column >= 0 && row >= 0 && column < sheet.gridProperties.columnCount && row < sheet.gridProperties.rowCount) {
      const cellRef = SpreadsheetService.createCellReference(column, row);
      
      const newSelection: CellSelection = {
        startCell: cellRef,
        endCell: cellRef,
        sheetId: sheet.id,
        isMultiple: false,
      };
      
      setSelection(newSelection);
      onCellSelect(newSelection);
    }
  }, [sheet, translateX.value, translateY.value, scale.value, onCellSelect]);

  // Handle cell double tap for editing
  const handleCellDoubleTap = useCallback((cellRef: string) => {
    if (readOnly) return;
    
    const cell = sheet.cells[cellRef];
    if (cell?.formula) {
      onFormulaEdit(cellRef, cell.formula);
    } else {
      // Start inline editing
      onCellEdit(cellRef, cell?.value || { type: 'empty' });
    }
  }, [sheet.cells, readOnly, onCellEdit, onFormulaEdit]);

  // Animated style for the grid
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Calculate visible cells based on viewport
  const visibleCells = useMemo(() => {
    const cells: { cellRef: string; column: number; row: number; cell?: Cell }[] = [];
    
    for (let row = viewport.startRow; row < Math.min(viewport.endRow, sheet.gridProperties.rowCount); row++) {
      for (let col = viewport.startColumn; col < Math.min(viewport.endColumn, sheet.gridProperties.columnCount); col++) {
        const cellRef = SpreadsheetService.createCellReference(col, row);
        const cell = sheet.cells[cellRef];
        cells.push({ cellRef, column: col, row, cell });
      }
    }
    
    return cells;
  }, [viewport, sheet.cells, sheet.gridProperties]);

  // Render column headers
  const renderColumnHeaders = () => (
    <View style={styles.columnHeaderContainer}>
      <View style={[styles.cornerCell, { width: ROW_HEADER_WIDTH, height: HEADER_HEIGHT }]} />
      {Array.from({ length: viewport.endColumn - viewport.startColumn }, (_, i) => {
        const column = viewport.startColumn + i;
        if (column >= sheet.gridProperties.columnCount) return null;
        
        return (
          <View
            key={column}
            style={[
              styles.columnHeader,
              { width: CELL_WIDTH, height: HEADER_HEIGHT },
            ]}
          >
            <Text style={styles.headerText}>
              {SpreadsheetService.columnIndexToLetter(column)}
            </Text>
          </View>
        );
      })}
    </View>
  );

  // Render row headers
  const renderRowHeaders = () => (
    <View style={styles.rowHeaderContainer}>
      {Array.from({ length: viewport.endRow - viewport.startRow }, (_, i) => {
        const row = viewport.startRow + i;
        if (row >= sheet.gridProperties.rowCount) return null;
        
        return (
          <View
            key={row}
            style={[
              styles.rowHeader,
              { width: ROW_HEADER_WIDTH, height: CELL_HEIGHT },
            ]}
          >
            <Text style={styles.headerText}>{row + 1}</Text>
          </View>
        );
      })}
    </View>
  );

  // Render individual cell
  const renderCell = useCallback(({ cellRef, column, row, cell }: {
    cellRef: string;
    column: number;
    row: number;
    cell?: Cell;
  }) => {
    const isSelected = selectedCell === cellRef || selection?.startCell === cellRef;
    const displayValue = cell ? SpreadsheetService.formatCellValue(cell) : '';
    const showFormula = showFormulas && cell?.formula;
    
    return (
      <TouchableOpacity
        key={cellRef}
        style={[
          styles.cell,
          {
            left: column * CELL_WIDTH,
            top: row * CELL_HEIGHT,
            width: CELL_WIDTH,
            height: CELL_HEIGHT,
          },
          isSelected && styles.selectedCell,
        ]}
        onPress={() => handleCellTap(column * CELL_WIDTH + CELL_WIDTH / 2, row * CELL_HEIGHT + CELL_HEIGHT / 2)}
        onLongPress={() => handleCellDoubleTap(cellRef)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.cellText,
            cell?.format?.textFormat?.bold && styles.boldText,
            cell?.format?.textFormat?.italic && styles.italicText,
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {showFormula ? cell.formula : displayValue}
        </Text>
      </TouchableOpacity>
    );
  }, [selectedCell, selection, showFormulas, handleCellTap, handleCellDoubleTap]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.spreadsheetContainer}>
        {/* Column Headers */}
        {renderColumnHeaders()}
        
        {/* Row Headers */}
        {renderRowHeaders()}
        
        {/* Main Grid */}
        <View style={styles.gridContainer}>
          <Animated.View style={[styles.cellContainer, animatedStyle]}>
            {/* Grid Lines */}
            <View style={styles.gridLines}>
              {/* Vertical lines */}
              {Array.from({ length: sheet.gridProperties.columnCount + 1 }, (_, i) => (
                <View
                  key={`v-${i}`}
                  style={[
                    styles.gridLine,
                    {
                      left: i * CELL_WIDTH,
                      height: sheet.gridProperties.rowCount * CELL_HEIGHT,
                    },
                  ]}
                />
              ))}
              {/* Horizontal lines */}
              {Array.from({ length: sheet.gridProperties.rowCount + 1 }, (_, i) => (
                <View
                  key={`h-${i}`}
                  style={[
                    styles.gridLine,
                    {
                      top: i * CELL_HEIGHT,
                      width: sheet.gridProperties.columnCount * CELL_WIDTH,
                    },
                  ]}
                />
              ))}
            </View>
            
            {/* Cells */}
            {visibleCells.map(renderCell)}
          </Animated.View>
        </View>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  spreadsheetContainer: {
    flex: 1,
    position: 'relative',
  },
  columnHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    zIndex: 2,
  },
  rowHeaderContainer: {
    position: 'absolute',
    top: HEADER_HEIGHT,
    left: 0,
    bottom: 0,
    width: ROW_HEADER_WIDTH,
    backgroundColor: Colors.light.background,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    zIndex: 2,
  },
  cornerCell: {
    backgroundColor: '#f5f5f5',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  columnHeader: {
    backgroundColor: '#f5f5f5',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowHeader: {
    backgroundColor: '#f5f5f5',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  },
  gridContainer: {
    flex: 1,
    marginTop: HEADER_HEIGHT,
    marginLeft: ROW_HEADER_WIDTH,
  },
  grid: {
    flex: 1,
  },
  cellContainer: {
    position: 'relative',
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#e0e0e0',
    width: 1,
    height: 1,
  },
  cell: {
    position: 'absolute',
    backgroundColor: Colors.light.background,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  selectedCell: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    borderWidth: 2,
  },
  cellText: {
    fontSize: 12,
    color: Colors.light.text,
  },
  boldText: {
    fontWeight: 'bold',
  },
  italicText: {
    fontStyle: 'italic',
  },
});