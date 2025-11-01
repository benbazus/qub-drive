import { Response } from 'express';
import { SystemSettingsService, SystemSettingsUpdate } from '../services/system-settings.service';
import { ApiResponse, AuthenticatedRequest } from '../middleware/auth.middleware';

export class SystemSettingsController {
  private systemSettingsService: SystemSettingsService;

  constructor() {
    this.systemSettingsService = new SystemSettingsService();
  }

  async getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const settings = await this.systemSettingsService.getSettings();

      const response: ApiResponse<typeof settings> = {
        success: true,
        data: settings
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve system settings');
    }
  }

  async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const updates: SystemSettingsUpdate = req.body;

      // Validate email settings if being updated
      if (updates.SMTP_HOST || updates.SMTP_PORT || updates.SMTP_FROM) {
        const validation = await this.systemSettingsService.validateEmailSettings(updates);
        if (!validation.valid) {
          const response: ApiResponse<null> = {
            success: false,
            data: null,
            error: validation.error || 'Invalid email settings',
            message: validation.error,
          };
          res.status(400).json(response);
          return;
        }
      }

      const updatedSettings = await this.systemSettingsService.updateSettings(updates);

      const response: ApiResponse<typeof updatedSettings> = {
        success: true,
        data: updatedSettings
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to update system settings');
    }
  }

  async getSettingsByCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { category } = req.params;

      const validCategories = ['storage', 'email', 'security', 'sharing', 'compliance'];
      if (!validCategories.includes(category)) {
        const response: ApiResponse<null> = {
          success: false,
          data: null,
          error: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
          message: `Invalid category: ${category}`,
        };
        res.status(400).json(response);
        return;
      }

      const settings = await this.systemSettingsService.getSettingsByCategory(category);

      const response: ApiResponse<typeof settings> = {
        success: true,
        data: settings
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve settings by category');
    }
  }

  async updateSettingsByCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { category } = req.params;
      const updates: Partial<SystemSettingsUpdate> = req.body;

      const validCategories = ['storage', 'email', 'security', 'sharing', 'compliance'];
      if (!validCategories.includes(category)) {
        const response: ApiResponse<null> = {
          success: false,
          data: null,
          error: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
          message: `Invalid category: ${category}`,
        };
        res.status(400).json(response);
        return;
      }

      // Validate email settings if updating email category
      if (category === 'email') {
        const validation = await this.systemSettingsService.validateEmailSettings(updates);
        if (!validation.valid) {
          const response: ApiResponse<null> = {
            success: false,
            data: null,
            error: validation.error || 'Invalid email settings',
            message: validation.error,
          };
          res.status(400).json(response);
          return;
        }
      }

      const updatedSettings = await this.systemSettingsService.updateSettingsByCategory(category, updates);

      const response: ApiResponse<typeof updatedSettings> = {
        success: true,
        data: updatedSettings
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to update settings by category');
    }
  }

  async resetToDefaults(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const defaultSettings = await this.systemSettingsService.resetToDefaults();

      const response: ApiResponse<typeof defaultSettings> = {
        success: true,
        data: defaultSettings
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to reset settings to defaults');
    }
  }

  async testEmailSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const emailSettings: Partial<SystemSettingsUpdate> = req.body;

      const testResult = await this.systemSettingsService.testEmailSettings(emailSettings);

      const response: ApiResponse<typeof testResult> = {
        success: testResult.success,
        data: testResult
      };

      res.status(testResult.success ? 200 : 400).json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to test email settings');
    }
  }

  async getSystemInfo(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const systemInfo = await this.systemSettingsService.getSystemInfo();

      const response: ApiResponse<typeof systemInfo> = {
        success: true,
        data: systemInfo
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve system info');
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

    console.error(`[SystemSettingsController] ${defaultMessage}:`, error);

    res.status(statusCode).json(response);
  }
}