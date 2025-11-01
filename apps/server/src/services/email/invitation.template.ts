// src/services/email/invitation.template.ts

import { renderBaseTemplate, BaseEmailData } from './base-template';

export interface DocumentInvitation extends BaseEmailData {
  email: string;
  documentTitle: string;
  inviterName: string;
  invitationUrl: string;
  role: string;
  message?: string;
  isExistingUser?: boolean;
}

export function renderDocumentInvitationTemplate(data: DocumentInvitation): { subject: string; html: string; text: string } {
  const {
    email,
    documentTitle,
    inviterName,
    invitationUrl,
    role,
    message,
    isExistingUser = false
  } = data;

  const title = `Document Collaboration Invitation`;
  const roleText = role.toLowerCase();
  const subject = `${inviterName} invited you to collaborate on "${documentTitle}"`;

  const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document Collaboration Invitation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { 
            background: #4F46E5; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            display: inline-block; 
            margin: 20px 0;
          }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .document-info { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📝 Document Collaboration Invitation</h1>
          </div>
          
          <div class="content">
            <h2>Hello!</h2>
            
            <p><strong>${inviterName}</strong> has invited you to collaborate on a document with ${roleText} permissions.</p>
            
            <div class="document-info">
              <h3>📄 ${documentTitle}</h3>
              <p><strong>Your role:</strong> ${role.charAt(0) + role.slice(1).toLowerCase()}</p>
              <p><strong>Invited by:</strong> ${inviterName}</p>
            </div>
            
            ${message ? `<p><strong>Personal message:</strong></p><p style="font-style: italic; background: white; padding: 15px; border-left: 4px solid #4F46E5;">${message}</p>` : ''}
            
            <p>Click the button below to ${isExistingUser ? 'access the document' : 'accept the invitation and create your account'}:</p>
            
            <a href="${invitationUrl}" class="button">
              ${isExistingUser ? '📄 Open Document' : '✅ Accept Invitation'}
            </a>
            
            <p><small>If the button doesn't work, copy and paste this link into your browser:</small><br>
            <small>${invitationUrl}</small></p>
            
            ${!isExistingUser ? '<p><em>Note: You\'ll need to create an account if you don\'t have one already.</em></p>' : ''}
          </div>
          
          <div class="footer">
            <p>This invitation was sent by ${inviterName} through our collaborative document platform.</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

  const textContent = `
Document Collaboration Invitation

${inviterName} has invited you to collaborate on "${documentTitle}" with ${roleText} permissions.

${message ? `Personal message: ${message}` : ''}

To ${isExistingUser ? 'access the document' : 'accept the invitation'}, visit: ${invitationUrl}

${!isExistingUser ? 'Note: You\'ll need to create an account if you don\'t have one already.' : ''}

This invitation was sent by ${inviterName} through our collaborative document platform.
If you didn't expect this invitation, you can safely ignore this email.
    `;

  return {
    subject,
    html: htmlContent,
    text: textContent
  };
}