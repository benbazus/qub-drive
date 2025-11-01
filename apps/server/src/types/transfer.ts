
export interface CreateTransferDTO {
    userId?: string;
    title?: string;
    message?: string;
    senderEmail?: string;
    recipientEmail?: string;
    password?: string;
    expirationDays: number;
    downloadLimit?: number;
    trackingEnabled: boolean;
    shareLink: string;
    clientOrigin?: string;
}

export interface UploadedFileData {
    fileName: string;
    fileSize: number;
    mimeType: string;
    buffer: Buffer;
}

export interface DownloadStatsResponse {
    totalDownloads: number;
    uniqueDownloaders: number;
    lastDownload: Date | null;
    downloads: {
        id: string;
        ipAddress: string;
        location: string | null;
        downloadedAt: Date;
    }[];
}
