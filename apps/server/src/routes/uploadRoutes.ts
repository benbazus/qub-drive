import { UploadController } from '../controllers/upload-wrapper.controller';
import { authenticate } from '../middleware/auth.middleware';
import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

const uploadController = new UploadController();

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

router.post('/', expressAuthenticate, wrapHandler(uploadController.uploadSingleFile.bind(uploadController)));

// Simple placeholder upload endpoints
// router.post('/', async (req: Request, res: Response) => {

//     await uploadController.uploadSingleFile();

//     res.status(501).json({
//         success: false,
//         message: 'Upload functionality not yet implemented'
//     });
// });

router.get('/progress', async (req: Request, res: Response) => {
    res.status(501).json({
        success: false,
        message: 'Upload progress not yet implemented'
    });
});

router.post('/cancel', async (req: Request, res: Response) => {
    res.status(501).json({
        success: false,
        message: 'Upload cancel not yet implemented'
    });
});

router.post('/batch', async (req: Request, res: Response) => {
    res.status(501).json({
        success: false,
        message: 'Batch upload not yet implemented'
    });
});

router.post('/resume', async (req: Request, res: Response) => {
    res.status(501).json({
        success: false,
        message: 'Resume upload not yet implemented'
    });
});

export default router;