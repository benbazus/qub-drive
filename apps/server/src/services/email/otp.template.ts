
import { renderBaseTemplate, BaseEmailData } from './base-template';

export interface OtpEmailData extends BaseEmailData {
    otpCode: string;
    type: 'REGISTRATION' | 'PASSWORD_RESET' | string;
    recipientEmail: string;
    expiresAt: Date;
}

export function renderOtpEmailTemplate(data: OtpEmailData): string {
    const { otpCode, type, recipientEmail, expiresAt, recipientName } = data;

    const isRegistration = type === 'REGISTRATION';
    const title = isRegistration ? 'Verify Your Email Address' : 'Password Reset Code';
    const greeting = recipientName ? `Hello ${recipientName}` : 'Hello';

    const expiryMinutes = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60));
    const expiryText = expiryMinutes > 0
        ? `This code will expire in ${expiryMinutes} minutes.`
        : 'This code has expired.';

    const content = `
        <h2>${greeting}!</h2>
        
        ${isRegistration ? `
            <p>Thank you for signing up! To complete your registration, please verify your email address using the code below:</p>
        ` : `
            <p>You requested a password reset for your account. Use the verification code below to proceed:</p>
        `}

        <div class="info-box" style="text-align: center; background: #f8f9fa; padding: 30px; margin: 30px 0; border-radius: 8px;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Your Verification Code</h3>
            <div style="
                font-size: 32px; 
                font-weight: bold; 
                color: #007bff; 
                letter-spacing: 8px; 
                font-family: 'Courier New', monospace;
                background: white;
                padding: 20px;
                border-radius: 6px;
                border: 2px dashed #007bff;
                display: inline-block;
                margin: 10px 0;
            ">
                ${otpCode}
            </div>
            <p style="margin: 15px 0 0 0; color: #6c757d; font-size: 14px;">
                <strong>⏰ ${expiryText}</strong>
            </p>
        </div>

        ${isRegistration ? `
            <div class="success-box">
                <p style="margin: 0;"><strong>🎉 Welcome to Qub Drive!</strong></p>
                <p style="margin: 10px 0 0 0;">Once verified, you'll be able to:</p>
                <ul style="margin: 10px 0 0 20px; padding: 0;">
                    <li>Upload and share files securely</li>
                    <li>Collaborate with team members</li>
                    <li>Control access permissions</li>
                    <li>Track file activity</li>
                </ul>
            </div>
        ` : `
            <div class="warning-box">
                <p style="margin: 0;"><strong>🔒 Security Notice</strong></p>
                <p style="margin: 10px 0 0 0;">If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
        `}

        <p><strong>How to use this code:</strong></p>
        <ol style="margin: 10px 0 0 20px; padding: 0;">
            <li>Return to the ${isRegistration ? 'email verification' : 'password reset'} page</li>
            <li>Enter the 6-digit code: <strong>${otpCode}</strong></li>
            <li>${isRegistration ? 'Complete your account setup' : 'Create your new password'}</li>
        </ol>

        <div class="info-box">
            <p style="margin: 0;"><strong>💡 Tip:</strong> You can copy and paste this code directly.</p>
        </div>

        <div style="margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 6px; font-size: 12px; color: #6c757d;">
            <p style="margin: 0;"><strong>Email sent to:</strong> ${recipientEmail}</p>
            <p style="margin: 5px 0 0 0;"><strong>Code expires:</strong> ${expiresAt.toLocaleString()}</p>
            <p style="margin: 5px 0 0 0;"><strong>Request type:</strong> ${isRegistration ? 'Email Verification' : 'Password Reset'}</p>
        </div>
    `;

    return renderBaseTemplate(title, content, data);
}