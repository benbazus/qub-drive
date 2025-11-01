// src/services/email/account-locked.template.ts

import { renderBaseTemplate, BaseEmailData } from './base-template';

export interface AccountLockedEmailData extends BaseEmailData {
    userName: string;
    userEmail: string;
    lockReason: string;
    unlockUrl?: string;
    lockDuration?: string;
    supportContact?: string;
    lockedAt: Date;
}

export function renderAccountLockedTemplate(data: AccountLockedEmailData): string {
    const {
        userName,
        userEmail,
        lockReason,
        unlockUrl,
        lockDuration,
        supportContact,
        lockedAt,
        recipientName
    } = data;

    const greeting = recipientName || userName || 'User';

    const content = `
        <h2>Account Security Alert - ${greeting}</h2>
        
        <div class="warning-box">
            <p style="margin: 0 0 10px 0;"><strong>🔒 Your account has been temporarily locked</strong></p>
            <p style="margin: 0;">We've detected suspicious activity or multiple failed login attempts on your account.</p>
        </div>

        <div class="info-box">
            <h3 style="margin: 0 0 15px 0;">Account Details:</h3>
            <p style="margin: 5px 0;"><strong>Account:</strong> ${userEmail}</p>
            <p style="margin: 5px 0;"><strong>Locked at:</strong> ${lockedAt.toLocaleString()}</p>
            <p style="margin: 5px 0;"><strong>Reason:</strong> ${lockReason}</p>
            ${lockDuration ? `<p style="margin: 5px 0;"><strong>Duration:</strong> ${lockDuration}</p>` : ''}
        </div>

        <h3>What happened?</h3>
        <p>Your account was automatically locked as a security precaution due to:</p>
        <ul style="margin: 10px 0 0 20px;">
            <li>Multiple failed login attempts</li>
            <li>Suspicious login activity from unknown locations</li>
            <li>Potential security breach detection</li>
        </ul>

        <h3>What should you do?</h3>
        
        ${unlockUrl ? `
            <div class="success-box">
                <p style="margin: 0 0 10px 0;"><strong>✅ Unlock Your Account</strong></p>
                <p style="margin: 0;">Click the button below to verify your identity and unlock your account:</p>
            </div>

            <div class="btn-center">
                <a href="${unlockUrl}" class="btn btn-success">🔓 Unlock My Account</a>
            </div>

            <div class="link-fallback">
                <p>If the button doesn't work, copy and paste this link:</p>
                <p><a href="${unlockUrl}">${unlockUrl}</a></p>
            </div>
        ` : `
            <div class="info-box">
                <p style="margin: 0;"><strong>Manual Unlock Required</strong></p>
                <p style="margin: 10px 0 0 0;">Please contact our support team to unlock your account.</p>
            </div>
        `}

        <div class="warning-box">
            <h4 style="margin: 0 0 10px 0;">🛡️ Security Tips:</h4>
            <ul style="margin: 0 0 0 20px; padding: 0;">
                <li>Use a strong, unique password</li>
                <li>Enable two-factor authentication</li>
                <li>Don't share your login credentials</li>
                <li>Log out from shared computers</li>
                <li>Report suspicious activity immediately</li>
            </ul>
        </div>

        <div class="info-box">
            <p style="margin: 0;"><strong>Need Help?</strong></p>
            <p style="margin: 10px 0 0 0;">
                If you didn't attempt to log in or suspect unauthorized access, 
                contact our security team immediately at 
                <a href="mailto:${supportContact || 'security@example.com'}">${supportContact || 'security@example.com'}</a>
            </p>
        </div>
    `;

    return renderBaseTemplate('🔒 Account Security Alert', content, data);
}