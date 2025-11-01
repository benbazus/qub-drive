import { FileType } from "@prisma/client";




// File-related types
export interface FileItem {
    id: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    fileType?: FileType;
    filePath?: string;
    parentId?: string | null;
    isFolder?: boolean;
    createdBy?: string;
    modifiedBy?: string;
    ownerId?: string;
    userId?: string;
    itemCount?: number;
    starred?: boolean;
    locked?: boolean;
    shared?: boolean;
    shareCount?: number;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}

export interface FileQuery {
    page: number;
    limit: number;
    parentId?: string;
    isDeleted?: boolean;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    nextPage?: number;
    prevPage?: number;
}

export interface FileItemResponse {
    // items: {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: string;
    modified: string;
    type: string;
    starred: boolean;
    shared: boolean;
    locked: boolean;
    deleted: boolean;
    parentId?: string | null;
    mimeType?: string | null;
    isFolder: boolean;
    createdAt: Date;
    updatedAt: Date;
    //}
}


export interface FileListResponse {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: string;
    modified: string;
    type: string;
    starred: boolean;
    shared: boolean;
    deleted: boolean;
    locked: boolean;
    parentId?: string | null;
    mimeType?: string | null;
    isFolder: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface GetFoldersParams {
    userId: string;
    parentId?: string;
    search?: string;
    page: number;
    limit: number;
}

export interface DashboardStats {
    totalFiles: { count: number; growth: number };
    storageUsed: { bytes: number; growth: number };
    sharedFiles: { count: number; growth: number };
    teamMembers: { count: number; growth: number };
}
export interface CopyLinkResponse {
    shareUrl: string;
    shareId: string;
    expiresAt?: string;
}
;

export interface ShareFileSchema {
    shareType: string;
    permission: string;
    expiresAt?: string;
    allowDownload: boolean;
    requireApproval: boolean;
    notifyByEmail: boolean;
    watermark: boolean;
    password?: string;
    message?: string;
    users?: Array<{ id: string; permission: string }>;
}

export interface ShareNotificationEmailData {
    fileName: string;
    sharedBy: string;
    message?: string;
    shareUrl: string;
    fileSize?: string;
    fileType?: string;
    expiresAt?: Date;
    recipientName: string;
    requireApproval: boolean;
}