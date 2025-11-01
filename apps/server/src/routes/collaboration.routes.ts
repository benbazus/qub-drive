import collaborationController from '../controllers/collaboration.controller';
import { authenticate } from '../middleware/auth.middleware';
import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

// Apply authentication middleware to all routes
router.use(async (req: Request, res: Response, next: NextFunction) => {
    const isAuthenticated = await authenticate(req as any, res as any);
    if (isAuthenticated) {
        next();
    }
});

// Global error handler middleware
const errorHandler = (error: any, req: any, res: any, next: any) => {
    console.error('Unhandled route error:', error);
    if (!res.headersSent) {
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message || 'An unexpected error occurred',
            timestamp: new Date().toISOString()
        });
    }
};

const wrapHandler = (controllerMethod: any) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await controllerMethod(req, res);
        } catch (error) {
            next(error);
        }
    };
};



// Document routes
router.get('/documents/:documentId', wrapHandler(collaborationController.getDocumentInfo));
router.get('/documents/:documentId/content', wrapHandler(collaborationController.getDocumentContent));
router.post('/documents/:documentId/save', wrapHandler(collaborationController.saveDocument));
router.post('/documents', wrapHandler(collaborationController.createDocument));
router.post("/forgot-password/step-one", wrapHandler(collaborationController.createDocument));
// User documents
router.get('/users/:userId/documents', wrapHandler(collaborationController.getUserDocuments));

// Collaboration routes
router.post('/documents/:documentId/share', wrapHandler(collaborationController.shareDocument));
router.get('/documents/:documentId/collaborators', wrapHandler(collaborationController.getCollaborators));
router.put('/documents/:documentId/collaborators/:collaboratorUserId/permissions', wrapHandler(collaborationController.updatePermissions));
router.delete('/documents/:documentId/collaborators/:collaboratorUserId', wrapHandler(collaborationController.removeCollaborator));

// Comment routes
router.post('/documents/:documentId/comments', wrapHandler(collaborationController.addComment));
router.get('/documents/:documentId/comments', wrapHandler(collaborationController.getComments));
router.put('/documents/:documentId/comments/:commentId', wrapHandler(collaborationController.updateComment));
router.delete('/documents/:documentId/comments/:commentId', wrapHandler(collaborationController.deleteComment));
router.patch('/documents/:documentId/comments/:commentId/resolve', wrapHandler(collaborationController.toggleCommentResolution));
router.post('/documents/:documentId/comments/:commentId/replies', wrapHandler(collaborationController.addCommentReply));

// Apply error handler middleware
router.use(errorHandler);

export default router;