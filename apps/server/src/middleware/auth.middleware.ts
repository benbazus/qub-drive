
import authService from '../services/auth.service';
import { DeviceInfo, Permission, TokenPayload, UserRole } from '../types/auth.types';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Request } from 'express';




export interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
    deviceInfo?: DeviceInfo;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp?: string | Date;
    requestId?: string;
    metadata?: {
        timestamp: Date;
        requestId: string;
        message: string;
        error?: string;
        pagination?: {
            total: number;
            hasMore: boolean;
            page: number;
            limit: number;
            nextPage?: number;
            prevPage?: number;
        };
    };
}


export const authenticate = async (req: AuthenticatedRequest, res: ServerResponse): Promise<boolean> => {
    try {
        const token = extractToken(req);
        console.log(" 0000000000000000000000000 ")
        // console.log(" ++++++++++++++++ ")
        // console.log(token)
        // console.log(" ++++++++++++++++ ")

        if (!token) {
            sendErrorResponse(res, 401, 'Unauthorized', 'Access token required');
            return false;
        }
        console.log(" 111111111111111111111111111 ")
        const decoded = await authService.verifyToken(token);
        req.user = decoded;
        req.deviceInfo = extractDeviceInfo(req);

        console.log(" 2222222222222222222222222 ")

        return true;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid token';
        sendErrorResponse(res, 401, 'Unauthorized', message);
        return false;
    }
};

// Authorization middleware factory
export const authorize = (requiredPermissions: Permission[] = [], requiredRoles: UserRole[] = []) => {
    return async (req: AuthenticatedRequest, res: ServerResponse): Promise<boolean> => {
        if (!req.user) {
            sendErrorResponse(res, 401, 'Unauthorized', 'Authentication required');
            return false;
        }

        // Check roles
        if (requiredRoles.length > 0 && !requiredRoles.includes(req.user.role)) {
            sendErrorResponse(res, 403, 'Forbidden', 'Insufficient role privileges');
            return false;
        }

        // Check permissions
        if (requiredPermissions.length > 0) {
            const hasPermission = requiredPermissions.some((permission) =>
                req.user!.permissions.includes(permission)
            );

            if (!hasPermission) {
                sendErrorResponse(res, 403, 'Forbidden', 'Insufficient permissions');
                return false;
            }
        }

        return true;
    };
};

// Admin-only access
export const requireAdmin = () => {
    return authorize([], [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
};

// Super admin-only access
export const requireSuperAdmin = () => {
    return authorize([], [UserRole.SUPER_ADMIN]);
};

const extractToken = (req: IncomingMessage): string | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
};

const extractPlatform = (userAgent: string): string => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
    return 'Unknown';
};

const getClientIP = (req: IncomingMessage): string => {
    return (
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        (req.headers['x-real-ip'] as string) ||
        req.socket.remoteAddress ||
        'unknown'
    );
};

const extractDeviceInfo = (req: IncomingMessage): DeviceInfo => {
    return {
        userAgent: req.headers['user-agent'] || 'unknown',
        ipAddress: getClientIP(req),
        platform: extractPlatform(req.headers['user-agent'] || ''),
    };
};

const sendErrorResponse = (res: ServerResponse, statusCode: number, error: string, message: string): void => {
    const response: ApiResponse = { success: false, error, message, timestamp: new Date().toISOString(), };

    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response, null, 2));
};