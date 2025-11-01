
import { BaseEmailData, renderBaseTemplate } from "./base-template";

export interface PasswordResetEmailData extends BaseEmailData {
  userName: string;
  resetUrl: string;
  expiresIn?: string;
  requestedAt?: Date;
}

export function renderPasswordResetTemplate(data: PasswordResetEmailData): string {
  const { userName, resetUrl, expiresIn = '1 hour', requestedAt } = data;

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
      <h2>Password Reset Request</h2>
      <p>Hello ${userName},</p>
      <p>We received a request to reset your password for your FileShare account.</p>
      
      <div class="info-box">
        <p style="margin: 0 0 10px 0;"><strong>🔒 Reset Request Details</strong></p>
        <p style="margin: 5px 0;"><strong>Requested:</strong> ${requestDate}</p>
        <p style="margin: 5px 0;"><strong>Expires in:</strong> ${expiresIn}</p>
      </div>
  
      <p>If you requested this password reset, click the button below to set a new password:</p>
      
      <div class="btn-center">
        <a href="${resetUrl}" class="btn">🔑 Reset Password</a>
      </div>
  
      <div class="warning-box">
        <p style="margin: 0;"><strong>⚠️ Security Notice</strong></p>
        <p style="margin: 10px 0 0 0;">This link will expire in ${expiresIn}. If you didn't request this password reset, you can safely ignore this email.</p>
      </div>
  
      <div class="link-fallback">
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
      </div>
  
      <div class="info-box">
        <p style="margin: 0;"><strong>🛡️ Security Tips</strong></p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
          <li style="margin: 5px 0;">Use a strong, unique password</li>
          <li style="margin: 5px 0;">Don't share your password with anyone</li>
          <li style="margin: 5px 0;">Consider using a password manager</li>
        </ul>
      </div>
    `;

  return renderBaseTemplate('🔑 Password Reset Request', content, data);
}