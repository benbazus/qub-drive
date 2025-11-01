import { Router } from 'express';
import { DemoController } from '../controllers/demo.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const demoController = new DemoController();

// Public routes - no authentication required
router.post('/demo', demoController.submitDemoRequest.bind(demoController));
router.get('/demo/:requestId', demoController.getDemoRequest.bind(demoController));

// Protected routes - admin access required
router.get('/demo', authenticate, demoController.getAllDemoRequests.bind(demoController));
router.put('/demo/:requestId/status', authenticate, demoController.updateDemoStatus.bind(demoController));
router.post('/demo/:requestId/schedule', authenticate, demoController.scheduleDemoRequest.bind(demoController));
router.get('/demo/status/:status', authenticate, demoController.getDemoRequestsByStatus.bind(demoController));
router.get('/demo/type/:type', authenticate, demoController.getDemoRequestsByType.bind(demoController));
router.get('/demo/plan/:plan', authenticate, demoController.getDemoRequestsByPlan.bind(demoController));

export default router;