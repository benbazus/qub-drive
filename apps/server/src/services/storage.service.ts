
import prisma from '@/config/database.config';
import { StorageBreakdown, StorageData } from '../controllers/storage.controller';
import fs from 'fs/promises';
import path from 'path';
import { createReadStream } from 'fs';
import { formatFileSize } from '../utils/file.utils';


export class StorageService {
    private uploadTransferDir: string;
    private uploadFileDir: string;
    constructor() {
        this.uploadFileDir = process.env.UPLOAD_DIR || './filestore';
        this.uploadTransferDir = process.env.UPLOAD_TRANSFER_DIR || './uploads';
        this.ensureUploadTransferDir();
        this.ensureUploadFileDir();
    }


    private async ensureUploadFileDir(): Promise<void> {
        try {
            await fs.access(this.uploadFileDir);
        } catch {
            await fs.mkdir(this.uploadFileDir, { recursive: true });
        }
    }


    private async ensureUploadTransferDir(): Promise<void> {
        try {
            await fs.access(this.uploadTransferDir);
        } catch {
            await fs.mkdir(this.uploadTransferDir, { recursive: true });
        }
    }

    async createFileDirectory(shareLink: string, userId: string): Promise<string> {

        const transferPath = path.join(this.uploadFileDir, userId, shareLink);

        await fs.mkdir(transferPath, { recursive: true });
        return transferPath;
    }

    async createTransferDirectory(shareLink: string): Promise<string> {

        const transferPath = path.join(this.uploadTransferDir, shareLink);

        await fs.mkdir(transferPath, { recursive: true });
        return transferPath;
    }

    async saveFile(transferPath: string, fileName: string, buffer: Buffer): Promise<string> {
        // Sanitize filename to prevent directory traversal
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = path.join(transferPath, sanitizedFileName);

        await fs.writeFile(filePath, buffer);
        return filePath;
    }

    async getFile(filePath: string): Promise<Buffer> {
        return fs.readFile(filePath);
    }

    createReadStream(filePath: string) {
        return createReadStream(filePath);
    }

    async deleteFile(filePath: string): Promise<void> {
        try {
            await fs.unlink(filePath);
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }

    async deleteDirectory(directoryPath: string): Promise<void> {
        try {
            await fs.rm(directoryPath, { recursive: true, force: true });
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }

    async getFileStats(filePath: string) {
        return fs.stat(filePath);
    }

    async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }


    public async calculateUserStorage(userId: string, totalStorageGB: number = 100): Promise<StorageData> {
        try {
            // Get all active files for the user (not deleted, not temporary)
            const userFiles = await prisma.file.findMany({
                where: {
                    userId: userId,
                    isDeleted: false,
                    isTemporary: false,
                    isActive: true
                },
                select: {
                    fileSize: true,
                    mimeType: true,
                    contentType: true,
                    isFolder: true
                }
            });

            const user = await prisma.user.findUnique({ where: { id: userId } });

            // Calculate total used storage and breakdown by type
            let totalUsedBytes = 0n;
            const breakdown = {
                documents: 0n,
                images: 0n,
                videos: 0n,
                audio: 0n
            };

            userFiles.forEach(file => {
                // Skip folders as they don't have actual file size
                if (file.isFolder || !file.fileSize) return;

                const fileSize = file.fileSize;
                totalUsedBytes += fileSize;

                // Categorize by mime type or content type
                const category = this.categorizeFile(file.mimeType, file.contentType);
                breakdown[category] += fileSize;
            });

            // Convert bytes to GB (1 GB = 1,073,741,824 bytes)
            // const bytesToGB = (bytes: bigint): number => {
            //     return Number(bytes) / (1024 * 1024 * 1024);
            // };

            // const storageData: StorageData = {
            //     usedStorage: Math.round(bytesToGB(totalUsedBytes) * 10) / 10, // Round to 1 decimal place
            //     totalStorage: totalStorageGB,
            //     breakdown: {
            //         documents: Math.round(bytesToGB(breakdown.documents) * 10) / 10,
            //         images: Math.round(bytesToGB(breakdown.images) * 10) / 10,
            //         videos: Math.round(bytesToGB(breakdown.videos) * 10) / 10,
            //         audio: Math.round(bytesToGB(breakdown.audio) * 10) / 10
            //     }
            // };

            const storageData: StorageData = {
                usedStorage: formatFileSize(Number(totalUsedBytes)), // Round to 1 decimal place
                totalStorage: formatFileSize(Number(user?.storageLimit)),// totalStorageGB.toString(),
                breakdown: {
                    documents: formatFileSize(Number(breakdown.documents)),
                    images: formatFileSize(Number(breakdown.images)),
                    videos: formatFileSize(Number(breakdown.videos)),
                    audio: formatFileSize(Number(breakdown.audio)),
                }
            };

            //formatFileSize
            return storageData;

        } catch (error) {
            console.error('Error calculating storage:', error);
            throw new Error('Failed to calculate storage usage');
        }
    }

    public async getAdditionalStorageStats(userId: string) {
        const [fileCount, folderCount, sharedFiles, encryptedFiles] = await Promise.all([
            // Total files (not folders, not deleted)
            prisma.file.count({
                where: {
                    userId: userId,
                    isDeleted: false,
                    isFolder: false,
                    isTemporary: false
                }
            }),

            // Total folders
            prisma.file.count({
                where: {
                    userId: userId,
                    isDeleted: false,
                    isFolder: true
                }
            }),

            // Shared files
            prisma.file.count({
                where: {
                    userId: userId,
                    isDeleted: false,
                    isShared: true
                }
            }),

            // Encrypted files
            prisma.file.count({
                where: {
                    userId: userId,
                    isDeleted: false,
                    isEncrypted: true
                }
            })
        ]);

        return {
            totalFiles: fileCount,
            totalFolders: folderCount,
            sharedFiles,
            encryptedFiles
        };
    }

    private categorizeFile(mimeType: string | null, contentType: string | null): keyof StorageBreakdown {
        const mime = (mimeType || '').toLowerCase();
        const content = (contentType || '').toLowerCase();

        // Check mime type first, then content type
        const type = mime || content;

        if (type.includes('image/') || content === 'image') {
            return 'images';
        }

        if (type.includes('video/') || content === 'video') {
            return 'videos';
        }

        if (type.includes('audio/') || content === 'audio') {
            return 'audio';
        }

        // Document types
        if (
            type.includes('text/') ||
            type.includes('application/pdf') ||
            type.includes('application/msword') ||
            type.includes('application/vnd.openxmlformats-officedocument') ||
            type.includes('application/vnd.ms-excel') ||
            type.includes('application/vnd.ms-powerpoint') ||
            content === 'text' ||
            content === 'document'
        ) {
            return 'documents';
        }

        // Default to documents for unknown types
        return 'documents';
    }

}

// const storageService = new StorageService();
// export default storageService;