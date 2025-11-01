import { Router } from 'express';
import { PlanController } from '../controllers/plan.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const planController = new PlanController();

// Public routes - no authentication required
router.get('/plans', planController.getAllPlans.bind(planController));
router.get('/plans/:planId', planController.getPlanById.bind(planController));
router.get('/plans/:planId/features', planController.getPlanFeatures.bind(planController));

// Protected routes - authentication required
router.get('/subscriptions/me', authenticate, planController.getUserSubscription.bind(planController));
router.post('/subscriptions', authenticate, planController.createSubscription.bind(planController));
router.put('/subscriptions/:subscriptionId', authenticate, planController.updateSubscription.bind(planController));
router.delete('/subscriptions/:subscriptionId', authenticate, planController.cancelSubscription.bind(planController));
router.get('/access/validate', authenticate, planController.validateUserAccess.bind(planController));

export default router;