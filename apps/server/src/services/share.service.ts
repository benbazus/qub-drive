import { Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import prisma from '../config/database.config';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { EmailServiceFactory } from './email/email-service.factory';
import { renderShareNotificationTemplate } from './email/share-notification.template';

interface CreateShareRequest {
    fileId: string;
    recipientEmail: string;
    message?: string;
    expirationDays: string;
    password?: string;
}

interface CreateShareResponse {
    success: boolean;
    data?: {
        id: string;
        shareLink: string;
        expiresAt: string;
    };
    message?: string;
    error?: string;
}

export class ShareService {
    private async validateShareRequest(data: CreateShareRequest, userId: string): Promise<void> {
        const { fileId, recipientEmail, expirationDays } = data;

        // Validate file exists and user owns it
        const file = await prisma.file.findFirst({
            where: {
                id: fileId,
                userId: userId,
                isDeleted: false
            }
        });

        if (!file) {
            throw new Error('File not found or access denied');
        }

        // Validate expiration days
        const days = parseInt(expirationDays);
        if (isNaN(days) || days < 1 || days > 365) {
            throw new Error('Invalid expiration days. Must be between 1 and 365 days');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(recipientEmail)) {
            throw new Error('Invalid email address');
        }

        // Check if user is not sharing with themselves
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true }
        });

        if (user?.email?.toLowerCase() === recipientEmail.toLowerCase()) {
            throw new Error('You cannot share a file with yourself');
        }
    }

    private generateShareToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    private calculateExpiresAt(days: number): Date {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date;
    }

    async createShare(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const clientOrigin = req.get("origin") || req.get("referer");

            console.log(" ++++++++++++++++++++++++++++++ ")
            console.log(req.body)
            console.log(" ++++++++++++++++++++++++++++++ ")


            const data: CreateShareRequest = {
                fileId: req.body.fileId,
                recipientEmail: req.body.recipientEmail,
                message: req.body.message,
                expirationDays: req.body.expirationDays,
                password: req.body.password
            };

            const userId = 'a83edaba-db41-4456-867f-5ea06c3c2471';// (req as any).user?.userId;

            //   const userId = req.user?.userId;
            if (!userId) {
                throw new Error('User not authenticated');
            }

            // Validate request
            await this.validateShareRequest(data, userId);

            // Get file details
            const file = await prisma.file.findUnique({
                where: { id: data.fileId },
                select: {
                    id: true,
                    fileName: true,
                    fileSize: true,
                    mimeType: true,
                    owner: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                }
            });

            if (!file) {
                throw new Error('File not found');
            }

            // Hash password if provided
            let hashedPassword: string | undefined;
            if (data.password) {
                hashedPassword = await bcrypt.hash(data.password, 12);
            }

            // Generate share token
            const shareToken = this.generateShareToken();
            const expiresAt = this.calculateExpiresAt(parseInt(data.expirationDays));

            // Create shared file record
            const sharedFile = await prisma.sharedFile.create({
                data: {
                    fileId: data.fileId,
                    userId: userId,
                    sharedBy: userId,
                    shareType: 'FILE',
                    permission: 'VIEW',
                    password: hashedPassword,
                    isPasswordProtected: !!hashedPassword,
                    allowDownload: true,
                    allowPrint: false,
                    allowCopy: false,
                    allowComment: false,
                    watermark: false,
                    requireEmail: true,
                    requireApproval: false,
                    expiresAt: expiresAt,
                    maxDownloads: null,
                    downloadCount: 0,
                    maxViews: null,
                    viewCount: 0,
                    accessCount: 0,
                    status: 'ACTIVE',
                    isActive: true,
                    isPublic: false,
                    message: data.message,
                    description: `Shared by ${file.owner?.firstName || ''} ${file.owner?.lastName || ''}`.trim(),
                    shareToken: shareToken,
                    notifyByEmail: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });

            // Send notification email
            try {
                const emailService = EmailServiceFactory.create();
                const shareUrl = `${clientOrigin}/share/${shareToken}`;


                await emailService.sendEmail({
                    to: data.recipientEmail,
                    subject: `${file.owner?.firstName || 'Someone'} shared a file with you`,
                    html: renderShareNotificationTemplate({
                        sharedBy: `${file.owner?.firstName || ''} ${file.owner?.lastName || ''}`.trim() || file.owner?.email || 'Unknown User',
                        fileName: file.fileName,
                        shareUrl: shareUrl,
                        message: data.message,
                        expiresAt: expiresAt,
                        requireApproval: false
                    }),
                    text: `${file.owner?.firstName || 'Someone'} shared "${file.fileName}" with you. Access it here: ${shareUrl}${data.message ? `\n\nMessage: ${data.message}` : ''}`
                });
            } catch (emailError) {
                console.error('Failed to send share notification email:', emailError);
                // Don't fail the share creation if email fails
            }

            // Update file share count
            await prisma.file.update({
                where: { id: data.fileId },
                data: {
                    shareCount: { increment: 1 },
                    isShared: true
                }
            });



            const response: CreateShareResponse = {
                success: true,
                data: {
                    id: sharedFile.id,
                    shareLink: `${clientOrigin}/share/${shareToken}`,
                    expiresAt: expiresAt.toISOString()
                },
                message: 'File shared successfully'
            };

            res.status(201).json(response);

        } catch (error) {
            console.error('Share creation error:', error);

            const response: CreateShareResponse = {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create share',
                message: 'Failed to share file'
            };

            res.status(400).json(response);
        }
    }
}

export const shareService = new ShareService();