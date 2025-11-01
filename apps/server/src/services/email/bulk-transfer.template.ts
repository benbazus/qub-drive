
// src/services/email/bulk-transfer.template.ts

import { renderBaseTemplate } from './base-template';
import { BulkTransferEmailData } from './types';

export function renderBulkTransferTemplate(data: BulkTransferEmailData): string {
  const {
    title,
    message,
    senderName,
    senderEmail,
    recipientName,
    fileCount,
    totalSize,
    downloadUrl,
    expiresAt,
    downloadLimit,
    hasPassword,
    trackingEnabled
  } = data;

  const expiryDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(expiresAt);

  const content = `
      <h2>Hello${recipientName ? ` ${recipientName}` : ''}!</h2>
      <p><strong>${senderName || senderEmail || 'Someone'}</strong> has sent you ${fileCount} file${fileCount > 1 ? 's' : ''} via Qub Drive Transfer.</p>

      ${title ? `
        <div class="file-info">
          <h3 style="margin: 10px 0; color: #333;">📦 ${title}</h3>
        </div>
      ` : ''}

      <div class="info-box" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0;"><strong>📁 Number of files:</strong></td>
            <td style="padding: 8px 0; text-align: right;">${fileCount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>📊 Total size:</strong></td>
            <td style="padding: 8px 0; text-align: right;">${totalSize}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>⏰ Expires:</strong></td>
            <td style="padding: 8px 0; text-align: right;">${expiryDate}</td>
          </tr>
          ${downloadLimit ? `
          <tr>
            <td style="padding: 8px 0;"><strong>📥 Download limit:</strong></td>
            <td style="padding: 8px 0; text-align: right;">${downloadLimit} download${downloadLimit > 1 ? 's' : ''}</td>
          </tr>
          ` : ''}
          ${hasPassword ? `
          <tr>
            <td style="padding: 8px 0;" colspan="2">
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin-top: 10px;">
                <strong>🔒 Password Protected:</strong> You'll need a password to access these files.
              </div>
            </td>
          </tr>
          ` : ''}
        </table>
      </div>

      ${message ? `
        <div class="info-box" style="background: #e7f3ff; border-left: 4px solid #4F46E5; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>💬 Message from ${senderName || senderEmail}:</strong></p>
          <p style="margin: 10px 0 0 0; font-style: italic; color: #333;">"${message}"</p>
        </div>
      ` : ''}

      <p style="margin: 30px 0 20px 0;">Click the button below to access and download your files:</p>

      <div class="btn-center" style="text-align: center; margin: 30px 0;">
        <a href="${downloadUrl}" class="btn" style="display: inline-block; background: #4F46E5; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          📥 Download Files
        </a>
      </div>

      <div class="warning-box" style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>⚠️ Important:</strong></p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
          <li>This transfer link will expire on <strong>${expiryDate}</strong></li>
          ${downloadLimit ? `<li>You can download these files up to <strong>${downloadLimit}</strong> time${downloadLimit > 1 ? 's' : ''}</li>` : ''}
          ${trackingEnabled ? `<li>Download activity is being tracked for security purposes</li>` : ''}
          <li>Do not share this link with others unless you trust them</li>
        </ul>
      </div>

      <div class="link-fallback" style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="margin: 0; word-break: break-all;"><a href="${downloadUrl}" style="color: #4F46E5;">${downloadUrl}</a></p>
      </div>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <p style="font-size: 12px; color: #888; margin: 0;">
          This is an automated email from Qub Drive Transfer Service.
          ${senderEmail ? `If you have questions about this transfer, contact ${senderEmail}.` : ''}
        </p>
      </div>
    `;

  return renderBaseTemplate('📦 Files Sent to You via Qub Drive', content, data);
}
