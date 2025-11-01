

// src/templates/email/share-approval.template.ts

import { renderBaseTemplate, BaseEmailData } from './base-template';

export interface ShareApprovalEmailData extends BaseEmailData {
  fileName: string;
  approvedBy: string;
  shareUrl: string;
  approvedAt?: Date;
}

export function renderShareApprovalTemplate(data: ShareApprovalEmailData): string {
  const { fileName, approvedBy, shareUrl, approvedAt, recipientName } = data;

  const approvalDate = approvedAt
    ? new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(approvedAt)
    : 'just now';

  const content = `
      <h2>Great news${recipientName ? `, ${recipientName}` : ''}!</h2>
      <p>Your access request has been approved.</p>
      
      <div class="success-box">
        <p style="margin: 0;"><strong>✅ Access Granted</strong></p>
        <p style="margin: 10px 0 0 0;">You now have access to <strong>"${fileName}"</strong></p>
      </div>
  
      <div class="file-info">
        <div class="file-icon">📄</div>
        <h3 style="margin: 0 0 10px 0; color: #333;">${fileName}</h3>
        <p style="margin: 5px 0; color: #6c757d;">Approved by: ${approvedBy}</p>
        <p style="margin: 5px 0; color: #6c757d;">Approved: ${approvalDate}</p>
      </div>
  
      <p>You can now view, download, and interact with the shared file based on the permissions granted to you.</p>
      
      <div class="btn-center">
        <a href="${shareUrl}" class="btn btn-success">🎉 Access File Now</a>
      </div>
  
      <div class="link-fallback">
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${shareUrl}">${shareUrl}</a></p>
      </div>
    `;

  return renderBaseTemplate('✅ Access Approved', content, data);
}