
import e, { Request, Response } from 'express';
import { StorageService } from '../services/storage.service';
import path from 'path';
import { CreateTransferDTO } from '@/types/transfer';
import { TransferService } from '@/services/transfer.service';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';

export class TransferController {
    private transferService: TransferService;
    private storageService: StorageService;

    constructor() {
        this.transferService = new TransferService();
        this.storageService = new StorageService();
    }

    createTransfer = async (req: AuthenticatedRequest, res: Response) => {
        try {

            const clientOrigin = req.get("origin") || req.get("referer");



            const userId = 'a83edaba-db41-4456-867f-5ea06c3c2471';// (req as any).user?.userId;

            console.log(" ###################### ")
            console.log(clientOrigin)
            console.log((req as any).user?.userId)
            console.log(" ###################### ")

            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });

            }
            const files = req.files as Express.Multer.File[];

            if (!files || files.length === 0) {
                return res.status(400).json({ error: 'No files provided' });
            }

            const dto: CreateTransferDTO = {
                userId,
                clientOrigin,
                shareLink: req.body.shareLink,
                title: req.body.title,
                message: req.body.message,
                senderEmail: req.body.senderEmail,
                recipientEmail: req.body.recipientEmail,
                password: req.body.password,
                expirationDays: parseInt(req.body.expirationDays) || 7,
                downloadLimit: req.body.downloadLimit ? parseInt(req.body.downloadLimit) : undefined,
                trackingEnabled: req.body.trackingEnabled === 'true',
            };

            const uploadedFiles = files.map(file => ({
                fileName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype,
                buffer: file.buffer,
            }));

            const result = await this.transferService.createTransfer(dto, uploadedFiles);

            console.log(" @@@@@@@@  R E S P O N S E @@@@@@@@@@@ ")
            console.log(result)
            console.log(" @@@@@@@@  R E S P O N S E @@@@@@@@@@@ ")

            return res.status(201).json({
                success: true,
                data: result,
            });
        } catch (error) {
            console.error('Create transfer error:', error);
            return res.status(500).json({
                success: false,
                data: null,
                error: 'Failed to create transfer'
            });
        }
    };

    getTransfer = async (req: Request, res: Response) => {
        try {

            //  const currentUrl = req.protocol + '://' + req.get('host')
            // const fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;
            //  const clientOrigin = req.get("origin") || req.get("referer");

            // console.log("Full URL accessed:", fullUrl);
            // console.log("Client Origin:", clientOrigin);


            // console.log(" ###################### ")
            // console.log(fullUrl)
            // console.log(clientOrigin)
            // console.log(currentUrl)
            // console.log(" ###################### ")
            const { shareLink } = req.params;

            console.log(" %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% ")
            console.log(shareLink)
            console.log(" %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% ")

            const transfer = await this.transferService.getTransferByShareLink(shareLink);

            res.json({
                success: true,
                data: {
                    id: transfer.id,
                    title: transfer.title,
                    message: transfer.message,
                    senderEmail: transfer.senderEmail,
                    expirationDate: transfer.expirationDate,
                    hasPassword: !!transfer.password,
                    downloadLimit: transfer.downloadLimit,
                    totalSize: Number(transfer.totalSize),
                    files: transfer.files.map(f => ({
                        id: f.id,
                        fileName: f.fileName,
                        fileSize: Number(f.fileSize),
                        mimeType: f.mimeType,
                    })),
                },
            });
        } catch (error: any) {
            res.status(404).json({
                success: false,
                data: null,
                error: error.message || 'Transfer not found'
            });
        }
    };

    getTransferFiles = async (req: Request, res: Response) => {
        try {
            const { shareLink } = req.params;
            const { password } = req.body;

            const result = await this.transferService.getTransferFiles(shareLink, password);

            res.json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                data: null,
                error: error.message || 'Failed to get transfer files'
            });
        }
    };


    downloadFile = async (req: Request, res: Response) => {
        try {
            const { shareLink, fileId } = req.params;
            // Explicitly type query parameter as it can be undefined
            const password = req.query.password as string | undefined;

            const fileData = await this.transferService.getFileForDownload(
                fileId,
                shareLink,
                password
            );


            if (!fileData) {
                res.status(404).json({
                    success: false,
                    data: null,
                    error: 'File not found or access denied.'
                });
            }


            try {
                // Use req.socket.remoteAddress (req.connection is deprecated)
                const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
                // Also handle potentially undefined user-agent
                const userAgent = req.headers['user-agent'] || 'unknown';
                await this.transferService.recordDownload(shareLink, ipAddress, userAgent);
            } catch (recordError) {
                // Log this failure but continue with the download
                console.error('Failed to record download:', recordError);
            }

            res.setHeader('Content-Type', fileData.mimeType || 'application/octet-stream');
            res.setHeader('Content-Length', String(fileData.fileSize));

            // Fallback for older browsers (e.g., replace quotes)
            const safeFileName = fileData.fileName.replace(/"/g, '_');
            // Modern browser support for non-ASCII names (RFC 5987)
            const encodedFileName = encodeURIComponent(fileData.fileName);
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`
            );

            const stream = this.storageService.createReadStream(fileData.filePath);

            stream.on('error', (streamError) => {
                console.error('Stream error:', streamError);
                if (!res.headersSent) {
                    // Send a specific error if we haven't started streaming
                    res.status(500).json({
                        success: false,
                        data: null,
                        error: 'Failed to stream file.'
                    });
                } else {
                    // If headers are sent, we can't send JSON. Just end the response.
                    res.end();
                }
            });

            // Handle client disconnection
            res.on('close', () => {
                stream.destroy(); // Stop reading from storage
            });

            // Start streaming
            stream.pipe(res);

        } catch (error: any) {
            console.error('Download error:', error);


            let statusCode = 500;
            let errorMessage = 'Failed to download file due to an internal error.';


            const lowerError = String(error.message || '').toLowerCase();

            if (lowerError.includes('password') || lowerError.includes('denied')) {
                statusCode = 403; // Forbidden
                errorMessage = error.message;
            } else if (lowerError.includes('not found') || lowerError.includes('invalid')) {
                statusCode = 404; // Not Found
                errorMessage = error.message;
            } else if (error.name === 'ValidationError') {
                statusCode = 400; // Bad Request
                errorMessage = error.message;
            }

            if (!res.headersSent) {
                res.status(statusCode).json({
                    success: false,
                    data: null,
                    error: errorMessage
                });
                return;
            }
        }
    };

    downloadFileV1 = async (req: Request, res: Response) => {
        try {
            const { shareLink, fileId } = req.params;
            const { password } = req.query;

            const fileData = await this.transferService.getFileForDownload(
                fileId,
                shareLink,
                password as string
            );


            console.log(" 000000000 FAIL TO DOOWNLOAD 00000000000000000000 ")
            console.log(shareLink)
            console.log(fileId)
            console.log(fileData)
            console.log(password)
            console.log(" 000000000 FAIL TO DOOWNLOAD 00000000000000000000 ")

            // Record download for tracking
            const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'];
            await this.transferService.recordDownload(shareLink, ipAddress, userAgent);


            // Set headers for file download
            res.setHeader('Content-Type', fileData?.mimeType!);
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileData.fileName)}"`);
            res.setHeader('Content-Length', fileData.fileSize);

            // Stream file to response
            const stream = this.storageService.createReadStream(fileData.filePath);
            stream.pipe(res);

            stream.on('error', (error) => {
                console.error('Stream error:', error);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        data: null,
                        error: 'Failed to download file'
                    });
                }
            });
        } catch (error: any) {


            console.error('Download error:', error);
            res.status(400).json({
                success: false,
                data: null,
                error: error.message || 'Failed to download file'
            });
        }
    };

    getDownloadStats = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { shareLink } = req.params;
            const stats = await this.transferService.getDownloadStats(shareLink);

            res.json({
                success: true,
                data: stats,
            });
        } catch (error: any) {
            res.status(404).json({
                success: false,
                data: null,
                error: error.message || 'Failed to get download stats'
            });
        }
    };
}
