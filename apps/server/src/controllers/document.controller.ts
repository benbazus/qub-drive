import { Request, Response } from "express";
import prisma from "../config/database.config";
import { AuthenticatedRequest, ApiResponse } from "../middleware/auth.middleware";
import { logger } from "../config/logger";
import { EmailServiceFactory } from "../services/email/email-service.factory";
import { ShareNotificationEmailData } from "../types/file.types";
import { FilePermission, SharePermission } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import documentService from "../services/document.service";

export interface ShareDocumentEmailData {
    email: string;
    permission: 'VIEW' | 'COMMENT' | 'EDIT';
    message?: string;
    expiresAt?: string;
    notifyUser?: boolean;
}

export interface ShareDocumentEmailResponse {
    success: boolean;
    shareId: string;
    message: string;
}

export interface DocumentActiveUser {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
}

class DocumentController {
    constructor() { }


    // Get document collaboration info
    public async getDocumentInfo(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const documentId = req?.params?.documentId;
            const userId = req.user?.userId;

            if (!userId) {

                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
            }

            const document = await prisma.document.findUnique({
                where: { id: documentId },
                include: {
                    owner: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    collaborators: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true
                                }
                            }
                        }
                    }
                }
            });

            if (!document) {
                this.handleError(res, new Error('Document not found'), 'Document not found', 404);
            }

            // Check if user has access to this document
            const isOwner = document?.ownerId === userId;
            const collaboration = document?.collaborators.find(c => c.userId === userId);

            if (!isOwner && !collaboration) {
                this.handleError(res, new Error('Access denied'), 'Access denied', 403);
            }

            // Determine user permissions
            let permissions = {
                canEdit: false,
                canComment: false,
                canShare: false,
                canView: true
            };

            if (isOwner) {
                permissions = {
                    canEdit: true,
                    canComment: true,
                    canShare: true,
                    canView: true
                };
            } else if (collaboration) {
                switch (collaboration.permission) {
                    case FilePermission.EDIT:
                        permissions.canEdit = true;
                        permissions.canComment = true;
                        break;
                    case FilePermission.COMMENT:
                        permissions.canComment = true;
                        break;
                    case FilePermission.ADMIN:
                        permissions.canEdit = true;
                        permissions.canComment = true;
                        permissions.canShare = true;
                        break;
                }
            }

            const documentInfo = {
                id: document?.id,
                title: document?.title,
                ownerId: document?.ownerId,
                owner: document?.owner,
                collaborators: document?.collaborators.map(c => ({
                    id: c.id,
                    userId: c.userId,
                    user: c.user,
                    permission: c.permission,
                    invitedAt: c.invitedAt,
                    acceptedAt: c.acceptedAt,
                    isOnline: c.isOnline,
                    lastSeenAt: c.lastSeenAt
                })),
                permissions,
                lastModified: document?.updatedAt,
                createdAt: document?.createdAt
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(documentInfo, null, 2));

        } catch (error: any) {
            console.error('Error getting document info:', error);
            this.handleError(res, error, 'Failed to retrieve profile');
        }
    }

    // Get document content
    public async getDocumentContent(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const documentId = req?.params?.documentId;
            const userId = req.user?.userId;

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            const document = await prisma.document.findUnique({
                where: { id: documentId },
                include: {
                    collaborators: {
                        where: { userId },
                        select: { permission: true }
                    },
                    versions: {
                        orderBy: { versionNumber: 'desc' },
                        take: 1,
                        select: {
                            content: true,
                            versionNumber: true
                        }
                    }
                }
            });

            if (!document) {
                this.handleError(res, new Error('Document not found'), 'Document not found', 404);
                return;
            }

            // Check if user has access to this document
            const isOwner = document.ownerId === userId;
            const collaboration = document.collaborators[0];

            if (!isOwner && !collaboration) {
                this.handleError(res, new Error('Access denied'), 'Access denied', 403);
                return;
            }

            // Get the latest version content if available, otherwise use document content
            const latestVersion = document.versions[0];
            const content = latestVersion ? latestVersion.content : document.content;
            const version = latestVersion ? latestVersion.versionNumber : 1;

            const documentContent = {
                documentId: document.id,
                title: document.title,
                content,
                lastModified: document.updatedAt,
                version,
                pageFormat: document.pageFormat,
                marginSize: document.marginSize,
                fontSize: document.fontSize,
                fontFamily: document.fontFamily
            };

            const response = {
                success: true,
                data: documentContent
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error: any) {
            console.error('Error getting document content:', error);
            this.handleError(res, error, 'Failed to get document content');
        }
    }

    // Save document content
    public async saveDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const documentId = req?.params?.documentId;
            const userId = req.user?.userId;
            const { title, content, pageFormat, marginSize, fontSize, fontFamily } = req.body;


            console.log(" ++++++++++++++++++++++++++++ ")
            console.log(req.user)
            console.log(" ++++++++++++++++++++++++++++ ")

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            // Save document to database
            await prisma.document.upsert({
                where: { id: documentId },
                update: {
                    title: title,
                    content: content,
                    updatedAt: new Date()
                },
                create: {
                    id: documentId,
                    title: title,
                    content: content,
                    owner: {
                        connect: { id: userId }
                    },
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });


            // // First check if document exists and user has permission
            // const document = await prisma.document.findUnique({
            //     where: { id: documentId },
            //     include: {
            //         collaborators: {
            //             where: { userId },
            //             select: { permission: true }
            //         }
            //     }
            // });

            // if (!document) {
            //     this.handleError(res, new Error('Document not found'), 'Document not found', 404);
            //     return;
            // }

            // // Check permissions
            // const isOwner = document.ownerId === userId;
            // const collaboration = document.collaborators[0];
            // const hasEditPermission = isOwner ||
            //     (collaboration && (collaboration.permission === FilePermission.EDIT || collaboration.permission === FilePermission.ADMIN));

            // if (!hasEditPermission) {
            //     this.handleError(res, new Error('Insufficient permissions'), 'Insufficient permissions to edit this document', 403);
            //     return;
            // }

            // Create a new version before updating
            // const currentVersionCount = await prisma.documentVersion.count({
            //     where: { documentId }
            // });

            // await prisma.$transaction(async (tx) => {
            //     // Create new version with previous content
            //     await tx.documentVersion.create({
            //         data: {
            //             documentId: documentId as string,
            //             content: document.content,
            //             versionNumber: currentVersionCount + 1,
            //             userId
            //         }
            //     });

            //     // Update document
            //     await tx.document.update({
            //         where: { id: documentId },
            //         data: {
            //             title: title || document.title,
            //             content: content || document.content,
            //             pageFormat: pageFormat || document.pageFormat,
            //             marginSize: marginSize || document.marginSize,
            //             fontSize: fontSize || document.fontSize,
            //             fontFamily: fontFamily || document.fontFamily,
            //             lastSaved: new Date(),
            //             lastEditAt: new Date()
            //         }
            //     });

            //     // Log activity
            //     await tx.activity.create({
            //         data: {
            //             userId,
            //             type: 'DOCUMENT_UPDATED',
            //             description: `Updated document: ${title || document.title}`,
            //             documentId,
            //             metadata: {
            //                 documentTitle: title || document.title,
            //                 action: 'save'
            //             }
            //         }
            //     });
            // });

            // const savedDocument = {
            //     documentId,
            //     title: title || document.title,
            //     content: content || document.content,
            //     lastModified: new Date().toISOString(),
            //     savedBy: userId,
            //     version: currentVersionCount + 1
            // };

            const response = {
                success: true,

                message: 'Document saved successfully'
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error: any) {
            console.log(" +++++++++++error+++++++++++++++++ ")
            console.log(error)
            console.log(" ++++++++++error++++++++++++++++++ ")

            logger.error('Error sharing document via email:', error);
            this.handleError(res, error, 'Failed to share document');
        }
    }

    public shareDocumentEmail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            logger.info('Share document email request received', {
                documentId: req.params?.documentId,
                body: req.body
            });

            if (!req.user) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            const userId = req.user.userId;
            const documentId = req.params?.documentId;
            const shareData: ShareDocumentEmailData = req.body;

            // Validate required fields
            if (!documentId) {
                this.handleError(res, new Error('Document ID required'), 'Document ID is required', 400);
                return;
            }

            if (!shareData.email) {
                this.handleError(res, new Error('Email required'), 'Email is required', 400);
                return;
            }

            if (!shareData.permission || !['VIEW', 'COMMENT', 'EDIT'].includes(shareData.permission)) {
                this.handleError(res, new Error('Invalid permission'), 'Valid permission (VIEW, COMMENT, EDIT) is required', 400);
                return;
            }

            // Check if document exists and user has permission to share
            const document = await prisma.file.findFirst({
                where: {
                    id: documentId,
                    userId, // Only owner can share for now
                    isDeleted: false,
                },
                include: {
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

            if (!document) {
                this.handleError(res, new Error('Document not found'), 'Document not found or you do not have permission to share it', 404);
                return;
            }

            // Check if user exists
            const targetUser = await prisma.user.findUnique({
                where: { email: shareData.email },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                }
            });

            if (!targetUser) {
                this.handleError(res, new Error('User not found'), 'User with this email does not exist', 404);
                return;
            }

            // Check if document is already shared with this user
            const existingShare = await prisma.sharedFile.findFirst({
                where: {
                    fileId: documentId,
                    isActive: true,
                    shareUsers: {
                        some: {
                            userId: targetUser.id
                        }
                    }
                }
            });

            let shareId: string;

            if (existingShare) {
                // Update existing share
                await prisma.shareUser.updateMany({
                    where: {
                        sharedFileId: existingShare.id,
                        userId: targetUser.id
                    },
                    data: {
                        permission: shareData.permission as any,
                        updatedAt: new Date()
                    }
                });
                shareId = existingShare.id;
            } else {
                // Create new share
                const newShare = await prisma.sharedFile.create({
                    data: {
                        userId: userId, // Add userId here
                        id: uuidv4(),
                        fileId: documentId,
                        sharedBy: userId,
                        shareType: 'DOCUMENT',
                        permission: shareData.permission as SharePermission,
                        expiresAt: shareData.expiresAt ? new Date(shareData.expiresAt) : null,
                        isActive: true,
                        shareUsers: {
                            create: {
                                userId: targetUser.id,
                                permission: shareData.permission as any,
                                //addedBy: userId
                            }
                        }
                    }
                });
                shareId = newShare.id;

                // Update file shared status
                await prisma.file.update({
                    where: { id: documentId },
                    data: { isShared: true }
                });
            }

            // Send email notification if requested
            if (shareData.notifyUser !== false) {
                try {
                    const emailService = EmailServiceFactory.create();
                    const emailData: ShareNotificationEmailData = {
                        fileName: document.fileName,
                        sharedBy: `${document?.user?.firstName} ${document?.user?.lastName}`,
                        message: shareData.message,
                        shareUrl: `${process.env.CLIENT_URL}/documents/${documentId}`,
                        fileSize: this.formatFileSize(Number(document.fileSize || 0)),
                        fileType: document.mimeType || 'Document',
                        expiresAt: shareData.expiresAt ? new Date(shareData.expiresAt) : undefined,
                        recipientName: `${targetUser.firstName} ${targetUser.lastName}`,
                        requireApproval: false
                    };

                    await emailService.sendShareNotificationEmail(targetUser.email, emailData);
                } catch (emailError) {
                    logger.warn('Failed to send share notification email:', emailError);
                    // Don't fail the request if email fails
                }
            }

            const response: ApiResponse<ShareDocumentEmailResponse> = {
                success: true,
                data: {
                    success: true,
                    shareId,
                    message: `Document shared successfully with ${shareData.email}`
                }
            };

            res.status(200).json(response);

        } catch (error: any) {
            logger.error('Error sharing document via email:', error);
            this.handleError(res, error, 'Failed to share document');
        }
    };

    /**
     * Get active users of a document
     * GET /documents/:documentId/active-users
     */
    public getDocumentActiveUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            logger.info('Get document active users request received', {
                documentId: req.params?.documentId,
                userId: req.user?.userId
            });

            if (!req.user) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            const userId = req.user.userId;
            const documentId = req.params?.documentId;

            if (!documentId) {
                this.handleError(res, new Error('Document ID required'), 'Document ID is required', 400);
                return;
            }

            // Check if user has access to the document
            const document = await prisma.file.findFirst({
                where: {
                    id: documentId,
                    OR: [
                        { userId }, // User owns the document
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

            if (!document) {
                this.handleError(res, new Error('Document not found'), 'Document not found or access denied', 404);
                return;
            }

            // Get all users who have access to the document
            const activeUsers: DocumentActiveUser[] = [];

            // Add document owner
            const owner = await prisma.user.findUnique({
                where: { id: document.userId! },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true
                }
            });

            if (owner) {
                activeUsers.push({
                    id: owner.id,
                    email: owner.email,
                    name: `${owner.firstName} ${owner.lastName}`,
                    role: 'owner',
                    status: 'online' // In a real implementation, you'd check actual online status
                });
            }

            // Get shared users
            const sharedUsers = await prisma.shareUser.findMany({
                where: {
                    sharedFile: {
                        fileId: documentId,
                        isActive: true,
                        OR: [
                            { expiresAt: null },
                            { expiresAt: { gt: new Date() } }
                        ]
                    }
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            role: true
                        }
                    },
                    sharedFile: {
                        select: {
                            permission: true
                        }
                    }
                }
            });

            // Add shared users
            for (const shareUser of sharedUsers) {
                if (shareUser.user && !activeUsers.find(u => u.id === shareUser.user!.id)) {
                    activeUsers.push({
                        id: shareUser.user.id,
                        email: shareUser.user.email,
                        name: `${shareUser.user.firstName} ${shareUser.user.lastName}`,
                        role: shareUser.sharedFile.permission.toLowerCase(),
                        status: this.getUserOnlineStatus(shareUser.user.id) // Mock implementation
                    });
                }
            }

            const response: ApiResponse<DocumentActiveUser[]> = {
                success: true,
                data: activeUsers
            };

            res.status(200).json(response);

        } catch (error: any) {
            logger.error('Error getting document active users:', error);
            this.handleError(res, error, 'Failed to get document active users');
        }
    };

    /**
     * Invite user to collaborate on document
     * POST /documents/:documentId/invite
     */
    public inviteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const documentId = req.params?.documentId;
            const userId = req.user?.userId;
            const { email, role, message } = req.body;

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            // Validate required fields
            if (!email || !role) {
                this.handleError(res, new Error('Email and role are required'), 'Email and role are required', 400);
                return;
            }

            const collaboration = await documentService.inviteUserToDocument(documentId, userId, {
                email,
                role,
                message
            });

            const response = {
                success: true,
                data: collaboration,
                message: 'User invited successfully'
            };

            res.status(200).json(response);

        } catch (error: any) {
            logger.error('Error inviting user:', error);
            this.handleError(res, error, error.message || 'Failed to invite user');
        }
    };

    /**
     * Change collaborator permission
     * PUT /documents/:documentId/collaborators/:userId/permission
     */
    public changePermission = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const documentId = req.params?.documentId;
            const targetUserId = req.params?.userId;
            const currentUserId = req.user?.userId;
            const { permission } = req.body;

            if (!currentUserId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            if (!permission) {
                this.handleError(res, new Error('Permission required'), 'Permission is required', 400);
                return;
            }

            const updatedCollaboration = await documentService.changeCollaboratorPermission(
                documentId,
                targetUserId,
                currentUserId,
                permission
            );

            const response = {
                success: true,
                data: updatedCollaboration,
                message: 'Permission updated successfully'
            };

            res.status(200).json(response);

        } catch (error: any) {
            logger.error('Error changing permission:', error);
            this.handleError(res, error, error.message || 'Failed to change permission');
        }
    };

    /**
     * Remove collaborator from document
     * DELETE /documents/:documentId/collaborators/:userId
     */
    public removeCollaborator = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const documentId = req.params?.documentId;
            const targetUserId = req.params?.userId;
            const currentUserId = req.user?.userId;

            if (!currentUserId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            await documentService.removeCollaborator(documentId, targetUserId, currentUserId);

            const response = {
                success: true,
                message: 'Collaborator removed successfully'
            };

            res.status(200).json(response);

        } catch (error: any) {
            logger.error('Error removing collaborator:', error);
            this.handleError(res, error, error.message || 'Failed to remove collaborator');
        }
    };

    /**
     * Update document link access settings
     * PUT /documents/:documentId/link-access
     */
    public updateLinkAccess = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const documentId = req.params?.documentId;
            const userId = req.user?.userId;
            const { linkAccess, allowComments, allowDownload } = req.body;

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            const linkSettings = await documentService.updateDocumentLinkAccess(documentId, userId, {
                linkAccess,
                allowComments: allowComments ?? false,
                allowDownload: allowDownload ?? true
            });

            const response = {
                success: true,
                data: linkSettings,
                message: 'Link access settings updated successfully'
            };

            res.status(200).json(response);

        } catch (error: any) {
            logger.error('Error updating link access:', error);
            this.handleError(res, error, error.message || 'Failed to update link access settings');
        }
    };

    /**
     * Get document link access settings
     * GET /documents/:documentId/link-access
     */
    public getLinkAccess = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const documentId = req.params?.documentId;
            const userId = req.user?.userId;

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            const linkAccess = await documentService.getDocumentLinkAccess(documentId, userId);

            const response = {
                success: true,
                data: linkAccess
            };

            res.status(200).json(response);

        } catch (error: any) {
            logger.error('Error getting link access:', error);
            this.handleError(res, error, error.message || 'Failed to get link access settings');
        }
    };

    /**
     * Get document collaborators
     * GET /documents/:documentId/collaborators
     */
    public getCollaborators = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const documentId = req.params?.documentId;
            const userId = req.user?.userId;

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            const collaborators = await documentService.getDocumentCollaborators(documentId, userId);

            const response = {
                success: true,
                data: collaborators
            };

            res.status(200).json(response);

        } catch (error: any) {
            logger.error('Error getting collaborators:', error);
            this.handleError(res, error, error.message || 'Failed to get collaborators');
        }
    };

    /**
     * Mock implementation for getting user online status
     * In a real implementation, this would check Redis, WebSocket connections, etc.
     */
    private getUserOnlineStatus(userId: string): string {
        // Mock implementation - randomly assign status
        const statuses = ['online', 'away', 'offline'];
        return statuses[Math.floor(Math.random() * statuses.length)];
    }

    /**
     * Format file size in human readable format
     */
    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get comments for a document
     * GET /documents/:documentId/comments
     */
    public getComments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const documentId = req.params?.documentId;
            const userId = req.user?.userId;

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            if (!documentId) {
                this.handleError(res, new Error('Document ID required'), 'Document ID is required', 400);
                return;
            }

            const comments = await documentService.getDocumentComments(documentId, userId);

            const response = {
                success: true,
                data: {
                    comments,
                    stats: {
                        total: comments.length,
                        resolved: comments.filter(c => c.isResolved).length,
                        unresolved: comments.filter(c => !c.isResolved).length
                    }
                }
            };

            res.status(200).json(response);

        } catch (error: any) {
            logger.error('Error getting comments:', error);
            this.handleError(res, error, error.message || 'Failed to get comments');
        }
    };

    /**
     * Add a comment to a document
     * POST /documents/:documentId/comments
     */
    public addComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const documentId = req.params?.documentId;
            const userId = req.user?.userId;
            const { content, position } = req.body;

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            if (!documentId || !content) {
                this.handleError(res, new Error('Document ID and content required'), 'Document ID and content are required', 400);
                return;
            }

            const comment = await documentService.addComment(documentId, userId, content, position);

            const response = {
                success: true,
                data: comment,
                message: 'Comment added successfully'
            };

            res.status(201).json(response);

        } catch (error: any) {
            logger.error('Error adding comment:', error);
            this.handleError(res, error, error.message || 'Failed to add comment');
        }
    };

    /**
     * Reply to a comment
     * POST /comments/:commentId/replies
     */
    public addCommentReply = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const commentId = req.params?.commentId;
            const userId = req.user?.userId;
            const { content } = req.body;

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            if (!commentId || !content) {
                this.handleError(res, new Error('Comment ID and content required'), 'Comment ID and content are required', 400);
                return;
            }

            const reply = await documentService.addCommentReply(commentId, userId, content);

            const response = {
                success: true,
                data: reply,
                message: 'Reply added successfully'
            };

            res.status(201).json(response);

        } catch (error: any) {
            logger.error('Error adding reply:', error);
            this.handleError(res, error, error.message || 'Failed to add reply');
        }
    };

    /**
     * Update a comment
     * PUT /comments/:commentId
     */
    public updateComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const commentId = req.params?.commentId;
            const userId = req.user?.userId;
            const { content } = req.body;

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            if (!commentId || !content) {
                this.handleError(res, new Error('Comment ID and content required'), 'Comment ID and content are required', 400);
                return;
            }

            const comment = await documentService.updateComment(commentId, userId, content);

            const response = {
                success: true,
                data: comment,
                message: 'Comment updated successfully'
            };

            res.status(200).json(response);

        } catch (error: any) {
            logger.error('Error updating comment:', error);
            this.handleError(res, error, error.message || 'Failed to update comment');
        }
    };

    /**
     * Delete a comment
     * DELETE /comments/:commentId
     */
    public deleteComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const commentId = req.params?.commentId;
            const userId = req.user?.userId;

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            if (!commentId) {
                this.handleError(res, new Error('Comment ID required'), 'Comment ID is required', 400);
                return;
            }

            await documentService.deleteComment(commentId, userId);

            const response = {
                success: true,
                message: 'Comment deleted successfully'
            };

            res.status(200).json(response);

        } catch (error: any) {
            logger.error('Error deleting comment:', error);
            this.handleError(res, error, error.message || 'Failed to delete comment');
        }
    };

    /**
     * Resolve/unresolve a comment
     * PATCH /comments/:commentId/resolve
     */
    public toggleCommentResolution = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const commentId = req.params?.commentId;
            const userId = req.user?.userId;
            const { isResolved } = req.body;

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            if (!commentId) {
                this.handleError(res, new Error('Comment ID required'), 'Comment ID is required', 400);
                return;
            }

            const comment = await documentService.toggleCommentResolution(commentId, userId, isResolved);

            const response = {
                success: true,
                data: comment,
                message: `Comment ${isResolved ? 'resolved' : 'unresolved'} successfully`
            };

            res.status(200).json(response);

        } catch (error: any) {
            logger.error('Error toggling comment resolution:', error);
            this.handleError(res, error, error.message || 'Failed to update comment resolution');
        }
    };

    /**
     * Handle errors consistently
     */
    private handleError(res: Response, error: Error, message: string, statusCode: number = 500): void {
        logger.error(message, error);

        const response: ApiResponse = {
            success: false,
            error: message,
            message: error.message || message,
            timestamp: new Date().toISOString()
        };

        res.status(statusCode).json(response);
    }
}

export default new DocumentController();