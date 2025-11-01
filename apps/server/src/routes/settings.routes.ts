import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { SystemSettingsWrapperController } from '../controllers/system-settings-wrapper.controller';

const router = Router();

const controller = new SystemSettingsWrapperController();

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

router.get('/', expressAuthenticate, wrapHandler(controller.getSettings.bind(controller)));

router.post('/reset', expressAuthenticate, wrapHandler(controller.resetToDefaults.bind(controller)));

router.post('/email/test', expressAuthenticate, wrapHandler(controller.testEmailSettings.bind(controller)));

router.get('/info', expressAuthenticate, wrapHandler(controller.getSystemInfo.bind(controller)));

router.get('/:category', expressAuthenticate, wrapHandler(controller.getSettingsByCategory.bind(controller)));

router.put('/:category', expressAuthenticate, wrapHandler(controller.updateSettingsByCategory.bind(controller)));



export default router;
