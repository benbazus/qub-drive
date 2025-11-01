import { Router, Request, Response, NextFunction } from 'express';
import { spreadsheetController } from '../controllers/spreadsheet.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

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

// Get spreadsheet by token
router.get('/:token', expressAuthenticate, spreadsheetController.getSpreadsheet.bind(spreadsheetController));

// Create or update spreadsheet
router.post('/:token', expressAuthenticate, spreadsheetController.createOrUpdateSpreadsheet.bind(spreadsheetController));

// Update spreadsheet
router.put('/:token', expressAuthenticate, spreadsheetController.updateSpreadsheet.bind(spreadsheetController));

// Grant access to user
router.post('/:token/access', expressAuthenticate, spreadsheetController.grantAccess.bind(spreadsheetController));

// Revoke access from user
router.delete('/:token/access/:userId', expressAuthenticate, spreadsheetController.revokeAccess.bind(spreadsheetController));

// Get spreadsheet versions
router.get('/:token/versions', expressAuthenticate, spreadsheetController.getVersions.bind(spreadsheetController));

// Get spreadsheet collaborators
router.get('/:token/collaborators', expressAuthenticate, spreadsheetController.getCollaborators.bind(spreadsheetController));

// Delete spreadsheet
router.delete('/:token', expressAuthenticate, spreadsheetController.deleteSpreadsheet.bind(spreadsheetController));

export default router;