
import { CryptoUtil } from '../utils/crypto';
import prisma from '@/config/database.config';
import { CreateTransferDTO, UploadedFileData, DownloadStatsResponse } from '@/types/transfer';
import { StorageService } from './storage.service';

import { EmailServiceFactory } from './email/email-service.factory';
import { formatFileSize } from '@/utils/file.utils';


export class TransferService {

    private storageService: StorageService;

    constructor() {

        this.storageService = new StorageService();
    }

    async createTransfer(dto: CreateTransferDTO, files: UploadedFileData[]): Promise<{ transferId: string; shareLink: string }> {
        const shareLink = CryptoUtil.generateShareLink();
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + dto.expirationDays);

        const totalSize = files.reduce((sum, file) => sum + file.fileSize, 0);

        // Hash password if provided
        const hashedPassword = dto.password
            ? await CryptoUtil.hashPassword(dto.password)
            : null;

        // Create transfer directory
        const storagePath = await this.storageService.createTransferDirectory(shareLink);

        // Save files to local storage
        const savedFiles = await Promise.all(
            files.map(async (file) => {
                const filePath = await this.storageService.saveFile(
                    storagePath,
                    file.fileName,
                    file.buffer
                );
                return {
                    fileName: file.fileName,
                    fileSize: file.fileSize,
                    mimeType: file.mimeType,
                    filePath,
                };
            })
        );

        // Create transfer in database
        const transfer = await prisma.transfer.create({
            data: {
                userId: dto.userId || null,
                title: dto.title,
                message: dto.message,
                senderEmail: dto.senderEmail,
                recipientEmail: dto.recipientEmail,
                password: hashedPassword,
                expirationDate,
                downloadLimit: dto.downloadLimit,
                trackingEnabled: dto.trackingEnabled,
                shareLink: shareLink,
                totalSize: BigInt(totalSize),
                storagePath,
                files: {
                    create: savedFiles,
                },
            },
        });

        const emailService = EmailServiceFactory.create();

        // Prepare email data with all necessary information
        const emailData = {
            ...dto,
            fileCount: files.length,
            totalSize: formatFileSize(totalSize),
            downloadUrl: `${dto.clientOrigin}/download/${transfer.shareLink}`,
            shareLink: transfer.shareLink,
            expiresAt: expirationDate,
        };

        // Send email notification (non-blocking)
        emailService.sendBulkTransferEmail(emailData).catch(error => {
            console.error('Failed to send transfer notification email:', error);
            // Don't block the response if email fails
        });

        return {
            transferId: transfer.id,
            shareLink: transfer.shareLink,
        };
    }

    async getTransferByShareLink(shareLink: string) {
        const transfer = await prisma.transfer.findUnique({
            where: { shareLink },
            include: {
                files: true,
                downloads: {
                    orderBy: { downloadedAt: 'desc' },
                    take: 10,
                },
            },
        });


        if (!transfer) {
            throw new Error('Transfer not found');
        }

        // Check if expired
        if (new Date() > transfer.expirationDate) {
            throw new Error('Transfer has expired');
        }

        // Check download limit
        if (transfer.downloadLimit) {
            const downloadCount = await prisma.download.count({
                where: { transferId: transfer.id },
            });

            if (downloadCount >= transfer.downloadLimit) {
                throw new Error('Download limit reached');
            }
        }

        return transfer;
    }

    async validatePassword(shareLink: string, password: string): Promise<boolean> {
        const transfer = await prisma.transfer.findUnique({
            where: { shareLink },
            select: { password: true },
        });

        if (!transfer || !transfer.password) {
            return true; // No password set
        }

        return CryptoUtil.comparePassword(password, transfer.password);
    }

    async getFileForDownload(fileId: string, shareLink: string, password?: string) {
        // Validate password if required
        if (password) {
            const isValid = await this.validatePassword(shareLink, password);
            if (!isValid) {
                throw new Error('Invalid password');
            }
        }

        const transfer = await this.getTransferByShareLink(shareLink);
        const file = transfer.files.find(f => f.id === fileId);

        if (!file) {
            throw new Error('File not found');
        }

        // Check if file exists on disk
        const exists = await this.storageService.fileExists(file.filePath);
        if (!exists) {
            throw new Error('File not found on disk');
        }

        return {
            filePath: file.filePath,
            fileName: file.fileName,
            mimeType: file.mimeType,
            fileSize: Number(file.fileSize),
        };
    }

    async getTransferFiles(shareLink: string, password?: string) {
        // Validate password if required
        if (password) {
            const isValid = await this.validatePassword(shareLink, password);
            if (!isValid) {
                throw new Error('Invalid password');
            }
        }

        const transfer = await this.getTransferByShareLink(shareLink);

        return {
            transfer: {
                id: transfer.id,
                title: transfer.title,
                message: transfer.message,
                senderEmail: transfer.senderEmail,
                expirationDate: transfer.expirationDate,
                totalSize: Number(transfer.totalSize),
            },
            files: transfer.files.map(file => ({
                id: file.id,
                fileName: file.fileName,
                fileSize: Number(file.fileSize),
                mimeType: file.mimeType,
            })),
        };
    }

    async recordDownload(shareLink: string, ipAddress: string, userAgent?: string, location?: string): Promise<void> {
        const transfer = await prisma.transfer.findUnique({
            where: { shareLink },
            select: { id: true },
        });

        if (!transfer) {
            throw new Error('Transfer not found');
        }

        await prisma.download.create({
            data: {
                transferId: transfer.id,
                ipAddress,
                userAgent,
                location,
            },
        });
    }

    async getDownloadStats(shareLink: string): Promise<DownloadStatsResponse> {
        const transfer = await prisma.transfer.findUnique({
            where: { shareLink },
            include: {
                downloads: {
                    orderBy: { downloadedAt: 'desc' },
                    take: 50,
                },
            },
        });

        if (!transfer) {
            throw new Error('Transfer not found');
        }

        const uniqueIPs = new Set(transfer.downloads.map(d => d.ipAddress));

        return {
            totalDownloads: transfer.downloads.length,
            uniqueDownloaders: uniqueIPs.size,
            lastDownload: transfer.downloads[0]?.downloadedAt || null,
            downloads: transfer.downloads.slice(0, 10).map(d => ({
                id: d.id,
                ipAddress: d.ipAddress,
                location: d.location,
                downloadedAt: d.downloadedAt,
            })),
        };
    }

    async deleteExpiredTransfers(): Promise<void> {
        const expiredTransfers = await prisma.transfer.findMany({
            where: {
                expirationDate: {
                    lt: new Date(),
                },
            },
            include: {
                files: true,
            },
        });

        for (const transfer of expiredTransfers) {
            // Delete files from local storage
            await this.storageService.deleteDirectory(transfer.storagePath);

            // Delete from database (cascade will handle files and downloads)
            await prisma.transfer.delete({
                where: { id: transfer.id },
            });
        }

        console.log(`Deleted ${expiredTransfers.length} expired transfers`);
    }
}