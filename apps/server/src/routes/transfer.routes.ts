

import { Router } from 'express';
import multer from 'multer';
import { TransferController } from '../controllers/transfer.controller';
import { authenticate } from '@/middleware/auth.middleware';

const router = Router();
const controller = new TransferController();


// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '2147483648'), // 2GB
    },
});

router.post('/', upload.array('files', 100), controller.createTransfer);
router.get('/:shareLink', controller.getTransfer);
router.post('/:shareLink/files', controller.getTransferFiles);
router.post('/:shareLink/files/:fileId', controller.downloadFile);
router.get('/:shareLink/stats', controller.getDownloadStats);

export default router;