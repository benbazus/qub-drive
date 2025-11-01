import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiResponse } from './auth.middleware';


export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const response: ApiResponse = {
            success: false,
            error: 'Validation failed',
            message: 'Request validation failed',
            metadata: {
                timestamp: new Date(),
                requestId: req.headers['x-request-id'] as string || 'unknown',
                message: 'Validation errors occurred',
                error: errors.array().map(err => ({
                    field: err.type === 'field' ? (err as any).path : 'unknown',
                    message: err.msg,
                    value: err.type === 'field' ? (err as any).value : undefined
                })).join(', ')
            }
        };

        res.status(400).json(response);
        return;
    }

    next();
};