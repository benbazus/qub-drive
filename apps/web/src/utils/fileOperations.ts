export class FileOperationError extends Error {

    constructor(
        message: string,
        public readonly operation: string,
        public readonly statusCode?: number,
        public readonly cause?: unknown
    ) {
        super(message);
        this.name = 'FileOperationError';
        Object.setPrototypeOf(this, FileOperationError.prototype);
    }

    static isFileOperationError(error: unknown): error is FileOperationError {
        return error instanceof FileOperationError;
    }
}