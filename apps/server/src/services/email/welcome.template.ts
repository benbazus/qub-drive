
// src/templates/email/welcome.template.ts

import { renderBaseTemplate, BaseEmailData } from './base-template';

export interface WelcomeEmailData extends BaseEmailData {
  userName: string;
  userEmail: string;
  dashboardUrl: string;
  verificationUrl?: string;
  isEmailVerificationRequired?: boolean;
}

export function renderWelcomeTemplate(data: WelcomeEmailData): string {
  const {
    userName,
    userEmail,
    dashboardUrl,
    verificationUrl,
    isEmailVerificationRequired
  } = data;

  const content = `
      <h2>Welcome to Qub Drive, ${userName}! 🎉</h2>
      <p>Thank you for joining our file sharing platform. We're excited to help you collaborate and share files securely.</p>
      
      <div class="success-box">
        <p style="margin: 0 0 10px 0;"><strong>✅ Account Created Successfully</strong></p>
        <p style="margin: 5px 0;"><strong>Name:</strong> ${userName}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${userEmail}</p>
      </div>
  
      ${isEmailVerificationRequired && verificationUrl ? `
        <div class="warning-box">
          <p style="margin: 0 0 10px 0;"><strong>📧 Email Verification Required</strong></p>
          <p style="margin: 0;">Please verify your email address to activate all features of your account.</p>
        </div>
  
        <div class="btn-center">
          <a href="${verificationUrl}" class="btn btn-warning">📧 Verify Email Address</a>
        </div>
      ` : ''}
  
      <h3>What you can do with Qub Drive:</h3>
      <div class="info-box">
        <ul style="margin: 0; padding-left: 20px;">
          <li style="margin: 5px 0;">📤 Upload and organize your files</li>
          <li style="margin: 5px 0;">🔗 Share files with specific people or teams</li>
          <li style="margin: 5px 0;">🔒 Control access permissions and expiry dates</li>
          <li style="margin: 5px 0;">💬 Collaborate with comments and real-time notifications</li>
          <li style="margin: 5px 0;">📊 Track file access and download analytics</li>
          <li style="margin: 5px 0;">🔄 Manage all your shares from one dashboard</li>
        </ul>
      </div>
  
      <p>Ready to get started? Access your dashboard to begin sharing files:</p>
      
      <div class="btn-center">
        <a href="${dashboardUrl}" class="btn">🚀 Go to Dashboard</a>
      </div>
  
      <div class="info-box">
        <p style="margin: 0;"><strong>🆘 Need Help?</strong></p>
        <p style="margin: 10px 0 0 0;">Check out our <a href="${process.env["FRONTEND_URL"]}/help">Help Center</a> or contact our support team if you have any questions.</p>
      </div>
    `;

  return renderBaseTemplate('Welcome to Qub Drive! 🎉', content, data);
}