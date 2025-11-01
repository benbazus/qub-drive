import {
  SpreadsheetCollaborationState,
  SpreadsheetCollaborationSession,
  SpreadsheetCollaborationUser,
  SpreadsheetCellEdit,
  SpreadsheetCellLock,
  SpreadsheetEditIndicator,
  SpreadsheetOperation,
  SpreadsheetConflict,
  SpreadsheetCollaborationMessage,
  CellLockMessage,
  CellUnlockMessage,
  CellEditStartMessage,
  CellEditEndMessage,
  CellOperationMessage,
  UserCursorMoveMessage,
  UserJoinSpreadsheetMessage,
  UserLeaveSpreadsheetMessage,
  SpreadsheetOperationalTransform,
  SpreadsheetChangeHistory,
  CellUpdateData,
} from "../types/spreadsheetCollaboration";
import { spreadsheetWebSocketAdapter } from "./spreadsheetWebSocketAdapter";

export class SpreadsheetCollaborationService {
  private static instance: SpreadsheetCollaborationService;
  private state: SpreadsheetCollaborationState;
  private sessions: Map<string, SpreadsheetCollaborationSession> = new Map();
  private operationalTransform: SpreadsheetOperationalTransform;
  private stateChangeHandlers: ((
    state: SpreadsheetCollaborationState
  ) => void)[] = [];
  private lockTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private cursorUpdateThrottle: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.state = {
      isConnected: false,
      isCollaborating: false,
      config: {
        enableRealTimeEditing: true,
        enableCellLocking: true,
        enableEditIndicators: true,
        enableChangeTracking: true,
        conflictResolution: "auto",
        lockTimeout: 30000, // 30 seconds
        syncInterval: 1000,
        maxHistoryEntries: 100,
        cursorUpdateThrottle: 200,
      },
      pendingOperations: [],
    };

    this.operationalTransform = new SpreadsheetOperationalTransformImpl();
    this.setupWebSocketHandlers();
  }

  static getInstance(): SpreadsheetCollaborationService {
    if (!SpreadsheetCollaborationService.instance) {
      SpreadsheetCollaborationService.instance =
        new SpreadsheetCollaborationService();
    }
    return SpreadsheetCollaborationService.instance;
  }

  /**
   * Initialize collaboration for a user
   */
  async initialize(
    authToken: string,
    user: SpreadsheetCollaborationUser
  ): Promise<void> {
    try {
      await spreadsheetWebSocketAdapter.connect(authToken, user.id);

      this.updateState({
        currentUser: user,
        isConnected: true,
      });

      // Clear connection error separately
      if (this.state.connectionError) {
        this.state.connectionError = undefined;
      }
    } catch (error) {
      console.error("Failed to initialize spreadsheet collaboration:", error);
      this.updateState({
        isConnected: false,
        connectionError: "Failed to connect to collaboration server",
      });
      throw error;
    }
  }

  /**
   * Join a spreadsheet collaboration session
   */
  async joinSpreadsheet(
    spreadsheetId: string
  ): Promise<SpreadsheetCollaborationSession> {
    if (!this.state.currentUser) {
      throw new Error("User not initialized");
    }

    const session: SpreadsheetCollaborationSession = {
      spreadsheetId,
      users: [this.state.currentUser],
      cellLocks: new Map(),
      editIndicators: new Map(),
      changeHistory: [],
      conflicts: [],
      version: 0,
      isActive: true,
      lastSyncTime: new Date(),
    };

    this.sessions.set(spreadsheetId, session);
    spreadsheetWebSocketAdapter.joinDocument(
      spreadsheetId,
      this.state.currentUser
    );

    this.updateState({
      isCollaborating: true,
      session,
    });

    return session;
  }

  /**
   * Leave a spreadsheet collaboration session
   */
  leaveSpreadsheet(spreadsheetId: string): void {
    if (!this.state.currentUser) return;

    // Release all locks held by this user
    const session = this.sessions.get(spreadsheetId);
    if (session) {
      const userLocks = Array.from(session.cellLocks.values()).filter(
        (lock) => lock.userId === this.state.currentUser!.id
      );

      userLocks.forEach((lock) => {
        this.unlockCell(spreadsheetId, lock.cellRef, lock.sheetId);
      });
    }

    spreadsheetWebSocketAdapter.leaveDocument(
      spreadsheetId,
      this.state.currentUser.id
    );
    this.sessions.delete(spreadsheetId);

    this.updateState({
      isCollaborating: false,
    });

    // Clear session separately
    if (this.state.session) {
      this.state.session = undefined;
      this.notifyStateChange();
    }
  }

  /**
   * Lock a cell for editing
   */
  async lockCell(
    spreadsheetId: string,
    cellRef: string,
    sheetId: string,
    lockType: "editing" | "formatting" | "formula" = "editing"
  ): Promise<boolean> {
    const session = this.sessions.get(spreadsheetId);
    if (!session || !this.state.currentUser) return false;

    const lockKey = `${sheetId}:${cellRef}`;
    const existingLock = session.cellLocks.get(lockKey);

    // Check if cell is already locked by another user
    if (existingLock && existingLock.userId !== this.state.currentUser.id) {
      return false;
    }

    const lock: SpreadsheetCellLock = {
      cellRef,
      sheetId,
      userId: this.state.currentUser.id,
      lockedAt: new Date(),
      lockType,
      expiresAt: new Date(Date.now() + this.state.config.lockTimeout),
    };

    session.cellLocks.set(lockKey, lock);

    // Set timeout to auto-release lock
    const timeout = setTimeout(() => {
      this.unlockCell(spreadsheetId, cellRef, sheetId);
    }, this.state.config.lockTimeout);

    this.lockTimeouts.set(lockKey, timeout);

    // Notify other users
    const message: CellLockMessage = {
      type: "cell_lock",
      spreadsheetId,
      userId: this.state.currentUser.id,
      timestamp: new Date(),
      data: { lock },
    };

    spreadsheetWebSocketAdapter.send(message);
    this.notifyStateChange();

    return true;
  }

  /**
   * Unlock a cell
   */
  unlockCell(spreadsheetId: string, cellRef: string, sheetId: string): void {
    const session = this.sessions.get(spreadsheetId);
    if (!session || !this.state.currentUser) return;

    const lockKey = `${sheetId}:${cellRef}`;
    const lock = session.cellLocks.get(lockKey);

    if (!lock || lock.userId !== this.state.currentUser.id) return;

    session.cellLocks.delete(lockKey);

    // Clear timeout
    const timeout = this.lockTimeouts.get(lockKey);
    if (timeout) {
      clearTimeout(timeout);
      this.lockTimeouts.delete(lockKey);
    }

    // Notify other users
    const message: CellUnlockMessage = {
      type: "cell_unlock",
      spreadsheetId,
      userId: this.state.currentUser.id,
      timestamp: new Date(),
      data: { cellRef, sheetId },
    };

    spreadsheetWebSocketAdapter.send(message);
    this.notifyStateChange();
  }

  /**
   * Start editing a cell
   */
  startCellEdit(
    spreadsheetId: string,
    cellRef: string,
    sheetId: string,
    editType: "typing" | "formula" | "formatting" = "typing"
  ): void {
    const session = this.sessions.get(spreadsheetId);
    if (!session || !this.state.currentUser) return;

    const indicator: SpreadsheetEditIndicator = {
      cellRef,
      sheetId,
      userId: this.state.currentUser.id,
      userName: this.state.currentUser.name,
      userColor: this.state.currentUser.activeCellColor,
      editType,
      startTime: new Date(),
    };

    const indicatorKey = `${sheetId}:${cellRef}`;
    session.editIndicators.set(indicatorKey, indicator);

    // Update user state
    this.state.currentUser.isEditing = true;
    this.state.currentUser.editingCell = cellRef;

    const message: CellEditStartMessage = {
      type: "cell_edit_start",
      spreadsheetId,
      userId: this.state.currentUser.id,
      timestamp: new Date(),
      data: { indicator },
    };

    spreadsheetWebSocketAdapter.send(message);
    this.notifyStateChange();
  }

  /**
   * End editing a cell
   */
  endCellEdit(spreadsheetId: string, cellRef: string, sheetId: string): void {
    const session = this.sessions.get(spreadsheetId);
    if (!session || !this.state.currentUser) return;

    const indicatorKey = `${sheetId}:${cellRef}`;
    session.editIndicators.delete(indicatorKey);

    // Update user state
    if (this.state.currentUser) {
      this.state.currentUser.isEditing = false;
      this.state.currentUser.editingCell = undefined;
    }

    const message: CellEditEndMessage = {
      type: "cell_edit_end",
      spreadsheetId,
      userId: this.state.currentUser.id,
      timestamp: new Date(),
      data: { cellRef, sheetId },
    };

    spreadsheetWebSocketAdapter.send(message);
    this.notifyStateChange();
  }

  /**
   * Send a cell operation
   */
  sendCellOperation(
    spreadsheetId: string,
    operation: SpreadsheetOperation
  ): void {
    const session = this.sessions.get(spreadsheetId);
    if (!session || !this.state.currentUser) return;

    const edit: SpreadsheetCellEdit = {
      id: `edit-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      cellRef: operation.cellRef || "",
      sheetId: operation.sheetId,
      userId: this.state.currentUser.id,
      operation,
      timestamp: new Date(),
      version: session.version,
      isApplied: false,
    };

    // Add to pending operations
    this.state.pendingOperations.push(edit);

    // Send via WebSocket
    const message: CellOperationMessage = {
      type: "cell_operation",
      spreadsheetId,
      userId: this.state.currentUser.id,
      timestamp: new Date(),
      data: { edit },
    };

    spreadsheetWebSocketAdapter.send(message);
  }

  /**
   * Update user cursor position
   */
  updateCursor(spreadsheetId: string, cellRef: string, sheetId: string): void {
    const session = this.sessions.get(spreadsheetId);
    if (!session || !this.state.currentUser) return;

    // Update user state
    this.state.currentUser.activeCell = cellRef;
    this.state.currentUser.lastActivity = new Date();

    // Throttle cursor updates
    const throttleKey = `${spreadsheetId}-${this.state.currentUser.id}`;
    const existingTimeout = this.cursorUpdateThrottle.get(throttleKey);

    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      const message: UserCursorMoveMessage = {
        type: "user_cursor_move",
        spreadsheetId,
        userId: this.state.currentUser!.id,
        timestamp: new Date(),
        data: { cellRef, sheetId },
      };

      spreadsheetWebSocketAdapter.send(message);
      this.cursorUpdateThrottle.delete(throttleKey);
    }, this.state.config.cursorUpdateThrottle);

    this.cursorUpdateThrottle.set(throttleKey, timeout);
  }

  /**
   * Get cell lock status
   */
  getCellLock(
    spreadsheetId: string,
    cellRef: string,
    sheetId: string
  ): SpreadsheetCellLock | null {
    const session = this.sessions.get(spreadsheetId);
    if (!session) return null;

    const lockKey = `${sheetId}:${cellRef}`;
    return session.cellLocks.get(lockKey) || null;
  }

  /**
   * Check if cell is locked by current user
   */
  isCellLockedByCurrentUser(
    spreadsheetId: string,
    cellRef: string,
    sheetId: string
  ): boolean {
    const lock = this.getCellLock(spreadsheetId, cellRef, sheetId);
    return lock?.userId === this.state.currentUser?.id;
  }

  /**
   * Get edit indicator for a cell
   */
  getCellEditIndicator(
    spreadsheetId: string,
    cellRef: string,
    sheetId: string
  ): SpreadsheetEditIndicator | null {
    const session = this.sessions.get(spreadsheetId);
    if (!session) return null;

    const indicatorKey = `${sheetId}:${cellRef}`;
    return session.editIndicators.get(indicatorKey) || null;
  }

  /**
   * Get change history
   */
  getChangeHistory(spreadsheetId: string): SpreadsheetChangeHistory[] {
    const session = this.sessions.get(spreadsheetId);
    return session?.changeHistory || [];
  }

  /**
   * Get current collaboration state
   */
  getState(): SpreadsheetCollaborationState {
    return { ...this.state };
  }

  /**
   * Get session for a spreadsheet
   */
  getSession(
    spreadsheetId: string
  ): SpreadsheetCollaborationSession | undefined {
    return this.sessions.get(spreadsheetId);
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(
    handler: (state: SpreadsheetCollaborationState) => void
  ): () => void {
    this.stateChangeHandlers.push(handler);

    return () => {
      const index = this.stateChangeHandlers.indexOf(handler);
      if (index > -1) {
        this.stateChangeHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Clear all sessions
    this.sessions.clear();

    // Clear timeouts
    this.lockTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.lockTimeouts.clear();

    this.cursorUpdateThrottle.forEach((timeout) => clearTimeout(timeout));
    this.cursorUpdateThrottle.clear();

    // Disconnect WebSocket
    spreadsheetWebSocketAdapter.disconnect();

    // Reset state
    this.updateState({
      isConnected: false,
      isCollaborating: false,
      pendingOperations: [],
    });

    // Clear session separately
    this.state.session = undefined;
  }

  private setupWebSocketHandlers(): void {
    // Connection state changes
    spreadsheetWebSocketAdapter.onConnectionChange((isConnected, error) => {
      this.updateState({ isConnected });
      if (error) {
        this.state.connectionError = error;
      } else if (this.state.connectionError) {
        this.state.connectionError = undefined;
      }
    });

    // Cell operations
    spreadsheetWebSocketAdapter.on(
      "cell_operation",
      (message: SpreadsheetCollaborationMessage) => {
        this.handleCellOperation(message as CellOperationMessage);
      }
    );

    // Cell locks
    spreadsheetWebSocketAdapter.on(
      "cell_lock",
      (message: SpreadsheetCollaborationMessage) => {
        this.handleCellLock(message as CellLockMessage);
      }
    );

    spreadsheetWebSocketAdapter.on(
      "cell_unlock",
      (message: SpreadsheetCollaborationMessage) => {
        this.handleCellUnlock(message as CellUnlockMessage);
      }
    );

    // Edit indicators
    spreadsheetWebSocketAdapter.on(
      "cell_edit_start",
      (message: SpreadsheetCollaborationMessage) => {
        this.handleCellEditStart(message as CellEditStartMessage);
      }
    );

    spreadsheetWebSocketAdapter.on(
      "cell_edit_end",
      (message: SpreadsheetCollaborationMessage) => {
        this.handleCellEditEnd(message as CellEditEndMessage);
      }
    );

    // User presence
    spreadsheetWebSocketAdapter.on(
      "user_cursor_move",
      (message: SpreadsheetCollaborationMessage) => {
        this.handleUserCursorMove(message as UserCursorMoveMessage);
      }
    );

    spreadsheetWebSocketAdapter.on(
      "user_join",
      (message: SpreadsheetCollaborationMessage) => {
        this.handleUserJoin(message as UserJoinSpreadsheetMessage);
      }
    );

    spreadsheetWebSocketAdapter.on(
      "user_leave",
      (message: SpreadsheetCollaborationMessage) => {
        this.handleUserLeave(message as UserLeaveSpreadsheetMessage);
      }
    );
  }

  private handleCellOperation(message: CellOperationMessage): void {
    const session = this.sessions.get(message.spreadsheetId);
    if (!session) return;

    const { edit } = message.data;

    // Check for version conflicts
    if (edit.version !== session.version) {
      this.handleVersionConflict(session, edit);
      return;
    }

    // Apply operation to session
    this.applyCellEdit(session, edit);
    session.version++;

    // Transform pending operations
    this.transformPendingOperations(edit.operation);

    // Add to change history
    this.addToChangeHistory(session, edit);

    this.notifyStateChange();
  }

  private handleCellLock(message: CellLockMessage): void {
    const session = this.sessions.get(message.spreadsheetId);
    if (!session) return;

    const { lock } = message.data;
    const lockKey = `${lock.sheetId}:${lock.cellRef}`;
    session.cellLocks.set(lockKey, lock);

    this.notifyStateChange();
  }

  private handleCellUnlock(message: CellUnlockMessage): void {
    const session = this.sessions.get(message.spreadsheetId);
    if (!session) return;

    const { cellRef, sheetId } = message.data;
    const lockKey = `${sheetId}:${cellRef}`;
    session.cellLocks.delete(lockKey);

    this.notifyStateChange();
  }

  private handleCellEditStart(message: CellEditStartMessage): void {
    const session = this.sessions.get(message.spreadsheetId);
    if (!session) return;

    const { indicator } = message.data;
    const indicatorKey = `${indicator.sheetId}:${indicator.cellRef}`;
    session.editIndicators.set(indicatorKey, indicator);

    // Update user state
    const user = session.users.find((u) => u.id === message.userId);
    if (user) {
      user.isEditing = true;
      user.editingCell = indicator.cellRef;
    }

    this.notifyStateChange();
  }

  private handleCellEditEnd(message: CellEditEndMessage): void {
    const session = this.sessions.get(message.spreadsheetId);
    if (!session) return;

    const { cellRef, sheetId } = message.data;
    const indicatorKey = `${sheetId}:${cellRef}`;
    session.editIndicators.delete(indicatorKey);

    // Update user state
    const user = session.users.find((u) => u.id === message.userId);
    if (user) {
      user.isEditing = false;
      user.editingCell = undefined;
    }

    this.notifyStateChange();
  }

  private handleUserCursorMove(message: UserCursorMoveMessage): void {
    const session = this.sessions.get(message.spreadsheetId);
    if (!session) return;

    const { cellRef } = message.data;
    const user = session.users.find((u) => u.id === message.userId);
    if (user) {
      user.activeCell = cellRef;
      user.lastActivity = new Date();
    }

    this.notifyStateChange();
  }

  private handleUserJoin(message: UserJoinSpreadsheetMessage): void {
    const session = this.sessions.get(message.spreadsheetId);
    if (!session) return;

    const { user } = message.data;

    // Add user if not already present
    if (!session.users.find((u) => u.id === user.id)) {
      session.users.push(user);
    }

    this.notifyStateChange();
  }

  private handleUserLeave(message: UserLeaveSpreadsheetMessage): void {
    const session = this.sessions.get(message.spreadsheetId);
    if (!session) return;

    const { userId } = message.data;

    // Remove user
    session.users = session.users.filter((u) => u.id !== userId);

    // Remove user's locks and indicators
    session.cellLocks.forEach((lock, key) => {
      if (lock.userId === userId) {
        session.cellLocks.delete(key);
      }
    });

    session.editIndicators.forEach((indicator, key) => {
      if (indicator.userId === userId) {
        session.editIndicators.delete(key);
      }
    });

    this.notifyStateChange();
  }

  private handleVersionConflict(
    _session: SpreadsheetCollaborationSession,
    edit: SpreadsheetCellEdit
  ): void {
    const conflict: SpreadsheetConflict = {
      id: `conflict-${Date.now()}`,
      spreadsheetId: _session.spreadsheetId,
      cellRef: edit.cellRef,
      sheetId: edit.sheetId,
      conflictingEdits: [edit],
      conflictType: "version_mismatch",
      resolution: this.state.config.conflictResolution,
    };

    _session.conflicts.push(conflict);

    if (this.state.config.conflictResolution === "auto") {
      this.resolveConflictAutomatically(_session, conflict);
    }

    this.notifyStateChange();
  }

  private resolveConflictAutomatically(
    session: SpreadsheetCollaborationSession,
    conflict: SpreadsheetConflict
  ): void {
    // Simple auto-resolution: apply the most recent edit
    const winningEdit = conflict.conflictingEdits[0];
    if (!winningEdit) return;

    this.applyCellEdit(session, winningEdit);
    session.version++;

    conflict.resolution = "auto";
    conflict.resolvedAt = new Date();
    conflict.winningEdit = winningEdit;
  }

  private applyCellEdit(
    _session: SpreadsheetCollaborationSession,
    edit: SpreadsheetCellEdit
  ): void {
    // Mark edit as applied
    edit.isApplied = true;

    // In a real implementation, you would apply the edit to the spreadsheet data
    // For now, we'll just track it in the session
    console.warn("Applied cell edit:", edit);
  }

  private transformPendingOperations(
    _incomingOperation: SpreadsheetOperation
  ): void {
    this.state.pendingOperations = this.state.pendingOperations.map(
      (pendingEdit) => {
        const [transformed] = this.operationalTransform.transform(
          pendingEdit.operation,
          _incomingOperation
        );
        return { ...pendingEdit, operation: transformed };
      }
    );
  }

  private addToChangeHistory(
    _session: SpreadsheetCollaborationSession,
    edit: SpreadsheetCellEdit
  ): void {
    const historyEntry: SpreadsheetChangeHistory = {
      id: edit.id,
      spreadsheetId: _session.spreadsheetId,
      userId: edit.userId,
      userName:
        _session.users.find((u) => u.id === edit.userId)?.name || "Unknown",
      operation: edit.operation,
      timestamp: edit.timestamp,
      version: edit.version,
      description: this.generateOperationDescription(edit.operation),
      canUndo: true,
      canRedo: false,
    };

    _session.changeHistory.push(historyEntry);

    // Limit history size
    if (_session.changeHistory.length > this.state.config.maxHistoryEntries) {
      _session.changeHistory.shift();
    }
  }

  private generateOperationDescription(
    operation: SpreadsheetOperation
  ): string {
    switch (operation.type) {
      case "cell_update":
        const cellData = operation.data as CellUpdateData;
        return `Updated cell ${operation.cellRef} to "${cellData.value}"`;
      case "cell_format":
        return `Formatted cell ${operation.cellRef}`;
      case "range_update":
        return `Updated range in sheet ${operation.sheetId}`;
      case "sheet_add":
        return `Added new sheet`;
      case "sheet_delete":
        return `Deleted sheet`;
      case "sheet_rename":
        return `Renamed sheet`;
      default:
        return "Unknown operation";
    }
  }

  private updateState(updates: Partial<SpreadsheetCollaborationState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyStateChange();
  }

  private notifyStateChange(): void {
    this.stateChangeHandlers.forEach((handler) => {
      try {
        handler(this.state);
      } catch (error) {
        console.error(
          "Error in spreadsheet collaboration state change handler:",
          error
        );
      }
    });
  }
}

/**
 * Simple Operational Transform implementation for spreadsheets
 */
class SpreadsheetOperationalTransformImpl
  implements SpreadsheetOperationalTransform
{
  transform(
    op1: SpreadsheetOperation,
    op2: SpreadsheetOperation
  ): [SpreadsheetOperation, SpreadsheetOperation] {
    // Simple transformation logic for spreadsheet operations
    if (op1.type === "cell_update" && op2.type === "cell_update") {
      // If operations are on the same cell, the later one wins
      if (op1.cellRef === op2.cellRef && op1.sheetId === op2.sheetId) {
        return [op1, op2]; // Keep both, let conflict resolution handle it
      }
    }

    // For different cells or different operation types, no transformation needed
    return [op1, op2];
  }

  apply(_spreadsheetData: unknown, _operation: SpreadsheetOperation): unknown {
    // In a real implementation, this would apply the operation to the spreadsheet data
    // For now, just return the data unchanged
    return _spreadsheetData;
  }

  compose(ops: SpreadsheetOperation[]): SpreadsheetOperation[] {
    // Simple composition - in practice, you'd want to merge compatible operations
    return ops;
  }

  invert(
    operation: SpreadsheetOperation,
    _spreadsheetData: unknown
  ): SpreadsheetOperation {
    // Create inverse operation for undo functionality
    switch (operation.type) {
      case "cell_update":
        const cellData = operation.data as CellUpdateData;
        return {
          ...operation,
          data: {
            value: cellData.previousValue || { type: "empty" },
            formula: cellData.previousFormula || undefined,
            previousValue: cellData.value,
            previousFormula: cellData.formula || undefined,
          },
        };
      default:
        return operation;
    }
  }
}

export const spreadsheetCollaborationService =
  SpreadsheetCollaborationService.getInstance();
