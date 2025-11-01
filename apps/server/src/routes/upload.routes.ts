import { UploadController } from '../controllers/upload-wrapper.controller';
import { authenticate } from '../middleware/auth.middleware';
import { Router, Request, Response, NextFunction } from 'express';


const router = Router();

const controller = new UploadController();

const wrapHandler = (controllerMethod: Function) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await controllerMethod(req, res);
    } catch (error) {
      next(error);
    }
  };
};

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
}

router.post('/upload', expressAuthenticate, wrapHandler(controller.uploadSingleFile.bind(controller)));

router.post('/progress', expressAuthenticate, wrapHandler(controller.getUploadProgress.bind(controller)));

router.post('/cancel', expressAuthenticate, wrapHandler(controller.cancelUpload.bind(controller)));


export default router;