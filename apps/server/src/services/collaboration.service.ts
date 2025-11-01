import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';

import { EmailServiceFactory } from './email/email-service.factory';
import { FilePermission } from '@prisma/client';
import prisma from '@/config/database.config';


// Types
interface User {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    role: CollaborationRole;
    status: 'active' | 'idle' | 'typing' | 'away';
    cursor?: {
        position: any;
        selection: any;
    };
    lastActivity: number;
}

interface DocumentData {
    id: string;
    title: string;
    content: string;
    lastModified: number;
    ownerId: string;
    collaborators: Map<string, User>;
    activeConnections: Map<string, Socket>;
}

interface DocumentChange {
    documentId: string;
    content: string;
    userId: string;
    timestamp: number;
    operation?: 'insert' | 'delete' | 'format';
    position?: number;
    length?: number;
}

interface TitleChange {
    documentId: string;
    title: string;
    userId: string;
    timestamp: number;
}

export type CollaborationRole = 'owner' | 'editor' | 'viewer' | 'commenter';

export interface CollaborationPermissions {
    canEdit: boolean;
    canComment: boolean;
    canShare: boolean;
    canView: boolean;
}

class CollaborationService {
    private io: SocketIOServer;
    private userSockets: Map<string, Socket> = new Map();
    private autoSaveTimeouts: Map<string, NodeJS.Timeout> = new Map();
    private collaborators: Map<string, Map<string, User>> = new Map(); // documentId -> userId -> User


    constructor(server: HTTPServer) {

        this.io = new SocketIOServer(server, {
            cors: {
                origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:5001"],
                methods: ["GET", "POST"],
                credentials: true
            },
            transports: ['websocket', 'polling'],
        });

        this.setupAuthentication();
        this.setupEventHandlers();

        console.log('🤝 Collaboration service initialized');
    }

    private setupAuthentication() {
        this.io.use((socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                const userId = socket.handshake.auth.userId;
                const userName = socket.handshake.auth.userName;

                if (!token || !userId || !userName) {
                    console.log('❌ Missing authentication credentials');
                    return next(new Error('Authentication error - missing credentials'));
                }

                // For demo purposes, we'll accept the token as-is
                // In production, validate the JWT token properly
                if (token.startsWith('demo-token-') || this.isValidJWT(token)) {
                    socket.data.userId = userId;
                    socket.data.userName = userName;
                    socket.data.authenticated = true;

                    console.log(`✅ User authenticated: ${userName} (${userId})`);
                    next();
                } else {
                    console.log('❌ Invalid authentication token');
                    next(new Error('Authentication error - invalid token'));
                }
            } catch (error) {
                console.error('❌ Authentication error:', error);
                next(new Error('Authentication error'));
            }
        });
    }

    private isValidJWT(token: string): boolean {
        try {
            // In production, use your actual JWT secret
            const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
            jwt.verify(token, JWT_SECRET);
            return true;
        } catch {
            return false;
        }
    }

    private setupEventHandlers() {
        this.io.on('connection', (socket: Socket) => {
            const userId = socket.data.userId;
            const userName = socket.data.userName;

            console.log(`👋 User connected: ${userName} (${userId})`);
            this.userSockets.set(userId, socket);

            // Handle joining a document
            socket.on('join-document', (data: {
                documentId: string;
                userId: string;
                userName: string;
            }) => {
                this.handleJoinDocument(socket, data);
            });

            // Handle document content changes
            socket.on('document-change', (data: DocumentChange) => {
                this.handleDocumentChange(socket, data);
            });

            // Handle title changes
            socket.on('title-change', (data: TitleChange) => {
                this.handleTitleChange(socket, data);
            });

            // Handle save document
            socket.on('save-document', (data: {
                documentId: string;
                title: string;
                content: string;
                userId: string;
                timestamp: number;
            }) => {
                this.handleSaveDocument(socket, data);
            });

            // Handle user invitations
            socket.on('invite-user', (data: {
                documentId: string;
                email: string;
                role: CollaborationRole;
                invitedBy: string;
                message?: string;
            }) => {
                this.handleInviteUser(socket, data);
            });

            // Handle permission changes
            socket.on('change-permission', (data: {
                documentId: string;
                userId: string;
                newRole: CollaborationRole;
                changedBy: string;
            }) => {
                this.handleChangePermission(socket, data);
            });

            // Handle removing collaborators
            socket.on('remove-collaborator', (data: {
                documentId: string;
                userId: string;
                removedBy: string;
            }) => {
                this.handleRemoveCollaborator(socket, data);
            });

            // Handle cursor position updates
            socket.on('cursor-position', (data: {
                documentId: string;
                position: any;
                selection: any;
                userId: string;
                timestamp: number;
            }) => {
                this.handleCursorPosition(socket, data);
            });

            // Handle typing status
            socket.on('user-typing', (data: {
                documentId: string;
                isTyping: boolean;
                userId: string;
                timestamp: number;
            }) => {
                this.handleTypingStatus(socket, data);
            });

            // Handle comments
            socket.on('add-comment', (data: any) => {
                this.handleAddComment(socket, data);
            });

            socket.on('reply-comment', (data: any) => {
                this.handleReplyComment(socket, data);
            });

            socket.on('resolve-comment', (data: any) => {
                this.handleResolveComment(socket, data);
            });

            socket.on('delete-comment', (data: any) => {
                this.handleDeleteComment(socket, data);
            });

            socket.on('load-comments', (data: any) => {
                this.handleLoadComments(socket, data);
            });

            // Handle disconnection
            socket.on('disconnect', (reason) => {
                this.handleDisconnect(socket, reason);
            });

            // Error handling
            socket.on('error', (error) => {
                console.error(`❌ Socket error for user ${userName}:`, error);
            });
        });
    }

    private async handleJoinDocument(socket: Socket, data: { documentId: string; userId: string; userName: string; }) {
        const { documentId, userId, userName } = data;

        console.log(`📄 User ${userName} joining document: ${documentId}`);

        try {
            // Check if document exists in database
            let dbDocument = await prisma.document.findUnique({
                where: { id: documentId }
            });

            // If document doesn't exist in database, create it
            if (!dbDocument) {
                // Validate that the user exists before creating document
                const userExists = await prisma.user.findUnique({
                    where: { id: userId }
                });

                if (!userExists) {
                    console.error(`❌ Cannot create document ${documentId}: User ${userId} not found in database`);
                    socket.emit('join-error', {
                        error: 'User not found in database',
                        documentId
                    });
                    return;
                }

                dbDocument = await prisma.document.create({
                    data: {
                        id: documentId,
                        title: 'Untitled Document',
                        content: '',
                        ownerId: userId,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                });
                console.log(`✅ Document ${documentId} created in database`);
            }

            // Initialize collaborators map for this document if not exists
            if (!this.collaborators.has(documentId)) {
                this.collaborators.set(documentId, new Map());
            }

            // Add user to collaborators
            const user: User = {
                id: userId,
                name: userName,
                role: dbDocument.ownerId === userId ? 'owner' : 'editor',
                status: 'active',
                lastActivity: Date.now()
            };

            this.collaborators.get(documentId)!.set(userId, user);

            // Join socket room
            socket.join(documentId);
            socket.data.currentDocument = documentId;

            // Notify other users
            socket.to(documentId).emit('user-joined', user);

            // Send current document state to joining user
            socket.emit('document-joined', {
                documentId,
                document: {
                    title: dbDocument.title,
                    content: dbDocument.content,
                    lastModified: dbDocument.updatedAt.getTime()
                },
                users: Array.from(this.collaborators.get(documentId)!.values())
            });

            console.log(`✅ User ${userName} joined document ${documentId}. Total users: ${this.collaborators.get(documentId)!.size}`);
        } catch (error) {
            console.error(`❌ Error creating/loading document ${documentId}:`, error);
            socket.emit('join-error', {
                error: 'Failed to create/load document',
                documentId
            });
        }
    }

    private async handleDocumentChange(socket: Socket, data: DocumentChange) {
        const { documentId, content, userId, timestamp } = data;

        // console.log(" +++++++++++++++++++++++++++ ")
        // console.log(documentId)
        // console.log(userId)
        // console.log(timestamp)
        // console.log(content)
        // console.log(" +++++++++++++++++++++++++++ ")

        try {
            // Verify document exists in database
            const document = await prisma.document.findUnique({
                where: { id: documentId }
            });

            if (!document) {
                console.error(`❌ Document not found: ${documentId}`);
                socket.emit('document-error', {
                    error: 'Document not found',
                    documentId
                });
                return;
            }

            // Broadcast to other users in the document immediately
            socket.to(documentId).emit('document-updated', {
                documentId,
                content,
                userId,
                timestamp
            });

            // Auto-save after changes (delayed)
            this.scheduleAutoSave(documentId, userId, content, timestamp);

            console.log(`📝 Document ${documentId} updated by user ${userId}`);
        } catch (error) {
            console.error(`❌ Error handling document change for ${documentId}:`, error);
            socket.emit('document-error', {
                error: 'Failed to process document change',
                documentId
            });
        }
    }

    private async handleTitleChange(socket: Socket, data: TitleChange) {
        const { documentId, title, userId, timestamp } = data;

        try {
            // Update title in database immediately
            await prisma.document.update({
                where: { id: documentId },
                data: {
                    title: title,
                    updatedAt: new Date(timestamp)
                }
            });

            // Broadcast title change to other users
            socket.to(documentId).emit('title-updated', {
                documentId,
                title,
                userId,
                timestamp
            });

            console.log(`📝 Document ${documentId} title changed to "${title}" by user ${userId}`);
        } catch (error) {
            console.error(`❌ Error updating title for document ${documentId}:`, error);
            socket.emit('document-error', {
                error: 'Failed to update title',
                documentId
            });
        }
    }

    private async handleSaveDocument(socket: Socket, data: {
        documentId: string;
        title: string;
        content: string;
        userId: string;
        timestamp: number;
    }) {
        const { documentId, title, content, userId, timestamp } = data;

        try {
            // Save document to database
            await prisma.document.update({
                where: { id: documentId },
                data: {
                    title: title,
                    content: content,
                    updatedAt: new Date(timestamp)
                }
            });

            console.log(`💾 Document ${documentId} saved by user ${userId}`);

            // Notify all users that document was saved
            this.io.to(documentId).emit('document-saved', {
                documentId,
                timestamp
            });
        } catch (error) {
            console.error(`❌ Error saving document ${documentId}:`, error);
            socket.emit('document-error', {
                error: 'Failed to save document',
                documentId
            });
        }
    }

    private async handleInviteUser(socket: Socket, data: {
        documentId: string;
        email: string;
        role: CollaborationRole;
        invitedBy: string;
        message?: string;
    }) {
        const { documentId, email, role, invitedBy } = data;

        try {
            console.log(`📧 Processing invitation for ${email} to document ${documentId} with role ${role}`);

            // 1. Look up user by email
            const targetUser = await prisma.user.findUnique({
                where: { email },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatar: true
                }
            });

            if (!targetUser) {
                socket.emit('invitation-error', {
                    email,
                    error: 'User not found. Please ensure the user is registered on the platform.'
                });
                return;
            }

            // Check if user is already a collaborator
            const existingCollaboration = await prisma.documentAccess.findUnique({
                where: {
                    documentId_userId: {
                        documentId,
                        userId: targetUser.id
                    }
                }
            });

            if (existingCollaboration) {
                socket.emit('invitation-error', {
                    email,
                    error: 'User is already a collaborator on this document.'
                });
                return;
            }

            // Check if document exists and inviter has permission to share
            const document = await prisma.document.findUnique({
                where: { id: documentId },
                include: {
                    collaborators: {
                        where: { userId: invitedBy },
                        select: { permission: true }
                    }
                }
            });

            if (!document) {
                socket.emit('invitation-error', {
                    email,
                    error: 'Document not found.'
                });
                return;
            }

            // Check if inviter has permission to share
            const isOwner = document.ownerId === invitedBy;
            const collaboratorPermission = document.collaborators[0]?.permission;
            const canShare = isOwner || collaboratorPermission === FilePermission.ADMIN;

            if (!canShare) {
                socket.emit('invitation-error', {
                    email,
                    error: 'You do not have permission to invite users to this document.'
                });
                return;
            }

            // Map role to FilePermission
            const permission = this.mapRoleToPermission(role);

            // 3. Create database record for the invitation
            const documentAccess = await prisma.documentAccess.create({
                data: {
                    documentId,
                    userId: targetUser.id,
                    permission,
                    invitedBy,
                    invitedAt: new Date(),
                    // acceptedAt will be set when user first accesses the document
                }
            });

            // Log activity
            await prisma.activity.create({
                data: {
                    type: 'DOCUMENT_SHARED',
                    description: `Document shared with ${targetUser.email} as ${role}`,
                    documentId,
                    userId: invitedBy,
                    metadata: {
                        invitedUser: {
                            id: targetUser.id,
                            email: targetUser.email,
                            name: `${targetUser.firstName} ${targetUser.lastName}`
                        },
                        permission: role
                    }
                }
            });

            // Get inviter user info for notifications and emails
            const inviterUser = await prisma.user.findUnique({
                where: { id: invitedBy },
                select: {
                    firstName: true,
                    lastName: true,
                    email: true
                }
            });

            // 2. Send invitation email
            try {
                const emailService = EmailServiceFactory.create();

                await emailService.sendInvitation(targetUser.email, {
                    email: targetUser.email,
                    documentTitle: document.title,
                    inviterName: inviterUser ? `${inviterUser.firstName} ${inviterUser.lastName}` : 'Someone',
                    invitationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/documents/${documentId}`,
                    role: role,
                    message: data.message || undefined,
                    isExistingUser: true
                });

                console.log(`✅ Invitation email sent to ${targetUser.email}`);
            } catch (emailError) {
                console.error('Failed to send invitation email:', emailError);
                // Don't fail the entire invitation if email fails
            }

            // Create user object for socket response
            const invitedUser: User = {
                id: targetUser.id,
                name: `${targetUser.firstName} ${targetUser.lastName}`,
                email: targetUser.email,
                avatar: targetUser.avatar || targetUser.firstName.charAt(0).toUpperCase(),
                role: role,
                status: 'away',
                lastActivity: Date.now()
            };

            // Notify the inviter
            socket.emit('invitation-sent', {
                email,
                success: true,
                user: invitedUser,
                message: 'Invitation sent successfully!'
            });

            // Notify other users in the document about the new collaborator
            socket.to(documentId).emit('user-invited', {
                documentId,
                invitedUser,
                invitedBy,
                permission: role
            });

            // If the invited user is currently online, notify them directly
            const targetSocket = this.userSockets.get(targetUser.id);
            if (targetSocket) {
                targetSocket.emit('document-invitation-received', {
                    documentId,
                    documentTitle: document.title,
                    inviterName: inviterUser ? `${inviterUser.firstName} ${inviterUser.lastName}` : 'Someone',
                    permission: role
                });
            }

            console.log(`✅ User ${email} successfully invited to document ${documentId} with role ${role}`);

        } catch (error) {
            console.error('Error inviting user:', error);
            socket.emit('invitation-error', {
                email,
                error: 'Failed to send invitation. Please try again.'
            });
        }
    }

    private mapRoleToPermission(role: CollaborationRole): FilePermission {
        switch (role) {
            case 'viewer':
                return FilePermission.VIEW;
            case 'commenter':
                return FilePermission.COMMENT;
            case 'editor':
                return FilePermission.EDIT;
            case 'owner':
                return FilePermission.ADMIN;
            default:
                return FilePermission.VIEW;
        }
    }

    private handleChangePermission(socket: Socket, data: {
        documentId: string;
        userId: string;
        newRole: CollaborationRole;
        changedBy: string;
    }) {
        const { documentId, userId, newRole, changedBy } = data;

        // Update collaborator role in memory
        const collaborators = this.collaborators.get(documentId);
        if (collaborators) {
            const user = collaborators.get(userId);
            if (user) {
                user.role = newRole;

                // Notify all users about permission change
                this.io.to(documentId).emit('permission-changed', {
                    userId,
                    newRole,
                    changedBy
                });

                console.log(`🔐 User ${userId} role changed to ${newRole} in document ${documentId}`);
            }
        }
    }

    private handleRemoveCollaborator(socket: Socket, data: {
        documentId: string;
        userId: string;
        removedBy: string;
    }) {
        const { documentId, userId, removedBy } = data;

        // Remove user from collaborators
        const collaborators = this.collaborators.get(documentId);
        if (collaborators) {
            collaborators.delete(userId);
        }

        // Remove user from socket room
        const userSocket = this.userSockets.get(userId);
        if (userSocket) {
            userSocket.leave(documentId);
        }

        // Notify all users about collaborator removal
        this.io.to(documentId).emit('collaborator-removed', {
            userId,
            removedBy
        });

        console.log(`🗑️ User ${userId} removed from document ${documentId}`);
    }

    private handleCursorPosition(socket: Socket, data: {
        documentId: string;
        position: any;
        selection: any;
        userId: string;
        timestamp: number;
    }) {
        const { documentId, position, selection, userId } = data;

        // Broadcast cursor position to other users
        socket.to(documentId).emit('cursor-updated', {
            userId,
            userName: socket.data.userName,
            position,
            selection
        });
    }

    private handleTypingStatus(socket: Socket, data: {
        documentId: string;
        isTyping: boolean;
        userId: string;
        timestamp: number;
    }) {
        const { documentId, isTyping, userId } = data;

        // Update user status in collaborators
        const collaborators = this.collaborators.get(documentId);
        if (collaborators) {
            const user = collaborators.get(userId);
            if (user) {
                user.status = isTyping ? 'typing' : 'active';
                user.lastActivity = Date.now();
            }
        }

        // Broadcast typing status to other users
        socket.to(documentId).emit('user-typing', {
            userId,
            userName: socket.data.userName,
            isTyping
        });
    }

    private async handleAddComment(socket: Socket, data: any) {
        const { documentId, content, selection, userId } = data;
        const user = socket.data.user as any;

        try {
            console.log('💬 Adding comment:', { documentId, userId, content });

            // Check if user has access to comment on the document
            const document = await prisma.document.findUnique({
                where: { id: documentId },
                include: {
                    documentAccess: {
                        where: { userId: user.id },
                        select: { permission: true }
                    }
                }
            });

            if (!document) {
                socket.emit('error', { message: 'Document not found' });
                return;
            }

            const isOwner = document.ownerId === user.id;
            const hasAccess = document.documentAccess.length > 0;

            if (!isOwner && !hasAccess) {
                socket.emit('error', { message: 'Access denied' });
                return;
            }

            // Check comment permissions
            const userAccess = document.documentAccess[0];
            const canComment = isOwner ||
                (userAccess && ['COMMENT', 'EDIT', 'ADMIN'].includes(userAccess.permission));

            if (!canComment) {
                socket.emit('error', { message: 'No permission to comment' });
                return;
            }

            // Create comment in database
            const comment = await prisma.comment.create({
                data: {
                    documentId,
                    userId: user.id,
                    content: content.trim(),
                    position: selection ? selection : null
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

            // Format comment for client
            const commentData = {
                id: comment.id,
                content: comment.content,
                position: comment.position ? JSON.parse(comment.position as string) : null,
                isResolved: comment.isResolved,
                resolvedAt: comment.resolvedAt?.toISOString() || null,
                createdAt: comment.createdAt.toISOString(),
                updatedAt: comment.updatedAt.toISOString(),
                userId: comment.userId,
                user: {
                    id: comment.user!.id,
                    name: `${comment.user!.firstName} ${comment.user!.lastName}`,
                    email: comment.user!.email,
                    avatar: comment.user!.avatar || comment.user!.firstName.charAt(0).toUpperCase()
                }
            };

            // Broadcast to all users in the document
            this.io.to(documentId).emit('comment-added', commentData);

        } catch (error) {
            console.error('Error adding comment:', error);
            socket.emit('error', { message: 'Failed to add comment' });
        }
    }

    private async handleReplyComment(socket: Socket, data: any) {
        const { documentId, parentId, content, userId } = data;
        const user = socket.data.user as any;

        try {
            console.log('💬 Adding comment reply:', { documentId, parentId, userId, content });

            // Check if parent comment exists and user has access
            const parentComment = await prisma.comment.findUnique({
                where: { id: parentId },
                include: {
                    document: {
                        include: {
                            documentAccess: {
                                where: { userId: user.id },
                                select: { permission: true }
                            }
                        }
                    }
                }
            });

            if (!parentComment) {
                socket.emit('error', { message: 'Parent comment not found' });
                return;
            }

            const isOwner = parentComment.document?.ownerId === user.id;
            const hasAccess = parentComment.document?.documentAccess.length! > 0;

            if (!isOwner && !hasAccess) {
                socket.emit('error', { message: 'Access denied' });
                return;
            }

            // Check comment permissions
            const userAccess = parentComment.document?.documentAccess[0];
            const canComment = isOwner ||
                (userAccess && ['COMMENT', 'EDIT', 'ADMIN'].includes(userAccess.permission));

            if (!canComment) {
                socket.emit('error', { message: 'No permission to reply' });
                return;
            }

            // Create reply in database
            const reply = await prisma.commentReply.create({
                data: {
                    commentId: parentId,
                    authorId: user.id,
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

            // Format reply for client
            const replyData = {
                id: reply.id,
                content: reply.content,
                parentId,
                createdAt: reply.createdAt.toISOString(),
                updatedAt: reply.updatedAt.toISOString(),
                userId: reply.authorId,
                user: {
                    id: reply.author.id,
                    name: `${reply.author.firstName} ${reply.author.lastName}`,
                    email: reply.author.email,
                    avatar: reply.author.avatar || reply.author.firstName.charAt(0).toUpperCase()
                }
            };

            // Broadcast to all users in the document
            this.io.to(documentId).emit('comment-replied', replyData);

        } catch (error) {
            console.error('Error replying to comment:', error);
            socket.emit('error', { message: 'Failed to reply to comment' });
        }
    }

    private async handleResolveComment(socket: Socket, data: any) {
        const { documentId, commentId, userId } = data;
        const user = socket.data.user as any;

        try {
            console.log('💬 Resolving comment:', { documentId, commentId, userId });

            // Check if comment exists and user has permission
            const comment = await prisma.comment.findUnique({
                where: { id: commentId },
                include: {
                    document: {
                        include: {
                            documentAccess: {
                                where: { userId: user.id },
                                select: { permission: true }
                            }
                        }
                    }
                }
            });

            if (!comment) {
                socket.emit('error', { message: 'Comment not found' });
                return;
            }

            const isOwner = comment.document?.ownerId === user.id;
            const isCommentAuthor = comment.userId === user.id;
            const userAccess = comment.document?.documentAccess[0];
            const canResolve = isOwner || isCommentAuthor ||
                (userAccess && ['EDIT', 'ADMIN'].includes(userAccess.permission));

            if (!canResolve) {
                socket.emit('error', { message: 'No permission to resolve comment' });
                return;
            }

            // Update comment resolution status
            await prisma.comment.update({
                where: { id: commentId },
                data: {
                    isResolved: true,
                    resolvedAt: new Date()
                }
            });

            // Broadcast to all users in the document
            this.io.to(documentId).emit('comment-resolved', { commentId });

        } catch (error) {
            console.error('Error resolving comment:', error);
            socket.emit('error', { message: 'Failed to resolve comment' });
        }
    }

    private async handleDeleteComment(socket: Socket, data: any) {
        const { documentId, commentId, userId } = data;
        const user = socket.data.user as any;

        try {
            console.log('💬 Deleting comment:', { documentId, commentId, userId });

            // Check if comment exists and user has permission
            const comment = await prisma.comment.findUnique({
                where: { id: commentId },
                include: {
                    document: {
                        select: {
                            ownerId: true
                        }
                    }
                }
            });

            if (!comment) {
                socket.emit('error', { message: 'Comment not found' });
                return;
            }

            const isOwner = comment.document?.ownerId === user.id;
            const isCommentAuthor = comment.userId === user.id;

            if (!isOwner && !isCommentAuthor) {
                socket.emit('error', { message: 'No permission to delete comment' });
                return;
            }

            // Delete comment from database (will cascade delete replies)
            await prisma.comment.delete({
                where: { id: commentId }
            });

            // Broadcast to all users in the document
            this.io.to(documentId).emit('comment-deleted', { commentId });

        } catch (error) {
            console.error('Error deleting comment:', error);
            socket.emit('error', { message: 'Failed to delete comment' });
        }
    }

    private async handleLoadComments(socket: Socket, data: any) {
        const { documentId } = data;
        const user = socket.data.user as any;

        try {
            console.log('💬 Loading comments for document:', documentId);

            // Check if user has access to the document
            const document = await prisma.document.findUnique({
                where: { id: documentId },
                include: {
                    documentAccess: {
                        where: { userId: user.id },
                        select: { permission: true }
                    }
                }
            });

            if (!document) {
                socket.emit('error', { message: 'Document not found' });
                return;
            }

            // Check access permissions
            const isOwner = document.ownerId === user.id;
            const hasAccess = document.documentAccess.length > 0;

            if (!isOwner && !hasAccess) {
                socket.emit('error', { message: 'Access denied' });
                return;
            }

            // Load comments with replies from Prisma
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
                orderBy: { createdAt: 'asc' }
            });

            // Format comments data to match client expectations
            const formattedComments = comments.map(comment => ({
                id: comment.id,
                content: comment.content,
                position: comment.position ? JSON.parse(comment.position as string) : null,
                isResolved: comment.isResolved,
                resolvedAt: comment.resolvedAt?.toISOString() || null,
                createdAt: comment.createdAt.toISOString(),
                updatedAt: comment.updatedAt.toISOString(),
                userId: comment.userId,
                user: {
                    id: comment.user!.id,
                    name: `${comment.user!.firstName} ${comment.user!.lastName}`,
                    email: comment.user!.email,
                    avatar: comment.user!.avatar || comment.user!.firstName.charAt(0).toUpperCase()
                },
                replies: comment.replies?.map(reply => ({
                    id: reply.id,
                    content: reply.content,
                    createdAt: reply.createdAt.toISOString(),
                    updatedAt: reply.updatedAt.toISOString(),
                    author: {
                        id: reply.author.id,
                        name: `${reply.author.firstName} ${reply.author.lastName}`,
                        email: reply.author.email,
                        avatar: reply.author.avatar || reply.author.firstName.charAt(0).toUpperCase()
                    }
                })) || []
            }));

            socket.emit('comments-loaded', formattedComments);

        } catch (error) {
            console.error('Error loading comments:', error);
            socket.emit('error', { message: 'Failed to load comments' });
        }
    }

    private handleDisconnect(socket: Socket, reason: string) {
        const userId = socket.data.userId;
        const userName = socket.data.userName;
        const documentId = socket.data.currentDocument;

        console.log(`👋 User disconnected: ${userName} (${userId}), reason: ${reason}`);

        if (documentId) {
            const collaborators = this.collaborators.get(documentId);
            if (collaborators) {
                // Update user status to away if they were in a document
                const user = collaborators.get(userId);
                if (user) {
                    user.status = 'away';
                    user.lastActivity = Date.now();
                }

                // Notify other users in the document
                socket.to(documentId).emit('user-left', {
                    userId,
                    userName
                });

                // Clean up inactive users after some time
                setTimeout(() => {
                    this.cleanupInactiveUsers(documentId);
                }, 30000); // 30 seconds
            }
        }

        this.userSockets.delete(userId);
    }

    private scheduleAutoSave(documentId: string, userId: string, content: string, timestamp: number) {
        // Clear existing timeout for this document to implement debouncing
        if (this.autoSaveTimeouts.has(documentId)) {
            clearTimeout(this.autoSaveTimeouts.get(documentId)!);
        }

        // Set new timeout for auto-save (delayed)
        const timeout = setTimeout(async () => {
            try {
                console.log(`💾 Auto-saving document ${documentId}`);

                console.log(" =========================== ")
                console.log(documentId)
                console.log(content)
                console.log(userId)
                console.log(" =========================== ")

                // Update document in database with latest content
                await prisma.document.update({
                    where: { id: documentId },
                    data: {
                        content: content,
                        updatedAt: new Date(timestamp)
                    }
                });

                // Notify all users that document was auto-saved
                this.io.to(documentId).emit('document-saved', {
                    documentId,
                    timestamp: timestamp,
                    autoSave: true
                });

                console.log(`✅ Document ${documentId} auto-saved successfully`);
            } catch (error) {
                console.error(`❌ Failed to auto-save document ${documentId}:`, error);

                // Notify users of save failure
                this.io.to(documentId).emit('save-error', {
                    documentId,
                    error: 'Auto-save failed',
                    timestamp: Date.now()
                });
            } finally {
                // Remove timeout from map after completion
                this.autoSaveTimeouts.delete(documentId);
            }
        }, 3000); // Auto-save after 3 seconds of inactivity

        // Store timeout reference for this document
        this.autoSaveTimeouts.set(documentId, timeout);
    }

    private cleanupInactiveUsers(documentId: string) {
        const collaborators = this.collaborators.get(documentId);
        if (!collaborators) return;

        const now = Date.now();
        const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

        for (const [userId, user] of collaborators.entries()) {
            if (user.status === 'away' && now - user.lastActivity > inactiveThreshold) {
                collaborators.delete(userId);
                console.log(`🧹 Cleaned up inactive user ${userId} from document ${documentId}`);
            }
        }

        // Clean up empty collaborator lists
        if (collaborators.size === 0) {
            // Clear any pending auto-save timeout
            if (this.autoSaveTimeouts.has(documentId)) {
                clearTimeout(this.autoSaveTimeouts.get(documentId)!);
                this.autoSaveTimeouts.delete(documentId);
            }

            this.collaborators.delete(documentId);
            console.log(`🧹 Cleaned up empty collaborators for document ${documentId}`);
        }
    }

    // Utility methods
    public getConnectedUsers(documentId: string): User[] {
        const collaborators = this.collaborators.get(documentId);
        return collaborators ? Array.from(collaborators.values()) : [];
    }

    public async getDocumentInfo(documentId: string) {
        try {
            return await prisma.document.findUnique({
                where: { id: documentId }
            });
        } catch (error) {
            console.error(`Error fetching document ${documentId}:`, error);
            return null;
        }
    }

    public getUserPermissions(documentId: string, userId: string): CollaborationPermissions {
        const collaborators = this.collaborators.get(documentId);
        if (!collaborators) {
            return { canEdit: false, canComment: false, canShare: false, canView: false };
        }

        const user = collaborators.get(userId);
        if (!user) {
            return { canEdit: false, canComment: false, canShare: false, canView: false };
        }

        switch (user.role) {
            case 'owner':
                return { canEdit: true, canComment: true, canShare: true, canView: true };
            case 'editor':
                return { canEdit: true, canComment: true, canShare: false, canView: true };
            case 'commenter':
                return { canEdit: false, canComment: true, canShare: false, canView: true };
            case 'viewer':
                return { canEdit: false, canComment: false, canShare: false, canView: true };
            default:
                return { canEdit: false, canComment: false, canShare: false, canView: false };
        }
    }
}

export default CollaborationService;