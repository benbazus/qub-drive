// // types/index.ts
// export interface User {
//     id: string;
//     name: string;
//     email?: string;
//     avatar: string;
//     status?: 'active' | 'viewing' | 'typing' | 'offline';
//     role?: CollaborationRole;
//     lastActive?: Date;
// }

// export interface Document {
//     id: string;
//     title: string;
//     content: string;
//     ownerId: string;
//     isPublic: boolean;
//     createdAt: Date;
//     updatedAt: Date;
//     lastEditAt: Date;
// }

// export interface SocketConnection {
//     connected: boolean;
//     connect: () => void;
//     disconnect: () => void;
//     emit: (event: string, data?: any) => void;
//     on: (event: string, handler: (data: any) => void) => void;
//     off: (event: string, handler: (data: any) => void) => void;
// }

// export type CollaborationRole = 'owner' | 'editor' | 'commenter' | 'viewer';

// export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

// export type TextAlignment = 'left' | 'center' | 'right' | 'justify';

// export type FontFamily = 'Arial' | 'Helvetica' | 'Times New Roman' | 'Georgia' | 'Verdana';

// export type LinkAccess = 'RESTRICTED' | 'ANYONE_WITH_LINK' | 'PUBLIC';

// export interface DocumentChange {
//     documentId: string;
//     content: string;
//     operation?: string;
//     userId: string;
//     userName?: string;
//     timestamp: number;
// }

// export interface CursorPosition {
//     userId: string;
//     userName?: string;
//     position: {
//         line: number;
//         char: number;
//     };
//     selection?: {
//         start: number;
//         end: number;
//     };
//     timestamp: number;
// }

// export interface InvitationData {
//     documentId: string;
//     email: string;
//     role: CollaborationRole;
//     invitedBy: string;
// }

// export interface ShareLinkData {
//     url: string;
//     access: LinkAccess;
//     expiresAt?: Date;
// }

// types/index.ts
export interface User {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    status?: 'active' | 'viewing' | 'typing' | 'offline';
    role?: CollaborationRole;
    lastActive?: Date;
}

export interface Document {
    id: string;
    title: string;
    content: string;
    ownerId: string;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastEditAt: Date;
}

export type CollaborationRole = 'owner' | 'editor' | 'commenter' | 'viewer';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export type LinkAccess = 'RESTRICTED' | 'ANYONE_WITH_LINK' | 'PUBLIC';

export interface DocumentChange {
    documentId: string;
    content: string;
    operation?: string;
    userId: string;
    userName?: string;
    timestamp: number;
}

export interface CursorPosition {
    userId: string;
    userName?: string;
    position: {
        line: number;
        char: number;
    };
    selection?: {
        start: number;
        end: number;
    };
    timestamp: number;
}

export interface InvitationData {
    documentId: string;
    email: string;
    role: CollaborationRole;
    invitedBy: string;
}

export interface ShareLinkData {
    url: string;
    access: LinkAccess;
    expiresAt?: Date;
}

export type TextAlignment = 'left' | 'center' | 'right' | 'justify';
export type FontFamily = 'Arial' | 'Helvetica' | 'Times New Roman' | 'Georgia' | 'Verdana';

export const VALID_FONT_FAMILIES: FontFamily[] = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Verdana',
];

export interface DocumentChange {
    userId: string;
    content: string;
}

export interface GoogleDocsAppProps {
    documentId: string;
}

export interface DocumentSearchParams {
    docId?: string;
}
export interface SocketHookProps {
    serverUrl: string;
    documentId: string;
    currentUserId: string;
    userName: string;
}
export const DEBOUNCE_DELAYS = {
    AUTO_SYNC: 1000,
    FORMAT_UPDATE: 100,
    TITLE_CHANGE: 2000,
};

export interface Comment {
    id: string;
    content: string;
    userId: string;
    documentId: string;
    user: {
        lastName: string;
        firstName: string;
        id: string;
        name: string;
        email: string;
        avatar?: string;
    };
    createdAt: string;
    updatedAt: string;
    isResolved: boolean;
    parentId?: string; // For replies
    replies?: Comment[];
}

export interface CommentThread {
    id: string;
    documentId: string;
    selection?: {
        start: number;
        end: number;
        text: string;
    };
    comments: Comment[];
    isResolved: boolean;
    createdAt: string;
}