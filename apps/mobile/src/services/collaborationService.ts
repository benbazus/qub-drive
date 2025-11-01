import { 
  CollaborationState, 
  CollaborationSession, 
  CollaborationUser, 
  DocumentOperation, 
  CollaborativeCursor, 
  CollaborativeSelection,
  DocumentConflict,
  CollaborationMessage,
  DocumentOperationMessage,
  CursorMoveMessage,
  SelectionChangeMessage,
  UserJoinMessage,
  UserLeaveMessage,
  OperationalTransform
} from '../types/collaboration';
import { webSocketService } from './websocketService';

export class CollaborationService {
  private static instance: CollaborationService;
  private state: CollaborationState;
  private sessions: Map<string, CollaborationSession> = new Map();
  private operationalTransform: OperationalTransform;
  private stateChangeHandlers: ((state: CollaborationState) => void)[] = [];
  private cursorUpdateThrottle: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.state = {
      isConnected: false,
      isCollaborating: false,
      config: {
        enableRealTimeEditing: true,
        enableCursors: true,
        enableSelections: true,
        conflictResolution: 'auto',
        syncInterval: 1000,
        maxOperationsBuffer: 100,
        cursorUpdateThrottle: 200
      },
      pendingOperations: []
    };

    this.operationalTransform = new SimpleOperationalTransform();
    this.setupWebSocketHandlers();
  }

  static getInstance(): CollaborationService {
    if (!CollaborationService.instance) {
      CollaborationService.instance = new CollaborationService();
    }
    return CollaborationService.instance;
  }

  /**
   * Initialize collaboration for a user
   */
  async initialize(authToken: string, user: CollaborationUser): Promise<void> {
    try {
      await webSocketService.connect(authToken, user.id);
      
      this.updateState({
        currentUser: user,
        isConnected: true,
        connectionError: undefined as string | undefined
      });
    } catch (error) {
      console.error('Failed to initialize collaboration:', error);
      this.updateState({
        isConnected: false,
        connectionError: 'Failed to connect to collaboration server'
      });
      throw error;
    }
  }

  /**
   * Join a document collaboration session
   */
  async joinDocument(documentId: string): Promise<CollaborationSession> {
    if (!this.state.currentUser) {
      throw new Error('User not initialized');
    }

    const session: CollaborationSession = {
      documentId,
      users: [this.state.currentUser],
      cursors: new Map(),
      selections: new Map(),
      operations: [],
      conflicts: [],
      version: 0,
      isActive: true
    };

    this.sessions.set(documentId, session);
    webSocketService.joinDocument(documentId, this.state.currentUser);

    this.updateState({
      isCollaborating: true,
      session
    });

    return session;
  }

  /**
   * Leave a document collaboration session
   */
  leaveDocument(documentId: string): void {
    if (!this.state.currentUser) return;

    webSocketService.leaveDocument(documentId, this.state.currentUser.id);
    this.sessions.delete(documentId);

    this.updateState({
      isCollaborating: false,
      session: undefined as CollaborationSession | undefined
    });
  }

  /**
   * Send a document operation
   */
  sendOperation(documentId: string, operation: DocumentOperation): void {
    const session = this.sessions.get(documentId);
    if (!session || !this.state.currentUser) return;

    // Add to pending operations
    this.state.pendingOperations.push(operation);

    // Send via WebSocket
    const message: DocumentOperationMessage = {
      type: 'document_operation',
      documentId,
      userId: this.state.currentUser.id,
      timestamp: new Date(),
      data: {
        operation,
        version: session.version
      }
    };

    webSocketService.send(message);
  }

  /**
   * Update cursor position
   */
  updateCursor(documentId: string, cursor: CollaborativeCursor): void {
    const session = this.sessions.get(documentId);
    if (!session || !this.state.currentUser) return;

    // Throttle cursor updates
    const throttleKey = `${documentId}-${cursor.userId}`;
    const existingTimeout = this.cursorUpdateThrottle.get(throttleKey);
    
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      const message: CursorMoveMessage = {
        type: 'cursor_move',
        documentId,
        userId: this.state.currentUser!.id,
        timestamp: new Date(),
        data: { cursor }
      };

      webSocketService.send(message);
      this.cursorUpdateThrottle.delete(throttleKey);
    }, this.state.config.cursorUpdateThrottle);

    this.cursorUpdateThrottle.set(throttleKey, timeout);
  }

  /**
   * Update selection
   */
  updateSelection(documentId: string, selection: CollaborativeSelection): void {
    const session = this.sessions.get(documentId);
    if (!session || !this.state.currentUser) return;

    const message: SelectionChangeMessage = {
      type: 'selection_change',
      documentId,
      userId: this.state.currentUser.id,
      timestamp: new Date(),
      data: { selection }
    };

    webSocketService.send(message);
  }

  /**
   * Apply operational transformation to resolve conflicts
   */
  transformOperation(operation: DocumentOperation, againstOperations: DocumentOperation[]): DocumentOperation {
    let transformedOp = operation;
    
    for (const otherOp of againstOperations) {
      const [transformed] = this.operationalTransform.transform(transformedOp, otherOp);
      transformedOp = transformed;
    }
    
    return transformedOp;
  }

  /**
   * Apply operation to document content
   */
  applyOperation(content: string, operation: DocumentOperation): string {
    return this.operationalTransform.apply(content, operation);
  }

  /**
   * Get current collaboration state
   */
  getState(): CollaborationState {
    return { ...this.state };
  }

  /**
   * Get session for a document
   */
  getSession(documentId: string): CollaborationSession | undefined {
    return this.sessions.get(documentId);
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(handler: (state: CollaborationState) => void): () => void {
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
    
    // Clear throttle timeouts
    this.cursorUpdateThrottle.forEach(timeout => clearTimeout(timeout));
    this.cursorUpdateThrottle.clear();
    
    // Disconnect WebSocket
    webSocketService.disconnect();
    
    // Reset state
    this.updateState({
      isConnected: false,
      isCollaborating: false,
      session: undefined as CollaborationSession | undefined,
      pendingOperations: []
    });
  }

  private setupWebSocketHandlers(): void {
    // Connection state changes
    webSocketService.onConnectionChange((isConnected, error) => {
      this.updateState({
        isConnected,
        connectionError: error as string | undefined
      });
    });

    // Document operations
    webSocketService.on('document_operation', (message: CollaborationMessage) => {
      this.handleDocumentOperation(message as DocumentOperationMessage);
    });

    // Cursor movements
    webSocketService.on('cursor_move', (message: CollaborationMessage) => {
      this.handleCursorMove(message as CursorMoveMessage);
    });

    // Selection changes
    webSocketService.on('selection_change', (message: CollaborationMessage) => {
      this.handleSelectionChange(message as SelectionChangeMessage);
    });

    // User join/leave
    webSocketService.on('user_join', (message: CollaborationMessage) => {
      this.handleUserJoin(message as UserJoinMessage);
    });

    webSocketService.on('user_leave', (message: CollaborationMessage) => {
      this.handleUserLeave(message as UserLeaveMessage);
    });
  }

  private handleDocumentOperation(message: DocumentOperationMessage): void {
    const session = this.sessions.get(message.documentId);
    if (!session) return;

    const { operation, version } = message.data;

    // Check for version conflicts
    if (version !== session.version) {
      this.handleVersionConflict(session, operation, version);
      return;
    }

    // Apply operation to session
    session.operations.push(operation);
    session.version++;

    // Transform pending operations
    this.transformPendingOperations(operation);

    this.notifyStateChange();
  }

  private handleCursorMove(message: CursorMoveMessage): void {
    const session = this.sessions.get(message.documentId);
    if (!session) return;

    const { cursor } = message.data;
    session.cursors.set(cursor.userId, cursor);

    this.notifyStateChange();
  }

  private handleSelectionChange(message: SelectionChangeMessage): void {
    const session = this.sessions.get(message.documentId);
    if (!session) return;

    const { selection } = message.data;
    session.selections.set(selection.userId, selection);

    this.notifyStateChange();
  }

  private handleUserJoin(message: UserJoinMessage): void {
    const session = this.sessions.get(message.documentId);
    if (!session) return;

    const { user } = message.data;
    
    // Add user if not already present
    if (!session.users.find(u => u.id === user.id)) {
      session.users.push(user);
    }

    this.notifyStateChange();
  }

  private handleUserLeave(message: UserLeaveMessage): void {
    const session = this.sessions.get(message.documentId);
    if (!session) return;

    const { userId } = message.data;
    
    // Remove user
    session.users = session.users.filter(u => u.id !== userId);
    
    // Remove cursor and selection
    session.cursors.delete(userId);
    session.selections.delete(userId);

    this.notifyStateChange();
  }

  private handleVersionConflict(session: CollaborationSession, operation: DocumentOperation, _version: number): void {
    const conflict: DocumentConflict = {
      id: `conflict-${Date.now()}`,
      documentId: session.documentId,
      operations: [operation],
      conflictType: 'version_mismatch',
      resolution: this.state.config.conflictResolution
    };

    session.conflicts.push(conflict);

    if (this.state.config.conflictResolution === 'auto') {
      this.resolveConflictAutomatically(session, conflict);
    }

    this.notifyStateChange();
  }

  private resolveConflictAutomatically(session: CollaborationSession, conflict: DocumentConflict): void {
    // Simple auto-resolution: transform the conflicting operation against all operations since the version
    const firstOperation = conflict.operations[0];
    if (!firstOperation) return;
    
    const operationsSinceVersion = session.operations.slice(firstOperation.version);
    const transformedOperation = this.transformOperation(firstOperation, operationsSinceVersion);

    // Apply the transformed operation
    session.operations.push(transformedOperation);
    session.version++;

    // Mark conflict as resolved
    conflict.resolution = 'auto';
    conflict.resolvedAt = new Date();
  }

  private transformPendingOperations(incomingOperation: DocumentOperation): void {
    this.state.pendingOperations = this.state.pendingOperations.map(pendingOp => {
      const [transformed] = this.operationalTransform.transform(pendingOp, incomingOperation);
      return transformed;
    });
  }

  private updateState(updates: Partial<CollaborationState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyStateChange();
  }

  private notifyStateChange(): void {
    this.stateChangeHandlers.forEach(handler => {
      try {
        handler(this.state);
      } catch (error) {
        console.error('Error in collaboration state change handler:', error);
      }
    });
  }
}

/**
 * Simple Operational Transform implementation
 * This is a basic implementation - in production, you'd want a more robust OT library
 */
class SimpleOperationalTransform implements OperationalTransform {
  transform(op1: DocumentOperation, op2: DocumentOperation): [DocumentOperation, DocumentOperation] {
    // Simple transformation logic
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position <= op2.position) {
        return [
          op1,
          { ...op2, position: op2.position + (op1.content?.length || 0) }
        ];
      } else {
        return [
          { ...op1, position: op1.position + (op2.content?.length || 0) },
          op2
        ];
      }
    }

    if (op1.type === 'delete' && op2.type === 'delete') {
      if (op1.position <= op2.position) {
        return [
          op1,
          { ...op2, position: Math.max(op2.position - (op1.length || 0), op1.position) }
        ];
      } else {
        return [
          { ...op1, position: op1.position - (op2.length || 0) },
          op2
        ];
      }
    }

    if (op1.type === 'insert' && op2.type === 'delete') {
      if (op1.position <= op2.position) {
        return [
          op1,
          { ...op2, position: op2.position + (op1.content?.length || 0) }
        ];
      } else {
        return [
          { ...op1, position: op1.position - (op2.length || 0) },
          op2
        ];
      }
    }

    if (op1.type === 'delete' && op2.type === 'insert') {
      if (op1.position < op2.position) {
        return [
          op1,
          { ...op2, position: op2.position - (op1.length || 0) }
        ];
      } else {
        return [
          { ...op1, position: op1.position + (op2.content?.length || 0) },
          op2
        ];
      }
    }

    // Default: return operations unchanged
    return [op1, op2];
  }

  apply(content: string, operation: DocumentOperation): string {
    switch (operation.type) {
      case 'insert':
        return content.slice(0, operation.position) + 
               (operation.content || '') + 
               content.slice(operation.position);
      
      case 'delete':
        return content.slice(0, operation.position) + 
               content.slice(operation.position + (operation.length || 0));
      
      case 'retain':
        return content; // No change for retain operations
      
      default:
        return content;
    }
  }

  compose(ops: DocumentOperation[]): DocumentOperation[] {
    // Simple composition - in practice, you'd want to merge adjacent operations
    return ops;
  }

  invert(operation: DocumentOperation, content: string): DocumentOperation {
    switch (operation.type) {
      case 'insert':
        return {
          ...operation,
          type: 'delete',
          length: operation.content?.length || 0,
          content: undefined as string | undefined
        };
      
      case 'delete':
        return {
          ...operation,
          type: 'insert',
          content: content.slice(operation.position, operation.position + (operation.length || 0)),
          length: undefined as number | undefined
        };
      
      default:
        return operation;
    }
  }
}

export const collaborationService = CollaborationService.getInstance();