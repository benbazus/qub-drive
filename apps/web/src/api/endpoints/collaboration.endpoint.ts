// API endpoints for collaboration features
import { apiClient } from '../api.client';

// Document interfaces
export interface DocumentInfo {
  id: string;
  title: string;
  ownerId: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  collaborators: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    permission: string;
    invitedAt: string;
    acceptedAt?: string;
    isOnline: boolean;
    lastSeenAt?: string;
  }>;
  permissions: {
    canEdit: boolean;
    canComment: boolean;
    canShare: boolean;
    canView: boolean;
  };
  lastModified: string;
  createdAt: string;
}

export interface DocumentContent {
  documentId: string;
  title: string;
  content: string;
  lastModified: string;
  version: number;
  pageFormat: string;
  marginSize: string;
  fontSize: number;
  fontFamily: string;
}

export interface CreateDocumentRequest {
  title?: string;
  pageFormat?: string;
  marginSize?: string;
  fontSize?: number;
  fontFamily?: string;
}

export interface SaveDocumentRequest {
  title?: string;
  content?: string;
  pageFormat?: string;
  marginSize?: string;
  fontSize?: number;
  fontFamily?: string;
}

export interface ShareDocumentRequest {
  email: string;
  permission: string;
  message?: string;
}

export interface Comment {
  id: string;
  content: string;
  position?: any;
  isResolved: boolean;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  replies: Array<{
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    author: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string;
    };
  }>;
}

export interface AddCommentRequest {
  content: string;
  position?: any;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface AddCommentReplyRequest {
  content: string;
}

// Document API endpoints
export const collaborationApi = {
  // Document operations
  getDocumentInfo: async (documentId: string): Promise<DocumentInfo> => {
    const response = await apiClient.get(`/collaboration/documents/${documentId}`);
    return response.data.data;
  },

  getDocumentContent: async (documentId: string): Promise<DocumentContent> => {
    const response = await apiClient.get(`/collaboration/documents/${documentId}/content`);
    return response.data.data;
  },

  saveDocument: async (documentId: string, data: SaveDocumentRequest): Promise<any> => {
    const response = await apiClient.post(`/collaboration/documents/${documentId}/save`, data);
    return response.data.data;
  },

  createDocument: async (data: CreateDocumentRequest): Promise<any> => {
    const response = await apiClient.post('/collaboration/documents', data);
    return response.data.data;
  },

  getUserDocuments: async (userId: string): Promise<any> => {
    const response = await apiClient.get(`/collaboration/users/${userId}/documents`);
    return response.data.data;
  },

  // Collaboration operations
  shareDocument: async (documentId: string, data: ShareDocumentRequest): Promise<any> => {
    const response = await apiClient.post(`/collaboration/documents/${documentId}/share`, data);
    return response.data.data;
  },

  getCollaborators: async (documentId: string): Promise<any> => {
    const response = await apiClient.get(`/collaboration/documents/${documentId}/collaborators`);
    return response.data.data;
  },

  updatePermissions: async (documentId: string, collaboratorUserId: string, permission: string): Promise<any> => {
    const response = await apiClient.put(
      `/collaboration/documents/${documentId}/collaborators/${collaboratorUserId}/permissions`,
      { permission }
    );
    return response.data.data;
  },

  removeCollaborator: async (documentId: string, collaboratorUserId: string): Promise<any> => {
    const response = await apiClient.delete(
      `/collaboration/documents/${documentId}/collaborators/${collaboratorUserId}`
    );
    return response.data.data;
  },

  // Comment operations
  getComments: async (documentId: string): Promise<{ comments: Comment[]; stats: any }> => {
    const response = await apiClient.get(`/collaboration/documents/${documentId}/comments`);
    return response.data.data;
  },

  addComment: async (documentId: string, data: AddCommentRequest): Promise<Comment> => {
    const response = await apiClient.post(`/collaboration/documents/${documentId}/comments`, data);
    return response.data.data;
  },

  updateComment: async (commentId: string, data: UpdateCommentRequest): Promise<Comment> => {
    const response = await apiClient.put(`/collaboration/comments/${commentId}`, data);
    return response.data.data;
  },

  deleteComment: async (commentId: string): Promise<any> => {
    const response = await apiClient.delete(`/collaboration/comments/${commentId}`);
    return response.data.data;
  },

  toggleCommentResolution: async (commentId: string, isResolved: boolean): Promise<Comment> => {
    const response = await apiClient.patch(`/collaboration/comments/${commentId}/resolve`, { isResolved });
    return response.data.data;
  },

  addCommentReply: async (commentId: string, data: AddCommentReplyRequest): Promise<any> => {
    const response = await apiClient.post(`/collaboration/comments/${commentId}/replies`, data);
    return response.data.data;
  },
};

export default collaborationApi;