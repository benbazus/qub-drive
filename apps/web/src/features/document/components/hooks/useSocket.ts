/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
// hooks/useSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { User, DocumentChange, ConnectionStatus, CollaborationRole } from '../types';

interface UseSocketProps {
    serverUrl: string;
    documentId: string;
    currentUserId: string;
    userName: string;
}

interface UseSocketReturn {
    socket: Socket | null;
    connectionStatus: ConnectionStatus;
    connectedUsers: User[];
    connect: () => void;
    disconnect: () => void;
    emitDocumentChange: (content: string) => void;
    saveDocument: (title: string, content: string) => void; // Added missing function
    inviteUser: (email: string, role: CollaborationRole) => void;
    changePermission: (userId: string, newRole: CollaborationRole) => void; // Added missing function
    removeCollaborator: (userId: string) => void; // Added missing function
    emitTitleChange: (title: string) => void; // Added missing function
    emitCursorPosition: (position: any, selection?: any) => void; // Added missing function
    emitTypingStatus: (isTyping: boolean) => void; // Added missing function
}

export const useSocket = ({
    serverUrl,
    documentId,
    currentUserId,
    userName
}: UseSocketProps): UseSocketReturn => {
    const socketRef = useRef<Socket | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
    const lastEmittedContentRef = useRef<string>('');

    const connect = useCallback(() => {
        if (socketRef.current?.connected) return;

        setConnectionStatus('connecting');

        // Get auth token - try multiple possible storage keys
        let authToken = localStorage.getItem('accessToken') ||
            localStorage.getItem('authToken') ||
            localStorage.getItem('token');

        console.log('🔑 Auth token found:', authToken ? 'Yes' : 'No');

        // For demo purposes, create a temporary token if none exists
        if (!authToken) {
            console.warn('⚠️ No auth token found in localStorage, creating demo token');
            authToken = 'demo-token-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('token', authToken);
        }

        // Create socket connection with authentication
        socketRef.current = io(serverUrl, {
            transports: ['websocket', 'polling'],
            upgrade: true,
            rememberUpgrade: true,
            timeout: 20000,
            auth: {
                token: authToken,
                userId: currentUserId,
                userName: userName
            },
            autoConnect: false
        });

        // Connection events
        socketRef.current.on('connect', () => {
            setConnectionStatus('connected');
            console.log('✅ Connected to Socket.IO server');

            // Join document room
            socketRef.current?.emit('join-document', {
                documentId,
                userId: currentUserId,
                userName
            });
        });

        socketRef.current.on('disconnect', (reason) => {
            setConnectionStatus('disconnected');
            setConnectedUsers([]);
            console.log('❌ Disconnected from server:', reason);
        });

        socketRef.current.on('connect_error', (error) => {
            setConnectionStatus('disconnected');
            console.error('❌ Connection error:', error);

            // Handle authentication errors specifically
            if (error.message.includes('Authentication error')) {
                console.error('🔐 Authentication failed - check your token');
                // You might want to redirect to login here
            }
        });

        socketRef.current.on('reconnect', (attemptNumber) => {
            console.log('🔄 Reconnected after', attemptNumber, 'attempts');
            setConnectionStatus('connected');

            // Rejoin document room after reconnection
            socketRef.current?.emit('join-document', {
                documentId,
                userId: currentUserId,
                userName
            });
        });

        socketRef.current.on('reconnect_attempt', (attemptNumber) => {
            console.log('🔄 Reconnection attempt', attemptNumber);
            setConnectionStatus('connecting');
        });

        socketRef.current.on('reconnect_error', (error) => {
            console.error('❌ Reconnection error:', error);
            setConnectionStatus('disconnected');
        });

        socketRef.current.on('reconnect_failed', () => {
            console.error('❌ Reconnection failed');
            setConnectionStatus('disconnected');
        });

        // Document events
        socketRef.current.on('document-joined', (data: {
            documentId: string;
            users: User[];
            document?: any;
        }) => {
            console.log('📄 Joined document:', data.documentId);
            setConnectedUsers(data.users || []);
        });

        socketRef.current.on('document-updated', (data: DocumentChange) => {
            console.log('📝 Received document update from:', data.userId);
            // This will be handled by the main component
        });

        socketRef.current.on('user-joined', (user: User) => {
            console.log('👋 User joined:', user.name);
            setConnectedUsers(prev => {
                const filtered = prev.filter(u => u.id !== user.id);
                return [...filtered, user];
            });
        });

        socketRef.current.on('user-left', ({ userId, userName }: { userId: string; userName: string }) => {
            console.log('👋 User left:', userName);
            setConnectedUsers(prev => prev.filter(u => u.id !== userId));
        });

        socketRef.current.on('invitation-sent', (data: {
            email: string;
            success: boolean;
            error?: string;
            user?: User;
        }) => {
            console.log('📧 Invitation result:', data);
            if (data.success && data.user) {
                setConnectedUsers(prev => {
                    const filtered = prev.filter(u => u.id !== data.user!.id);
                    return [...filtered, data.user!];
                });
            }
        });

        socketRef.current.on('invitation-failed', (data: {
            email: string;
            error: string
        }) => {
            console.error('❌ Invitation failed:', data);
        });

        socketRef.current.on('document-saved', (data: {
            documentId: string;
            timestamp: number
        }) => {
            console.log('💾 Document automatically saved:', data);
        });

        socketRef.current.on('user-typing', (data: {
            userId: string;
            userName: string;
            isTyping: boolean
        }) => {
            console.log('⌨️ User typing:', data.userName, data.isTyping);
            setConnectedUsers(prev =>
                prev.map(user =>
                    user.id === data.userId
                        ? { ...user, status: data.isTyping ? 'typing' : 'active' }
                        : user
                )
            );
        });

        socketRef.current.on('cursor-update', (data: {
            userId: string;
            user: any;
            cursor: any;
            timestamp: string;
        }) => {
            console.log('👆 Cursor updated:', data.user?.name);
            // This will be handled by the main component
        });

        socketRef.current.on('permission-changed', (data: {
            userId: string;
            newRole: CollaborationRole;
            changedBy: string;
        }) => {
            console.log('🔐 Permission changed:', data);
            setConnectedUsers(prev =>
                prev.map(user =>
                    user.id === data.userId
                        ? { ...user, role: data.newRole }
                        : user
                )
            );
        });

        socketRef.current.on('user-invited', (data: {
            documentId: string;
            invitedUser: User;
            invitedBy: string;
        }) => {
            console.log('📨 User invited to document:', data.invitedUser.name);
            setConnectedUsers(prev => {
                const filtered = prev.filter(u => u.id !== data.invitedUser.id);
                return [...filtered, data.invitedUser];
            });
        });

        socketRef.current.on('collaborator-removed', (data: {
            userId: string;
            removedBy: string;
        }) => {
            console.log('🗑️ Collaborator removed:', data.userId);
            setConnectedUsers(prev => prev.filter(u => u.id !== data.userId));
        });

        socketRef.current.on('title-updated', (data: {
            title: string;
            userId: string;
            timestamp: number;
        }) => {
            console.log('📝 Title updated by:', data.userId);
            // This will be handled by the main component
        });

        // Error handling
        socketRef.current.on('error', (error: { message: string }) => {
            console.error('❌ Socket error:', error.message);
        });

        // Actually connect
        socketRef.current.connect();
    }, [serverUrl, documentId, currentUserId, userName]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current.removeAllListeners();
            socketRef.current = null;
            setConnectionStatus('disconnected');
            setConnectedUsers([]);
            console.log('🔌 Disconnected from Socket.IO server');
        }
    }, []);

    const emitDocumentChange = useCallback((content: string) => {
        if (socketRef.current?.connected && content !== lastEmittedContentRef.current) {
            lastEmittedContentRef.current = content;
            socketRef.current.emit('document-change', {
                documentId,
                content,
                userId: currentUserId,
                timestamp: Date.now()
            });
        }
    }, [documentId, currentUserId]);

    const saveDocument = useCallback((title: string, content: string) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('save-document', {
                documentId,
                title,
                content,
                userId: currentUserId,
                timestamp: Date.now()
            });
        }
    }, [documentId, currentUserId]);

    const inviteUser = useCallback((email: string, role: CollaborationRole) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('invite-user', {
                documentId,
                email,
                role,
                invitedBy: currentUserId
            });
        } else {
            console.warn('⚠️ Cannot invite user - not connected to server');
        }
    }, [documentId, currentUserId]);

    const changePermission = useCallback((userId: string, newRole: CollaborationRole) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('change-permission', {
                documentId,
                userId,
                newRole,
                changedBy: currentUserId
            });
        } else {
            console.warn('⚠️ Cannot change permission - not connected to server');
        }
    }, [documentId, currentUserId]);

    const removeCollaborator = useCallback((userId: string) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('remove-collaborator', {
                documentId,
                userId,
                removedBy: currentUserId
            });
        } else {
            console.warn('⚠️ Cannot remove collaborator - not connected to server');
        }
    }, [documentId, currentUserId]);

    const emitTitleChange = useCallback((title: string) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('title-change', {
                documentId,
                title,
                userId: currentUserId,
                timestamp: Date.now()
            });
        }
    }, [documentId, currentUserId]);

    const emitCursorPosition = useCallback((position: any, selection?: any) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('cursor-update', {
                documentId,
                position,
                selection,
                userId: currentUserId,
                timestamp: Date.now()
            });
        }
    }, [documentId, currentUserId]);

    const emitTypingStatus = useCallback((isTyping: boolean) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('user-typing', {
                documentId,
                isTyping,
                userId: currentUserId,
                timestamp: Date.now()
            });
        }
    }, [documentId, currentUserId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        socket: socketRef.current,
        connectionStatus,
        connectedUsers,
        connect,
        disconnect,
        emitDocumentChange,
        saveDocument,
        inviteUser,
        changePermission,
        removeCollaborator,
        emitTitleChange,
        emitCursorPosition,
        emitTypingStatus
    };
};