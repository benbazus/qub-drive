
/* eslint-disable @typescript-eslint/no-explicit-any */
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

export interface InviteUserRequest {
  email: string;
  role: string;
  message?: string;
}

export interface ChangePermissionRequest {
  permission: string;
}

export interface LinkAccessSettings {
  linkAccess: 'RESTRICTED' | 'ANYONE_WITH_LINK' | 'PUBLIC';
  allowComments?: boolean;
  allowDownload?: boolean;
}

export interface Comment {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
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
export const DocumentEndpoint = {
  // Document operations
  getDocumentInfo: async (documentId: string): Promise<DocumentInfo> => {
    const response = await apiClient.get(`/documents/${documentId}`);
    return response.data.data;
  },

  getDocumentContent: async (documentId: string): Promise<DocumentContent> => {
    const response = await apiClient.get(`/documents/${documentId}/content`);
    return response.data.data;
  },

  saveDocument: async (documentId: string, data: SaveDocumentRequest): Promise<any> => {
    const response = await apiClient.post(`/documents/${documentId}/save`, data);
    return response.data.data;
  },

  createDocument: async (data: CreateDocumentRequest): Promise<any> => {
    const response = await apiClient.post('/documents', data);
    return response.data.data;
  },

  getUserDocuments: async (userId: string): Promise<any> => {
    const response = await apiClient.get(`/users/${userId}/documents`);
    return response.data.data;
  },

  // Collaboration operations
  shareDocument: async (documentId: string, data: ShareDocumentRequest): Promise<any> => {
    const response = await apiClient.post(`/documents/${documentId}/share`, data);
    return response.data.data;
  },

  getCollaborators: async (documentId: string): Promise<any> => {
    const response = await apiClient.get(`/documents/${documentId}/collaborators`);
    return response.data.data;
  },

  updatePermissions: async (documentId: string, collaboratorUserId: string, permission: string): Promise<any> => {
    const response = await apiClient.put(
      `/documents/${documentId}/collaborators/${collaboratorUserId}/permissions`,
      { permission }
    );
    return response.data.data;
  },

  removeCollaborator: async (documentId: string, collaboratorUserId: string): Promise<any> => {
    const response = await apiClient.delete(
      `/documents/${documentId}/collaborators/${collaboratorUserId}`
    );
    return response.data.data;
  },

  // New sharing endpoints
  inviteUser: async (documentId: string, data: InviteUserRequest): Promise<any> => {
    const response = await apiClient.post(`/documents/${documentId}/invite`, data);
    return response.data.data;
  },

  changePermission: async (documentId: string, userId: string, data: ChangePermissionRequest): Promise<any> => {
    const response = await apiClient.put(`/documents/${documentId}/collaborators/${userId}/permission`, data);
    return response.data.data;
  },

  updateLinkAccess: async (documentId: string, data: LinkAccessSettings): Promise<any> => {
    const response = await apiClient.put(`/documents/${documentId}/link-access`, data);
    return response.data.data;
  },

  getLinkAccess: async (documentId: string): Promise<LinkAccessSettings> => {
    const response = await apiClient.get(`/documents/${documentId}/link-access`);
    return response.data.data;
  },

  // Comment operations
  getComments: async (documentId: string): Promise<{ comments: Comment[]; stats: any }> => {
    try {
      const response = await apiClient.get(`/documents/${documentId}/comments`);
      if (response.error || !response.data?.success) {
        throw new Error(response.error || 'Failed to get comments');
      }
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get comments');
    }
  },

  addComment: async (documentId: string, data: AddCommentRequest): Promise<Comment> => {
    try {
      const response = await apiClient.post(`/documents/${documentId}/comments`, data);
      if (response.error || !response.data?.success) {
        throw new Error(response.error || 'Failed to add comment');
      }
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to add comment');
    }
  },

  updateComment: async (commentId: string, data: UpdateCommentRequest): Promise<Comment> => {
    try {
      const response = await apiClient.put(`/comments/${commentId}`, data);
      if (response.error || !response.data?.success) {
        throw new Error(response.error || 'Failed to update comment');
      }
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update comment');
    }
  },

  deleteComment: async (commentId: string): Promise<any> => {
    try {
      const response = await apiClient.delete(`/comments/${commentId}`);
      if (response.error || !response.data?.success) {
        throw new Error(response.error || 'Failed to delete comment');
      }
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete comment');
    }
  },

  toggleCommentResolution: async (commentId: string, isResolved: boolean): Promise<Comment> => {
    try {
      const response = await apiClient.patch(`/comments/${commentId}/resolve`, { isResolved });
      if (response.error || !response.data?.success) {
        throw new Error(response.error || 'Failed to resolve comment');
      }
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to resolve comment');
    }
  },

  addCommentReply: async (commentId: string, data: AddCommentReplyRequest): Promise<any> => {
    try {
      const response = await apiClient.post(`/comments/${commentId}/replies`, data);
      if (response.error || !response.data?.success) {
        throw new Error(response.error || 'Failed to add reply');
      }
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to add reply');
    }
  },
};

export default DocumentEndpoint;