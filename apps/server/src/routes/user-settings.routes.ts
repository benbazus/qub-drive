import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { userSettingsController } from '../controllers/user-settings.controller';

const router = Router();

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

// All routes require authentication - user can only access their own settings
router.get('/', expressAuthenticate, wrapHandler(userSettingsController.getUserSettings.bind(userSettingsController)));

router.put('/', expressAuthenticate, wrapHandler(userSettingsController.updateUserSettings.bind(userSettingsController)));

router.post('/reset', expressAuthenticate, wrapHandler(userSettingsController.resetUserSettingsToDefaults.bind(userSettingsController)));

router.get('/:category', expressAuthenticate, wrapHandler(userSettingsController.getUserSettingsByCategory.bind(userSettingsController)));

router.put('/:category', expressAuthenticate, wrapHandler(userSettingsController.updateUserSettingsByCategory.bind(userSettingsController)));

export default router;
