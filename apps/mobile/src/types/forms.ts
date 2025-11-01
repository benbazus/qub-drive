export interface Form {
  id: string
  documentId: string
  title: string
  description?: string
  sections: FormSection[]
  settings: FormSettings
  branding: FormBranding
  status: FormStatus
  version: number
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

export interface FormSection {
  id: string
  title: string
  description?: string
  fields: FormField[]
  order: number
  isRepeatable: boolean
  conditions: DisplayCondition[]
}

export interface FormField {
  id: string
  fieldType: FormFieldType
  label: string
  description?: string
  placeholder?: string
  required: boolean
  order: number
  options: FieldOption[]
  validation?: FieldValidation
  defaultValue?: FieldValue
  properties: FieldProperties
  conditions: DisplayCondition[]
}

export enum FormFieldType {
  // Text inputs
  ShortText = 'ShortText',
  LongText = 'LongText',
  RichText = 'RichText',
  Email = 'Email',
  Phone = 'Phone',
  Url = 'Url',
  
  // Numbers and dates
  Number = 'Number',
  Currency = 'Currency',
  Date = 'Date',
  Time = 'Time',
  DateTime = 'DateTime',
  Duration = 'Duration',
  
  // Selection
  Dropdown = 'Dropdown',
  MultipleChoice = 'MultipleChoice',
  Checkboxes = 'Checkboxes',
  LinearScale = 'LinearScale',
  MultipleChoiceGrid = 'MultipleChoiceGrid',
  CheckboxGrid = 'CheckboxGrid',
  
  // File and media
  FileUpload = 'FileUpload',
  ImageUpload = 'ImageUpload',
  VideoUpload = 'VideoUpload',
  
  // Advanced
  Signature = 'Signature',
  Location = 'Location',
  Rating = 'Rating',
  Ranking = 'Ranking',
  Matrix = 'Matrix',
  Calculation = 'Calculation',
  
  // Layout
  SectionBreak = 'SectionBreak',
  PageBreak = 'PageBreak',
  Image = 'Image',
  Video = 'Video',
}

export interface FieldOption {
  id: string
  label: string
  value: string
  description?: string
  imageUrl?: string
  isOther: boolean
  order: number
}

export interface FieldValidation {
  required: boolean
  minLength?: number
  maxLength?: number
  minValue?: number
  maxValue?: number
  pattern?: string
  customMessage?: string
  fileTypes: string[]
  maxFileSize?: number
  maxFiles?: number
}

export type FieldValue = 
  | { type: 'text'; value: string }
  | { type: 'number'; value: number }
  | { type: 'boolean'; value: boolean }
  | { type: 'date'; value: string }
  | { type: 'array'; value: string[] }
  | { type: 'file'; value: FileInfo }
  | { type: 'location'; value: LocationInfo }
  | { type: 'signature'; value: SignatureInfo }

export interface FileInfo {
  filename: string
  contentType: string
  size: number
  url: string
  checksum: string
}

export interface LocationInfo {
  latitude: number
  longitude: number
  address?: string
  accuracy?: number
}

export interface SignatureInfo {
  imageUrl: string
  signatureData: string
  timestamp: string
}

export interface FieldProperties {
  width?: FieldWidth
  alignment?: FieldAlignment
  showTime: boolean
  dateFormat?: string
  numberFormat?: string
  currencyCode?: string
  scaleMin?: number
  scaleMax?: number
  scaleMinLabel?: string
  scaleMaxLabel?: string
  rows?: number
  columns?: number
  shuffleOptions: boolean
  allowOther: boolean
  calculationFormula?: string
}

export enum FieldWidth {
  Short = 'Short',
  Medium = 'Medium',
  Long = 'Long',
  Full = 'Full',
}

export enum FieldAlignment {
  Left = 'Left',
  Center = 'Center',
  Right = 'Right',
}

export interface DisplayCondition {
  fieldId: string
  operator: ConditionOperator
  value: FieldValue
  action: ConditionAction
}

export enum ConditionOperator {
  Equals = 'Equals',
  NotEquals = 'NotEquals',
  Contains = 'Contains',
  NotContains = 'NotContains',
  GreaterThan = 'GreaterThan',
  LessThan = 'LessThan',
  GreaterThanOrEqual = 'GreaterThanOrEqual',
  LessThanOrEqual = 'LessThanOrEqual',
  IsEmpty = 'IsEmpty',
  IsNotEmpty = 'IsNotEmpty',
  StartsWith = 'StartsWith',
  EndsWith = 'EndsWith',
}

export enum ConditionAction {
  Show = 'Show',
  Hide = 'Hide',
  Require = 'Require',
  Optional = 'Optional',
  Skip = 'Skip',
}

export interface FormSettings {
  collectEmails: boolean
  requireSignIn: boolean
  allowMultipleResponses: boolean
  allowResponseEditing: boolean
  showProgressBar: boolean
  showLinkToSubmitAnother: boolean
  confirmationMessage: string
  redirectUrl?: string
  responseLimit?: number
  expiresAt?: string
  quizSettings?: QuizSettings
  notificationSettings: NotificationSettings
  privacySettings: PrivacySettings
}

export interface QuizSettings {
  isQuiz: boolean
  showCorrectAnswers: boolean
  showScore: boolean
  passingScore?: number
  certificateTemplate?: string
  timeLimit?: number // minutes
  randomizeQuestions: boolean
  preventCheating: boolean
}

export interface NotificationSettings {
  notifyOnResponse: boolean
  notificationEmails: string[]
  emailTemplate?: string
  autoResponder?: AutoResponder
}

export interface AutoResponder {
  enabled: boolean
  subject: string
  message: string
  includeResponseCopy: boolean
}

export interface PrivacySettings {
  collectIpAddresses: boolean
  collectUserAgent: boolean
  collectLocation: boolean
  dataRetentionDays?: number
  gdprCompliant: boolean
  privacyNotice?: string
}

export interface FormBranding {
  theme: FormTheme
  logoUrl?: string
  headerImageUrl?: string
  customCss?: string
  fontFamily: string
  primaryColor: string
  backgroundColor: string
}

export enum FormTheme {
  Default = 'Default',
  Modern = 'Modern',
  Classic = 'Classic',
  Minimal = 'Minimal',
  Corporate = 'Corporate',
  Custom = 'Custom',
}

export enum FormStatus {
  Draft = 'Draft',
  Published = 'Published',
  Paused = 'Paused',
  Closed = 'Closed',
  Archived = 'Archived',
}

export interface FormResponse {
  id: string
  formId: string
  respondentId?: string
  respondentEmail?: string
  responses: Record<string, FieldValue>
  metadata: ResponseMetadata
  status: ResponseStatus
  score?: number
  completionTime?: number // seconds
  createdAt: string
  updatedAt: string
  submittedAt?: string
}

export interface ResponseMetadata {
  ipAddress?: string
  userAgent?: string
  location?: LocationInfo
  referrer?: string
  sessionId: string
  deviceType?: string
  browser?: string
  os?: string
}

export enum ResponseStatus {
  InProgress = 'InProgress',
  Submitted = 'Submitted',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Flagged = 'Flagged',
}

// Request/Response DTOs
export interface CreateFormRequest {
  title: string
  description?: string
  templateId?: string
}

export interface UpdateFormRequest {
  title?: string
  description?: string
  sections?: FormSection[]
  settings?: FormSettings
  branding?: FormBranding
}

export interface AddFormFieldRequest {
  sectionId: string
  fieldType: FormFieldType
  label: string
  description?: string
  required: boolean
  options: FieldOption[]
  validation?: FieldValidation
  properties?: FieldProperties
}

export interface SubmitFormResponseRequest {
  responses: Record<string, FieldValue>
  saveAsDraft: boolean
}

export interface FormAnalyticsQuery {
  startDate?: string
  endDate?: string
  groupBy?: string // day, week, month
}

// Form Builder specific types
export interface FormBuilderState {
  form: Form | null
  selectedField: FormField | null
  selectedSection: FormSection | null
  isDragging: boolean
  previewMode: boolean
  unsavedChanges: boolean
}

export interface DragDropItem {
  id: string
  type: 'field' | 'section'
  fieldType?: FormFieldType
  data?: any
}

export interface FormFieldTemplate {
  id: string
  name: string
  fieldType: FormFieldType
  icon: string
  description: string
  defaultProperties: Partial<FormField>
}

export interface FormTemplate {
  id: string
  name: string
  description: string
  category: string
  thumbnail?: string
  form: Partial<Form>
}

// Form versioning and history types
export interface FormVersion {
  id: string
  formId: string
  version: number
  title: string
  description?: string
  sections: FormSection[]
  settings: FormSettings
  branding: FormBranding
  status: FormStatus
  changeLog: string
  createdBy: string
  createdAt: string
  isActive: boolean
}

export interface FormHistory {
  id: string
  formId: string
  action: FormHistoryAction
  description: string
  changes: FormChange[]
  performedBy: string
  performedAt: string
  version: number
}

export enum FormHistoryAction {
  Created = 'Created',
  Updated = 'Updated',
  Published = 'Published',
  Unpublished = 'Unpublished',
  Duplicated = 'Duplicated',
  Restored = 'Restored',
  Deleted = 'Deleted',
  FieldAdded = 'FieldAdded',
  FieldUpdated = 'FieldUpdated',
  FieldDeleted = 'FieldDeleted',
  SectionAdded = 'SectionAdded',
  SectionUpdated = 'SectionUpdated',
  SectionDeleted = 'SectionDeleted',
}

export interface FormChange {
  type: 'field' | 'section' | 'form' | 'settings' | 'branding'
  action: 'added' | 'updated' | 'deleted' | 'moved'
  path: string
  oldValue?: any
  newValue?: any
  fieldId?: string
  sectionId?: string
}

// Form management types
export interface FormListItem {
  id: string
  title: string
  description?: string
  status: FormStatus
  version: number
  responseCount: number
  lastModified: string
  createdAt: string
  createdBy: string
  isTemplate: boolean
  thumbnail?: string
}

export interface DuplicateFormRequest {
  title: string
  description?: string
  includeResponses: boolean
  copySettings: boolean
  copyBranding: boolean
}

export interface CreateFormFromTemplateRequest {
  templateId: string
  title: string
  description?: string
}

export interface RestoreFormVersionRequest {
  versionId: string
  createNewVersion: boolean
}