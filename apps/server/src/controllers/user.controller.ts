

import { ServerResponse } from 'http';

import { ApiResponse, AuthenticatedRequest } from '../middleware/auth.middleware';
import { Response } from 'express';
import prisma from '@/config/database.config';

// AppError class for proper error handling
class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}



export class UserController {

    public searchUsers = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { query } = req.query as { query?: string };

            // Return empty array for short or invalid queries
            if (!query || typeof query !== 'string' || query.trim().length < 2) {
                return res.status(200).json([]);
            }

            // Search across email, firstName, lastName, and username
            const users = await prisma.user.findMany({
                where: {
                    OR: [
                        { email: { contains: query.trim(), mode: 'insensitive' } },
                        { firstName: { contains: query.trim(), mode: 'insensitive' } },
                        { lastName: { contains: query.trim(), mode: 'insensitive' } },
                        { username: { contains: query.trim(), mode: 'insensitive' } },
                    ],
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                },
                take: 10, // Limit to 10 results
            });
            console.log(" ===================== ")
            console.log(users)
            console.log(" ===================== ")
            return res.status(200).json(users);
        } catch (error: any) {
            console.error('Error searching users:', error);
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            return res.status(500).json({ message: 'Failed to search users' });
        }
    };

    public searchUsersByEmail = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { query } = req.query as { query?: string };


            // Return empty array for short or invalid queries
            if (!query || typeof query !== 'string' || query.trim().length < 2) {
                return res.status(200).json([]);
            }

            // Search for users with partial email match
            const users = await prisma.user.findMany({
                where: {
                    email: {
                        contains: query.trim(),
                        mode: 'insensitive', // Case-insensitive search
                    },
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                },
                take: 10, // Limit to 10 results
            });


            return res.status(200).json(users);
        } catch (error: any) {
            console.error('Error searching users by email:', error);
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            return res.status(500).json({ message: 'Failed to search users by email' });
        }
    };

    private handleError(res: ServerResponse | Response, error: unknown, defaultMessage: string, statusCode = 500): void {
        const message = error instanceof Error ? error.message : defaultMessage;

        const response: ApiResponse = {
            success: false,
            error: defaultMessage,
            message,
            timestamp: new Date().toISOString()
        };

        console.error(`[FileController] ${defaultMessage}:`, error);

        if ('writeHead' in res) {
            // ServerResponse
            res.writeHead(statusCode, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        } else {
            // Express Response
            (res as any).status(statusCode).json(response);
        }
    }

}