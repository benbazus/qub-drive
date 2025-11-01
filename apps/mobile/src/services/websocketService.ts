import { API_CONFIG } from "../config/api";
import {
  CollaborationMessage,
  CollaborationUser,
} from "../types/collaboration";
import { WebSocketMessage } from "../types/websocket";

export type WebSocketEventHandler = (message: CollaborationMessage) => void;
export type ConnectionStateHandler = (
  isConnected: boolean,
  error?: string
) => void;

export class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private eventHandlers: Map<string, WebSocketEventHandler[]> = new Map();
  private connectionHandlers: ConnectionStateHandler[] = [];
  private isConnecting = false;
  private shouldReconnect = true;
  private authToken: string | null = null;
  private currentUserId: string | null = null;

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(authToken: string, userId: string): Promise<void> {
    if (
      this.isConnecting ||
      (this.ws && this.ws.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    this.authToken = authToken;
    this.currentUserId = userId;
    this.isConnecting = true;
    this.shouldReconnect = true;

    try {
      const wsUrl = `${API_CONFIG.WS_BASE_URL}/ws?token=${encodeURIComponent(
        authToken
      )}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

      // Set up ping/pong for connection health
      this.setupHeartbeat();
    } catch (error) {
      this.isConnecting = false;
      console.error("WebSocket connection error:", error);
      this.notifyConnectionHandlers(
        false,
        "Failed to connect to WebSocket server"
      );
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.shouldReconnect = false;

    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }

    this.clearHeartbeat();
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.notifyConnectionHandlers(false);
  }

  /**
   * Send message to WebSocket server
   */
  send(message: CollaborationMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not connected, cannot send message:", message);
      return;
    }

    try {
      // Convert collaboration message to WebSocket message format
      const wsMessage: WebSocketMessage = {
        type: message.type,
        data: {
          ...message.data,
          documentId: message.documentId,
          userId: message.userId,
        },
      };

      this.ws.send(JSON.stringify(wsMessage));
    } catch (error) {
      console.error("Error sending WebSocket message:", error);
    }
  }

  /**
   * Subscribe to WebSocket events
   */
  on(eventType: string, handler: WebSocketEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }

    this.eventHandlers.get(eventType)!.push(handler);

    // Return unsubscribe function
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
  onConnectionChange(handler: ConnectionStateHandler): () => void {
    this.connectionHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = this.connectionHandlers.indexOf(handler);
      if (index > -1) {
        this.connectionHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Get current connection state
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Join a document collaboration session
   */
  joinDocument(documentId: string, user: CollaborationUser): void {
    this.send({
      type: "user_join",
      documentId,
      userId: user.id,
      timestamp: new Date(),
      data: { user },
    });
  }

  /**
   * Leave a document collaboration session
   */
  leaveDocument(documentId: string, userId: string): void {
    this.send({
      type: "user_leave",
      documentId,
      userId,
      timestamp: new Date(),
      data: { userId },
    });
  }

  private handleOpen(): void {
    // WebSocket connected
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
    this.notifyConnectionHandlers(true);

    // Send authentication message
    if (this.authToken) {
      const authMessage: WebSocketMessage = {
        type: "authenticate",
        data: { token: this.authToken },
      };
      this.ws?.send(JSON.stringify(authMessage));
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      // Convert WebSocket message to collaboration message format
      const collaborationMessage: CollaborationMessage = {
        type: message.type as unknown,
        documentId: message.data?.documentId || "",
        userId: message.data?.userId || "",
        timestamp: new Date(),
        data: message.data || {},
      };

      this.notifyEventHandlers(message.type, collaborationMessage);
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  }

  private handleClose(event: CloseEvent): void {
    // WebSocket disconnected
    this.ws = null;
    this.isConnecting = false;
    this.clearHeartbeat();
    this.notifyConnectionHandlers(false, event.reason);

    // Attempt to reconnect if it wasn't a clean disconnect
    if (this.shouldReconnect && event.code !== 1000) {
      this.attemptReconnect();
    }
  }

  private handleError(event: Event): void {
    console.error("WebSocket error:", event);
    this.notifyConnectionHandlers(false, "WebSocket connection error");
  }

  private attemptReconnect(): void {
    if (
      !this.shouldReconnect ||
      this.reconnectAttempts >= this.maxReconnectAttempts
    ) {
      // Max reconnection attempts reached
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    // Attempting to reconnect

    setTimeout(() => {
      if (this.shouldReconnect && this.authToken && this.currentUserId) {
        this.connect(this.authToken, this.currentUserId).catch((error) => {
          console.error("Reconnection failed:", error);
        });
      }
    }, delay);
  }

  private heartbeatInterval: NodeJS.Timeout | null = null;

  private setupHeartbeat(): void {
    this.clearHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const pingMessage: WebSocketMessage = { type: "ping" };
        this.ws.send(JSON.stringify(pingMessage));
      }
    }, 30000); // Send ping every 30 seconds
  }

  private clearHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private notifyEventHandlers(
    eventType: string,
    message: CollaborationMessage
  ): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error("Error in WebSocket event handler:", error);
        }
      });
    }
  }

  private notifyConnectionHandlers(isConnected: boolean, error?: string): void {
    this.connectionHandlers.forEach((handler) => {
      try {
        handler(isConnected, error);
      } catch (error) {
        console.error("Error in connection state handler:", error);
      }
    });
  }
}

export const webSocketService = WebSocketService.getInstance();
