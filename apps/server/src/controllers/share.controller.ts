import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { shareService } from '../services/share.service';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import * as Joi from 'joi';
import prisma from '../config/database.config';
import { EmailServiceFactory } from '../services/email/email-service.factory';
import { renderShareAccessRequestTemplate, ShareAccessRequestEmailData } from '../services/email/share-access-request.template';

// Validation schemas
const shareAccessSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().allow('').optional(),
});

const shareCommentSchema = Joi.object({
  token: Joi.string().required(),
  content: Joi.string().min(1).max(1000).required(),
  password: Joi.string().allow('').optional(),
  guestName: Joi.string().max(100).optional(),
  guestEmail: Joi.string().email().optional(),
}).options({ stripUnknown: true });

const shareDownloadSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().allow('').optional(),
}).options({ stripUnknown: true });

const accessRequestSchema = Joi.object({
  token: Joi.string().required(),
  message: Joi.string().max(500).optional(),
  guestName: Joi.string().max(100).optional(),
  guestEmail: Joi.string().email().optional(),
}).options({ stripUnknown: true });

interface SharePageData {
  file: {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: string;
    mimeType: string;
    isFolder: boolean;
    createdAt: string;
    description?: string;
    thumbnailPath?: string;
    previewPath?: string;
    downloadCount: number;
    viewCount: number;
  };
  owner: {
    name: string;
    avatar?: string;
  };
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canDownload: boolean;
    canComment: boolean;
  };
  link: {
    expiresAt?: string;
    maxDownloads?: number;
    currentDownloads: number;
    accessCount: number;
  };
  comments?: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: {
      name: string;
      avatar?: string;
    };
  }>;
  children?: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: string;
    isFolder: boolean;
    createdAt: string;
  }>;
}

interface ApiResponse {
  success: boolean;
  message: string;
  error?: string;
  data?: any;
  timestamp?: string;
  requiresPassword?: boolean;
}

export class ShareController {
  private async validateSchema<T>(schema: Joi.ObjectSchema, data: any): Promise<T> {
    try {
      const validated = await schema.validateAsync(data, { abortEarly: false });
      return validated as T;
    } catch (error) {
      throw new Error(`Validation failed: ${(error as Error).message}`);
    }
  }

  private handleError(res: Response, error: unknown, defaultMessage: string, statusCode = 500, requiresPassword = false): void {
    const message = error instanceof Error ? error.message : defaultMessage;

    const response: ApiResponse = {
      success: false,
      error: defaultMessage,
      message,
      timestamp: new Date().toISOString(),
      ...(requiresPassword && { requiresPassword: true })
    };

    console.error(`[ShareController] ${defaultMessage}:`, error);
    res.status(statusCode).json(response);
  }

  async createShare(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {

      console.log(" ###################### ")
      console.log((req as any).user?.userId)
      console.log(" ###################### ")


      await shareService.createShare(req, res);
    } catch (error) {
      console.error('Share controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create share'
      });
    }
  }

  async getSharedContent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await this.validateSchema<{
        token: string;
        password?: string;
      }>(shareAccessSchema, {
        token: (req.params as any)?.token || (req.params as any)?.shareToken || '',
        password: req.body?.password,
      });

      const { token, password } = data;
      const approvalToken = (req.query as any)?.approval;

      const shareLink = await prisma.sharedFile.findUnique({
        where: { shareToken: token },
        include: {
          file: {
            include: {
              owner: {
                select: { firstName: true, lastName: true, email: true },
              },
              children: {
                where: { isDeleted: false },
                select: {
                  id: true,
                  fileName: true,
                  fileType: true,
                  fileSize: true,
                  isFolder: true,
                  createdAt: true,
                  mimeType: true,
                },
                orderBy: [
                  { isFolder: 'desc' },
                  { fileName: 'asc' },
                ],
              },
            },
          },
        } as any,
      }) as any;

      if (!shareLink) {
        this.handleError(res, new Error('Share link not found'), 'Share link not found or expired', 404);
        return;
      }

      if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
        this.handleError(res, new Error('Share link expired'), 'Share link has expired', 403);
        return;
      }

      if (shareLink.password) {
        if (!password) {
          this.handleError(res, new Error('Password required'), 'Password required', 401, true);
          return;
        }

        const isPasswordValid = await bcrypt.compare(password, shareLink.password);
        if (!isPasswordValid) {
          this.handleError(res, new Error('Invalid password'), 'Incorrect password', 401, true);
          return;
        }
      }

      if (!shareLink.file || shareLink.file.isDeleted) {
        this.handleError(res, new Error('File not found'), 'File no longer exists', 404);
        return;
      }

      // Check approval requirement
      if (shareLink.requireApproval) {
        if (!approvalToken) {
          // Return specific response for approval required
          res.status(202).json({
            success: false,
            requiresApproval: true,
            message: 'This file requires approval to access',
            data: {
              fileName: shareLink.file.fileName,
              fileType: shareLink.file.fileType,
              sharedBy: shareLink.file.owner.firstName && shareLink.file.owner.lastName
                ? `${shareLink.file.owner.firstName} ${shareLink.file.owner.lastName}`
                : shareLink.file.owner.email,
            }
          });
          return;
        }

        // Validate approval token
        const approval = await prisma.shareApproval.findFirst({
          where: {
            approvalToken,
            status: 'APPROVED',
            sharedFileId: shareLink.id
          }
        });

        if (!approval) {
          this.handleError(res, new Error('Invalid approval token'), 'Invalid or expired approval token', 403);
          return;
        }
      }

      await prisma.sharedFile.update({
        where: { id: shareLink.id },
        data: {
          accessCount: { increment: 1 },
          lastAccessedAt: new Date(),
        },
      });

      await prisma.file.update({
        where: { id: shareLink.file.id },
        data: {
          viewCount: { increment: 1 },
          lastAccessedAt: new Date(),
        },
      });

      const shareData: SharePageData = {
        file: {
          id: shareLink.file.id,
          fileName: path.basename(shareLink.file.fileName),
          fileType: (shareLink.file.fileType?.toLowerCase() || 'file') as string,
          fileSize: shareLink.file.fileSize?.toString() || '0',
          mimeType: shareLink.file.mimeType || 'application/octet-stream',
          isFolder: shareLink.file.isFolder,
          createdAt: shareLink.file.createdAt.toISOString(),
          description: shareLink.file.description || undefined,
          thumbnailPath: shareLink.file.thumbnailPath || undefined,
          previewPath: shareLink.file.previewPath || undefined,
          downloadCount: shareLink.file.downloadCount || 0,
          viewCount: shareLink.file.viewCount || 0,
        },
        owner: {
          name: shareLink.file.owner.firstName && shareLink.file.owner.lastName
            ? `${shareLink.file.owner.firstName} ${shareLink.file.owner.lastName}`
            : shareLink.file.owner.email || 'Unknown User',
          avatar: undefined,
        },
        permissions: {
          canView: true,
          canEdit: (shareLink.permission as any) === 'EDIT',
          canDownload: shareLink.allowDownload || false,
          canComment: (shareLink.permission as any) === 'EDIT' || (shareLink.permission as any) === 'COMMENT',
        },
        link: {
          expiresAt: shareLink.expiresAt?.toISOString(),
          maxDownloads: undefined,
          currentDownloads: 0,
          accessCount: shareLink.accessCount || 0,
        },
        comments: [],
      };

      if (shareLink.file.isFolder && shareLink.file.children) {
        shareData.children = shareLink.file.children.map((child: any) => ({
          id: child.id,
          fileName: path.basename(child.fileName),
          fileType: (child.fileType?.toLowerCase() || 'file') as string,
          fileSize: child.fileSize?.toString() || '0',
          isFolder: child.isFolder,
          createdAt: child.createdAt.toISOString(),
        }));
      }

      res.json({
        success: true,
        message: 'Shared content retrieved successfully',
        data: shareData,
      });
    } catch (error) {
      console.log(" 8888888 getSharedContent 888888888888 ")
      console.log(error)
      console.log(" 888888 getSharedContent 8888888888888 ")

      this.handleError(res, error, 'Failed to retrieve shared content', 500);
    }
  }

  async downloadSharedFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await this.validateSchema<{
        token: string;
        password?: string;
      }>(shareDownloadSchema, {
        token: (req.params as any)?.shareToken || '',
        password: req.body?.password,
      });

      const { token, password } = data;

      const shareLink = await prisma.sharedFile.findUnique({
        where: { shareToken: token },
        include: {
          file: {
            include: {
              owner: { select: { firstName: true, lastName: true, email: true } },
            },
          },
        } as any,
      }) as any;

      if (!shareLink) {
        this.handleError(res, new Error('Share link not found'), 'Share link not found', 404);
        return;
      }

      if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
        this.handleError(res, new Error('Share link expired'), 'Share link expired', 403);
        return;
      }

      if (shareLink.password && !password) {
        this.handleError(res, new Error('Password required'), 'Password required', 401, true);
        return;
      }

      if (shareLink.password && password) {
        const isPasswordValid = await bcrypt.compare(password, shareLink.password);
        if (!isPasswordValid) {
          this.handleError(res, new Error('Invalid password'), 'Invalid password', 401, true);
          return;
        }
      }

      if (!shareLink.allowDownload) {
        this.handleError(res, new Error('Downloads not allowed'), 'Downloads are not allowed for this share', 403);
        return;
      }

      const file = shareLink.file;

      if (!file || file.isDeleted || !file.filePath) {
        this.handleError(res, new Error('File not found'), 'File not found', 404);
        return;
      }

      try {
        await fs.promises.access(file.filePath);
      } catch {
        this.handleError(res, new Error('File not found on server'), 'File not found on server', 404);
        return;
      }

      await Promise.all([
        prisma.sharedFile.update({
          where: { id: shareLink.id },
          data: { downloadCount: { increment: 1 } },
        }),
        prisma.file.update({
          where: { id: file.id },
          data: { downloadCount: { increment: 1 } },
        }),
      ]);

      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
      res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');

      const fileStream = await fs.promises.readFile(file.filePath);
      res.send(fileStream);
    } catch (error) {
      this.handleError(res, error, 'Failed to download shared file', 500);
    }
  }

  async addComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await this.validateSchema<{
        token: string;
        content: string;
        password?: string;
        guestName?: string;
        guestEmail?: string;
      }>(shareCommentSchema, {
        token: (req.params as any)?.token || (req.params as any)?.shareToken || '',
        content: req.body?.content || '',
        password: req.body?.password,
        guestName: req.body?.guestName,
        guestEmail: req.body?.guestEmail,
      });

      const { token, content, password, guestName = 'Anonymous', guestEmail } = data;

      const shareLink = await prisma.sharedFile.findUnique({
        where: { shareToken: token },
        include: { file: true } as any,
      }) as any;

      if (!shareLink) {
        this.handleError(res, new Error('Share link not found'), 'Share link not found', 404);
        return;
      }

      if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
        this.handleError(res, new Error('Share link expired'), 'Share link expired', 403);
        return;
      }

      if (shareLink.password && !password) {
        this.handleError(res, new Error('Password required'), 'Password required', 401, true);
        return;
      }

      if (shareLink.password && password) {
        const isPasswordValid = await bcrypt.compare(password, shareLink.password);
        if (!isPasswordValid) {
          this.handleError(res, new Error('Invalid password'), 'Invalid password', 401, true);
          return;
        }
      }

      if ((shareLink.permission as any) !== 'EDIT' && (shareLink.permission as any) !== 'COMMENT') {
        this.handleError(res, new Error('Comments not allowed'), 'Comments are not allowed for this share', 403);
        return;
      }

      // Mock response for comments since the actual implementation would require the full comment schema
      res.json({
        success: true,
        message: 'Comment added successfully',
        data: {
          id: `comment-${Date.now()}`,
          content,
          createdAt: new Date().toISOString(),
          user: {
            name: guestName || 'Anonymous',
            avatar: undefined,
          },
        },
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to add comment', 500);
    }
  }

  async requestShareAccess(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await this.validateSchema<{
        token: string;
        message?: string;
        guestName?: string;
        guestEmail?: string;
      }>(accessRequestSchema, {
        token: (req.params as any)?.shareToken || '',
        message: req.body?.message,
        guestName: req.body?.guestName,
        guestEmail: req.body?.guestEmail,
      });

      const { token, message = '', guestName = 'Anonymous', guestEmail } = data;

      const shareLink = await prisma.sharedFile.findUnique({
        where: { shareToken: token },
        include: {
          file: {
            include: {
              owner: {
                select: { firstName: true, lastName: true, email: true, id: true },
              },
            },
          },
        } as any,
      }) as any;

      if (!shareLink) {
        this.handleError(res, new Error('Share link not found'), 'Share link not found', 404);
        return;
      }

      if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
        this.handleError(res, new Error('Share link expired'), 'Share link expired', 403);
        return;
      }

      if (!shareLink.requireApproval) {
        this.handleError(res, new Error('Approval not required'), 'This share does not require approval', 400);
        return;
      }

      // Find or create a guest user for this email
      let requesterUser;
      if (guestEmail) {
        // Try to find existing user with this email
        requesterUser = await prisma.user.findUnique({
          where: { email: guestEmail }
        });

        // If no user exists, create a guest user
        if (!requesterUser) {
          requesterUser = await prisma.user.create({
            data: {
              email: guestEmail,
              password: 'GUEST_NO_PASSWORD', // Placeholder for guest users
              firstName: guestName || 'Guest',
              lastName: 'User',
              role: 'GUEST',
              isActive: false, // Guest users are not active
              isEmailVerified: false,
              username: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            }
          });
        }
      } else {
        // For anonymous requests without email, create a temporary guest
        requesterUser = await prisma.user.create({
          data: {
            email: `anonymous_${Date.now()}@guest.local`,
            password: 'GUEST_NO_PASSWORD', // Placeholder for guest users
            firstName: guestName || 'Anonymous',
            lastName: 'Guest',
            role: 'GUEST',
            isActive: false,
            isEmailVerified: false,
            username: `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          }
        });
      }

      // Check if there's already a pending request from this user
      const existingRequest = await prisma.shareApproval.findFirst({
        where: {
          sharedFileId: shareLink.id,
          requesterId: requesterUser.id,
          status: 'PENDING'
        }
      });

      if (existingRequest) {
        this.handleError(res, new Error('Request already pending'), 'You already have a pending access request for this file', 400);
        return;
      }

      // Create approval request in database
      const approvalRequest = await prisma.shareApproval.create({
        data: {
          sharedFileId: shareLink.id,
          requesterId: requesterUser.id,
          requestMessage: message || '',
          status: 'PENDING'
        }
      });

      try {
        const emailService = EmailServiceFactory.create();

        const shareOwner = shareLink.file?.owner;
        const requesterDisplayName = guestName || guestEmail || 'Anonymous User';

        if (shareOwner?.email) {
          const ownerDisplayName = shareOwner.firstName && shareOwner.lastName
            ? `${shareOwner.firstName} ${shareOwner.lastName}`
            : shareOwner.email;

          const approvalUrl = `${process.env.FRONTEND_URL}/approvals/${approvalRequest.id}`;

          await emailService.sendEmail({
            to: shareOwner.email,
            subject: `Access Request: ${shareLink.file?.fileName || 'Unknown File'}`,
            html: `
              <h2>File Access Request</h2>
              <p>You have received a new access request for your shared file.</p>
              <p><strong>File:</strong> ${shareLink.file?.fileName || 'Unknown File'}</p>
              <p><strong>Requester:</strong> ${requesterDisplayName}</p>
              ${guestEmail ? `<p><strong>Email:</strong> ${guestEmail}</p>` : ''}
              ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
              <p><strong>Requested:</strong> ${new Date().toLocaleString()}</p>

              <div style="margin: 20px 0;">
                <a href="${approvalUrl}?action=approve" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Approve</a>
                <a href="${approvalUrl}?action=deny" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Deny</a>
              </div>

              <p>You can also manage this request from your <a href="${process.env.FRONTEND_URL}/approvals">approvals dashboard</a>.</p>
            `,
            text: `${requesterDisplayName} is requesting access to your shared file: ${shareLink.file?.fileName || 'Unknown File'}. Please review the request at: ${approvalUrl}`,
            metadata: { approvalId: approvalRequest.id, fileName: shareLink.file?.fileName }
          });
        }
      } catch (err) {
        console.error('Failed to send approval request email:', err);
      }

      res.json({
        success: true,
        message: 'Access request submitted successfully. You will be notified once approved.',
        data: {
          requestId: approvalRequest.id,
          status: 'PENDING'
        }
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to request access', 500);
    }
  }
}

export const shareController = new ShareController();