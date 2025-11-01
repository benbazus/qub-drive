import { Response } from 'express';
import { UserSettingsService, UserSettingsUpdate } from '../services/user-settings.service';
import { ApiResponse, AuthenticatedRequest } from '../middleware/auth.middleware';

export class UserSettingsController {
  private userSettingsService: UserSettingsService;

  constructor() {
    this.userSettingsService = new UserSettingsService();
  }

  async getUserSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        const response: ApiResponse<null> = {
          success: false,
          data: null,
          error: 'Unauthorized',
          message: 'User not authenticated'
        };
        res.status(401).json(response);
        return;
      }

      const settings = await this.userSettingsService.getUserSettings(req.user.userId);

      const response: ApiResponse<typeof settings> = {
        success: true,
        data: settings
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve user settings');
    }
  }

  async updateUserSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        const response: ApiResponse<null> = {
          success: false,
          data: null,
          error: 'Unauthorized',
          message: 'User not authenticated'
        };
        res.status(401).json(response);
        return;
      }

      const updates: UserSettingsUpdate = req.body;

      const updatedSettings = await this.userSettingsService.updateUserSettings(
        req.user.userId,
        updates
      );

      const response: ApiResponse<typeof updatedSettings> = {
        success: true,
        data: updatedSettings,
        message: 'Settings updated successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to update user settings');
    }
  }

  async getUserSettingsByCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        const response: ApiResponse<null> = {
          success: false,
          data: null,
          error: 'Unauthorized',
          message: 'User not authenticated'
        };
        res.status(401).json(response);
        return;
      }

      const { category } = req.params;

      const validCategories = [
        'profile',
        'appearance',
        'notifications',
        'privacy',
        'files',
        'security',
        'accessibility',
        'advanced'
      ];

      if (!validCategories.includes(category)) {
        const response: ApiResponse<null> = {
          success: false,
          data: null,
          error: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
          message: `Invalid category: ${category}`
        };
        res.status(400).json(response);
        return;
      }

      const settings = await this.userSettingsService.getUserSettingsByCategory(
        req.user.userId,
        category
      );

      const response: ApiResponse<typeof settings> = {
        success: true,
        data: settings
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve settings by category');
    }
  }

  async updateUserSettingsByCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        const response: ApiResponse<null> = {
          success: false,
          data: null,
          error: 'Unauthorized',
          message: 'User not authenticated'
        };
        res.status(401).json(response);
        return;
      }

      const { category } = req.params;
      const updates: Partial<UserSettingsUpdate> = req.body;

      const validCategories = [
        'profile',
        'appearance',
        'notifications',
        'privacy',
        'files',
        'security',
        'accessibility',
        'advanced'
      ];

      if (!validCategories.includes(category)) {
        const response: ApiResponse<null> = {
          success: false,
          data: null,
          error: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
          message: `Invalid category: ${category}`
        };
        res.status(400).json(response);
        return;
      }

      const updatedSettings = await this.userSettingsService.updateUserSettingsByCategory(
        req.user.userId,
        category,
        updates
      );

      const response: ApiResponse<typeof updatedSettings> = {
        success: true,
        data: updatedSettings,
        message: 'Settings updated successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to update settings by category');
    }
  }

  async resetUserSettingsToDefaults(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        const response: ApiResponse<null> = {
          success: false,
          data: null,
          error: 'Unauthorized',
          message: 'User not authenticated'
        };
        res.status(401).json(response);
        return;
      }

      const defaultSettings = await this.userSettingsService.resetUserSettingsToDefaults(
        req.user.userId
      );

      const response: ApiResponse<typeof defaultSettings> = {
        success: true,
        data: defaultSettings,
        message: 'Settings reset to defaults successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to reset settings to defaults');
    }
  }

  private handleError(res: Response, error: unknown, defaultMessage: string, statusCode = 500): void {
    const message = error instanceof Error ? error.message : defaultMessage;

    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: defaultMessage,
      message
    };

    console.error(`[UserSettingsController] ${defaultMessage}:`, error);

    res.status(statusCode).json(response);
  }
}

export const userSettingsController = new UserSettingsController();
