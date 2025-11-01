import { Response } from 'express';
import * as crypto from 'crypto';
import * as Joi from 'joi';
import prisma from '../config/database.config';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { EmailServiceFactory } from '../services/email/email-service.factory';

// Validation schemas
const approveRequestSchema = Joi.object({
  approvalId: Joi.string().required(),
  message: Joi.string().max(500).optional(),
}).options({ stripUnknown: true });

const rejectRequestSchema = Joi.object({
  approvalId: Joi.string().required(),
  message: Joi.string().max(500).optional(),
}).options({ stripUnknown: true });

interface ApiResponse {
  success: boolean;
  message: string;
  error?: string;
  data?: any;
  timestamp?: string;
}

export class ApprovalController {
  private async validateSchema<T>(schema: Joi.ObjectSchema, data: any): Promise<T> {
    try {
      const validated = await schema.validateAsync(data, { abortEarly: false });
      return validated as T;
    } catch (error) {
      throw new Error(`Validation failed: ${(error as Error).message}`);
    }
  }

  private handleError(res: Response, error: unknown, defaultMessage: string, statusCode = 500): void {
    const message = error instanceof Error ? error.message : defaultMessage;

    const response: ApiResponse = {
      success: false,
      error: defaultMessage,
      message,
      timestamp: new Date().toISOString(),
    };

    console.error(`[ApprovalController] ${defaultMessage}:`, error);
    res.status(statusCode).json(response);
  }

  async getApprovalRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { approvalId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
        return;
      }

      // Find approval request
      const approval = await prisma.shareApproval.findUnique({
        where: { id: approvalId },
        include: {
          requester: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          sharedFile: {
            include: {
              file: {
                include: {
                  owner: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                  }
                }
              }
            }
          }
        }
      });

      if (!approval) {
        this.handleError(res, new Error('Approval request not found'), 'Approval request not found', 404);
        return;
      }

      // Check if user is the file owner
      if (approval?.sharedFile?.file?.owner?.id !== userId) {
        this.handleError(res, new Error('Access denied'), 'You are not authorized to view this approval request', 403);
        return;
      }

      res.json({
        success: true,
        message: 'Approval request retrieved successfully',
        data: {
          id: approval.id,
          requestMessage: approval.requestMessage,
          status: approval.status,
          requestedAt: approval.createdAt,
          processedAt: approval.approvedAt || approval.rejectedAt,
          file: {
            id: approval.sharedFile.file.id,
            fileName: approval.sharedFile.file.fileName,
            fileType: approval.sharedFile.file.fileType,
            fileSize: approval.sharedFile.file.fileSize,
          },
          sharedFile: {
            token: approval.sharedFile.shareToken,
            permission: approval.sharedFile.permission,
            allowDownload: approval.sharedFile.allowDownload,
          },
          requester: {
            id: approval.requester.id,
            firstName: approval.requester.firstName,
            lastName: approval.requester.lastName,
            email: approval.requester.email,
          }
        }
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to get approval request', 500);
    }
  }

  async approveShareRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await this.validateSchema<{
        approvalId: string;
        message?: string;
      }>(approveRequestSchema, {
        approvalId: req.params.approvalId,
        message: req.body?.message,
      });

      const { approvalId, message } = data;
      const userId = req.user?.userId;

      if (!userId) {
        this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
        return;
      }

      // Find approval request
      const approval = await prisma.shareApproval.findUnique({
        where: { id: approvalId },
        include: {
          requester: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          sharedFile: {
            include: {
              file: {
                include: {
                  owner: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                  }
                }
              }
            }
          }
        }
      });

      if (!approval) {
        this.handleError(res, new Error('Approval request not found'), 'Approval request not found', 404);
        return;
      }

      // Check if user is the file owner
      if (approval?.sharedFile?.file?.owner?.id !== userId) {
        this.handleError(res, new Error('Access denied'), 'You are not authorized to approve this request', 403);
        return;
      }

      // Check if already processed
      if (approval.status !== 'PENDING') {
        this.handleError(res, new Error('Request already processed'), 'This approval request has already been processed', 400);
        return;
      }

      // Generate approval token
      const approvalToken = crypto.randomBytes(32).toString('hex');

      // Update approval request
      const updatedApproval = await prisma.shareApproval.update({
        where: { id: approvalId },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvalToken,
          responseMessage: message,
          approverId: userId,
        }
      });

      // Send approval granted email to requester
      try {
        const emailService = EmailServiceFactory.create();

        if (approval.requester.email) {
          const shareUrl = `${process.env.FRONTEND_URL}/share/${approval.sharedFile.shareToken}?approval=${approvalToken}`;
          const ownerName = approval.sharedFile.file.owner.firstName && approval.sharedFile.file.owner.lastName
            ? `${approval.sharedFile.file.owner.firstName} ${approval.sharedFile.file.owner.lastName}`
            : approval.sharedFile.file.owner.email;

          await emailService.sendEmail({
            to: approval.requester.email,
            subject: `Access Approved: ${approval.sharedFile.file.fileName}`,
            html: `
              <h2>Access Request Approved</h2>
              <p>Great news! Your access request for "${approval.sharedFile.file.fileName}" has been approved by ${ownerName}.</p>
              ${message ? `<p><strong>Message from ${ownerName}:</strong> ${message}</p>` : ''}
              <p><a href="${shareUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Access File</a></p>
              <p>This link ${approval.sharedFile.expiresAt ? `expires on ${new Date(approval.sharedFile.expiresAt).toLocaleDateString()}` : 'does not expire'}.</p>
            `,
            text: `Your access request for "${approval.sharedFile.file.fileName}" has been approved. Access the file at: ${shareUrl}`,
            metadata: { approvalId, fileName: approval.sharedFile.file.fileName }
          });
        }
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
      }

      res.json({
        success: true,
        message: 'Share request approved successfully',
        data: {
          id: updatedApproval.id,
          status: updatedApproval.status,
          approvalToken,
          processedAt: updatedApproval.processedAt,
        }
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to approve share request', 500);
    }
  }

  async rejectShareRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await this.validateSchema<{
        approvalId: string;
        message?: string;
      }>(rejectRequestSchema, {
        approvalId: req.params.approvalId,
        message: req.body?.message,
      });

      const { approvalId, message } = data;
      const userId = req.user?.userId;

      if (!userId) {
        this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
        return;
      }

      // Find approval request
      const approval = await prisma.shareApproval.findUnique({
        where: { id: approvalId },
        include: {
          requester: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          sharedFile: {
            include: {
              file: {
                include: {
                  owner: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                  }
                }
              }
            }
          }
        }
      });

      if (!approval) {
        this.handleError(res, new Error('Approval request not found'), 'Approval request not found', 404);
        return;
      }

      // Check if user is the file owner
      if (approval?.sharedFile?.file?.owner?.id !== userId) {
        this.handleError(res, new Error('Access denied'), 'You are not authorized to reject this request', 403);
        return;
      }

      // Check if already processed
      if (approval.status !== 'PENDING') {
        this.handleError(res, new Error('Request already processed'), 'This approval request has already been processed', 400);
        return;
      }

      // Update approval request
      const updatedApproval = await prisma.shareApproval.update({
        where: { id: approvalId },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          responseMessage: message,
          approverId: userId,
        }
      });

      // Send rejection email to requester
      try {
        const emailService = EmailServiceFactory.create();

        if (approval.requester.email) {
          const ownerName = approval.sharedFile.file.owner.firstName && approval.sharedFile.file.owner.lastName
            ? `${approval.sharedFile.file.owner.firstName} ${approval.sharedFile.file.owner.lastName}`
            : approval.sharedFile.file.owner.email;

          await emailService.sendEmail({
            to: approval.requester.email,
            subject: `Access Request Denied: ${approval.sharedFile.file.fileName}`,
            html: `
              <h2>Access Request Denied</h2>
              <p>Unfortunately, your access request for "${approval.sharedFile.file.fileName}" has been denied by ${ownerName}.</p>
              ${message ? `<p><strong>Reason:</strong> ${message}</p>` : ''}
              <p>If you believe this is an error, please contact ${ownerName} directly.</p>
            `,
            text: `Your access request for "${approval.sharedFile.file.fileName}" has been denied. ${message ? `Reason: ${message}` : ''}`,
            metadata: { approvalId, fileName: approval.sharedFile.file.fileName }
          });
        }
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
      }

      res.json({
        success: true,
        message: 'Share request rejected successfully',
        data: {
          id: updatedApproval.id,
          status: updatedApproval.status,
          processedAt: updatedApproval.processedAt,
        }
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to reject share request', 500);
    }
  }

  async getPendingApprovals(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
        return;
      }

      // Get pending approval requests for files owned by this user
      const approvals = await prisma.shareApproval.findMany({
        where: {
          sharedFile: {
            file: {
              ownerId: userId
            }
          },
          status: 'PENDING'
        },
        include: {
          sharedFile: {
            include: {
              file: {
                select: {
                  id: true,
                  fileName: true,
                  fileType: true,
                  fileSize: true,
                }
              }
            }
          },
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const formattedApprovals = approvals.map(approval => ({
        id: approval.id,
        requestMessage: approval.requestMessage,
        requestedAt: approval.createdAt,
        requester: {
          id: approval.requester.id,
          firstName: approval.requester.firstName,
          lastName: approval.requester.lastName,
          email: approval.requester.email,
        },
        file: {
          id: approval.sharedFile.file.id,
          fileName: approval.sharedFile.file.fileName,
          fileType: approval.sharedFile.file.fileType,
          fileSize: approval.sharedFile.file.fileSize,
        },
        sharedFile: {
          token: approval.sharedFile.shareToken,
          permission: approval.sharedFile.permission,
          allowDownload: approval.sharedFile.allowDownload,
        }
      }));

      res.json({
        success: true,
        message: 'Pending approvals retrieved successfully',
        data: {
          approvals: formattedApprovals,
          count: formattedApprovals.length,
        }
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to get pending approvals', 500);
    }
  }

  async validateApprovalToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { token, approvalToken } = req.params as { token: string; approvalToken: string };

      // Find share link with valid approval token
      const approval = await prisma.shareApproval.findFirst({
        where: {
          approvalToken,
          status: 'APPROVED',
          sharedFile: {
            shareToken: token
          }
        },
        include: {
          sharedFile: {
            include: {
              file: true
            }
          }
        }
      });

      if (!approval) {
        this.handleError(res, new Error('Invalid approval token'), 'Invalid or expired approval token', 404);
        return;
      }

      // Check if share link is still valid
      if (approval.sharedFile.expiresAt && approval.sharedFile.expiresAt < new Date()) {
        this.handleError(res, new Error('Share link expired'), 'Share link has expired', 403);
        return;
      }

      res.json({
        success: true,
        message: 'Approval token is valid',
        data: {
          approved: true,
          approvedAt: approval.processedAt,
          file: {
            id: approval.sharedFile.file.id,
            fileName: approval.sharedFile.file.fileName,
            fileType: approval.sharedFile.file.fileType,
            fileSize: approval.sharedFile.file.fileSize,
          }
        }
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to validate approval token', 500);
    }
  }
}

export const approvalController = new ApprovalController();