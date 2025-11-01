export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  UPLOAD_QUEUE: 'upload_queue',
  UPLOAD_HISTORY: 'upload_history',
  NOTIFICATION_PREFERENCES: 'notification_preferences',
  PUSH_TOKEN: 'push_token',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
  },
  FILES: {
    LIST: '/files',
    UPLOAD: '/files/upload',
    DOWNLOAD: '/files/download',
    DELETE: '/files',
    MOVE: '/files/move',
    COPY: '/files/copy',
    RENAME: '/files/rename',
    SHARE: '/files/share',
  },
  DOCUMENTS: {
    LIST: '/documents',
    CREATE: '/documents',
    UPDATE: '/documents',
    DELETE: '/documents',
    TEMPLATES: '/documents/templates',
    EXPORT: '/documents/export',
  },
  FOLDERS: {
    LIST: '/folders',
    CREATE: '/folders',
    UPDATE: '/folders',
    DELETE: '/folders',
  },
  SHARING: {
    CREATE: '/sharing',
    UPDATE: '/sharing',
    DELETE: '/sharing',
    LIST: '/sharing',
  },
} as const;

export const FILE_TYPES = {
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'],
  VIDEO: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'],
  AUDIO: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'],
  DOCUMENT: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'],
  SPREADSHEET: ['xls', 'xlsx', 'csv', 'ods'],
  PRESENTATION: ['ppt', 'pptx', 'odp'],
  ARCHIVE: ['zip', 'rar', '7z', 'tar', 'gz'],
  CODE: ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'xml', 'py', 'java', 'cpp', 'c', 'php'],
} as const;

export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_CONCURRENT_UPLOADS: 3,
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

export const NOTIFICATION_TYPES = {
  UPLOAD_COMPLETE: 'upload_complete',
  UPLOAD_FAILED: 'upload_failed',
  SHARE_RECEIVED: 'share_received',
  DOCUMENT_UPDATED: 'document_updated',
  COLLABORATION_INVITE: 'collaboration_invite',
} as const;

export const PERMISSIONS = {
  VIEW: 'view',
  EDIT: 'edit',
  ADMIN: 'admin',
  OWNER: 'owner',
} as const;

export const SHARE_TYPES = {
  PRIVATE: 'private',
  LINK: 'link',
  PUBLIC: 'public',
} as const;