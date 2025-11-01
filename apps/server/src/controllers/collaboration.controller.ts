import { Request, Response } from 'express';
import prisma from '../config/database.config';
import { ApiResponse, AuthenticatedRequest } from '../middleware/auth.middleware';
import { FilePermission, CollaborationRole } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { EmailServiceFactory } from '../services/email/email-service.factory';
import { ServerResponse } from 'http';

class CollaborationController {



    // Get document collaboration info
    public async getDocumentInfo(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
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

        } catch (error) {
            console.error('Error getting document info:', error);
            this.handleError(res, error, 'Failed to retrieve profile');
        }
    }

    // Get document content
    public async getDocumentContent(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
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
        } catch (error) {
            console.error('Error getting document content:', error);
            this.handleError(res, error, 'Failed to get document content');
        }
    }

    // Save document content
    public async saveDocument(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
        try {
            const documentId = req?.params?.documentId;
            const userId = req.user?.userId;
            const { title, content, pageFormat, marginSize, fontSize, fontFamily } = req.body;

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            // First check if document exists and user has permission
            const document = await prisma.document.findUnique({
                where: { id: documentId },
                include: {
                    collaborators: {
                        where: { userId },
                        select: { permission: true }
                    }
                }
            });

            if (!document) {
                this.handleError(res, new Error('Document not found'), 'Document not found', 404);
                return;
            }

            // Check permissions
            const isOwner = document.ownerId === userId;
            const collaboration = document.collaborators[0];
            const hasEditPermission = isOwner ||
                (collaboration && (collaboration.permission === FilePermission.EDIT || collaboration.permission === FilePermission.ADMIN));

            if (!hasEditPermission) {
                this.handleError(res, new Error('Insufficient permissions'), 'Insufficient permissions to edit this document', 403);
                return;
            }

            // Create a new version before updating
            const currentVersionCount = await prisma.documentVersion.count({
                where: { documentId }
            });

            await prisma.$transaction(async (tx) => {
                // Create new version with previous content
                await tx.documentVersion.create({
                    data: {
                        documentId: documentId as string,
                        content: document.content,
                        versionNumber: currentVersionCount + 1,
                        userId
                    }
                });

                // Update document
                await tx.document.update({
                    where: { id: documentId },
                    data: {
                        title: title || document.title,
                        content: content || document.content,
                        pageFormat: pageFormat || document.pageFormat,
                        marginSize: marginSize || document.marginSize,
                        fontSize: fontSize || document.fontSize,
                        fontFamily: fontFamily || document.fontFamily,
                        lastSaved: new Date(),
                        lastEditAt: new Date()
                    }
                });

                // Log activity
                await tx.activity.create({
                    data: {
                        userId,
                        type: 'DOCUMENT_UPDATED',
                        description: `Updated document: ${title || document.title}`,
                        documentId,
                        metadata: {
                            documentTitle: title || document.title,
                            action: 'save'
                        }
                    }
                });
            });

            const savedDocument = {
                documentId,
                title: title || document.title,
                content: content || document.content,
                lastModified: new Date().toISOString(),
                savedBy: userId,
                version: currentVersionCount + 1
            };

            const response = {
                success: true,
                data: savedDocument,
                message: 'Document saved successfully'
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {
            console.error('Error saving document:', error);
            this.handleError(res, error, 'Failed to save document');
        }
    }

    // Create new document
    public async createDocument(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
        try {
            const { title, pageFormat, marginSize, fontSize, fontFamily } = req.body;

            const userId = req.user?.userId;

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            const documentData = {
                title: title || 'Untitled Document',
                content: '<p>Start typing here...</p>',
                ownerId: userId,
                pageFormat: pageFormat || 'A4',
                marginSize: marginSize || 'normal',
                fontSize: fontSize || 16,
                fontFamily: fontFamily || 'inherit',
                isPublic: false
            };

            const newDocument = await prisma.$transaction(async (tx) => {
                // Create the document
                const document = await tx.document.create({
                    data: documentData,
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

                // Create initial document version
                await tx.documentVersion.create({
                    data: {
                        documentId: document.id,
                        content: document.content,
                        versionNumber: 1,
                        userId
                    }
                });

                // Log activity
                await tx.activity.create({
                    data: {
                        userId,
                        type: 'DOCUMENT_CREATED',
                        description: `Created document: ${document.title}`,
                        documentId: document.id,
                        metadata: {
                            documentTitle: document.title,
                            action: 'create'
                        }
                    }
                });

                return document;
            });

            const responseData = {
                id: newDocument.id,
                title: newDocument.title,
                content: newDocument.content,
                ownerId: newDocument.ownerId,
                owner: newDocument.owner,
                pageFormat: newDocument.pageFormat,
                marginSize: newDocument.marginSize,
                fontSize: newDocument.fontSize,
                fontFamily: newDocument.fontFamily,
                createdAt: newDocument.createdAt,
                lastModified: newDocument.updatedAt,
                collaborators: [
                    {
                        userId: newDocument.ownerId,
                        user: newDocument.owner,
                        permission: FilePermission.ADMIN,
                        role: 'owner',
                        joinedAt: newDocument.createdAt
                    }
                ]
            };

            const response = {
                success: true,
                data: responseData,
                message: 'Document created successfully'
            };

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {
            console.error('Error creating document:', error);
            this.handleError(res, error, 'Failed to create document');
        }
    }

    // Get user's documents
    public async getUserDocuments(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
        try {

            const userId = req.user?.userId;
            const currentUserId = req.user?.userId;

            if (!currentUserId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            // Only allow users to fetch their own documents
            if (userId !== currentUserId) {
                this.handleError(res, new Error('Access denied'), 'Access denied', 403);
                return;
            }

            // Get documents where user is owner
            const ownedDocuments = await prisma.document.findMany({
                where: { ownerId: userId },
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
                        select: {
                            userId: true,
                            permission: true
                        }
                    }
                },
                orderBy: { updatedAt: 'desc' }
            });

            // Get documents where user is a collaborator
            const collaboratorDocuments = await prisma.document.findMany({
                where: {
                    collaborators: {
                        some: { userId }
                    }
                },
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
                        where: { userId },
                        select: {
                            permission: true,
                            invitedAt: true,
                            acceptedAt: true
                        }
                    }
                },
                orderBy: { updatedAt: 'desc' }
            });

            // Format owned documents
            const formattedOwnedDocs = ownedDocuments.map(doc => ({
                id: doc.id,
                title: doc.title,
                lastModified: doc.updatedAt,
                lastEditAt: doc.lastEditAt,
                role: 'owner',
                permission: FilePermission.ADMIN,
                isShared: doc.collaborators.length > 0,
                collaboratorCount: doc.collaborators.length,
                owner: doc.owner,
                createdAt: doc.createdAt,
                pageFormat: doc.pageFormat,
                marginSize: doc.marginSize,
                fontSize: doc.fontSize,
                fontFamily: doc.fontFamily
            }));

            // Format collaborator documents
            const formattedCollabDocs = collaboratorDocuments.map(doc => {
                const collaboration = doc.collaborators[0];
                return {
                    id: doc.id,
                    title: doc.title,
                    lastModified: doc.updatedAt,
                    lastEditAt: doc.lastEditAt,
                    role: 'collaborator',
                    permission: collaboration.permission,
                    isShared: true,
                    owner: doc.owner,
                    invitedAt: collaboration.invitedAt,
                    acceptedAt: collaboration.acceptedAt,
                    createdAt: doc.createdAt,
                    pageFormat: doc.pageFormat,
                    marginSize: doc.marginSize,
                    fontSize: doc.fontSize,
                    fontFamily: doc.fontFamily
                };
            });

            // Combine and sort all documents
            const allDocuments = [...formattedOwnedDocs, ...formattedCollabDocs]
                .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

            const response = {
                success: true,
                data: {
                    documents: allDocuments,
                    stats: {
                        total: allDocuments.length,
                        owned: formattedOwnedDocs.length,
                        collaborative: formattedCollabDocs.length
                    }
                }
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {
            console.error('Error getting user documents:', error);
            this.handleError(res, error, 'Failed to get user documents');
        }
    }

    // Share document
    public async shareDocument(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
        try {
            const documentId = req?.params?.documentId;
            const userId = req.user?.userId;
            const { email, permission, message } = req.body;


            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            // Validate permission
            if (!Object.values(FilePermission).includes(permission)) {
                this.handleError(res, new Error('Invalid permission specified'), 'Invalid permission specified', 400);
                return;
            }

            // Check if document exists and user has share permissions
            const document = await prisma.document.findUnique({
                where: { id: documentId },
                include: {
                    collaborators: {
                        where: { userId },
                        select: { permission: true }
                    }
                }
            });

            if (!document) {
                this.handleError(res, new Error('Document not found'), 'Document not found', 404);
                return;
            }

            // Check if user can share this document
            const isOwner = document.ownerId === userId;
            const collaboration = document.collaborators[0];
            const canShare = isOwner ||
                (collaboration && collaboration.permission === FilePermission.ADMIN);

            if (!canShare) {
                this.handleError(res, new Error('Insufficient permissions to share this document'), 'Insufficient permissions to share this document', 403);
                return;
            }

            // Check if user with email exists
            const targetUser = await prisma.user.findUnique({
                where: { email },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                }
            });

            if (!targetUser) {
                // Create pending invitation for non-existing user
                const invitationToken = uuidv4();
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

                const pendingInvitation = await prisma.pendingInvitation.create({
                    data: {
                        email,
                        documentId: documentId as string,
                        role: permission as CollaborationRole,
                        token: invitationToken,
                        invitedBy: userId,
                        message,
                        expiresAt
                    },
                    include: {
                        document: {
                            select: {
                                title: true
                            }
                        },
                        inviter: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        }
                    }
                });

                // Send invitation email to non-existing user
                try {
                    const emailService = EmailServiceFactory.create();
                    await emailService.sendInvitation(email, {
                        email,
                        documentTitle: document.title,
                        inviterName: `${pendingInvitation?.inviter?.firstName} ${pendingInvitation?.inviter?.lastName}`,
                        invitationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/collaboration/invitation/${invitationToken}`,
                        role: permission,
                        message,
                        isExistingUser: false,
                        recipientName: email.split('@')[0],
                        companyName: process.env.COMPANY_NAME || 'FileShare'
                    });
                } catch (emailError) {
                    console.error('Failed to send invitation email:', emailError);
                    // Don't fail the operation if email fails, just log it
                }

                const response = {
                    success: true,
                    data: {
                        type: 'invitation',
                        documentId,
                        email,
                        permission,
                        invitationId: pendingInvitation.id,
                        token: invitationToken,
                        expiresAt,
                        message: 'Invitation sent to email address'
                    },
                    message: `Invitation sent to ${email}`
                };
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(response, null, 2));
                return;
            }

            // Check if user is already a collaborator
            const existingCollaboration = await prisma.documentCollaborator.findUnique({
                where: {
                    documentId_userId: {
                        documentId: documentId!,
                        userId: targetUser.id
                    }
                }
            });

            if (existingCollaboration) {
                this.handleError(res, new Error('User is already a collaborator on this document'), 'User is already a collaborator on this document', 400);
                return;
            }

            // Create collaboration
            const collaboration_new = await prisma.$transaction(async (tx) => {
                const collab = await tx.documentCollaborator.create({
                    data: {
                        documentId: documentId!,
                        userId: targetUser.id,
                        permission: permission as FilePermission,
                        acceptedAt: new Date() // Auto-accept for existing users
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

                // Log activity
                await tx.activity.create({
                    data: {
                        userId,
                        type: 'DOCUMENT_SHARED',
                        description: `Shared document "${document.title}" with ${targetUser.email}`,
                        documentId,
                        metadata: {
                            documentTitle: document.title,
                            sharedWith: targetUser.email,
                            permission,
                            action: 'share'
                        }
                    }
                });

                return collab;
            });

            // Send notification email to target user
            try {
                const emailService = EmailServiceFactory.create();
                const inviterUser = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { firstName: true, lastName: true }
                });

                await emailService.sendCollaborationNotification(targetUser.email, {
                    documentTitle: document.title,
                    collaboratorName: `${targetUser.firstName} ${targetUser.lastName}`,
                    collaboratorEmail: targetUser.email,
                    permission: permission,
                    documentUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/documents/${documentId}`,
                    addedBy: `${inviterUser?.firstName} ${inviterUser?.lastName}`,
                    addedAt: new Date(),
                    message,
                    recipientName: targetUser.firstName,
                    companyName: process.env.COMPANY_NAME || 'FileShare'
                });
            } catch (emailError) {
                console.error('Failed to send collaboration notification email:', emailError);
                // Don't fail the operation if email fails, just log it
            }

            const response = {
                success: true,
                data: {
                    type: 'collaboration',
                    documentId,
                    collaborator: {
                        id: collaboration_new.id,
                        userId: collaboration_new.userId,
                        user: collaboration_new.user,
                        permission: collaboration_new.permission,
                        invitedAt: collaboration_new.invitedAt,
                        acceptedAt: collaboration_new.acceptedAt
                    }
                },
                message: `Document shared with ${targetUser.email}`
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {
            console.error('Error sharing document:', error);
            this.handleError(res, error, 'Failed to share document');
        }
    }

    // Get document collaborators
    public async getCollaborators(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
        try {
            const documentId = req?.params?.documentId;
            const userId = req.user?.userId;

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            // Check if document exists and user has access
            const document = await prisma.document.findUnique({
                where: { id: documentId },
                include: {
                    owner: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            avatar: true,
                            lastLoginAt: true
                        }
                    },
                    collaborators: {
                        where: { userId },
                        select: { permission: true }
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

            // Get all collaborators
            const collaborators = await prisma.documentCollaborator.findMany({
                where: { documentId },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            avatar: true,
                            lastLoginAt: true,
                            isActive: true
                        }
                    }
                },
                orderBy: { invitedAt: 'asc' }
            });

            // Get pending invitations
            const pendingInvitations = await prisma.pendingInvitation.findMany({
                where: {
                    documentId,
                    expiresAt: {
                        gt: new Date()
                    }
                },
                include: {
                    inviter: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            // Format collaborators data
            const formattedCollaborators = [
                // Document owner
                {
                    id: `owner-${document.owner.id}`,
                    userId: document.owner.id,
                    name: `${document.owner.firstName} ${document.owner.lastName}`,
                    firstName: document.owner.firstName,
                    lastName: document.owner.lastName,
                    email: document.owner.email,
                    avatar: document.owner.avatar,
                    permission: FilePermission.ADMIN,
                    role: 'owner',
                    status: document.owner.lastLoginAt &&
                        new Date().getTime() - new Date(document.owner.lastLoginAt).getTime() < 5 * 60 * 1000
                        ? 'online' : 'offline',
                    isOnline: document.owner.lastLoginAt &&
                        new Date().getTime() - new Date(document.owner.lastLoginAt).getTime() < 5 * 60 * 1000,
                    lastSeen: document.owner.lastLoginAt,
                    invitedAt: document.createdAt,
                    acceptedAt: document.createdAt,
                    isPending: false
                },
                // Accepted collaborators
                ...collaborators.map(collab => ({
                    id: collab.id,
                    userId: collab.userId,
                    name: `${collab.user.firstName} ${collab.user.lastName}`,
                    firstName: collab.user.firstName,
                    lastName: collab.user.lastName,
                    email: collab.user.email,
                    avatar: collab.user.avatar,
                    permission: collab.permission,
                    role: 'collaborator',
                    status: collab.isOnline ? 'online' :
                        (collab.user.lastLoginAt &&
                            new Date().getTime() - new Date(collab.user.lastLoginAt).getTime() < 30 * 60 * 1000
                            ? 'away' : 'offline'),
                    isOnline: collab.isOnline,
                    lastSeen: collab.lastSeenAt || collab.user.lastLoginAt,
                    invitedAt: collab.invitedAt,
                    acceptedAt: collab.acceptedAt,
                    isPending: false
                })),
                // Pending invitations
                ...pendingInvitations.map(invitation => ({
                    id: `pending-${invitation.id}`,
                    invitationId: invitation.id,
                    email: invitation.email,
                    name: invitation.email,
                    permission: invitation.role,
                    role: 'invited',
                    status: 'pending',
                    isOnline: false,
                    invitedAt: invitation.createdAt,
                    expiresAt: invitation.expiresAt,
                    invitedBy: invitation.inviter,
                    message: invitation.message,
                    token: invitation.token,
                    isPending: true
                }))
            ];

            const response = {
                success: true,
                data: {
                    collaborators: formattedCollaborators,
                    stats: {
                        total: formattedCollaborators.length,
                        active: collaborators.filter(c => c.isOnline).length + 1, // +1 for owner
                        pending: pendingInvitations.length,
                        accepted: collaborators.length + 1 // +1 for owner
                    }
                }
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {
            console.error('Error getting collaborators:', error);
            this.handleError(res, error, 'Failed to get collaborators');
        }
    }

    // Update collaborator permissions
    public async updatePermissions(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
        try {
            const documentId = req?.params?.documentId;
            const collaboratorUserId = req?.params?.collaboratorUserId;
            const { permission } = req.body;

            const userId = req.user?.userId;

            if (!documentId || !collaboratorUserId) {
                this.handleError(res, new Error('Missing required parameters'), 'Missing required parameters', 400);
                return;
            }

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            // Validate permission
            if (!Object.values(FilePermission).includes(permission)) {
                this.handleError(res, new Error('Invalid permission specified'), 'Invalid permission specified', 400);
                return;
            }

            // Check if document exists and user has admin permissions
            const document = await prisma.document.findUnique({
                where: { id: documentId },
                include: {
                    collaborators: {
                        where: { userId },
                        select: { permission: true }
                    }
                }
            });

            if (!document) {
                this.handleError(res, new Error('Document not found'), 'Document not found', 404);
                return;
            }

            // Check if user can update permissions (must be owner or admin)
            const isOwner = document.ownerId === userId;
            const collaboration = document.collaborators[0];
            const canUpdatePermissions = isOwner ||
                (collaboration && collaboration.permission === FilePermission.ADMIN);

            if (!canUpdatePermissions) {
                this.handleError(res, new Error('Insufficient permissions to update collaborator permissions'), 'Insufficient permissions to update collaborator permissions', 403);
                return;
            }

            // Check if target collaborator exists
            const targetCollaboration = await prisma.documentCollaborator.findUnique({
                where: {
                    documentId_userId: {
                        documentId,
                        userId: collaboratorUserId
                    }
                },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                }
            });

            if (!targetCollaboration) {
                this.handleError(res, new Error('Collaborator not found'), 'Collaborator not found', 404);
                return;
            }

            // Cannot update owner permissions
            if (document.ownerId === collaboratorUserId) {
                this.handleError(res, new Error('Cannot update owner permissions'), 'Cannot update owner permissions', 400);
                return;
            }

            // Update collaborator permissions
            const updatedCollaboration = await prisma.$transaction(async (tx) => {
                const updated = await tx.documentCollaborator.update({
                    where: {
                        documentId_userId: {
                            documentId,
                            userId: collaboratorUserId
                        }
                    },
                    data: {
                        permission: permission as FilePermission
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

                // Log activity
                await tx.activity.create({
                    data: {
                        userId,
                        type: 'PERMISSION_CHANGED',
                        description: `Updated permissions for ${targetCollaboration.user.email} to ${permission}`,
                        documentId,
                        metadata: {
                            documentTitle: document.title,
                            targetUser: targetCollaboration.user.email,
                            oldPermission: targetCollaboration.permission,
                            newPermission: permission,
                            action: 'update_permissions'
                        }
                    }
                });

                return updated;
            });

            const response = {
                success: true,
                message: `User permissions updated to ${permission}`,
                data: {
                    documentId,
                    collaborator: {
                        id: updatedCollaboration.id,
                        userId: updatedCollaboration.userId,
                        user: updatedCollaboration.user,
                        permission: updatedCollaboration.permission,
                        invitedAt: updatedCollaboration.invitedAt,
                        acceptedAt: updatedCollaboration.acceptedAt
                    },
                    oldPermission: targetCollaboration.permission,
                    newPermission: permission,
                    updatedBy: userId,
                    updatedAt: new Date().toISOString()
                }
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {
            console.error('Error updating permissions:', error);
            this.handleError(res, error, 'Failed to update permissions');
        }
    }

    // Remove collaborator
    public async removeCollaborator(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
        try {
            const documentId = req?.params?.documentId;
            const collaboratorUserId = req?.params?.collaboratorUserId;

            const userId = req.user?.userId;

            if (!documentId || !collaboratorUserId) {
                this.handleError(res, new Error('Missing required parameters'), 'Missing required parameters', 400);
                return;
            }

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            // Check if document exists and user has admin permissions
            const document = await prisma.document.findUnique({
                where: { id: documentId },
                include: {
                    collaborators: {
                        where: { userId },
                        select: { permission: true }
                    }
                }
            });

            if (!document) {
                this.handleError(res, new Error('Document not found'), 'Document not found', 404);
                return;
            }

            // Check if user can remove collaborators (must be owner or admin)
            const isOwner = document.ownerId === userId;
            const collaboration = document.collaborators[0];
            const canRemoveCollaborators = isOwner ||
                (collaboration && collaboration.permission === FilePermission.ADMIN);

            // Allow users to remove themselves
            const isRemovingSelf = collaboratorUserId === userId;

            if (!canRemoveCollaborators && !isRemovingSelf) {
                this.handleError(res, new Error('Insufficient permissions to remove collaborator'), 'Insufficient permissions to remove collaborator', 403);
                return;
            }

            // Cannot remove document owner
            if (document.ownerId === collaboratorUserId) {
                this.handleError(res, new Error('Cannot remove document owner'), 'Cannot remove document owner', 400);
                return;
            }

            // Check if target collaborator exists
            const targetCollaboration = await prisma.documentCollaborator.findUnique({
                where: {
                    documentId_userId: {
                        documentId,
                        userId: collaboratorUserId
                    }
                },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                }
            });

            if (!targetCollaboration) {
                this.handleError(res, new Error('Collaborator not found'), 'Collaborator not found', 404);
                return;
            }

            // Remove collaborator
            await prisma.$transaction(async (tx) => {
                // Remove the collaboration
                await tx.documentCollaborator.delete({
                    where: {
                        documentId_userId: {
                            documentId,
                            userId: collaboratorUserId
                        }
                    }
                });

                // Log activity
                const actionDescription = isRemovingSelf
                    ? `Left document: "${document.title}"`
                    : `Removed ${targetCollaboration.user.email} from document: "${document.title}"`;

                await tx.activity.create({
                    data: {
                        userId,
                        type: 'COLLABORATION_ENDED',
                        description: actionDescription,
                        documentId,
                        metadata: {
                            documentTitle: document.title,
                            removedUser: targetCollaboration.user.email,
                            previousPermission: targetCollaboration.permission,
                            action: isRemovingSelf ? 'leave' : 'remove',
                            isOwnerAction: isOwner
                        }
                    }
                });
            });

            const response = {
                success: true,
                message: isRemovingSelf
                    ? 'Successfully left the document'
                    : 'Collaborator removed successfully',
                data: {
                    documentId,
                    removedCollaborator: {
                        userId: collaboratorUserId,
                        user: targetCollaboration.user,
                        permission: targetCollaboration.permission
                    },
                    removedBy: userId,
                    removedAt: new Date().toISOString(),
                    isOwnerAction: isOwner,
                    isSelfRemoval: isRemovingSelf
                }
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {
            console.error('Error removing collaborator:', error);
            this.handleError(res, error, 'Failed to remove collaborator');
        }
    }

    // Add comment to document
    public async addComment(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
        try {

            const { content, position } = req.body;
            const documentId = req?.params?.documentId;
            const userId = req.user?.userId;

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            if (!content || content.trim().length === 0) {
                this.handleError(res, new Error('Comment content is required'), 'Comment content is required', 400);
                return;
            }

            // Check if document exists and user has access
            const document = await prisma.document.findUnique({
                where: { id: documentId },
                include: {
                    collaborators: {
                        where: { userId },
                        select: { permission: true }
                    }
                }
            });

            if (!document) {
                this.handleError(res, new Error('Document not found'), 'Document not found', 404);
                return;
            }

            // Check if user has comment permission
            const isOwner = document.ownerId === userId;
            const collaboration = document.collaborators[0];
            const canComment = isOwner ||
                (collaboration && (collaboration.permission === FilePermission.EDIT || collaboration.permission === FilePermission.COMMENT || collaboration.permission === FilePermission.ADMIN));

            if (!canComment) {
                this.handleError(res, new Error('Insufficient permissions to comment on this document'), 'Insufficient permissions to comment on this document', 403);
                return;
            }

            // Create comment
            const comment = await prisma.$transaction(async (tx) => {
                const newComment = await tx.comment.create({
                    data: {
                        documentId,
                        userId,
                        content: content.trim(),
                        position: position || null
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                avatar: true
                            }
                        }
                    }
                });

                // Log activity
                await tx.activity.create({
                    data: {
                        userId,
                        type: 'COMMENT_ADDED',
                        description: `Added comment to document: "${document.title}"`,
                        documentId,
                        metadata: {
                            documentTitle: document.title,
                            commentId: newComment.id,
                            action: 'add_comment'
                        }
                    }
                });

                return newComment;
            });

            const response = {
                success: true,
                data: {
                    id: comment.id,
                    content: comment.content,
                    position: comment.position,
                    isResolved: comment.isResolved,
                    createdAt: comment.createdAt,
                    updatedAt: comment.updatedAt,
                    author: comment.user,
                    replies: []
                },
                message: 'Comment added successfully'
            };
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {
            console.error('Error adding comment:', error);
            this.handleError(res, error, 'Failed to add comment');
        }
    }

    // Get comments for a document
    public async getComments(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
        try {
            const documentId = req?.params?.documentId;
            const userId = req.user?.userId;

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            // Check if document exists and user has access
            const document = await prisma.document.findUnique({
                where: { id: documentId },
                include: {
                    collaborators: {
                        where: { userId },
                        select: { permission: true }
                    }
                }
            });

            if (!document) {
                this.handleError(res, new Error('Document not found'), 'Document not found', 404);
                return;
            }

            // Check access permissions
            const isOwner = document.ownerId === userId;
            const collaboration = document.collaborators[0];

            if (!isOwner && !collaboration) {
                this.handleError(res, new Error('Access denied'), 'Access denied', 403);
                return;
            }

            // Get comments with replies
            const comments = await prisma.comment.findMany({
                where: { documentId },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            avatar: true
                        }
                    },
                    replies: {
                        include: {
                            author: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                    avatar: true
                                }
                            }
                        },
                        orderBy: { createdAt: 'asc' }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            const formattedComments = comments.map(comment => ({
                id: comment.id,
                content: comment.content,
                position: comment.position,
                isResolved: comment.isResolved,
                resolvedAt: comment.resolvedAt,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt,
                author: comment.user,
                replies: comment.replies.map(reply => ({
                    id: reply.id,
                    content: reply.content,
                    createdAt: reply.createdAt,
                    updatedAt: reply.updatedAt,
                    author: reply.author
                }))
            }));

            const response = {
                success: true,
                data: {
                    comments: formattedComments,
                    stats: {
                        total: comments.length,
                        resolved: comments.filter(c => c.isResolved).length,
                        unresolved: comments.filter(c => !c.isResolved).length
                    }
                }
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {
            console.error('Error getting comments:', error);
            this.handleError(res, error, 'Failed to get comments');
        }
    }

    // Update comment
    public async updateComment(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
        try {
            const commentId = req?.params?.commentId;
            const { content } = req.body;
            const documentId = req?.params?.documentId;
            const userId = req.user?.userId;

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            if (!content || content.trim().length === 0) {
                this.handleError(res, new Error('Comment content is required'), 'Comment content is required', 400);
                return;
            }

            // Get comment
            const comment = await prisma.comment.findUnique({
                where: { id: commentId },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            avatar: true
                        }
                    },
                    document: {
                        select: {
                            id: true,
                            title: true,
                            ownerId: true
                        }
                    }
                }
            });

            if (!comment) {
                this.handleError(res, new Error('Comment not found'), 'Comment not found', 404);
                return;
            }

            // Only comment author or document owner can edit
            const canEdit = comment.userId === userId || comment.document?.ownerId === userId;

            if (!canEdit) {
                this.handleError(res, new Error('Insufficient permissions to edit this comment'), 'Insufficient permissions to edit this comment', 403);
                return;
            }

            // Update comment
            const updatedComment = await prisma.comment.update({
                where: { id: commentId },
                data: {
                    content: content.trim(),
                    updatedAt: new Date()
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            avatar: true
                        }
                    }
                }
            });

            const response = {
                success: true,
                data: {
                    id: updatedComment.id,
                    content: updatedComment.content,
                    position: updatedComment.position,
                    isResolved: updatedComment.isResolved,
                    createdAt: updatedComment.createdAt,
                    updatedAt: updatedComment.updatedAt,
                    author: updatedComment.user
                },
                message: 'Comment updated successfully'
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {
            console.error('Error updating comment:', error);
            this.handleError(res, error, 'Failed to update comment');
        }
    }

    // Delete comment
    public async deleteComment(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
        try {
            const commentId = req?.params?.commentId;
            const documentId = req?.params?.documentId;
            const userId = req.user?.userId;

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            // Get comment
            const comment = await prisma.comment.findUnique({
                where: { id: commentId },
                include: {
                    document: {
                        select: {
                            id: true,
                            title: true,
                            ownerId: true
                        }
                    }
                }
            });

            if (!comment) {
                this.handleError(res, new Error('Comment not found'), 'Comment not found', 404);
                return;
            }

            // Only comment author or document owner can delete
            const canDelete = comment.userId === userId || comment.document?.ownerId === userId;

            if (!canDelete) {
                this.handleError(res, new Error('Insufficient permissions to delete this comment'), 'Insufficient permissions to delete this comment', 403);
                return;
            }

            // Delete comment (will cascade delete replies)
            await prisma.$transaction(async (tx) => {
                await tx.comment.delete({
                    where: { id: commentId }
                });

                // Log activity
                await tx.activity.create({
                    data: {
                        userId,
                        type: 'COMMENT_DELETED',
                        description: `Deleted comment from document: "${comment.document?.title}"`,
                        documentId: comment.documentId!,
                        metadata: {
                            documentTitle: comment.document?.title,
                            commentId,
                            action: 'delete_comment'
                        }
                    }
                });
            });

            const response = {
                success: true,
                message: 'Comment deleted successfully',
                data: {
                    deletedCommentId: commentId
                }
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {
            console.error('Error deleting comment:', error);
            this.handleError(res, error, 'Failed to delete comment');
        }
    }

    // Resolve or unresolve comment
    public async toggleCommentResolution(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
        try {
            const commentId = req?.params?.commentId;
            const { isResolved } = req.body;
            const documentId = req?.params?.documentId;
            const userId = req.user?.userId;

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            if (typeof isResolved !== 'boolean') {
                this.handleError(res, new Error('isResolved must be a boolean value'), 'isResolved must be a boolean value', 400);
                return;
            }

            // Get comment
            const comment = await prisma.comment.findUnique({
                where: { id: commentId },
                include: {
                    document: {
                        select: {
                            id: true,
                            title: true,
                            ownerId: true
                        }
                    },
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            avatar: true
                        }
                    }
                }
            });

            if (!comment) {
                this.handleError(res, new Error('Comment not found'), 'Comment not found', 404);
                return;
            }

            // Check if user has permission to resolve comments
            const document = await prisma.document.findUnique({
                where: { id: comment.documentId! },
                include: {
                    collaborators: {
                        where: { userId },
                        select: { permission: true }
                    }
                }
            });

            const isOwner = document?.ownerId === userId;
            const collaboration = document?.collaborators[0];
            const canResolve = isOwner || comment.userId === userId ||
                (collaboration && (collaboration.permission === FilePermission.EDIT || collaboration.permission === FilePermission.ADMIN));

            if (!canResolve) {
                this.handleError(res, new Error('Insufficient permissions to resolve this comment'), 'Insufficient permissions to resolve this comment', 403);
                return;
            }

            // Update comment resolution status
            const updatedComment = await prisma.comment.update({
                where: { id: commentId },
                data: {
                    isResolved,
                    resolvedAt: isResolved ? new Date() : null
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            avatar: true
                        }
                    }
                }
            });

            const response = {
                success: true,
                data: {
                    id: updatedComment.id,
                    content: updatedComment.content,
                    position: updatedComment.position,
                    isResolved: updatedComment.isResolved,
                    resolvedAt: updatedComment.resolvedAt,
                    createdAt: updatedComment.createdAt,
                    updatedAt: updatedComment.updatedAt,
                    author: updatedComment.user
                },
                message: `Comment ${isResolved ? 'resolved' : 'unresolved'} successfully`
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {
            console.error('Error toggling comment resolution:', error);
            this.handleError(res, error, 'Failed to toggle comment resolution');
        }
    }

    // Add reply to comment
    public async addCommentReply(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
        try {

            const { content } = req.body;
            const commentId = req?.params?.commentId;
            const userId = req.user?.userId;

            if (!userId) {
                this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
                return;
            }

            if (!content || content.trim().length === 0) {
                this.handleError(res, new Error('Reply content is required'), 'Reply content is required', 400);
                return;
            }

            // Get comment and check document access
            const comment = await prisma.comment.findUnique({
                where: { id: commentId },
                include: {
                    document: {
                        include: {
                            collaborators: {
                                where: { userId },
                                select: { permission: true }
                            }
                        }
                    }
                }
            });

            if (!comment) {
                this.handleError(res, new Error('Comment not found'), 'Comment not found', 404);
                return;
            }

            // Check if user has access to reply
            const isOwner = comment.document?.ownerId === userId;
            const collaboration = comment.document?.collaborators[0];
            const canReply = isOwner ||
                (collaboration && (collaboration.permission === FilePermission.EDIT || collaboration.permission === FilePermission.COMMENT || collaboration.permission === FilePermission.ADMIN));

            if (!canReply) {
                this.handleError(res, new Error('Insufficient permissions to reply to this comment'), 'Insufficient permissions to reply to this comment', 403);
                return;
            }

            // Create reply
            const reply = await prisma.commentReply.create({
                data: {
                    commentId: commentId!,
                    authorId: userId,
                    content: content.trim()
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            avatar: true
                        }
                    }
                }
            });

            const response = {
                success: true,
                data: {
                    id: reply.id,
                    content: reply.content,
                    createdAt: reply.createdAt,
                    updatedAt: reply.updatedAt,
                    author: reply.author
                },
                message: 'Reply added successfully'
            };
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } catch (error) {
            console.error('Error adding comment reply:', error);
            this.handleError(res, error, 'Failed to add comment reply');
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
}


const collaborationController = new CollaborationController();
export default collaborationController;