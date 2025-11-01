import { IncomingMessage, ServerResponse } from 'node:http';
import { SystemSettingsController } from './system-settings.controller';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class SystemSettingsWrapperController {
    private systemSettingsController: SystemSettingsController;

    constructor() {
        this.systemSettingsController = new SystemSettingsController();
    }

    // Helper function to safely stringify data with BigInt support
    private safeStringify(data: any): string {
        return JSON.stringify(data, (key, value) => {
            // Convert BigInt to string
            if (typeof value === 'bigint') {
                return value.toString();
            }
            return value;
        });
    }

    async getSettings(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
        try {
            const expressRes = this.convertToExpressResponse(res);
            await this.systemSettingsController.getSettings(req, expressRes);
        } catch (error) {
            console.error('Get settings error:', error);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(this.safeStringify({
                    success: false,
                    message: 'Internal server error',
                    error: error instanceof Error ? error.message : 'Unknown error'
                }));
            }
        }
    }

    async updateSettings(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
        try {
            const expressRes = this.convertToExpressResponse(res);
            await this.systemSettingsController.updateSettings(req, expressRes);
        } catch (error) {
            console.error('Update settings error:', error);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(this.safeStringify({
                    success: false,
                    message: 'Internal server error',
                    error: error instanceof Error ? error.message : 'Unknown error'
                }));
            }
        }
    }

    async getSettingsByCategory(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
        try {
            const expressRes = this.convertToExpressResponse(res);
            await this.systemSettingsController.getSettingsByCategory(req, expressRes);
        } catch (error) {
            console.error('Get settings by category error:', error);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(this.safeStringify({
                    success: false,
                    message: 'Internal server error',
                    error: error instanceof Error ? error.message : 'Unknown error'
                }));
            }
        }
    }

    async updateSettingsByCategory(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
        try {
            const expressRes = this.convertToExpressResponse(res);
            await this.systemSettingsController.updateSettingsByCategory(req, expressRes);
        } catch (error) {
            console.error('Update settings by category error:', error);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(this.safeStringify({
                    success: false,
                    message: 'Internal server error',
                    error: error instanceof Error ? error.message : 'Unknown error'
                }));
            }
        }
    }

    async resetToDefaults(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
        try {
            const expressRes = this.convertToExpressResponse(res);
            await this.systemSettingsController.resetToDefaults(req, expressRes);
        } catch (error) {
            console.error('Reset to defaults error:', error);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(this.safeStringify({
                    success: false,
                    message: 'Internal server error',
                    error: error instanceof Error ? error.message : 'Unknown error'
                }));
            }
        }
    }

    async testEmailSettings(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
        try {
            const expressRes = this.convertToExpressResponse(res);
            await this.systemSettingsController.testEmailSettings(req, expressRes);
        } catch (error) {
            console.error('Test email settings error:', error);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(this.safeStringify({
                    success: false,
                    message: 'Internal server error',
                    error: error instanceof Error ? error.message : 'Unknown error'
                }));
            }
        }
    }

    async getSystemInfo(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
        try {
            const expressRes = this.convertToExpressResponse(res);
            await this.systemSettingsController.getSystemInfo(req, expressRes);
        } catch (error) {
            console.error('Get system info error:', error);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(this.safeStringify({
                    success: false,
                    message: 'Internal server error',
                    error: error instanceof Error ? error.message : 'Unknown error'
                }));
            }
        }
    }

    private convertToExpressResponse(res: ServerResponse): any {
        return {
            status: (code: number) => ({
                json: (data: any) => {
                    res.writeHead(code, { 'Content-Type': 'application/json' });
                    res.end(this.safeStringify(data));
                }
            }),
            json: (data: any) => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(this.safeStringify(data));
            },
            writeHead: res.writeHead.bind(res),
            end: res.end.bind(res),
            headersSent: res.headersSent
        };
    }
}