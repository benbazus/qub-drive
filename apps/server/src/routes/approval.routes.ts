import { Router, Request, Response, NextFunction } from 'express';
import { approvalController } from '../controllers/approval.controller';
import { authenticate } from '../middleware/auth.middleware';


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


// Get single approval request
router.get('/:approvalId', expressAuthenticate, wrapHandler(approvalController.getApprovalRequest));

// Approve share request
router.post('/:approvalId/approve', expressAuthenticate, wrapHandler(approvalController.approveShareRequest));

// Reject share request
router.post('/:approvalId/reject', expressAuthenticate, wrapHandler(approvalController.rejectShareRequest));

// Get pending approvals for current user
router.get('/', expressAuthenticate, wrapHandler(approvalController.getPendingApprovals));

// Validate approval token (for accessing approved shares)
router.get('/validate/:token/:approvalToken', wrapHandler(approvalController.validateApprovalToken));

export default router;