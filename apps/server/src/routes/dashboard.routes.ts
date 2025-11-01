import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireAdmin, requireSuperAdmin } from '../middleware/auth.middleware';
import { DashboardController } from '../controllers/dashboard.controller';

const router = Router();
const controller = new DashboardController();

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

// Express middleware wrapper for requireAdmin function
const expressRequireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as any;
    const authRes = res as any;

    // First authenticate
    const isAuthenticated = await authenticate(authReq, authRes);
    if (!isAuthenticated) {
      return;
    }

    // Then check admin role
    const isAuthorized = await requireAdmin()(authReq, authRes);
    if (isAuthorized) {
      next();
    }
  } catch (error) {
    next(error);
  }
};

// Express middleware wrapper for requireSuperAdmin function
const expressRequireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as any;
    const authRes = res as any;

    // First authenticate
    const isAuthenticated = await authenticate(authReq, authRes);
    if (!isAuthenticated) {
      return;
    }

    // Then check super admin role
    const isAuthorized = await requireSuperAdmin()(authReq, authRes);
    if (isAuthorized) {
      next();
    }
  } catch (error) {
    next(error);
  }
};

// ============= Dashboard Routes =============

/**
 * Get dashboard statistics (All authenticated users)
 * The stats returned will be filtered based on user role
 */
router.get('/stats', expressAuthenticate, wrapHandler(controller.getDashboardStats.bind(controller)));

/**
 * Get system health information (Super Admin only)
 */
router.get('/system-health', expressRequireSuperAdmin, wrapHandler(controller.getSystemHealth.bind(controller)));

/**
 * Get user management data with pagination and filters (Admin and Super Admin)
 */
router.get('/users', expressRequireAdmin, wrapHandler(controller.getUserManagement.bind(controller)));

/**
 * Update user role and permissions (Admin and Super Admin)
 */
router.put('/users/:userId/role', expressRequireAdmin, wrapHandler(controller.updateUserRole.bind(controller)));

/**
 * Update user status (active/locked) (Admin and Super Admin)
 */
router.put('/users/:userId/status', expressRequireAdmin, wrapHandler(controller.updateUserStatus.bind(controller)));

/**
 * Perform bulk action on multiple users (Super Admin only)
 */
router.post('/users/bulk-action', expressRequireSuperAdmin, wrapHandler(controller.bulkUserAction.bind(controller)));

/**
 * Get analytics data (Admin and Super Admin)
 */
router.get('/analytics', expressRequireAdmin, wrapHandler(controller.getAnalytics.bind(controller)));

export default router;
