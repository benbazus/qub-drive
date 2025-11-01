export const FILE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  VIDEO: 100 * 1024 * 1024, // 100MB
  DOCUMENT: 50 * 1024 * 1024, // 50MB
  DEFAULT: 25 * 1024 * 1024, // 25MB
} as const;

export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
] as const;

export const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
] as const;

export const SUPPORTED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/rtf',
] as const;

export const SUPPORTED_SPREADSHEET_TYPES = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
] as const;

export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  FILES: '/api/files',
  SHARING: '/api/sharing',
  COLLABORATION: '/api/collaboration',
  FORMS: '/api/forms',
  SPREADSHEETS: '/api/spreadsheets',
} as const;

export const WEBSOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  USER_TYPING: 'user_typing',
  DOCUMENT_CHANGE: 'document_change',
  CURSOR_MOVE: 'cursor_move',
} as const;