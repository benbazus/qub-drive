import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";
import { Request, Response } from "express";
import { createReadStream, createWriteStream } from "fs";
import mime from "mime-types";
import prisma from "../config/database.config";
import { FileType } from "@prisma/client";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

interface FileUploadRequest extends AuthenticatedRequest {
    file?: Express.Multer.File;
}
import { logger } from "../config/logger";
import { v4 as uuidv4 } from "uuid";
import { formatFileSize } from "../utils/file.utils";

interface UploadProgress {
    uploadId: string;
    fileName: string;
    totalSize: number;
    uploadedSize: number;
    progress: number;
    status: 'initializing' | 'uploading' | 'completed' | 'failed' | 'cancelled';
    startTime: number;
    speed: number;
    estimatedTime: number;
    error?: string;
}

interface ChunkUploadRequest {
    uploadId: string;
    chunkIndex: number;
    totalChunks: number;
    fileName: string;
    fileSize: number;
    parentId?: string;
}

class FileUploaderController {
    private uploadProgress = new Map<string, UploadProgress>();
    private uploadSessions = new Map<string, {
        chunks: Buffer[];
        totalChunks: number;
        fileName: string;
        fileSize: number;
        parentId?: string;
        userId: string;
        mimeType: string;
        uploadStartTime: number;
    }>();

    constructor() { }

    // Initialize upload session
    public initializeUpload = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }

            const { fileName, fileSize, mimeType, parentId, totalChunks = 1 } = req.body;

            if (!fileName || !fileSize) {
                res.status(400).json({
                    success: false,
                    error: 'fileName and fileSize are required'
                });
                return;
            }

            // Generate unique upload ID
            const uploadId = `upload_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

            // Initialize upload progress tracking
            const progress: UploadProgress = {
                uploadId,
                fileName,
                totalSize: fileSize,
                uploadedSize: 0,
                progress: 0,
                status: 'initializing',
                startTime: Date.now(),
                speed: 0,
                estimatedTime: 0
            };

            this.uploadProgress.set(uploadId, progress);

            // Initialize upload session
            this.uploadSessions.set(uploadId, {
                chunks: new Array(totalChunks),
                totalChunks,
                fileName,
                fileSize,
                parentId,
                userId,
                mimeType: mimeType || mime.lookup(fileName) || 'application/octet-stream',
                uploadStartTime: Date.now()
            });

            logger.info(`Upload initialized: ${uploadId} for file: ${fileName}`);

            res.json({
                success: true,
                data: {
                    uploadId,
                    message: 'Upload initialized successfully'
                }
            });

        } catch (error: any) {
            logger.error('Error initializing upload:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to initialize upload'
            });
        }
    };

    // Handle chunk upload
    public uploadChunk = async (req: FileUploadRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }

            const { uploadId, chunkIndex } = req.body;
            const chunkBuffer = req.file?.buffer;

            if (!uploadId || chunkIndex === undefined || !chunkBuffer) {
                res.status(400).json({
                    success: false,
                    error: 'uploadId, chunkIndex, and file chunk are required'
                });
                return;
            }

            const session = this.uploadSessions.get(uploadId);
            const progress = this.uploadProgress.get(uploadId);

            if (!session || !progress) {
                res.status(404).json({
                    success: false,
                    error: 'Upload session not found'
                });
                return;
            }

            if (session.userId !== userId) {
                res.status(403).json({
                    success: false,
                    error: 'Unauthorized upload session access'
                });
                return;
            }

            // Store chunk
            session.chunks[chunkIndex] = chunkBuffer;

            // Update progress
            const uploadedChunks = session.chunks.filter(chunk => chunk !== undefined).length;
            const uploadedSize = uploadedChunks * chunkBuffer.length; // Approximate
            const progressPercentage = Math.min((uploadedChunks / session.totalChunks) * 100, 100);

            progress.uploadedSize = uploadedSize;
            progress.progress = progressPercentage;
            progress.status = progressPercentage === 100 ? 'completed' : 'uploading';

            // Calculate speed and estimated time
            const elapsedTime = (Date.now() - progress.startTime) / 1000;
            progress.speed = elapsedTime > 0 ? uploadedSize / elapsedTime : 0;
            progress.estimatedTime = progress.speed > 0 ? (session.fileSize - uploadedSize) / progress.speed : 0;

            logger.info(`Chunk ${chunkIndex}/${session.totalChunks - 1} uploaded for ${uploadId}`);

            // If all chunks are uploaded, finalize the upload
            if (uploadedChunks === session.totalChunks) {
                await this.finalizeUpload(uploadId, session, progress);
            }

            res.json({
                success: true,
                data: {
                    uploadId,
                    chunkIndex,
                    progress: progress.progress,
                    status: progress.status,
                    uploadedChunks,
                    totalChunks: session.totalChunks
                }
            });

        } catch (error: any) {
            logger.error('Error uploading chunk:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to upload chunk'
            });
        }
    };

    // Simple file upload (non-chunked)
    public uploadFile = async (req: FileUploadRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }

            const file = req.file;
            const { parentId } = req.body;

            if (!file) {
                res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
                return;
            }

            // Generate upload ID for tracking
            const uploadId = `upload_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

            // Initialize progress tracking
            const progress: UploadProgress = {
                uploadId,
                fileName: file.originalname,
                totalSize: file.size,
                uploadedSize: 0,
                progress: 0,
                status: 'uploading',
                startTime: Date.now(),
                speed: 0,
                estimatedTime: 0
            };

            this.uploadProgress.set(uploadId, progress);

            // Create upload directory structure
            const userDir = path.join(process.cwd(), 'Uploads', userId);
            await fs.mkdir(userDir, { recursive: true });

            // Generate unique filename to prevent conflicts
            const fileExtension = path.extname(file.originalname);
            const baseName = path.basename(file.originalname, fileExtension);
            const uniqueFileName = `${baseName}_${Date.now()}${fileExtension}`;
            const filePath = path.join(userDir, uniqueFileName);

            // Simulate upload progress for demonstration
            await this.simulateUploadProgress(uploadId, progress);

            // Write file to disk
            await fs.writeFile(filePath, file.buffer);

            // Save file metadata to database
            const fileRecord = await prisma.file.create({
                data: {
                    fileName: file.originalname,
                    originalName: file.originalname,
                    fileType: FileType.FILE,
                    mimeType: file.mimetype,
                    fileSize: BigInt(file.size),
                    filePath,
                    parentId: parentId || null,
                    userId,
                    ownerId: userId,
                    createdBy: userId,
                    modifiedBy: userId,
                    checksum: crypto.createHash('sha256').update(file.buffer).digest('hex'),
                    isDeleted: false,
                    isActive: true,
                    uploadId,
                    uploadCompleted: true
                }
            });

            // Update progress to completed
            progress.uploadedSize = file.size;
            progress.progress = 100;
            progress.status = 'completed';

            logger.info(`File uploaded successfully: ${file.originalname} (${uploadId})`);

            res.json({
                success: true,
                data: {
                    uploadId,
                    fileId: fileRecord.id,
                    fileName: file.originalname,
                    fileSize: file.size,
                    filePath,
                    progress: 100,
                    status: 'completed',
                    message: 'File uploaded successfully'
                }
            });

        } catch (error: any) {
            logger.error('Error uploading file:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to upload file'
            });
        }
    };

    // Get upload progress
    public getUploadProgress = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const uploadId = req.params?.uploadId;
            const userId = req.user?.userId;

            if (!uploadId) {
                res.status(400).json({
                    success: false,
                    error: 'Upload ID is required'
                });
                return;
            }

            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }

            const progress = this.uploadProgress.get(uploadId);
            if (!progress) {
                res.status(404).json({
                    success: false,
                    error: 'Upload progress not found'
                });
                return;
            }

            // Verify user owns this upload
            const session = this.uploadSessions.get(uploadId);
            if (session && session.userId !== userId) {
                res.status(403).json({
                    success: false,
                    error: 'Unauthorized access to upload progress'
                });
                return;
            }

            res.json({
                success: true,
                data: {
                    uploadId: progress.uploadId,
                    fileName: progress.fileName,
                    totalSize: progress.totalSize,
                    uploadedSize: progress.uploadedSize,
                    progress: progress.progress,
                    status: progress.status,
                    speed: progress.speed,
                    estimatedTime: progress.estimatedTime,
                    error: progress.error
                }
            });

        } catch (error: any) {
            logger.error('Error getting upload progress:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get upload progress'
            });
        }
    };

    // Cancel upload
    public cancelUpload = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const uploadId = req.params?.uploadId;
            const userId = req.user?.userId;

            if (!uploadId) {
                res.status(400).json({
                    success: false,
                    error: 'Upload ID is required'
                });
                return;
            }

            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }

            const session = this.uploadSessions.get(uploadId);
            const progress = this.uploadProgress.get(uploadId);

            if (!session || !progress) {
                res.status(404).json({
                    success: false,
                    error: 'Upload session not found'
                });
                return;
            }

            if (session.userId !== userId) {
                res.status(403).json({
                    success: false,
                    error: 'Unauthorized upload session access'
                });
                return;
            }

            // Update progress status
            progress.status = 'cancelled';

            // Clean up session
            this.uploadSessions.delete(uploadId);

            // Keep progress for a while for status checking
            setTimeout(() => {
                this.uploadProgress.delete(uploadId);
            }, 60000); // Remove after 1 minute

            logger.info(`Upload cancelled: ${uploadId}`);

            res.json({
                success: true,
                data: {
                    uploadId,
                    status: 'cancelled',
                    message: 'Upload cancelled successfully'
                }
            });

        } catch (error: any) {
            logger.error('Error cancelling upload:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to cancel upload'
            });
        }
    };

    // Get all active uploads for user
    public getUserUploads = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }

            const userUploads: UploadProgress[] = [];

            for (const [uploadId, progress] of this.uploadProgress.entries()) {
                const session = this.uploadSessions.get(uploadId);
                if (session && session.userId === userId) {
                    userUploads.push(progress);
                }
            }

            res.json({
                success: true,
                data: {
                    uploads: userUploads,
                    totalUploads: userUploads.length,
                    activeUploads: userUploads.filter(u => u.status === 'uploading').length,
                    completedUploads: userUploads.filter(u => u.status === 'completed').length,
                    failedUploads: userUploads.filter(u => u.status === 'failed').length
                }
            });

        } catch (error: any) {
            logger.error('Error getting user uploads:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get user uploads'
            });
        }
    };

    // Private helper methods
    private async finalizeUpload(uploadId: string, session: any, progress: UploadProgress): Promise<void> {
        try {
            // Combine all chunks into final file
            const finalBuffer = Buffer.concat(session.chunks);

            // Create upload directory
            const userDir = path.join(process.cwd(), 'Uploads', session.userId);
            await fs.mkdir(userDir, { recursive: true });

            // Generate unique filename
            const fileExtension = path.extname(session.fileName);
            const baseName = path.basename(session.fileName, fileExtension);
            const uniqueFileName = `${baseName}_${Date.now()}${fileExtension}`;
            const filePath = path.join(userDir, uniqueFileName);

            // Write final file
            await fs.writeFile(filePath, finalBuffer);

            // Save to database
            const fileRecord = await prisma.file.create({
                data: {
                    fileName: session.fileName,
                    originalName: session.fileName,
                    fileType: FileType.FILE,
                    mimeType: session.mimeType,
                    fileSize: BigInt(session.fileSize),
                    filePath,
                    parentId: session.parentId || null,
                    userId: session.userId,
                    ownerId: session.userId,
                    createdBy: session.userId,
                    modifiedBy: session.userId,
                    checksum: crypto.createHash('sha256').update(finalBuffer).digest('hex'),
                    isDeleted: false,
                    isActive: true,
                    uploadId,
                    uploadCompleted: true
                }
            });

            // Clean up session
            this.uploadSessions.delete(uploadId);

            logger.info(`Upload finalized: ${uploadId} -> ${fileRecord.id}`);

        } catch (error: any) {
            progress.status = 'failed';
            progress.error = error.message;
            logger.error(`Error finalizing upload ${uploadId}:`, error);
        }
    }

    private async simulateUploadProgress(uploadId: string, progress: UploadProgress): Promise<void> {
        return new Promise((resolve) => {
            let currentProgress = 0;
            const interval = setInterval(() => {
                currentProgress += Math.random() * 20 + 5; // Random increment 5-25%

                if (currentProgress >= 100) {
                    currentProgress = 100;
                    progress.progress = 100;
                    progress.uploadedSize = progress.totalSize;
                    progress.status = 'completed';
                    clearInterval(interval);
                    resolve();
                } else {
                    progress.progress = currentProgress;
                    progress.uploadedSize = Math.round((currentProgress / 100) * progress.totalSize);

                    // Calculate speed and estimated time
                    const elapsedTime = (Date.now() - progress.startTime) / 1000;
                    progress.speed = elapsedTime > 0 ? progress.uploadedSize / elapsedTime : 0;
                    progress.estimatedTime = progress.speed > 0 ?
                        (progress.totalSize - progress.uploadedSize) / progress.speed : 0;
                }
            }, 100); // Update every 100ms
        });
    }

    // Clean up old progress entries periodically
    public cleanupOldUploads = (): void => {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        for (const [uploadId, progress] of this.uploadProgress.entries()) {
            if (now - progress.startTime > maxAge &&
                (progress.status === 'completed' || progress.status === 'failed' || progress.status === 'cancelled')) {
                this.uploadProgress.delete(uploadId);
                this.uploadSessions.delete(uploadId);
            }
        }
    };
}

// Export singleton instance
const fileUploaderController = new FileUploaderController();

// Setup periodic cleanup
setInterval(() => {
    fileUploaderController.cleanupOldUploads();
}, 60 * 60 * 1000); // Run every hour

export default fileUploaderController;