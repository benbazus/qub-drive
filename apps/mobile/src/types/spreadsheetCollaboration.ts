// Spreadsheet-specific collaboration types
import { CollaborationUser } from './collaboration';
import { CellValue, GridRange } from './spreadsheet';

export interface SpreadsheetCollaborationUser extends CollaborationUser {
  activeCell?: string;
  activeCellColor: string;
  isEditing: boolean;
  editingCell?: string | undefined;
  lastActivity: Date;
}

export interface SpreadsheetCellLock {
  cellRef: string;
  sheetId: string;
  userId: string;
  lockedAt: Date;
  lockType: 'editing' | 'formatting' | 'formula';
  expiresAt?: Date;
}

export interface SpreadsheetCellEdit {
  id: string;
  cellRef: string;
  sheetId: string;
  userId: string;
  operation: SpreadsheetOperation;
  timestamp: Date;
  version: number;
  isApplied: boolean;
}

export interface SpreadsheetOperation {
  type: 'cell_update' | 'cell_format' | 'range_update' | 'sheet_add' | 'sheet_delete' | 'sheet_rename';
  cellRef?: string;
  sheetId: string;
  data: SpreadsheetOperationData;
}

export type SpreadsheetOperationData = 
  | CellUpdateData
  | CellFormatData
  | RangeUpdateData
  | SheetAddData
  | SheetDeleteData
  | SheetRenameData;

export interface CellUpdateData {
  value: CellValue;
  formula?: string | undefined;
  previousValue?: CellValue;
  previousFormula?: string | undefined;
}

export interface CellFormatData {
  format: Record<string, unknown>;
  previousFormat?: Record<string, unknown>;
}

export interface RangeUpdateData {
  range: GridRange;
  values: CellValue[][];
  formulas?: string[][];
  previousValues?: CellValue[][];
  previousFormulas?: string[][];
}

export interface SheetAddData {
  title: string;
  index: number;
  gridProperties: {
    rowCount: number;
    columnCount: number;
  };
}

export interface SheetDeleteData {
  sheetId: string;
  title: string;
}

export interface SheetRenameData {
  newTitle: string;
  previousTitle: string;
}

export interface SpreadsheetEditIndicator {
  cellRef: string;
  sheetId: string;
  userId: string;
  userName: string;
  userColor: string;
  editType: 'typing' | 'formula' | 'formatting';
  startTime: Date;
}

export interface SpreadsheetChangeHistory {
  id: string;
  spreadsheetId: string;
  userId: string;
  userName: string;
  operation: SpreadsheetOperation;
  timestamp: Date;
  version: number;
  description: string;
  canUndo: boolean;
  canRedo: boolean;
}

export interface SpreadsheetConflict {
  id: string;
  spreadsheetId: string;
  cellRef: string;
  sheetId: string;
  conflictingEdits: SpreadsheetCellEdit[];
  conflictType: 'concurrent_edit' | 'version_mismatch' | 'lock_conflict';
  resolution: 'auto' | 'manual' | 'pending';
  resolvedBy?: string;
  resolvedAt?: Date;
  winningEdit?: SpreadsheetCellEdit;
}

export interface SpreadsheetCollaborationSession {
  spreadsheetId: string;
  users: SpreadsheetCollaborationUser[];
  cellLocks: Map<string, SpreadsheetCellLock>;
  editIndicators: Map<string, SpreadsheetEditIndicator>;
  changeHistory: SpreadsheetChangeHistory[];
  conflicts: SpreadsheetConflict[];
  version: number;
  isActive: boolean;
  lastSyncTime: Date;
}

export interface SpreadsheetWebSocketMessage {
  type: SpreadsheetMessageType;
  spreadsheetId: string;
  userId: string;
  timestamp: Date;
  data: unknown;
}

export type SpreadsheetMessageType = 
  | 'cell_lock'
  | 'cell_unlock'
  | 'cell_edit_start'
  | 'cell_edit_end'
  | 'cell_operation'
  | 'user_cursor_move'
  | 'user_join'
  | 'user_leave'
  | 'conflict_resolution'
  | 'sync_request'
  | 'sync_response'
  | 'version_update';

export interface CellLockMessage extends SpreadsheetWebSocketMessage {
  type: 'cell_lock';
  data: {
    lock: SpreadsheetCellLock;
  };
}

export interface CellUnlockMessage extends SpreadsheetWebSocketMessage {
  type: 'cell_unlock';
  data: {
    cellRef: string;
    sheetId: string;
  };
}

export interface CellEditStartMessage extends SpreadsheetWebSocketMessage {
  type: 'cell_edit_start';
  data: {
    indicator: SpreadsheetEditIndicator;
  };
}

export interface CellEditEndMessage extends SpreadsheetWebSocketMessage {
  type: 'cell_edit_end';
  data: {
    cellRef: string;
    sheetId: string;
  };
}

export interface CellOperationMessage extends SpreadsheetWebSocketMessage {
  type: 'cell_operation';
  data: {
    edit: SpreadsheetCellEdit;
  };
}

export interface UserCursorMoveMessage extends SpreadsheetWebSocketMessage {
  type: 'user_cursor_move';
  data: {
    cellRef: string;
    sheetId: string;
  };
}

export interface UserJoinSpreadsheetMessage extends SpreadsheetWebSocketMessage {
  type: 'user_join';
  data: {
    user: SpreadsheetCollaborationUser;
  };
}

export interface UserLeaveSpreadsheetMessage extends SpreadsheetWebSocketMessage {
  type: 'user_leave';
  data: {
    userId: string;
  };
}

export interface ConflictResolutionSpreadsheetMessage extends SpreadsheetWebSocketMessage {
  type: 'conflict_resolution';
  data: {
    conflict: SpreadsheetConflict;
    resolution: 'accepted' | 'rejected';
  };
}

export interface SyncRequestMessage extends SpreadsheetWebSocketMessage {
  type: 'sync_request';
  data: {
    fromVersion: number;
  };
}

export interface SyncResponseMessage extends SpreadsheetWebSocketMessage {
  type: 'sync_response';
  data: {
    operations: SpreadsheetCellEdit[];
    currentVersion: number;
  };
}

export interface VersionUpdateMessage extends SpreadsheetWebSocketMessage {
  type: 'version_update';
  data: {
    version: number;
    lastEdit: SpreadsheetCellEdit;
  };
}

export type SpreadsheetCollaborationMessage = 
  | CellLockMessage
  | CellUnlockMessage
  | CellEditStartMessage
  | CellEditEndMessage
  | CellOperationMessage
  | UserCursorMoveMessage
  | UserJoinSpreadsheetMessage
  | UserLeaveSpreadsheetMessage
  | ConflictResolutionSpreadsheetMessage
  | SyncRequestMessage
  | SyncResponseMessage
  | VersionUpdateMessage;

export interface SpreadsheetCollaborationConfig {
  enableRealTimeEditing: boolean;
  enableCellLocking: boolean;
  enableEditIndicators: boolean;
  enableChangeTracking: boolean;
  conflictResolution: 'auto' | 'manual';
  lockTimeout: number; // milliseconds
  syncInterval: number; // milliseconds
  maxHistoryEntries: number;
  cursorUpdateThrottle: number; // milliseconds
}

export interface SpreadsheetCollaborationState {
  isConnected: boolean;
  isCollaborating: boolean;
  currentUser?: SpreadsheetCollaborationUser;
  session?: SpreadsheetCollaborationSession | undefined;
  config: SpreadsheetCollaborationConfig;
  lastSyncTime?: Date;
  pendingOperations: SpreadsheetCellEdit[];
  connectionError?: string | undefined;
}

export interface SpreadsheetOperationalTransform {
  transform(op1: SpreadsheetOperation, op2: SpreadsheetOperation): [SpreadsheetOperation, SpreadsheetOperation];
  apply(spreadsheetData: unknown, operation: SpreadsheetOperation): unknown;
  compose(ops: SpreadsheetOperation[]): SpreadsheetOperation[];
  invert(operation: SpreadsheetOperation, spreadsheetData: unknown): SpreadsheetOperation;
}