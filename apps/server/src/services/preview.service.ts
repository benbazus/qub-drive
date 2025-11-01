import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { spawn } from 'child_process';
import prisma from '../config/database.config';
import { logger } from '../config/logger';

const sharp = require('sharp');
const pdfParse = require('pdf-parse');

export interface ThumbnailOptions {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
}

export interface FileMetadata {
    dimensions?: { width: number; height: number };
    pages?: number;
    duration?: number;
    colorSpace?: string;
    hasTransparency?: boolean;
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
    modificationDate?: string;
}

export interface PreviewPermissionResult {
    allowed: boolean;
    message?: string;
}

class PreviewService {
    private readonly SUPPORTED_IMAGE_TYPES = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'image/bmp',
        'image/tiff'
    ];

    private readonly SUPPORTED_DOCUMENT_TYPES = [
        'application/pdf'
    ];

    /**
     * Check if a file type is supported for preview
     */
    public isPreviewSupported(mimeType: string | null, fileName: string): boolean {
        if (!mimeType) {
            // Try to determine from file extension
            const ext = path.extname(fileName).toLowerCase();
            const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'];
            const docExts = ['.pdf'];

            return imageExts.includes(ext) || docExts.includes(ext);
        }

        return this.SUPPORTED_IMAGE_TYPES.includes(mimeType) ||
            this.SUPPORTED_DOCUMENT_TYPES.includes(mimeType);
    }

    /**
     * Get the preview type for a file
     */
    public getPreviewType(mimeType: string | null, fileName: string): string {
        if (!mimeType) {
            const ext = path.extname(fileName).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'].includes(ext)) {
                return 'image';
            }
            if (ext === '.pdf') {
                return 'pdf';
            }
            return 'unsupported';
        }

        if (this.SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
            return 'image';
        }
        if (mimeType === 'application/pdf') {
            return 'pdf';
        }
        return 'unsupported';
    }

    /**
     * Validate if user has permission to preview a file
     */
    public async validatePreviewPermission(fileId: string, userId: string): Promise<PreviewPermissionResult> {
        try {
            const file = await prisma.file.findFirst({
                where: {
                    id: fileId,
                    isDeleted: false,
                },
                include: {
                    sharedFiles: {
                        where: {
                            isActive: true,
                            OR: [
                                { expiresAt: null },
                                { expiresAt: { gt: new Date() } }
                            ]
                        },
                        include: {
                            shareUsers: {
                                where: { userId }
                            }
                        }
                    }
                }
            });

            if (!file) {
                return { allowed: false, message: 'File not found' };
            }

            // User owns the file
            if (file.userId === userId) {
                return { allowed: true };
            }

            // Check shared access with VIEW permission or higher
            const hasSharedAccess = file.sharedFiles.some((sharedFile: { shareUsers: string | any[]; }) =>
                sharedFile.shareUsers.length > 0
            );

            if (hasSharedAccess) {
                return { allowed: true };
            }

            return { allowed: false, message: 'Access denied' };

        } catch (error) {
            logger.error('Error validating preview permission:', error);
            return { allowed: false, message: 'Permission validation failed' };
        }
    }

    /**
     * Generate a secure, time-limited preview URL
     */
    public async generatePreviewUrl(fileId: string, userId: string): Promise<string> {
        const timestamp = Date.now();
        const expiresAt = timestamp + (60 * 60 * 1000); // 1 hour expiry

        // Create a signed URL
        const payload = `${fileId}:${userId}:${expiresAt}`;
        const signature = crypto.createHmac('sha256', process.env.JWT_SECRET || 'default-secret')
            .update(payload)
            .digest('hex');

        const baseUrl = process.env.SERVER_URL || 'http://localhost:8080';
        return `${baseUrl}/api/files/${fileId}/preview-content?token=${signature}&expires=${expiresAt}`;
    }

    /**
     * Get comprehensive file metadata for preview
     */
    public async getFileMetadata(filePath: string, mimeType: string | null): Promise<FileMetadata> {
        const metadata: FileMetadata = {};

        try {
            // Handle images
            if (mimeType?.startsWith('image/')) {
                try {
                    const imageInfo = await sharp(filePath).metadata();
                    metadata.dimensions = {
                        width: imageInfo.width || 0,
                        height: imageInfo.height || 0
                    };
                    metadata.hasTransparency = imageInfo.hasAlpha;
                    metadata.colorSpace = imageInfo.space;
                } catch (error) {
                    logger.warn('Failed to get image metadata:', error);
                }
            }

            // Handle PDFs
            if (mimeType === 'application/pdf') {
                try {
                    const dataBuffer = await fs.readFile(filePath);
                    const pdfData = await pdfParse(dataBuffer);

                    metadata.pages = pdfData.numpages;
                    metadata.title = pdfData.info?.Title;
                    metadata.author = pdfData.info?.Author;
                    metadata.subject = pdfData.info?.Subject;
                    metadata.creator = pdfData.info?.Creator;
                    metadata.producer = pdfData.info?.Producer;
                    metadata.creationDate = pdfData.info?.CreationDate;
                    metadata.modificationDate = pdfData.info?.ModDate;
                } catch (error) {
                    logger.warn('Failed to parse PDF metadata:', error);
                    metadata.pages = 1; // Default fallback
                }
            }

        } catch (error) {
            logger.warn('Failed to get file metadata:', error);
        }

        return metadata;
    }

    /**
     * Generate thumbnail for a file
     */
    public async generateThumbnail(
        filePath: string,
        outputPath: string,
        mimeType: string | null,
        options: ThumbnailOptions = {}
    ): Promise<void> {
        const { width = 200, height = 200, quality = 80, format = 'jpeg' } = options;

        // Ensure output directory exists
        await fs.mkdir(path.dirname(outputPath), { recursive: true });

        if (mimeType?.startsWith('image/')) {
            await this.generateImageThumbnail(filePath, outputPath, width, height, quality);
        } else if (mimeType === 'application/pdf') {
            await this.generatePDFThumbnail(filePath, outputPath, width, height, quality);
        } else {
            await this.generateGenericThumbnail(mimeType || 'unknown', outputPath, width, height);
        }
    }

    /**
     * Generate thumbnail for image files
     */
    private async generateImageThumbnail(
        inputPath: string,
        outputPath: string,
        width: number,
        height: number,
        quality: number
    ): Promise<void> {
        try {
            const image = sharp(inputPath);
            const metadata = await image.metadata();

            await image
                .rotate() // Auto-rotate based on EXIF orientation
                .resize(width, height, {
                    fit: 'inside',
                    withoutEnlargement: true,
                    background: { r: 255, g: 255, b: 255, alpha: 1 }
                })
                .jpeg({
                    quality,
                    progressive: true
                })
                .toFile(outputPath);

            logger.info(`Image thumbnail generated: ${outputPath} (${metadata.width}x${metadata.height} -> ${width}x${height})`);
        } catch (error) {
            logger.error('Error generating image thumbnail:', error);
            throw new Error('Failed to generate image thumbnail');
        }
    }

    /**
     * Generate thumbnail for PDF files (first page)
     */
    private async generatePDFThumbnail(
        inputPath: string,
        outputPath: string,
        width: number,
        height: number,
        quality: number
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const convert = spawn('magick', [
                `${inputPath}[0]`, // First page only
                '-thumbnail', `${width}x${height}`,
                '-background', 'white',
                '-alpha', 'remove',
                '-quality', quality.toString(),
                '-density', '150',
                '-strip',
                outputPath
            ]);

            convert.on('close', (code) => {
                if (code === 0) {
                    logger.info(`PDF thumbnail generated: ${outputPath}`);
                    resolve();
                } else {
                    logger.error(`PDF thumbnail generation failed with code ${code}`);
                    reject(new Error(`PDF thumbnail generation failed with code ${code}`));
                }
            });

            convert.on('error', (error) => {
                logger.error('PDF thumbnail generation error:', error);
                reject(error);
            });
        });
    }

    /**
     * Generate generic thumbnail for unsupported file types
     */
    private async generateGenericThumbnail(
        fileType: string,
        outputPath: string,
        width: number,
        height: number
    ): Promise<void> {
        try {
            // Determine color and text based on file type
            let color = '#6c757d'; // Default gray
            let text = 'FILE';

            if (fileType.includes('pdf')) {
                color = '#dc3545'; // Red for PDF
                text = 'PDF';
            } else if (fileType.includes('image')) {
                color = '#28a745'; // Green for images
                text = 'IMG';
            } else if (fileType.includes('video')) {
                color = '#007bff'; // Blue for videos
                text = 'VID';
            } else if (fileType.includes('audio')) {
                color = '#ffc107'; // Yellow for audio
                text = 'AUD';
            }

            // Create SVG thumbnail
            const svg = `
                <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                    <rect width="${width}" height="${height}" fill="${color}"/>
                    <text x="${width / 2}" y="${height / 2 + 6}" text-anchor="middle" fill="white" 
                          font-family="Arial, sans-serif" font-size="16" font-weight="bold">${text}</text>
                </svg>
            `;

            await sharp(Buffer.from(svg))
                .jpeg({ quality: 80 })
                .toFile(outputPath);

            logger.info(`Generic thumbnail generated: ${outputPath} (${fileType})`);
        } catch (error) {
            logger.error('Error generating generic thumbnail:', error);
            throw new Error('Failed to generate generic thumbnail');
        }
    }

    /**
     * Check if thumbnail exists for a file
     */
    public async hasThumbnail(fileId: string, userId: string): Promise<boolean> {
        try {
            const systemSettings = await prisma.systemSettings.findFirst({
                where: { id: 1 },
            });
            const UPLOAD_DIR = systemSettings?.defaultStoragePath || "./Uploads";
            const thumbnailDir = path.join(UPLOAD_DIR, userId, 'thumbnails');
            const thumbnailPath = path.join(thumbnailDir, `${fileId}.jpg`);

            await fs.access(thumbnailPath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get thumbnail path for a file
     */
    public async getThumbnailPath(fileId: string, userId: string): Promise<string> {
        const systemSettings = await prisma.systemSettings.findFirst({
            where: { id: 1 },
        });
        const UPLOAD_DIR = systemSettings?.defaultStoragePath || "./Uploads";
        const thumbnailDir = path.join(UPLOAD_DIR, userId, 'thumbnails');

        // Ensure directory exists
        await fs.mkdir(thumbnailDir, { recursive: true });

        return path.join(thumbnailDir, `${fileId}.jpg`);
    }
}

const previewService = new PreviewService();
export default previewService;