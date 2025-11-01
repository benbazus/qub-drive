import { Router, Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import fileUploaderController from '../controllers/fileUploader.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
        files: 10 // Maximum 10 files per request
    },
    fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        // Add any file type restrictions here if needed
        cb(null, true);
    }
});

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

// Upload routes
router.post('/initialize', expressAuthenticate, wrapHandler(fileUploaderController.initializeUpload));
router.post('/chunk', expressAuthenticate, upload.single('chunk'), wrapHandler(fileUploaderController.uploadChunk));
router.post('/file', expressAuthenticate, upload.single('file'), wrapHandler(fileUploaderController.uploadFile));

// Progress and management routes
router.get('/progress/:uploadId', expressAuthenticate, wrapHandler(fileUploaderController.getUploadProgress));
router.delete('/cancel/:uploadId', expressAuthenticate, wrapHandler(fileUploaderController.cancelUpload));
router.get('/user-uploads', expressAuthenticate, wrapHandler(fileUploaderController.getUserUploads));

export default router;