/**
 * Format bytes to human-readable file size
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
};

/**
 * Get expiration date string from days
 */
export const getExpirationDate = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

/**
 * Calculate days remaining until expiration
 */
export const getDaysRemaining = (expirationDate: string): number => {
    const expDate = new Date(expirationDate);
    const now = new Date();
    const diff = expDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

/**
 * Check if a transfer is expired
 */
export const isTransferExpired = (expirationDate: string): boolean => {
    return getDaysRemaining(expirationDate) === 0;
};

/**
 * Generate full share link
 */
export const getFullShareLink = (shareLink: string): string => {
    return `${window.location.origin}/download/${shareLink}`;
};
