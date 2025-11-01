import { Router } from 'express';
import { ContactController } from '../controllers/contact.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const contactController = new ContactController();

// Public routes - no authentication required
router.post('/contact', contactController.submitContactForm.bind(contactController));
router.get('/contact/:submissionId', contactController.getSubmission.bind(contactController));

// Protected routes - admin access required
router.get('/contact', authenticate, contactController.getAllSubmissions.bind(contactController));
router.put('/contact/:submissionId/status', authenticate, contactController.updateSubmissionStatus.bind(contactController));
router.get('/contact/status/:status', authenticate, contactController.getSubmissionsByStatus.bind(contactController));
router.get('/contact/plan/:plan', authenticate, contactController.getSubmissionsByPlan.bind(contactController));

export default router;