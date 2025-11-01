import { UserController } from '../controllers/user.controller';
import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware';


const router = Router();

const userController = new UserController();

// Wrapper function to convert Express handlers to match controller signatures
const wrapHandler = (controllerMethod: Function) => {
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
        // Convert Express request to AuthenticatedRequest format
        const authReq = req as any;
        const authRes = res as any;

        // Call the authenticate function
        const isAuthenticated = await authenticate(authReq, authRes);

        if (isAuthenticated) {
            next();
        }
        // If not authenticated, the authenticate function will have already sent the error response
    } catch (error) {
        next(error);
    }
};

router.get('/get-users-by-email', expressAuthenticate, wrapHandler(userController.searchUsersByEmail));

router.get('/search', expressAuthenticate, wrapHandler(userController.searchUsers));


export default router;
