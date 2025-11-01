import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, Alert, TouchableOpacity, Text } from "react-native";
import { SpreadsheetGrid } from "./SpreadsheetGrid";
import { CollaborativeCursor } from "./CollaborativeCursor";
import { CellLockIndicator } from "./CellLockIndicator";
import { ChangeHistory } from "./ChangeHistory";
import { ConflictResolution } from "./ConflictResolution";
import { useSpreadsheetCollaboration } from "@/hooks/useSpreadsheetCollaboration";
import {
  Sheet,
  CellValue,
  CellSelection,
  SpreadsheetViewport,
} from "@/types/spreadsheet";
import { SpreadsheetCollaborationUser } from "@/types/spreadsheetCollaboration";
import { Colors } from "@/constants/theme";

interface CollaborativeSpreadsheetProps {
  spreadsheetId: string;
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

export const CollaborativeSpreadsheet: React.FC<
  CollaborativeSpreadsheetProps
> = ({
  spreadsheetId,
  sheet,
  onCellEdit,
  onCellSelect,
  onFormulaEdit,
  readOnly = false,
  showFormulas = false,
  selectedCell,
  viewport,
  onViewportChange,
}) => {
  // Collaboration state
  const {
    isConnected,
    isCollaborating,
    currentUser,
    onlineUsers,
    conflicts,
    lockCell,
    startCellEdit,
    updateCell,
    updateCursor,
    getCellLock,
    isCellLockedByOther,
    getAllCellLocks,
    getChangeHistory,
    resolveConflict,
    isInitialized,
  } = useSpreadsheetCollaboration({
    spreadsheetId,
    enableRealTimeEditing: !readOnly,
    enableCellLocking: !readOnly,
    enableEditIndicators: true,
    enableChangeTracking: true,
    onCellUpdate: handleCollaborativeCellUpdate,
    onConflict: handleConflicts,
  });

  // Local state
  const [showHistory, setShowHistory] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);

  // Handle collaborative cell updates from other users
  function handleCollaborativeCellUpdate(
    cellRef: string,
    sheetId: string,
    value: CellValue,
    formula?: string
  ) {
    if (sheetId === sheet.id) {
      onCellEdit(cellRef, value, formula);
    }
  }

  // Handle conflicts
  function handleConflicts() {
    if (conflicts.length > 0) {
      setShowConflicts(true);
    }
  }

  // Enhanced cell edit handler with collaboration
  const handleCellEditWithCollaboration = useCallback(
    async (cellRef: string, value: CellValue, formula?: string) => {
      if (readOnly) return;

      // Check if cell is locked by another user
      if (isCellLockedByOther(cellRef, sheet.id)) {
        const lock = getCellLock(cellRef, sheet.id);
        const lockingUser = onlineUsers.find((u) => u.id === lock?.userId);
        Alert.alert(
          "Cell Locked",
          `This cell is currently being edited by ${
            lockingUser?.name || "another user"
          }. Please try again later.`,
          [{ text: "OK" }]
        );
        return;
      }

      // Get previous value for change tracking
      const previousCell = sheet.cells[cellRef];
      const previousValue = previousCell?.value;
      const previousFormula = previousCell?.formula;

      // Update cell locally first
      onCellEdit(cellRef, value, formula);

      // Send collaborative update
      updateCell(
        cellRef,
        sheet.id,
        value,
        formula,
        previousValue,
        previousFormula
      );
    },
    [
      readOnly,
      isCellLockedByOther,
      getCellLock,
      onlineUsers,
      sheet,
      onCellEdit,
      updateCell,
    ]
  );

  // Enhanced cell selection handler with collaboration
  const handleCellSelectWithCollaboration = useCallback(
    (selection: CellSelection) => {
      onCellSelect(selection);

      // Update cursor position for other users
      if (selection.startCell && !selection.isMultiple) {
        updateCursor(selection.startCell, sheet.id);
      }
    },
    [onCellSelect, updateCursor, sheet.id]
  );

  // Handle formula editing with collaboration
  const handleFormulaEditWithCollaboration = useCallback(
    async (cellRef: string, formula: string) => {
      if (readOnly) return;

      // Try to lock the cell for formula editing
      const lockAcquired = await lockCell(cellRef, sheet.id, "formula");
      if (!lockAcquired) {
        Alert.alert(
          "Cell Locked",
          "This cell is currently being edited by another user. Please try again later.",
          [{ text: "OK" }]
        );
        return;
      }

      // Start editing indicator
      startCellEdit(cellRef, sheet.id, "formula");

      // Open formula editor
      onFormulaEdit(cellRef, formula);
    },
    [readOnly, lockCell, sheet.id, startCellEdit, onFormulaEdit]
  );

  // Handle editing completion (currently unused but may be needed for future features)
  // const handleEditingComplete = useCallback((cellRef: string) => {
  //   if (editingCell === cellRef) {
  //     endCellEdit(cellRef, sheet.id);
  //     unlockCell(cellRef, sheet.id);
  //     setEditingCell(null);
  //   }
  // }, [editingCell, endCellEdit, unlockCell, sheet.id]);

  // Calculate cell positions for collaboration overlays
  const getCellPosition = useCallback(
    (cellRef: string): { x: number; y: number } => {
      // Parse cell reference (e.g., "A1" -> column 0, row 0)
      const match = cellRef.match(/^([A-Z]+)(\d+)$/);
      if (!match || !match[1] || !match[2]) return { x: 0, y: 0 };

      const columnStr = match[1];
      const row = parseInt(match[2], 10) - 1;

      // Convert column letters to index
      let column = 0;
      for (let i = 0; i < columnStr.length; i++) {
        column = column * 26 + (columnStr.charCodeAt(i) - 65 + 1);
      }
      column -= 1;

      return {
        x: column * CELL_WIDTH,
        y: row * CELL_HEIGHT,
      };
    },
    []
  );

  // Get user by ID
  const getUserById = useCallback(
    (userId: string): SpreadsheetCollaborationUser | undefined => {
      return onlineUsers.find((u) => u.id === userId);
    },
    [onlineUsers]
  );

  // Render collaborative cursors
  const renderCollaborativeCursors = useMemo(() => {
    if (!isCollaborating || !currentUser) return null;

    return onlineUsers
      .filter((user) => user.id !== currentUser.id && user.activeCell)
      .map((user) => {
        const position = getCellPosition(user.activeCell!);
        return (
          <CollaborativeCursor
            key={user.id}
            user={user}
            cellRef={user.activeCell!}
            position={position}
            cellSize={{ width: CELL_WIDTH, height: CELL_HEIGHT }}
            showUserName={true}
            isCurrentUser={false}
          />
        );
      });
  }, [isCollaborating, currentUser, onlineUsers, getCellPosition]);

  // Render cell locks
  const renderCellLocks = useMemo(() => {
    if (!isCollaborating) return null;

    return getAllCellLocks()
      .filter((lock) => lock.sheetId === sheet.id)
      .map((lock) => {
        const user = getUserById(lock.userId);
        if (!user) return null;

        const position = getCellPosition(lock.cellRef);
        return (
          <CellLockIndicator
            key={`${lock.sheetId}-${lock.cellRef}`}
            lock={lock}
            userName={user.name}
            userColor={user.activeCellColor}
            cellSize={{ width: CELL_WIDTH, height: CELL_HEIGHT }}
            position={position}
          />
        );
      })
      .filter(Boolean);
  }, [
    isCollaborating,
    getAllCellLocks,
    sheet.id,
    getUserById,
    getCellPosition,
  ]);

  // Connection status indicator
  const renderConnectionStatus = () => {
    if (!isInitialized) return null;

    return (
      <View style={styles.connectionStatus}>
        <View
          style={[
            styles.connectionIndicator,
            { backgroundColor: isConnected ? "#4CAF50" : "#F44336" },
          ]}
        />
        <Text style={styles.connectionText}>
          {isConnected ? `${onlineUsers.length} online` : "Disconnected"}
        </Text>
      </View>
    );
  };

  // Collaboration toolbar
  const renderCollaborationToolbar = () => {
    if (!isCollaborating) return null;

    const changeHistory = getChangeHistory();
    const hasConflicts = conflicts.length > 0;

    return (
      <View style={styles.collaborationToolbar}>
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => setShowHistory(true)}
        >
          <Text style={styles.toolbarButtonText}>
            History ({changeHistory.length})
          </Text>
        </TouchableOpacity>

        {hasConflicts && (
          <TouchableOpacity
            style={[styles.toolbarButton, styles.conflictButton]}
            onPress={() => setShowConflicts(true)}
          >
            <Text style={[styles.toolbarButtonText, styles.conflictButtonText]}>
              Conflicts ({conflicts.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Connection status */}
      {renderConnectionStatus()}

      {/* Collaboration toolbar */}
      {renderCollaborationToolbar()}

      {/* Main spreadsheet grid */}
      <View style={styles.gridContainer}>
        <SpreadsheetGrid
          sheet={sheet}
          onCellEdit={handleCellEditWithCollaboration}
          onCellSelect={handleCellSelectWithCollaboration}
          onFormulaEdit={handleFormulaEditWithCollaboration}
          readOnly={readOnly}
          showFormulas={showFormulas}
          selectedCell={selectedCell || "A1"}
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
          onViewportChange={onViewportChange}
        />

        {/* Collaboration overlays */}
        <View style={styles.collaborationOverlay} pointerEvents="none">
          {renderCellLocks}
          {renderCollaborativeCursors}
        </View>
      </View>

      {/* Change history modal */}
      <ChangeHistory
        history={getChangeHistory()}
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        onUndo={(historyId) => {
          // Handle undo operation
          console.log("Undo:", historyId);
        }}
        onRedo={(historyId) => {
          // Handle redo operation
          console.log("Redo:", historyId);
        }}
      />

      {/* Conflict resolution modal */}
      <ConflictResolution
        conflicts={conflicts}
        visible={showConflicts}
        onClose={() => setShowConflicts(false)}
        onResolve={resolveConflict}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  connectionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  collaborationToolbar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    gap: 12,
  },
  toolbarButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
  },
  conflictButton: {
    backgroundColor: "#ffebee",
  },
  toolbarButtonText: {
    fontSize: 12,
    color: Colors.light.text,
    fontWeight: "500",
  },
  conflictButtonText: {
    color: "#d32f2f",
  },
  gridContainer: {
    flex: 1,
    position: "relative",
  },
  collaborationOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
});

export default CollaborativeSpreadsheet;
