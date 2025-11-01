
import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";
import { Request, Response } from "express";
import { createReadStream } from "fs";
import archiver from "archiver";
import sharp from "sharp";
import { spawn } from "child_process";

import mime from "mime-types";
import prisma from "../config/database.config";
import { FileType } from "@prisma/client";
import { UserRole } from "../types/auth.types";
import { ApiResponse, AuthenticatedRequest } from "../middleware/auth.middleware";
import { EmailServiceFactory } from "../services/email/email-service.factory";
const pdfParse = require("pdf-parse");
import previewService from "../services/preview.service";

import { ShareAccessRequestEmailData, ShareApprovalEmailData } from "../services/email/types";
import {
    createFolderSchema,
    deleteFileSchema,
    copyFileSchema,
    getFilesQuerySchema,
    getFoldersQuerySchema,
    shareFileSchema,
    renameFileSchema,
    moveFileSchema,
    shareLinkSchema,
    accessSharedFileSchema
} from "../utils/validation.schemas";
import {
    FileItem,
    GetFoldersParams,
    DashboardStats,
    ShareNotificationEmailData,
    CopyLinkResponse
} from "../types/file.types";
import { ServerResponse } from "http";
import { logger } from "../config/logger";
import { v4 as uuidv4 } from "uuid";
import fileService from "../services/file.service";
import { formatFileSize } from "../utils/file.utils";


class FileController {
    constructor() { }

    public getDeleteInfo = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
        try {



            const fileId = req.params?.fileId
            const userId = req.user?.userId

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            console.log(" 11111111111111 ")

            const file = await prisma.file.findUnique({
                where: { id: fileId },
                include: {
                    permissions: {
                        where: { userId }
                    }
                }
            })

            if (!file) {
                this.handleError(res, new Error('File not found'), 'File not found', 401);
                return;
            }

            console.log(" 22222222222222222 ")

            // Get shared users count
            const sharedUsers = await prisma.sharedFile.count({
                where: { fileId }
            })

            // Get version history count
            const versionCount = await prisma.fileVersion.count({
                where: { fileId }
            })

            // Get children count for folders
            let childrenCount: number | undefined
            if (file.type === 'folder') {
                childrenCount = await prisma.file.count({
                    where: { parentId: fileId }
                })
            }

            // Calculate total size including children for folders
            let totalSize = Number(file.fileSize)
            if (file.type === 'folder') {
                const childrenSizes = await prisma.file.aggregate({
                    where: {
                        filePath: { startsWith: file.filePath + '/' }
                    },
                    _sum: { fileSize: true }
                })
                totalSize += Number(childrenSizes._sum.fileSize || 0)
            }

            const response = {
                hasSharedUsers: sharedUsers > 0,
                sharedUserCount: sharedUsers,
                hasVersionHistory: versionCount > 0,
                versionCount,
                sizeBytes: totalSize,
                childrenCount,
                storageUsed: formatFileSize(totalSize)
            }

            console.log(" ************************** ")
            console.log(response)
            console.log(" ************************** ")

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error: any) {
            console.error('Failed to get file details :', error);
            this.handleError(res, error, 'Failed to get file details ');
        }
    }

    public deleteFile = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
        try {
            const userId = req.user?.userId;
            const fileId = req?.params?.fileId;

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            // console.log(" ************************** ")
            // console.log(userId)
            // console.log(fileId)
            // console.log(req.body)
            // console.log(" ************************** ")

            const { error, value } = deleteFileSchema.validate(req.body);
            if (error) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }
            const { permanent } = value;

            if (!fileId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            const success = permanent
                ? await fileService.deleteFilePermanently(userId, fileId!)
                : await fileService.deleteFile(userId, fileId!);

            if (!success) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            const response: ApiResponse<null> = {
                success: true,
                data: null,

            };


            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error: any) {
            console.error('Error getting approval status:', error);
            this.handleError(res, error, 'Failed to create folder');
        }
    }

    public toggleStar = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }
            const fileId = req.params?.fileId;
            if (!fileId) {
                this.handleError(res, new Error('File ID required'), 'File ID is required', 400);
                return;
            }

            const file = await prisma.file.findUnique({
                where: {
                    id: fileId,
                    userId,
                },
            });

            if (!file) {
                logger.error(`File ${fileId} not found for user ${userId}`);
                this.handleError(res, new Error('Cannot star file. File not found, locked, deleted, or permission denied.'), 'Cannot star file. File not found, locked, deleted, or permission denied.', 400);
                return;
            }

            if (file.userId !== userId) {
                logger.error(`User ${userId} lacks permission to rename file ${fileId}`);

                this.handleError(res, new Error(`User lacks permission to rename file`), `User lacks permission to rename file`, 400);
                return;
            }

            if (file.isLocked) {
                logger.error(`File ${fileId} is locked for user ${userId}`);

                this.handleError(res, new Error('File is locked'), 'File is locked', 400);
                return;
            }


            await prisma.$transaction(async (tx) => {
                const newStarredState = !file.isStarred;
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
            const response: ApiResponse<null> = {
                success: true,
                data: null,
            };

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));

        } catch (error: any) {
            console.error('Error getting approval status:', error);
            this.handleError(res, error, 'Failed to create folder');
        }
    }

    public toggleLock = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            const fileId = req.params?.fileId;
            if (!fileId) {
                this.handleError(res, new Error('File ID required'), 'File ID is required', 400);
                return;
            }

            await fileService.toggleLock(userId, fileId);

            const response: ApiResponse<null> = {
                success: true,
                data: null,

            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error: any) {
            console.error('Error getting approval status:', error);
            this.handleError(res, error, 'Failed to create folder');
        }
    }

    public renameFile = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }
            const { error, value } = renameFileSchema.validate(
                {
                    fileId: req?.params?.fileId,
                    newName: req.body.newName,
                },
                { abortEarly: false }
            );

            if (error) {
                throw new Error(error.details.map((d) => d.message).join(", "));
            }

            const { fileId, newName } = value;

            await fileService.renameFile(fileId, newName, userId);

            const response: ApiResponse<FileItem> = { success: true };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error: any) {
            logger.error("Error renaming file:", error);
            this.handleError(res, error, 'Failed to create folder');
        }
    }

    public getFolders = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
        try {
            const userId = req.user?.userId;
            const parentId = req.query?.parentId || null;

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            const items = await prisma.file.findMany({
                where: {
                    userId: userId,
                },

                select: {
                    id: true,
                    fileName: true,
                    userId: true,
                    fileType: true,
                    parentId: true,

                },

                orderBy: {
                    createdAt: 'desc',
                },
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(items, null, 2));

        } catch (error: any) {
            console.error('Error getting approval status:', error);
            this.handleError(res, error, 'Failed to create folder');
        }
    }

    public copyFile = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            const { error, value } = copyFileSchema.validate({
                fileId: req?.params?.fileId,
                newName: req.body.name,
            });
            if (error) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }
            const { fileId, newName } = value;

            console.log(" +++++++++++name++++++++++++++++ ");
            console.log(req.body);
            console.log(" ++++++++++++name+++++++++++++++ ");

            const copiedFile = await fileService.copyFile(userId, fileId, newName);

            const response: ApiResponse<FileItem> = {
                success: true,
                data: copiedFile,

            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error: any) {
            console.error('Error getting approval status:', error);
            this.handleError(res, error, 'Failed to create folder');
        }
    }

    public generateLinkShare = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) {
                this.handleError(res, new Error("User not authenticated"), "Authentication required", 401);
                return;
            }

            // Validate input using Joi
            const { error, value } = shareLinkSchema.validate(req.body, { abortEarly: false });
            if (error) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(
                    JSON.stringify({
                        success: false,
                        message: "Invalid parameters",
                        error: error.details.map((d) => ({ [d.path.join(".")]: d.message })),
                    })
                );
                return;
            }

            const { fileId, permission, expiresAt, downloadAllowed, password, maxDownloads, shareType } = value;

            // Check if file exists and user has permission
            const file = await prisma.file.findFirst({
                where: {
                    id: fileId,
                    userId,
                    isDeleted: false,
                },
            });

            if (!file) {
                this.handleError(res, new Error("File not found or unauthorized"), "File not found or unauthorized", 404);
                return;
            }

            // Generate unique token and URL
            const token = uuidv4();
            const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

            console.log(" ++++++++++++++++++++ ");
            console.log(token);
            console.log(hashedPassword);
            console.log(" ++++++++++++++++++++ ");

            // Get file path for sharing
            const filePath = file.filePath || `${file.fileName}`;

            console.log(" +++++++ FILE PATH +++++++ ");
            console.log("File Path:", filePath);
            console.log("File Name:", file.fileName);
            console.log(" +++++++ FILE PATH +++++++ ");

            // Create file link
            const fileLink = await prisma.fileLink.create({
                data: {
                    token,
                    fileId,
                    shareType: shareType,
                    createdBy: userId,
                    permission,
                    expiresAt: expiresAt ? new Date(expiresAt) : null,
                    allowDownload: downloadAllowed,
                    password: hashedPassword,
                    maxDownloads,
                    isActive: true,
                    //filePath: filePath,
                },
            });

            // Update file shared status
            await prisma.file.update({
                where: { id: fileId },
                data: {
                    isShared: true,
                    shareCount: { increment: 1 },
                },
            });

            //  const shareUrl = `${process.env.FRONTEND_URL}/share/${token}`;
            const shareUrl = `https://qubdrive.com/share/${token}`;
            const response: CopyLinkResponse = {
                shareId: token,
                shareUrl: shareUrl,
                expiresAt: fileLink.expiresAt?.toISOString(),
            };


            console.log(" ===================== ");
            console.log(shareUrl);
            console.log(response);
            console.log(" ===================== ");

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {
            console.error("Error creating share link:", error);
            this.handleError(res, error, "Failed to create share link");
        }
    }

    public generateLinkShareV1 = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
        try {
            const userId = (req as any).user?.userId;



            if (!userId) {
                this.handleError(res, new Error("User not authenticated"), "Authentication required", 401);
                return;
            }

            // Validate input using Joi
            const { error, value } = shareLinkSchema.validate(req.body, { abortEarly: false });
            if (error) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(
                    JSON.stringify({
                        success: false,
                        message: "Invalid parameters",
                        error: error.details.map((d) => ({ [d.path.join(".")]: d.message })),
                    })
                );
                return;
            }

            const { fileId, permission, expiresAt, downloadAllowed, password, maxDownloads, shareType } = value;



            // Check if file exists and user has permission
            const file = await prisma.file.findFirst({
                where: {
                    id: fileId,
                    userId,
                    isDeleted: false,
                },
            });

            if (!file) {
                this.handleError(res, new Error("File not found or unauthorized"), "File not found or unauthorized", 404);
                return;
            }

            // Generate unique token and URL
            const token = uuidv4();
            const hashedPassword = password ? await bcrypt.hash(password, 12) : null;



            // Get file path for sharing
            const filePath = file.filePath || `${file.fileName}`;



            // Create file link
            const fileLink = await prisma.fileLink.create({
                data: {
                    token,
                    fileId,
                    shareType: shareType,
                    createdBy: userId,
                    permission,
                    expiresAt: expiresAt ? new Date(expiresAt) : null,
                    allowDownload: downloadAllowed,
                    password: hashedPassword,
                    maxDownloads,
                    isActive: true,
                    //filePath: filePath,
                },
            });

            // Update file shared status
            await prisma.file.update({
                where: { id: fileId },
                data: {
                    isShared: true,
                    shareCount: { increment: 1 },
                },
            });

            const shareUrl = `${process.env.FRONTEND_URL}/share/${token}`;
            const response: CopyLinkResponse = {
                shareId: token,
                shareUrl: shareUrl,
                expiresAt: fileLink.expiresAt?.toISOString(),
            };



            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {
            console.error("Error creating share link:", error);
            this.handleError(res, error, "Failed to create share link");
        }
    }

    public createFolder = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
        try {



            if (!req.user) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            const userId = req.user.userId;

            const { error, value: data } = createFolderSchema.validate(req.body);
            if (error) {
                this.handleError(res, error, 'Invalid folder data', 400);
                return;
            }
            const sanitizedName = data.name.trim();


            // console.log(" 111111stats111111 ")
            // console.log(req.body)
            // console.log(" 111111stats111111 ")

            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                this.handleError(res, new Error('Insufficient permissions'), 'Insufficient permissions', 403);
                return;
            }


            let parentFolder = null;
            const parentId = data.parentId || null;

            if (parentId) {
                parentFolder = await prisma.file.findFirst({
                    where: {
                        id: parentId,
                        userId,
                        isFolder: true,
                        isDeleted: false,
                    },
                });
                if (!parentFolder) {
                    this.handleError(res, new Error('Insufficient permissions'), 'Insufficient permissions', 403);
                    return;
                }
            }

            const existing = await prisma.file.findFirst({
                where: { fileName: sanitizedName, parentId, userId, isDeleted: false },
            });
            if (existing) {
                this.handleError(res, new Error('Insufficient permissions'), 'Insufficient permissions', 403);
                return;
            }

            const systemSettings = await prisma.systemSettings.findFirst({
                where: { id: 1 },
            });
            const UPLOAD_DIR = systemSettings?.defaultStoragePath || "./Uploads";
            const userRootPath = path.join(UPLOAD_DIR, userId);

            await fs.mkdir(userRootPath, { recursive: true });

            const physicalPath = parentFolder
                ? path.join(parentFolder.filePath, sanitizedName)
                : path.join(userRootPath, sanitizedName);

            await fs.mkdir(physicalPath, { recursive: true });

            const createdFolder = await prisma.$transaction(async (tx) => {
                const folder = await tx.file.create({
                    data: {
                        fileName: sanitizedName,
                        originalName: sanitizedName,
                        fileType: FileType.FOLDER,
                        type: "folder",
                        isFolder: true,
                        filePath: physicalPath,
                        createdBy: userId,
                        modifiedBy: userId,
                        ownerId: userId,
                        parentId,
                        userId,
                        itemCount: 0,
                    },
                });

                if (parentId) {
                    await tx.file.update({
                        where: { id: parentId },
                        data: { itemCount: { increment: 1 } },
                    });
                }

                return folder;
            });

            const response: ApiResponse<FileItem> = {
                success: true,
                data: {
                    id: createdFolder.id,
                    fileName: createdFolder.fileName,
                    fileSize: 0,
                    mimeType: "folder",
                    fileType: FileType.FOLDER,
                    filePath: createdFolder.filePath,
                    parentId: createdFolder.parentId,
                    isFolder: createdFolder.isFolder,
                    createdBy: createdFolder.createdBy!,
                    modifiedBy: createdFolder.modifiedBy!,
                    ownerId: createdFolder.ownerId!,
                    userId: createdFolder.userId!,
                    itemCount: createdFolder.itemCount!,
                    starred: createdFolder.isStarred,
                    locked: createdFolder.isLocked,
                    shared: createdFolder.isShared,
                    shareCount: createdFolder.shareCount,
                    createdAt: createdFolder.createdAt,
                    updatedAt: createdFolder.updatedAt,
                    deletedAt: createdFolder.deletedAt!,
                },

            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error: any) {

            console.log(" 9999999999999999999 ")

            this.handleError(res, error, 'Failed to create folder');
        }
    }

    public getFiles = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) {

                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }


            const { value: query } = getFilesQuerySchema.validate(req.query, {
                // Best practice: allow Joi to convert types automatically
                convert: true,
            });

            // Transform string values to numbers
            query.page = parseInt(query.page);
            query.limit = parseInt(query.limit);
            query.isDeleted = query.isDeleted === 'true';
            const files = await fileService.getFileList(userId, query);

            // console.log(" +++++++++++getFileList+++++++++++++ ")
            // console.log(files)
            // console.log(" +++++++++getFileList+++++++++++++++ ")

            const fileListResponse = {
                files: files.items,
                totalCount: files.total,
                totalPages: Math.ceil(files.total / query.limit),
                currentPage: query.page,
                hasNextPage: files.hasMore,
                hasPreviousPage: query.page > 1
            };

            const response: ApiResponse<typeof fileListResponse> = {
                success: true,
                data: fileListResponse,

            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error: any) {
            this.handleError(res, error, 'Failed to retrieve user statistics');
        }
    }

    //===========================================

    public generateLinkSharesV1 = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) {
                this.handleError(res, new Error("User not authenticated"), "Authentication required", 401);
                return;
            }

            // Validate input using Joi
            const { error, value } = shareLinkSchema.validate(req.body, { abortEarly: false });
            if (error) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(
                    JSON.stringify({
                        success: false,
                        message: "Invalid parameters",
                        error: error.details.map((d) => ({ [d.path.join(".")]: d.message })),
                    })
                );
                return;
            }

            const { fileId, permission, expiresAt, downloadAllowed, password, maxDownloads, shareType } = value;

            // Check if file exists and user has permission
            const file = await prisma.file.findFirst({
                where: {
                    id: fileId,
                    userId,
                    isDeleted: false,
                },
            });

            if (!file) {
                this.handleError(res, new Error("File not found or unauthorized"), "File not found or unauthorized", 404);
                return;
            }

            // Generate unique token and URL
            const token = uuidv4();
            const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

            console.log(" ++++++++++++++++++++ ");
            console.log(token);
            console.log(hashedPassword);
            console.log(" ++++++++++++++++++++ ");

            // Get file path for sharing
            const filePath = file.filePath || `${file.fileName}`;

            console.log(" +++++++ FILE PATH V1 +++++++ ");
            console.log("File Path:", filePath);
            console.log("File Name:", file.fileName);
            console.log(" +++++++ FILE PATH V1 +++++++ ");

            // Create file link
            const fileLink = await prisma.fileLink.create({
                data: {
                    token,
                    fileId,
                    shareType: shareType,
                    createdBy: userId,
                    permission,
                    expiresAt: expiresAt ? new Date(expiresAt) : null,
                    allowDownload: downloadAllowed,
                    password: hashedPassword,
                    maxDownloads,
                    isActive: true,
                    filePath: filePath,
                },
            });

            // Update file shared status
            await prisma.file.update({
                where: { id: fileId },
                data: {
                    isShared: true,
                    shareCount: { increment: 1 },
                },
            });

            const shareUrl = `${process.env.FRONTEND_URL}/share/${token}`;
            const response: CopyLinkResponse = {
                shareId: token,
                shareUrl: shareUrl,
                expiresAt: fileLink.expiresAt?.toISOString(),
            };


            console.log(" ===================== ");
            console.log(shareUrl);
            console.log(response);
            console.log(" ===================== ");

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {
            console.error("Error creating share link:", error);
            this.handleError(res, error, "Failed to create share link");
        }
    }

    public downloadFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {

            console.log(" =======000000000000000========== ")

            const fileId = req.params?.fileId;
            const userId = req.user?.userId;
            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }
            console.log(" =======000000000000000========== ")
            console.log(req.body)
            console.log(" ========000000000000000============= ")


            if (!fileId) {
                this.handleError(res, new Error('File ID required'), 'File ID is required', 400);
                return;
            }

            // Get file information from database
            const file = await prisma.file.findFirst({
                where: {
                    id: fileId,
                    userId,
                    isDeleted: false,
                },
            });

            if (!file) {
                this.handleError(res, new Error('File not found or unauthorized'), 'File not found or unauthorized', 404);
                return;
            }

            // Check if file is a folder
            if (file.isFolder) {
                await this.downloadFolder(req, res, file);
            } else {
                await this.downloadSingleFile(req, res, file);
            }

        } catch (error: any) {
            logger.error('Error downloading file:', error);
            this.handleError(res, error, 'Failed to download file');
        }
    }

    private async downloadSingleFile(req: AuthenticatedRequest, res: ServerResponse, file: any): Promise<void> {
        const userId = req.user?.userId;
        let downloadId: string | null = null;

        try {
            // Create download tracking record
            downloadId = await this.createDownloadRecord({
                fileId: file.id,
                userId,
                fileName: file.fileName,
                fileSize: BigInt(file.size || 0),
                mimeType: file.mimeType,
                downloadType: 'DIRECT',
                downloadFormat: 'original',
                compressionType: 'NONE',
                //  ipAddress: req.ip || req.socket?.remoteAddress || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown',
                deviceType: this.getDeviceType(req.get('User-Agent'))
            });

            // Update status to preparing
            await this.updateDownloadProgress(downloadId, { status: 'PREPARING' });

            // Check if file exists on disk
            try {
                await fs.access(file.filePath);
            } catch (error) {
                await this.updateDownloadProgress(downloadId, {
                    status: 'FAILED',
                    failureReason: 'File not found on disk'
                });
                this.handleError(res, new Error('File not found on disk'), 'File not found on disk', 404);
                return;
            }

            // Get file stats for content length
            const stats = await fs.stat(file.filePath);

            // Update download record with file details
            await this.updateDownloadProgress(downloadId, {
                status: 'READY',
                // totalBytes: BigInt(stats.size)
            });

            // Set download headers
            res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
            res.setHeader('Content-Length', stats.size.toString());
            res.setHeader('Cache-Control', 'private, no-cache');
            res.setHeader('X-Download-ID', downloadId); // For client tracking

            // Update status to downloading
            await this.updateDownloadProgress(downloadId, { status: 'DOWNLOADING' });

            // Track download progress
            let bytesTransferred = 0;
            const startTime = Date.now();

            // Stream the file
            const fileStream = createReadStream(file.filePath);

            fileStream.on('data', async (chunk) => {
                bytesTransferred += chunk.length;
                const progress = (bytesTransferred / stats.size) * 100;
                const elapsedTime = (Date.now() - startTime) / 1000; // seconds
                const downloadSpeed = elapsedTime > 0 ? (bytesTransferred / 1024) / elapsedTime : 0; // KB/s

                // Update progress periodically (every 5% or 1MB, whichever comes first)
                if (bytesTransferred % (1024 * 1024) === 0 || // Every 1MB
                    Math.floor(progress) % 5 === 0) { // Every 5%
                    try {
                        await this.updateDownloadProgress(downloadId!, {
                            progress: Math.round(progress),
                            bytesDownloaded: BigInt(bytesTransferred),
                            downloadSpeed
                        });
                    } catch (error) {
                        // Don't fail download for tracking errors
                        console.warn('Failed to update download progress:', error);
                    }
                }
            });

            fileStream.on('end', async () => {
                try {
                    await this.updateDownloadProgress(downloadId!, {
                        status: 'COMPLETED',
                        progress: 100,
                        bytesDownloaded: BigInt(stats.size),
                        completedAt: new Date()
                    });
                } catch (error) {
                    console.warn('Failed to mark download as completed:', error);
                }
            });

            fileStream.on('error', async (error) => {
                logger.error('Error streaming file:', error);

                try {
                    await this.updateDownloadProgress(downloadId!, {
                        status: 'FAILED',
                        failureReason: error.message,
                        bytesDownloaded: BigInt(bytesTransferred)
                    });
                } catch (trackingError) {
                    console.warn('Failed to update download failure status:', trackingError);
                }

                if (!res.headersSent) {
                    this.handleError(res, error, 'Failed to stream file', 500);
                }
            });

            // Handle client disconnect
            req.on('close', async () => {
                if (!res.writableEnded) {
                    try {
                        await this.updateDownloadProgress(downloadId!, {
                            status: 'CANCELLED',
                            cancelledAt: new Date(),
                            bytesDownloaded: BigInt(bytesTransferred)
                        });
                    } catch (error) {
                        console.warn('Failed to mark download as cancelled:', error);
                    }
                }
            });

            fileStream.pipe(res);

        } catch (error: any) {
            logger.error('Error downloading single file:', error);

            if (downloadId) {
                try {
                    await this.updateDownloadProgress(downloadId, {
                        status: 'FAILED',
                        failureReason: error.message
                    });
                } catch (trackingError) {
                    console.warn('Failed to update download failure status:', trackingError);
                }
            }

            this.handleError(res, error, 'Failed to download file');
        }
    }

    private async downloadFolder(req: AuthenticatedRequest, res: Response, folder: any): Promise<void> {
        const userId = req.user?.userId;
        let downloadId: string | null = null;

        try {
            // Create download tracking record for folder archive
            downloadId = await this.createDownloadRecord({
                fileId: folder.id,
                userId,
                fileName: `${folder.fileName}.zip`,
                fileSize: BigInt(0), // Will be updated as we compress
                mimeType: 'application/zip',
                downloadType: 'ARCHIVE',
                downloadFormat: 'zip',
                compressionType: 'ZIP',
                compressionLevel: 9,
                //   ipAddress: req.ip || req.socket?.remoteAddress || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown',
                deviceType: this.getDeviceType(req.get('User-Agent'))
            });

            // Update status to preparing
            await this.updateDownloadProgress(downloadId, { status: 'PREPARING' });

            // Set response headers for zip download
            const zipFileName = `${folder.fileName}.zip`;
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(zipFileName)}"`);
            res.setHeader('Cache-Control', 'private, no-cache');
            res.setHeader('X-Download-ID', downloadId); // For client tracking

            // Create zip archive
            const archive = archiver('zip', {
                zlib: { level: 9 } // Compression level
            });

            // Track compression progress
            let totalBytes = 0;
            const startTime = Date.now();

            // Handle archive progress
            archive.on('progress', async (progress) => {
                try {
                    const elapsedTime = (Date.now() - startTime) / 1000; // seconds
                    const compressionSpeed = elapsedTime > 0 ? (progress.entries.processed / elapsedTime) : 0;

                    await this.updateDownloadProgress(downloadId!, {
                        status: 'DOWNLOADING',
                        progress: Math.round((progress.entries.processed / progress.entries.total) * 100),
                        bytesDownloaded: BigInt(totalBytes),
                        downloadSpeed: compressionSpeed
                    });
                } catch (error) {
                    console.warn('Failed to update compression progress:', error);
                }
            });

            // Handle archive data
            archive.on('data', (chunk) => {
                totalBytes += chunk.length;
            });

            // Handle archive completion
            archive.on('end', async () => {
                try {
                    await this.updateDownloadProgress(downloadId!, {
                        status: 'COMPLETED',
                        progress: 100,
                        bytesDownloaded: BigInt(totalBytes),
                        //      totalBytes: BigInt(totalBytes),
                        completedAt: new Date()
                    });
                } catch (error) {
                    console.warn('Failed to mark folder download as completed:', error);
                }
            });

            // Handle archive errors
            archive.on('error', async (error) => {
                logger.error('Archive error:', error);

                try {
                    await this.updateDownloadProgress(downloadId!, {
                        status: 'FAILED',
                        failureReason: error.message,
                        bytesDownloaded: BigInt(totalBytes)
                    });
                } catch (trackingError) {
                    console.warn('Failed to update archive failure status:', trackingError);
                }

                if (!res.headersSent) {
                    this.handleError(res, error, 'Failed to create zip archive', 500);
                }
            });

            // Handle client disconnect
            req.on('close', async () => {
                if (!res.writableEnded) {
                    try {
                        await this.updateDownloadProgress(downloadId!, {
                            status: 'CANCELLED',
                            cancelledAt: new Date(),
                            bytesDownloaded: BigInt(totalBytes)
                        });
                    } catch (error) {
                        console.warn('Failed to mark folder download as cancelled:', error);
                    }
                }
            });

            // Update status to ready
            await this.updateDownloadProgress(downloadId, { status: 'READY' });

            // Pipe archive to response
            archive.pipe(res);

            // Add folder contents to archive recursively
            await this.addFolderToArchive(archive, folder.id, userId!, '', downloadId);

            // Finalize the archive
            await archive.finalize();

        } catch (error: any) {
            logger.error('Error downloading folder:', error);

            if (downloadId) {
                try {
                    await this.updateDownloadProgress(downloadId, {
                        status: 'FAILED',
                        failureReason: error.message
                    });
                } catch (trackingError) {
                    console.warn('Failed to update folder download failure status:', trackingError);
                }
            }

            if (!res.headersSent) {
                this.handleError(res, error, 'Failed to download folder');
            }
        }
    }

    public getFolderById = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
        try {
            const userId = req.user?.userId;
            const parentId = req.params?.parentId;



            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            const folder = await prisma.file.findFirst({
                where: {
                    parentId: parentId || null,
                    userId,
                    isFolder: true,
                    isDeleted: false,
                    isActive: true,
                    isLocked: false,
                },
                select: {
                    id: true,
                    fileName: true,
                    filePath: true,
                    type: true,
                    updatedAt: true,
                },
            });

            if (!folder) {
                this.handleError(res, new Error('Folder not found'), 'Folder not found', 404); // Changed to 404 for not found
                return;
            }

            const response = {
                folder: {
                    id: folder.id,
                    fileName: folder.fileName,
                    updatedAt: folder.updatedAt
                }
            };




            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));

        } catch (error) {
            console.error('Error getting folder info:', error);
            this.handleError(res, error as Error, 'Failed to retrieve folder information', 500); // Added status code
        }
    };



    public getDownloadInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const fileId = req?.params?.fileId;
            const userId = req.user?.userId;

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            if (!fileId) {
                this.handleError(res, new Error('File ID required'), 'File ID is required', 400);
                return;
            }

            // Get file information with permission check
            const file = await prisma.file.findFirst({
                where: {
                    id: fileId,
                    OR: [
                        { userId }, // User owns the file
                        {
                            sharedFiles: {
                                some: {
                                    isActive: true,
                                    OR: [
                                        { expiresAt: null },
                                        { expiresAt: { gt: new Date() } }
                                    ],
                                    shareUsers: {
                                        some: { userId }
                                    }
                                }
                            }
                        }
                    ],
                    isDeleted: false,
                },
                include: {
                    owner: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                }
            });

            if (!file) {
                this.handleError(res, new Error('File not found'), 'File not found or access denied', 404);
                return;
            }

            // Get download history for this file and user
            const downloadHistory = await prisma.fileDownload.findMany({
                where: { fileId, userId },
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    downloadType: true,
                    downloadFormat: true,
                    compressionType: true,
                    status: true,
                    fileSize: true,
                    bytesDownloaded: true,
                    downloadSpeed: true,
                    createdAt: true,
                    completedAt: true,
                    failureReason: true
                }
            });

            // Get user information for quota
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                }
            });

            // Calculate today's downloads
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const downloadsToday = await prisma.fileDownload.count({
                where: {
                    userId,
                    createdAt: { gte: todayStart },
                    status: { in: ['COMPLETED', 'DOWNLOADING'] }
                }
            });

            // Get available formats and options
            const formats = this.getAvailableFormats(file);
            const compressionOptions = this.getCompressionOptions();

            // Calculate file size and download estimates
            const fileSize = Number(file.fileSize || 0);
            const estimatedTime = this.calculateDownloadTime(fileSize);

            // Check if file is a folder (requires compression)
            const isFolder = file.fileType === FileType.FOLDER;

            const downloadInfo = {
                file: {
                    id: file.id,
                    fileName: file.fileName,
                    fileSize,
                    mimeType: file.mimeType,
                    fileType: file.fileType,
                    isFolder,
                    createdAt: file.createdAt,
                    modifiedAt: file.updatedAt,
                    owner: file.owner
                },
                downloadOptions: {
                    downloadFormats: formats,
                    compressionOptions: isFolder ? compressionOptions : compressionOptions.filter(opt => opt.type !== 'NONE'),
                    allowDirectDownload: !isFolder,
                    requiresCompression: isFolder
                },
                estimates: {
                    fileSize,
                    estimatedDownloadTime: estimatedTime,
                    estimatedCompressionTime: isFolder ? this.calculateCompressionTime(fileSize) : 0
                },
                history: downloadHistory.map(d => ({
                    id: d.id,
                    downloadType: d.downloadType,
                    format: d.downloadFormat,
                    compression: d.compressionType,
                    status: d.status,
                    fileSize: Number(d.fileSize || 0),
                    bytesDownloaded: Number(d.bytesDownloaded || 0),
                    downloadSpeed: d.downloadSpeed,
                    startedAt: d.createdAt,
                    completedAt: d.completedAt,
                    failureReason: d.failureReason,
                    progress: d.fileSize ? Number(d.bytesDownloaded || 0) / Number(d.fileSize) * 100 : 0
                })),
                quotaInfo: {
                    used: 0, // TODO: Implement user quota tracking
                    limit: 5 * 1024 * 1024 * 1024, // 5GB default
                    remaining: 5 * 1024 * 1024 * 1024 // 5GB default
                },
                restrictions: {
                    maxDownloadsPerDay: 50,
                    downloadsToday,
                    remainingDownloads: Math.max(0, 50 - downloadsToday),
                    requiresPassword: false,
                    allowedFormats: formats.map(f => f.format),
                    canDownload: downloadsToday < 50
                },
                user: user ? {
                    id: user.id,
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.email
                } : null
            };

            res.json({
                success: true,
                data: downloadInfo
            });

        } catch (error) {
            console.error('Error getting download info:', error);
            this.handleError(res, error, 'Failed to retrieve download information');
        }
    }

    public getFileDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            const userId = req.user.userId;
            const fileId = req.params?.fileId;

            if (!fileId) {
                this.handleError(res, new Error('File ID required'), 'File ID is required', 400);
                return;
            }

            // Get comprehensive file information
            const file = await prisma.file.findFirst({
                where: {
                    id: fileId,
                    OR: [
                        { userId }, // User owns the file
                        {
                            sharedFiles: {
                                some: {
                                    isActive: true,
                                    OR: [
                                        { expiresAt: null },
                                        { expiresAt: { gt: new Date() } }
                                    ],
                                    shareUsers: {
                                        some: {
                                            userId
                                        }
                                    }
                                }
                            }
                        }
                    ],
                    isDeleted: false,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    parent: {
                        select: {
                            id: true,
                            fileName: true,
                            filePath: true,
                        },
                    },
                    sharedFiles: {
                        where: { isActive: true },
                        include: {
                            shareUsers: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            firstName: true,
                                            lastName: true,
                                            email: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    links: {
                        where: {
                            isActive: true,
                            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                        },
                    },
                    _count: {
                        select: {
                            children: {
                                where: { isDeleted: false }
                            }
                        }
                    }
                },
            });

            if (!file) {
                this.handleError(res, new Error('File not found or access denied'), 'File not found or access denied', 404);
                return;
            }

            // Get additional file metadata
            const fileMetadata = await this.extractFileMetadata(file);
            const fileStats = await this.getFileStatistics(file);
            const shareInfo = await this.getShareInformation(file);
            const activityLog = await this.getRecentActivity(fileId);

            // Build comprehensive file details
            const fileDetails = {
                // Basic Information
                id: file.id,
                fileName: file.fileName,
                originalName: file.originalName,
                fileType: file.fileType,
                mimeType: file.mimeType,
                fileExtension: path.extname(file.fileName).toLowerCase(),

                // Size and Storage
                fileSize: {
                    bytes: Number(file.fileSize || 0),
                    readable: this.formatFileSize(Number(file.fileSize || 0)),
                    sizeCategory: this.getFileSizeCategory(Number(file.fileSize || 0))
                },

                // File Properties
                isFolder: file.isFolder,
                isStarred: file.isStarred,
                isLocked: file.isLocked,
                isShared: file.isShared,
                isEncrypted: file.isEncrypted,
                isTemporary: file.isTemporary,
                isActive: file.isActive,

                // Timestamps
                createdAt: file.createdAt,
                updatedAt: file.updatedAt,
                lastAccessedAt: file.lastAccessedAt,
                lastModifiedAt: file.updatedAt,

                // Owner Information
                owner: {
                    id: file?.user?.id!,
                    name: this.getDisplayName(file.user),
                    email: file?.user?.email,
                    isCurrentUser: file?.user?.id === userId
                },

                // Location Information
                location: {
                    parentId: file.parentId,
                    parentName: file.parent?.fileName || 'Root',
                    breadcrumb: await this.getBreadcrumbPath(file),
                    fullPath: this.anonymizeFilePath(file.filePath)
                },

                // Content Information
                metadata: fileMetadata,

                // Statistics
                statistics: fileStats,

                // Sharing Information
                sharing: shareInfo,

                // Recent Activity
                recentActivity: activityLog,

                // Permissions
                permissions: {
                    canEdit: await this.canUserEdit(userId, file),
                    canDelete: await this.canUserDelete(userId, file),
                    canShare: await this.canUserShare(userId, file),
                    canDownload: await this.canUserDownload(userId, file),
                    canMove: await this.canUserMove(userId, file),
                },

                // File-specific details
                ...(file.isFolder && {
                    folderDetails: {
                        itemCount: file._count.children,
                        isEmpty: file._count.children === 0,
                        hasSubfolders: await this.hasSubfolders(file.id),
                    }
                }),

                // Preview Information
                preview: {
                    isPreviewable: previewService.isPreviewSupported(file.mimeType, file.fileName),
                    thumbnailAvailable: await previewService.hasThumbnail(file.id, userId),
                    previewType: previewService.getPreviewType(file.mimeType, file.fileName),
                }
            };

            const response: ApiResponse<typeof fileDetails> = {
                success: true,
                data: fileDetails,
                metadata: {
                    timestamp: new Date(),
                    requestId: crypto.randomUUID(),
                    message: 'File details retrieved successfully'
                }
            };

            res.status(200).json(response);

        } catch (error: any) {
            logger.error('Error fetching file details:', error);
            this.handleError(res, error, 'Failed to retrieve file details');
        }
    }

    public getFileContent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            const userId = req.user.userId;
            const fileId = req.params?.fileId;

            if (!fileId) {
                this.handleError(res, new Error('File ID required'), 'File ID is required', 400);
                return;
            }

            // Get file information from database
            const file = await prisma.file.findFirst({
                where: {
                    id: fileId,
                    userId,
                    isDeleted: false,
                },
            });

            if (!file) {
                this.handleError(res, new Error('File not found or unauthorized'), 'File not found or unauthorized', 404);
                return;
            }

            // Skip content generation for folders
            if (file.isFolder) {
                this.handleError(res, new Error('Content not available for folders'), 'Content not available for folders', 400);
                return;
            }

            // Check if file exists on disk
            try {
                await fs.access(file.filePath);
            } catch (error) {
                this.handleError(res, new Error('File not found on disk'), 'File not found on disk', 404);
                return;
            }

            const mimeType = file.mimeType || this.getMimeType(file.fileName);
            const fileExtension = path.extname(file.fileName).toLowerCase();

            // Handle different file types
            if (mimeType.startsWith('image/')) {
                await this.handleImageContent(req, res, file);
            } else if (mimeType === 'application/pdf') {
                await this.handlePDFContent(req, res, file);
            } else if (mimeType.startsWith('video/')) {
                await this.handleVideoContent(req, res, file);
            } else if (mimeType.startsWith('audio/')) {
                await this.handleAudioContent(req, res, file);
            } else if (this.isTextFile(mimeType, fileExtension)) {
                await this.handleTextContent(req, res, file);
            } else if (this.isDocumentFile(mimeType, fileExtension)) {
                await this.handleDocumentContent(req, res, file);
            } else {
                // Generic binary file handling
                await this.handleBinaryContent(req, res, file);
            }

        } catch (error: any) {
            logger.error('Error getting file content:', error);
            this.handleError(res, error, 'Failed to retrieve file content');
        }
    }

    private async handleImageContent(req: AuthenticatedRequest, res: Response, file: any): Promise<void> {
        try {
            const stats = await fs.stat(file.filePath);

            // Set appropriate headers for image content
            res.setHeader('Content-Type', file.mimeType || 'image/jpeg');
            res.setHeader('Content-Length', stats.size.toString());
            res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache for images
            res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);

            // Support range requests for large images
            const range = req.headers.range;
            if (range) {
                await this.handleRangeRequest(req, res, file, stats);
            } else {
                const fileStream = createReadStream(file.filePath);
                fileStream.pipe(res);
            }
        } catch (error) {
            logger.error('Error handling image content:', error);
            this.handleError(res, error, 'Failed to serve image content');
        }
    }

    private async handleVideoContent(req: AuthenticatedRequest, res: Response, file: any): Promise<void> {
        try {
            const stats = await fs.stat(file.filePath);

            // Set appropriate headers for video content
            res.setHeader('Content-Type', file.mimeType || 'video/mp4');
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);

            // Handle range requests for video streaming
            const range = req.headers.range;
            if (range) {
                await this.handleRangeRequest(req, res, file, stats);
            } else {
                res.setHeader('Content-Length', stats.size.toString());
                const fileStream = createReadStream(file.filePath);
                fileStream.pipe(res);
            }
        } catch (error) {
            logger.error('Error handling video content:', error);
            this.handleError(res, error, 'Failed to serve video content');
        }
    }

    private async handleAudioContent(req: AuthenticatedRequest, res: Response, file: any): Promise<void> {
        try {
            const stats = await fs.stat(file.filePath);

            // Set appropriate headers for audio content
            res.setHeader('Content-Type', file.mimeType || 'audio/mpeg');
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);

            // Handle range requests for audio streaming
            const range = req.headers.range;
            if (range) {
                await this.handleRangeRequest(req, res, file, stats);
            } else {
                res.setHeader('Content-Length', stats.size.toString());
                const fileStream = createReadStream(file.filePath);
                fileStream.pipe(res);
            }
        } catch (error) {
            logger.error('Error handling audio content:', error);
            this.handleError(res, error, 'Failed to serve audio content');
        }
    }

    private async handleTextContent(req: AuthenticatedRequest, res: Response, file: any): Promise<void> {
        try {
            // Read text file content
            const content = await fs.readFile(file.filePath, 'utf-8');

            // Set appropriate headers for text content
            res.setHeader('Content-Type', `${file.mimeType || 'text/plain'}; charset=utf-8`);
            res.setHeader('Cache-Control', 'private, max-age=3600'); // 1 hour cache
            res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);

            res.send(content);
        } catch (error) {
            logger.error('Error handling text content:', error);
            this.handleError(res, error, 'Failed to serve text content');
        }
    }

    private async handlePDFContent(req: AuthenticatedRequest, res: Response, file: any): Promise<void> {
        try {
            const stats = await fs.stat(file.filePath);

            // Set appropriate headers for PDF content
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Length', stats.size.toString());
            res.setHeader('Cache-Control', 'private, max-age=3600'); // 1 hour cache
            res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);

            const fileStream = createReadStream(file.filePath);
            fileStream.pipe(res);
        } catch (error) {
            logger.error('Error handling PDF content:', error);
            this.handleError(res, error, 'Failed to serve PDF content');
        }
    }

    private async handleDocumentContent(req: AuthenticatedRequest, res: Response, file: any): Promise<void> {
        try {
            // For Office documents, we'll convert them to PDF for viewing
            const tempPdfPath = await this.convertDocumentToPDF(file.filePath, file.mimeType);

            if (tempPdfPath) {
                const stats = await fs.stat(tempPdfPath);

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Length', stats.size.toString());
                res.setHeader('Cache-Control', 'private, max-age=3600');
                res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}.pdf"`);

                const fileStream = createReadStream(tempPdfPath);

                fileStream.on('end', async () => {
                    // Clean up temporary PDF
                    try {
                        await fs.unlink(tempPdfPath);
                    } catch (cleanupError) {
                        logger.warn('Failed to clean up temporary PDF:', cleanupError);
                    }
                });

                fileStream.pipe(res);
            } else {
                // Fallback to binary download
                await this.handleBinaryContent(req, res, file);
            }
        } catch (error) {
            logger.error('Error handling document content:', error);
            this.handleError(res, error, 'Failed to serve document content');
        }
    }

    private async handleBinaryContent(req: AuthenticatedRequest, res: Response, file: any): Promise<void> {
        try {
            const stats = await fs.stat(file.filePath);

            // Set appropriate headers for binary content
            res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
            res.setHeader('Content-Length', stats.size.toString());
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);

            const fileStream = createReadStream(file.filePath);
            fileStream.pipe(res);
        } catch (error) {
            logger.error('Error handling binary content:', error);
            this.handleError(res, error, 'Failed to serve binary content');
        }
    }

    private async handleRangeRequest(req: AuthenticatedRequest, res: Response, file: any, stats: any): Promise<void> {
        const range = req.headers.range;
        if (!range) return;

        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
        const chunksize = (end - start) + 1;

        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${stats.size}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', chunksize.toString());
        res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');

        const fileStream = createReadStream(file.filePath, { start, end });
        fileStream.pipe(res);
    }

    private async convertDocumentToPDF(inputPath: string, mimeType: string): Promise<string | null> {
        return new Promise((resolve) => {
            const outputDir = path.dirname(inputPath);
            const outputPath = path.join(outputDir, `temp_${Date.now()}.pdf`);

            const command = [
                'libreoffice',
                '--headless',
                '--convert-to', 'pdf',
                '--outdir', outputDir,
                inputPath
            ];

            const process = spawn(command[0], command.slice(1));

            process.on('close', async (code) => {
                if (code === 0) {
                    // LibreOffice creates PDF with same name but .pdf extension
                    const expectedPdfPath = inputPath.replace(path.extname(inputPath), '.pdf');
                    try {
                        await fs.access(expectedPdfPath);
                        // Rename to our temp file
                        await fs.rename(expectedPdfPath, outputPath);
                        resolve(outputPath);
                    } catch {
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            });

            process.on('error', () => {
                resolve(null);
            });
        });
    }

    private isTextFile(mimeType: string, extension: string): boolean {
        const textTypes = [
            'text/',
            'application/json',
            'application/xml',
            'application/javascript',
            'application/typescript'
        ];

        const textExtensions = [
            '.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.html', '.css',
            '.json', '.xml', '.yaml', '.yml', '.csv', '.log', '.ini',
            '.conf', '.config', '.env', '.gitignore', '.py', '.java',
            '.c', '.cpp', '.h', '.hpp', '.cs', '.php', '.rb', '.go',
            '.rs', '.sql', '.sh', '.bat', '.ps1'
        ];

        return textTypes.some(type => mimeType.startsWith(type)) ||
            textExtensions.includes(extension);
    }

    private isDocumentFile(mimeType: string, extension: string): boolean {
        const documentTypes = [
            'application/msword',
            'application/vnd.openxmlformats-officedocument',
            'application/vnd.ms-excel',
            'application/vnd.ms-powerpoint'
        ];

        const documentExtensions = [
            '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
            '.odt', '.ods', '.odp'
        ];

        return documentTypes.some(type => mimeType.includes(type)) ||
            documentExtensions.includes(extension);
    }

    private getMimeType(fileName: string): string {
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

    // Thumbnail generation methods
    private async generateImageThumbnail(inputPath: string, outputPath: string): Promise<void> {
        try {
            const image = sharp(inputPath);
            const metadata = await image.metadata();

            // Handle different image formats and orientations
            await image
                .rotate() // Auto-rotate based on EXIF orientation
                .resize(200, 200, {
                    fit: 'inside',
                    withoutEnlargement: true,
                    background: { r: 255, g: 255, b: 255, alpha: 1 } // White background for transparency
                })
                .jpeg({
                    quality: 80,
                    progressive: true,
                    mozjpeg: true // Use mozjpeg encoder for better compression
                })
                .toFile(outputPath);

            logger.info(`Image thumbnail generated successfully: ${outputPath} (${metadata.width}x${metadata.height} -> 200x200)`);
        } catch (error) {
            logger.error('Error generating image thumbnail:', error);
            throw new Error('Failed to generate image thumbnail');
        }
    }

    private async generatePDFThumbnail(inputPath: string, outputPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // Using ImageMagick to convert first page of PDF to JPEG
            const convert = spawn('magick', [
                `${inputPath}[0]`, // First page only
                '-thumbnail', '200x200',
                '-background', 'white',
                '-alpha', 'remove',
                '-quality', '80',
                '-density', '150', // Higher density for better quality
                '-strip', // Remove metadata to reduce file size
                outputPath
            ]);

            convert.on('close', (code) => {
                if (code === 0) {
                    logger.info(`PDF thumbnail generated successfully: ${outputPath}`);
                    resolve();
                } else {
                    logger.error(`PDF thumbnail generation failed with code ${code}`);
                    reject(new Error(`PDF thumbnail generation failed with code ${code}`));
                }
            });

            convert.on('error', (error) => {
                logger.error('PDF thumbnail generation error:', error);
                reject(error);
            });
        });
    }

    private async generateDocumentThumbnail(inputPath: string, outputPath: string, mimeType: string): Promise<void> {
        return new Promise((resolve, reject) => {
            let command: string[] = [];

            // Different approaches for different document types
            if (mimeType.includes('word') || mimeType.includes('document')) {
                // For Word documents, try to convert using LibreOffice
                command = [
                    'libreoffice',
                    '--headless',
                    '--convert-to', 'pdf',
                    '--outdir', path.dirname(outputPath),
                    inputPath
                ];
            } else if (mimeType.includes('presentation')) {
                // For PowerPoint presentations
                command = [
                    'libreoffice',
                    '--headless',
                    '--convert-to', 'pdf',
                    '--outdir', path.dirname(outputPath),
                    inputPath
                ];
            } else if (mimeType.includes('spreadsheet')) {
                // For Excel spreadsheets
                command = [
                    'libreoffice',
                    '--headless',
                    '--convert-to', 'pdf',
                    '--outdir', path.dirname(outputPath),
                    inputPath
                ];
            } else {
                // Fallback: create a generic document icon
                this.generateGenericThumbnail('document', outputPath).then(resolve).catch(reject);
                return;
            }

            const process = spawn(command[0], command.slice(1));

            process.on('close', async (code) => {
                if (code === 0) {
                    // Convert the generated PDF to thumbnail
                    const pdfPath = inputPath.replace(path.extname(inputPath), '.pdf');
                    try {
                        await this.generatePDFThumbnail(pdfPath, outputPath);
                        // Clean up the temporary PDF
                        await fs.unlink(pdfPath).catch(() => { });
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    // Fallback to generic thumbnail
                    this.generateGenericThumbnail('document', outputPath).then(resolve).catch(reject);
                }
            });

            process.on('error', () => {
                // Fallback to generic thumbnail
                this.generateGenericThumbnail('document', outputPath).then(resolve).catch(reject);
            });
        });
    }

    private async generateVideoThumbnail(inputPath: string, outputPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // Using FFmpeg to extract frame from video
            const ffmpeg = spawn('ffmpeg', [
                '-i', inputPath,
                '-ss', '00:00:01', // Extract frame at 1 second
                '-vframes', '1',
                '-vf', 'scale=200:200:force_original_aspect_ratio=decrease',
                '-q:v', '2',
                '-y', // Overwrite output file
                outputPath
            ]);

            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    // Fallback to generic thumbnail
                    this.generateGenericThumbnail('video', outputPath).then(resolve).catch(reject);
                }
            });

            ffmpeg.on('error', () => {
                this.generateGenericThumbnail('video', outputPath).then(resolve).catch(reject);
            });
        });
    }

    private async generateGenericThumbnail(fileType: string, outputPath: string): Promise<void> {
        try {
            // Create a simple colored square with file type text
            const width = 200;
            const height = 200;

            let backgroundColor = '#6B7280'; // Default gray
            let textColor = '#FFFFFF';
            let text = 'FILE';

            switch (fileType.toLowerCase()) {
                case 'document':
                case 'doc':
                case 'docx':
                    backgroundColor = '#2563EB'; // Blue
                    text = 'DOC';
                    break;
                case 'pdf':
                    backgroundColor = '#DC2626'; // Red
                    text = 'PDF';
                    break;
                case 'spreadsheet':
                case 'xls':
                case 'xlsx':
                    backgroundColor = '#059669'; // Green
                    text = 'XLS';
                    break;
                case 'presentation':
                case 'ppt':
                case 'pptx':
                    backgroundColor = '#D97706'; // Orange
                    text = 'PPT';
                    break;
                case 'video':
                    backgroundColor = '#7C3AED'; // Purple
                    text = 'VID';
                    break;
                case 'audio':
                    backgroundColor = '#DC2626'; // Red
                    text = 'AUD';
                    break;
                case 'archive':
                    backgroundColor = '#374151'; // Dark gray
                    text = 'ZIP';
                    break;
                default:
                    backgroundColor = '#6B7280';
                    text = 'FILE';
            }

            // Create SVG content
            const svgContent = `
                <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100%" height="100%" fill="${backgroundColor}" rx="8"/>
                    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
                          fill="${textColor}" font-family="Arial, sans-serif" font-size="24" font-weight="bold">
                        ${text}
                    </text>
                </svg>
            `;

            // Convert SVG to JPEG using Sharp
            await sharp(Buffer.from(svgContent))
                .jpeg({ quality: 80 })
                .toFile(outputPath);

        } catch (error) {
            logger.error('Error generating generic thumbnail:', error);
            throw new Error('Failed to generate generic thumbnail');
        }
    }

    private async ensureThumbnailDirectory(userId: string): Promise<string> {
        const systemSettings = await prisma.systemSettings.findFirst({
            where: { id: 1 },
        });
        const UPLOAD_DIR = systemSettings?.defaultStoragePath || "./Uploads";
        const thumbnailDir = path.join(UPLOAD_DIR, userId, 'thumbnails');

        await fs.mkdir(thumbnailDir, { recursive: true });
        return thumbnailDir;
    }

    private async generateThumbnailForFile(file: any, userId: string): Promise<string | null> {
        try {
            // Check if thumbnail already exists
            const thumbnailDir = await this.ensureThumbnailDirectory(userId);
            const thumbnailPath = path.join(thumbnailDir, `${file.id}.jpg`);

            // Check if thumbnail already exists
            try {
                await fs.access(thumbnailPath);
                return thumbnailPath; // Thumbnail already exists
            } catch {
                // Thumbnail doesn't exist, generate it
            }

            // Check if original file exists
            try {
                await fs.access(file.filePath);
            } catch {
                logger.warn(`Original file not found: ${file.filePath}`);
                return null;
            }

            const mimeType = file.mimeType || '';
            const fileExtension = path.extname(file.fileName).toLowerCase();

            // Generate thumbnail based on file type
            if (mimeType.startsWith('image/')) {
                await this.generateImageThumbnail(file.filePath, thumbnailPath);
            } else if (mimeType === 'application/pdf') {
                await this.generatePDFThumbnail(file.filePath, thumbnailPath);
            } else if (mimeType.startsWith('video/')) {
                await this.generateVideoThumbnail(file.filePath, thumbnailPath);
            } else if (
                mimeType.includes('document') ||
                mimeType.includes('word') ||
                mimeType.includes('presentation') ||
                mimeType.includes('spreadsheet') ||
                ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'].includes(fileExtension)
            ) {
                await this.generateDocumentThumbnail(file.filePath, thumbnailPath, mimeType);
            } else if (mimeType.startsWith('audio/')) {
                await this.generateGenericThumbnail('audio', thumbnailPath);
            } else if (
                mimeType.includes('zip') ||
                mimeType.includes('archive') ||
                ['.zip', '.rar', '.7z', '.tar', '.gz'].includes(fileExtension)
            ) {
                await this.generateGenericThumbnail('archive', thumbnailPath);
            } else {
                // Generic file thumbnail
                await this.generateGenericThumbnail('file', thumbnailPath);
            }

            return thumbnailPath;
        } catch (error) {
            logger.error('Error generating thumbnail:', error);
            return null;
        }
    }



    private async addFolderToArchive(archive: archiver.Archiver, folderId: string, userId: string, basePath: string, downloadId?: string): Promise<void> {
        try {
            // Get all files and subfolders in this folder
            const items = await prisma.file.findMany({
                where: {
                    parentId: folderId,
                    userId,
                    isDeleted: false,
                },
                orderBy: [
                    { isFolder: 'desc' }, // Folders first
                    { fileName: 'asc' }    // Then alphabetically
                ]
            });

            for (const item of items) {
                const itemPath = basePath ? `${basePath}/${item.fileName}` : item.fileName;

                if (item.isFolder) {
                    // Recursively add subfolder contents
                    await this.addFolderToArchive(archive, item.id, userId, itemPath, downloadId);
                } else {
                    // Add file to archive
                    try {
                        await fs.access(item.filePath);
                        archive.file(item.filePath, { name: itemPath });

                        // Log file addition for tracking
                        if (downloadId) {
                            logger.debug(`Added file to archive: ${itemPath} (${item.fileSize || 0} bytes)`);
                        }
                    } catch (error) {
                        logger.warn(`File not found on disk, skipping: ${item.filePath}`);
                        // Continue with other files instead of failing the entire download
                    }
                }
            }
        } catch (error: any) {
            logger.error('Error adding folder to archive:', error);
            throw error;
        }
    }

    public getThumbnail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {

            console.log(" 000000 THUMB NAIL 00000000000 ")

            if (!req.user) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            const userId = req.user.userId;
            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            const fileId = req.params?.fileId;
            if (!fileId) {
                this.handleError(res, new Error('File ID required'), 'File ID is required', 400);
                return;
            }

            // Get file information from database
            const file = await prisma.file.findFirst({
                where: {
                    id: fileId,
                    userId,
                    isDeleted: false,
                },
            });

            if (!file) {
                this.handleError(res, new Error('File not found or unauthorized'), 'File not found or unauthorized', 404);
                return;
            }

            // Skip thumbnail generation for folders
            if (file.isFolder) {
                this.handleError(res, new Error('Thumbnails not available for folders'), 'Thumbnails not available for folders', 400);
                return;
            }

            // Generate or retrieve thumbnail
            const thumbnailPath = await this.generateThumbnailForFile(file, userId);

            if (!thumbnailPath) {
                this.handleError(res, new Error('Failed to generate thumbnail'), 'Failed to generate thumbnail', 500);
                return;
            }

            // Check if thumbnail file exists
            try {
                await fs.access(thumbnailPath);
            } catch (error) {
                this.handleError(res, new Error('Thumbnail file not found'), 'Thumbnail file not found', 404);
                return;
            }

            // Set appropriate headers
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Content-Disposition', `inline; filename="${fileId}-thumbnail.jpg"`);
            res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

            // Stream the thumbnail file
            const fileStream = createReadStream(thumbnailPath);

            fileStream.on('error', (error: any) => {
                logger.error("Error streaming thumbnail:", error);
                if (!res.headersSent) {
                    this.handleError(res, error, 'Failed to stream thumbnail', 500);
                }
            });

            fileStream.pipe(res);

        } catch (error: any) {
            logger.error("Error getting thumbnail:", error);
            if (!res.headersSent) {
                this.handleError(res, error, 'Failed to get thumbnail', 500);
            }
        }
    }

    // Batch thumbnail generation endpoint
    public generateThumbnails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            const userId = req.user.userId;
            const { fileIds } = req.body;

            if (!Array.isArray(fileIds) || fileIds.length === 0) {
                this.handleError(res, new Error('Invalid file IDs'), 'File IDs array is required', 400);
                return;
            }

            // Get files from database
            const files = await prisma.file.findMany({
                where: {
                    id: { in: fileIds },
                    userId,
                    isDeleted: false,
                    isFolder: false, // Skip folders
                },
            });

            const results = [];

            // Generate thumbnails concurrently (limit to 5 at a time to avoid overwhelming the system)
            const batchSize = 5;
            for (let i = 0; i < files.length; i += batchSize) {
                const batch = files.slice(i, i + batchSize);
                const batchPromises = batch.map(async (file) => {
                    try {
                        const thumbnailPath = await this.generateThumbnailForFile(file, userId);
                        return {
                            fileId: file.id,
                            success: !!thumbnailPath,
                            thumbnailPath: thumbnailPath || null,
                            error: null
                        };
                    } catch (error) {
                        return {
                            fileId: file.id,
                            success: false,
                            thumbnailPath: null,
                            error: error instanceof Error ? error.message : 'Unknown error'
                        };
                    }
                });

                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);
            }

            const response: ApiResponse<any> = {
                success: true,
                data: {
                    results,
                    totalProcessed: results.length,
                    successful: results.filter(r => r.success).length,
                    failed: results.filter(r => !r.success).length
                }
            };

            res.status(200).json(response);

        } catch (error: any) {
            logger.error("Error generating thumbnails:", error);
            this.handleError(res, error, 'Failed to generate thumbnails', 500);
        }
    }

    // public getFoldersWithParams = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
    //     try {
    //         const userId = (req as any).user?.userId;
    //         if (!userId) {
    //             this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
    //             return;
    //         }

    //         const { error, value: query } = getFoldersQuerySchema.validate(req.query);
    //         if (error) {
    //             this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
    //             return;
    //         }
    //         // Transform string values to numbers
    //         query.page = parseInt(query.page);
    //         query.limit = parseInt(query.limit);
    //         const params: GetFoldersParams = {
    //             userId,
    //             parentId: query.parentId,
    //             search: query.search,
    //             page: query.page,
    //             limit: query.limit,
    //         };

    //         const folders = await fileService.getFolders(params);

    //         return this.sendPaginatedResponse(
    //             res,
    //             folders.items,
    //             {
    //                 total: folders.total,
    //                 hasMore: folders.hasMore!,
    //                 page: folders.page,
    //                 limit: folders.limit,
    //             },
    //             "Folders retrieved successfully"
    //         );
    //     } catch (error: any) {
    //         console.error('Error getting approval status:', error);
    //         this.handleError(res, error, 'Failed to create folder');
    //     }
    // }

    public moveFile = async (req: Request, res: ServerResponse): Promise<void> => {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) {
                this.handleError(res, new Error("User not authenticated"), "Authentication required", 401);
                return;
            }

            console.log(" ######################## ");
            console.log(req.body);
            console.log(" ######################## ");

            // Validate input using Joi
            const { error, value } = moveFileSchema.validate(
                {
                    fileId: req.params.fileId,
                    destinationId: req.body.destinationId,
                },
                { abortEarly: false }
            );

            if (error) {
                throw new Error(error.details.map((d) => d.message).join(", "));
            }

            const { fileId, destinationId } = value;

            await fileService.moveFile(fileId, destinationId, userId);

            const response: ApiResponse<null> = { success: true, data: null };

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(response, null, 2));
        } catch (error: any) {
            logger.error("Error moving file:", error);
            this.handleError(res, error, "Failed to move file"); // Updated error message for clarity
        }
    }

    public getSharedFileV1 = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
        try {

            console.log(" 00000000000000 ");

            const token = req.params?.token as string;


            console.log(" 00000000000000 ");
            console.log(token);
            console.log(" 00000000000000 ");

            const sharedFile = await prisma.sharedFile.findFirst({
                where: {
                    shareToken: token,
                    isActive: true,
                    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                },
                include: {
                    file: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    shareUsers: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!sharedFile) {
                // Already handled with handleError function
                this.handleError(res, new Error("Share not found or expired"), "Share not found or expired", 403);
                return;
            }

            // Check password if required

            console.log(" 11111111111111111 ");
            // Log access
            // await prisma.shareAccessLog.create({
            //     data: {
            //         action: "VIEW",
            //         ipAddress: req.ip! || "unknown",
            //         userAgent: req.get("User-Agent") || "unknown",
            //         sharedFileId: sharedFile?.id,
            //         fileId: sharedFile?.fileId,
            //     },
            // });
            console.log(" 22222222222222222222 ");
            // Update access count and last accessed
            await prisma.sharedFile.update({
                where: { id: sharedFile?.id },
                data: {
                    accessCount: { increment: 1 },
                    lastAccessedAt: new Date(),
                },
            });
            console.log(" 3333333333333333333333 ");
            const isExpired = sharedFile?.expiresAt ? new Date() > sharedFile.expiresAt : false;

            const response = {
                id: sharedFile?.id,
                file: {
                    id: sharedFile?.file.id,
                    filePath: sharedFile?.file.filePath,
                    fileType: sharedFile?.file.fileType,
                    isFolder: sharedFile?.file.isFolder,
                    fileSize: sharedFile?.file.fileSize?.toString(),
                    mimeType: sharedFile?.file.mimeType,
                    fileName: sharedFile?.file.fileName,

                },
                shareType: sharedFile?.shareType,
                permission: sharedFile?.permission,
                expiresAt: sharedFile?.expiresAt,
                isExpired: isExpired,
                isActive: sharedFile?.isActive,
                //  shareUrl: sharedFile ?.sharedUrl,
                createdAt: sharedFile?.createdAt,
                sharedBy: sharedFile?.user,
                allowDownload: sharedFile?.allowDownload,
                requireApproval: sharedFile?.requireApproval || false,
                watermark: sharedFile?.watermark || false,
                password: sharedFile?.password ? true : false, // Only indicate if password exists, not the actual password
                message: sharedFile?.message,
                sharedWith: sharedFile?.shareUsers.map((sw) => ({
                    user: sw.user,
                    permission: sw.permission,
                    accessedAt: sw.accessedAt,
                })),
            };
            console.log(" 444444444444444444 ");
            console.log(response);
            console.log(" 444444444444444444 ");

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {

            console.log(" 444444 EEEEEEEEEEEEE 444444444444 ");
            console.log(error);
            console.log(" 444444 EEEEEEEEEEEEE 444444444444 ");

            console.error("Error fetching public share:", error);
            this.handleError(res, error, "Failed to move file"); // Updated error message for clarity
        }
    }

    public getSharedFile = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
        try {

            const token = req.params?.token as string;

            const sharedFile = await prisma.fileLink.findFirst({
                where: {
                    token: token,
                    isActive: true,
                    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                },
                include: {
                    file: true,
                },
            });


            if (!sharedFile) {
                // Already handled with handleError function
                this.handleError(res, new Error("Share not found or expired"), "Share not found or expired", 403);
                return;
            }


            // Update access count and last accessed
            await prisma.fileLink.update({
                where: { id: sharedFile?.id },
                data: {
                    accessCount: { increment: 1 },
                    lastAccessedAt: new Date(),
                },
            });

            const isExpired = sharedFile?.expiresAt ? new Date() > sharedFile.expiresAt : false;

            const response = {
                id: sharedFile?.id,
                file: {
                    id: sharedFile?.file.id,
                    filePath: sharedFile?.file.filePath,
                    fileType: sharedFile?.file.fileType,
                    isFolder: sharedFile?.file.isFolder,
                    fileSize: sharedFile?.file.fileSize?.toString(),
                    mimeType: sharedFile?.file.mimeType,
                    fileName: sharedFile?.file.fileName,

                },
                shareType: sharedFile?.shareType,
                permission: sharedFile?.permission,
                expiresAt: sharedFile?.expiresAt,
                isExpired: isExpired,
                isActive: sharedFile?.isActive,
                //  shareUrl: sharedFile ?.sharedUrl,
                createdAt: sharedFile?.createdAt,
                // sharedBy: sharedFile?.user,
                allowDownload: sharedFile?.allowDownload,
                // requireApproval: sharedFile?.requireApproval || false,
                // watermark: sharedFile?.watermark || false,
                password: sharedFile?.password ? true : false, // Only indicate if password exists, not the actual password

            };


            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {


            console.error("Error fetching public share:", error);
            this.handleError(res, error, "Failed to move file"); // Updated error message for clarity
        }
    }
    // public getFolderList = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
    //     try {
    //         const userId = req.user?.userId;
    //         if (!userId) {
    //             this.handleError(res, new Error("User not authenticated"), "Authentication required", 401);
    //             return;
    //         }



    //         // Validate query parameters using Joi
    //         const { error, value: query } = getFoldersQuerySchema.validate(req.query, { abortEarly: false });
    //         if (error) {
    //             this.handleError(
    //                 res,
    //                 new Error("Invalid query parameters"),
    //                 `Invalid query parameters: ${error.details.map((d) => d.message).join(", ")}`,
    //                 400
    //             );
    //             return;
    //         }

    //         const params: GetFoldersParams = {
    //             userId,
    //             parentId: query.parentId,
    //             search: query.search,
    //             page: query.page,
    //             limit: query.limit,
    //         };

    //         const folders = await fileService.getFolders(params);
    //         console.log(" ========getFolderList============= ");
    //         console.log(folders);
    //         console.log(" ========getFolderList============= ");
    //         const response = {
    //             success: true,
    //             data: {
    //                 items: folders.items,
    //                 total: folders.total,
    //                 hasMore: folders.hasMore,
    //                 page: folders.page,
    //                 limit: folders.limit,
    //             },
    //         };

    //         res.writeHead(200, { "Content-Type": "application/json" });
    //         res.end(JSON.stringify(response, null, 2));
    //     } catch (error: any) {
    //         console.error("Error retrieving folders:", error);
    //         this.handleError(res, error, error.message || "Failed to retrieve folders", error.status || 500);
    //     }
    // }



    public getDashboardStats = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
        try {

            if (!req.user) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            const userId = req.user.userId;

            const stats = await fileService.getUserDashboardStats(userId!);

            const response: ApiResponse<DashboardStats> = {
                success: true,
                data: stats,

            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error: any) {
            console.error('Error getting approval status:', error);
            this.handleError(res, error, 'Failed to create folder');
        }
    }


    public getFileList = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) {
                // The AuthMiddleware should ideally catch this, but this is a good safeguard.
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }


            const { value: query } = getFilesQuerySchema.validate(req.query, {
                // Best practice: allow Joi to convert types automatically
                convert: true,
            });

            // Transform string values to numbers
            query.page = parseInt(query.page);
            query.limit = parseInt(query.limit);
            query.isDeleted = query.isDeleted === 'true';
            const files = await fileService.getFileList(userId, query);

            // console.log(" +++++++++++getFileList+++++++++++++ ")
            // console.log(files)
            // console.log(" +++++++++getFileList+++++++++++++++ ")

            const fileListResponse = {
                files: files.items,
                totalCount: files.total,
                totalPages: Math.ceil(files.total / query.limit),
                currentPage: query.page,
                hasNextPage: files.hasMore,
                hasPreviousPage: query.page > 1
            };

            const response: ApiResponse<typeof fileListResponse> = {
                success: true,
                data: fileListResponse,

            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error: any) {
            this.handleError(res, error, 'Failed to retrieve user statistics');
        }
    }

    public getUserStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            // Only admins can view user statistics
            if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
                this.handleError(res, new Error('Insufficient permissions'), 'Insufficient permissions', 403);
                return;
            }

            // Mock stats for now
            const stats = {
                totalUsers: 0,
                activeUsers: 0,
                inactiveUsers: 0
            };

            const response: ApiResponse<any> = {
                success: true,
                data: { stats },
                metadata: {
                    timestamp: new Date(),
                    requestId: res.locals?.requestId || 'unknown',
                    message: 'User statistics retrieved successfully'
                }
            };


            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {
            this.handleError(res, error, 'Failed to retrieve user statistics');
        }
    }

    public requestAccess = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
        try {

            console.log(" 0000000000000000000000 ")

            const shareToken = req.params?.shareToken as string;
            const { message } = req.body;
            const userId = req.user?.userId;



            console.log(" ++++++++++++++++++++++++ ")
            console.log(userId)
            console.log(message)
            console.log(shareToken)
            console.log(" ++++++++++++++++++++++++ ")
            if (!userId) {

                this.handleError(res, new Error('Authentication required to request access'), 'Authentication required to request access', 401);
                return;
            }

            // Find the shared file
            const sharedFile = await prisma.sharedFile.findFirst({
                where: {
                    shareToken,
                    isActive: true,
                    requireApproval: true,
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: new Date() } }
                    ]
                },
                include: {
                    file: true,
                    user: true
                }
            });

            if (!sharedFile) {
                this.handleError(res, new Error("Share not found or does not require approval"), "Share not found or does not require approval", 404);
                return;
            }

            // Check if user already has access
            const existingAccess = await prisma.shareUser.findFirst({
                where: {
                    sharedFileId: sharedFile.id,
                    userId
                }
            });

            // if (existingAccess) {
            //     this.handleError(res, new Error("You already have access to this file"), "You already have access to this file", 400);
            //     return;
            // }

            // Check if approval request already exists
            const existingRequest = await prisma.shareApproval.findFirst({
                where: {
                    sharedFileId: sharedFile.id,
                    requesterId: userId
                }
            });

            if (existingRequest) {
                if (existingRequest.status === 'PENDING') {
                    this.handleError(res, new Error("Approval request already pending"), "Approval request already pending", 400);
                    return;
                }
                if (existingRequest.status === 'APPROVED') {
                    this.handleError(res, new Error("Access already approved"), "Access already approved", 400);
                    return;
                }
            }

            // Create or update approval request
            const approval = await prisma.shareApproval.upsert({
                where: {
                    sharedFileId_requesterId: {
                        sharedFileId: sharedFile.id,
                        requesterId: userId!
                    }
                },
                update: {
                    status: 'PENDING',
                    requestMessage: message,
                    responseMessage: null,
                    approvedAt: null,
                    rejectedAt: null
                },
                create: {
                    sharedFileId: sharedFile.id,
                    requesterId: userId,
                    approverId: sharedFile.userId,
                    requestMessage: message,
                    status: 'PENDING'
                }
            });

            // Send email notification to file owner
            try {
                const emailService = EmailServiceFactory.create();
                const requester = await prisma.user.findUnique({
                    where: { id: userId }
                });

                const requesterName = requester?.firstName || requester?.lastName
                    ? `${requester?.firstName || ""} ${requester?.lastName || ""}`.trim()
                    : requester?.email || "Someone";

                const accessRequestData: ShareAccessRequestEmailData = {
                    fileName: sharedFile.file.fileName,
                    requesterName,
                    requesterEmail: requester?.email || "",
                    message: message || "",
                    recipientName: sharedFile.user.firstName || sharedFile.user.lastName
                        ? `${sharedFile.user.firstName || ""} ${sharedFile.user.lastName || ""}`.trim()
                        : sharedFile.user.email,
                    fileSize: sharedFile.file.fileSize?.toString() || "Unknown",
                    fileType: sharedFile.file.mimeType || "Unknown",
                    approvalUrl: `${process.env.FRONTEND_URL}/approval/${approval.id}`,
                    requestedAt: new Date()
                };

                await emailService.sendShareAccessRequestEmail(sharedFile.user.email, accessRequestData);
            } catch (emailError) {
                console.error('Failed to send approval notification email:', emailError);
                // Don't fail the request process if email fails
            }

            const response = {
                success: true,
                message: 'Access request submitted successfully',
                approvalId: approval.id
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));

        } catch (error) {
            console.error('Error requesting access:', error);
            this.handleError(res, error, 'Failed to request access');
        }
    }

    // Get user's approval requests
    public getMyApprovalRequests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId;

            const requests = await prisma.shareApproval.findMany({
                where: {
                    requesterId: userId
                },
                include: {
                    sharedFile: {
                        include: {
                            file: true
                        }
                    },
                    approver: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            const response = requests.map(request => ({
                id: request.id,
                status: request.status,
                requestMessage: request.requestMessage,
                responseMessage: request.responseMessage,
                approvedAt: request.approvedAt,
                rejectedAt: request.rejectedAt,
                approver: request.approver,
                sharedFile: {
                    id: request.sharedFile.id,
                    file: request.sharedFile.file,
                    shareToken: request.sharedFile.shareToken,
                    permission: request.sharedFile.permission,
                    message: request.sharedFile.message
                },
                createdAt: request.createdAt
            }));


            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {
            console.error('Error fetching approval requests:', error);
            this.handleError(res, error, 'Failed to fetch requests');
        }
    }

    // Get pending approvals for user's files
    public getPendingApprovals = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId;

            const approvals = await prisma.shareApproval.findMany({
                where: {
                    approverId: userId,
                    status: 'PENDING'
                },
                include: {
                    requester: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    sharedFile: {
                        include: {
                            file: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            const response = approvals.map(approval => ({
                id: approval.id,
                status: approval.status,
                requestMessage: approval.requestMessage,
                requester: approval.requester,
                sharedFile: {
                    id: approval.sharedFile.id,
                    file: approval.sharedFile.file,
                    shareToken: approval.sharedFile.shareToken,
                    permission: approval.sharedFile.permission,
                    message: approval.sharedFile.message
                },
                createdAt: approval.createdAt
            }));

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {
            console.error('Error fetching pending approvals:', error);
            this.handleError(res, error, 'Failed to fetch approvals');
        }
    }

    // Handle approval (approve/reject)
    public handleApproval = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const approvalId = req.params?.approvalId as string;
            const action = req.params?.action as string; // action: 'approve' or 'reject'
            const { message } = req.body;
            const userId = req.user!.userId;

            const approval = await prisma.shareApproval.findFirst({
                where: {
                    id: approvalId,
                    approverId: userId,
                    status: 'PENDING'
                },
                include: {
                    requester: true,
                    sharedFile: {
                        include: {
                            file: true
                        }
                    }
                }
            });

            if (!approval) {
                this.handleError(res, new Error("Approval request not found"), "Approval request not found", 404);
                return;
            }

            const isApprove = action === 'approve';
            const updateData: any = {
                status: isApprove ? 'APPROVED' : 'REJECTED',
                responseMessage: message
            };

            if (isApprove) {
                updateData.approvedAt = new Date();

                // Grant access to the file
                // Map SharePermission to FilePermission
                const mapSharePermissionToFilePermission = (sharePermission: string) => {
                    switch (sharePermission) {
                        case 'READ':
                        case 'VIEW':
                            return 'VIEW';
                        case 'WRITE':
                        case 'EDIT':
                            return 'EDIT';
                        case 'ADMIN':
                            return 'ADMIN';
                        case 'COMMENT':
                            return 'COMMENT';
                        case 'SHARE':
                            return 'SHARE';
                        case 'DELETE':
                            return 'DELETE';
                        case 'DOWNLOAD':
                            return 'DOWNLOAD';
                        case 'SUPER_ADMIN':
                            return 'SUPER_ADMIN';
                        default:
                            return 'VIEW'; // Default fallback
                    }
                };

                await prisma.shareUser.create({
                    data: {
                        sharedFileId: approval.sharedFileId,
                        userId: approval.requesterId,
                        permission: mapSharePermissionToFilePermission(approval.sharedFile.permission) as any
                    }
                });
            } else {
                updateData.rejectedAt = new Date();
            }

            await prisma.shareApproval.update({
                where: { id: approvalId },
                data: updateData
            });

            // Send email notification to requester
            try {
                const emailService = EmailServiceFactory.create();
                const emailData = {
                    fileName: approval.sharedFile.file.fileName,
                    approved: isApprove,
                    message,
                    shareUrl: isApprove ? `${process.env.FRONTEND_URL}/share/${approval.sharedFile.shareToken}` : undefined,
                    recipientName: approval.requester.firstName || approval.requester.lastName
                        ? `${approval.requester.firstName || ""} ${approval.requester.lastName || ""}`.trim()
                        : approval.requester.email,
                };

                await emailService.sendApprovalResponseEmail(approval.requester.email, emailData);
            } catch (emailError) {
                console.error('Failed to send approval response email:', emailError);
                // Don't fail the approval process if email fails
            }

            const response = {
                success: true,
                message: `Access ${isApprove ? 'approved' : 'rejected'} successfully`,
                approvalId
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));

        } catch (error) {
            console.error('Error handling approval:', error);
            this.handleError(res, error, 'Failed to handle approval');
        }
    }

    // Get approval status for a share
    public getApprovalStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const shareToken = req.params?.shareToken as string;
            const userId = (req as any).user?.userId;

            if (!userId) {
                this.handleError(res, new Error("Authentication required"), "Authentication required", 401);
                return;
            }

            const approval = await prisma.shareApproval.findFirst({
                where: {
                    requesterId: userId,
                    sharedFile: {
                        shareToken
                    }
                },
                include: {
                    sharedFile: {
                        include: {
                            file: true
                        }
                    },
                    approver: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                }
            });

            if (!approval) {
                this.handleError(res, new Error("No approval request found"), "No approval request found", 404);
                return;
            }

            const response = {
                id: approval.id,
                status: approval.status,
                requestMessage: approval.requestMessage,
                responseMessage: approval.responseMessage,
                approvedAt: approval.approvedAt,
                rejectedAt: approval.rejectedAt,
                approver: approval.approver,
                sharedFile: {
                    id: approval.sharedFile.id,
                    file: approval.sharedFile.file,
                    shareToken: approval.sharedFile.shareToken,
                    permission: approval.sharedFile.permission,
                    message: approval.sharedFile.message
                },
                createdAt: approval.createdAt
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {
            console.error('Error getting approval status:', error);
            this.handleError(res, error, 'Failed to get approval status');
        }
    }

    public accessSharedFile = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            const { error, value } = accessSharedFileSchema.validate(req.body, { abortEarly: false });
            if (error) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            const { token } = value;
            const password = req.body?.password; // Extract password from request body


            const shareLink = await fileService.accessSharedFile(
                token,
                password,
                (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || (req.headers['x-real-ip'] as string) || req.socket?.remoteAddress || "unknown",
                req.headers["user-agent"]
            );

            const response: ApiResponse<any> = {
                success: true,
                data: shareLink,
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error: any) {
            logger.error("Error accessing shared file:", error);
            this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
        }
    }
    // Share file
    public shareFile = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
        try {
            const fileId = req.params?.fileId as string;
            const userId = (req as any).user?.userId;
            console.log(" =======000000000000000========== ")
            console.log(req.body)
            console.log(" ========000000000000000============= ")

            if (!userId) {
                this.handleError(res, new Error("User not authenticated"), "User not authenticated", 401);
                return;
            }


            console.log(" ======= 11111111111111111111 ========== ")

            const { error, value: validatedData } = shareFileSchema.validate(req.body);
            if (error) {
                this.handleError(res, new Error(error.details[0].message), error.details[0].message, 400);
                return;
            }
            console.log(" ====== 222222222222222222222 ========== ")

            // Check if user owns the file
            const file = await prisma.file.findFirst({
                where: {
                    id: fileId,
                    userId,
                    isDeleted: false,
                },
            });

            if (!file) {
                this.handleError(res, new Error("File not found"), "File not found", 404);
                return;
            }

            // Generate share token
            const shareToken = crypto.randomBytes(32).toString("hex");

            // Hash password if provided
            let hashedPassword: string | undefined;
            if (validatedData.password) {
                hashedPassword = await bcrypt.hash(validatedData.password, 12);
            }

            // Map frontend shareType to database ShareType enum
            const shareTypeMapping: Record<string, string> = {
                'FILE': 'PRIVATE',
                'LINK': 'LINK',
                'DOCUMENT': 'PRIVATE'
            };

            const dbShareType = shareTypeMapping[validatedData.shareType] || 'PRIVATE';

            // Create shared file
            const sharedFile = await prisma.sharedFile.create({
                data: {
                    shareToken,
                    shareType: dbShareType as any,
                    expiresAt: validatedData.expiresAt
                        ? new Date(validatedData.expiresAt)
                        : null,
                    allowDownload: validatedData.allowDownload,
                    requireApproval: validatedData.requireApproval,
                    notifyByEmail: validatedData.notifyByEmail,
                    watermark: validatedData.watermark,
                    password: hashedPassword,
                    sharedBy: userId,
                    message: validatedData.message,
                    fileId,
                    userId,
                },
            });


            // Map frontend permissions to database FilePermission enum
            const permissionMapping: Record<string, string> = {
                'VIEW': 'VIEW',
                'COMMENT': 'VIEW',
                'EDIT': 'EDIT',
                'DOWNLOAD': 'VIEW',
                'ADMIN': 'ADMIN'
            };

            // Add specific users if shareType is 'specific'
            if (validatedData.users) {
                await prisma.shareUser.createMany({
                    data: validatedData.users.map((user: { id: any; permission: any; }) => ({
                        sharedFileId: sharedFile.id,
                        userId: user.id,
                        permission: permissionMapping[user.permission.toUpperCase()] || 'VIEW',
                    })),
                });
            }

            // Update file share status
            await prisma.file.update({
                where: { id: fileId },
                data: {
                    isShared: true,
                    shareCount: { increment: 1 },
                },
            });


            if (validatedData.notifyByEmail && Array.isArray(validatedData.users)
            ) {
                try {
                    const emailService = EmailServiceFactory.create();
                    console.log(" 00000000000000 ");
                    // Get sharer info
                    const sharer = await prisma.user.findUnique({
                        where: { id: userId },
                    });

                    console.log(" 11111111111111111111 ");
                    const sharerName =
                        sharer?.firstName || sharer?.lastName
                            ? `${sharer?.firstName || ""} ${sharer?.lastName || ""}`.trim()
                            : sharer?.email || "Someone";

                    console.log(" 222222222222222222222 ");

                    // Get file info
                    const fileSize = file.fileSize
                        ? `${(Number(file.fileSize) / (1024 * 1024)).toFixed(2)} MB`
                        : undefined;

                    console.log(" 33333333333333333333333 ");

                    const fileType = file.mimeType || undefined;

                    console.log(" 44444444444444444 ");

                    // Send to each recipient
                    for (const user of validatedData.users) {
                        const recipient = await prisma.user.findUnique({
                            where: { id: user.id },
                        });
                        if (!recipient?.email) continue;
                        const recipientName =
                            recipient.firstName || recipient.lastName
                                ? `${recipient.firstName || ""} ${recipient.lastName || ""}`.trim()
                                : recipient.email;
                        const emailData: ShareNotificationEmailData = {
                            fileName: file.fileName,
                            sharedBy: sharerName,
                            message: validatedData.message,
                            shareUrl: `${process.env.FRONTEND_URL}/share/${shareToken}`,
                            fileSize,
                            fileType,
                            expiresAt: sharedFile.expiresAt || undefined,
                            recipientName,
                            requireApproval: sharedFile.requireApproval || false,
                        };
                        try {
                            await emailService.sendShareNotificationEmail(recipient.email, emailData);
                        } catch (err) {
                            console.error(
                                "Failed to send share notification email to",
                                recipient.email,
                                err
                            );
                        }
                    }
                } catch (err) {
                    console.error("Failed to send share notification emails:", err);
                }
            }

            const shareUrl = `${process.env.FRONTEND_URL}/share/${shareToken}`;

            // console.log(" ++++++++++++++++++++++++++++++ ");
            // console.log(sharedFile);
            // console.log(shareUrl);
            // console.log(" ++++++++++++++++++++++++++++++ ");

            const response = {
                success: true,
                shareId: sharedFile.id,
                shareUrl,
                message: "File shared successfully",
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {
            console.error("Error sharing file:", error);
            this.handleError(res, error, "Failed to share file");
        }
    }
    // public shareFile = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
    //     try {
    //         const fileId = req.params?.fileId as string;
    //         const userId = (req as any).user?.userId;
    //         console.log(" =======000000000000000========== ")
    //         console.log(req.body)
    //         console.log(" ========000000000000000============= ")

    //         if (!userId) {
    //             this.handleError(res, new Error("User not authenticated"), "User not authenticated", 401);
    //             return;
    //         }


    //         console.log(" ======= 11111111111111111111 ========== ")

    //         const { error, value: validatedData } = shareFileSchema.validate(req.body);
    //         if (error) {
    //             this.handleError(res, new Error(error.details[0].message), error.details[0].message, 400);
    //             return;
    //         }
    //         console.log(" ====== 222222222222222222222 ========== ")

    //         // Check if user owns the file
    //         const file = await prisma.file.findFirst({
    //             where: {
    //                 id: fileId,
    //                 userId,
    //                 isDeleted: false,
    //             },
    //         });

    //         if (!file) {
    //             this.handleError(res, new Error("File not found"), "File not found", 404);
    //             return;
    //         }

    //         // Generate share token
    //         const shareToken = crypto.randomBytes(32).toString("hex");

    //         // Hash password if provided
    //         let hashedPassword: string | undefined;
    //         if (validatedData.password) {
    //             hashedPassword = await bcrypt.hash(validatedData.password, 12);
    //         }



    //         //    const dbPermission = permissionMapping[validatedData.permission.toUpperCase()] || 'read';

    //         // Create shared file
    //         const sharedFile = await prisma.sharedFile.create({
    //             data: {
    //                 shareToken,
    //                 shareType: validatedData.shareType,
    //                 //  permission: dbPermission.toUpperCase() as any,
    //                 expiresAt: validatedData.expiresAt
    //                     ? new Date(validatedData.expiresAt)
    //                     : null,
    //                 allowDownload: validatedData.allowDownload,
    //                 requireApproval: validatedData.requireApproval,
    //                 notifyByEmail: validatedData.notifyByEmail,
    //                 watermark: validatedData.watermark,
    //                 password: hashedPassword,
    //                 sharedBy: userId,
    //                 message: validatedData.message,
    //                 fileId,
    //                 userId,
    //             },
    //         });


    //         // Map frontend permissions to database SharePermission enum
    //         const permissionMapping: Record<string, string> = {
    //             'VIEW': 'READ',
    //             'COMMENT': 'READ',
    //             'EDIT': 'write',
    //             'DOWNLOAD': 'read',
    //             'ADMIN': 'admin'
    //         };

    //         // Add specific users if shareType is 'specific'
    //         if (validatedData.users) {
    //             await prisma.shareUser.createMany({
    //                 data: validatedData.users.map((user: { id: any; permission: any; }) => ({
    //                     sharedFileId: sharedFile.id,
    //                     userId: user.id,
    //                     permission: (permissionMapping[user.permission.toUpperCase()] || 'read').toUpperCase(),
    //                 })),
    //             });
    //         }

    //         // Update file share status
    //         await prisma.file.update({
    //             where: { id: fileId },
    //             data: {
    //                 isShared: true,
    //                 shareCount: { increment: 1 },
    //             },
    //         });


    //         if (validatedData.notifyByEmail && Array.isArray(validatedData.users)
    //         ) {
    //             try {
    //                 const emailService = EmailServiceFactory.create();
    //                 console.log(" 00000000000000 ");
    //                 // Get sharer info
    //                 const sharer = await prisma.user.findUnique({
    //                     where: { id: userId },
    //                 });

    //                 console.log(" 11111111111111111111 ");
    //                 const sharerName =
    //                     sharer?.firstName || sharer?.lastName
    //                         ? `${sharer?.firstName || ""} ${sharer?.lastName || ""}`.trim()
    //                         : sharer?.email || "Someone";

    //                 console.log(" 222222222222222222222 ");

    //                 // Get file info
    //                 const fileSize = file.fileSize
    //                     ? `${(Number(file.fileSize) / (1024 * 1024)).toFixed(2)} MB`
    //                     : undefined;

    //                 console.log(" 33333333333333333333333 ");

    //                 const fileType = file.mimeType || undefined;

    //                 console.log(" 44444444444444444 ");

    //                 // Send to each recipient
    //                 for (const user of validatedData.users) {
    //                     const recipient = await prisma.user.findUnique({
    //                         where: { id: user.id },
    //                     });
    //                     if (!recipient?.email) continue;
    //                     const recipientName =
    //                         recipient.firstName || recipient.lastName
    //                             ? `${recipient.firstName || ""} ${recipient.lastName || ""}`.trim()
    //                             : recipient.email;
    //                     const emailData: ShareNotificationEmailData = {
    //                         fileName: file.fileName,
    //                         sharedBy: sharerName,
    //                         message: validatedData.message,
    //                         shareUrl: `${process.env.FRONTEND_URL}/share/${shareToken}`,
    //                         fileSize,
    //                         fileType,
    //                         expiresAt: sharedFile.expiresAt || undefined,
    //                         recipientName,
    //                         requireApproval: sharedFile.requireApproval || false,
    //                     };
    //                     try {
    //                         await emailService.sendEmail({
    //                             to: recipient.email,
    //                             subject: `File Shared: ${emailData.fileName}`,
    //                             html: `<p>${emailData.sharedBy} has shared a file with you: ${emailData.fileName}</p><p><a href="${emailData.shareUrl}">View File</a></p>`,
    //                             text: `${emailData.sharedBy} has shared a file with you: ${emailData.fileName}. View at: ${emailData.shareUrl}`,
    //                             metadata: emailData
    //                         });
    //                     } catch (err) {
    //                         console.error(
    //                             "Failed to send share notification email to",
    //                             recipient.email,
    //                             err
    //                         );
    //                     }
    //                 }
    //             } catch (err) {
    //                 console.error("Failed to send share notification emails:", err);
    //             }
    //         }

    //         const shareUrl = `${process.env.FRONTEND_URL}/share/${shareToken}`;

    //         console.log(" ++++++++++++++++++++++++++++++ ");
    //         console.log(sharedFile);
    //         console.log(shareUrl);
    //         console.log(" ++++++++++++++++++++++++++++++ ");

    //         const response = {
    //             success: true,
    //             shareId: sharedFile.id,
    //             shareUrl,
    //             message: "File shared successfully",
    //         };

    //         res.writeHead(200, { 'Content-Type': 'application/json' });
    //         res.end(JSON.stringify(response, null, 2));
    //     } catch (error) {
    //         console.error("Error sharing file:", error);
    //         this.handleError(res, error, "Failed to share file");
    //     }
    // }

    // Get file shares
    public getFileShares = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const fileId = req.params?.fileId as string;
            const userId = req.user!.userId;

            // Verify ownership
            const file = await prisma.file.findFirst({
                where: {
                    id: fileId,
                    userId,
                    isDeleted: false,
                },
            });

            if (!file) {
                this.handleError(res, new Error("File not found"), "File not found", 404);
                return;
            }

            const shares = await prisma.sharedFile.findMany({
                where: {
                    fileId,
                    isActive: true,
                },
                include: {
                    file: true,
                    shareUsers: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            shareAccessLogs: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            });

            const response = shares.map((share) => ({
                id: share.id,
                file: share.file,
                shareType: share.shareType,
                permission: share.permission,
                expiresAt: share.expiresAt,
                isActive: share.isActive,
                shareUrl: `${process.env.FRONTEND_URL}/share/${share.shareToken}`,
                accessCount: share._count.shareAccessLogs,
                createdAt: share.createdAt,
                sharedWith: share.shareUsers.map((sw) => ({
                    user: sw.user,
                    permission: sw.permission,
                    accessedAt: sw.accessedAt,
                })),
            }));

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {
            console.error("Error fetching file shares:", error);
            this.handleError(res, error, "Failed to fetch shares");
        }
    }

    // Get shared with me
    public getSharedWithMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId;

            const sharedFiles = await prisma.shareUser.findMany({
                where: {
                    userId,
                },
                include: {
                    sharedFile: {
                        include: {
                            file: true,
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            });

            const response = sharedFiles.map((sf) => ({
                id: sf.sharedFile.id,
                file: sf.sharedFile.file,
                shareType: sf.sharedFile.shareType,
                permission: sf.permission,
                expiresAt: sf.sharedFile.expiresAt,
                isActive: sf.sharedFile.isActive,
                shareUrl: `${process.env.FRONTEND_URL}/share/${sf.sharedFile.shareToken}`,
                createdAt: sf.sharedFile.createdAt,
                sharedBy: sf.sharedFile.user,
                accessedAt: sf.accessedAt,
            }));

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {
            console.error("Error fetching shared files:", error);
            this.handleError(res, error, "Failed to fetch shared files");
        }
    }

    // Get my shares
    public getMyShares = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId;

            const shares = await prisma.sharedFile.findMany({
                where: {
                    userId,
                    isActive: true,
                },
                include: {
                    file: true,
                    shareUsers: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            shareAccessLogs: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            });

            const response = shares.map((share) => ({
                id: share.id,
                file: share.file,
                shareType: share.shareType,
                permission: share.permission,
                expiresAt: share.expiresAt,
                isActive: share.isActive,
                shareUrl: `${process.env.FRONTEND_URL}/share/${share.shareToken}`,
                accessCount: share._count.shareAccessLogs,
                createdAt: share.createdAt,
                sharedWith: share.shareUsers.map((sw) => ({
                    user: sw.user,
                    permission: sw.permission,
                    accessedAt: sw.accessedAt,
                })),
            }));

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {
            console.error("Error fetching my shares:", error);
            this.handleError(res, error, "Failed to fetch shares");
        }
    }

    // Get public share
    public getPublicShare = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
        try {
            const shareToken = req.params?.shareToken as string;
            const password = req?.query?.password as string;

            console.log(" 00000000000000 ");
            console.log(shareToken);
            console.log(password);
            console.log(" 00000000000000 ");

            const sharedFile = await prisma.sharedFile.findFirst({
                where: {
                    shareToken,
                    isActive: true,
                    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                },
                include: {
                    file: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    shareUsers: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!sharedFile) {
                this.handleError(res, new Error("Share not found or expired"), "Share not found or expired", 404);
                return;
            }

            // Check password if required
            if (sharedFile.password) {
                if (!password) {
                    console.log(" 111111 Password required 11111111111 ");
                    this.handleError(res, new Error("Password required"), "Password required", 401);
                    return;
                }

                const isValidPassword = await bcrypt.compare(
                    password as string,
                    sharedFile.password
                );
                if (!isValidPassword) {
                    this.handleError(res, new Error("Invalid password"), "Invalid password", 401);
                    return;
                }
            }
            console.log(" 11111111111111111 ");
            // Log access
            await prisma.shareAccessLog.create({
                data: {
                    action: "VIEW",
                    ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || (req.headers['x-real-ip'] as string) || req.socket?.remoteAddress || "unknown",
                    userAgent: req.headers["user-agent"] || "unknown",
                    sharedFileId: sharedFile.id,
                    fileId: sharedFile.fileId,
                },
            });
            console.log(" 22222222222222222222 ");
            // Update access count and last accessed
            await prisma.sharedFile.update({
                where: { id: sharedFile.id },
                data: {
                    accessCount: { increment: 1 },
                    lastAccessedAt: new Date(),
                },
            });
            console.log(" 3333333333333333333333 ");
            const response = {
                id: sharedFile.id,
                file: {
                    id: sharedFile.file.id,
                    filePath: sharedFile.file.filePath,
                    fileType: sharedFile.file.fileType,
                    isFolder: sharedFile.file.isFolder,
                    fileSize: sharedFile.file.fileSize?.toString(),
                    mimeType: sharedFile.file.mimeType,
                    fileName: sharedFile.file.fileName,

                },
                shareType: sharedFile.shareType,
                permission: sharedFile.permission,
                expiresAt: sharedFile.expiresAt,
                isActive: sharedFile.isActive,
                shareUrl: `${process.env.FRONTEND_URL}/share/${shareToken}`,
                createdAt: sharedFile.createdAt,
                sharedBy: sharedFile.user,
                allowDownload: sharedFile.allowDownload,
                message: sharedFile.message,
                sharedWith: sharedFile.shareUsers.map((sw) => ({
                    user: sw.user,
                    permission: sw.permission,
                    accessedAt: sw.accessedAt,
                })),
            };
            console.log(" 444444444444444444 ");
            console.log(response);
            console.log(" 444444444444444444 ");

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {

            console.log(" 444444 EEEEEEEEEEEEE 444444444444 ");
            console.log(error);
            console.log(" 444444 EEEEEEEEEEEEE 444444444444 ");

            console.error("Error fetching public share:", error);
            this.handleError(res, error, "Failed to fetch share");
        }
    }

    // Update share permission
    public updateSharePermission = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const shareId = req.params?.shareId as string;
            const { permission } = req.body;
            const userId = req.user!.userId;

            // Verify ownership
            const sharedFile = await prisma.sharedFile.findFirst({
                where: {
                    id: shareId,
                    userId,
                },
            });

            if (!sharedFile) {
                this.handleError(res, new Error("Share not found"), "Share not found", 404);
                return;
            }

            await prisma.sharedFile.update({
                where: { id: shareId },
                data: { permission },
            });

            const response = { success: true, message: "Permission updated successfully" };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {
            console.error("Error updating share permission:", error);
            this.handleError(res, error, "Failed to update permission");
        }
    }

    // Revoke share
    public revokeShare = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const shareId = req.params?.shareId as string;
            const userId = req.user!.userId;

            // Verify ownership
            const sharedFile = await prisma.sharedFile.findFirst({
                where: {
                    id: shareId,
                    userId,
                },
            });

            if (!sharedFile) {
                this.handleError(res, new Error("Share not found"), "Share not found", 404);
                return;
            }

            await prisma.sharedFile.update({
                where: { id: shareId },
                data: { isActive: false },
            });

            const response = { success: true, message: "Share revoked successfully" };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {
            console.error("Error revoking share:", error);
            this.handleError(res, error, "Failed to revoke share");
        }
    }

    // Verify share password
    public verifySharePassword = async (req: AuthenticatedRequest, res: ServerResponse) => {
        try {
            const shareToken = req.params?.shareToken as string;
            const password = req.body?.password as string;

            if (!password) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Password is required" }));
                return;
            }

            const sharedFile = await prisma.sharedFile.findFirst({
                where: {
                    shareToken,
                    isActive: true,
                    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                },
            });

            if (!sharedFile) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Share not found or expired" }));
                return;
            }

            if (!sharedFile.password) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "This share does not require a password" }));
                return;
            }

            const isPasswordValid = await bcrypt.compare(password, sharedFile.password);
            if (!isPasswordValid) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Invalid password" }));
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: "Password verified successfully",
                verified: true
            }));
        } catch (error) {
            console.error("Error verifying share password:", error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Failed to verify password" }));
        }
    }

    private handleError(res: ServerResponse | Response, error: unknown, defaultMessage: string, statusCode = 500): void {
        const message = error instanceof Error ? error.message : defaultMessage;

        const response: ApiResponse = {
            success: false,
            error: defaultMessage,
            message,
            timestamp: new Date().toISOString()
        };

        console.error(`[FileController] ${defaultMessage}:`, error);

        if ('writeHead' in res) {
            // ServerResponse
            res.writeHead(statusCode, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } else {
            // Express Response
            (res as any).status(statusCode).json(response);
        }
    }

    private sendErrorResponse(res: ServerResponse | Response, message: string, _code: string, statusCode: number, details?: string): void {
        const response: ApiResponse = {
            success: false,
            error: message,
            message: details || message,
            // code,
            timestamp: new Date().toISOString()
        };

        console.error(`[FileController] ${message}:`, details);

        if ('writeHead' in res) {
            // ServerResponse
            res.writeHead(statusCode, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } else {
            // Express Response (assuming 'res' is an Express Response object here)
            (res as Response).status(statusCode).json(response);
        }
    }

    private sendPaginatedResponse<T>(
        res: ServerResponse | Response,
        data: T[],
        pagination: {
            total: number;
            hasMore: boolean;
            page: number;
            limit: number;
        },
        message: string
    ): void {
        const response: ApiResponse<{
            items: T[];
            pagination: typeof pagination;
        }> = {
            success: true,
            data: {
                items: data,
                pagination
            },
            metadata: {
                timestamp: new Date(),
                message,
                requestId: ""
            }
        };

        if ('writeHead' in res) {
            // ServerResponse
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } else {
            // Express Response
            (res as Response).status(200).json(response);
        }
    }

    // File Details Utility Methods
    private async extractFileMetadata(file: any): Promise<any> {
        try {
            if (!file.filePath || file.isFolder) {
                return null;
            }

            // Check if file exists
            try {
                await fs.access(file.filePath);
            } catch {
                return { error: 'File not accessible' };
            }

            const stats = await fs.stat(file.filePath);
            const mimeType = file.mimeType || mime.lookup(file.fileName) || 'application/octet-stream';

            const metadata: any = {
                diskSize: stats.size,
                actualSize: Number(file.fileSize || stats.size),
                lastModified: stats.mtime,
                lastAccessed: stats.atime,
                created: stats.birthtime,
                permissions: {
                    readable: true,
                    writable: true,
                    executable: false
                }
            };

            // Extract type-specific metadata
            if (mimeType.startsWith('image/')) {
                metadata.imageMetadata = await this.extractImageMetadata(file.filePath);
            } else if (mimeType.startsWith('video/')) {
                metadata.videoMetadata = await this.extractVideoMetadata(file.filePath);
            } else if (mimeType.startsWith('audio/')) {
                metadata.audioMetadata = await this.extractAudioMetadata(file.filePath);
            } else if (mimeType === 'application/pdf') {
                metadata.documentMetadata = await this.extractPDFMetadata(file.filePath);
            }

            return metadata;
        } catch (error) {
            logger.error('Error extracting file metadata:', error);
            return { error: 'Failed to extract metadata' };
        }
    }

    private async extractImageMetadata(filePath: string): Promise<any> {
        try {
            const imageMetadata = await sharp(filePath).metadata();
            return {
                width: imageMetadata.width,
                height: imageMetadata.height,
                format: imageMetadata.format,
                colorSpace: imageMetadata.space,
                channels: imageMetadata.channels,
                density: imageMetadata.density,
                hasAlpha: imageMetadata.hasAlpha,
                orientation: imageMetadata.orientation,
                aspectRatio: imageMetadata.width && imageMetadata.height ?
                    (imageMetadata.width / imageMetadata.height).toFixed(2) : null,
                megapixels: imageMetadata.width && imageMetadata.height ?
                    ((imageMetadata.width * imageMetadata.height) / 1000000).toFixed(1) : null
            };
        } catch (error) {
            return { error: 'Failed to extract image metadata' };
        }
    }

    private async extractVideoMetadata(filePath: string): Promise<any> {
        return new Promise((resolve) => {
            const ffprobe = spawn('ffprobe', [
                '-v', 'quiet',
                '-print_format', 'json',
                '-show_format',
                '-show_streams',
                filePath
            ]);

            let output = '';
            ffprobe.stdout.on('data', (data) => {
                output += data.toString();
            });

            ffprobe.on('close', (code) => {
                if (code === 0) {
                    try {
                        const metadata = JSON.parse(output);
                        const videoStream = metadata.streams?.find((s: any) => s.codec_type === 'video');
                        const audioStream = metadata.streams?.find((s: any) => s.codec_type === 'audio');

                        resolve({
                            duration: parseFloat(metadata.format?.duration || 0),
                            bitrate: parseInt(metadata.format?.bit_rate || 0),
                            video: videoStream ? {
                                codec: videoStream.codec_name,
                                width: videoStream.width,
                                height: videoStream.height,
                                frameRate: eval(videoStream.r_frame_rate) || 0,
                                aspectRatio: videoStream.display_aspect_ratio
                            } : null,
                            audio: audioStream ? {
                                codec: audioStream.codec_name,
                                sampleRate: audioStream.sample_rate,
                                channels: audioStream.channels,
                                bitrate: audioStream.bit_rate
                            } : null
                        });
                    } catch (parseError) {
                        resolve({ error: 'Failed to parse video metadata' });
                    }
                } else {
                    resolve({ error: 'Failed to extract video metadata' });
                }
            });
        });
    }

    private async extractAudioMetadata(filePath: string): Promise<any> {
        return new Promise((resolve) => {
            const ffprobe = spawn('ffprobe', [
                '-v', 'quiet',
                '-print_format', 'json',
                '-show_format',
                '-show_streams',
                filePath
            ]);

            let output = '';
            ffprobe.stdout.on('data', (data) => {
                output += data.toString();
            });

            ffprobe.on('close', (code) => {
                if (code === 0) {
                    try {
                        const metadata = JSON.parse(output);
                        const audioStream = metadata.streams?.find((s: any) => s.codec_type === 'audio');

                        resolve({
                            duration: parseFloat(metadata.format?.duration || 0),
                            bitrate: parseInt(metadata.format?.bit_rate || 0),
                            codec: audioStream?.codec_name,
                            sampleRate: audioStream?.sample_rate,
                            channels: audioStream?.channels,
                            title: metadata.format?.tags?.title,
                            artist: metadata.format?.tags?.artist,
                            album: metadata.format?.tags?.album,
                            year: metadata.format?.tags?.date
                        });
                    } catch (parseError) {
                        resolve({ error: 'Failed to parse audio metadata' });
                    }
                } else {
                    resolve({ error: 'Failed to extract audio metadata' });
                }
            });
        });
    }

    private async extractPDFMetadata(filePath: string): Promise<any> {
        return new Promise((resolve) => {
            const pdfinfo = spawn('pdfinfo', [filePath]);

            let output = '';
            pdfinfo.stdout.on('data', (data) => {
                output += data.toString();
            });

            pdfinfo.on('close', (code) => {
                if (code === 0) {
                    const metadata: any = {};
                    output.split('\n').forEach(line => {
                        const [key, ...valueParts] = line.split(':');
                        if (key && valueParts.length) {
                            const value = valueParts.join(':').trim();
                            metadata[key.trim().toLowerCase().replace(/\s+/g, '_')] = value;
                        }
                    });

                    resolve({
                        pages: parseInt(metadata.pages || 0),
                        title: metadata.title,
                        author: metadata.author,
                        subject: metadata.subject,
                        creator: metadata.creator,
                        producer: metadata.producer,
                        creationDate: metadata.creationdate,
                        modificationDate: metadata.moddate,
                        pageSize: metadata.page_size,
                        encrypted: metadata.encrypted === 'yes'
                    });
                } else {
                    resolve({ error: 'Failed to extract PDF metadata' });
                }
            });
        });
    }

    private async getFileStatistics(file: any): Promise<any> {
        try {
            // Get share statistics
            const shareStats = await prisma.sharedFile.aggregate({
                where: { fileId: file.id, isActive: true },
                _count: { id: true },
                _sum: { accessCount: true }
            });

            return {
                shareCount: shareStats._count.id || 0,
                totalViews: shareStats._sum.accessCount || 0,
                isPopular: (shareStats._sum.accessCount || 0) > 10,
                daysSinceCreation: Math.floor(
                    (Date.now() - new Date(file.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                ),
                lastActivityDays: file.lastAccessedAt ?
                    Math.floor((Date.now() - new Date(file.lastAccessedAt).getTime()) / (1000 * 60 * 60 * 24)) :
                    null
            };
        } catch (error) {
            logger.error('Error getting file statistics:', error);
            return {};
        }
    }

    private async getShareInformation(file: any): Promise<any> {
        try {
            const activeShares = file.sharedFiles?.filter((share: any) => share.isActive) || [];
            const activeLinks = file.links?.filter((link: any) => link.isActive) || [];

            return {
                isShared: file.isShared,
                shareCount: activeShares.length,
                linkCount: activeLinks.length,
                shares: activeShares.map((share: any) => ({
                    id: share.id,
                    shareType: share.shareType,
                    permission: share.permission,
                    createdAt: share.createdAt,
                    expiresAt: share.expiresAt,
                    accessCount: share.accessCount,
                    lastAccessedAt: share.lastAccessedAt,
                    sharedWith: share.shareUsers?.map((su: any) => ({
                        user: {
                            id: su.user.id,
                            name: this.getDisplayName(su.user),
                            email: su.user.email
                        },
                        permission: su.permission,
                        accessedAt: su.accessedAt
                    })) || []
                })),
                links: activeLinks.map((link: any) => ({
                    id: link.id,
                    token: link.token,
                    permission: link.permission,
                    allowDownload: link.allowDownload,
                    maxDownloads: link.maxDownloads,
                    downloadCount: link.downloadCount,
                    createdAt: link.createdAt,
                    expiresAt: link.expiresAt,
                    isPasswordProtected: !!link.password
                }))
            };
        } catch (error) {
            logger.error('Error getting share information:', error);
            return { isShared: false };
        }
    }

    private async getRecentActivity(fileId: string): Promise<any[]> {
        try {
            // Get recent share access logs
            const recentAccess = await prisma.shareAccessLog.findMany({
                where: { fileId },
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    action: true,
                    createdAt: true,
                    ipAddress: true,
                    userAgent: true
                }
            });

            return recentAccess.map(log => ({
                action: log.action,
                timestamp: log.createdAt,
                source: {
                    ip: log.ipAddress,
                    userAgent: this.parseUserAgent(log.userAgent || '')
                }
            }));
        } catch (error) {
            logger.error('Error getting recent activity:', error);
            return [];
        }
    }

    // Utility methods
    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    private getFileSizeCategory(bytes: number): string {
        if (bytes < 1024) return 'tiny';
        if (bytes < 1024 * 1024) return 'small';
        if (bytes < 10 * 1024 * 1024) return 'medium';
        if (bytes < 100 * 1024 * 1024) return 'large';
        return 'huge';
    }

    private getDisplayName(user: any): string {
        if (user.firstName || user.lastName) {
            return `${user.firstName || ''} ${user.lastName || ''}`.trim();
        }
        return user.email || 'Unknown User';
    }

    private async getBreadcrumbPath(file: any): Promise<any[]> {
        const breadcrumb = [];
        let currentFile = file;

        while (currentFile && currentFile.parentId) {
            const parent = await prisma.file.findUnique({
                where: { id: currentFile.parentId },
                select: { id: true, fileName: true, parentId: true }
            });

            if (parent) {
                breadcrumb.unshift({
                    id: parent.id,
                    name: parent.fileName
                });
                currentFile = parent;
            } else {
                break;
            }
        }

        // Add root
        breadcrumb.unshift({ id: null, name: 'Root' });
        return breadcrumb;
    }

    private anonymizeFilePath(filePath: string): string {
        // Remove sensitive path information, keep only relative structure
        const parts = filePath.split(path.sep);
        const relevantParts = parts.slice(-3); // Keep last 3 parts
        return relevantParts.join('/');
    }

    private async hasSubfolders(folderId: string): Promise<boolean> {
        const count = await prisma.file.count({
            where: {
                parentId: folderId,
                isFolder: true,
                isDeleted: false
            }
        });
        return count > 0;
    }

    private async hasThumbnail(fileId: string, userId: string): Promise<boolean> {
        try {
            const thumbnailDir = await this.ensureThumbnailDirectory(userId);
            const thumbnailPath = path.join(thumbnailDir, `${fileId}.jpg`);
            await fs.access(thumbnailPath);
            return true;
        } catch {
            return false;
        }
    }

    private isPreviewSupported(mimeType: string | null, fileName: string): boolean {
        if (!mimeType) {
            mimeType = mime.lookup(fileName) || '';
        }

        const supportedTypes = [
            // Images
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            // PDFs
            'application/pdf'
        ];

        return supportedTypes.includes(mimeType.toLowerCase());
    }

    private getPreviewType(mimeType: string | null, fileName: string): string {
        if (!mimeType) {
            mimeType = mime.lookup(fileName) || '';
        }

        if (mimeType.startsWith('image/')) {
            return 'image';
        }

        if (mimeType === 'application/pdf') {
            return 'pdf';
        }

        return 'unsupported';
    }

    private parseUserAgent(userAgent: string): any {
        // Simple user agent parsing
        const browser = userAgent.includes('Chrome') ? 'Chrome' :
            userAgent.includes('Firefox') ? 'Firefox' :
                userAgent.includes('Safari') ? 'Safari' :
                    userAgent.includes('Edge') ? 'Edge' : 'Unknown';

        const os = userAgent.includes('Windows') ? 'Windows' :
            userAgent.includes('Mac') ? 'macOS' :
                userAgent.includes('Linux') ? 'Linux' :
                    userAgent.includes('Android') ? 'Android' :
                        userAgent.includes('iOS') ? 'iOS' : 'Unknown';

        return { browser, os };
    }

    // Permission check methods
    private async canUserEdit(userId: string, file: any): Promise<boolean> {
        return file.userId === userId || await this.hasPermission(userId, file.id, 'EDIT');
    }

    private async canUserDelete(userId: string, file: any): Promise<boolean> {
        return file.userId === userId;
    }

    private async canUserShare(userId: string, file: any): Promise<boolean> {
        return file.userId === userId || await this.hasPermission(userId, file.id, 'SHARE');
    }

    private async canUserDownload(userId: string, file: any): Promise<boolean> {
        return file.userId === userId || await this.hasPermission(userId, file.id, 'DOWNLOAD');
    }

    private async canUserMove(userId: string, file: any): Promise<boolean> {
        return file.userId === userId;
    }

    private async hasPermission(userId: string, fileId: string, permission: string): Promise<boolean> {
        try {
            const shareUser = await prisma.shareUser.findFirst({
                where: {
                    userId,
                    sharedFile: {
                        fileId,
                        isActive: true
                    },
                    OR: [
                        // TODO: Fix this type error
                        //{ permission: permission },
                        { permission: 'ADMIN' }, // Assuming ADMIN implies all permissions
                        { permission: 'SUPER_ADMIN' } // SUPER_ADMIN is a user role, not a file permission
                    ]
                }
            });
            return !!shareUser;
        } catch {
            return false;
        }
    }

    // Download helper methods
    private getAvailableFormats(file: any): Array<{
        format: string;
        extension: string;
        description: string;
        size?: number;
        recommended?: boolean;
    }> {
        const formats = [];

        // Always include original format
        formats.push({
            format: 'original',
            extension: this.getFileExtension(file.fileName) || 'file',
            description: 'Original format',
            size: Number(file.size || 0),
            recommended: true
        });

        // Add format-specific conversions based on file type
        if (file.mimeType) {
            if (file.mimeType.startsWith('image/')) {
                formats.push(
                    {
                        format: 'jpeg',
                        extension: 'jpg',
                        description: 'JPEG Image',
                        size: Math.round(Number(file.size || 0) * 0.8),
                        recommended: file.mimeType !== 'image/jpeg'
                    },
                    {
                        format: 'png',
                        extension: 'png',
                        description: 'PNG Image',
                        size: Math.round(Number(file.size || 0) * 1.2),
                        recommended: false
                    },
                    {
                        format: 'webp',
                        extension: 'webp',
                        description: 'WebP Image (Compressed)',
                        size: Math.round(Number(file.size || 0) * 0.6),
                        recommended: true
                    }
                );
            } else if (file.mimeType.startsWith('video/')) {
                formats.push(
                    {
                        format: 'mp4',
                        extension: 'mp4',
                        description: 'MP4 Video',
                        size: Math.round(Number(file.size || 0) * 0.9),
                        recommended: file.mimeType !== 'video/mp4'
                    },
                    {
                        format: 'webm',
                        extension: 'webm',
                        description: 'WebM Video (Compressed)',
                        size: Math.round(Number(file.size || 0) * 0.7),
                        recommended: true
                    }
                );
            } else if (file.mimeType === 'application/pdf' || file.mimeType.includes('document')) {
                formats.push({
                    format: 'pdf',
                    extension: 'pdf',
                    description: 'PDF Document',
                    size: Number(file.size || 0),
                    recommended: file.mimeType !== 'application/pdf'
                });
            }
        }

        return formats;
    }

    private getCompressionOptions(): Array<{
        type: string;
        name: string;
        description: string;
        ratio: number;
        speed: 'fast' | 'medium' | 'slow';
        processingTime: number; // minutes
    }> {
        return [
            {
                type: 'NONE',
                name: 'No compression',
                description: 'Download as-is without compression',
                ratio: 0,
                speed: 'fast',
                processingTime: 0
            },
            {
                type: 'ZIP',
                name: 'ZIP compression',
                description: 'Standard ZIP compression (good balance)',
                ratio: 30,
                speed: 'medium',
                processingTime: 2
            },
            {
                type: 'GZIP',
                name: 'GZIP compression',
                description: 'High compression ratio (slower)',
                ratio: 45,
                speed: 'slow',
                processingTime: 4
            },
            {
                type: 'SEVEN_ZIP',
                name: '7-Zip compression',
                description: 'Maximum compression (slowest)',
                ratio: 60,
                speed: 'slow',
                processingTime: 8
            }
        ];
    }

    private calculateDownloadTime(fileSizeBytes: number): number {
        // Assume average broadband speed of 50 Mbps (6.25 MB/s)
        const averageSpeedMBps = 6.25;
        const fileSizeMB = fileSizeBytes / (1024 * 1024);
        const estimatedSeconds = fileSizeMB / averageSpeedMBps;

        // Return time in minutes, minimum 1 second
        return Math.max(1, Math.round(estimatedSeconds));
    }

    private calculateCompressionTime(fileSizeBytes: number): number {
        // Estimate compression time based on file size
        // Assume processing ~100MB per minute
        const processingSpeedMBpm = 100;
        const fileSizeMB = fileSizeBytes / (1024 * 1024);
        const estimatedMinutes = fileSizeMB / processingSpeedMBpm;

        // Return time in minutes, minimum 1 minute for folders
        return Math.max(1, Math.round(estimatedMinutes));
    }

    private getFileExtension(fileName: string): string | null {
        const lastDot = fileName.lastIndexOf('.');
        return lastDot === -1 ? null : fileName.slice(lastDot + 1).toLowerCase();
    }

    // Download tracking methods
    private async createDownloadRecord(data: {
        fileId: string;
        userId?: string;
        fileName: string;
        fileSize?: bigint;
        mimeType?: string;
        downloadType: 'DIRECT' | 'ARCHIVE' | 'CONVERTED' | 'STREAM';
        downloadFormat?: string;
        compressionType?: 'NONE' | 'ZIP' | 'GZIP' | 'TAR' | 'SEVEN_ZIP';
        compressionLevel?: number;
        ipAddress?: string;
        userAgent?: string;
        deviceType?: 'DESKTOP' | 'MOBILE' | 'TABLET' | 'UNKNOWN';
    }): Promise<string> {
        try {
            const downloadRecord = await prisma.fileDownload.create({
                data: {
                    fileId: data.fileId,
                    userId: data.userId,
                    fileName: data.fileName,
                    fileSize: data.fileSize,
                    mimeType: data.mimeType,
                    downloadType: data.downloadType,
                    downloadFormat: data.downloadFormat || 'original',
                    compressionType: data.compressionType || 'NONE',
                    compressionLevel: data.compressionLevel || 0,
                    status: 'PENDING',
                    downloadToken: crypto.randomUUID(),
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent,
                    deviceType: data.deviceType || 'UNKNOWN',
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                    resumable: true,
                    totalBytes: data.fileSize
                }
            });

            return downloadRecord.id;
        } catch (error) {
            console.error('Error creating download record:', error);
            throw error;
        }
    }

    private async updateDownloadProgress(downloadId: string, data: {
        status?: 'PENDING' | 'PREPARING' | 'READY' | 'DOWNLOADING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
        progress?: number;
        bytesDownloaded?: bigint;
        downloadSpeed?: number;
        bandwidth?: number;
        downloadUrl?: string;
        failureReason?: string;
        completedAt?: Date;
        cancelledAt?: Date;
    }): Promise<void> {
        try {
            await prisma.fileDownload.update({
                where: { id: downloadId },
                data: {
                    ...data,
                    accessCount: data.status === 'COMPLETED' ? { increment: 1 } : undefined,
                    lastAccessedAt: data.status === 'DOWNLOADING' ? new Date() : undefined
                }
            });
        } catch (error) {
            console.error('Error updating download progress:', error);
            throw error;
        }
    }

    private async getDownloadRecord(downloadId: string): Promise<any> {
        try {
            return await prisma.fileDownload.findUnique({
                where: { id: downloadId },
                include: {
                    file: {
                        select: {
                            id: true,
                            fileName: true,
                            fileType: true,
                            mimeType: true,
                            fileSize: true,
                            userId: true
                        }
                    },
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error getting download record:', error);
            return null;
        }
    }

    private async cleanupExpiredDownloads(): Promise<void> {
        try {
            const expiredDownloads = await prisma.fileDownload.findMany({
                where: {
                    OR: [
                        { expiresAt: { lt: new Date() } },
                        {
                            status: 'PENDING',
                            createdAt: { lt: new Date(Date.now() - 2 * 60 * 60 * 1000) } // 2 hours old
                        }
                    ]
                }
            });

            for (const download of expiredDownloads) {
                // Clean up any temporary files if they exist
                if (download.downloadPath) {
                    try {
                        await fs.unlink(download.downloadPath);
                    } catch {
                        // File may already be deleted
                    }
                }

                // Update status to expired
                await prisma.fileDownload.update({
                    where: { id: download.id },
                    data: {
                        status: 'EXPIRED',
                        downloadUrl: null,
                        downloadPath: null
                    }
                });
            }
        } catch (error) {
            console.error('Error cleaning up expired downloads:', error);
        }
    }

    private getDeviceType(userAgent?: string): 'DESKTOP' | 'MOBILE' | 'TABLET' | 'UNKNOWN' {
        if (!userAgent) return 'UNKNOWN';

        const ua = userAgent.toLowerCase();

        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
            return 'MOBILE';
        } else if (ua.includes('tablet') || ua.includes('ipad')) {
            return 'TABLET';
        } else if (ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) {
            return 'DESKTOP';
        }

        return 'UNKNOWN';
    }

    // Preview endpoints and services

    /**
     * Get file preview URL and metadata
     * GET /files/:fileId/preview
     */
    public getFilePreview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const fileId = req.params?.fileId;
            const userId = req.user?.userId;

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            if (!fileId) {
                this.handleError(res, new Error('File ID required'), 'File ID is required', 400);
                return;
            }

            // Validate preview permission
            const hasPermission = await this.validatePreviewPermission(fileId, userId);
            if (!hasPermission.allowed) {
                this.handleError(res, new Error('Access denied'), hasPermission.message || 'Access denied', 403);
                return;
            }

            // Get file information
            const file = await prisma.file.findFirst({
                where: {
                    id: fileId,
                    OR: [
                        { userId }, // User owns the file
                        {
                            sharedFiles: {
                                some: {
                                    isActive: true,
                                    OR: [
                                        { expiresAt: null },
                                        { expiresAt: { gt: new Date() } }
                                    ],
                                    shareUsers: {
                                        some: { userId }
                                    }
                                }
                            }
                        }
                    ],
                    isDeleted: false,
                }
            });

            if (!file) {
                this.handleError(res, new Error('File not found'), 'File not found or access denied', 404);
                return;
            }

            // Check if file type is supported for preview using preview service
            const isPreviewable = previewService.isPreviewSupported(file.mimeType, file.fileName);
            if (!isPreviewable) {
                this.handleError(res, new Error('Unsupported file type'), 'File type not supported for preview', 400);
                return;
            }

            // Generate preview URL (secure, time-limited)
            const previewUrl = await previewService.generatePreviewUrl(fileId, userId);

            // Get file metadata for preview
            const metadata = await previewService.getFileMetadata(file.filePath, file.mimeType);

            const response: ApiResponse = {
                success: true,
                data: {
                    fileUrl: previewUrl,
                    fileName: file.fileName,
                    fileSize: file.fileSize,
                    mimeType: file.mimeType,
                    hasPermission: true,
                    metadata
                }
            };

            res.status(200).json(response);

        } catch (error: any) {
            logger.error('Error getting file preview:', error);
            this.handleError(res, error, 'Failed to get file preview');
        }
    };

    /**
     * Get file thumbnail for preview
     * GET /files/:fileId/thumbnail
     */
    public getPreviewThumbnail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const fileId = req.params?.fileId;
            const userId = req.user?.userId;

            console.log(" 0000000000000000000000 ")

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            if (!fileId) {
                this.handleError(res, new Error('File ID required'), 'File ID is required', 400);
                return;
            }

            // Validate preview permission
            const hasPermission = await this.validatePreviewPermission(fileId, userId);
            if (!hasPermission.allowed) {
                this.handleError(res, new Error('Access denied'), hasPermission.message || 'Access denied', 403);
                return;
            }

            // Get file information
            const file = await prisma.file.findFirst({
                where: {
                    id: fileId,
                    OR: [
                        { userId }, // User owns the file
                        {
                            sharedFiles: {
                                some: {
                                    isActive: true,
                                    OR: [
                                        { expiresAt: null },
                                        { expiresAt: { gt: new Date() } }
                                    ],
                                    shareUsers: {
                                        some: { userId }
                                    }
                                }
                            }
                        }
                    ],
                    isDeleted: false,
                }
            });

            console.log(" 8888888888888888888 ")
            console.log(file)
            console.log(" 8888888888888888888 ")


            if (!file) {
                this.handleError(res, new Error('File not found'), 'File not found or access denied', 404);
                return;
            }

            console.log(" 0000000000000000000000 ")
            // Generate or retrieve thumbnail using preview service
            const thumbnailPath = await previewService.getThumbnailPath(fileId, userId);

            // Check if thumbnail exists, if not generate it
            const thumbnailExists = await previewService.hasThumbnail(fileId, userId);
            if (!thumbnailExists) {
                await previewService.generateThumbnail(file.filePath, thumbnailPath, file.mimeType);
            }

            if (!thumbnailPath) {
                this.handleError(res, new Error('Failed to generate thumbnail'), 'Failed to generate thumbnail', 500);
                return;
            }

            // Check if thumbnail file exists
            try {
                await fs.access(thumbnailPath);
            } catch (error) {
                this.handleError(res, new Error('Thumbnail file not found'), 'Thumbnail file not found', 404);
                return;
            }

            // Set appropriate headers with longer cache for preview thumbnails
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Content-Disposition', `inline; filename="${fileId}-thumbnail.jpg"`);
            res.setHeader('Cache-Control', 'public, max-age=604800'); // Cache for 7 days
            res.setHeader('ETag', `"${fileId}-${file.updatedAt?.getTime()}"`);

            // Stream the thumbnail file
            const fileStream = createReadStream(thumbnailPath);

            fileStream.on('error', (error: any) => {
                logger.error("Error streaming preview thumbnail:", error);
                if (!res.headersSent) {
                    this.handleError(res, error, 'Failed to stream thumbnail', 500);
                }
            });

            fileStream.pipe(res);

        } catch (error: any) {
            logger.error("Error getting preview thumbnail:", error);
            if (!res.headersSent) {
                this.handleError(res, error, 'Failed to get preview thumbnail', 500);
            }
        }
    };

    /**
     * Stream file content for preview (with permission validation)
     * GET /files/:fileId/preview-content
     */
    public getPreviewContent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const fileId = req.params?.fileId;
            const userId = req.user?.userId;

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            if (!fileId) {
                this.handleError(res, new Error('File ID required'), 'File ID is required', 400);
                return;
            }

            // Validate preview permission
            const hasPermission = await this.validatePreviewPermission(fileId, userId);
            if (!hasPermission.allowed) {
                this.handleError(res, new Error('Access denied'), hasPermission.message || 'Access denied', 403);
                return;
            }

            // Get file information
            const file = await prisma.file.findFirst({
                where: {
                    id: fileId,
                    OR: [
                        { userId }, // User owns the file
                        {
                            sharedFiles: {
                                some: {
                                    isActive: true,
                                    OR: [
                                        { expiresAt: null },
                                        { expiresAt: { gt: new Date() } }
                                    ],
                                    shareUsers: {
                                        some: { userId }
                                    }
                                }
                            }
                        }
                    ],
                    isDeleted: false,
                }
            });

            if (!file) {
                this.handleError(res, new Error('File not found'), 'File not found or access denied', 404);
                return;
            }

            // Check if file exists on disk
            try {
                await fs.access(file.filePath);
            } catch (error) {
                this.handleError(res, new Error('File not found on disk'), 'File not found on disk', 404);
                return;
            }

            // Set appropriate headers for file streaming
            const mimeType = file.mimeType || mime.lookup(file.fileName) || 'application/octet-stream';
            res.setHeader('Content-Type', mimeType);
            res.setHeader('Content-Length', file.fileSize?.toString() || '0');
            res.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
            res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour
            res.setHeader('ETag', `"${fileId}-${file.updatedAt?.getTime()}"`);

            // Support range requests for large files (especially PDFs)
            const range = req.get?.('Range');
            if (range && file.fileSize) {
                const fileSize = parseInt(file.fileSize.toString());
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunksize = (end - start) + 1;

                res.status(206);
                res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
                res.setHeader('Accept-Ranges', 'bytes');
                res.setHeader('Content-Length', chunksize.toString());

                const fileStream = createReadStream(file.filePath, { start, end });
                fileStream.pipe(res);
            } else {
                // Stream the entire file
                const fileStream = createReadStream(file.filePath);
                fileStream.on('error', (error: any) => {
                    logger.error("Error streaming preview content:", error);
                    if (!res.headersSent) {
                        this.handleError(res, error, 'Failed to stream file content', 500);
                    }
                });
                fileStream.pipe(res);
            }

        } catch (error: any) {
            logger.error("Error getting preview content:", error);
            if (!res.headersSent) {
                this.handleError(res, error, 'Failed to get preview content', 500);
            }
        }
    };

    // Private helper methods for preview functionality

    /**
     * Validate if user has permission to preview a file
     */
    private async validatePreviewPermission(fileId: string, userId: string): Promise<{ allowed: boolean; message?: string }> {
        try {
            // Check if user owns the file or has shared access
            const file = await prisma.file.findFirst({
                where: {
                    id: fileId,
                    isDeleted: false,
                },
                include: {
                    sharedFiles: {
                        where: {
                            isActive: true,
                            OR: [
                                { expiresAt: null },
                                { expiresAt: { gt: new Date() } }
                            ]
                        },
                        include: {
                            shareUsers: {
                                where: { userId }
                            }
                        }
                    }
                }
            });

            if (!file) {
                return { allowed: false, message: 'File not found' };
            }

            // User owns the file
            if (file.userId === userId) {
                return { allowed: true };
            }

            // Check shared access
            const hasSharedAccess = file.sharedFiles.some(sharedFile =>
                sharedFile.shareUsers.length > 0
            );

            if (hasSharedAccess) {
                return { allowed: true };
            }

            return { allowed: false, message: 'Access denied' };

        } catch (error) {
            logger.error('Error validating preview permission:', error);
            return { allowed: false, message: 'Permission validation failed' };
        }
    }

    /**
     * Generate secure, time-limited preview URL
     */
    private async generatePreviewUrl(fileId: string, userId: string): Promise<string> {
        // Generate a secure token for preview access
        const timestamp = Date.now();
        const expiresAt = timestamp + (60 * 60 * 1000); // 1 hour expiry

        // Create a simple signed URL (in production, use proper JWT or similar)
        const payload = `${fileId}:${userId}:${expiresAt}`;
        const signature = crypto.createHmac('sha256', process.env.JWT_SECRET || 'default-secret')
            .update(payload)
            .digest('hex');

        const baseUrl = process.env.SERVER_URL || 'http://localhost:3001';
        return `${baseUrl}/api/files/${fileId}/preview-content?token=${signature}&expires=${expiresAt}`;
    }

    /**
     * Get file metadata for preview
     */
    private async getFileMetadataForPreview(file: any): Promise<any> {
        const metadata: any = {};

        try {
            // For images, get dimensions
            if (file.mimeType?.startsWith('image/')) {
                try {
                    const imageInfo = await sharp(file.filePath).metadata();
                    metadata.dimensions = {
                        width: imageInfo.width,
                        height: imageInfo.height
                    };
                    metadata.hasTransparency = imageInfo.hasAlpha;
                    metadata.colorSpace = imageInfo.space;
                } catch (error) {
                    logger.warn('Failed to get image metadata:', error);
                }
            }

            // For PDFs, get page count using pdf-parse
            if (file.mimeType === 'application/pdf') {
                try {
                    const dataBuffer = await fs.readFile(file.filePath);
                    const pdfData = await pdfParse(dataBuffer);
                    metadata.pages = pdfData.numpages;
                    metadata.title = pdfData.info?.Title || file.fileName;
                    metadata.author = pdfData.info?.Author;
                    metadata.subject = pdfData.info?.Subject;
                    metadata.creator = pdfData.info?.Creator;
                    metadata.producer = pdfData.info?.Producer;
                    metadata.creationDate = pdfData.info?.CreationDate;
                    metadata.modificationDate = pdfData.info?.ModDate;
                } catch (error) {
                    logger.warn('Failed to parse PDF metadata:', error);
                    metadata.pages = 1; // Default to 1 page if parsing fails
                }
            }

        } catch (error) {
            logger.warn('Failed to get file metadata for preview:', error);
        }

        return metadata;
    }

    // Get a specific approval request
    public getApprovalRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const approvalId = req.params?.approvalId as string;
            const userId = req.user!.userId;

            const approval = await prisma.shareApproval.findFirst({
                where: {
                    id: approvalId,
                    approverId: userId // Only approver can view the request
                },
                include: {
                    requester: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    sharedFile: {
                        include: {
                            file: {
                                select: {
                                    id: true,
                                    fileName: true,
                                    fileSize: true,
                                    fileType: true,
                                    mimeType: true
                                }
                            }
                        }
                    }
                }
            });

            if (!approval) {
                this.handleError(res, new Error("Approval request not found"), "Approval request not found", 404);
                return;
            }

            res.json({
                success: true,
                data: approval
            });

        } catch (error) {
            console.error('Error fetching approval request:', error);
            this.handleError(res, error, 'Failed to fetch approval request');
        }
    }

    // Approve a share request
    public approveRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const approvalId = req.params?.approvalId as string;
            const { message } = req.body;
            const userId = req.user!.userId;

            const approval = await prisma.shareApproval.findFirst({
                where: {
                    id: approvalId,
                    approverId: userId,
                    status: 'PENDING'
                },
                include: {
                    requester: true,
                    sharedFile: {
                        include: {
                            file: true
                        }
                    }
                }
            });

            if (!approval) {
                this.handleError(res, new Error("Approval request not found or already processed"), "Approval request not found or already processed", 404);
                return;
            }

            // Update approval status
            const updatedApproval = await prisma.shareApproval.update({
                where: { id: approvalId },
                data: {
                    status: 'APPROVED',
                    responseMessage: message,
                    approvedAt: new Date()
                }
            });

            // Grant access to the file
            const mapSharePermissionToFilePermission = (sharePermission: string) => {
                switch (sharePermission) {
                    case 'EDIT': return 'EDIT';
                    case 'COMMENT': return 'COMMENT';
                    default: return 'VIEW';
                }
            };

            await prisma.shareUser.create({
                data: {
                    sharedFileId: approval.sharedFileId,
                    userId: approval.requesterId,
                    permission: mapSharePermissionToFilePermission(approval.sharedFile.permission) as any
                }
            });

            // Send approval email
            try {
                const emailService = EmailServiceFactory.create();
                await emailService.sendShareApprovalEmail(approval.requester.email, {
                    recipientEmail: approval.requester.email,
                    recipientName: `${approval.requester.firstName} ${approval.requester.lastName}`,
                    fileName: approval.sharedFile.file.fileName,
                    approvedBy: (req.user as any).firstName + ' ' + (req.user as any).lastName,
                    shareUrl: `${process.env.FRONTEND_URL}/share/${approval.sharedFile.shareToken}`,
                    approvedAt: new Date()
                });
            } catch (emailError) {
                console.error('Failed to send approval email:', emailError);
            }

            res.json({
                success: true,
                message: 'Access request approved successfully',
                data: updatedApproval
            });

        } catch (error) {
            console.error('Error approving request:', error);
            this.handleError(res, error, 'Failed to approve request');
        }
    }

    // Reject a share request
    public rejectRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const approvalId = req.params?.approvalId as string;
            const { message } = req.body;
            const userId = req.user!.userId;

            const approval = await prisma.shareApproval.findFirst({
                where: {
                    id: approvalId,
                    approverId: userId,
                    status: 'PENDING'
                },
                include: {
                    requester: true,
                    sharedFile: {
                        include: {
                            file: true
                        }
                    }
                }
            });

            if (!approval) {
                this.handleError(res, new Error("Approval request not found or already processed"), "Approval request not found or already processed", 404);
                return;
            }

            // Update approval status
            const updatedApproval = await prisma.shareApproval.update({
                where: { id: approvalId },
                data: {
                    status: 'REJECTED',
                    responseMessage: message,
                    rejectedAt: new Date()
                }
            });

            // Send rejection email (you might want to create a rejection email template)
            try {
                const emailService = EmailServiceFactory.create();
                // For now, we'll use a simple email. You can create a specific rejection template
                await emailService.sendEmail({
                    to: approval.requester.email,
                    subject: `Access Request Rejected - ${approval.sharedFile.file.fileName}`,
                    html: `
                        <h2>Access Request Rejected</h2>
                        <p>Your request to access "${approval.sharedFile.file.fileName}" has been rejected.</p>
                        ${message ? `<p><strong>Message from owner:</strong> ${message}</p>` : ''}
                        <p>If you believe this is an error, please contact the file owner directly.</p>
                    `
                });
            } catch (emailError) {
                console.error('Failed to send rejection email:', emailError);
            }

            res.json({
                success: true,
                message: 'Access request rejected',
                data: updatedApproval
            });

        } catch (error) {
            console.error('Error rejecting request:', error);
            this.handleError(res, error, 'Failed to reject request');
        }
    }



}
const fileController = new FileController();
export default fileController;