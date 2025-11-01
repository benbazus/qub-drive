import { webSocketService } from './websocketService';
import { CollaborationMessage } from '../types/collaboration';
import { SpreadsheetCollaborationMessage, SpreadsheetCollaborationUser } from '../types/spreadsheetCollaboration';

/**
 * Adapter to bridge spreadsheet collaboration messages with the generic WebSocket service
 */
export class SpreadsheetWebSocketAdapter {
  private static instance: SpreadsheetWebSocketAdapter;
  private eventHandlers: Map<string, ((message: SpreadsheetCollaborationMessage) => void)[]> = new Map();

  private constructor() {
    this.setupWebSocketHandlers();
  }

  static getInstance(): SpreadsheetWebSocketAdapter {
    if (!SpreadsheetWebSocketAdapter.instance) {
      SpreadsheetWebSocketAdapter.instance = new SpreadsheetWebSocketAdapter();
    }
    return SpreadsheetWebSocketAdapter.instance;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(authToken: string, userId: string): Promise<void> {
    return webSocketService.connect(authToken, userId);
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    webSocketService.disconnect();
  }

  /**
   * Send spreadsheet collaboration message
   */
  send(message: SpreadsheetCollaborationMessage): void {
    // Convert spreadsheet message to generic collaboration message
    const collaborationMessage: CollaborationMessage = {
      type: this.mapSpreadsheetTypeToCollaborationType(message.type),
      documentId: message.spreadsheetId,
      userId: message.userId,
      timestamp: message.timestamp,
      data: this.convertSpreadsheetDataToCollaborationData(message.type, message.data) as any
    };

    webSocketService.send(collaborationMessage);
  }

  /**
   * Subscribe to spreadsheet collaboration events
   */
  on(eventType: string, handler: (message: SpreadsheetCollaborationMessage) => void): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }

    this.eventHandlers.get(eventType)!.push(handler);

    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Subscribe to connection state changes
   */
  onConnectionChange(handler: (isConnected: boolean, error?: string) => void): () => void {
    return webSocketService.onConnectionChange(handler);
  }

  /**
   * Join a spreadsheet collaboration session
   */
  joinDocument(spreadsheetId: string, user: SpreadsheetCollaborationUser): void {
    webSocketService.joinDocument(spreadsheetId, {
      id: user.id,
      name: user.name,
      email: user.email || '',
      avatar: user.avatar,
      color: user.activeCellColor,
      isOnline: true,
      lastSeen: new Date()
    });
  }

  /**
   * Leave a spreadsheet collaboration session
   */
  leaveDocument(spreadsheetId: string, userId: string): void {
    webSocketService.leaveDocument(spreadsheetId, userId);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return webSocketService.isConnected();
  }

  private setupWebSocketHandlers(): void {
    // Listen to all WebSocket events and convert them to spreadsheet events
    const eventTypes = [
      'cell_lock', 'cell_unlock', 'cell_edit_start', 'cell_edit_end',
      'cell_operation', 'user_cursor_move', 'user_join', 'user_leave',
      'conflict_resolution', 'sync_request', 'sync_response', 'version_update'
    ];

    eventTypes.forEach(eventType => {
      webSocketService.on(eventType, (message: CollaborationMessage) => {
        this.handleWebSocketMessage(eventType, message);
      });
    });

    // Also listen to generic collaboration events that might be spreadsheet-related
    webSocketService.on('document_operation', (message: CollaborationMessage) => {
      if (this.isSpreadsheetMessage(message)) {
        this.handleWebSocketMessage('cell_operation', message);
      }
    });

    webSocketService.on('user_join', (message: CollaborationMessage) => {
      this.handleWebSocketMessage('user_join', message);
    });

    webSocketService.on('user_leave', (message: CollaborationMessage) => {
      this.handleWebSocketMessage('user_leave', message);
    });

    webSocketService.on('cursor_move', (message: CollaborationMessage) => {
      this.handleWebSocketMessage('user_cursor_move', message);
    });
  }

  private handleWebSocketMessage(eventType: string, message: CollaborationMessage): void {
    // Convert generic collaboration message to spreadsheet message
    const spreadsheetMessage: SpreadsheetCollaborationMessage = {
      type: eventType as SpreadsheetCollaborationMessage['type'],
      spreadsheetId: message.documentId,
      userId: message.userId,
      timestamp: message.timestamp,
      data: this.convertCollaborationDataToSpreadsheetData(eventType, (message.data || {}) as Record<string, unknown>) as unknown
    };

    this.notifyEventHandlers(eventType, spreadsheetMessage);
  }

  private notifyEventHandlers(eventType: string, message: SpreadsheetCollaborationMessage): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in spreadsheet WebSocket event handler:', error);
        }
      });
    }
  }

  private mapSpreadsheetTypeToCollaborationType(spreadsheetType: string): 'document_operation' | 'cursor_move' | 'selection_change' | 'user_join' | 'user_leave' | 'conflict_resolution' | 'document_sync' {
    switch (spreadsheetType) {
      case 'cell_operation':
      case 'cell_lock':
      case 'cell_unlock':
      case 'cell_edit_start':
      case 'cell_edit_end':
        return 'document_operation';
      case 'user_cursor_move':
        return 'cursor_move';
      case 'user_join':
        return 'user_join';
      case 'user_leave':
        return 'user_leave';
      case 'conflict_resolution':
        return 'conflict_resolution';
      case 'sync_request':
      case 'sync_response':
      case 'version_update':
        return 'document_sync';
      default:
        return 'document_operation';
    }
  }

  private isSpreadsheetMessage(message: CollaborationMessage): boolean {
    const data = message.data as Record<string, unknown>;
    return !!data?.spreadsheetType || !!data?.spreadsheetData;
  }

  private convertSpreadsheetDataToCollaborationData(messageType: string, _data: unknown): Record<string, unknown> {
    // Create a mock collaboration data structure based on message type
    switch (messageType) {
      case 'cell_operation':
        return {
          operation: {
            id: 'mock-op',
            type: 'insert' as const,
            position: 0,
            content: 'mock',
            userId: 'mock-user',
            timestamp: new Date(),
            version: 1
          },
          version: 1
        };
      case 'user_cursor_move':
        return {
          cursor: {
            userId: 'mock-user',
            position: 0,
            timestamp: new Date()
          }
        };
      case 'user_join':
        return {
          user: {
            id: 'mock-user',
            name: 'Mock User',
            email: 'mock@example.com',
            color: '#000000',
            isOnline: true,
            lastSeen: new Date()
          }
        };
      case 'user_leave':
        return {
          userId: 'mock-user'
        };
      default:
        return {
          content: 'mock',
          version: 1,
          operations: []
        };
    }
  }

  private convertCollaborationDataToSpreadsheetData(_eventType: string, data: Record<string, unknown>): Record<string, unknown> {
    // Extract spreadsheet-specific data from collaboration message
    if (data.spreadsheetData) {
      return data.spreadsheetData;
    }
    
    // For direct collaboration messages, return as-is
    return data as Record<string, unknown>;
  }
}

export const spreadsheetWebSocketAdapter = SpreadsheetWebSocketAdapter.getInstance();