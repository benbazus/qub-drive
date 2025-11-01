import type { FileItem, PathCrumb } from '@/types/file';

export type { FileItem, PathCrumb };

export type Permission = 'VIEW' | 'COMMENT' | 'EDIT' | 'ADMIN';

export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  name?: string;
}

export interface UserShare {
  id: string;
  name?: string;
  email: string;
  permission: Permission;
}

export interface ShareFileRequest {
  shareType: 'FILE' | 'LINK' | 'DOCUMENT';
  users: UserShare[];
  notifyByEmail: boolean;
  requireApproval: boolean;
  allowDownload: boolean;
  watermark: boolean;
  message?: string;
  expiresAt?: string;
  password?: string;
}

export interface ShareState {
  shareType: 'specific' | 'anyone';
  users: UserShare[];
  permission: Permission;
  notifyByEmail: boolean;
  requireApproval: boolean;
  allowDownload: boolean;
  watermark: boolean;
  message: string;
  expiryDays: number;
  password: string;
}

export interface ShareFileResponse {
  success: boolean;
  shareId: string;
  shareUrl: string;
  message: string;
}