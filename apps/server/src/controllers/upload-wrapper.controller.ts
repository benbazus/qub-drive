// import { IncomingMessage, ServerResponse } from 'node:http';
// import { FileUploadHandler } from './upload.controller';
// import { AuthenticatedRequest } from '../middleware/auth.middleware';

// interface FileUploadConfig {
//     maxFileSize: number;
//     maxFiles: number;
//     allowedMimeTypes: string[];
//     allowedExtensions: string[];
//     virusScanEnabled: boolean;
//     compressionEnabled: boolean;
//     encryptionEnabled: boolean;
// }

// export class UploadController {
//     private fileUploadHandler: FileUploadHandler;

//     constructor() {
//         // Default configuration - can be made configurable via environment variables
//         const config: FileUploadConfig = {
//             maxFileSize: 100 * 1024 * 1024, // 100MB
//             maxFiles: 10,
//             allowedMimeTypes: [
//                 'image/jpeg', 'image/png', 'image/gif', 'image/webp',
//                 'application/pdf', 'text/plain', 'text/csv',
//                 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//                 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//                 'application/zip', 'application/x-zip-compressed'
//             ],
//             allowedExtensions: [
//                 '.jpg', '.jpeg', '.png', '.gif', '.webp',
//                 '.pdf', '.txt', '.csv', '.xls', '.xlsx',
//                 '.doc', '.docx', '.zip'
//             ],
//             virusScanEnabled: false, // Can be enabled in production
//             compressionEnabled: true,
//             encryptionEnabled: false // Can be enabled for sensitive files
//         };

//         this.fileUploadHandler = new FileUploadHandler(config);
//     }

//     async uploadSingleFile(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
//         try {

//             // Convert ServerResponse to Express Response-like object
//             const expressRes = this.convertToExpressResponse(res);

//             // Create next function for error handling
//             const next = (error?: any) => {
//                 if (error) {
//                     console.error('Upload error:', error);
//                     if (!res.headersSent) {
//                         res.writeHead(500, { 'Content-Type': 'application/json' });
//                         res.end(JSON.stringify({
//                             success: false,
//                             message: 'Upload failed',
//                             error: error.message
//                         }));
//                     }
//                 }
//             };

//             await this.fileUploadHandler.uploadSingleFile(req, expressRes, next);
//         } catch (error) {
//             console.error('Upload controller error:', error);
//             if (!res.headersSent) {
//                 res.writeHead(500, { 'Content-Type': 'application/json' });
//                 res.end(JSON.stringify({
//                     success: false,
//                     message: 'Internal server error',
//                     error: error instanceof Error ? error.message : 'Unknown error'
//                 }));
//             }
//         }
//     }

//     async getUploadProgress(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
//         try {
//             const url = new URL(req.url!, `http://${req.headers.host}`);
//             const uploadId = url.searchParams.get('uploadId');

//             if (!uploadId) {
//                 res.writeHead(400, { 'Content-Type': 'application/json' });
//                 res.end(JSON.stringify({
//                     success: false,
//                     message: 'Upload ID is required'
//                 }));
//                 return;
//             }

//             const progress = this.fileUploadHandler.getUploadProgress(uploadId);

//             if (!progress) {
//                 res.writeHead(404, { 'Content-Type': 'application/json' });
//                 res.end(JSON.stringify({
//                     success: false,
//                     message: 'Upload not found'
//                 }));
//                 return;
//             }

//             res.writeHead(200, { 'Content-Type': 'application/json' });
//             res.end(JSON.stringify({
//                 success: true,
//                 data: {
//                     uploadId,
//                     progress: {
//                         bytesReceived: progress.bytesReceived,
//                         totalBytes: progress.totalBytes,
//                         percentage: progress.totalBytes > 0 ? (progress.bytesReceived / progress.totalBytes) * 100 : 0,
//                         fileName: progress.fileName,
//                         startTime: progress.startTime,
//                         duration: Date.now() - progress.startTime
//                     }
//                 }
//             }));
//         } catch (error) {
//             console.error('Get upload progress error:', error);
//             if (!res.headersSent) {
//                 res.writeHead(500, { 'Content-Type': 'application/json' });
//                 res.end(JSON.stringify({
//                     success: false,
//                     message: 'Internal server error',
//                     error: error instanceof Error ? error.message : 'Unknown error'
//                 }));
//             }
//         }
//     }

//     async cancelUpload(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
//         try {
//             const url = new URL(req.url!, `http://${req.headers.host}`);
//             const uploadId = url.searchParams.get('uploadId');

//             if (!uploadId) {
//                 res.writeHead(400, { 'Content-Type': 'application/json' });
//                 res.end(JSON.stringify({
//                     success: false,
//                     message: 'Upload ID is required'
//                 }));
//                 return;
//             }

//             this.fileUploadHandler.cancelUpload(uploadId);

//             res.writeHead(200, { 'Content-Type': 'application/json' });
//             res.end(JSON.stringify({
//                 success: true,
//                 message: 'Upload cancelled successfully'
//             }));
//         } catch (error) {
//             console.error('Cancel upload error:', error);
//             if (!res.headersSent) {
//                 res.writeHead(500, { 'Content-Type': 'application/json' });
//                 res.end(JSON.stringify({
//                     success: false,
//                     message: 'Internal server error',
//                     error: error instanceof Error ? error.message : 'Unknown error'
//                 }));
//             }
//         }
//     }

//     private convertToExpressResponse(res: ServerResponse): any {
//         return {
//             status: (code: number) => ({
//                 json: (data: any) => {
//                     res.writeHead(code, { 'Content-Type': 'application/json' });
//                     res.end(JSON.stringify(data));
//                 }
//             }),
//             json: (data: any) => {
//                 res.writeHead(200, { 'Content-Type': 'application/json' });
//                 res.end(JSON.stringify(data));
//             },
//             writeHead: res.writeHead.bind(res),
//             end: res.end.bind(res),
//             headersSent: res.headersSent
//         };
//     }
// }

import { IncomingMessage, ServerResponse } from 'node:http';
import { FileUploadHandler } from './upload.controller';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

interface FileUploadConfig {
    maxFileSize: number;
    maxFiles: number;
    allowedMimeTypes: string[];
    allowedExtensions: string[];
    virusScanEnabled: boolean;
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
}

export class UploadController {
    private fileUploadHandler: FileUploadHandler;

    constructor() {
        // Default configuration - can be made configurable via environment variables
        const config: FileUploadConfig = {
            maxFileSize: 100 * 1024 * 1024, // 100MB
            maxFiles: 10,
           allowedMimeTypes: [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'application/x-zip-compressed',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/x-7z-compressed',
  'application/rtf',
  'audio/mpeg',
  'audio/wav',
  'audio/aac',
  'audio/flac',
  'audio/ogg',
  'video/mp4',
  'video/x-msvideo',
  'video/quicktime',
  'video/x-ms-wmv',
  'video/x-flv',
  'video/webm'
],

allowedExtensions: [
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.pdf', '.txt', '.csv', '.xls', '.xlsx',
  '.doc', '.docx', '.zip', '.7z',
  '.3gp', '.exe', '.vsix', '.html', '.htm',
  '.woff', '.ppt', '.pptx', '.rtf', '.bmp',
  '.svg', '.mp4', '.avi', '.mov', '.wmv',
  '.flv', '.webm', '.mp3', '.wav', '.aac',
  '.flac', '.ogg', '.apk', '.psd'
],

            virusScanEnabled: false, // Can be enabled in production
            compressionEnabled: true,
            encryptionEnabled: false // Can be enabled for sensitive files
        };

        this.fileUploadHandler = new FileUploadHandler(config);
    }

    async uploadSingleFile(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
        try {
            // Convert ServerResponse to Express Response-like object
            const expressRes = this.convertToExpressResponse(res);

            // Create next function for error handling
            const next = (error?: any) => {
                if (error) {
                    console.error('Upload error:', error);
                    if (!res.headersSent) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: false,
                            message: 'Upload failed',
                            error: error.message
                        }));
                    }
                }
            };

            await this.fileUploadHandler.uploadSingleFile(req, expressRes, next);
        } catch (error) {
            console.error('Upload controller error:', error);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: 'Internal server error',
                    error: error instanceof Error ? error.message : 'Unknown error'
                }));
            }
        }
    }

    async getUploadProgress(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
        try {
            const url = new URL(req.url!, `http://${req.headers.host}`);
            const uploadId = url.searchParams.get('uploadId');

            if (!uploadId) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: 'Upload ID is required'
                }));
                return;
            }

            const progress = this.fileUploadHandler.getUploadProgress(uploadId);

            if (!progress) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: 'Upload not found'
                }));
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                data: {
                    uploadId,
                    progress: {
                        bytesReceived: progress.bytesReceived,
                        totalBytes: progress.totalBytes,
                        percentage: progress.totalBytes > 0 ? (progress.bytesReceived / progress.totalBytes) * 100 : 0,
                        fileName: progress.fileName,
                        startTime: progress.startTime,
                        duration: Date.now() - progress.startTime
                    }
                }
            }));
        } catch (error) {
            console.error('Get upload progress error:', error);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: 'Internal server error',
                    error: error instanceof Error ? error.message : 'Unknown error'
                }));
            }
        }
    }

    async cancelUpload(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
        try {
            const url = new URL(req.url!, `http://${req.headers.host}`);
            const uploadId = url.searchParams.get('uploadId');

            if (!uploadId) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: 'Upload ID is required'
                }));
                return;
            }

            this.fileUploadHandler.cancelUpload(uploadId);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Upload cancelled successfully'
            }));
        } catch (error) {
            console.error('Cancel upload error:', error);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: 'Internal server error',
                    error: error instanceof Error ? error.message : 'Unknown error'
                }));
            }
        }
    }

    private convertToExpressResponse(res: ServerResponse): any {
        return {
            status: (code: number) => ({
                json: (data: any) => {
                    res.writeHead(code, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(data));
                }
            }),
            json: (data: any) => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data));
            },
            writeHead: res.writeHead.bind(res),
            end: res.end.bind(res),
            headersSent: res.headersSent
        };
    }
}