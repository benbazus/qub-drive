

import { Server, Socket } from "socket.io";
import prisma from "../config/database.config";
import Joi from "joi";
import { performance } from "perf_hooks";
import jwt, { JwtPayload } from "jsonwebtoken";
import { logger } from "../utils/logger";

// Types and Interfaces
interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

interface DocumentSession {
  documentId: string;
  userId: string;
  joinedAt: Date;
  lastActivity: Date;
  requestCounts: Map<string, { count: number; resetTime: number }>;
  cursor?: {
    x: number;
    y: number;
    selection?: { start: number; end: number };
  };
  status?: "active" | "idle" | "typing" | "away";
}

interface SocketMetrics {
  connectionsCount: number;
  documentsCount: number;
  messagesPerSecond: number;
  totalRequests: number;
}



export const getDocumentSchema = Joi.object({
  documentId: Joi.string().uuid().required().messages({
    "string.uuid": "Invalid document ID format",
    "any.required": "Document ID is required",
  }),
  userId: Joi.string().uuid().optional().messages({
    "string.uuid": "Invalid user ID format",
  }),
});

export const saveDocumentSchema = Joi.object({
  data: Joi.string()
    .max(10 * 1024 * 1024)
    .required()
    .messages({
      "string.max": "Document too large",
      "any.required": "Document data is required",
    }),
  title: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      "string.min": "Title must be at least 1 character",
      "string.max": "Title must be between 1-255 characters",
      "any.required": "Title is required",
    }),
});

export const deltaSchema = Joi.object({
  ops: Joi.array()
    .items(Joi.any())
    .max(1000)
    .required()
    .messages({
      "array.max": "Too many operations in delta",
      "any.required": "Operations array is required",
    }),
  retain: Joi.number().optional().messages({
    "number.base": "Retain must be a number",
  }),
  delete: Joi.number().optional().messages({
    "number.base": "Delete must be a number",
  }),
  insert: Joi.alternatives()
    .try(Joi.string(), Joi.object())
    .optional()
    .messages({
      "alternatives.types": "Insert must be a string or object",
    }),
});

export const cursorUpdateSchema = Joi.object({
  documentId: Joi.string().uuid().required().messages({
    "string.uuid": "Invalid document ID format",
    "any.required": "Document ID is required",
  }),
  userId: Joi.string().uuid().required().messages({
    "string.uuid": "Invalid user ID format",
    "any.required": "User ID is required",
  }),
  cursor: Joi.object({
    x: Joi.number().min(0).required().messages({
      "number.base": "Cursor x must be a number",
      "number.min": "Cursor x must be at least 0",
      "any.required": "Cursor x is required",
    }),
    y: Joi.number().min(0).required().messages({
      "number.base": "Cursor y must be a number",
      "number.min": "Cursor y must be at least 0",
      "any.required": "Cursor y is required",
    }),
    selection: Joi.object({
      start: Joi.number().min(0).required().messages({
        "number.base": "Selection start must be a number",
        "number.min": "Selection start must be at least 0",
        "any.required": "Selection start is required",
      }),
      end: Joi.number().min(0).required().messages({
        "number.base": "Selection end must be a number",
        "number.min": "Selection end must be at least 0",
        "any.required": "Selection end is required",
      }),
    })
      .optional()
      .messages({
        "object.base": "Selection must be an object",
      }),
  }).required().messages({
    "any.required": "Cursor is required",
  }),
});

export const contentChangeSchema = Joi.object({
  documentId: Joi.string().uuid().required().messages({
    "string.uuid": "Invalid document ID format",
    "any.required": "Document ID is required",
  }),
  userId: Joi.string().uuid().required().messages({
    "string.uuid": "Invalid user ID format",
    "any.required": "User ID is required",
  }),
  type: Joi.string()
    .valid("insert", "delete", "format")
    .required()
    .messages({
      "any.only": "Type must be one of insert, delete, format",
      "any.required": "Type is required",
    }),
  position: Joi.number().min(0).required().messages({
    "number.base": "Position must be a number",
    "number.min": "Position must be at least 0",
    "any.required": "Position is required",
  }),
  content: Joi.string().allow("").optional().messages({
    "string.base": "Content must be a string",
  }),
  length: Joi.number().min(0).optional().messages({
    "number.base": "Length must be a number",
    "number.min": "Length must be at least 0",
  }),
  timestamp: Joi.string().allow("").optional().messages({
    "string.base": "Timestamp must be a string",
  }),
});

export const userStatusSchema = Joi.object({
  documentId: Joi.string().uuid().required().messages({
    "string.uuid": "Invalid document ID format",
    "any.required": "Document ID is required",
  }),
  userId: Joi.string().uuid().required().messages({
    "string.uuid": "Invalid user ID format",
    "any.required": "User ID is required",
  }),
  status: Joi.string()
    .valid("active", "idle", "typing", "away")
    .required()
    .messages({
      "any.only": "Status must be one of active, idle, typing, away",
      "any.required": "Status is required",
    }),
  timestamp: Joi.string().allow("").optional().messages({
    "string.base": "Timestamp must be a string",
  }),
});

// Configuration
const CONFIG = {
  defaultTitle: "Untitled Document",
  maxDocumentSize: 10 * 1024 * 1024, // 10MB
  saveDebounceMs: 2000,
  sessionTimeoutMs: 30 * 60 * 1000, // 30 minutes
  maxConcurrentConnections: 10000,
  rateLimits: {
    getDocument: { maxRequests: 10, windowMs: 60000 }, // 10 requests per minute
    saveDocument: { maxRequests: 30, windowMs: 60000 }, // 30 saves per minute
    sendChanges: { maxRequests: 100, windowMs: 60000 }, // 100 changes per minute
    cursorUpdate: { maxRequests: 200, windowMs: 60000 }, // 200 cursor updates per minute
    contentChange: { maxRequests: 150, windowMs: 60000 }, // 150 content changes per minute
    userStatus: { maxRequests: 50, windowMs: 60000 }, // 50 status updates per minute
    joinDocument: { maxRequests: 20, windowMs: 60000 }, // 20 joins per minute
  },
  cleanup: {
    sessionCleanupIntervalMs: 5 * 60 * 1000, // 5 minutes
    metricsIntervalMs: 30 * 1000, // 30 seconds
    healthCheckIntervalMs: 30 * 1000, // 30 seconds
  },
};

export class SocketController {
  private io: Server;
  private activeSessions: Map<string, DocumentSession>;
  private saveTimers: Map<string, NodeJS.Timeout>;
  private metrics: SocketMetrics;
  private healthData: Map<string, any>;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;

  constructor(io: Server) {
    this.io = io;
    this.activeSessions = new Map();
    this.saveTimers = new Map();
    this.healthData = new Map();
    this.metrics = {
      connectionsCount: 0,
      documentsCount: 0,
      messagesPerSecond: 0,
      totalRequests: 0,
    };

    this.setupMetricsCollection();
    this.setupCleanupTasks();
  }

  private setupMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.metrics.connectionsCount = this.io.engine.clientsCount;
      this.metrics.documentsCount = new Set(Array.from(this.activeSessions.values()).map((s) => s.documentId)).size;

      logger.info("Socket metrics", this.metrics);
    }, CONFIG.cleanup.metricsIntervalMs);
  }

  private setupCleanupTasks(): void {
    // Clean up inactive sessions
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveSessions();
    }, CONFIG.cleanup.sessionCleanupIntervalMs);

    // Update health data
    setInterval(() => {
      this.healthData.set("last_update", {
        timestamp: new Date().toISOString(),
        connections: this.metrics.connectionsCount,
        documents: this.metrics.documentsCount,
        sessions: this.activeSessions.size,
      });
    }, CONFIG.cleanup.healthCheckIntervalMs);
  }

  private async cleanupInactiveSessions(): Promise<void> {
    const now = new Date();
    const expiredSessions: string[] = [];

    this.activeSessions.forEach((session, socketId) => {
      if (now.getTime() - session.lastActivity.getTime() > CONFIG.sessionTimeoutMs) {
        expiredSessions.push(socketId);
      }
    });

    expiredSessions.forEach((socketId) => {
      const session = this.activeSessions.get(socketId);
      if (session) {
        this.activeSessions.delete(socketId);
        this.clearSaveTimer(session.documentId);
      }
    });

    if (expiredSessions.length > 0) {
      logger.info(`Cleaned up ${expiredSessions.length} inactive sessions`);
    }
  }

  private checkInMemoryRateLimit(session: DocumentSession, action: string): boolean {
    const rule = CONFIG.rateLimits[action as keyof typeof CONFIG.rateLimits];
    if (!rule) return true;

    const now = Date.now();
    const limit = session.requestCounts.get(action);

    if (!limit || now > limit.resetTime) {
      // Reset or initialize limit
      session.requestCounts.set(action, {
        count: 1,
        resetTime: now + rule.windowMs,
      });
      return true;
    }

    if (limit.count >= rule.maxRequests) {
      logger.warn(`Rate limit exceeded for ${action}`, {
        userId: session.userId,
        documentId: session.documentId,
      });
      return false;
    }

    limit.count++;
    return true;
  }

  private async authenticateSocket(socket: AuthenticatedSocket): Promise<boolean> {
    try {
      // Accept token from either handshake.auth or Authorization header (Bearer token)
      let token = socket.handshake.auth.token;
      if (!token && socket.handshake.headers.authorization) {
        const authHeader = socket.handshake.headers.authorization as string;
        if (authHeader.startsWith("Bearer ")) {
          token = authHeader.slice(7);
        } else {
          token = authHeader;
        }
      }

      if (!token) {
        logger.warn("Socket connection without authentication token", { socketId: socket.id });
        return false;
      }

      // Validate JWT and extract payload
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload & { userId?: string };
      if (!decoded || !decoded.userId) {
        logger.warn("JWT decoded but missing userId", { socketId: socket.id });
        return false;
      }

      socket.userId = decoded.userId;


      return true;
    } catch (error) {
      logger.error("Socket authentication failed", { error, socketId: socket.id });
      return false;
    }
  }

  private async checkDocumentPermission(documentId: string, userId: string, requiredPermission: "read" | "write" = "read"): Promise<string | null> {
    try {
      // Check if user is document owner
      const document = await prisma.document.findFirst({
        where: { id: documentId, ownerId: userId },
      });

      if (document) {
        return "owner";
      }

      // Check document access permissions
      const access = await prisma.documentAccess.findFirst({
        where: {
          documentId,
          userId,
          isActive: true,
        },
      });

      if (!access) {
        return null;
      }

      // Check if user has required permission
      const hasPermission =
        requiredPermission === "read"
          ? ["VIEW", "COMMENT", "EDIT"].includes(access.permission)
          : ["EDIT"].includes(access.permission);

      return hasPermission ? access.permission : null;
    } catch (error) {
      logger.error("Error checking document permission", { error, documentId, userId });
      return null;
    }
  }

  private clearSaveTimer(documentId: string): void {
    const timer = this.saveTimers.get(documentId);
    if (timer) {
      clearTimeout(timer);
      this.saveTimers.delete(documentId);
    }
  }

  private delayedSave(documentId: string, data: string, title: string): void {
    this.clearSaveTimer(documentId);

    const timer = setTimeout(async () => {
      try {
        await prisma.document.update({
          where: { id: documentId },
          data: {
            content: data,
            title,
            updatedAt: new Date(),
          },
        });

        logger.debug("Document auto-saved", { documentId });
      } catch (error) {
        logger.error("Error auto-saving document", { error, documentId });
      } finally {
        this.saveTimers.delete(documentId);
      }
    }, CONFIG.saveDebounceMs);

    this.saveTimers.set(documentId, timer);
  }

  private createErrorResponse(code: string, message: string, details?: any) {
    return {
      error: true,
      code,
      message,
      timestamp: new Date().toISOString(),
      ...(details && { details }),
    };
  }

  public setupSocketHandlers(): void {
    this.io.on("connection", async (socket: AuthenticatedSocket) => {
      const startTime = performance.now();

      try {
        // Authenticate socket
        const isAuthenticated = await this.authenticateSocket(socket);
        if (!isAuthenticated) {
          socket.emit("error", this.createErrorResponse("UNAUTHORIZED", "Authentication required"));
          socket.disconnect();
          return;
        }

        logger.info("Socket connected", {
          socketId: socket.id,
          userId: socket.userId,
          ip: socket.handshake.address,
        });

        // Connection limit check
        if (this.io.engine.clientsCount > CONFIG.maxConcurrentConnections) {
          socket.emit("error", this.createErrorResponse("SERVER_OVERLOAD", "Server at capacity"));
          socket.disconnect();
          return;
        }

        this.setupDocumentHandlers(socket);
        this.setupCollaborationHandlers(socket);
        this.setupUtilityHandlers(socket);
        this.setupDisconnectionHandler(socket);

        const connectTime = performance.now() - startTime;
        logger.debug("Socket setup completed", {
          socketId: socket.id,
          connectTime: `${connectTime.toFixed(2)}ms`,
        });
      } catch (error) {
        logger.error("Error setting up socket connection", { error, socketId: socket.id });
        socket.emit("error", this.createErrorResponse("SETUP_ERROR", "Failed to establish connection"));
        socket.disconnect();
      }
    });
  }

  private setupDocumentHandlers(socket: AuthenticatedSocket): void {
    socket.on("get-document", async (payload, callback) => {
      const requestId = `${socket.id}-${Date.now()}`;
      const startTime = performance.now();

      try {
        this.metrics.totalRequests++;

        const { error, value } = getDocumentSchema.validate(payload, { abortEarly: false });
        if (error) {
          const errorResponse = this.createErrorResponse(
            "VALIDATION_ERROR",
            "Invalid request data",
            error.details.map((d) => ({
              message: d.message,
              path: d.path.join("."),
              type: d.type,
            }))
          );
          socket.emit("error", errorResponse);
          return;
        }

        const { documentId, userId } = value;
        const effectiveUserId = userId || socket.userId;

        if (!effectiveUserId) {
          socket.emit("error", this.createErrorResponse("USER_REQUIRED", "User ID required"));
          return;
        }

        // Create or update session
        let session = this.activeSessions.get(socket.id);
        if (!session) {
          session = {
            documentId,
            userId: effectiveUserId,
            joinedAt: new Date(),
            lastActivity: new Date(),
            requestCounts: new Map(),
            status: "active",
          };
          this.activeSessions.set(socket.id, session);
        }

        // Check rate limit
        if (!this.checkInMemoryRateLimit(session, "getDocument")) {
          socket.emit("error", this.createErrorResponse("RATE_LIMIT", "Too many requests"));
          return;
        }

        logger.info("Processing get-document request", {
          requestId,
          documentId,
          userId: effectiveUserId,
        });

        // Check permissions
        const permission = await this.checkDocumentPermission(documentId, effectiveUserId, "read");
        if (!permission) {
          socket.emit("error", this.createErrorResponse("FORBIDDEN", "Access denied"));
          return;
        }

        // Get or create document
        let document = await prisma.document.findUnique({
          where: { id: documentId },
          include: {
            owner: {
              select: { id: true, email: true },
            },
          },
        });

        if (!document) {
          // Only allow document creation if user has write permission or is owner
          const canCreate = permission === "owner" || ["EDIT"].includes(permission);
          if (!canCreate) {
            socket.emit("error", this.createErrorResponse("NOT_FOUND", "Document not found"));
            return;
          }

          document = await prisma.document.create({
            data: {
              id: documentId,
              content: "",
              title: CONFIG.defaultTitle,
              ownerId: effectiveUserId,
            },
            include: {
              owner: {
                select: { id: true, email: true },
              },
            },
          });
        }

        // Join document room
        socket.join(documentId);

        // Update session
        session.documentId = documentId;
        session.lastActivity = new Date();

        // Send document data
        const responseData = {
          success: true,
          data: document?.content,
          title: document?.title,
          permission,
          owner: document?.owner,
          metadata: {
            createdAt: document?.createdAt,
            updatedAt: document?.updatedAt,
          },
          sessionInfo: {
            connectedUsers: await this.getConnectedUsers(documentId),
          },
        };

        socket.emit("load-document", responseData);

        // Notify other users in the document
        socket.to(documentId).emit("user-joined", {
          userId: effectiveUserId,
          socketId: socket.id,
          user: socket.user,
        });

        const processTime = performance.now() - startTime;
        logger.info("Document loaded successfully", {
          requestId,
          documentId,
          userId: effectiveUserId,
          processTime: `${processTime.toFixed(2)}ms`,
        });

        // Acknowledge with callback if provided
        if (callback && typeof callback === "function") {
          callback({ success: true, documentId, timestamp: new Date().toISOString() });
        }
      } catch (error) {
        logger.error("Error handling get-document", {
          error,
          requestId,
          socketId: socket.id,
        });
        socket.emit("error", this.createErrorResponse("SERVER_ERROR", "An error occurred while processing the document"));
      }
    });

    socket.on("send-changes", async (delta) => {
      try {
        const session = this.activeSessions.get(socket.id);
        if (!session) {
          socket.emit("error", this.createErrorResponse("SESSION_EXPIRED", "Session expired"));
          return;
        }

        // Check rate limit
        if (!this.checkInMemoryRateLimit(session, "sendChanges")) {
          return; // Silently drop excessive changes
        }

        // Validate delta
        const { error, value } = deltaSchema.validate(delta, { abortEarly: false });
        if (error) {
          logger.warn("Invalid delta received", {
            socketId: socket.id,
            error: error.details,
          });
          return;
        }

        // Check write permission
        const permission = await this.checkDocumentPermission(session.documentId, session.userId, "write");

        if (!permission) {
          socket.emit("error", this.createErrorResponse("FORBIDDEN", "Write access denied"));
          return;
        }

        // Update last activity
        session.lastActivity = new Date();

        // Broadcast changes to other users in the document
        const changeData = {
          delta: value,
          userId: session.userId,
          user: socket.user,
          timestamp: new Date().toISOString(),
        };

        socket.to(session.documentId).emit("receive-changes", changeData);

        logger.debug("Changes broadcasted", {
          documentId: session.documentId,
          userId: session.userId,
          deltaSize: JSON.stringify(delta).length,
        });
      } catch (error) {
        logger.error("Error handling send-changes", { error, socketId: socket.id });
      }
    });

    socket.on("save-document", async (payload, callback) => {
      try {
        const session = this.activeSessions.get(socket.id);
        if (!session) {
          const error = this.createErrorResponse("SESSION_EXPIRED", "Session expired");
          socket.emit("error", error);
          if (callback) callback(error);
          return;
        }

        // Check rate limit
        if (!this.checkInMemoryRateLimit(session, "saveDocument")) {
          const error = this.createErrorResponse("RATE_LIMIT", "Too many save requests");
          socket.emit("error", error);
          if (callback) callback(error);
          return;
        }

        // Validate payload
        const { error, value } = saveDocumentSchema.validate(payload, { abortEarly: false });
        if (error) {
          const errorResponse = this.createErrorResponse("VALIDATION_ERROR", "Invalid save data", error.details);
          socket.emit("error", errorResponse);
          if (callback) callback(errorResponse);
          return;
        }

        const { data, title } = value;

        // Check write permission
        const permission = await this.checkDocumentPermission(session.documentId, session.userId, "write");

        if (!permission) {
          const error = this.createErrorResponse("FORBIDDEN", "Write access denied");
          socket.emit("error", error);
          if (callback) callback(error);
          return;
        }

        // Update document
        const updatedDocument = await prisma.document.update({
          where: { id: session.documentId },
          data: {
            content: data,
            title,
            updatedAt: new Date(),
          },
        });

        // Clear any pending auto-save
        this.clearSaveTimer(session.documentId);

        // Update session activity
        session.lastActivity = new Date();

        logger.info("Document saved", {
          documentId: session.documentId,
          userId: session.userId,
          size: Buffer.byteLength(data, "utf8"),
        });

        const response = {
          success: true,
          timestamp: updatedDocument.updatedAt.toISOString(),
        };

        // Acknowledge save
        if (callback && typeof callback === "function") {
          callback(response);
        }

        // Notify other users
        socket.to(session.documentId).emit("document-saved", {
          userId: session.userId,
          user: socket.user,
          timestamp: updatedDocument.updatedAt.toISOString(),
          title,
        });
      } catch (error) {
        logger.error("Error saving document", { error, socketId: socket.id });
        const errorResponse = this.createErrorResponse("SAVE_ERROR", "Failed to save document");
        socket.emit("error", errorResponse);
        if (callback) callback(errorResponse);
      }
    });

    // Auto-save on changes (delayed)
    socket.on("document-changed", async (payload) => {
      try {
        const session = this.activeSessions.get(socket.id);
        if (!session) return;

        const { error, value } = saveDocumentSchema.validate(payload, { abortEarly: false });
        if (error) return;

        const { data, title } = value;
        this.delayedSave(session.documentId, data, title);
        session.lastActivity = new Date();
      } catch (error) {
        logger.error("Error handling document-changed", { error, socketId: socket.id });
      }
    });
  }

  private setupCollaborationHandlers(socket: AuthenticatedSocket): void {

    socket.on("join-document", async (documentId, callback) => {
      try {
        const session = this.activeSessions.get(socket.id);

        // Validate document ID format
        if (!documentId || typeof documentId !== "string") {
          const error = this.createErrorResponse("VALIDATION_ERROR", "Invalid document ID");
          socket.emit("error", error);
          if (callback) callback(error);
          return;
        }

        if (!socket.userId) {
          const error = this.createErrorResponse("UNAUTHORIZED", "User not authenticated");
          socket.emit("error", error);
          if (callback) callback(error);
          return;
        }

        // Rate limiting
        if (session && !this.checkInMemoryRateLimit(session, "joinDocument")) {
          const error = this.createErrorResponse("RATE_LIMIT", "Too many join requests");
          socket.emit("error", error);
          if (callback) callback(error);
          return;
        }

        // Check document permissions
        const permission = await this.checkDocumentPermission(documentId, socket.userId, "read");
        if (!permission) {
          const error = this.createErrorResponse("FORBIDDEN", "Access denied to document");
          socket.emit("error", error);
          if (callback) callback(error);
          return;
        }

        // Join the room
        socket.join(documentId);

        // Update or create session
        if (session) {
          session.documentId = documentId;
          session.lastActivity = new Date();
        }

        logger.info(`User ${socket.userId} joined document ${documentId}`, {
          socketId: socket.id,
          userId: socket.userId,
          documentId,
        });

        // Notify other users
        socket.to(documentId).emit("user-joined", {
          userId: socket.userId,
          user: socket.user,
          socketId: socket.id,
          timestamp: new Date().toISOString(),
        });

        // Success response
        const response = {
          success: true,
          documentId,
          permission,
          connectedUsers: await this.getConnectedUsers(documentId),
          timestamp: new Date().toISOString(),
        };

        if (callback && typeof callback === "function") {
          callback(response);
        }
      } catch (error) {
        logger.error("Error handling join-document", { error, socketId: socket.id, documentId });
        const errorResponse = this.createErrorResponse("JOIN_ERROR", "Failed to join document");
        socket.emit("error", errorResponse);
        if (callback) callback(errorResponse);
      }
    });

    // Cursor position updates
    socket.on("cursor-update", async (data) => {
      try {
        const session = this.activeSessions.get(socket.id);
        if (!session) {
          socket.emit("error", this.createErrorResponse("SESSION_EXPIRED", "Session expired"));
          return;
        }

        // Rate limiting
        if (!this.checkInMemoryRateLimit(session, "cursorUpdate")) {
          return; // Silently drop excessive cursor updates
        }

        // Validate cursor data
        const { error, value } = cursorUpdateSchema.validate(data, { abortEarly: false });
        if (error) {
          logger.warn("Invalid cursor update received", {
            socketId: socket.id,
            error: error.details,
          });
          return;
        }

        const { documentId, userId, cursor } = value;

        // Verify user matches session and has access to document
        if (userId !== session.userId || documentId !== session.documentId) {
          socket.emit("error", this.createErrorResponse("FORBIDDEN", "Invalid cursor update"));
          return;
        }

        // Update session cursor info
        session.cursor = cursor;
        session.lastActivity = new Date();

        // Broadcast cursor position to other users in the document
        socket.to(documentId).emit("cursor-update", {
          userId,
          user: socket.user,
          cursor,
          timestamp: new Date().toISOString(),
        });

        logger.debug("Cursor update broadcasted", {
          documentId,
          userId,
          cursorPosition: `${cursor.x},${cursor.y}`,
        });
      } catch (error) {
        logger.error("Error handling cursor-update", { error, socketId: socket.id });
      }
    });

    // Content changes (for real-time collaboration)
    socket.on("content-change", async (data) => {
      try {
        const session = this.activeSessions.get(socket.id);
        if (!session) {
          socket.emit("error", this.createErrorResponse("SESSION_EXPIRED", "Session expired"));
          return;
        }

        // Rate limiting
        if (!this.checkInMemoryRateLimit(session, "contentChange")) {
          return; // Silently drop excessive content changes
        }

        // Validate content change data
        const { error, value } = contentChangeSchema.validate(data, { abortEarly: false });
        if (error) {
          logger.warn("Invalid content change received", {
            socketId: socket.id,
            error: error.details,
          });
          return;
        }

        const { documentId, userId, type, position, content, length } = value;

        // Verify user matches session and has write access
        if (userId !== session.userId || documentId !== session.documentId) {
          socket.emit("error", this.createErrorResponse("FORBIDDEN", "Invalid content change"));
          return;
        }

        // Check write permission
        const permission = await this.checkDocumentPermission(documentId, userId, "write");
        if (!permission) {
          socket.emit("error", this.createErrorResponse("FORBIDDEN", "Write access denied"));
          return;
        }

        // Update session activity and status
        session.lastActivity = new Date();
        session.status = "typing";

        // Broadcast content change to other users
        const changeData = {
          userId,
          user: socket.user,
          documentId,
          type,
          position,
          content,
          length,
          timestamp: new Date().toISOString(),
        };

        socket.to(documentId).emit("content-change", changeData);

        logger.debug("Content change broadcasted", {
          documentId,
          userId,
          changeType: type,
          position,
          contentLength: content?.length || 0,
        });
      } catch (error) {
        logger.error("Error handling content-change", { error, socketId: socket.id });
      }
    });

    // User status updates (typing, idle, etc.)
    socket.on("user-status", async (data) => {
      try {
        const session = this.activeSessions.get(socket.id);
        if (!session) {
          socket.emit("error", this.createErrorResponse("SESSION_EXPIRED", "Session expired"));
          return;
        }

        // Rate limiting
        if (!this.checkInMemoryRateLimit(session, "userStatus")) {
          return; // Silently drop excessive status updates
        }

        // Validate status data
        const { error, value } = userStatusSchema.validate(data, { abortEarly: false });
        if (error) {
          logger.warn("Invalid user status received", {
            socketId: socket.id,
            error: error.details,
          });
          return;
        }

        const { documentId, userId, status } = value;

        // Verify user matches session
        if (userId !== session.userId || documentId !== session.documentId) {
          socket.emit("error", this.createErrorResponse("FORBIDDEN", "Invalid status update"));
          return;
        }

        // Update session status and activity
        session.status = status;
        session.lastActivity = new Date();

        // Broadcast status update to other users
        const statusData = {
          userId,
          user: socket.user,
          documentId,
          status,
          timestamp: new Date().toISOString(),
        };

        socket.to(documentId).emit("user-status", statusData);

        logger.debug("User status broadcasted", {
          documentId,
          userId,
          status,
        });
      } catch (error) {
        logger.error("Error handling user-status", { error, socketId: socket.id });
      }
    });
  }

  public getMetrics(): SocketMetrics {
    return { ...this.metrics };
  }

  public async getHealthStatus(): Promise<object> {
    const connectedDocuments = new Set(Array.from(this.activeSessions.values()).map((s) => s.documentId)).size;

    return {
      status: "healthy",
      connections: this.metrics.connectionsCount,
      documents: connectedDocuments,
      activeSessions: this.activeSessions.size,
      pendingSaves: this.saveTimers.size,
      totalRequests: this.metrics.totalRequests,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }

  private setupUtilityHandlers(socket: AuthenticatedSocket): void {
    // Health check endpoint
    socket.on("health-check", (callback) => {
      try {
        const healthData = {
          status: "healthy",
          timestamp: new Date().toISOString(),
          metrics: {
            connections: this.metrics.connectionsCount,
            documents: this.metrics.documentsCount,
            sessions: this.activeSessions.size,
            totalRequests: this.metrics.totalRequests,
          },
          socketInfo: {
            id: socket.id,
            userId: socket.userId,
            connected: socket.connected,
            rooms: Array.from(socket.rooms),
          },
          server: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            nodeVersion: process.version,
          },
        };

        logger.debug("Health check requested", {
          socketId: socket.id,
          userId: socket.userId,
        });

        if (callback && typeof callback === "function") {
          callback({ success: true, data: healthData });
        } else {
          socket.emit("health-response", healthData);
        }
      } catch (error) {
        logger.error("Error handling health check", { error, socketId: socket.id });
        const errorResponse = this.createErrorResponse("HEALTH_CHECK_ERROR", "Health check failed");

        if (callback && typeof callback === "function") {
          callback(errorResponse);
        } else {
          socket.emit("error", errorResponse);
        }
      }
    });

    // Get connected users for a document
    socket.on("get-connected-users", async (documentId, callback) => {
      try {
        if (!documentId || typeof documentId !== "string") {
          const error = this.createErrorResponse("VALIDATION_ERROR", "Invalid document ID");
          socket.emit("error", error);
          if (callback) callback(error);
          return;
        }

        if (!socket.userId) {
          const error = this.createErrorResponse("UNAUTHORIZED", "User not authenticated");
          socket.emit("error", error);
          if (callback) callback(error);
          return;
        }

        // Check if user has access to document
        const permission = await this.checkDocumentPermission(documentId, socket.userId, "read");
        if (!permission) {
          const error = this.createErrorResponse("FORBIDDEN", "Access denied to document");
          socket.emit("error", error);
          if (callback) callback(error);
          return;
        }

        const connectedUsers = await this.getConnectedUsers(documentId);

        const response = {
          success: true,
          documentId,
          users: connectedUsers,
          count: connectedUsers.length,
          timestamp: new Date().toISOString(),
        };

        logger.debug("Connected users retrieved", {
          documentId,
          userId: socket.userId,
          userCount: connectedUsers.length,
        });

        if (callback && typeof callback === "function") {
          callback(response);
        } else {
          socket.emit("connected-users", response);
        }
      } catch (error) {
        logger.error("Error getting connected users", { error, socketId: socket.id, documentId });
        const errorResponse = this.createErrorResponse("GET_USERS_ERROR", "Failed to get connected users");

        if (callback && typeof callback === "function") {
          callback(errorResponse);
        } else {
          socket.emit("error", errorResponse);
        }
      }
    });

    // Ping/pong for connection testing
    socket.on("ping", (data, callback) => {
      try {
        const session = this.activeSessions.get(socket.id);
        if (session) {
          session.lastActivity = new Date();
        }

        const pongData = {
          timestamp: new Date().toISOString(),
          socketId: socket.id,
          userId: socket.userId,
          serverTime: Date.now(),
          ...(data && typeof data === "object" && { clientData: data }),
        };

        logger.debug("Ping received", {
          socketId: socket.id,
          userId: socket.userId,
        });

        if (callback && typeof callback === "function") {
          callback({ success: true, pong: pongData });
        } else {
          socket.emit("pong", pongData);
        }
      } catch (error) {
        logger.error("Error handling ping", { error, socketId: socket.id });
      }
    });

    // Leave document room
    socket.on("leave-document", async (documentId, callback) => {
      try {
        if (!documentId || typeof documentId !== "string") {
          const error = this.createErrorResponse("VALIDATION_ERROR", "Invalid document ID");
          socket.emit("error", error);
          if (callback) callback(error);
          return;
        }

        const session = this.activeSessions.get(socket.id);

        // Leave the room
        socket.leave(documentId);

        // Notify other users
        if (socket.userId) {
          socket.to(documentId).emit("user-left", {
            userId: socket.userId,
            user: socket.user,
            socketId: socket.id,
            timestamp: new Date().toISOString(),
          });
        }

        // Update session if it exists
        if (session && session.documentId === documentId) {
          session.lastActivity = new Date();
          // Don't clear documentId completely as user might rejoin
        }

        logger.info("User left document", {
          socketId: socket.id,
          userId: socket.userId,
          documentId,
        });

        const response = {
          success: true,
          documentId,
          leftAt: new Date().toISOString(),
        };

        if (callback && typeof callback === "function") {
          callback(response);
        }
      } catch (error) {
        logger.error("Error handling leave-document", { error, socketId: socket.id, documentId });
        const errorResponse = this.createErrorResponse("LEAVE_ERROR", "Failed to leave document");

        if (callback && typeof callback === "function") {
          callback(errorResponse);
        } else {
          socket.emit("error", errorResponse);
        }
      }
    });

    // Get server metrics (admin only)
    socket.on("get-metrics", async (callback) => {
      try {
        if (!socket.user || !["ADMIN", "SUPER_ADMIN"].includes(socket.user.role)) {
          const error = this.createErrorResponse("FORBIDDEN", "Admin access required");
          socket.emit("error", error);
          if (callback) callback(error);
          return;
        }

        const metrics = {
          ...this.metrics,
          sessions: {
            active: this.activeSessions.size,
            details: Array.from(this.activeSessions.entries()).map(([socketId, session]) => ({
              socketId,
              documentId: session.documentId,
              userId: session.userId,
              joinedAt: session.joinedAt,
              lastActivity: session.lastActivity,
              status: session.status,
              hasTimers: this.saveTimers.has(session.documentId),
            })),
          },
          server: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            nodeVersion: process.version,
          },
          health: Object.fromEntries(this.healthData),
        };

        logger.info("Metrics requested by admin", {
          adminId: socket.userId,
          socketId: socket.id,
        });

        const response = {
          success: true,
          metrics,
          timestamp: new Date().toISOString(),
        };

        if (callback && typeof callback === "function") {
          callback(response);
        } else {
          socket.emit("metrics-response", response);
        }
      } catch (error) {
        logger.error("Error getting metrics", { error, socketId: socket.id });
        const errorResponse = this.createErrorResponse("METRICS_ERROR", "Failed to get metrics");

        if (callback && typeof callback === "function") {
          callback(errorResponse);
        } else {
          socket.emit("error", errorResponse);
        }
      }
    });
  }

  private setupDisconnectionHandler(socket: AuthenticatedSocket): void {
    socket.on("disconnect", async (reason) => {
      const disconnectTime = new Date();

      try {
        logger.info("Socket disconnecting", {
          socketId: socket.id,
          userId: socket.userId,
          reason,
          timestamp: disconnectTime.toISOString(),
        });

        const session = this.activeSessions.get(socket.id);

        if (session) {
          // Notify users in the document about disconnection
          if (session.documentId && socket.userId) {
            socket.to(session.documentId).emit("user-disconnected", {
              userId: socket.userId,
              user: socket.user,
              socketId: socket.id,
              reason,
              timestamp: disconnectTime.toISOString(),
              sessionDuration: disconnectTime.getTime() - session.joinedAt.getTime(),
            });

            logger.info("User disconnected from document", {
              socketId: socket.id,
              userId: socket.userId,
              documentId: session.documentId,
              sessionDuration: `${Math.round((disconnectTime.getTime() - session.joinedAt.getTime()) / 1000)}s`,
            });
          }

          // Clean up any pending save timers for this session's document
          if (session.documentId) {
            // Only clear timer if this was the last user editing the document
            const otherUsersInDoc = Array.from(this.activeSessions.values()).filter(
              (s) => s.documentId === session.documentId && s.userId !== session.userId
            );

            if (otherUsersInDoc.length === 0) {
              this.clearSaveTimer(session.documentId);
              logger.debug("Cleared save timer for document with no active users", {
                documentId: session.documentId,
              });
            }
          }

          // Remove session
          this.activeSessions.delete(socket.id);
        }

        // Update metrics
        this.metrics.connectionsCount = Math.max(0, this.metrics.connectionsCount - 1);

        // Log disconnection metrics
        logger.debug("Socket cleanup completed", {
          socketId: socket.id,
          remainingSessions: this.activeSessions.size,
          activeConnections: this.metrics.connectionsCount,
        });
      } catch (error) {
        logger.error("Error during socket disconnection cleanup", {
          error,
          socketId: socket.id,
          userId: socket.userId,
          reason,
        });
      }
    });

    // Handle connection errors
    socket.on("error", (error) => {
      logger.error("Socket error occurred", {
        error,
        socketId: socket.id,
        userId: socket.userId,
        timestamp: new Date().toISOString(),
      });

      const session = this.activeSessions.get(socket.id);
      if (session && session.documentId) {
        // Notify other users about the error
        socket.to(session.documentId).emit("user-error", {
          userId: socket.userId,
          user: socket.user,
          socketId: socket.id,
          error: "Connection error occurred",
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Handle manual disconnect requests
    socket.on("disconnect-request", (reason, callback) => {
      try {
        logger.info("Manual disconnect requested", {
          socketId: socket.id,
          userId: socket.userId,
          reason,
        });

        const response = {
          success: true,
          message: "Disconnect acknowledged",
          timestamp: new Date().toISOString(),
        };

        if (callback && typeof callback === "function") {
          callback(response);
        }

        // Disconnect after a brief delay to allow callback to complete
        setTimeout(() => {
          socket.disconnect(true);
        }, 100);
      } catch (error) {
        logger.error("Error handling disconnect request", {
          error,
          socketId: socket.id,
        });

        if (callback && typeof callback === "function") {
          callback(this.createErrorResponse("DISCONNECT_ERROR", "Failed to process disconnect request"));
        }
      }
    });
  }

  private async getConnectedUsers(documentId: string): Promise<
    Array<{
      userId: string;
      user: any;
      socketId: string;
      joinedAt: Date;
      lastActivity: Date;
      status?: string;
      cursor?: any;
    }>
  > {
    try {
      const connectedUsers: Array<{
        userId: string;
        user: any;
        socketId: string;
        joinedAt: Date;
        lastActivity: Date;
        status?: string;
        cursor?: any;
      }> = [];

      // Get all sockets in the document room
      const socketsInRoom = await this.io.in(documentId).fetchSockets();

      for (const socket of socketsInRoom) {
        const authenticatedSocket = socket as unknown as AuthenticatedSocket;
        const session = this.activeSessions.get(socket.id);

        if (session && session.documentId === documentId && authenticatedSocket.userId) {
          // Get fresh user data from database to ensure accuracy
          let userData = authenticatedSocket.user;

          if (!userData) {
            try {
              const dbUser = await prisma.user.findUnique({
                where: { id: authenticatedSocket.userId },
                select: { id: true, email: true, role: true },
              });
              userData = dbUser
                ? {
                  id: dbUser.id,
                  email: dbUser.email ?? "unknown@example.com",
                  role: dbUser.role.toString(),
                }
                : undefined;
            } catch (error) {
              logger.warn("Failed to fetch user data for connected users list", {
                userId: authenticatedSocket.userId,
                error,
              });
            }
          }

          connectedUsers.push({
            userId: authenticatedSocket.userId,
            user: userData || {
              id: authenticatedSocket.userId,
              email: "unknown@example.com",
              role: "user",
            },
            socketId: socket.id,
            joinedAt: session.joinedAt,
            lastActivity: session.lastActivity,
            status: session.status || "active",
            cursor: session.cursor,
          });
        }
      }

      // Sort by join time (earliest first)
      connectedUsers.sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());

      logger.debug("Retrieved connected users for document", {
        documentId,
        userCount: connectedUsers.length,
        userIds: connectedUsers.map((u) => u.userId),
      });

      return connectedUsers;
    } catch (error) {
      logger.error("Error getting connected users", { error, documentId });
      return [];
    }
  }

  // Additional cleanup method to be called when shutting down the server
  public async cleanup(): Promise<void> {
    try {
      logger.info("Starting socket controller cleanup");

      // Clear all intervals
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }

      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
        this.metricsInterval = null;
      }

      // Clear all save timers
      for (const [documentId, timer] of this.saveTimers.entries()) {
        clearTimeout(timer);
        logger.debug("Cleared save timer during cleanup", { documentId });
      }
      this.saveTimers.clear();

      // Notify all connected users about server shutdown
      this.io.emit("server-shutdown", {
        message: "Server is shutting down",
        timestamp: new Date().toISOString(),
        gracefulShutdown: true,
      });

      // Clear sessions
      this.activeSessions.clear();

      // Close all socket connections
      this.io.close();

      logger.info("Socket controller cleanup completed");
    } catch (error) {
      logger.error("Error during socket controller cleanup", { error });
    }
  }
}
