// WebSocket message types that match the backend implementation
export interface WebSocketMessage {
  type: string;
  data?: Record<string, unknown>;
}

export interface AuthenticateMessage extends WebSocketMessage {
  type: 'authenticate';
  data: {
    token: string;
  };
}

export interface AuthenticationResultMessage extends WebSocketMessage {
  type: 'authentication_result';
  data: {
    success: boolean;
    message: string;
  };
}

export interface DocumentOperationMessage extends WebSocketMessage {
  type: 'document_operation';
  data: {
    documentId: string;
    operation: Record<string, unknown>;
    version: number;
    userId: string;
  };
}

export interface CursorMoveMessage extends WebSocketMessage {
  type: 'cursor_move';
  data: {
    documentId: string;
    userId: string;
    position: number;
    selection?: {
      start: number;
      end: number;
    };
  };
}

export interface UserOnlineMessage extends WebSocketMessage {
  type: 'user_online';
  data: {
    userId: string;
    username: string;
  };
}

export interface UserOfflineMessage extends WebSocketMessage {
  type: 'user_offline';
  data: {
    userId: string;
    username: string;
  };
}

export interface PingMessage extends WebSocketMessage {
  type: 'ping';
}

export interface PongMessage extends WebSocketMessage {
  type: 'pong';
}

export interface ErrorMessage extends WebSocketMessage {
  type: 'error';
  data: {
    code: string;
    message: string;
  };
}

export type WebSocketMessageType = 
  | AuthenticateMessage
  | AuthenticationResultMessage
  | DocumentOperationMessage
  | CursorMoveMessage
  | UserOnlineMessage
  | UserOfflineMessage
  | PingMessage
  | PongMessage
  | ErrorMessage;