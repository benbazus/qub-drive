// import { Response, NextFunction } from 'express';
// import Busboy from "busboy";
// import { createWriteStream, promises as fs } from 'fs';
// import { pipeline } from 'stream/promises';
// import path from 'path';
// import { randomUUID } from 'crypto';


// import { createHash } from 'crypto';

// import { FileType } from '@prisma/client';
// import { prisma } from '../config/database.config';
// import { AuthenticatedRequest } from '../middleware/auth.middleware';
// import { getFileType } from '../utils/file.utils';



// interface FileUploadConfig {
//     maxFileSize: number;
//     maxFiles: number;
//     allowedMimeTypes: string[];
//     allowedExtensions: string[];
//     virusScanEnabled: boolean;
//     compressionEnabled: boolean;
//     encryptionEnabled: boolean;
// }

// interface UploadProgress {
//     bytesReceived: number;
//     totalBytes: number;
//     startTime: number;
//     fileName: string;
// }

// type CompressionAlgorithm = 'gzip' | 'deflate' | 'brotli';

// interface CompressionConfig {
//     shouldCompress: boolean;
//     algorithm: CompressionAlgorithm;
//     level: number;
// }

// interface CompressionInfo {
//     isCompressed: boolean;
//     compressionAlgorithm: string;
//     originalSize: number;
//     compressedSize: number;
//     compressionRatio: number;
//     compressedAt: Date;
// }

// interface CompressionHeader {
//     version: number;
//     algorithm: CompressionAlgorithm;
//     level: number;
//     originalSize: number;
//     timestamp: number;
// }

// export class FileUploadHandler {
//     private readonly config: FileUploadConfig;
//     private readonly uploadTimeouts = new Map<string, NodeJS.Timeout>();
//     private readonly activeUploads = new Map<string, UploadProgress>();

//     constructor(config: FileUploadConfig) {
//         this.config = config;
//     }

//     private handleError(res: Response, error: Error, message: string = 'Internal server error', statusCode: number = 500): Error {
//         console.error(`FileUploadHandler Error [${statusCode}]:`, error.message);
//         res.status(statusCode).json({
//             success: false,
//             message,
//             error: error.message
//         });
//         return error;
//     }

//     public uploadSingleFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
//         const uploadId = randomUUID();
//         const startTime = Date.now();

//         try {
//             const userId = req.user?.userId;

//             if (!userId) {
//                 return next(this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401));
//             }

//             // Set upload timeout
//             const timeout = setTimeout(() => {
//                 this.cleanupUpload(uploadId);
//                 return next(this.handleError(res, new Error('Upload timeout'), 'Upload timeout', 408));

//             }, 30 * 60 * 1000); // 30 minutes

//             this.uploadTimeouts.set(uploadId, timeout);

//             // Validate request headers and content
//             await this._validateUploadRequest(req, res);

//             const busboy = Busboy({
//                 headers: req.headers,
//                 limits: {
//                     fileSize: this.config.maxFileSize,
//                     files: this.config.maxFiles,
//                     fields: 10,
//                     fieldSize: 1024 * 1024 // 1MB field size limit
//                 }
//             });

//             const fields: Record<string, string> = {};
//             let tempFilePath: string | null = null;
//             let originalFilename: string | null = null;
//             let mimeType: string | null = null;
//             let fileSize = 0;
//             let fileHash: string | null = null;
//             let uploadAborted = false;

//             // Handle form fields
//             busboy.on("field", (name, val, info) => {
//                 if (info.valueTruncated) {
//                     uploadAborted = true;
//                     return next(this.handleError(res, new Error('Field size limit exceeded'), 'Field too large', 413));

//                 }
//                 fields[name] = val;
//             });

//             // Handle file upload
//             busboy.on("file", async (_fieldname, file, info) => {


//                 try {
//                     if (uploadAborted) {
//                         file.resume();
//                         return;
//                     }

//                     if (!info.filename) {
//                         file.resume();
//                         return;
//                     }

//                     originalFilename = info.filename;
//                     mimeType = info.mimeType;

//                     // Validate file type early
//                     const extension = path.extname(originalFilename).toLowerCase();
//                     await this._validateFileType(mimeType, extension, res);

//                     // Initialize upload progress tracking
//                     this.activeUploads.set(uploadId, {
//                         bytesReceived: 0,
//                         totalBytes: 0,
//                         startTime,
//                         fileName: originalFilename
//                     });

//                     // Setup temp file path
//                     const { tempDir } = await this._setupTempDirectory(userId);
//                     tempFilePath = path.join(tempDir, `${uploadId}-${this._sanitizeFilename(originalFilename)}`);

//                     // Create write stream with error handling
//                     const writeStream = createWriteStream(tempFilePath, {
//                         flags: 'w',
//                         highWaterMark: 64 * 1024 // 64KB buffer
//                     });

//                     // Create hash stream for file integrity
//                     const hashStream = createHash('sha256');

//                     // Track upload progress and calculate hash
//                     file.on("data", (chunk: Buffer) => {
//                         fileSize += chunk.length;
//                         hashStream.update(chunk);

//                         // Update progress tracking
//                         const progress = this.activeUploads.get(uploadId);
//                         if (progress) {
//                             progress.bytesReceived = fileSize;
//                             this.activeUploads.set(uploadId, progress);
//                         }


//                         // Check file size limit during upload
//                         if (fileSize > this.config.maxFileSize) {
//                             uploadAborted = true;
//                             file.destroy();
//                             writeStream.destroy();
//                             return next(this.handleError(res, new Error('File size exceeds limit'), 'File too large', 413));
//                         }
//                     });

//                     file.on("error", (error: any) => {
//                         uploadAborted = true;
//                         writeStream.destroy();
//                         throw error;
//                     });

//                     writeStream.on("error", (error) => {
//                         uploadAborted = true;
//                         throw error;
//                     });

//                     // Use pipeline for proper error handling and backpressure
//                     await pipeline(file, writeStream);

//                     if (uploadAborted) {
//                         await this._cleanupTempFile(tempFilePath);
//                         return;
//                     }

//                     // Finalize file hash
//                     fileHash = hashStream.digest('hex');

//                     // Verify file integrity
//                     const tempStats = await fs.stat(tempFilePath);
//                     if (tempStats.size !== fileSize) {
//                         return next(this.handleError(res, new Error('File corruption detected during upload'), 'File upload corrupted', 500));
//                     }

//                     // Optional: Virus scanning
//                     if (this.config.virusScanEnabled) {
//                         await this._scanForVirus(tempFilePath);
//                     }

//                 } catch (error) {
//                     uploadAborted = true;
//                     if (tempFilePath) {
//                         await this._cleanupTempFile(tempFilePath);
//                     }
//                     next(error);
//                 }
//             });

//             // Handle upload completion
//             busboy.on("finish", async () => {
//                 try {
//                     if (uploadAborted || !tempFilePath || !originalFilename || !mimeType || fileSize === 0) {
//                         return next(this.handleError(res, new Error('Upload incomplete or invalid'), 'Upload failed', 400));
//                     }


//                     // Clear timeout
//                     this.cleanupUpload(uploadId);

//                     const parentId = fields["parentId"];
//                     const sanitizedFileName = this._sanitizeFilename(fields["fileName"] || originalFilename);
//                     const extension = path.extname(sanitizedFileName).toLowerCase();

//                     console.log(" 000000 UPLOAD SINGLE FILE 000000000 ")
//                     console.log(parentId)
//                     console.log(" 000000 UPLOAD SINGLE FILE 000000000 ")

//                     // Pre-flight validation
//                     const { user, settings } = await this._validateRequest(userId, {
//                         checkStorage: true,
//                         size: fileSize,
//                     }, res);

//                     // Validate file type again with settings
//                     // await this._validateFileTypeWithSettings(mimeType, extension, settings, res);

//                     // Handle parent folder validation
//                     const parentFolder = await this._validateParentFolder(parentId, userId);

//                     // Check for filename conflicts with retry logic
//                     const finalFileName = await this._resolveFileNameConflict(sanitizedFileName, parentId, userId);

//                     // Check for duplicate files by hash
//                     const existingFile = await this._checkForDuplicateFile(fileHash!, userId);
//                     if (existingFile) {
//                         await this._cleanupTempFile(tempFilePath);
//                         return res.status(200).json({
//                             fileId: existingFile.id,
//                             message: "Duplicate file detected - linking to existing file"
//                         });

//                     }

//                     // Determine final storage path
//                     const { finalPhysicalPath } = await this._determineFinalPath(
//                         user.id,
//                         parentFolder,
//                         finalFileName,
//                         settings
//                     );
//                     // Move file to final location with atomic operation
//                     await this._moveFileAtomic(tempFilePath, finalPhysicalPath);

//                     // Optional: Compress file if enabled
//                     if (this.config.compressionEnabled && this._shouldCompress(extension)) {
//                         await this._compressFile(finalPhysicalPath);
//                     }

//                     // Optional: Encrypt file if enabled
//                     if (this.config.encryptionEnabled) {
//                         await this._encryptFile(finalPhysicalPath, userId);
//                     }

//                     // Create database record with transaction
//                     await this._createFileRecord({
//                         sanitizedFileName: finalFileName,
//                         originalFilename,
//                         finalPhysicalPath,
//                         fileSize,
//                         mimeType,
//                         extension,
//                         fileHash: fileHash!,
//                         userId,
//                         parentId,
//                         user,
//                         parentFolder
//                     });

//                     // Log activity
//                     // await this._logActivity(userId, {
//                     //     activityType: ActivityType.FILE_UPLOAD,
//                     //     fileId: newFile.id,
//                     //     metadata: {
//                     //         fileName: finalFileName,
//                     //         fileSize,
//                     //         uploadDuration: Date.now() - startTime,
//                     //         hash: fileHash
//                     //     }
//                     // });



//                     res.status(201).json({ message: "Successful" });
//                 } catch (error) {
//                     if (tempFilePath) {
//                         await this._cleanupTempFile(tempFilePath);
//                     }
//                     next(error);
//                 }
//             });

//             // Handle busboy errors
//             busboy.on("error", (error: any) => {
//                 this.cleanupUpload(uploadId);
//                 next(error);
//             });

//             // Handle request aborted
//             req.on("aborted", () => {
//                 this.cleanupUpload(uploadId);
//                 if (tempFilePath) {
//                     this._cleanupTempFile(tempFilePath);
//                 }
//             });

//             // Start processing
//             req.pipe(busboy);

//         } catch (error) {
//             this.cleanupUpload(uploadId);
//             next(error);
//         }
//     };

//     private async _validateUploadRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
//         const contentType = req.headers['content-type'];
//         if (!contentType || !contentType.includes('multipart/form-data')) {
//             throw this.handleError(res, new Error('Invalid content type'), 'Expected multipart/form-data', 400);
//         }

//         const contentLength = req.headers['content-length'];
//         if (contentLength && parseInt(contentLength) > this.config.maxFileSize) {
//             throw this.handleError(res, new Error('Request entity too large'), 'File size limit exceeded', 413);
//         }
//     }

//     private async _setupTempDirectory(userId: string): Promise<{ tempDir: string; tempFilePath: string }> {
//         const systemSettings = await prisma.systemSettings.findFirst({ where: { id: 1 } });
//         const UPLOAD_DIR = systemSettings?.defaultStoragePath || "./uploads";
//         const tempDir = path.join(UPLOAD_DIR, "temp", userId);

//         await fs.mkdir(tempDir, { recursive: true });

//         return { tempDir, tempFilePath: "" };
//     }

//     private async _validateFileType(mimeType: string, extension: string, res: Response): Promise<void> {
//         if (!this.config.allowedMimeTypes.includes(mimeType)) {
//             throw this.handleError(res, new Error(`File type ${mimeType} not allowed`), 'File type not allowed', 400);
//         }

//         if (!this.config.allowedExtensions.includes(extension)) {
//             throw this.handleError(res, new Error(`File extension ${extension} not allowed`), 'File extension not allowed', 400);
//         }
//     }

//     private async _validateFileTypeWithSettings(mimeType: string, _extension: string, settings: any, res: Response): Promise<void> {
//         // Additional validation based on system settings
//         if (settings.restrictedMimeTypes?.includes(mimeType)) {
//             throw this.handleError(res, new Error('File type restricted by system policy'), 'File type restricted', 403);
//         }
//     }

//     private async _validateParentFolder(parentId: string | null, userId: string): Promise<any> {
//         if (!parentId) return null;

//         const parentFolder = await prisma.file.findFirst({
//             where: { id: parentId, userId, isFolder: true, isDeleted: false },
//         });



//         return parentFolder;
//     }

//     private async _resolveFileNameConflict(fileName: string, parentId: string | null, userId: string): Promise<string> {
//         let finalFileName = fileName;
//         let counter = 1;

//         while (await this._fileExists(finalFileName, parentId, userId)) {
//             const ext = path.extname(fileName);
//             const baseName = path.basename(fileName, ext);
//             finalFileName = `${baseName} (${counter})${ext}`;
//             counter++;
//         }

//         return finalFileName;
//     }

//     private async _fileExists(fileName: string, parentId: string | null, userId: string): Promise<boolean> {
//         const existing = await prisma.file.findFirst({
//             where: {
//                 fileName,
//                 parentId,
//                 userId,
//                 isDeleted: false,
//             },
//         });
//         return !!existing;
//     }

//     private async _checkForDuplicateFile(hash: string, userId: string): Promise<any> {
//         return await prisma.file.findFirst({
//             where: {
//                 hash,
//                 userId,
//                 isDeleted: false,
//             },
//         });
//     }

//     private async _determineFinalPath(userId: string, parentFolder: any, fileName: string, _settings: any): Promise<{ finalPhysicalPath: string; userRootPath: string }> {
//         const systemSettings = await prisma.systemSettings.findFirst({ where: { id: 1 } });
//         const UPLOAD_DIR = systemSettings?.defaultStoragePath || "./uploads";
//         const userRootPath = path.join(UPLOAD_DIR, userId);
//         let finalPhysicalPath: string;
//         if (parentFolder) {
//             finalPhysicalPath = path.join(parentFolder.filePath, fileName);
//         } else {
//             finalPhysicalPath = path.join(userRootPath, fileName);
//         }

//         return { finalPhysicalPath, userRootPath };
//     }

//     private async _moveFileAtomic(tempPath: string, finalPath: string): Promise<void> {
//         await fs.mkdir(path.dirname(finalPath), { recursive: true });

//         // Use atomic move operation
//         const tempFinalPath = `${finalPath}.tmp`;
//         await fs.rename(tempPath, tempFinalPath);
//         await fs.rename(tempFinalPath, finalPath);
//     }

//     private async _createFileRecord(data: any): Promise<any> {


//         const {
//             sanitizedFileName,
//             originalFilename,
//             finalPhysicalPath,
//             fileSize,
//             mimeType,
//             extension,
//             fileHash,
//             userId,
//             parentId,
//             user,

//         } = data;

//         let currentParentFolder;




//         if (parentId === "null") {

//             currentParentFolder = null;
//         }
//         else {
//             currentParentFolder = parentId;
//         }

//         return await prisma.$transaction(async (tx) => {
//             const fileRecord = await tx.file.create({
//                 data: {
//                     fileName: sanitizedFileName,
//                     originalName: originalFilename,
//                     filePath: finalPhysicalPath,
//                     type: getFileType(mimeType),
//                     fileSize,
//                     mimeType,
//                     isFolder: false,
//                     createdBy: userId,
//                     modifiedBy: userId,
//                     parentId: currentParentFolder,
//                     fileType: FileType.FILE,
//                     userId: user.id,
//                     ownerId: userId,
//                     extension,
//                     hash: fileHash,
//                 },
//             });


//             // Update user storage usage atomically
//             await tx.user.update({
//                 where: { id: user.id },
//                 data: {
//                     storageUsed: { increment: BigInt(fileSize) },
//                     totalFiles: { increment: 1 },
//                 },
//             });


//             // Update parent folder item count if applicable
//             if (currentParentFolder) {
//                 await tx.file.update({
//                     where: { id: currentParentFolder },
//                     data: { itemCount: { increment: 1 } },
//                 });
//             }


//             return fileRecord;
//         });
//     }

//     private async _scanForVirus(_filePath: string): Promise<void> {
//         // Implement virus scanning logic
//         // This could integrate with ClamAV or similar
//         return new Promise((resolve, _reject) => {
//             // Placeholder for virus scanning
//             resolve();
//         });
//     }



//     private async _compressFile(filePath: string): Promise<void> {
//         try {
//             //   const zlib = await import('zlib');
//             const { createReadStream, createWriteStream } = await import('fs');
//             const { pipeline } = await import('stream/promises');
//             const { Transform } = await import('stream');

//             // Get file stats for compression decision
//             const stats = await fs.stat(filePath);
//             const originalSize = stats.size;

//             // Skip compression for very small files (< 1KB)
//             if (originalSize < 1024) {
//                 return;
//             }

//             // Determine best compression algorithm based on file type
//             const compressionConfig = this._getCompressionConfig(filePath, originalSize);

//             if (!compressionConfig.shouldCompress) {
//                 return;
//             }

//             // Create temporary compressed file path
//             // const compressedPath = `${filePath}.compressed`;
//             const tempPath = `${filePath}.compressing`;

//             // Create streams
//             const readStream = createReadStream(filePath);
//             const writeStream = createWriteStream(tempPath);

//             // Create compression stream based on algorithm
//             const compressor = this._createCompressor(compressionConfig);

//             // Track compression ratio
//             let compressedSize = 0;
//             const compressionTracker = new Transform({
//                 transform(chunk, _encoding, callback) {
//                     compressedSize += chunk.length;
//                     callback(null, chunk);
//                 }
//             });

//             // Add compression header with metadata
//             const header = this._createCompressionHeader(compressionConfig, originalSize);
//             writeStream.write(header);

//             // Compress the file
//             await pipeline(readStream, compressor, compressionTracker, writeStream);

//             // Calculate compression ratio
//             const finalCompressedSize = compressedSize + header.length;
//             const compressionRatio = (originalSize - finalCompressedSize) / originalSize;

//             // Only keep compressed version if it's significantly smaller
//             if (compressionRatio > 0.1) { // At least 10% reduction
//                 // Atomically replace original file with compressed version
//                 await fs.rename(tempPath, filePath);

//                 // Update file metadata in database
//                 await this._updateFileCompressionInfo(filePath, {
//                     isCompressed: true,
//                     compressionAlgorithm: compressionConfig.algorithm,
//                     originalSize,
//                     compressedSize: finalCompressedSize,
//                     compressionRatio,
//                     compressedAt: new Date(),
//                 });

//             } else {
//                 // Compression not worth it, keep original
//                 await fs.unlink(tempPath);
//             }

//         } catch (error: any) {
//             console.error(`Compression failed for file ${filePath}:`, error);

//             // Cleanup temp files on error
//             const tempPath = `${filePath}.compressing`;
//             try {
//                 await fs.unlink(tempPath);
//             } catch (cleanupError) {
//                 console.error(`Failed to cleanup temp file: ${tempPath}`, cleanupError);
//             }
//             throw new Error(`File compression failed: ${error.message}`);
//         }
//     }

//     private _getCompressionConfig(filePath: string, fileSize: number): CompressionConfig {
//         const extension = path.extname(filePath).toLowerCase();
//         //const fileName = path.basename(filePath).toLowerCase();

//         // Files that are already compressed or don't benefit from compression
//         const skipCompressionExtensions = [
//             '.zip', '.rar', '.7z', '.gz', '.bz2', '.xz', '.tar.gz', '.tgz',
//             '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif',
//             '.mp3', '.aac', '.ogg', '.m4a', '.flac', '.wma',
//             '.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm',
//             '.pdf', '.docx', '.xlsx', '.pptx', '.odt', '.ods', '.odp'
//         ];

//         // Files that compress very well
//         const highCompressionExtensions = [
//             '.txt', '.csv', '.json', '.xml', '.html', '.css', '.js', '.ts',
//             '.sql', '.log', '.md', '.yaml', '.yml', '.ini', '.conf'
//         ];

//         // Files that compress moderately well
//         const mediumCompressionExtensions = [
//             '.doc', '.xls', '.ppt', '.rtf', '.svg', '.eps'
//         ];

//         if (skipCompressionExtensions.includes(extension)) {
//             return { shouldCompress: false, algorithm: 'gzip', level: 0 }; // Default to a valid algorithm even if not compressing
//         }

//         // Choose compression algorithm and level based on file type and size
//         let algorithm: CompressionAlgorithm;
//         let level: number;

//         if (highCompressionExtensions.includes(extension)) {
//             // Text files compress very well with gzip
//             algorithm = 'gzip';
//             level = fileSize > 10 * 1024 * 1024 ? 6 : 9; // Lower level for large files
//         } else if (mediumCompressionExtensions.includes(extension)) {
//             // Office documents - moderate compression
//             algorithm = 'deflate';
//             level = 6;
//         } else {
//             // Unknown file type - try light compression
//             algorithm = 'gzip';
//             level = 3;
//         }

//         // Adjust level based on file size for performance
//         if (fileSize > 100 * 1024 * 1024) { // > 100MB
//             level = Math.min(level, 3); // Use faster compression for large files
//         }

//         return { shouldCompress: true, algorithm, level };
//     }

//     private _createCompressor(config: CompressionConfig): any {
//         const zlib = require('zlib');

//         const options = {
//             level: config.level,
//             windowBits: 15,
//             memLevel: 8,
//             strategy: zlib.constants.Z_DEFAULT_STRATEGY,
//         };

//         switch (config.algorithm) {
//             case 'gzip':
//                 return zlib.createGzip(options);
//             case 'deflate':
//                 return zlib.createDeflate(options);
//             case 'brotli':
//                 return zlib.createBrotliCompress({
//                     params: {
//                         [zlib.constants.BROTLI_PARAM_QUALITY]: config.level,
//                         [zlib.constants.BROTLI_PARAM_SIZE_HINT]: 0,
//                     }
//                 });
//             default:
//                 throw new Error(`Unsupported compression algorithm: ${config.algorithm}`);
//         }
//     }

//     private _createCompressionHeader(config: CompressionConfig, originalSize: number): Buffer {
//         // Create header with compression metadata
//         const header = Buffer.alloc(32);
//         let offset = 0;

//         // Magic bytes
//         header.write('COMP', offset, 4, 'utf8');
//         offset += 4;

//         // Version
//         header.writeUInt8(1, offset);
//         offset += 1;

//         // Algorithm (1 byte)
//         const algorithmMap = { 'gzip': 1, 'deflate': 2, 'brotli': 3 };
//         header.writeUInt8(algorithmMap[config.algorithm] || 0, offset);
//         offset += 1;

//         // Compression level (1 byte)
//         header.writeUInt8(config.level, offset);
//         offset += 1;

//         // Reserved (1 byte)
//         header.writeUInt8(0, offset);
//         offset += 1;

//         // Original size (8 bytes)
//         header.writeBigUInt64BE(BigInt(originalSize), offset);
//         offset += 8;

//         // Timestamp (8 bytes)
//         header.writeBigUInt64BE(BigInt(Date.now()), offset);
//         offset += 8;

//         // CRC32 of header (4 bytes) - calculated later
//         const crc32 = require('crc-32');
//         const headerCrc = crc32.buf(header.slice(0, 28));
//         header.writeUInt32BE(headerCrc >>> 0, 28);

//         return header;
//     }

//     private async _updateFileCompressionInfo(filePath: string, info: CompressionInfo): Promise<void> {
//         try {
//             const file = await prisma.file.findFirst({ where: { filePath } });
//             if (file) {
//                 await prisma.file.update({
//                     where: { id: file.id },
//                     data: {
//                         isCompressed: info.isCompressed,
//                         compressionAlgorithm: info.compressionAlgorithm,
//                         originalSize: info.originalSize,
//                         compressedSize: info.compressedSize,
//                         compressionRatio: info.compressionRatio,
//                         compressedAt: info.compressedAt,
//                     }
//                 });
//             }
//         } catch (error) {
//             console.error(`Failed to update compression info for ${filePath}:`, error);
//             // Don't throw here as compression succeeded
//         }
//     }

//     // Method to decompress file when needed
//     private async _decompressFile(filePath: string): Promise<string> {
//         try {
//             const { createReadStream, createWriteStream } = await import('fs');
//             const { pipeline } = await import('stream/promises');
//             const { Transform } = await import('stream');

//             // Check if file is actually compressed
//             const isCompressed = await this._isFileCompressed(filePath);
//             if (!isCompressed) {
//                 return filePath; // Return original path if not compressed
//             }

//             // Create temporary decompressed file path
//             const decompressedPath = `${filePath}.decompressed`;
//             const tempPath = `${filePath}.decompressing`;

//             // Create streams
//             const readStream = createReadStream(filePath);
//             const writeStream = createWriteStream(tempPath);

//             // Read and parse header
//             const header = await this._readCompressionHeader(readStream);

//             // Create decompressor based on algorithm
//             const decompressor = this._createDecompressor(header.algorithm);

//             // Skip header bytes and decompress (unused transform removed)

//             // Decompress the file
//             await pipeline(readStream, decompressor, writeStream);

//             // Verify decompressed size matches original
//             const decompressedStats = await fs.stat(tempPath);
//             if (decompressedStats.size !== header.originalSize) {
//                 throw new Error(`Decompressed size mismatch. Expected: ${header.originalSize}, Got: ${decompressedStats.size}`);
//             }

//             // Return path to decompressed file
//             await fs.rename(tempPath, decompressedPath);
//             return decompressedPath;

//         } catch (error: any) {
//             console.error(`Decompression failed for file ${filePath}:`, error);

//             // Cleanup temp files on error
//             const tempPath = `${filePath}.decompressing`;
//             try {
//                 await fs.unlink(tempPath);
//             } catch (cleanupError) {
//                 console.error(`Failed to cleanup temp file: ${tempPath}`, cleanupError);
//             }
//             throw new Error(`File decompression failed: ${error.message}`);
//         }
//     }


//     private async _readCompressionHeader(readStream: any): Promise<CompressionHeader> {
//         return new Promise((resolve, reject) => {
//             const headerBuffer = Buffer.alloc(32);
//             let headerRead = 0;

//             const onData = (chunk: Buffer) => {
//                 const bytesToRead = Math.min(chunk.length, 32 - headerRead);
//                 chunk.copy(headerBuffer, headerRead, 0, bytesToRead);
//                 headerRead += bytesToRead;

//                 if (headerRead >= 32) {
//                     readStream.removeListener('data', onData);
//                     readStream.removeListener('error', onError);

//                     try {
//                         const header = this._parseCompressionHeader(headerBuffer);
//                         resolve(header);
//                     } catch (error) {
//                         reject(error);
//                     }
//                 }
//             };

//             const onError = (error: Error) => {
//                 readStream.removeListener('data', onData);
//                 readStream.removeListener('error', onError);
//                 reject(error);
//             };

//             readStream.on('data', onData);
//             readStream.on('error', onError);
//         });
//     }

//     private _parseCompressionHeader(buffer: Buffer): CompressionHeader {
//         let offset = 0;

//         // Check magic bytes
//         const magic = buffer.toString('utf8', offset, offset + 4);
//         if (magic !== 'COMP') {
//             throw new Error('Invalid compression header magic bytes');
//         }
//         offset += 4;

//         // Version
//         const version = buffer.readUInt8(offset);
//         if (version !== 1) {
//             throw new Error(`Unsupported compression version: ${version}`);
//         }
//         offset += 1;

//         // Algorithm
//         const algorithmCode = buffer.readUInt8(offset);
//         const algorithmMap = { 1: 'gzip', 2: 'deflate', 3: 'brotli' };
//         const algorithm = algorithmMap[algorithmCode as keyof typeof algorithmMap];
//         if (!algorithm) {
//             throw new Error(`Unknown compression algorithm: ${algorithmCode}`);
//         }
//         offset += 1;

//         // Compression level
//         const level = buffer.readUInt8(offset);
//         offset += 1;

//         // Reserved
//         offset += 1;

//         // Original size
//         const originalSize = Number(buffer.readBigUInt64BE(offset));
//         offset += 8;

//         // Timestamp
//         const timestamp = Number(buffer.readBigUInt64BE(offset));
//         offset += 8;

//         // Verify CRC32
//         const storedCrc = buffer.readUInt32BE(offset);
//         const crc32 = require('crc-32');
//         const calculatedCrc = crc32.buf(buffer.slice(0, 28));

//         if (storedCrc !== (calculatedCrc >>> 0)) {
//             throw new Error('Compression header CRC mismatch');
//         }

//         return {
//             version,
//             algorithm: algorithm as CompressionAlgorithm,
//             level,
//             originalSize,
//             timestamp,
//         };
//     }

//     private _createDecompressor(algorithm: CompressionAlgorithm): any {
//         const zlib = require('zlib');

//         switch (algorithm) {
//             case 'gzip':
//                 return zlib.createGunzip();
//             case 'deflate':
//                 return zlib.createInflate();
//             case 'brotli':
//                 return zlib.createBrotliDecompress();
//             default:
//                 throw new Error(`Unsupported decompression algorithm: ${algorithm}`);
//         }
//     }

//     private async _isFileCompressed(filePath: string): Promise<boolean> {
//         try {
//             const { createReadStream } = await import('fs');
//             const stream = createReadStream(filePath, { start: 0, end: 4 });

//             return new Promise((resolve, reject) => {
//                 stream.on('data', (chunk: string | Buffer) => {
//                     const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
//                     const magic = buffer.toString('utf8', 0, 4);
//                     resolve(magic === 'COMP');
//                 });

//                 stream.on('error', reject);
//                 stream.on('end', () => resolve(false));
//             });
//         } catch (error) {
//             return false;
//         }
//     }

//     private _shouldCompress(extension: string): boolean {
//         const compressibleExtensions = [
//             '.txt', '.csv', '.json', '.xml', '.html', '.css', '.js', '.ts',
//             '.sql', '.log', '.md', '.yaml', '.yml', '.ini', '.conf',
//             '.doc', '.xls', '.ppt', '.rtf', '.svg', '.eps'
//         ];
//         return compressibleExtensions.includes(extension);
//     }

//     private async _encryptFile(filePath: string, userId: string): Promise<void> {
//         try {
//             const crypto = await import('crypto');
//             const { createReadStream, createWriteStream } = await import('fs');
//             const { pipeline } = await import('stream/promises');
//             const { Transform } = await import('stream');

//             // Generate encryption key for user (in production, use proper key management)
//             const encryptionKey = await this._getUserEncryptionKey(userId);

//             // Generate random IV for this file
//             const iv = crypto.randomBytes(16);

//             // Create cipher
//             const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
//             cipher.setAAD(Buffer.from(userId, 'utf8')); // Additional authenticated data

//             // Create temporary encrypted file path
//             // const encryptedPath = `${filePath}.encrypted`;
//             const tempPath = `${filePath}.encrypting`;

//             // Create streams
//             const readStream = createReadStream(filePath);
//             const writeStream = createWriteStream(tempPath);

//             // Create encryption transform stream
//             const encryptionTransform = new Transform({
//                 transform(chunk, _encoding, callback) {
//                     try {
//                         const encrypted = cipher.update(chunk);
//                         callback(null, encrypted);
//                     } catch (error) {
//                         callback(error as Error);
//                     }
//                 },
//                 flush(callback) {
//                     try {
//                         const final = cipher.final();
//                         const authTag = cipher.getAuthTag();

//                         // Prepend IV and auth tag to the encrypted data
//                         const header = Buffer.concat([
//                             Buffer.from('ENC', 'utf8'), // Magic bytes
//                             Buffer.from([1]), // Version
//                             iv, // 16 bytes
//                             authTag, // 16 bytes
//                         ]);

//                         this.push(header);
//                         this.push(final);
//                         callback();
//                     } catch (error) {
//                         callback(error as Error);
//                     }
//                 }
//             });

//             // Encrypt the file
//             await pipeline(readStream, encryptionTransform, writeStream);

//             // Atomically replace original file with encrypted version
//             await fs.rename(tempPath, filePath);

//             // Update file metadata in database
//             const file = await prisma.file.findFirst({ where: { filePath } });
//             if (file) {
//                 await prisma.file.update({
//                     where: { id: file.id },
//                     data: {
//                         isEncrypted: true,
//                         encryptionAlgorithm: 'aes-256-gcm',
//                         encryptedAt: new Date(),
//                     }
//                 });
//             }


//         } catch (error: any) {
//             console.error(`Encryption failed for file ${filePath}:`, error);

//             // Cleanup temp files on error
//             const tempPath = `${filePath}.encrypting`;
//             try {
//                 await fs.unlink(tempPath);
//             } catch (cleanupError) {
//                 console.error(`Failed to cleanup temp file: ${tempPath}`, cleanupError);
//             }
//             throw new Error(`File encryption failed: ${error.message}`);
//         }
//     }

//     private async _getUserEncryptionKey(userId: string): Promise<Buffer> {
//         try {
//             // Check if user already has an encryption key
//             let userKey = await prisma.userEncryptionKey.findUnique({
//                 where: { userId }
//             });

//             if (!userKey) {
//                 // Generate new key for user
//                 const crypto = await import('crypto');
//                 const masterKey = this._getMasterEncryptionKey();
//                 const userSalt = crypto.randomBytes(32);

//                 // Derive user-specific key using PBKDF2
//                 const derivedKey = crypto.pbkdf2Sync(
//                     masterKey,
//                     userSalt,
//                     100000, // iterations
//                     32, // key length
//                     'sha256'
//                 );

//                 // Store encrypted key in database
//                 const keyEncrypted = this._encryptKeyForStorage(derivedKey, masterKey);

//                 userKey = await prisma.userEncryptionKey.create({
//                     data: {
//                         userId,
//                         keyData: keyEncrypted.toString('base64'),
//                         salt: userSalt.toString('base64'),
//                         keyType: 'aes-256-gcm',
//                         iv: crypto.randomBytes(16).toString('base64'),
//                     }
//                 });
//             }

//             // Decrypt and return the key
//             const masterKey = this._getMasterEncryptionKey();
//             const encryptedKey = Buffer.from(userKey.keyData, 'base64');
//             const decryptedKey = this._decryptKeyFromStorage(encryptedKey, masterKey);

//             return decryptedKey;

//         } catch (error) {
//             console.error(`Failed to get encryption key for user ${userId}:`, error);
//             throw new Error('Failed to retrieve encryption key');
//         }
//     }

//     private _getMasterEncryptionKey(): Buffer {
//         // In production, this should come from:
//         // 1. Environment variables
//         // 2. Key management service (AWS KMS, Azure Key Vault, etc.)
//         // 3. Hardware Security Module (HSM)
//         const masterKeyHex = process.env.MASTER_ENCRYPTION_KEY;

//         if (!masterKeyHex) {
//             throw new Error("Master encryption key not configured");
//         }

//         return Buffer.from(masterKeyHex, 'hex');
//     }

//     private _encryptKeyForStorage(key: Buffer, masterKey: Buffer): Buffer {
//         const crypto = require('crypto');
//         const iv = crypto.randomBytes(16);
//         const ivKey = crypto.randomBytes(16);
//         const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, ivKey);

//         let encrypted = cipher.update(key);
//         encrypted = Buffer.concat([encrypted, cipher.final()]);

//         const authTag = cipher.getAuthTag();

//         // Combine IV, auth tag, and encrypted data
//         return Buffer.concat([ivKey, authTag, encrypted]);
//     }

//     private _decryptKeyFromStorage(encryptedData: Buffer, masterKey: Buffer): Buffer {
//         const crypto = require('crypto');

//         // Extract IV, auth tag, and encrypted data
//         const ivKey = encryptedData.slice(0, 16);
//         const authTag = encryptedData.slice(16, 32);
//         const encrypted = encryptedData.slice(32);

//         const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, ivKey);
//         decipher.setAuthTag(authTag);

//         let decrypted = decipher.update(encrypted);
//         decrypted = Buffer.concat([decrypted, decipher.final()]);

//         return decrypted;
//     }

//     // Method to decrypt file when needed
//     private async _decryptFile(filePath: string, userId: string): Promise<string> {
//         try {
//             const crypto = await import('crypto');
//             const { createReadStream, createWriteStream } = await import('fs');
//             const { pipeline } = await import('stream/promises');
//             const { Transform } = await import('stream');

//             // Get user's encryption key
//             const encryptionKey = await this._getUserEncryptionKey(userId);

//             // Create temporary decrypted file path
//             const decryptedPath = `${filePath}.decrypted`;
//             const tempPath = `${filePath}.decrypting`;

//             // Create streams
//             const readStream = createReadStream(filePath);
//             const writeStream = createWriteStream(tempPath);

//             let headerProcessed = false;
//             let iv: Buffer;
//             let authTag: Buffer;
//             let decipher: any;

//             // Create decryption transform stream
//             const decryptionTransform = new Transform({
//                 transform(chunk, _encoding, callback) {
//                     try {
//                         if (!headerProcessed) {
//                             // Process header to extract IV and auth tag
//                             const magic = chunk.slice(0, 3).toString('utf8');
//                             if (magic !== 'ENC') {
//                                 throw new Error('Invalid encrypted file format');
//                             }

//                             const version = chunk.slice(3, 4)[0];
//                             if (version !== 1) {
//                                 throw new Error('Unsupported encryption version');
//                             }

//                             iv = chunk.slice(4, 20);
//                             authTag = chunk.slice(20, 36);

//                             // Create decipher
//                             decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, iv);
//                             decipher.setAuthTag(authTag);
//                             decipher.setAAD(Buffer.from(userId, 'utf8'));

//                             // Process remaining data
//                             const encryptedData = chunk.slice(36);
//                             if (encryptedData.length > 0) {
//                                 const decrypted = decipher.update(encryptedData);
//                                 callback(null, decrypted);
//                             } else {
//                                 callback();
//                             }

//                             headerProcessed = true;
//                         } else {
//                             // Decrypt chunk
//                             const decrypted = decipher.update(chunk);
//                             callback(null, decrypted);
//                         }
//                     } catch (error) {
//                         callback(error as Error);
//                     }
//                 },
//                 flush(callback) {
//                     try {
//                         if (decipher) {
//                             const final = decipher.final();
//                             this.push(final);
//                         }
//                         callback();
//                     } catch (error) {
//                         callback(error as Error);
//                     }
//                 }
//             });

//             // Decrypt the file
//             await pipeline(readStream, decryptionTransform, writeStream);

//             // Return path to decrypted file
//             await fs.rename(tempPath, decryptedPath);
//             return decryptedPath;

//         } catch (error: any) {
//             console.error(`Decryption failed for file ${filePath}:`, error);

//             // Cleanup temp files on error
//             const tempPath = `${filePath}.decrypting`;
//             try {
//                 await fs.unlink(tempPath);
//             } catch (cleanupError) {
//                 console.error(`Failed to cleanup temp file: ${tempPath}`, cleanupError);
//             }
//             throw new Error(`File decryption failed: ${error.message}`);
//         }
//     }

//     // Method to check if file is encrypted
//     private async _isFileEncrypted(filePath: string): Promise<boolean> {
//         try {
//             const { createReadStream } = await import('fs');
//             const stream = createReadStream(filePath, { start: 0, end: 3 });

//             return new Promise((resolve, reject) => {
//                 stream.on('data', (chunk) => {
//                     const magic = chunk.toString('utf8');
//                     resolve(magic === 'ENC');
//                 });

//                 stream.on('error', reject);
//                 stream.on('end', () => resolve(false));
//             });
//         } catch (error) {
//             return false;
//         }
//     }

//     private async _cleanupTempFile(filePath: string): Promise<void> {
//         try {
//             await fs.unlink(filePath);
//         } catch (error) {
//             // Log error but don't throw
//             console.error(`Failed to cleanup temp file: ${filePath}`, error);
//         }
//     }

//     private cleanupUpload(uploadId: string): void {
//         const timeout = this.uploadTimeouts.get(uploadId);
//         if (timeout) {
//             clearTimeout(timeout);
//             this.uploadTimeouts.delete(uploadId);
//         }
//         this.activeUploads.delete(uploadId);
//     }

//     private _sanitizeFilename(filename: string): string {
//         return filename
//             .replace(/[^a-zA-Z0-9\-_\.]/g, '_')
//             .replace(/_{2,}/g, '_')
//             .replace(/^_|_$/g, '')
//             .substring(0, 255);
//     }

//     private async _validateRequest(userId: string, options: { checkStorage: boolean; size: number }, res: Response): Promise<{ user: any; settings: any }> {
//         const user = await prisma.user.findUnique({
//             where: { id: userId },
//             include: { subscriptions: true }
//         });

//         if (!user) {
//             throw this.handleError(res, new Error('User not found'), 'User not found', 404);
//         }

//         const settings = await prisma.systemSettings.findFirst({ where: { id: 1 } });


//         //TODO
//         // if (options.checkStorage) {
//         //     const storageLimit = user.subscriptions?.storageLimit || settings?.defaultMaxStorage || 0;
//         //     const currentUsage = Number(user.storageUsed || 0);

//         //     if (currentUsage + options.size > storageLimit) {
//         //         throw this.handleError(res, new Error('Storage limit exceeded'), 'Storage limit exceeded', 413);
//         //     }
//         // }

//         return { user, settings };
//     }

//     private async _logActivity(userId: string, activity: any): Promise<void> {
//         try {
//             await prisma.activityLog.create({
//                 data: {
//                     userId,
//                     activityType: activity.activityType,
//                     fileId: activity.fileId,
//                     metadata: activity.metadata,
//                     timestamp: new Date(),
//                 },
//             });
//         } catch (error) {
//             console.error("Failed to log activity:", error);
//         }
//     }

//     // Method to get upload progress
//     public getUploadProgress(uploadId: string): UploadProgress | null {
//         return this.activeUploads.get(uploadId) || null;
//     }

//     // Method to cancel upload
//     public cancelUpload(uploadId: string): void {
//         this.cleanupUpload(uploadId);
//     }
// }

import { Request, Response, NextFunction } from 'express';
import Busboy from "busboy";
import { createWriteStream, promises as fs } from 'fs';
import { pipeline } from 'stream/promises';
import path from 'path';
import { randomUUID } from 'crypto';


import { createHash } from 'crypto';

import { FileType } from '@prisma/client';
import prisma from '../config/database.config';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { getFileType } from '../utils/file.utils';

const config = {
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    maxFiles: 1,
    virusScanEnabled: false,
};

interface FileUploadConfig {
    maxFileSize: number;
    maxFiles: number;
    allowedMimeTypes: string[];
    allowedExtensions: string[];
    virusScanEnabled: boolean;
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
}

interface UploadProgress {
    bytesReceived: number;
    totalBytes: number;
    startTime: number;
    fileName: string;
}

type CompressionAlgorithm = 'gzip' | 'deflate' | 'brotli';

interface CompressionConfig {
    shouldCompress: boolean;
    algorithm: CompressionAlgorithm;
    level: number;
}

interface CompressionInfo {
    isCompressed: boolean;
    compressionAlgorithm: string;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    compressedAt: Date;
}

interface CompressionHeader {
    version: number;
    algorithm: CompressionAlgorithm;
    level: number;
    originalSize: number;
    timestamp: number;
}

export class FileUploadHandler {
    private readonly config: FileUploadConfig;
    private readonly uploadTimeouts = new Map<string, NodeJS.Timeout>();
    private readonly activeUploads = new Map<string, UploadProgress>();

    constructor(config: FileUploadConfig) {
        this.config = config;
    }

    private handleError(res: Response, error: Error, message: string = 'Internal server error', statusCode: number = 500): Error {
        console.error(`FileUploadHandler Error [${statusCode}]:`, error.message);
        res.status(statusCode).json({
            success: false,
            message,
            error: error.message
        });
        return error;
    }

    public uploadSingleFile1 = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        const uploadId = randomUUID();
        const startTime = Date.now();

        try {
            const userId = req.user?.userId;

            if (!userId) {
                return next(this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401));
            }

            // Set upload timeout
            const timeout = setTimeout(() => {
                this.cleanupUpload(uploadId);
                return next(this.handleError(res, new Error('Upload timeout'), 'Upload timeout', 408));
            }, 30 * 60 * 1000); // 30 minutes

            this.uploadTimeouts.set(uploadId, timeout);

            // Validate request headers and content
            await this._validateUploadRequestV2(req);

            const busboy = Busboy({
                headers: req.headers,
                limits: {
                    fileSize: this.config.maxFileSize,
                    files: this.config.maxFiles,
                    fields: 10,
                    fieldSize: 1024 * 1024, // 1MB field size limit
                },
            });

            const fields: Record<string, string> = {};
            let tempFilePath: string | null = null;
            let originalFilename: string | null = null;
            let mimeType: string | null = null;
            let fileSize = 0;
            let fileHash: string | null = null;
            let uploadAborted = false;

            // Handle form fields
            busboy.on('field', (name, val) => {
                fields[name] = val;
            });

            // Handle file upload
            busboy.on('file', async (_fieldname, file, info) => {
                try {
                    if (uploadAborted) {
                        file.resume();
                        return;
                    }

                    if (!info.filename) {
                        file.resume();
                        return;
                    }

                    originalFilename = info.filename;
                    mimeType = info.mimeType;
                    const extension = path.extname(originalFilename).toLowerCase();
                    await this._validateFileTypeV2(mimeType, extension);

                    const { tempDir } = await this._setupTempDirectory(userId);
                    tempFilePath = path.join(tempDir, `${uploadId}-${this._sanitizeFilename(originalFilename)}`);

                    const writeStream = createWriteStream(tempFilePath, { flags: 'w' });
                    const hashStream = createHash('sha256');

                    file.on('data', (chunk: Buffer) => {
                        fileSize += chunk.length;
                        if (fileSize > this.config.maxFileSize) {
                            uploadAborted = true;
                            file.destroy();
                            writeStream.destroy();
                            return next(this.handleError(res, new Error('File size exceeds limit'), 'File too large', 413));
                        }
                        hashStream.update(chunk);
                    });

                    await pipeline(file, writeStream);

                    if (uploadAborted) {
                        await this._cleanupTempFile(tempFilePath);
                        return;
                    }

                    fileHash = hashStream.digest('hex');

                } catch (error) {
                    uploadAborted = true;
                    if (tempFilePath) {
                        await this._cleanupTempFile(tempFilePath);
                    }
                    next(error);
                }
            });

            // Handle upload completion
            busboy.on('finish', async () => {
                try {
                    if (uploadAborted || !tempFilePath || !originalFilename || !mimeType || fileSize === 0) {
                        return next(this.handleError(res, new Error('Upload incomplete or invalid'), 'Upload failed', 400));
                    }
                    console.log(" 000000000000000000000000 ")
                    this.cleanupUpload(uploadId);

                    const parentId = fields['parentId'];
                    const sanitizedFileName = this._sanitizeFilename(fields['fileName'] || originalFilename);

                    const { user } = await this._validateRequestV2(userId, { checkStorage: true, size: fileSize });
                    const parentFolder = await this._validateParentFolder(parentId, userId);
                    const finalFileName = await this._resolveFileNameConflict(sanitizedFileName, parentId, userId);

                    const { finalPhysicalPath } = await this._determineFinalPathV2(user.id, parentFolder, finalFileName);
                    await this._moveFileAtomic(tempFilePath, finalPhysicalPath);

                    const newFile = await this._createFileRecordV2({
                        finalFileName,
                        originalFilename,
                        finalPhysicalPath,
                        fileSize,
                        mimeType,
                        fileHash: fileHash!,
                        userId,
                        parentId,
                    });

                    // Construct the full public URL
                    const url = `${req.protocol}://${req.get('host')}${newFile.webContentPath}`;


                    // console.log(" 1111111111parentFolder111111111111111111 ")
                    // console.log(url)
                    // console.log(" 1111111111parentFolder111111111111111111 ")

                    res.status(201).json({
                        message: "File uploaded successfully",
                        file: {
                            ...newFile,
                            url, // The full, shareable URL
                        },
                    });

                } catch (error) {
                    if (tempFilePath) {
                        await this._cleanupTempFile(tempFilePath);
                    }
                    next(error);
                }
            });

            req.pipe(busboy);

        } catch (error) {
            this.cleanupUpload(uploadId);
            next(error);
        }
    };

    private async _createFileRecordV2(data: {
        finalFileName: string,
        originalFilename: string,
        finalPhysicalPath: string,
        fileSize: number,
        mimeType: string,
        fileHash: string,
        userId: string,
        parentId: string
    }) {
        // This is where you would interact with your database (e.g., Prisma, TypeORM)
        const fileRecord = {
            id: randomUUID(),
            name: data.finalFileName,
            originalName: data.originalFilename,
            path: data.finalPhysicalPath,
            // Generate a web-accessible path. IMPORTANT: Ensure your server
            // is configured to serve static files from the 'public' directory.
            webContentPath: `/${path.relative('public', data.finalPhysicalPath)}`,
            size: data.fileSize,
            mimeType: data.mimeType,
            hash: data.fileHash,
            ownerId: data.userId,
            parentId: data.parentId,
            createdAt: new Date(),
        };
        // In a real app: await db.file.create({ data: fileRecord });
        console.log('Created file record:', fileRecord);
        return Promise.resolve(fileRecord);
    }

    private handleErrorV2(res: Response, error: Error, message: string, statusCode: number) {
        console.error(error);
        if (!res.headersSent) {
            res.status(statusCode).json({ message });
        }
    }

    private cleanupUploadV2(uploadId: string) {
        clearTimeout(this.uploadTimeouts.get(uploadId));
        this.uploadTimeouts.delete(uploadId);
        this.activeUploads.delete(uploadId);
    }

    private async _validateUploadRequestV2(req: AuthenticatedRequest) {
        // Implement your request validation logic (e.g., check headers)
        return Promise.resolve();
    }

    private _sanitizeFilenameV2(filename: string): string {
        return filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    }

    private async _setupTempDirectoryV2(userId: string) {
        const tempDir = path.join('/tmp', 'uploads', userId);
        await fs.mkdir(tempDir, { recursive: true });
        return { tempDir, tempFilePath: '' };
    }

    private async _validateFileTypeV2(mimeType: string, extension: string) {
        // Implement file type validation
        return Promise.resolve();
    }

    private async _cleanupTempFileV2(filePath: string) {
        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.error(`Failed to cleanup temp file: ${filePath}`, error);
        }
    }

    private async _validateRequestV2(userId: string, options: { checkStorage: boolean, size: number }) {
        // Validate user and storage space
        return Promise.resolve({ user: { id: userId } });
    }

    private async _validateParentFolderV2(parentId: string, userId: string) {
        // Validate parent folder exists and user has access
        return Promise.resolve({ path: `user_files/${userId}` });
    }

    private async _resolveFileNameConflictV2(fileName: string, parentId: string, userId: string): Promise<string> {
        // Check for and resolve file name conflicts
        return Promise.resolve(fileName);
    }

    private async _determineFinalPathV2(userId: string, parentFolder: any, fileName: string) {
        // const userRootPath = path.join('public/files', userId, parentFolder.path || '');
        // await fs.mkdir(userRootPath, { recursive: true });
        // const finalPhysicalPath = path.join(userRootPath, fileName);
        // return { finalPhysicalPath, userRootPath };


        const systemSettings = await prisma.systemSettings.findFirst({ where: { id: 1 } });
        const UPLOAD_DIR = systemSettings?.defaultStoragePath || "./uploads";
        const userRootPath = path.join(UPLOAD_DIR, userId);
        let finalPhysicalPath: string;
        if (parentFolder) {
            finalPhysicalPath = path.join(parentFolder.filePath, fileName);
        } else {
            finalPhysicalPath = path.join(userRootPath, fileName);
        }

        return { finalPhysicalPath, userRootPath };
    }

    private async _moveFileAtomicV2(tempPath: string, finalPath: string) {
        await fs.rename(tempPath, finalPath);
    }

    //==================================================

    public uploadSingleFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        const uploadId = randomUUID();
        const startTime = Date.now();

        try {
            const userId = req.user?.userId;

            if (!userId) {
                return next(this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401));
            }

            // Set upload timeout
            const timeout = setTimeout(() => {
                this.cleanupUpload(uploadId);
                return next(this.handleError(res, new Error('Upload timeout'), 'Upload timeout', 408));

            }, 30 * 60 * 1000); // 30 minutes

            this.uploadTimeouts.set(uploadId, timeout);

            // Validate request headers and content
            await this._validateUploadRequest(req, res);

            const busboy = Busboy({
                headers: req.headers,
                limits: {
                    fileSize: this.config.maxFileSize,
                    files: this.config.maxFiles,
                    fields: 10,
                    fieldSize: 1024 * 1024 // 1MB field size limit
                }
            });

            const fields: Record<string, string> = {};
            let tempFilePath: string | null = null;
            let originalFilename: string | null = null;
            let mimeType: string | null = null;
            let fileSize = 0;
            let fileHash: string | null = null;
            let uploadAborted = false;

            // Handle form fields
            busboy.on("field", (name, val, info) => {
                if (info.valueTruncated) {
                    uploadAborted = true;
                    return next(this.handleError(res, new Error('Field size limit exceeded'), 'Field too large', 413));

                }
                fields[name] = val;
            });

            // Handle file upload
            busboy.on("file", async (_fieldname, file, info) => {


                try {
                    if (uploadAborted) {
                        file.resume();
                        return;
                    }

                    if (!info.filename) {
                        file.resume();
                        return;
                    }

                    originalFilename = info.filename;
                    mimeType = info.mimeType;

                    // Validate file type early
                    const extension = path.extname(originalFilename).toLowerCase();
                 //   await this._validateFileType(mimeType, extension, res);

                    // Initialize upload progress tracking
                    this.activeUploads.set(uploadId, {
                        bytesReceived: 0,
                        totalBytes: 0,
                        startTime,
                        fileName: originalFilename
                    });

                    // Setup temp file path
                    const { tempDir, tempFilePath: tempPath } = await this._setupTempDirectory(userId);
                    tempFilePath = path.join(tempDir, `${uploadId}-${this._sanitizeFilename(originalFilename)}`);

                    // Create write stream with error handling
                    const writeStream = createWriteStream(tempFilePath, {
                        flags: 'w',
                        highWaterMark: 64 * 1024 // 64KB buffer
                    });

                    // Create hash stream for file integrity
                    const hashStream = createHash('sha256');

                    // Track upload progress and calculate hash
                    file.on("data", (chunk: Buffer) => {
                        fileSize += chunk.length;
                        hashStream.update(chunk);

                        // Update progress tracking
                        const progress = this.activeUploads.get(uploadId);
                        if (progress) {
                            progress.bytesReceived = fileSize;
                            this.activeUploads.set(uploadId, progress);
                        }


                        // Check file size limit during upload
                        if (fileSize > this.config.maxFileSize) {
                            uploadAborted = true;
                            file.destroy();
                            writeStream.destroy();
                            return next(this.handleError(res, new Error('File size exceeds limit'), 'File too large', 413));
                        }
                    });

                    file.on("error", (error: any) => {
                        uploadAborted = true;
                        writeStream.destroy();
                        throw error;
                    });

                    writeStream.on("error", (error) => {
                        uploadAborted = true;
                        throw error;
                    });

                    // Use pipeline for proper error handling and backpressure
                    await pipeline(file, writeStream);

                    if (uploadAborted) {
                        await this._cleanupTempFile(tempFilePath);
                        return;
                    }

                    // Finalize file hash
                    fileHash = hashStream.digest('hex');

                    // Verify file integrity
                    const tempStats = await fs.stat(tempFilePath);
                    if (tempStats.size !== fileSize) {
                        return next(this.handleError(res, new Error('File corruption detected during upload'), 'File upload corrupted', 500));
                    }

                    // Optional: Virus scanning
                    if (this.config.virusScanEnabled) {
                        await this._scanForVirus(tempFilePath);
                    }

                } catch (error) {
                    uploadAborted = true;
                    if (tempFilePath) {
                        await this._cleanupTempFile(tempFilePath);
                    }
                    next(error);
                }
            });

            // Handle upload completion
            busboy.on("finish", async () => {
                try {
                    if (uploadAborted || !tempFilePath || !originalFilename || !mimeType || fileSize === 0) {
                        return next(this.handleError(res, new Error('Upload incomplete or invalid'), 'Upload failed', 400));
                    }


                    // Clear timeout
                    this.cleanupUpload(uploadId);

                    const parentId = fields["parentId"];
                    const sanitizedFileName = this._sanitizeFilename(fields["fileName"] || originalFilename);
                    const extension = path.extname(sanitizedFileName).toLowerCase();


                    // console.log(" 111111stats111111 ")
                    // console.log(req.body)
                    // console.log(parentId)
                    // console.log(" 111111stats111111 ")



                    // Pre-flight validation
                    const { user, settings } = await this._validateRequest(userId, {
                        checkStorage: true, size: fileSize,
                    }, res);



                    // Validate file type again with settings
                    // await this._validateFileTypeWithSettings(mimeType, extension, settings, res);



                    // Handle parent folder validation
                    const parentFolder = await this._validateParentFolder(parentId, userId);

                    // console.log(" 1111111111parentFolder111111111111111111 ")
                    // console.log(parentId)
                    // console.log(parentFolder)
                    // console.log(" 1111111111parentFolder111111111111111111 ")

                    // Check for filename conflicts with retry logic
                    const finalFileName = await this._resolveFileNameConflict(sanitizedFileName, parentId, userId);


                    const exists = await this._checkFileExists(finalFileName, parentId, userId);
                    if (exists) {
                        await this._cleanupTempFile(tempFilePath);

                        throw new Error("Duplicate file detected - linking to existing file")
                    }

                    // const url = new URL(req.url!, `http://${req.headers.host}`);
                    // const url = `${req.protocol}://${req.get('host')}${finalPhysicalPath}`;

                    // // // Check for duplicate files by hash
                    // // const existingFile = await this._checkForDuplicateFile(parentId, userId);
                    // // if (existingFile) {
                    // console.log(" 1111111111parentFolder111111111111111111 ")
                    // console.log(url.origin)
                    // console.log(" 1111111111parentFolder111111111111111111 ")

                    //     await this._cleanupTempFile(tempFilePath);
                    //     return res.status(400).json({
                    //         message: "Duplicate file detected - linking to existing file"
                    //     });

                    // }

                    // Determine final storage path
                    const { finalPhysicalPath, userRootPath } = await this._determineFinalPath(
                        user.id,
                        parentFolder,
                        finalFileName,
                        settings
                    );
                    // Move file to final location with atomic operation
                    await this._moveFileAtomic(tempFilePath, finalPhysicalPath);


                    const systemSettings = await prisma.systemSettings.findFirst({ where: { id: 1 } });
                    const UPLOAD_DIR = systemSettings?.defaultStoragePath || "./uploads";
                    const user_RootPath = path.join(UPLOAD_DIR, userId, finalFileName);

                    // let finalPhysicalPath: string;
                    // if (parentFolder) {
                    //     finalPhysicalPath = path.join(parentFolder.filePath, fileName);
                    // } else {
                    //     finalPhysicalPath = path.join(user_RootPath, fileName);
                    // }

                    const finalPhysicalPath1 = finalPhysicalPath.replace(/\\/g, '/');
                    const userRootPath1 = userRootPath.replace(/\\/g, '/');


                    const url1 = new URL(req.url!, `http://${req.headers.host}`);
                    const url2 = `${req.protocol}://${req.get('host')}/${finalPhysicalPath}`;

                    // console.log(" 1111111111parentFolder111111111111111111 ")
                    // console.log(finalPhysicalPath1)
                    // console.log(url1.origin)
                    // console.log(`${url1.origin}/${finalPhysicalPath1}`)
                    // console.log(" 1111111111parentFolder111111111111111111 ")



                    // Create database record with transaction
                    const newFile = await this._createFileRecord({
                        sanitizedFileName: finalFileName,
                        originalFilename,
                        finalPhysicalPath,
                        fileSize,
                        mimeType,
                        extension,
                        fileHash: fileHash!,
                        userId,
                        parentId,
                        user,
                        parentFolder
                    });

                    res.status(201).json({ message: "Successful" });
                } catch (error) {
                    if (tempFilePath) {
                        await this._cleanupTempFile(tempFilePath);
                    }
                    next(error);
                }
            });

            // Handle busboy errors
            busboy.on("error", (error: any) => {
                this.cleanupUpload(uploadId);
                next(error);
            });

            // Handle request aborted
            req.on("aborted", () => {
                this.cleanupUpload(uploadId);
                if (tempFilePath) {
                    this._cleanupTempFile(tempFilePath);
                }
            });

            // Start processing
            req.pipe(busboy);

        } catch (error) {
            this.cleanupUpload(uploadId);
            next(error);
        }
    };

    private async _validateUploadRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes('multipart/form-data')) {
            throw this.handleError(res, new Error('Invalid content type'), 'Expected multipart/form-data', 400);
        }

        const contentLength = req.headers['content-length'];
        if (contentLength && parseInt(contentLength) > this.config.maxFileSize) {
            throw this.handleError(res, new Error('Request entity too large'), 'File size limit exceeded', 413);
        }
    }

    private async _setupTempDirectory(userId: string): Promise<{ tempDir: string; tempFilePath: string }> {
        const systemSettings = await prisma.systemSettings.findFirst({ where: { id: 1 } });
        const UPLOAD_DIR = systemSettings?.defaultStoragePath || "./uploads";
        const tempDir = path.join(UPLOAD_DIR, "temp", userId);

        await fs.mkdir(tempDir, { recursive: true });

        return { tempDir, tempFilePath: "" };
    }

    private async _validateFileType(mimeType: string, extension: string, res: Response): Promise<void> {
        if (!this.config.allowedMimeTypes.includes(mimeType)) {
            throw this.handleError(res, new Error(`File type ${mimeType} not allowed`), 'File type not allowed', 400);
        }

        if (!this.config.allowedExtensions.includes(extension)) {
            throw this.handleError(res, new Error(`File extension ${extension} not allowed`), 'File extension not allowed', 400);
        }
    }

    private async _validateFileTypeWithSettings(mimeType: string, _extension: string, settings: any, res: Response): Promise<void> {
        // Additional validation based on system settings
        if (settings.restrictedMimeTypes?.includes(mimeType)) {
            throw this.handleError(res, new Error('File type restricted by system policy'), 'File type restricted', 403);
        }
    }

    private async _validateParentFolder(parentId: string | null, userId: string): Promise<any> {
        if (!parentId) return null;

        const parentFolder = await prisma.file.findFirst({
            where: { id: parentId, userId, isFolder: true, isDeleted: false },
        });



        return parentFolder;
    }

    private async _resolveFileNameConflict(fileName: string, parentId: string | null, userId: string): Promise<string> {
        let finalFileName = fileName;
        let counter = 1;

        while (await this._fileExists(finalFileName, parentId, userId)) {
            const ext = path.extname(fileName);
            const baseName = path.basename(fileName, ext);
            finalFileName = `${baseName} (${counter})${ext}`;
            counter++;
        }

        return finalFileName;
    }

    private async _fileExists(fileName: string, parentId: string | null, userId: string): Promise<boolean> {
        const existing = await prisma.file.findFirst({
            where: {
                fileName,
                parentId,
                userId,
                isDeleted: false,
            },
        });
        return !!existing;
    }
    private async _checkFileExists(fileName: string, parentId: string | null, userId: string): Promise<boolean> {
        const existingFile = await prisma.file.findFirst({
            where: {
                fileName: fileName,
                parentId: parentId,
                userId: userId,
                isDeleted: false
            }
        });
        return existingFile !== null;
    }


    private async _generateUniqueFileName(fileName: string, parentId: string | null, userId: string): Promise<string> {
        let counter = 1;
        let newFileName = fileName;

        // Extract file extension
        const lastDotIndex = fileName.lastIndexOf('.');
        const name = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
        const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';

        while (await this._checkFileExists(newFileName, parentId, userId)) {
            newFileName = `${name} (${counter})${extension}`;
            counter++;
        }

        return newFileName;
    }

    private async _checkForDuplicateFile(parentId: string | null, userId: string): Promise<boolean> {
        const existing = await prisma.file.findFirst({
            where: { parentId, userId },
            select: { id: true },
        });

        const existingS = await prisma.file.findFirst({
            where: { parentId, userId },

        });


        console.log(" 1111111_checkForDuplicateFile1111111111111 ")
        console.log(parentId)
        console.log(userId)
        console.log(existing)
        console.log(existingS)
        console.log(" 1111111_checkForDuplicateFile11111111111111 ")

        return !!existing;
    }

    private async _checkForDuplicateFile1(hash: string, userId: string): Promise<any> {

        return await prisma.file.findFirst({
            where: {
                hash,
                userId,
                isDeleted: false,
            },
        });
    }

    private async _determineFinalPath(userId: string, parentFolder: any, fileName: string, _settings: any): Promise<{ finalPhysicalPath: string; userRootPath: string }> {
        const systemSettings = await prisma.systemSettings.findFirst({ where: { id: 1 } });
        const UPLOAD_DIR = systemSettings?.defaultStoragePath || "./uploads";
        const userRootPath = path.join(UPLOAD_DIR, userId);
        let finalPhysicalPath: string;
        if (parentFolder) {
            finalPhysicalPath = path.join(parentFolder.filePath, fileName);
        } else {
            finalPhysicalPath = path.join(userRootPath, fileName);
        }

        return { finalPhysicalPath, userRootPath };
    }

    private async _moveFileAtomic(tempPath: string, finalPath: string): Promise<void> {
        await fs.mkdir(path.dirname(finalPath), { recursive: true });

        // Use atomic move operation
        const tempFinalPath = `${finalPath}.tmp`;
        await fs.rename(tempPath, tempFinalPath);
        await fs.rename(tempFinalPath, finalPath);
    }

    private async _createFileRecord(data: any): Promise<any> {

        // console.log(" 8888888888888888888 ")
        // console.log(data)
        // console.log(" 8888888888888888888 ")

        const {
            sanitizedFileName,
            originalFilename,
            finalPhysicalPath,
            fileSize,
            mimeType,
            extension,
            fileHash,
            userId,
            parentId,
            user,

        } = data;

        let currentParentFolder;




        if (parentId === "null") {

            currentParentFolder = null;
        }
        else {
            currentParentFolder = parentId;
        }

        return await prisma.$transaction(async (tx) => {
            const fileRecord = await tx.file.create({
                data: {
                    fileName: sanitizedFileName,
                    originalName: originalFilename,
                    filePath: finalPhysicalPath,
                    type: getFileType(mimeType),
                    fileSize,
                    mimeType,
                    isFolder: false,
                    createdBy: userId,
                    modifiedBy: userId,
                    parentId: currentParentFolder,
                    fileType: FileType.FILE,
                    userId: user.id,
                    ownerId: userId,
                    extension,
                    hash: fileHash,
                },
            });


            // Update user storage usage atomically
            await tx.user.update({
                where: { id: user.id },
                data: {
                    storageUsed: { increment: BigInt(fileSize) },
                    totalFiles: { increment: 1 },
                },
            });


            // Update parent folder item count if applicable
            if (currentParentFolder) {
                await tx.file.update({
                    where: { id: currentParentFolder },
                    data: { itemCount: { increment: 1 } },
                });
            }


            return fileRecord;
        });
    }

    private async _scanForVirus(_filePath: string): Promise<void> {
        // Implement virus scanning logic
        // This could integrate with ClamAV or similar
        return new Promise((resolve, _reject) => {
            // Placeholder for virus scanning
            resolve();
        });
    }



    private async _compressFile(filePath: string): Promise<void> {
        try {
            //   const zlib = await import('zlib');
            const { createReadStream, createWriteStream } = await import('fs');
            const { pipeline } = await import('stream/promises');
            const { Transform } = await import('stream');

            // Get file stats for compression decision
            const stats = await fs.stat(filePath);
            const originalSize = stats.size;

            // Skip compression for very small files (< 1KB)
            if (originalSize < 1024) {
                return;
            }

            // Determine best compression algorithm based on file type
            const compressionConfig = this._getCompressionConfig(filePath, originalSize);

            if (!compressionConfig.shouldCompress) {
                return;
            }

            // Create temporary compressed file path
            // const compressedPath = `${filePath}.compressed`;
            const tempPath = `${filePath}.compressing`;

            // Create streams
            const readStream = createReadStream(filePath);
            const writeStream = createWriteStream(tempPath);

            // Create compression stream based on algorithm
            const compressor = this._createCompressor(compressionConfig);

            // Track compression ratio
            let compressedSize = 0;
            const compressionTracker = new Transform({
                transform(chunk, _encoding, callback) {
                    compressedSize += chunk.length;
                    callback(null, chunk);
                }
            });

            // Add compression header with metadata
            const header = this._createCompressionHeader(compressionConfig, originalSize);
            writeStream.write(header);

            // Compress the file
            await pipeline(readStream, compressor, compressionTracker, writeStream);

            // Calculate compression ratio
            const finalCompressedSize = compressedSize + header.length;
            const compressionRatio = (originalSize - finalCompressedSize) / originalSize;

            // Only keep compressed version if it's significantly smaller
            if (compressionRatio > 0.1) { // At least 10% reduction
                // Atomically replace original file with compressed version
                await fs.rename(tempPath, filePath);

                // Update file metadata in database
                // await this._updateFileCompressionInfo(filePath, {
                //     isCompressed: true,
                //     compressionAlgorithm: compressionConfig.algorithm,
                //     originalSize,
                //     compressedSize: finalCompressedSize,
                //     compressionRatio,
                //     compressedAt: new Date(),
                // });

            } else {
                // Compression not worth it, keep original
                await fs.unlink(tempPath);
            }

        } catch (error: any) {
            console.error(`Compression failed for file ${filePath}:`, error);

            // Cleanup temp files on error
            const tempPath = `${filePath}.compressing`;
            try {
                await fs.unlink(tempPath);
            } catch (cleanupError) {
                console.error(`Failed to cleanup temp file: ${tempPath}`, cleanupError);
            }
            throw new Error(`File compression failed: ${error.message}`);
        }
    }

    private _getCompressionConfig(filePath: string, fileSize: number): CompressionConfig {
        const extension = path.extname(filePath).toLowerCase();
        //const fileName = path.basename(filePath).toLowerCase();

        // Files that are already compressed or don't benefit from compression
        const skipCompressionExtensions = [
            '.zip', '.rar', '.7z', '.gz', '.bz2', '.xz', '.tar.gz', '.tgz',
            '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif',
            '.mp3', '.aac', '.ogg', '.m4a', '.flac', '.wma',
            '.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm',
            '.pdf', '.docx', '.xlsx', '.pptx', '.odt', '.ods', '.odp'
        ];

        // Files that compress very well
        const highCompressionExtensions = [
            '.txt', '.csv', '.json', '.xml', '.html', '.css', '.js', '.ts',
            '.sql', '.log', '.md', '.yaml', '.yml', '.ini', '.conf'
        ];

        // Files that compress moderately well
        const mediumCompressionExtensions = [
            '.doc', '.xls', '.ppt', '.rtf', '.svg', '.eps'
        ];

        if (skipCompressionExtensions.includes(extension)) {
            return { shouldCompress: false, algorithm: 'gzip', level: 0 }; // Default to a valid algorithm even if not compressing
        }

        // Choose compression algorithm and level based on file type and size
        let algorithm: CompressionAlgorithm;
        let level: number;

        if (highCompressionExtensions.includes(extension)) {
            // Text files compress very well with gzip
            algorithm = 'gzip';
            level = fileSize > 10 * 1024 * 1024 ? 6 : 9; // Lower level for large files
        } else if (mediumCompressionExtensions.includes(extension)) {
            // Office documents - moderate compression
            algorithm = 'deflate';
            level = 6;
        } else {
            // Unknown file type - try light compression
            algorithm = 'gzip';
            level = 3;
        }

        // Adjust level based on file size for performance
        if (fileSize > 100 * 1024 * 1024) { // > 100MB
            level = Math.min(level, 3); // Use faster compression for large files
        }

        return { shouldCompress: true, algorithm, level };
    }

    private _createCompressor(config: CompressionConfig): any {
        const zlib = require('zlib');

        const options = {
            level: config.level,
            windowBits: 15,
            memLevel: 8,
            strategy: zlib.constants.Z_DEFAULT_STRATEGY,
        };

        switch (config.algorithm) {
            case 'gzip':
                return zlib.createGzip(options);
            case 'deflate':
                return zlib.createDeflate(options);
            case 'brotli':
                return zlib.createBrotliCompress({
                    params: {
                        [zlib.constants.BROTLI_PARAM_QUALITY]: config.level,
                        [zlib.constants.BROTLI_PARAM_SIZE_HINT]: 0,
                    }
                });
            default:
                throw new Error(`Unsupported compression algorithm: ${config.algorithm}`);
        }
    }

    private _createCompressionHeader(config: CompressionConfig, originalSize: number): Buffer {
        // Create header with compression metadata
        const header = Buffer.alloc(32);
        let offset = 0;

        // Magic bytes
        header.write('COMP', offset, 4, 'utf8');
        offset += 4;

        // Version
        header.writeUInt8(1, offset);
        offset += 1;

        // Algorithm (1 byte)
        const algorithmMap = { 'gzip': 1, 'deflate': 2, 'brotli': 3 };
        header.writeUInt8(algorithmMap[config.algorithm] || 0, offset);
        offset += 1;

        // Compression level (1 byte)
        header.writeUInt8(config.level, offset);
        offset += 1;

        // Reserved (1 byte)
        header.writeUInt8(0, offset);
        offset += 1;

        // Original size (8 bytes)
        header.writeBigUInt64BE(BigInt(originalSize), offset);
        offset += 8;

        // Timestamp (8 bytes)
        header.writeBigUInt64BE(BigInt(Date.now()), offset);
        offset += 8;

        // CRC32 of header (4 bytes) - calculated later
        const crc32 = require('crc-32');
        const headerCrc = crc32.buf(header.slice(0, 28));
        header.writeUInt32BE(headerCrc >>> 0, 28);

        return header;
    }

    // private async _updateFileCompressionInfo(filePath: string, info: CompressionInfo): Promise<void> {
    //     try {
    //         await prisma.file.update({
    //             where: { filePath },
    //             data: {
    //                 isCompressed: info.isCompressed,
    //                 compressionAlgorithm: info.compressionAlgorithm,
    //                 originalSize: info.originalSize,
    //                 compressedSize: info.compressedSize,
    //                 compressionRatio: info.compressionRatio,
    //                 compressedAt: info.compressedAt,
    //             }
    //         });
    //     } catch (error) {
    //         console.error(`Failed to update compression info for ${filePath}:`, error);
    //         // Don't throw here as compression succeeded
    //     }
    // }

    // Method to decompress file when needed
    // private async _decompressFile(filePath: string): Promise<string> {
    //     try {
    //         const { createReadStream, createWriteStream } = await import('fs');
    //         const { pipeline } = await import('stream/promises');
    //         const { Transform } = await import('stream');

    //         // Check if file is actually compressed
    //         const isCompressed = await this._isFileCompressed(filePath);
    //         if (!isCompressed) {
    //             return filePath; // Return original path if not compressed
    //         }

    //         // Create temporary decompressed file path
    //         const decompressedPath = `${filePath}.decompressed`;
    //         const tempPath = `${filePath}.decompressing`;

    //         // Create streams
    //         const readStream = createReadStream(filePath);
    //         const writeStream = createWriteStream(tempPath);

    //         // Read and parse header
    //         const header = await this._readCompressionHeader(readStream);

    //         // Create decompressor based on algorithm
    //         const decompressor = this._createDecompressor(header.algorithm);

    //         // Skip header bytes and decompress
    //         const skipHeaderTransform = new Transform({
    //             objectMode: false,
    //             transform(chunk, encoding, callback) {
    //                 // Header already read, just pass through
    //                 callback(null, chunk);
    //             }
    //         });

    //         // Decompress the file
    //         await pipeline(readStream, decompressor, writeStream);

    //         // Verify decompressed size matches original
    //         const decompressedStats = await fs.stat(tempPath);
    //         if (decompressedStats.size !== header.originalSize) {
    //             throw new Error(`Decompressed size mismatch. Expected: ${header.originalSize}, Got: ${decompressedStats.size}`);
    //         }

    //         // Return path to decompressed file
    //         await fs.rename(tempPath, decompressedPath);
    //         return decompressedPath;

    //     } catch (error: any) {
    //         console.error(`Decompression failed for file ${filePath}:`, error);

    //         // Cleanup temp files on error
    //         const tempPath = `${filePath}.decompressing`;
    //         try {
    //             await fs.unlink(tempPath);
    //         } catch (cleanupError) {
    //             console.error(`Failed to cleanup temp file: ${tempPath}`, cleanupError);
    //         }
    //         throw new Error(`File decompression failed: ${error.message}`);
    //     }
    // }


    // private async _readCompressionHeader(readStream: any): Promise<CompressionHeader> {
    //     return new Promise((resolve, reject) => {
    //         const headerBuffer = Buffer.alloc(32);
    //         let headerRead = 0;

    //         const onData = (chunk: Buffer) => {
    //             const bytesToRead = Math.min(chunk.length, 32 - headerRead);
    //             chunk.copy(headerBuffer, headerRead, 0, bytesToRead);
    //             headerRead += bytesToRead;

    //             if (headerRead >= 32) {
    //                 readStream.removeListener('data', onData);
    //                 readStream.removeListener('error', onError);

    //                 try {
    //                     const header = this._parseCompressionHeader(headerBuffer);
    //                     resolve(header);
    //                 } catch (error) {
    //                     reject(error);
    //                 }
    //             }
    //         };

    //         const onError = (error: Error) => {
    //             readStream.removeListener('data', onData);
    //             readStream.removeListener('error', onError);
    //             reject(error);
    //         };

    //         readStream.on('data', onData);
    //         readStream.on('error', onError);
    //     });
    // }

    // private _parseCompressionHeader(buffer: Buffer): CompressionHeader {
    //     let offset = 0;

    //     // Check magic bytes
    //     const magic = buffer.toString('utf8', offset, offset + 4);
    //     if (magic !== 'COMP') {
    //         throw new Error('Invalid compression header magic bytes');
    //     }
    //     offset += 4;

    //     // Version
    //     const version = buffer.readUInt8(offset);
    //     if (version !== 1) {
    //         throw new Error(`Unsupported compression version: ${version}`);
    //     }
    //     offset += 1;

    //     // Algorithm
    //     const algorithmCode = buffer.readUInt8(offset);
    //     const algorithmMap = { 1: 'gzip', 2: 'deflate', 3: 'brotli' };
    //     const algorithm = algorithmMap[algorithmCode as keyof typeof algorithmMap];
    //     if (!algorithm) {
    //         throw new Error(`Unknown compression algorithm: ${algorithmCode}`);
    //     }
    //     offset += 1;

    //     // Compression level
    //     const level = buffer.readUInt8(offset);
    //     offset += 1;

    //     // Reserved
    //     offset += 1;

    //     // Original size
    //     const originalSize = Number(buffer.readBigUInt64BE(offset));
    //     offset += 8;

    //     // Timestamp
    //     const timestamp = Number(buffer.readBigUInt64BE(offset));
    //     offset += 8;

    //     // Verify CRC32
    //     const storedCrc = buffer.readUInt32BE(offset);
    //     const crc32 = require('crc-32');
    //     const calculatedCrc = crc32.buf(buffer.slice(0, 28));

    //     if (storedCrc !== (calculatedCrc >>> 0)) {
    //         throw new Error('Compression header CRC mismatch');
    //     }

    //     return {
    //         version,
    //         algorithm: algorithm as CompressionAlgorithm,
    //         level,
    //         originalSize,
    //         timestamp,
    //     };
    // }

    // private _createDecompressor(algorithm: CompressionAlgorithm): any {
    //     const zlib = require('zlib');

    //     switch (algorithm) {
    //         case 'gzip':
    //             return zlib.createGunzip();
    //         case 'deflate':
    //             return zlib.createInflate();
    //         case 'brotli':
    //             return zlib.createBrotliDecompress();
    //         default:
    //             throw new Error(`Unsupported decompression algorithm: ${algorithm}`);
    //     }
    // }

    // private async _isFileCompressed(filePath: string): Promise<boolean> {
    //     try {
    //         const { createReadStream } = await import('fs');
    //         const stream = createReadStream(filePath, { start: 0, end: 4 });

    //         return new Promise((resolve, reject) => {
    //             stream.on('data', (chunk: Buffer) => {
    //                 const magic = chunk.toString('utf8', 0, 4);
    //                 resolve(magic === 'COMP');
    //             });

    //             stream.on('error', reject);
    //             stream.on('end', () => resolve(false));
    //         });
    //     } catch (error) {
    //         return false;
    //     }
    // }

    private _shouldCompress(extension: string): boolean {
        const compressibleExtensions = [
            '.txt', '.csv', '.json', '.xml', '.html', '.css', '.js', '.ts',
            '.sql', '.log', '.md', '.yaml', '.yml', '.ini', '.conf',
            '.doc', '.xls', '.ppt', '.rtf', '.svg', '.eps'
        ];
        return compressibleExtensions.includes(extension);
    }

    // private async _encryptFile(filePath: string, userId: string): Promise<void> {
    //     try {
    //         const crypto = await import('crypto');
    //         const { createReadStream, createWriteStream } = await import('fs');
    //         const { pipeline } = await import('stream/promises');
    //         const { Transform } = await import('stream');

    //         // Generate encryption key for user (in production, use proper key management)
    //         const encryptionKey = await this._getUserEncryptionKey(userId);

    //         // Generate random IV for this file
    //         const iv = crypto.randomBytes(16);

    //         // Create cipher
    //         const cipher = crypto.createCipher('aes-256-gcm', encryptionKey);
    //         cipher.setAAD(Buffer.from(userId, 'utf8')); // Additional authenticated data

    //         // Create temporary encrypted file path
    //         // const encryptedPath = `${filePath}.encrypted`;
    //         const tempPath = `${filePath}.encrypting`;

    //         // Create streams
    //         const readStream = createReadStream(filePath);
    //         const writeStream = createWriteStream(tempPath);

    //         // Create encryption transform stream
    //         const encryptionTransform = new Transform({
    //             transform(chunk, _encoding, callback) {
    //                 try {
    //                     const encrypted = cipher.update(chunk);
    //                     callback(null, encrypted);
    //                 } catch (error) {
    //                     callback(error as Error);
    //                 }
    //             },
    //             flush(callback) {
    //                 try {
    //                     const final = cipher.final();
    //                     const authTag = cipher.getAuthTag();

    //                     // Prepend IV and auth tag to the encrypted data
    //                     const header = Buffer.concat([
    //                         Buffer.from('ENC', 'utf8'), // Magic bytes
    //                         Buffer.from([1]), // Version
    //                         iv, // 16 bytes
    //                         authTag, // 16 bytes
    //                     ]);

    //                     this.push(header);
    //                     this.push(final);
    //                     callback();
    //                 } catch (error) {
    //                     callback(error as Error);
    //                 }
    //             }
    //         });

    //         // Encrypt the file
    //         await pipeline(readStream, encryptionTransform, writeStream);

    //         // Atomically replace original file with encrypted version
    //         await fs.rename(tempPath, filePath);

    //         // Update file metadata in database
    //         await prisma.file.update({
    //             where: { filePath: filePath }, // Assuming filePath is unique or you have another unique identifier
    //             data: {
    //                 isEncrypted: true,
    //                 encryptionAlgorithm: 'aes-256-gcm',
    //                 encryptedAt: new Date(),
    //             }
    //         });


    //     } catch (error: any) {
    //         console.error(`Encryption failed for file ${filePath}:`, error);

    //         // Cleanup temp files on error
    //         const tempPath = `${filePath}.encrypting`;
    //         try {
    //             await fs.unlink(tempPath);
    //         } catch (cleanupError) {
    //             console.error(`Failed to cleanup temp file: ${tempPath}`, cleanupError);
    //         }
    //         throw new Error(`File encryption failed: ${error.message}`);
    //     }
    // }

    // private async _getUserEncryptionKey(userId: string): Promise<Buffer> {
    //     try {
    //         // Check if user already has an encryption key
    //         let userKey = await prisma.userEncryptionKey.findUnique({
    //             where: { userId }
    //         });

    //         if (!userKey) {
    //             // Generate new key for user
    //             const crypto = await import('crypto');
    //             const masterKey = this._getMasterEncryptionKey();
    //             const userSalt = crypto.randomBytes(32);

    //             // Derive user-specific key using PBKDF2
    //             const derivedKey = crypto.pbkdf2Sync(
    //                 masterKey,
    //                 userSalt,
    //                 100000, // iterations
    //                 32, // key length
    //                 'sha256'
    //             );

    //             // Store encrypted key in database
    //             const keyEncrypted = this._encryptKeyForStorage(derivedKey, masterKey);

    //             userKey = await prisma.userEncryptionKey.create({
    //                 data: {
    //                     userId,
    //                     encryptedKey: keyEncrypted.toString('base64'),
    //                     salt: userSalt.toString('base64'),
    //                     algorithm: 'aes-256-gcm',
    //                     keyDerivation: 'pbkdf2',
    //                     iterations: 100000,
    //                     createdAt: new Date(),
    //                 }
    //             });
    //         }

    //         // Decrypt and return the key
    //         const masterKey = this._getMasterEncryptionKey();
    //         const encryptedKey = Buffer.from(userKey.encryptedKey, 'base64');
    //         const decryptedKey = this._decryptKeyFromStorage(encryptedKey, masterKey);

    //         return decryptedKey;

    //     } catch (error) {
    //         console.error(`Failed to get encryption key for user ${userId}:`, error);
    //         throw new Error('Failed to retrieve encryption key');
    //     }
    // }

    // private _getMasterEncryptionKey(): Buffer {
    //     // In production, this should come from:
    //     // 1. Environment variables
    //     // 2. Key management service (AWS KMS, Azure Key Vault, etc.)
    //     // 3. Hardware Security Module (HSM)
    //     const masterKeyHex = process.env.MASTER_ENCRYPTION_KEY;

    //     if (!masterKeyHex) {
    //         throw new Error("Master encryption key not configured");
    //     }

    //     return Buffer.from(masterKeyHex, 'hex');
    // }

    // private _encryptKeyForStorage(key: Buffer, masterKey: Buffer): Buffer {
    //     const crypto = require('crypto');
    //     const iv = crypto.randomBytes(16);
    //     const cipher = crypto.createCipher('aes-256-gcm', masterKey);

    //     let encrypted = cipher.update(key);
    //     encrypted = Buffer.concat([encrypted, cipher.final()]);

    //     const authTag = cipher.getAuthTag();

    //     // Combine IV, auth tag, and encrypted data
    //     return Buffer.concat([iv, authTag, encrypted]);
    // }

    // private _decryptKeyFromStorage(encryptedData: Buffer, masterKey: Buffer): Buffer {
    //     const crypto = require('crypto');

    //     // Extract IV, auth tag, and encrypted data
    //     const iv = encryptedData.slice(0, 16);
    //     const authTag = encryptedData.slice(16, 32);
    //     const encrypted = encryptedData.slice(32);

    //     const decipher = crypto.createDecipher('aes-256-gcm', masterKey);
    //     decipher.setAuthTag(authTag);

    //     let decrypted = decipher.update(encrypted);
    //     decrypted = Buffer.concat([decrypted, decipher.final()]);

    //     return decrypted;
    // }

    // Method to decrypt file when needed
    // private async _decryptFile(filePath: string, userId: string): Promise<string> {
    //     try {
    //         const crypto = await import('crypto');
    //         const { createReadStream, createWriteStream } = await import('fs');
    //         const { pipeline } = await import('stream/promises');
    //         const { Transform } = await import('stream');

    //         // Get user's encryption key
    //         const encryptionKey = await this._getUserEncryptionKey(userId);

    //         // Create temporary decrypted file path
    //         const decryptedPath = `${filePath}.decrypted`;
    //         const tempPath = `${filePath}.decrypting`;

    //         // Create streams
    //         const readStream = createReadStream(filePath);
    //         const writeStream = createWriteStream(tempPath);

    //         let headerProcessed = false;
    //         let iv: Buffer;
    //         let authTag: Buffer;
    //         let decipher: any;

    //         // Create decryption transform stream
    //         const decryptionTransform = new Transform({
    //             transform(chunk, _encoding, callback) {
    //                 try {
    //                     if (!headerProcessed) {
    //                         // Process header to extract IV and auth tag
    //                         const magic = chunk.slice(0, 3).toString('utf8');
    //                         if (magic !== 'ENC') {
    //                             throw new Error('Invalid encrypted file format');
    //                         }

    //                         const version = chunk.slice(3, 4)[0];
    //                         if (version !== 1) {
    //                             throw new Error('Unsupported encryption version');
    //                         }

    //                         iv = chunk.slice(4, 20);
    //                         authTag = chunk.slice(20, 36);

    //                         // Create decipher
    //                         decipher = crypto.createDecipher('aes-256-gcm', encryptionKey);
    //                         decipher.setAuthTag(authTag);
    //                         decipher.setAAD(Buffer.from(userId, 'utf8'));

    //                         // Process remaining data
    //                         const encryptedData = chunk.slice(36);
    //                         if (encryptedData.length > 0) {
    //                             const decrypted = decipher.update(encryptedData);
    //                             callback(null, decrypted);
    //                         } else {
    //                             callback();
    //                         }

    //                         headerProcessed = true;
    //                     } else {
    //                         // Decrypt chunk
    //                         const decrypted = decipher.update(chunk);
    //                         callback(null, decrypted);
    //                     }
    //                 } catch (error) {
    //                     callback(error as Error);
    //                 }
    //             },
    //             flush(callback) {
    //                 try {
    //                     if (decipher) {
    //                         const final = decipher.final();
    //                         this.push(final);
    //                     }
    //                     callback();
    //                 } catch (error) {
    //                     callback(error as Error);
    //                 }
    //             }
    //         });

    //         // Decrypt the file
    //         await pipeline(readStream, decryptionTransform, writeStream);

    //         // Return path to decrypted file
    //         await fs.rename(tempPath, decryptedPath);
    //         return decryptedPath;

    //     } catch (error: any) {
    //         console.error(`Decryption failed for file ${filePath}:`, error);

    //         // Cleanup temp files on error
    //         const tempPath = `${filePath}.decrypting`;
    //         try {
    //             await fs.unlink(tempPath);
    //         } catch (cleanupError) {
    //             console.error(`Failed to cleanup temp file: ${tempPath}`, cleanupError);
    //         }
    //         throw new Error(`File decryption failed: ${error.message}`);
    //     }
    // }

    // Method to check if file is encrypted
    // private async _isFileEncrypted(filePath: string): Promise<boolean> {
    //     try {
    //         const { createReadStream } = await import('fs');
    //         const stream = createReadStream(filePath, { start: 0, end: 3 });

    //         return new Promise((resolve, reject) => {
    //             stream.on('data', (chunk) => {
    //                 const magic = chunk.toString('utf8');
    //                 resolve(magic === 'ENC');
    //             });

    //             stream.on('error', reject);
    //             stream.on('end', () => resolve(false));
    //         });
    //     } catch (error) {
    //         return false;
    //     }
    // }

    private async _cleanupTempFile(filePath: string): Promise<void> {
        try {
            await fs.unlink(filePath);
        } catch (error) {
            // Log error but don't throw
            console.error(`Failed to cleanup temp file: ${filePath}`, error);
        }
    }

    private cleanupUpload(uploadId: string): void {
        const timeout = this.uploadTimeouts.get(uploadId);
        if (timeout) {
            clearTimeout(timeout);
            this.uploadTimeouts.delete(uploadId);
        }
        this.activeUploads.delete(uploadId);
    }

    private _sanitizeFilename(filename: string): string {
        return filename
            .replace(/[^a-zA-Z0-9\-_\.]/g, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^_|_$/g, '')
            .substring(0, 255);
    }

    private async _validateRequest(userId: string, options: { checkStorage: boolean; size: number }, res: Response): Promise<{ user: any; settings: any }> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { subscriptions: true }
        });

        if (!user) {
            throw this.handleError(res, new Error('User not found'), 'User not found', 404);
        }

        const settings = await prisma.systemSettings.findFirst({ where: { id: 1 } });


        //TODO
        // if (options.checkStorage) {
        //     const storageLimit = user.subscriptions?.storageLimit || settings?.defaultMaxStorage || 0;
        //     const currentUsage = Number(user.storageUsed || 0);

        //     if (currentUsage + options.size > storageLimit) {
        //         throw this.handleError(res, new Error('Storage limit exceeded'), 'Storage limit exceeded', 413);
        //     }
        // }

        return { user, settings };
    }

    private async _logActivity(userId: string, activity: any): Promise<void> {
        try {
            await prisma.activityLog.create({
                data: {
                    userId,
                    activityType: activity.activityType,
                    fileId: activity.fileId,
                    metadata: activity.metadata,
                    timestamp: new Date(),
                },
            });
        } catch (error) {
            console.error("Failed to log activity:", error);
        }
    }

    // Method to get upload progress
    public getUploadProgress(uploadId: string): UploadProgress | null {
        return this.activeUploads.get(uploadId) || null;
    }

    // Method to cancel upload
    public cancelUpload(uploadId: string): void {
        this.cleanupUpload(uploadId);
    }
}