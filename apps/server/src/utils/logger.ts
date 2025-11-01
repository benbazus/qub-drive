import { NODE_ENV } from "@/config/auth.config";



enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
}

const log = (level: LogLevel, message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        ...(data && { data }),
    };

    if (NODE_ENV === "production" || NODE_ENV === "staging") {
        // In production, send structured logs to a logging service (e.g., CloudWatch, Splunk)
        // For now, just stringify for console output
        console.log(JSON.stringify(logEntry));
    } else {
        // In development, pretty print
        switch (level) {
            case LogLevel.ERROR:
                console.error(`[${timestamp}] [${level}] ${message}`, data || "");
                break;
            case LogLevel.WARN:
                console.warn(`[${timestamp}] [${level}] ${message}`, data || "");
                break;
            case LogLevel.INFO:
                console.info(`[${timestamp}] [${level}] ${message}`, data || "");
                break;
            case LogLevel.DEBUG:
                console.debug(`[${timestamp}] [${level}] ${message}`, data || "");
                break;
        }
    }
};

export const logger = {
    debug: (message: string, data?: any) => log(LogLevel.DEBUG, message, data),
    info: (message: string, data?: any) => log(LogLevel.INFO, message, data),
    warn: (message: string, data?: any) => log(LogLevel.WARN, message, data),
    error: (message: string, data?: any) => log(LogLevel.ERROR, message, data),
};

// src/constants/errors.ts
export const ERROR_MESSAGES = {
    FILE_ID_REQUIRED: 'File ID is required',
    FILE_NOT_FOUND: 'File not found',
    FOLDER_NOT_FOUND: 'Destination folder not found',
    STORAGE_LIMIT_EXCEEDED: 'Storage limit exceeded',
    FILE_EXISTS_DB: 'File with this name already exists in the database',
    FILE_EXISTS_FS: 'File with this name already exists in the file system',
    INVALID_FILE_NAME: 'Invalid file name: must be 1-255 characters and exclude < > : " / \\ | ? *',
    USER_NOT_FOUND: 'User not found',
    UNAUTHORIZED: 'Unauthorized: User not authenticated',
    COPY_FAILED: 'Error copying file',



    INVALID_FOLDER_ID: 'Invalid or missing folder ID',

    INTERNAL_SERVER_ERROR: 'Internal server error: Failed to fetch folders',

    INVALID_FILE_ID: 'Invalid or missing file ID',

    TARGET_FOLDER_NOT_FOUND: 'Target folder not found',
    INVALID_MOVE: 'Cannot move folder into itself or its subfolders',
    NAME_CONFLICT: 'A file with this name already exists in the target location',
    INVALID_FILE_PATH: 'File path is missing',
    MOVE_FAILED: 'Failed to move file',

};