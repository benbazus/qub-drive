import { NextFunction, Router, Request, Response } from 'express';
import { shareController } from '../controllers/share.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();


// Wrapper function to convert Express handlers to match controller signatures
const wrapHandler = (controllerMethod: any) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await controllerMethod(req, res);
        } catch (error) {
            next(error);
        }
    };
};

// Express middleware wrapper for authenticate function
const expressAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as any;
        const authRes = res as any;

        const isAuthenticated = await authenticate(authReq, authRes);

        if (isAuthenticated) {
            next();
        }
    } catch (error) {
        next(error);
    }
};

router.post('/:fileId/delete-info', expressAuthenticate, wrapHandler(shareController.createShare));

router.post('/', authenticate, shareController.createShare.bind(shareController));
//router.post('/', shareController.createShare.bind(shareController));

export default router;