import { Router, Request, Response, NextFunction } from 'express';
import documentController from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { body, param } from 'express-validator';

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

// Comment validation schemas
const addReplyValidation = [
    param('commentId').isUUID().withMessage('Valid comment ID is required'),
    body('content').notEmpty().withMessage('Reply content is required')
];

const updateCommentValidation = [
    param('commentId').isUUID().withMessage('Valid comment ID is required'),
    body('content').notEmpty().withMessage('Comment content is required')
];

const toggleResolutionValidation = [
    param('commentId').isUUID().withMessage('Valid comment ID is required'),
    body('isResolved').isBoolean().withMessage('isResolved must be a boolean')
];

const commentIdValidation = [
    param('commentId').isUUID().withMessage('Valid comment ID is required')
];

/**
 * @route POST /comments/:commentId/replies
 * @desc Add a reply to a comment
 * @access Private
 */
router.post(
    '/:commentId/replies',
    expressAuthenticate,
    addReplyValidation,
    validateRequest,
    wrapHandler(documentController.addCommentReply)
);

/**
 * @route PUT /comments/:commentId
 * @desc Update a comment
 * @access Private
 */
router.put(
    '/:commentId',
    expressAuthenticate,
    updateCommentValidation,
    validateRequest,
    wrapHandler(documentController.updateComment)
);

/**
 * @route DELETE /comments/:commentId
 * @desc Delete a comment
 * @access Private
 */
router.delete(
    '/:commentId',
    expressAuthenticate,
    commentIdValidation,
    validateRequest,
    wrapHandler(documentController.deleteComment)
);

/**
 * @route PATCH /comments/:commentId/resolve
 * @desc Toggle comment resolution status
 * @access Private
 */
router.patch(
    '/:commentId/resolve',
    expressAuthenticate,
    toggleResolutionValidation,
    validateRequest,
    wrapHandler(documentController.toggleCommentResolution)
);

export default router;