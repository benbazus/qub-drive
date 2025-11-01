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

// Validation schemas
const shareDocumentEmailValidation = [
    param('documentId').isUUID().withMessage('Valid document ID is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('permission').isIn(['VIEW', 'COMMENT', 'EDIT']).withMessage('Permission must be VIEW, COMMENT, or EDIT'),
    body('message').optional().isString().withMessage('Message must be a string'),
    body('expiresAt').optional().isISO8601().withMessage('Expires at must be a valid ISO date'),
    body('notifyUser').optional().isBoolean().withMessage('Notify user must be a boolean')
];

const getActiveUsersValidation = [
    param('documentId').isUUID().withMessage('Valid document ID is required')
];

const inviteUserValidation = [
    param('documentId').isUUID().withMessage('Valid document ID is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('role').isIn(['editor', 'commenter', 'viewer']).withMessage('Role must be editor, commenter, or viewer'),
    body('message').optional().isString().withMessage('Message must be a string')
];

const changePermissionValidation = [
    param('documentId').isUUID().withMessage('Valid document ID is required'),
    param('userId').isUUID().withMessage('Valid user ID is required'),
    body('permission').isIn(['editor', 'commenter', 'viewer']).withMessage('Permission must be editor, commenter, or viewer')
];

const removeCollaboratorValidation = [
    param('documentId').isUUID().withMessage('Valid document ID is required'),
    param('userId').isUUID().withMessage('Valid user ID is required')
];

const linkAccessValidation = [
    param('documentId').isUUID().withMessage('Valid document ID is required'),
    body('linkAccess').isIn(['RESTRICTED', 'ANYONE_WITH_LINK', 'PUBLIC']).withMessage('Link access must be RESTRICTED, ANYONE_WITH_LINK, or PUBLIC'),
    body('allowComments').optional().isBoolean().withMessage('Allow comments must be a boolean'),
    body('allowDownload').optional().isBoolean().withMessage('Allow download must be a boolean')
];

// Comment validation schemas
const addCommentValidation = [
    param('documentId').isUUID().withMessage('Valid document ID is required'),
    body('content').notEmpty().withMessage('Comment content is required'),
    body('position').optional().isObject().withMessage('Position must be an object')
];

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

router.get('/:documentId', expressAuthenticate, wrapHandler(documentController.getDocumentInfo));

router.get('/:documentId/content', expressAuthenticate, wrapHandler(documentController.getDocumentContent));

router.post('/:documentId/save', expressAuthenticate, wrapHandler(documentController.saveDocument));

router.post(
    '/:documentId/share-email',
    expressAuthenticate,
    shareDocumentEmailValidation,
    validateRequest,
    wrapHandler(documentController.shareDocumentEmail)
);

/**
 * @route GET /documents/:documentId/active-users
 * @desc Get active users of a document
 * @access Private
 */
router.get(
    '/:documentId/active-users',
    expressAuthenticate,
    getActiveUsersValidation,
    validateRequest,
    wrapHandler(documentController.getDocumentActiveUsers)
);

/**
 * @route POST /documents/:documentId/invite
 * @desc Invite user to collaborate on document
 * @access Private
 */
router.post(
    '/:documentId/invite',
    expressAuthenticate,
    inviteUserValidation,
    validateRequest,
    wrapHandler(documentController.inviteUser)
);

/**
 * @route PUT /documents/:documentId/collaborators/:userId/permission
 * @desc Change collaborator permission
 * @access Private
 */
router.put(
    '/:documentId/collaborators/:userId/permission',
    expressAuthenticate,
    changePermissionValidation,
    validateRequest,
    wrapHandler(documentController.changePermission)
);

/**
 * @route DELETE /documents/:documentId/collaborators/:userId
 * @desc Remove collaborator from document
 * @access Private
 */
router.delete(
    '/:documentId/collaborators/:userId',
    expressAuthenticate,
    removeCollaboratorValidation,
    validateRequest,
    wrapHandler(documentController.removeCollaborator)
);

/**
 * @route GET /documents/:documentId/collaborators
 * @desc Get document collaborators
 * @access Private
 */
router.get(
    '/:documentId/collaborators',
    expressAuthenticate,
    getActiveUsersValidation,
    validateRequest,
    wrapHandler(documentController.getCollaborators)
);

/**
 * @route PUT /documents/:documentId/link-access
 * @desc Update document link access settings
 * @access Private
 */
router.put(
    '/:documentId/link-access',
    expressAuthenticate,
    linkAccessValidation,
    validateRequest,
    wrapHandler(documentController.updateLinkAccess)
);

/**
 * @route GET /documents/:documentId/link-access
 * @desc Get document link access settings
 * @access Private
 */
router.get(
    '/:documentId/link-access',
    expressAuthenticate,
    getActiveUsersValidation,
    validateRequest,
    wrapHandler(documentController.getLinkAccess)
);

// Comment routes
/**
 * @route GET /documents/:documentId/comments
 * @desc Get comments for a document
 * @access Private
 */
router.get(
    '/:documentId/comments',
    expressAuthenticate,
    getActiveUsersValidation,
    validateRequest,
    wrapHandler(documentController.getComments)
);

/**
 * @route POST /documents/:documentId/comments
 * @desc Add a comment to a document
 * @access Private
 */
router.post(
    '/:documentId/comments',
    expressAuthenticate,
    addCommentValidation,
    validateRequest,
    wrapHandler(documentController.addComment)
);


export default router;