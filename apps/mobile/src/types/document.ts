export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  folderId?: string;
  isTemplate?: boolean;
  templateType?: DocumentTemplateType;
  collaborators?: DocumentCollaborator[];
  permissions?: DocumentPermissions;
  version: number;
  lastSavedAt?: Date;
  autoSaveEnabled: boolean;
}

export interface DocumentCollaborator {
  userId: string;
  userName: string;
  userEmail: string;
  permission: 'view' | 'edit' | 'admin';
  joinedAt: Date;
  isActive: boolean;
  cursor?: {
    position: number;
    selection?: {
      start: number;
      end: number;
    };
  };
}

export interface DocumentPermissions {
  canEdit: boolean;
  canShare: boolean;
  canDelete: boolean;
  canComment: boolean;
  canExport: boolean;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  type: DocumentTemplateType;
  category: string;
  thumbnail?: string;
  isDefault: boolean;
}

export type DocumentTemplateType = 
  | 'blank'
  | 'meeting-notes'
  | 'project-plan'
  | 'report'
  | 'memo'
  | 'letter'
  | 'proposal'
  | 'checklist'
  | 'article'
  | 'resume';

export interface DocumentCreateRequest {
  title: string;
  content?: string;
  folderId?: string;
  templateId?: string;
  templateType?: DocumentTemplateType;
}

export interface DocumentUpdateRequest {
  title?: string;
  content?: string;
  folderId?: string;
}

export interface DocumentSaveState {
  isSaving: boolean;
  lastSaved?: Date;
  hasUnsavedChanges: boolean;
  saveError?: string | undefined;
}

export interface RichTextEditorState {
  content: string;
  selection?: {
    start: number;
    end: number;
  };
  formatting: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    fontSize: number;
    fontFamily: string;
    textAlign: 'left' | 'center' | 'right' | 'justify';
    textColor: string;
    backgroundColor: string;
  };
}

export interface DocumentEditorProps {
  document: Document;
  onSave: (content: string) => Promise<void>;
  onTitleChange: (title: string) => void;
  readOnly?: boolean;
  autoSaveInterval?: number;
  showToolbar?: boolean;
  showCollaborators?: boolean;
}

export interface DocumentToolbarAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
}

export interface DocumentAutoSaveConfig {
  enabled: boolean;
  interval: number; // in milliseconds
  maxRetries: number;
  retryDelay: number;
}

export interface DocumentCollaborationEvent {
  type: 'cursor-move' | 'selection-change' | 'content-change' | 'user-join' | 'user-leave';
  userId: string;
  documentId: string;
  timestamp: Date;
  data: unknown;
}

export interface DocumentExportOptions {
  format: 'pdf' | 'docx' | 'html' | 'txt' | 'markdown';
  includeComments?: boolean;
  includeMetadata?: boolean;
  pageSize?: 'A4' | 'Letter' | 'Legal';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}