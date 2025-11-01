import { types } from "util";

// Core types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  VIEWER = 'viewer',
  GUEST = 'guest'
}

// File types
export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  size: number;
  mimeType: string;
  path: string;
  parentId?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  isShared: boolean;
  permissions: FilePermissions;
}

export enum FileType {
  FILE = 'file',
  FOLDER = 'folder',
  DOCUMENT = 'document',
  SPREADSHEET = 'spreadsheet',
  FORM = 'form'
}

export interface FilePermissions {
  read: boolean;
  write: boolean;
  delete: boolean;
  share: boolean;
}

// Sharing types
export interface ShareLink {
  id: string;
  fileId: string;
  token: string;
  permissions: SharePermissions;
  expiresAt?: Date;
  password?: string;
  createdBy: string;
  createdAt: Date;
}

export interface SharePermissions {
  canView: boolean;
  canEdit: boolean;
  canComment: boolean;
  canDownload: boolean;
}

// Collaboration types
export interface CollaborationSession {
  id: string;
  fileId: string;
  participants: Participant[];
  createdAt: Date;
  lastActivity: Date;
}

export interface Participant {
  userId: string;
  user: User;
  cursor?: CursorPosition;
  selection?: Selection;
  isActive: boolean;
  joinedAt: Date;
}

export interface CursorPosition {
  x: number;
  y: number;
  cellId?: string;
}

export interface Selection {
  start: Position;
  end: Position;
}

export interface Position {
  row: number;
  column: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// WebSocket types
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
  userId?: string;
}

export enum WebSocketEventType {
  USER_JOIN = 'user_join',
  USER_LEAVE = 'user_leave',
  CURSOR_MOVE = 'cursor_move',
  CELL_EDIT = 'cell_edit',
  DOCUMENT_CHANGE = 'document_change',
  FORM_UPDATE = 'form_update'
}// Menu an
d Navigation types
export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  description?: string;
  badge?: string;
  children?: MenuItem[];
  roles: UserRole[];
  permissions?: string[];
  isExternal?: boolean;
  isNew?: boolean;
  category?: MenuCategory;
}

export enum MenuCategory {
  DASHBOARD = 'dashboard',
  FILES = 'files',
  COLLABORATION = 'collaboration',
  ADMINISTRATION = 'administration',
  SYSTEM = 'system',
  SETTINGS = 'settings',
  ANALYTICS = 'analytics',
  SECURITY = 'security'
}

export interface MenuSection {
  id: string;
  title: string;
  category: MenuCategory;
  items: MenuItem[];
  roles: UserRole[];
  order: number;
}

export interface UserPermissions {
  canViewDashboard: boolean;
  canManageFiles: boolean;
  canShareFiles: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canManageSystem: boolean;
  canAccessAdminPanel: boolean;
  canManageRoles: boolean;
  canViewAuditLogs: boolean;
  canManageIntegrations: boolean;
  canManageBackups: boolean;
  canManageSettings: boolean;
}