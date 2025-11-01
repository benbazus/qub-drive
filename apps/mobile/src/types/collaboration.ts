// Real-time collaboration types for documents
export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | undefined;
  color: string; // Unique color for this user's cursor/selections
  isOnline: boolean;
  lastSeen: Date;
}

export interface CollaborativeCursor {
  userId: string;
  position: number;
  selection?: {
    start: number;
    end: number;
  } | undefined;
  timestamp: Date;
}

export interface CollaborativeSelection {
  userId: string;
  start: number;
  end: number;
  timestamp: Date;
}

export interface DocumentOperation {
  id: string;
  type: 'insert' | 'delete' | 'retain' | 'format';
  position: number;
  content?: string | undefined;
  length?: number | undefined;
  attributes?: Record<string, unknown>;
  userId: string;
  timestamp: Date;
  version: number;
}

export interface DocumentConflict {
  id: string;
  documentId: string;
  operations: DocumentOperation[];
  conflictType: 'concurrent_edit' | 'version_mismatch' | 'format_conflict';
  resolution: 'auto' | 'manual' | 'pending';
  resolvedBy?: string | undefined;
  resolvedAt?: Date | undefined;
}

export interface CollaborationSession {
  documentId: string;
  users: CollaborationUser[];
  cursors: Map<string, CollaborativeCursor>;
  selections: Map<string, CollaborativeSelection>;
  operations: DocumentOperation[];
  conflicts: DocumentConflict[];
  version: number;
  isActive: boolean;
}

export interface WebSocketCollaborationMessage {
  type: 'document_operation' | 'cursor_move' | 'selection_change' | 'user_join' | 'user_leave' | 'conflict_resolution' | 'document_sync';
  documentId: string;
  userId: string;
  timestamp: Date;
  data: unknown;
}

export interface DocumentOperationMessage extends WebSocketCollaborationMessage {
  type: 'document_operation';
  data: {
    operation: DocumentOperation;
    version: number;
  };
}

export interface CursorMoveMessage extends WebSocketCollaborationMessage {
  type: 'cursor_move';
  data: {
    cursor: CollaborativeCursor;
  };
}

export interface SelectionChangeMessage extends WebSocketCollaborationMessage {
  type: 'selection_change';
  data: {
    selection: CollaborativeSelection;
  };
}

export interface UserJoinMessage extends WebSocketCollaborationMessage {
  type: 'user_join';
  data: {
    user: CollaborationUser;
  };
}

export interface UserLeaveMessage extends WebSocketCollaborationMessage {
  type: 'user_leave';
  data: {
    userId: string;
  };
}

export interface ConflictResolutionMessage extends WebSocketCollaborationMessage {
  type: 'conflict_resolution';
  data: {
    conflict: DocumentConflict;
    resolution: 'accepted' | 'rejected';
  };
}

export interface DocumentSyncMessage extends WebSocketCollaborationMessage {
  type: 'document_sync';
  data: {
    content: string;
    version: number;
    operations: DocumentOperation[];
  };
}

export type CollaborationMessage = 
  | DocumentOperationMessage
  | CursorMoveMessage
  | SelectionChangeMessage
  | UserJoinMessage
  | UserLeaveMessage
  | ConflictResolutionMessage
  | DocumentSyncMessage;

export interface CollaborationConfig {
  enableRealTimeEditing: boolean;
  enableCursors: boolean;
  enableSelections: boolean;
  conflictResolution: 'auto' | 'manual';
  syncInterval: number; // milliseconds
  maxOperationsBuffer: number;
  cursorUpdateThrottle: number; // milliseconds
}

export interface CollaborationState {
  isConnected: boolean;
  isCollaborating: boolean;
  currentUser?: CollaborationUser;
  session?: CollaborationSession | undefined;
  config: CollaborationConfig;
  lastSyncTime?: Date;
  pendingOperations: DocumentOperation[];
  connectionError?: string | undefined;
}

export interface OperationalTransform {
  transform(op1: DocumentOperation, op2: DocumentOperation): [DocumentOperation, DocumentOperation];
  apply(content: string, operation: DocumentOperation): string;
  compose(ops: DocumentOperation[]): DocumentOperation[];
  invert(operation: DocumentOperation, content: string): DocumentOperation;
}