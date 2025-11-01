import fileController from '../controllers/file.controller';
import { shareController } from '../controllers/share.controller';
import { authenticate } from '../middleware/auth.middleware';
import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

// Wrapper function to convert Express handlers to match controller signatures
const wrapHandler = (controllerMethod: any) => {
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


router.get('/:fileId/delete-info', expressAuthenticate, wrapHandler(fileController.getDeleteInfo));

router.delete('/:fileId', expressAuthenticate, wrapHandler(fileController.deleteFile));

router.get('/folders/get-folders', expressAuthenticate, wrapHandler(fileController.getFolders));

router.post('/create-share-link', expressAuthenticate, wrapHandler(fileController.generateLinkShare));

//files/folders/get-folder-list


//  deleteInfo: (fileId: string) => `/files/${encodeURIComponent(fileId)}/delete-info`,
//    requestShareAccess: (shareToken: string) => `/files/share/${encodeURIComponent(shareToken)}/request-access`,
// downloadFile: (fileId: string) => `/files/${encodeURIComponent(fileId)}/download`,
router.post('/:fileId/download', expressAuthenticate, wrapHandler(fileController.downloadFile));
router.get('/:fileId/download', expressAuthenticate, wrapHandler(fileController.downloadFile));
router.post('/share/:shareToken/request-access', expressAuthenticate, wrapHandler(fileController.requestAccess));
router.get('/:token/get-shared-file', wrapHandler(fileController.getSharedFile));
router.get('/:fileId/details', expressAuthenticate, wrapHandler(fileController.getFileDetails));
router.get('/:fileId/content', expressAuthenticate, wrapHandler(fileController.getFileContent));
router.get('/:fileId/download-info', expressAuthenticate, wrapHandler(fileController.getDownloadInfo));
router.post('/:fileId/rename', expressAuthenticate, wrapHandler(fileController.renameFile));

router.get('/list', expressAuthenticate, wrapHandler(fileController.getFileList));
router.get('/:fileId', expressAuthenticate, wrapHandler(fileController.getFileList));
router.post('/v1/create-folder', expressAuthenticate, wrapHandler(fileController.createFolder));

//router.patch('/:fileId/rename', expressAuthenticate, wrapHandler(fileController.renameFile));
router.post('/:fileId/make-copy', expressAuthenticate, wrapHandler(fileController.copyFile));
router.post('/:fileId/lock', expressAuthenticate, wrapHandler(fileController.toggleLock));
router.post('/:fileId/star', expressAuthenticate, wrapHandler(fileController.toggleStar));
router.post('/:fileId/move-file', expressAuthenticate, wrapHandler(fileController.moveFile));

// Folder operations
router.get('/folders/get-folder-list', expressAuthenticate, wrapHandler(fileController.getFolders));

// Share operations

router.post('/:fileId/share', expressAuthenticate, wrapHandler(fileController.shareFile));
router.get('/:fileId/shares', expressAuthenticate, wrapHandler(fileController.getFileShares));
router.get('/shares/with-me', expressAuthenticate, wrapHandler(fileController.getSharedWithMe));
router.get('/shares/my-shares', expressAuthenticate, wrapHandler(fileController.getMyShares));
router.patch('/shares/:shareId', expressAuthenticate, wrapHandler(fileController.updateSharePermission));
router.delete('/shares/:shareId', expressAuthenticate, wrapHandler(fileController.revokeShare));

// Preview endpoints
router.get('/:fileId/preview', expressAuthenticate, wrapHandler(fileController.getFilePreview));
router.get('/:fileId/preview-thumbnail', expressAuthenticate, wrapHandler(fileController.getPreviewThumbnail));
router.get('/:fileId/preview-content', expressAuthenticate, wrapHandler(fileController.getPreviewContent));

// Dashboard and stats
router.get('/thumbnail', expressAuthenticate, wrapHandler(fileController.getThumbnail));
router.get('/dashboard/stats', expressAuthenticate, wrapHandler(fileController.getDashboardStats));
router.get('/user-stats', expressAuthenticate, wrapHandler(fileController.getDashboardStats));

// Approval management
router.get('/approvals/my-requests', expressAuthenticate, wrapHandler(fileController.getMyApprovalRequests));
router.get('/approvals/pending', expressAuthenticate, wrapHandler(fileController.getPendingApprovals));
router.get('/approvals/:approvalId', expressAuthenticate, wrapHandler(fileController.getApprovalRequest));
router.post('/approvals/:approvalId/approve', expressAuthenticate, wrapHandler(fileController.approveRequest));
router.post('/approvals/:approvalId/reject', expressAuthenticate, wrapHandler(fileController.rejectRequest));
router.post('/approvals/:approvalId/:action', expressAuthenticate, wrapHandler(fileController.handleApproval));

// Public routes (no auth required)
router.get('/public/shares/:shareToken', wrapHandler(fileController.getPublicShare));

router.get('/public/shares/:shareToken/approval-status', expressAuthenticate, wrapHandler(fileController.getApprovalStatus));

// Share-specific routes

router.post('/share/:shareToken/verify-password', wrapHandler(shareController.getSharedContent));
//router.post('/share/:shareToken/request-access', wrapHandler(shareController.requestShareAccess));
router.get('/share/:shareToken/download', wrapHandler(shareController.downloadSharedFile));


export default router;


