export interface FileMetadata {
    id: number;
    file: File;
    name: string;
    size: string;
    rawSize: number;
    type: string;
}

export interface TransferFile {
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    downloadUrl?: string;
}

export interface TransferData {
    id: string;
    title?: string;
    message?: string;
    senderEmail?: string;
    recipientEmail?: string;
    files: TransferFile[];
    totalSize: number;
    expirationDate: string;
    hasPassword: boolean;
    downloadLimit?: number;
    trackingEnabled: boolean;
    createdAt: string;
}

export interface TransferFormData {
    message: string;
    recipientEmail: string;
}

export interface AdvancedOptions {
    password: string;
    showPassword: boolean;
    expirationDays: number;
    downloadLimit: number | null;
    enableTracking: boolean;
    showAdvanced: boolean;
}

export interface UploadState {
    isUploading: boolean;
    progress: number;
}

export interface DownloadState {
    data: TransferData | null;
    enteredPassword: string;
    passwordError: boolean;
    isDownloading: boolean;
    progress: number;
    complete: boolean;
    fileId: string | null;
}

export interface DownloadRecord {
    id: string;
    ipAddress: string;
    location?: string;
    downloadedAt: string;
    userAgent?: string;
}

export interface DownloadStats {
    totalDownloads: number;
    uniqueDownloaders: number;
    lastDownload: string | null;
    downloads: DownloadRecord[];
}

export interface CreateTransferRequest {
    files: File[];
    title?: string;
    message?: string;
    senderEmail?: string;
    recipientEmail?: string;
    password?: string;
    expirationDays: number;
    downloadLimit?: number;
    trackingEnabled: boolean;
    shareLink: string;
}

export interface CreateTransferResponse {
    success: boolean;
    data: {
        id: string;
        shareLink: string;
        expiresAt: string;
    };
    message?: string;
}

export interface FetchTransferResponse {
    success: boolean;
    data: TransferData | null;
    error?: string;
}

export interface FetchStatsResponse {
    success: boolean;
    data: DownloadStats | null;
    error?: string;
}

export interface DownloadFileRequest {
    transferLink: string;
    fileId: string;
    password?: string;
}

export type ViewType = 'upload' | 'success' | 'download';

export interface AlertProps {
    type: 'error' | 'warning' | 'success' | 'info';
    children: React.ReactNode;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string;
    children: React.ReactNode;
    disabled?: boolean;
}

export interface ProgressBarProps {
    progress: number;
    gradient: string;
}
