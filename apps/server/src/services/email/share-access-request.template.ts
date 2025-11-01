

// src/templates/email/share-access-request.template.ts

import { renderBaseTemplate, BaseEmailData } from './base-template';

export interface ShareAccessRequestEmailData extends BaseEmailData {
  fileName: string;
  requesterName: string;
  requesterEmail: string;
  approvalUrl: string;
  requestedAt?: Date;
  message?: string;
}

export function renderShareAccessRequestTemplate(data: ShareAccessRequestEmailData): string {
  const {
    fileName,
    requesterName,
    requesterEmail,
    approvalUrl,
    requestedAt,
    message,
    recipientName
  } = data;

  const requestDate = requestedAt
    ? new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(requestedAt)
    : 'just now';

  const content = `
      <h2>Access Request${recipientName ? ` for ${recipientName}` : ''}</h2>
      <p>Someone is requesting access to your shared file.</p>
      
      <div class="info-box">
        <p style="margin: 0 0 10px 0;"><strong>📋 Request Details</strong></p>
        <p style="margin: 5px 0;"><strong>File:</strong> ${fileName}</p>
        <p style="margin: 5px 0;"><strong>Requester:</strong> ${requesterName}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${requesterEmail}</p>
        <p style="margin: 5px 0;"><strong>Requested:</strong> ${requestDate}</p>
      </div>
  
      ${message ? `
        <div class="comment-box">
          <p style="margin: 0;"><strong>Message from requester:</strong></p>
          <p style="margin: 10px 0 0 0;">"${message}"</p>
        </div>
      ` : ''}
  
      <p>You can approve or deny this request by clicking the button below:</p>
      
      <div class="btn-center">
        <a href="${approvalUrl}" class="btn btn-warning">⚖️ Review Request</a>
      </div>
  
      <div class="warning-box">
        <p style="margin: 0;"><strong>⚠️ Action Required</strong></p>
        <p style="margin: 10px 0 0 0;">This request is pending your approval. The requester will be notified of your decision.</p>
      </div>
  
      <div class="link-fallback">
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${approvalUrl}">${approvalUrl}</a></p>
      </div>
    `;

  return renderBaseTemplate('🔔 Access Request', content, data);
}