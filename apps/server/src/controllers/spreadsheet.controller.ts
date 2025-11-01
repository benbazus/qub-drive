import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import * as Joi from 'joi';
import { EmailServiceFactory } from '../services/email/email-service.factory';
import prisma from '@/config/database.config';

// Validation schemas
const createSpreadsheetSchema = Joi.object({
  token: Joi.string().required(),
  title: Joi.string().optional(),
  cells: Joi.object().optional(),
  metadata: Joi.object().optional(),
});

const updateSpreadsheetSchema = Joi.object({
  title: Joi.string().optional(),
  cells: Joi.object().optional(),
  metadata: Joi.object().optional(),
});

const grantAccessSchema = Joi.object({
  userId: Joi.string().required(),
  email: Joi.string().email().optional(),
  permission: Joi.string().valid('VIEW', 'EDIT', 'ADMIN').required(),
});

export class SpreadsheetController {
  // Get spreadsheet by token
  public getSpreadsheet = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { token } = req.params;
      const userId = req.user?.userId;

      if (!token) {
        res.status(400).json({ error: 'Token is required' });
        return;
      }

      const spreadsheet = await prisma.spreadsheet.findUnique({
        where: { token },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          collaborators: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      if (!spreadsheet) {
        res.status(404).json({ error: 'Spreadsheet not found' });
        return;
      }

      // Check if user has access
      const hasAccess = this.checkAccess(spreadsheet, userId);
      if (!hasAccess.allowed) {
        res.status(403).json({ error: hasAccess.message });
        return;
      }

      res.json({
        ...spreadsheet,
        permission: hasAccess.permission,
      });
    } catch (error) {
      console.error('Error fetching spreadsheet:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create or update spreadsheet
  public async createOrUpdateSpreadsheet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const userId = req.user?.userId;
      const { error, value: data } = createSpreadsheetSchema.validate(req.body);
      if (error) {
        res.status(400).json({ error: 'Validation error', details: error.details });
        return;
      }

      if (!token) {
        res.status(400).json({ error: 'Token is required' });
        return;
      }

      // Check if spreadsheet already exists
      const existingSpreadsheet = await prisma.spreadsheet.findUnique({
        where: { token },
        include: {
          collaborators: true,
        },
      });

      if (existingSpreadsheet) {
        // Update existing spreadsheet
        const hasAccess = this.checkAccess(existingSpreadsheet, userId);
        if (!hasAccess.allowed || !['EDIT', 'ADMIN'].includes(hasAccess.permission)) {
          res.status(403).json({ error: 'Insufficient permissions to edit' });
          return;
        }

        const updatedSpreadsheet = await prisma.spreadsheet.update({
          where: { token },
          data: {
            title: data.title || existingSpreadsheet.title,
            cells: data.cells || existingSpreadsheet.cells,
            metadata: data.metadata || existingSpreadsheet.metadata,
            lastSaved: new Date(),
          },
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            collaborators: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        });

        // Create version if there are significant changes
        if (data.cells) {
          await this.createVersion(updatedSpreadsheet.id, data.cells, userId!);
        }

        res.json({
          ...updatedSpreadsheet,
          permission: hasAccess.permission,
        });
      } else {
        // Create new spreadsheet
        if (!userId) {
          res.status(401).json({ error: 'Authentication required to create spreadsheet' });
          return;
        }

        const newSpreadsheet = await prisma.spreadsheet.create({
          data: {
            token,
            title: data.title || 'Untitled Spreadsheet',
            cells: data.cells || {},
            metadata: data.metadata || {},
            ownerId: userId,
          },
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            collaborators: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        });

        // Create initial version
        await this.createVersion(newSpreadsheet.id, data.cells || {}, userId);

        res.status(201).json({
          ...newSpreadsheet,
          permission: 'ADMIN',
        });
      }
    } catch (error) {
      console.error('Error creating/updating spreadsheet:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update spreadsheet
  public async updateSpreadsheet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const userId = req.user?.userId;
      const { error, value: data } = updateSpreadsheetSchema.validate(req.body);
      if (error) {
        res.status(400).json({ error: 'Validation error', details: error.details });
        return;
      }

      const spreadsheet = await prisma.spreadsheet.findUnique({
        where: { token },
        include: {
          collaborators: true,
        },
      });

      if (!spreadsheet) {
        res.status(404).json({ error: 'Spreadsheet not found' });
        return;
      }

      const hasAccess = this.checkAccess(spreadsheet, userId);
      if (!hasAccess.allowed || !['EDIT', 'ADMIN'].includes(hasAccess.permission)) {
        res.status(403).json({ error: 'Insufficient permissions to edit' });
        return;
      }

      const updatedSpreadsheet = await prisma.spreadsheet.update({
        where: { token },
        data: {
          ...data,
          lastSaved: new Date(),
        },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          collaborators: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      // Create version if cells were updated
      if (data.cells && userId) {
        await this.createVersion(updatedSpreadsheet.id, data.cells, userId);
      }

      res.json({
        ...updatedSpreadsheet,
        permission: hasAccess.permission,
      });
    } catch (error) {
      console.error('Error updating spreadsheet:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Grant access to user
  public async grantAccess(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const userId = req.user?.userId;
      const { error, value: data } = grantAccessSchema.validate(req.body);
      if (error) {
        res.status(400).json({ error: 'Validation error', details: error.details });
        return;
      }

      const spreadsheet = await prisma.spreadsheet.findUnique({
        where: { token },
        include: {
          collaborators: true,
        },
      });

      if (!spreadsheet) {
        res.status(404).json({ error: 'Spreadsheet not found' });
        return;
      }

      const hasAccess = this.checkAccess(spreadsheet, userId);
      if (!hasAccess.allowed || hasAccess.permission !== 'ADMIN') {
        res.status(403).json({ error: 'Only admins can grant access' });
        return;
      }

      let targetUserId = data.userId;

      // If userId is an email, try to find the user by email
      if (data.userId.includes('@')) {
        const user = await prisma.user.findUnique({
          where: { email: data.userId },
          select: { id: true, email: true, firstName: true, lastName: true },
        });

        if (!user) {
          res.status(404).json({ error: 'User not found with this email address' });
          return;
        }

        targetUserId = user.id;
      }

      // Check if user already has access
      const existingAccess = await prisma.spreadsheetAccess.findUnique({
        where: {
          spreadsheetId_userId: {
            spreadsheetId: spreadsheet.id,
            userId: targetUserId,
          },
        },
      });

      if (existingAccess) {
        // Update existing access
        await prisma.spreadsheetAccess.update({
          where: { id: existingAccess.id },
          data: {
            permission: data.permission as any,
            grantedBy: userId,
            grantedAt: new Date(),
          },
        });
      } else {
        // Create new access
        await prisma.spreadsheetAccess.create({
          data: {
            spreadsheetId: spreadsheet.id,
            userId: targetUserId,
            permission: data.permission as any,
            grantedBy: userId,
          },
        });
      }

      // Send email notification to the user
      try {
        const targetUser = await prisma.user.findUnique({
          where: { id: targetUserId },
          select: { email: true, firstName: true, lastName: true },
        });

        const granterUser = await prisma.user.findUnique({
          where: { id: userId! },
          select: { firstName: true, lastName: true, email: true },
        });

        if (targetUser && granterUser) {
          const emailService = new EmailServiceFactory();
          // await emailService.sendSpreadsheetShareNotification({
          //   recipientEmail: targetUser.email,
          //   recipientName: `${targetUser.firstName} ${targetUser.lastName}`,
          //   granterName: `${granterUser.firstName} ${granterUser.lastName}`,
          //   spreadsheetTitle: spreadsheet.title,
          //   permission: data.permission,
          //   spreadsheetUrl: `${process.env.CLIENT_URL}/spreadsheet?token=${spreadsheet.token}`,
          // });
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Don't fail the request if email fails
      }

      res.json({ message: 'Access granted successfully' });
    } catch (error) {
      console.error('Error granting access:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Revoke access
  public async revokeAccess(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { token, userId: targetUserId } = req.params;
      const userId = req.user?.userId;

      const spreadsheet = await prisma.spreadsheet.findUnique({
        where: { token },
        include: {
          collaborators: true,
        },
      });

      if (!spreadsheet) {
        res.status(404).json({ error: 'Spreadsheet not found' });
        return;
      }

      const hasAccess = this.checkAccess(spreadsheet, userId);
      if (!hasAccess.allowed || hasAccess.permission !== 'ADMIN') {
        res.status(403).json({ error: 'Only admins can revoke access' });
        return;
      }

      await prisma.spreadsheetAccess.deleteMany({
        where: {
          spreadsheetId: spreadsheet.id,
          userId: targetUserId,
        },
      });

      res.json({ message: 'Access revoked successfully' });
    } catch (error) {
      console.error('Error revoking access:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get spreadsheet versions
  public async getVersions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const userId = req.user?.userId;

      const spreadsheet = await prisma.spreadsheet.findUnique({
        where: { token },
        include: {
          collaborators: true,
        },
      });

      if (!spreadsheet) {
        res.status(404).json({ error: 'Spreadsheet not found' });
        return;
      }

      const hasAccess = this.checkAccess(spreadsheet, userId);
      if (!hasAccess.allowed) {
        res.status(403).json({ error: hasAccess.message });
        return;
      }

      const versions = await prisma.spreadsheetVersion.findMany({
        where: { spreadsheetId: spreadsheet.id },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(versions);
    } catch (error) {
      console.error('Error fetching versions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get spreadsheet collaborators
  public async getCollaborators(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const userId = req.user?.userId;

      const spreadsheet = await prisma.spreadsheet.findUnique({
        where: { token },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          collaborators: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      if (!spreadsheet) {
        res.status(404).json({ error: 'Spreadsheet not found' });
        return;
      }

      const hasAccess = this.checkAccess(spreadsheet, userId);
      if (!hasAccess.allowed) {
        res.status(403).json({ error: hasAccess.message });
        return;
      }

      // Format collaborators for frontend
      const collaborators = [
        // Owner
        {
          id: spreadsheet.owner?.id,
          email: spreadsheet.owner?.email,
          name: `${spreadsheet.owner?.firstName} ${spreadsheet.owner?.lastName}`,
          permission: 'ADMIN',
          status: 'active',
          isOwner: true,
        },
        // Other collaborators
        ...spreadsheet.collaborators.map((collab: any) => ({
          id: collab.user.id,
          email: collab.user.email,
          name: `${collab.user.firstName} ${collab.user.lastName}`,
          permission: collab.permission,
          status: 'active',
          isOwner: false,
          grantedAt: collab.grantedAt,
        })),
      ].filter(Boolean);

      res.json(collaborators);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete spreadsheet
  public async deleteSpreadsheet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const userId = req.user?.userId;

      const spreadsheet = await prisma.spreadsheet.findUnique({
        where: { token },
        include: {
          collaborators: true,
        },
      });

      if (!spreadsheet) {
        res.status(404).json({ error: 'Spreadsheet not found' });
        return;
      }

      const hasAccess = this.checkAccess(spreadsheet, userId);
      if (!hasAccess.allowed || hasAccess.permission !== 'ADMIN') {
        res.status(403).json({ error: 'Only admins can delete spreadsheet' });
        return;
      }

      await prisma.spreadsheet.delete({
        where: { token },
      });

      res.json({ message: 'Spreadsheet deleted successfully' });
    } catch (error) {
      console.error('Error deleting spreadsheet:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Helper method to check access permissions
  private checkAccess(spreadsheet: any, userId?: string): { allowed: boolean; permission: string; message?: string } {
    // If spreadsheet is public, allow read access
    if (spreadsheet.isPublic) {
      return { allowed: true, permission: 'VIEW' };
    }

    // If user is not authenticated
    if (!userId) {
      return { allowed: false, permission: '', message: 'Authentication required' };
    }

    // If user is the owner
    if (spreadsheet.ownerId === userId) {
      return { allowed: true, permission: 'ADMIN' };
    }

    // Check collaborator permissions
    const collaborator = spreadsheet.collaborators?.find((c: any) => c.userId === userId);
    if (collaborator) {
      return { allowed: true, permission: collaborator.permission };
    }

    return { allowed: false, permission: '', message: 'Access denied' };
  }

  // Helper method to create version
  private async createVersion(spreadsheetId: string, cells: any, userId: string) {
    try {
      const latestVersion = await prisma.spreadsheetVersion.findFirst({
        where: { spreadsheetId },
        orderBy: { versionNumber: 'desc' },
      });

      const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

      await prisma.spreadsheetVersion.create({
        data: {
          spreadsheetId,
          versionNumber: nextVersionNumber,
          cells,
          createdBy: userId,
        },
      });
    } catch (error) {
      console.error('Error creating version:', error);
    }
  }
}

export const spreadsheetController = new SpreadsheetController();