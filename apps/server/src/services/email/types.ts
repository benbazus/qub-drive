
// src/templates/email/types.ts (Centralized type definitions)

export interface BaseEmailData {
    recipientName?: string;
    senderName?: string;
    companyName?: string;
    companyLogo?: string;
    supportEmail?: string;
    unsubscribeUrl?: string;
}

export interface ShareNotificationEmailData extends BaseEmailData {
    fileName: string;
    sharedBy: string;
    message?: string;
    shareUrl?: string;
    fileSize?: string;
    fileType?: string;
    requireApproval?: boolean;
    expiresAt?: Date;
}

export interface ShareApprovalEmailData extends BaseEmailData {
    recipientEmail?: string;
    fileName: string;
    approvedBy: string;
    shareUrl: string;
    approvedAt?: Date;
}

export interface ShareAccessRequestEmailData extends BaseEmailData {
    fileName: string;
    requesterName: string;
    requesterEmail: string;
    approvalUrl: string;
    requestedAt?: Date;
    message?: string;
    fileSize?: string;
    fileType?: string;
}

export interface CommentNotificationEmailData extends BaseEmailData {
    fileName: string;
    commenterName: string;
    comment: string;
    shareUrl: string;
    commentedAt?: Date;
    isReply?: boolean;
    parentComment?: string;
}

export interface ShareExpiryEmailData extends BaseEmailData {
    fileName: string;
    expiresAt: Date;
    shareUrl: string;
    daysUntilExpiry?: number;
    isExpired?: boolean;
}

export interface WelcomeEmailData extends BaseEmailData {
    userName: string;
    userEmail: string;
    dashboardUrl: string;
    verificationUrl?: string;
    isEmailVerificationRequired?: boolean;
}

export interface PasswordResetEmailData extends BaseEmailData {
    userName: string;
    resetUrl: string;
    expiresIn?: string;
    requestedAt?: Date;
}

export interface OtpEmailData extends BaseEmailData {
    otpCode: string;
    type: 'REGISTRATION' | 'PASSWORD_RESET' | string;
    recipientEmail: string;
    expiresAt: Date;
}

export interface AccountLockedEmailData extends BaseEmailData {
    userName: string;
    userEmail: string;
    lockReason: string;
    unlockUrl?: string;
    lockDuration?: string;
    supportContact?: string;
    lockedAt: Date;
}

export interface FileUploadNotificationEmailData extends BaseEmailData {
    fileName: string;
    fileSize: string;
    fileType: string;
    uploadedBy: string;
    uploadedAt: Date;
    fileUrl?: string;
    folderName?: string;
    isShared?: boolean;
    shareUrl?: string;
    thumbnailUrl?: string;
}

export interface SystemMaintenanceEmailData extends BaseEmailData {
    maintenanceType: 'scheduled' | 'emergency' | 'completed';
    startTime: Date;
    endTime?: Date;
    duration?: string;
    affectedServices: string[];
    reason: string;
    impact: 'low' | 'medium' | 'high';
    statusPageUrl?: string;
    alternativeActions?: string[];
}

export interface DocumentInvitationEmailData extends BaseEmailData {
    email: string;
    documentTitle: string;
    inviterName: string;
    invitationUrl: string;
    role: string;
    message?: string;
    isExistingUser?: boolean;
}

export interface CollaborationNotificationEmailData extends BaseEmailData {
    documentTitle: string;
    collaboratorName: string;
    collaboratorEmail: string;
    permission: string;
    documentUrl: string;
    addedBy: string;
    addedAt?: Date;
    message?: string;
}

export interface ContactFormNotificationEmailData extends BaseEmailData {
    submissionId: string;
    firstName: string;
    lastName: string;
    email: string;
    company: string;
    jobTitle?: string;
    phone?: string;
    companySize?: string;
    message: string;
    planInterest: string;
    submittedAt: Date;
}

export interface ContactFormConfirmationEmailData extends BaseEmailData {
    firstName: string;
    lastName: string;
    submissionId: string;
    planInterest: string;
    company: string;
}

export interface DemoRequestNotificationEmailData extends BaseEmailData {
    requestId: string;
    firstName: string;
    lastName: string;
    email: string;
    company: string;
    jobTitle?: string;
    phone?: string;
    companySize: string;
    useCase: string;
    preferredDate?: string;
    preferredTime?: string;
    demoType: 'live' | 'recorded' | 'trial';
    message?: string;
    planInterest: string;
    submittedAt: Date;
}

export interface DemoRequestConfirmationEmailData extends BaseEmailData {
    firstName: string;
    lastName: string;
    requestId: string;
    demoType: 'live' | 'recorded' | 'trial';
    planInterest: string;
    company: string;
    useCase: string;
    preferredDate?: string;
    preferredTime?: string;
}

export interface DemoScheduledEmailData extends BaseEmailData {
    firstName: string;
    lastName: string;
    requestId: string;
    scheduledDate: Date;
    meetingLink?: string;
    assignedTo?: string;
    planInterest: string;
    company: string;
    useCase: string;
}

export interface SpreadsheetShareNotificationEmailData {
    recipientEmail: string;
    recipientName: string;
    granterName: string;
    spreadsheetTitle: string;
    permission: string;
    spreadsheetUrl: string;
}

export interface BulkTransferEmailData extends BaseEmailData {
    title?: string;
    message?: string;
    senderEmail?: string;
    senderName?: string;
    recipientEmail?: string;
    recipientName?: string;
    fileCount: number;
    totalSize: string;
    downloadUrl: string;
    expiresAt: Date;
    downloadLimit?: number;
    hasPassword: boolean;
    trackingEnabled: boolean;
}

