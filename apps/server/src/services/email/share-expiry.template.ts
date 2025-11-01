

// src/templates/email/share-expiry.template.ts

import { renderBaseTemplate, BaseEmailData } from './base-template';

export interface ShareExpiryEmailData extends BaseEmailData {
  fileName: string;
  expiresAt: Date;
  shareUrl: string;
  daysUntilExpiry?: number;
  isExpired?: boolean;
}

export function renderShareExpiryTemplate(data: ShareExpiryEmailData): string {
  const {
    fileName,
    expiresAt,
    shareUrl,
    daysUntilExpiry,
    isExpired,
    recipientName
  } = data;

  const expiryDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(expiresAt);

  const urgencyLevel = daysUntilExpiry && daysUntilExpiry <= 1 ? 'urgent' : 'warning';
  const titleText = isExpired ? 'Share Has Expired' : 'Share Expiring Soon';
  const actionText = isExpired ? 'has expired' : 'will expire soon';
  const buttonText = isExpired ? '🔄 Renew Share' : '⚙️ Extend Share';

  const content = `
      <h2>${titleText}${recipientName ? ` - ${recipientName}` : ''}</h2>
      <p>Your shared file <strong>"${fileName}"</strong> ${actionText}.</p>
      
      <div class="${urgencyLevel === 'urgent' ? 'warning' : 'info'}-box">
        <p style="margin: 0 0 10px 0;"><strong>${isExpired ? '❌' : '⏰'} ${titleText}</strong></p>
        <p style="margin: 5px 0;"><strong>File:</strong> ${fileName}</p>
        <p style="margin: 5px 0;"><strong>${isExpired ? 'Expired' : 'Expires'}:</strong> ${expiryDate}</p>
        ${daysUntilExpiry !== undefined && !isExpired ? `<p style="margin: 5px 0;"><strong>Days remaining:</strong> ${daysUntilExpiry}</p>` : ''}
      </div>
  
      ${isExpired ? `
        <div class="warning-box">
          <p style="margin: 0;"><strong>⚠️ Access Restricted</strong></p>
          <p style="margin: 10px 0 0 0;">Users can no longer access this shared file. You can renew the share to restore access.</p>
        </div>
      ` : `
        <div class="warning-box">
          <p style="margin: 0;"><strong>⚠️ Action Required</strong></p>
          <p style="margin: 10px 0 0 0;">After the expiry date, users will no longer be able to access the shared file. You can extend the sharing period to maintain access.</p>
        </div>
      `}
  
      <p>To ${isExpired ? 'renew' : 'extend'} the sharing period or manage your share settings:</p>
      
      <div class="btn-center">
        <a href="${shareUrl}" class="btn ${urgencyLevel === 'urgent' ? 'btn-warning' : ''}">${buttonText}</a>
      </div>
  
      <div class="info-box">
        <p style="margin: 0;"><strong>💡 Tip</strong></p>
        <p style="margin: 10px 0 0 0;">You can set up automatic renewal or longer expiry periods in your share settings to avoid interruptions.</p>
      </div>
  
      <div class="link-fallback">
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${shareUrl}">${shareUrl}</a></p>
      </div>
    `;

  return renderBaseTemplate(titleText, content, data);
}