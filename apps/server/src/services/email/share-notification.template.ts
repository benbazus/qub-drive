
// src/templates/email/share-notification.template.ts

import { renderBaseTemplate, BaseEmailData } from './base-template';

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

export function renderShareNotificationTemplate(data: ShareNotificationEmailData): string {
  const {
    fileName,
    sharedBy,
    message,
    shareUrl,
    fileSize,
    fileType,
    expiresAt,
    recipientName,
    requireApproval
  } = data;

  const expiryText = expiresAt
    ? `This share will expire on ${new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(expiresAt)}.`
    : '';

  const content = `
      <h2>Hello${recipientName ? ` ${recipientName}` : ''}!</h2>
      <p><strong>${sharedBy}</strong> has shared a file with you.</p>
      
      <div class="file-info">
        <div class="file-icon">📁</div>
        <h3 style="margin: 0 0 10px 0; color: #333;">${fileName}</h3>
        ${fileSize ? `<p style="margin: 5px 0; color: #6c757d;">Size: ${fileSize}</p>` : ''}
        ${fileType ? `<p style="margin: 5px 0; color: #6c757d;">Type: ${fileType}</p>` : ''}
      </div>
  
      ${message ? `
        <div class="info-box">
          <p style="margin: 0;"><strong>Message from ${sharedBy}:</strong></p>
          <p style="margin: 10px 0 0 0; font-style: italic;">"${message}"</p>
        </div>
      ` : ''}
  
      <p>Click the button below to access the shared file:</p>
      
      <div class="btn-center">
        <a href="${shareUrl}" class="btn">🔗 Access Shared File</a>
      </div>
  
      ${expiryText ? `
        <div class="warning-box">
          <p style="margin: 0;"><strong>⏰ ${expiryText}</strong></p>
        </div>
      ` : ''}
  
        ${requireApproval ? `
                <div class="approval-notice">
                  <strong>⚠️ Approval Required:</strong> Your access to this file requires approval. You'll receive another email once your access is approved.
                </div>
              ` : `
                <a href="${shareUrl}" class="button">
                  View File
                </a>
              `}

      <div class="link-fallback">
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${shareUrl}">${shareUrl}</a></p>
      </div>
    `;

  return renderBaseTemplate('📁 File Shared With You', content, data);
}