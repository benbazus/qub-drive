import prisma from "../config/database.config";
import { EmailServiceFactory } from "./email/email-service.factory";
import { logger } from "../config/logger";
import { FilePermission, LinkAccess } from "@prisma/client";

export interface DocumentCollaborator {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  status: string;
}

export interface DocumentLinkAccess {
  linkAccess: "RESTRICTED" | "OPEN" | "PRIVATE";
  allowComments: boolean;
  allowDownload: boolean;
}

export interface InviteUserData {
  email: string;
  role: string;
  message?: string;
}

export interface CollaborationInviteEmailData {
  documentTitle: string;
  inviterName: string;
  role: string;
  message?: string;
  documentUrl: string;
  recipientName: string;
}

class DocumentService {
  /**
   * Invite a user to collaborate on a document
   */
  async inviteUserToDocument(
    documentId: string,
    currentUserId: string,
    inviteData: InviteUserData
  ) {
    try {
      // Check if document exists and user has permission to share
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          owner: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          collaborators: {
            where: { userId: currentUserId },
            select: { permission: true },
          },
        },
      });

      if (!document) {
        throw new Error("Document not found");
      }

      // Check if user has permission to invite (owner or admin)
      const isOwner = document.ownerId === currentUserId;
      const collaboration = document.collaborators[0];
      const canInvite =
        isOwner ||
        (collaboration && collaboration.permission === FilePermission.ADMIN);

      if (!canInvite) {
        throw new Error("Insufficient permissions to invite users");
      }

      // Check if target user exists
      const targetUser = await prisma.user.findUnique({
        where: { email: inviteData.email },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      if (!targetUser) {
        throw new Error("User with this email does not exist");
      }

      // Check if user is already a collaborator
      const existingCollaboration = await prisma.documentCollaborator.findFirst(
        {
          where: {
            documentId,
            userId: targetUser.id,
          },
        }
      );

      if (existingCollaboration) {
        throw new Error("User is already a collaborator on this document");
      }

      // Create collaboration
      const newCollaboration = await prisma.documentCollaborator.create({
        data: {
          documentId,
          userId: targetUser.id,
          permission: inviteData.role.toUpperCase() as FilePermission,
          invitedAt: new Date(),
        },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      // Send email notification
      await this.sendCollaborationInviteEmail(
        {
          documentTitle: document.title,
          inviterName: `${document.owner.firstName} ${document.owner.lastName}`,
          role: inviteData.role,
          message: inviteData.message,
          documentUrl: `${process.env.CLIENT_URL}/document/${documentId}`,
          recipientName: `${targetUser.firstName} ${targetUser.lastName}`,
        },
        targetUser.email
      );

      return {
        id: newCollaboration.id,
        user: newCollaboration.user,
        permission: newCollaboration.permission,
        invitedAt: newCollaboration.invitedAt,
      };
    } catch (error) {
      logger.error("Error inviting user to document:", error);
      throw error;
    }
  }

  /**
   * Change collaborator permission
   */
  async changeCollaboratorPermission(
    documentId: string,
    targetUserId: string,
    currentUserId: string,
    newPermission: string
  ) {
    try {
      // Check if current user has permission to change permissions (owner or admin)
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          collaborators: {
            where: { userId: currentUserId },
            select: { permission: true },
          },
        },
      });

      if (!document) {
        throw new Error("Document not found");
      }

      const isOwner = document.ownerId === currentUserId;
      const collaboration = document.collaborators[0];
      const canChangePermissions =
        isOwner ||
        (collaboration && collaboration.permission === FilePermission.ADMIN);

      if (!canChangePermissions) {
        throw new Error("Insufficient permissions to change user permissions");
      }

      // Update permission
      const updatedCollaboration = await prisma.documentCollaborator.update({
        where: {
          documentId_userId: {
            documentId,
            userId: targetUserId,
          },
        },
        data: {
          permission: newPermission.toUpperCase() as FilePermission,
        },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      return updatedCollaboration;
    } catch (error) {
      logger.error("Error changing collaborator permission:", error);
      throw error;
    }
  }

  /**
   * Remove collaborator from document
   */
  async removeCollaborator(
    documentId: string,
    targetUserId: string,
    currentUserId: string
  ) {
    try {
      // Check if current user has permission to remove collaborators (owner or admin)
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          collaborators: {
            where: { userId: currentUserId },
            select: { permission: true },
          },
        },
      });

      if (!document) {
        throw new Error("Document not found");
      }

      const isOwner = document.ownerId === currentUserId;
      const collaboration = document.collaborators[0];
      const canRemove =
        isOwner ||
        (collaboration && collaboration.permission === FilePermission.ADMIN);

      if (!canRemove) {
        throw new Error("Insufficient permissions to remove collaborators");
      }

      // Remove collaborator
      await prisma.documentCollaborator.delete({
        where: {
          documentId_userId: {
            documentId,
            userId: targetUserId,
          },
        },
      });

      return { success: true };
    } catch (error) {
      logger.error("Error removing collaborator:", error);
      throw error;
    }
  }

  /**
   * Get document collaborators
   */
  async getDocumentCollaborators(
    documentId: string,
    userId: string
  ): Promise<DocumentCollaborator[]> {
    try {
      // Check if user has access to document
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          owner: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          collaborators: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!document) {
        throw new Error("Document not found");
      }

      const isOwner = document.ownerId === userId;
      const collaboration = document.collaborators.find(
        (c) => c.userId === userId
      );

      if (!isOwner && !collaboration) {
        throw new Error("Access denied");
      }

      // Build collaborators list including owner
      const collaborators: DocumentCollaborator[] = [
        {
          id: document.owner.id,
          name: `${document.owner.firstName} ${document.owner.lastName}`,
          email: document.owner.email,
          role: "owner",
          avatar: document.owner.email.substring(0, 2).toUpperCase(),
          status: "online",
        },
        ...document.collaborators.map((c) => ({
          id: c.user.id,
          name: `${c.user.firstName} ${c.user.lastName}`,
          email: c.user.email,
          role: c.permission.toLowerCase(),
          avatar: c.user.email.substring(0, 2).toUpperCase(),
          status: "online",
        })),
      ];

      return collaborators;
    } catch (error) {
      logger.error("Error getting document collaborators:", error);
      throw error;
    }
  }

  /**
   * Update document link access settings
   */
  async updateDocumentLinkAccess(
    documentId: string,
    userId: string,
    linkAccessData: DocumentLinkAccess
  ) {
    try {
      // Check if user is owner (only owner can change link access)
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: { ownerId: true },
      });

      if (!document) {
        throw new Error("Document not found");
      }

      if (document.ownerId !== userId) {
        throw new Error("Only document owner can change link access settings");
      }

      // Find existing share link or create new one
      let linkSettings = await prisma.shareLink.findFirst({
        where: {
          documentId,
          createdById: userId,
        },
      });

      if (linkSettings) {
        // Update existing share link
        linkSettings = await prisma.shareLink.update({
          where: { id: linkSettings.id },
          data: {
            access: linkAccessData.linkAccess as LinkAccess,
            allowComments: linkAccessData.allowComments,
            allowDownload: linkAccessData.allowDownload,
          },
        });
      } else {
        // Create new share link
        linkSettings = await prisma.shareLink.create({
          data: {
            documentId,
            createdById: userId,
            token: `link_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            access: linkAccessData.linkAccess as LinkAccess,
            allowComments: linkAccessData.allowComments,
            allowDownload: linkAccessData.allowDownload,
          },
        });
      }

      return linkSettings;
    } catch (error) {
      logger.error("Error updating document link access:", error);
      throw error;
    }
  }

  /**
   * Get document link access settings
   */
  async getDocumentLinkAccess(
    documentId: string,
    userId: string
  ): Promise<DocumentLinkAccess> {
    try {
      // Check if user has access to document
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          collaborators: {
            where: { userId },
            select: { permission: true },
          },
          shareLinks: {
            where: { createdById: userId },
            select: { access: true, allowComments: true, allowDownload: true },
          },
        },
      });

      if (!document) {
        throw new Error("Document not found");
      }

      const isOwner = document.ownerId === userId;
      const collaboration = document.collaborators[0];

      if (!isOwner && !collaboration) {
        throw new Error("Access denied");
      }

      const shareLink = document.shareLinks[0];
      const linkAccess = shareLink || {
        access: LinkAccess.RESTRICTED,
        allowComments: false,
        allowDownload: true,
      };

      return {
        linkAccess: linkAccess.access as "RESTRICTED" | "OPEN" | "PRIVATE",
        allowComments: linkAccess.allowComments,
        allowDownload: linkAccess.allowDownload,
      };
    } catch (error) {
      logger.error("Error getting document link access:", error);
      throw error;
    }
  }

  /**
   * Send collaboration invite email
   */
  private async sendCollaborationInviteEmail(
    inviteData: CollaborationInviteEmailData,
    recipientEmail: string
  ) {
    try {
      const emailService = EmailServiceFactory.create();
      await emailService.sendCollaborationInvite(recipientEmail, inviteData);
    } catch (emailError) {
      logger.warn("Failed to send collaboration invite email:", emailError);
      // Don't throw error if email fails - the invitation should still succeed
    }
  }

  /**
   * Check if user has permission to access document
   */
  async checkDocumentAccess(
    documentId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          collaborators: {
            where: { userId },
            select: { permission: true },
          },
        },
      });

      if (!document) {
        return false;
      }

      const isOwner = document.ownerId === userId;
      const hasCollaboration = document.collaborators.length > 0;

      return isOwner || hasCollaboration;
    } catch (error) {
      logger.error("Error checking document access:", error);
      return false;
    }
  }

  /**
   * Get user's permission level for a document
   */
  async getUserDocumentPermission(
    documentId: string,
    userId: string
  ): Promise<string | null> {
    try {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          collaborators: {
            where: { userId },
            select: { permission: true },
          },
        },
      });

      if (!document) {
        return null;
      }

      const isOwner = document.ownerId === userId;
      if (isOwner) {
        return "owner";
      }

      const collaboration = document.collaborators[0];
      return collaboration ? collaboration.permission.toLowerCase() : null;
    } catch (error) {
      logger.error("Error getting user document permission:", error);
      return null;
    }
  }

  /**
   * Get all comments for a document
   */
  async getDocumentComments(documentId: string, userId: string) {
    try {
      // First verify user has access to the document
      const hasAccess = await this.checkDocumentAccess(documentId, userId);
      if (!hasAccess) {
        throw new Error("Access denied to this document");
      }

      const comments = await prisma.comment.findMany({
        where: {
          documentId,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Get replies for each comment
      const commentsWithReplies = await Promise.all(
        comments.map(async (comment) => {
          const replies = await prisma.commentReply.findMany({
            where: { commentId: comment.id },
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          });

          return {
            ...comment,
            replies,
          };
        })
      );

      return commentsWithReplies;
    } catch (error) {
      logger.error("Error getting document comments:", error);
      throw error;
    }
  }

  /**
   * Add a comment to a document
   */
  async addComment(
    documentId: string,
    userId: string,
    content: string,
    position?: any
  ) {
    try {
      // Verify user has comment permission
      const permission = await this.getUserDocumentPermission(
        documentId,
        userId
      );
      if (
        !permission ||
        !["owner", "admin", "edit", "comment"].includes(permission)
      ) {
        throw new Error("Insufficient permissions to comment on this document");
      }

      const comment = await prisma.comment.create({
        data: {
          content,
          position,
          documentId,
          userId,
          isResolved: false,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      return comment;
    } catch (error) {
      logger.error("Error adding comment:", error);
      throw error;
    }
  }

  /**
   * Add a reply to a comment
   */
  async addCommentReply(commentId: string, userId: string, content: string) {
    try {
      // Find the parent comment to get the document ID
      const parentComment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { documentId: true },
      });

      if (!parentComment || !parentComment.documentId) {
        throw new Error(
          "Parent comment not found or has no associated document"
        );
      }

      // Verify user has comment permission
      const permission = await this.getUserDocumentPermission(
        parentComment.documentId,
        userId
      );
      if (
        !permission ||
        !["owner", "admin", "edit", "comment"].includes(permission)
      ) {
        throw new Error(
          "Insufficient permissions to reply to comments on this document"
        );
      }

      const reply = await prisma.commentReply.create({
        data: {
          content,
          commentId,
          authorId: userId,
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      return reply;
    } catch (error) {
      logger.error("Error adding comment reply:", error);
      throw error;
    }
  }

  /**
   * Update a comment
   */
  async updateComment(commentId: string, userId: string, content: string) {
    try {
      // Find the comment and verify ownership
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: {
          userId: true,
          documentId: true,
        },
      });

      if (!comment || !comment.documentId) {
        throw new Error("Comment not found or has no associated document");
      }

      // Only comment author or document owner can update
      const isAuthor = comment.userId === userId;
      const permission = await this.getUserDocumentPermission(
        comment.documentId,
        userId
      );
      const isOwnerOrAdmin = permission === "owner" || permission === "admin";

      if (!isAuthor && !isOwnerOrAdmin) {
        throw new Error("Insufficient permissions to update this comment");
      }

      const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: {
          content,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      return updatedComment;
    } catch (error) {
      logger.error("Error updating comment:", error);
      throw error;
    }
  }

  /**
   * Delete a comment and its replies
   */
  async deleteComment(commentId: string, userId: string) {
    try {
      // Find the comment and verify ownership
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: {
          userId: true,
          documentId: true,
        },
      });

      if (!comment || !comment.documentId) {
        throw new Error("Comment not found or has no associated document");
      }

      // Only comment author or document owner can delete
      const isAuthor = comment.userId === userId;
      const permission = await this.getUserDocumentPermission(
        comment.documentId,
        userId
      );
      const isOwnerOrAdmin = permission === "owner" || permission === "admin";

      if (!isAuthor && !isOwnerOrAdmin) {
        throw new Error("Insufficient permissions to delete this comment");
      }

      // Delete all replies first
      await prisma.commentReply.deleteMany({
        where: { commentId },
      });

      // Then delete the comment
      await prisma.comment.delete({
        where: { id: commentId },
      });

      return { success: true };
    } catch (error) {
      logger.error("Error deleting comment:", error);
      throw error;
    }
  }

  /**
   * Toggle comment resolution status
   */
  async toggleCommentResolution(
    commentId: string,
    userId: string,
    isResolved: boolean
  ) {
    try {
      // Find the comment to get document ID
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: {
          documentId: true,
          userId: true,
        },
      });

      if (!comment || !comment.documentId) {
        throw new Error("Comment not found or has no associated document");
      }

      // Verify user has permission to resolve comments
      const permission = await this.getUserDocumentPermission(
        comment.documentId,
        userId
      );
      const isAuthor = comment.userId === userId;
      const canResolve =
        isAuthor || ["owner", "admin", "edit"].includes(permission || "");

      if (!canResolve) {
        throw new Error("Insufficient permissions to resolve this comment");
      }

      const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: {
          isResolved,
          resolvedAt: isResolved ? new Date() : null,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      return updatedComment;
    } catch (error) {
      logger.error("Error toggling comment resolution:", error);
      throw error;
    }
  }
}

export default new DocumentService();
