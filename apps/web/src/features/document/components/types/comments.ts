
// export interface Comment {
//     id: string;
//     content: string;
//     userId: string;
//     documentId: string;
//     user: {
//         id: string;
//         name: string;
//         email: string;
//         avatar?: string;
//     };
//     createdAt: string;
//     updatedAt: string;
//     isResolved: boolean;
//     parentId?: string; // For replies
//     replies?: Comment[];
// }

// export interface CommentThread {
//     id: string;
//     documentId: string;
//     selection?: {
//         start: number;
//         end: number;
//         text: string;
//     };
//     comments: Comment[];
//     isResolved: boolean;
//     createdAt: string;
// }