import prisma from "../config/database.config";
import * as bcrypt from "bcrypt";
import { StatusCodes } from 'http-status-codes';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
    FileQuery,
    PaginatedResponse,
    FileListResponse,
    FileItem,
    GetFoldersParams,
    DashboardStats,
    FileItemResponse
} from '../types/file.types';
import { logger } from "../config/logger";
import sharp from 'sharp';
import QRCode from 'qrcode';
import { FileType } from "@prisma/client";

// Create AppError class for proper error handling
class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Define custom File interface to avoid conflicts with browser File type
interface DatabaseFile {
    id: string;
    fileName: string;
    originalName: string | null;
    fileType: FileType;
    mimeType: string | null;
    fileSize: bigint | null;
    filePath: string;
    isFolder: boolean;
    parentId: string | null;
    userId: string;
    createdBy: string;
    modifiedBy: string;
    ownerId: string;
    itemCount: number | null;
    isStarred: boolean;
    isLocked: boolean;
    isShared: boolean;
    shareCount: number | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    isDeleted: boolean;
    isActive: boolean;
}


class FileService {
    constructor() { }

    public async getThumbnail(fileId: string, userId: string): Promise<string> {

        console.log(" 000000 THUMB NAIL 00000000000 ")
        const file = await prisma.file.findFirst({
            where: {
                id: fileId,
                userId,
                isDeleted: false,
                isLocked: false,
            },
        });

        if (!file || file.isFolder) {
            throw new Error('File not found or is a folder');
        }
        console.log(" 11111111 THUMB NAIL 1111111111 ")
        const mimeType = file.mimeType || 'application/octet-stream';

        // Check if file type supports thumbnail generation
        const supportsThumbnail = mimeType.startsWith('image/') ||
            mimeType.startsWith('video/') ||
            mimeType === 'application/pdf';

        if (!supportsThumbnail) {
            throw new Error('File type does not support thumbnail generation');
        }

        const systemSettings = await prisma.systemSettings.findFirst({
            where: { id: 1 },
        });
        const THUMBNAIL_DIR = systemSettings?.defaultStoragePath
            ? path.join(systemSettings.defaultStoragePath, 'thumbnails')
            : './Uploads/thumbnails';
        await fs.mkdir(THUMBNAIL_DIR, { recursive: true });

        const thumbnailPath = path.join(THUMBNAIL_DIR, `${fileId}-thumbnail.jpg`);

        try {
            const exists = await fs.access(thumbnailPath).then(() => true).catch(() => false);
            if (!exists) {
                await this.generateThumbnail(file.filePath, thumbnailPath, mimeType);
            }

            return thumbnailPath;
        } catch (error) {
            logger.error(`Failed to get thumbnail for file ${fileId}:`, error);
            throw new Error('Failed to get thumbnail');
        }
    }

    private async generateThumbnail(filePath: string, thumbnailPath: string, mimeType: string): Promise<void> {
        if (mimeType.startsWith('image/')) {
            // Handle images with Sharp
            await sharp(filePath)
                .resize({ width: 150, height: 150, fit: 'cover' })
                .toFormat('jpg', { quality: 80 })
                .toFile(thumbnailPath);
        } else if (mimeType.startsWith('video/')) {
            // For videos, we'll create a placeholder thumbnail for now
            // In production, you would use ffmpeg to extract a frame
            await this.createPlaceholderThumbnail(thumbnailPath, 'video');
        } else if (mimeType === 'application/pdf') {
            // For PDFs, we'll create a placeholder thumbnail for now
            // In production, you would use pdf-thumbnail or similar
            await this.createPlaceholderThumbnail(thumbnailPath, 'pdf');
        } else {
            throw new Error(`Unsupported file type: ${mimeType}`);
        }
    }

    private async createPlaceholderThumbnail(thumbnailPath: string, fileType: string): Promise<void> {
        // Create a simple placeholder thumbnail with Sharp
        const color = fileType === 'video' ? '#e74c3c' : '#3498db'; // Red for video, blue for PDF
        const text = fileType === 'video' ? 'VIDEO' : 'PDF';

        // Create a simple colored square with text as placeholder
        const svg = `
            <svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
                <rect width="150" height="150" fill="${color}"/>
                <text x="75" y="80" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">${text}</text>
            </svg>
        `;

        await sharp(Buffer.from(svg))
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);
    }

    public async revokeShareLink(fileId: string, linkId: string, userId: string): Promise<void> {
        const file = await prisma.file.findFirst({
            where: {
                id: fileId,
                OR: [{ userId }, { ownerId: userId }],
                isDeleted: false,
            },
        });

        if (!file) {
            logger.error(`File ${fileId} not found or access denied for user ${userId}`);
            throw new Error('File not found or access denied');
        }

        const link = await prisma.fileLink.findFirst({
            where: { id: linkId, fileId, createdBy: userId, isActive: true },
        });

        if (!link) {
            logger.error(`Share link ${linkId} not found for file ${fileId}`);
            throw new Error('Share link not found');
        }

        await prisma.$transaction(async (tx) => {
            await tx.fileLink.update({
                where: { id: linkId },
                data: { isActive: false },
            });

            const remainingLinks = await tx.fileLink.count({
                where: { fileId, isActive: true },
            });

            await tx.file.update({
                where: { id: fileId },
                data: {
                    shareCount: remainingLinks,
                    isShared: remainingLinks > 0,
                },
            });
        });

        logger.info(`Revoked share link ${linkId} for file ${fileId} by user ${userId}`);
    }

    public async generateQRCode(text: string): Promise<string> {
        try {
            const qrCodeBuffer = await QRCode.toBuffer(text, {
                errorCorrectionLevel: 'H',
                type: 'png',
                margin: 1,
            });
            logger.info(`Generated QR code for text: ${text}`);
            return qrCodeBuffer.toString('base64');
        } catch (error) {
            logger.error('Failed to generate QR code', error);
            throw new Error('Failed to generate QR code');
        }
    }

    public async deleteFile(userId: string, fileId: string): Promise<boolean> {

        const file = await prisma.file.findFirst({
            where: {
                id: fileId,
                userId,
                isDeleted: false,
            },
        });

        if (!file) {
            logger.error(`File ${fileId} not found or access denied for user ${userId}`);
            return false;
        }

        if (file.isLocked) {
            logger.error(`File ${fileId} is locked for user ${userId}`);
            return false;
        }

        await prisma.$transaction(async (tx) => {
            if (file.isFolder) {
                const descendants = await tx.file.findMany({
                    where: { filePath: { startsWith: `${file.filePath}/` }, isDeleted: false },
                });

                for (const descendant of descendants) {
                    await tx.file.update({
                        where: { id: descendant.id },
                        data: { isDeleted: true, updatedAt: new Date() },
                    });

                }
            }

            await tx.file.update({
                where: { id: fileId },
                data: { isDeleted: true, updatedAt: new Date() },
            });


        });

        logger.info(`File ${fileId} deleted by user ${userId}`);
        return true;
    }

    public async deleteFilePermanently(userId: string, fileId: string): Promise<boolean> {
        const file = await prisma.file.findFirst({
            where: {
                id: fileId,
                userId,
                isDeleted: false,
            },
        });

        if (!file) {
            logger.warn(`File ${fileId} not found for permanent deletion`);
            return false;
        }

        const result = await prisma.$transaction(async (tx) => {
            const updateResult = await tx.file.updateMany({
                where: {
                    id: fileId,
                    userId,
                    isDeleted: false,
                },
                data: {
                    isDeleted: true,
                    deletedAt: new Date(),
                    updatedAt: new Date(),
                },
            });

            if (updateResult.count === 0) return false;

            if (file.isFolder) {
                await tx.file.updateMany({
                    where: {
                        parentId: fileId,
                        userId,
                        isDeleted: false,
                    },
                    data: {
                        isDeleted: true,
                        deletedAt: new Date(),
                        updatedAt: new Date(),
                    },
                });
            }

            return true;
        });

        console.log("222222 SUCCESS 222222")
        console.log(result)
        console.log("222222 SUCCESS 222222")

        if (result) {
            try {
                await fs.rm(file.filePath, { recursive: true, force: true });
            } catch (error: any) {
                logger.error(`Failed to delete physical file ${file.filePath}:`, error);
            }
        }

        return result;
    }

    public async toggleStar(userId: string, fileId: string): Promise<void> {

        await prisma.$transaction(async (tx) => {

            const file = await tx.file.findFirst({
                where: {
                    id: fileId,
                    userId, // Ensure the file belongs to the user
                    isDeleted: false, // Ensure the file is not deleted
                    isLocked: false, // Business rule: cannot star/un-star a locked file
                },
            });

            // 2. If the file doesn't meet the criteria, abort the transaction.
            if (!file) {
                // Throw an error to be caught by the outer try/catch block.
                // This is cleaner than returning null from inside the transaction.
                throw new Error(`Cannot star file ${fileId}: File not found, locked, deleted, or permission denied.`);
            }

            // 3. Determine the new state by inverting the current state.
            //    This is the core "toggle" logic.
            const newStarredState = !file.isStarred;

            // 4. Perform the update and return the result in one step.
            //    The `update` operation returns the updated record, so we don't need a final `getFileById`.
            return tx.file.update({
                where: {
                    id: fileId,
                },
                data: {
                    isStarred: newStarredState,
                    updatedAt: new Date(),
                },
            });
        });


    }


    public async renameFile(fileId: string, newName: string, userId: string): Promise<void> {
        const file = await prisma.file.findUnique({
            where: { id: fileId },
        });

        if (!file) {
            logger.error(`File ${fileId} not found for user ${userId}`);
            throw new Error('File not found');
        }

        if (file.userId !== userId) {
            logger.error(`User ${userId} lacks permission to rename file ${fileId}`);
            throw new Error('Permission denied');
        }

        if (file.isLocked) {
            logger.error(`File ${fileId} is locked for user ${userId}`);
            throw new Error('File is locked');
        }

        const existingFile = await prisma.file.findFirst({
            where: {
                fileName: newName,
                parentId: file.parentId,
                userId,
                isDeleted: false,
                id: { not: fileId },
            },
        });

        if (existingFile) {
            logger.error(`File with name ${newName} already exists in location for user ${userId}`);
            throw new Error('A file with this name already exists in this location');
        }

        const oldPath = file.filePath;
        const newPath = path.join(path.dirname(oldPath), newName);

        await prisma.$transaction(async (tx) => {
            if (file.isFolder) {
                const descendants = await tx.file.findMany({
                    where: { filePath: { startsWith: `${oldPath}/` } },
                });

                const updatePromises = descendants.map(descendant =>
                    tx.file.update({
                        where: { id: descendant.id },
                        data: { filePath: descendant.filePath.replace(oldPath, newPath) },
                    })
                );
                await Promise.all(updatePromises);
            }

            try {
                await fs.rename(oldPath, newPath);
            } catch (error) {
                logger.error(`Failed to rename file ${fileId} on disk`, error);
                throw new Error('Failed to rename on disk');
            }

            await tx.file.update({
                where: { id: fileId },
                data: {
                    fileName: newName,
                    filePath: newPath,
                    modifiedBy: userId,
                    updatedAt: new Date(),
                },
            });
        });

        logger.info(`File ${fileId} renamed to ${newName} by user ${userId}`);

    }


    public async accessSharedFile(token: string, password?: string, ipAddress?: string, userAgent?: string): Promise<any> {
        const shareLink = await prisma.fileLink.findUnique({
            where: { token, isActive: true },
            include: {
                file: {
                    select: {
                        id: true,
                        fileName: true,
                        originalName: true,
                        fileSize: true,
                        mimeType: true,
                        filePath: true,
                        isFolder: true,
                        isDeleted: true,
                        isLocked: true,
                        createdBy: true,
                        modifiedBy: true,
                        ownerId: true,
                        userId: true,
                        itemCount: true,
                        isStarred: true,
                        isShared: true,
                        shareCount: true,
                        createdAt: true,
                        updatedAt: true,
                        deletedAt: true,
                    },
                },
            },
        });

        if (!shareLink || !shareLink.isActive || shareLink.file.isDeleted || shareLink.file.isLocked) {
            logger.error(`Share link for token ${token} not found, inactive, or file deleted/locked`);
            throw new Error('Share link not found, inactive, or file deleted/locked');
        }

        if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
            logger.error(`Share link for token ${token} has expired`);
            throw new Error('Share link has expired');
        }

        if (shareLink.maxDownloads && shareLink.downloadCount >= shareLink.maxDownloads) {
            logger.error(`Download limit reached for share link ${token}`);
            throw new Error('Download limit reached');
        }

        if (shareLink.requirePassword) {
            if (!password) {
                logger.warn(`Password required for share link ${token}`);
                throw new Error('Password required');
            }
            if (!shareLink.passwordHash || !(await bcrypt.compare(password, shareLink.passwordHash))) {
                await this.logAccess(shareLink.id, shareLink.fileId, ipAddress, userAgent, 'VIEW', false, 'Invalid password');
                logger.warn(`Invalid password for share link ${token}`);
                throw new Error('Invalid password');
            }
        }

        await this.logAccess(shareLink.id, shareLink.fileId, ipAddress, userAgent, 'VIEW', true);

        await prisma.fileLink.update({
            where: { id: shareLink.id },
            data: {
                accessCount: { increment: 1 },
                lastAccessedAt: new Date(),
            },
        });

        logger.info(`Shared file accessed for token ${token}`);

        return {
            id: shareLink.id,
            token: shareLink.token,
            expiresAt: shareLink.expiresAt,
            shareType: shareLink.shareType,
            allowDownload: shareLink.allowDownload,
            maxDownloads: shareLink.maxDownloads,
            requirePassword: shareLink.requirePassword,
            accessCount: shareLink.accessCount + 1,
            downloadCount: shareLink.downloadCount,
            isActive: shareLink.isActive,
            lastAccessedAt: new Date(),
            createdAt: shareLink.createdAt,
            file: this.mapToFileItem(shareLink.file as any),
            recentAccess: [],
        };
    }
    private mapToFileItem(file: DatabaseFile): FileItem {
        return {
            id: file?.id,
            fileName: file?.fileName,
            fileSize: file.isFolder ? 0 : Number(file.fileSize || 0),
            mimeType: file.isFolder ? 'folder' : file.mimeType || 'application/octet-stream',
            fileType: file.isFolder ? FileType.FOLDER : FileType.FILE,
            filePath: file.filePath,
            parentId: file.parentId,
            isFolder: file.isFolder,
            createdBy: file.createdBy,
            modifiedBy: file.modifiedBy,
            ownerId: file.ownerId,
            userId: file.userId,
            itemCount: Number(file.itemCount || 0),
            starred: file.isStarred,
            locked: file.isLocked,
            shared: file.isShared,
            shareCount: Number(file.shareCount || 0),
            createdAt: file.createdAt,
            updatedAt: file.updatedAt,
            deletedAt: file.deletedAt!,
        };
    }
    public async moveFile(fileId: string, targetParentId: string | null, userId: string): Promise<void> {
        const file = await prisma.file.findFirst({
            where: { id: fileId, userId, isDeleted: false },
        });

        if (!file) {
            logger.error(`File ${fileId} not found for user ${userId}`);
            throw new Error('File not found or inaccessible');
        }

        let newPath: string;
        let parentFolder: DatabaseFile | null = null;

        if (targetParentId) {
            parentFolder = await prisma.file.findFirst({
                where: { id: targetParentId, userId, isFolder: true, isDeleted: false },
            }) as DatabaseFile | null;
            if (!parentFolder) {
                logger.error(`Target folder ${targetParentId} not found`);
                throw new Error('Target folder not found');
            }
            newPath = path.join(parentFolder.filePath, file.fileName);
        } else {
            const systemSettings = await prisma.systemSettings.findFirst({
                where: { id: 1 },
            });
            const UPLOAD_DIR = systemSettings?.defaultStoragePath || './Uploads';
            newPath = path.join(UPLOAD_DIR, userId, file.fileName);
        }

        // Check for naming conflicts
        const existingFile = await prisma.file.findFirst({
            where: {
                fileName: file.fileName,
                parentId: targetParentId,
                userId,
                isDeleted: false,
            },
        });

        if (existingFile) {
            logger.error(`File with name ${file.fileName} already exists in target location`);
            throw new Error('A file with this name already exists in the target location');
        }

        // Move physical file
        if (!file.isFolder) {
            await fs.rename(file.filePath, newPath);
        } else {
            await fs.mkdir(newPath, { recursive: true });
            const children = await prisma.file.findMany({
                where: { parentId: fileId, userId, isDeleted: false },
            });
            for (const child of children) {
                await this.moveFile(child.id, fileId, userId);
            }
        }

        await prisma.$transaction(async (tx) => {
            // Update file
            await tx.file.update({
                where: { id: fileId },
                data: {
                    parentId: targetParentId,
                    filePath: newPath,
                    updatedAt: new Date(),
                },
            });

            // Update item counts
            if (file.parentId) {
                await tx.file.update({
                    where: { id: file.parentId },
                    data: { itemCount: { decrement: 1 } },
                });
            }
            if (targetParentId && parentFolder) {
                await tx.file.update({
                    where: { id: targetParentId },
                    data: { itemCount: { increment: 1 } },
                });
            }
        });

        logger.info(`File ${fileId} moved to ${newPath} for user ${userId}`);
    }
    public async toggleLock(userId: string, fileId: string): Promise<void> {
        await prisma.$transaction(async (tx) => {
            const currentFile = await tx.file.findUnique({
                where: {
                    id: fileId,
                    userId: userId, // Security: Ensure the file belongs to the user.
                    isDeleted: false,
                },
            });

            if (!currentFile) {
                // Throwing an error inside a transaction will automatically roll it back.
                throw new Error(`File with ID ${fileId} not found for user ${userId}.`);
            }
            const newLockState = !currentFile.isLocked;

            await tx.file.update({
                where: {
                    id: fileId,
                },
                data: {
                    isLocked: newLockState,
                    updatedAt: new Date(),
                },
            });
        });
    }


    public async getUserDashboardStats(userId: string): Promise<DashboardStats> {
        try {
            const now = new Date();
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            const previousMonth = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

            const [currentStats, previousStats] = await Promise.all([
                Promise.allSettled([
                    this.getTotalFiles(userId, lastMonth),
                    this.getStorageUsed(userId, lastMonth),
                    this.getSharedFiles(userId, lastMonth),
                    this.getTeamMembers(userId, lastMonth)
                ]),
                Promise.allSettled([
                    this.getTotalFiles(userId, previousMonth, lastMonth),
                    this.getStorageUsed(userId, previousMonth, lastMonth),
                    this.getSharedFiles(userId, previousMonth, lastMonth),
                    this.getTeamMembers(userId, previousMonth, lastMonth)
                ])
            ]);

            const getValueOrZero = (result: PromiseSettledResult<any>, property: string = 'count'): number => {
                return result.status === 'fulfilled' ? (result.value[property] || 0) : 0;
            };

            const currentTotalFiles = getValueOrZero(currentStats[0]);
            const currentStorageUsed = getValueOrZero(currentStats[1], 'bytes');
            const currentSharedFiles = getValueOrZero(currentStats[2]);
            const currentTeamMembers = getValueOrZero(currentStats[3]);

            const previousTotalFiles = getValueOrZero(previousStats[0]);
            const previousStorageUsed = getValueOrZero(previousStats[1], 'bytes');
            const previousSharedFiles = getValueOrZero(previousStats[2]);
            const previousTeamMembers = getValueOrZero(previousStats[3]);

            return {
                totalFiles: {
                    count: currentTotalFiles,
                    growth: this.calculateGrowth(currentTotalFiles, previousTotalFiles)
                },
                storageUsed: {
                    bytes: currentStorageUsed,
                    growth: this.calculateGrowth(currentStorageUsed, previousStorageUsed)
                },
                sharedFiles: {
                    count: currentSharedFiles,
                    growth: this.calculateGrowth(currentSharedFiles, previousSharedFiles)
                },
                teamMembers: {
                    count: currentTeamMembers,
                    growth: this.calculateGrowth(currentTeamMembers, previousTeamMembers)
                }
            };
        } catch (error) {
            console.error('Error in getDashboardStats:', error);
            return {
                totalFiles: { count: 0, growth: 0 },
                storageUsed: { bytes: 0, growth: 0 },
                sharedFiles: { count: 0, growth: 0 },
                teamMembers: { count: 0, growth: 0 }
            };
        }
    }

    public async getFileList(userId: string, query: FileQuery): Promise<PaginatedResponse<FileListResponse>> {
        const { page, limit, parentId, isDeleted = false } = query;
        const skip = (page - 1) * limit;

        const where = {
            userId,
            // isDeleted,
            parentId: parentId || null,
        };

        const [items, total] = await Promise.all([
            prisma.file.findMany({
                where,
                skip,
                take: limit,
                orderBy: [
                    { isFolder: 'desc' },
                    { fileName: 'asc' },
                ],
            }),
            prisma.file.count({ where }),
        ]);

        const hasMore = skip + items.length < total;

        const formattedFiles = await Promise.all(
            items.map(file => this.formatFileList(file))
        );

        return {
            items: formattedFiles,
            total,
            page,
            limit,
            hasMore,
            nextPage: hasMore ? page + 1 : undefined,
            prevPage: page > 1 ? page - 1 : undefined,
        };
    }

    private calculateGrowth(current: number, previous: number): number {
        try {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        } catch (error) {
            console.error('Error in calculateGrowth:', error);
            return 0;
        }
    }

    private async formatFileItemList(file: any): Promise<FileItemResponse> {
        const size = file.isFolder
            ? `${(await this.getItemCount(file.id)).toString()} items`
            : this.getFileSize(file.fileSize);

        return {
            id: file.id,
            fileName: file.fileName,
            fileType: file.isFolder ? 'folder' : this.getFileTypeFromMime(file.mimeType),
            fileSize: size,
            modified: this.formatModifiedDate(file.updatedAt),
            starred: file.isStarred,
            type: file.type,
            shared: file.isShared,
            deleted: file.isDelete,
            locked: file.isLocked,
            parentId: file.parentId,
            mimeType: file.mimeType,
            isFolder: file.isFolder,
            createdAt: file.createdAt,
            updatedAt: file.updatedAt
        };
    }



    private async formatFileList(file: any): Promise<FileListResponse> {
        const size = file.isFolder
            ? `${(await this.getItemCount(file.id)).toString()} items`
            : this.getFileSize(file.fileSize);

        return {
            id: file.id,
            fileName: file.fileName,
            fileType: file.isFolder ? 'folder' : this.getFileTypeFromMime(file.mimeType),
            fileSize: size,
            modified: this.formatModifiedDate(file.updatedAt),
            starred: file.isStarred,
            type: file.type,
            shared: file.isShared,
            locked: file.isLocked,
            deleted: file.isDeleted,
            parentId: file.parentId,
            mimeType: file.mimeType,
            isFolder: file.isFolder,
            createdAt: file.createdAt,
            updatedAt: file.updatedAt
        };
    }

    private getFileSize(bytes: number | bigint | null): string {
        if (!bytes) return '0 Bytes';

        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        let size: bigint = typeof bytes === 'bigint' ? bytes : BigInt(Math.round(bytes));
        let unitIndex = 0;

        // Use BigInt for calculations to avoid precision issues with large numbers
        while (size >= 1024n && unitIndex < sizes.length - 1) {
            size = size / 1024n;
            unitIndex++;
        }

        // Convert to number for display to avoid BigInt serialization issues
        const displaySize = Number(size);
        if (isNaN(displaySize)) {
            console.error('Invalid size calculation:', bytes);
            return '0 Bytes';
        }

        return `${displaySize.toFixed(2)} ${sizes[unitIndex]}`;
    }

    private getFileTypeFromMime(mimeType: string | null): string {
        if (!mimeType) return 'file';

        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType === 'application/pdf') return 'pdf';
        if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
        if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
        if (mimeType.includes('zip') || mimeType.includes('archive')) return 'archive';
        if (mimeType.startsWith('text/')) return 'text';

        return 'document';
    }

    private async getTotalFiles(userId: string, fromDate: Date, toDate?: Date) {
        try {
            const whereClause = {
                userId,
                isDeleted: false,
                isActive: true,
                createdAt: {
                    gte: fromDate,
                    ...(toDate && { lt: toDate })
                }
            };

            const count = await prisma.file.count({
                where: whereClause
            });

            return { count: count || 0 };
        } catch (error) {
            console.error('HttpError in getTotalFiles:', error);
            return { count: 0 };
        }
    }

    private async getStorageUsed(userId: string, fromDate: Date, toDate?: Date) {
        try {
            const whereClause = {
                userId,
                isDeleted: false,
                isActive: true,
                createdAt: {
                    gte: fromDate,
                    ...(toDate && { lt: toDate })
                }
            };

            const result = await prisma.file.aggregate({
                where: whereClause,
                _sum: {
                    fileSize: true
                }
            });

            return { bytes: Number(result._sum.fileSize) || 0 };
        } catch (error) {
            console.error('Error in getStorageUsed:', error);
            return { bytes: 0 };
        }
    }

    private async getSharedFiles(userId: string, fromDate: Date, toDate?: Date) {
        try {
            const whereClause = {
                userId,
                isDeleted: false,
                isActive: true,
                isShared: true,
                createdAt: {
                    gte: fromDate,
                    ...(toDate && { lt: toDate })
                }
            };

            const count = await prisma.file.count({
                where: whereClause
            });

            return { count: count || 0 };
        } catch (error) {
            console.error('Error in getSharedFiles:', error);
            return { count: 0 };
        }
    }

    private async getTeamMembers(userId: string, fromDate: Date, toDate?: Date) {
        try {
            const whereClause = {
                file: {
                    userId
                },
                addedAt: {
                    gte: fromDate,
                    ...(toDate && { lt: toDate })
                }
            };

            const uniqueCollaborators = await prisma.collaborator.findMany({
                where: whereClause,
                select: {
                    userId: true
                },
                distinct: ['userId']
            });

            return { count: uniqueCollaborators?.length || 0 };
        } catch (error) {
            console.error('Error in getTeamMembers:', error);
            return { count: 0 };
        }
    }


    private async getItemCount(folderId: string): Promise<number> {
        return await prisma.file.count({
            where: {
                parentId: folderId,
                isDeleted: false,
                isActive: true
            }
        });
    }

    private formatModifiedDate(date: Date): string {
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInHours / 24);
        const diffInWeeks = Math.floor(diffInDays / 7);
        const diffInMonths = Math.floor(diffInDays / 30);

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
        if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString();
    }


    public getMimeType(fileName: string): string {
        const extension = fileName.split('.').pop()?.toLowerCase();
        const mimeTypes: Record<string, string> = {
            // Images
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml',
            'bmp': 'image/bmp',
            'ico': 'image/x-icon',

            // Documents
            'txt': 'text/plain',
            'md': 'text/markdown',
            'pdf': 'application/pdf',
            'rtf': 'application/rtf',

            // Code files
            'js': 'application/javascript',
            'ts': 'application/typescript',
            'jsx': 'text/jsx',
            'tsx': 'text/tsx',
            'html': 'text/html',
            'css': 'text/css',
            'json': 'application/json',
            'xml': 'application/xml',
            'yaml': 'text/yaml',
            'yml': 'text/yaml',

            // Office documents
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        };

        return mimeTypes[extension || ''] || 'application/octet-stream';
    }

    public isPreviewable(fileName: string): boolean {
        const extension = fileName.split('.').pop()?.toLowerCase();
        const previewableExtensions = [
            // Images
            'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico',
            // Documents
            'txt', 'md', 'pdf', 'rtf',
            // Code files
            'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'xml', 'yaml', 'yml',
            'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs', 'swift',
        ];

        return previewableExtensions.includes(extension || '');
    }

    public async getFileById(fileId: string, userId?: string): Promise<FileItem | null> {
        try {
            const file = await prisma.file.findFirst({
                where: {
                    id: fileId,
                    isDeleted: false,
                },
            });

            if (!file) {
                return null;
            }

            // Check access permissions if userId is provided
            if (userId && !(await this.checkUserAccess(fileId, userId))) {
                return null;
            }

            // Map Prisma File to FileItem
            return this.formatFileItem(file);
        } catch (error) {
            logger.error(`Error getting file by ID ${fileId}:`, error);
            throw new AppError('Failed to retrieve file', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    public async checkUserAccess(fileId: string, userId: string): Promise<boolean> {
        try {
            const file = await prisma.file.findFirst({
                where: { id: fileId },
                select: {
                    userId: true,
                    ownerId: true,
                },
            });

            if (!file) {
                return false;
            }

            // Check if user is the owner or assigned user
            if (file.userId === userId || file.ownerId === userId) {
                return true;
            }

            // For now, just return false if user doesn't own the file
            // TODO: Implement proper permission checking
            return false;
        } catch (error) {
            logger.error(`Error checking access for file ${fileId} and user ${userId}:`, error);
            return false;
        }
    }

    private formatFileItem(file: any): FileItem {
        return {
            id: file.id,
            fileName: file.fileName,
            filePath: file.filePath,
            fileSize: Number(file.fileSize || 0),
            mimeType: file.mimeType || undefined,
            fileType: file.fileType,
            parentId: file.parentId,
            isFolder: file.isFolder,
            createdBy: file.createdBy,
            modifiedBy: file.modifiedBy,
            ownerId: file.ownerId,
            userId: file.userId,
            itemCount: file.itemCount || 0,
            starred: file.isStarred,
            locked: file.isLocked,
            shared: file.isShared,
            shareCount: file.shareCount || 0,
            createdAt: file.createdAt,
            updatedAt: file.updatedAt,
            deletedAt: file.deletedAt
        };
    }

    public async getFolders(userId: string, parentId: string): Promise<FileListResponse[]> {

        const where: any = {
            userId,
            isDeleted: false,
            isFolder: true,
            parentId: parentId || null,
        };

        const [items, total] = await Promise.all([
            prisma.file.findMany({
                where, orderBy: { fileName: 'asc' },
            }),
            prisma.file.count({ where }),
        ]);

        const formattedFolders = await Promise.all(
            items.map(folder => this.formatFileItemList(folder))
        );

        return formattedFolders;
    }

    // Missing methods that are referenced in the controller
    public async getFoldersWithParams(params: GetFoldersParams): Promise<PaginatedResponse<FileListResponse>> {
        const { userId, parentId, search, page, limit } = params;
        const skip = (page - 1) * limit;

        const where: any = {
            userId,
            isDeleted: false,
            isFolder: true,
            parentId: parentId || null,
        };

        if (search) {
            where.fileName = {
                contains: search,
                mode: 'insensitive'
            };
        }

        const [items, total] = await Promise.all([
            prisma.file.findMany({
                where,
                skip,
                take: 50,//limit,
                orderBy: { fileName: 'asc' },
            }),
            prisma.file.count({ where }),
        ]);

        const hasMore = skip + items.length < total;

        const formattedFolders = await Promise.all(
            items.map(folder => this.formatFileList(folder))
        );

        return {
            items: formattedFolders,
            total,
            page,
            limit,
            hasMore,
            nextPage: hasMore ? page + 1 : undefined,
            prevPage: page > 1 ? page - 1 : undefined,
        };
    }

    public async copyFile(userId: string, fileId: string, newName: string): Promise<FileItem> {
        const originalFile = await prisma.file.findFirst({
            where: {
                id: fileId,
                userId,
                isDeleted: false,
            },
        });

        if (!originalFile) {
            throw new AppError('File not found', 404);
        }

        if (originalFile.isLocked) {
            throw new AppError('Cannot copy locked file', 400);
        }

        // Create the copy
        const copiedFile = await prisma.file.create({
            data: {
                fileName: newName,
                originalName: newName,
                fileType: originalFile.fileType,
                mimeType: originalFile.mimeType,
                fileSize: originalFile.fileSize,
                filePath: originalFile.filePath + '_copy',
                isFolder: originalFile.isFolder,
                parentId: originalFile.parentId,
                userId,
                createdBy: userId,
                modifiedBy: userId,
                ownerId: userId,
                itemCount: 0,
            },
        });

        return this.formatFileItem(copiedFile);
    }
    private async logAccess(shareId: string, fileId: string, ipAddress?: string, userAgent?: string, _activityType: string = 'VIEW', _success: boolean = true, _errorMessage?: string): Promise<void> {
        try {
            await prisma.shareAccessLog.create({
                data: {
                    sharedFileId: shareId,
                    fileId,
                    accessedAt: new Date(),
                    ipAddress,
                    userAgent,
                    action: "VIEW",
                },
            });
        } catch (error) {
            logger.error(`Failed to log access for shareId ${shareId}:`, error);
        }
    }

}

const fileService = new FileService();
export default fileService;