
import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { RegistrationController } from '../controllers/registration.controller';


const router = Router();

const registrationController = new RegistrationController();

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

router.post('/cancel', wrapHandler(registrationController.cancelRegistration));

router.post('/complete', wrapHandler(registrationController.completeRegistration));

router.get('/status', wrapHandler(registrationController.getRegistrationStats));

router.post('/resend-otp', wrapHandler(registrationController.resendVerificationOtp));

// Public routes - no authentication required
router.post('/start', wrapHandler(registrationController.startRegistration));

router.post('/verify-email', wrapHandler(registrationController.verifyEmail));

export default router;
