import { BaseEmailData } from './base-template';

export interface CollaborationNotificationEmailData extends BaseEmailData {
  documentTitle: string;
  collaboratorName: string;
  collaboratorEmail: string;
  permission: string;
  documentUrl: string;
  addedBy: string;
  addedAt?: Date;
  message?: string;
}

export function renderCollaborationNotificationTemplate(data: CollaborationNotificationEmailData): { subject: string; html: string; text: string } {
  const {
    documentTitle,
    collaboratorName,
    collaboratorEmail,
    permission,
    documentUrl,
    addedBy,
    addedAt = new Date(),
    message,
    recipientName = collaboratorName
  } = data;

  const title = `Document Collaboration`;
  const permissionText = permission.toLowerCase();
  const subject = `You've been added to "${documentTitle}"`;

  const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document Collaboration</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { 
            background: #10B981; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            display: inline-block; 
            margin: 20px 0;
          }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .document-info { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10B981; }
          .permission-badge { 
            background: #EFF6FF; 
            color: #1D4ED8; 
            padding: 4px 12px; 
            border-radius: 4px; 
            font-size: 12px; 
            font-weight: bold; 
            text-transform: uppercase; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤝 Document Collaboration</h1>
          </div>
          
          <div class="content">
            <h2>Hello ${recipientName}!</h2>
            
            <p>Great news! <strong>${addedBy}</strong> has added you as a collaborator on a document.</p>
            
            <div class="document-info">
              <h3>📄 ${documentTitle}</h3>
              <p><strong>Your access level:</strong> <span class="permission-badge">${permission}</span></p>
              <p><strong>Added by:</strong> ${addedBy}</p>
              <p><strong>Added on:</strong> ${addedAt.toLocaleDateString()}</p>
            </div>
            
            ${message ? `<p><strong>Message from ${addedBy}:</strong></p><p style="font-style: italic; background: white; padding: 15px; border-left: 4px solid #10B981;">${message}</p>` : ''}
            
            <p>You can now access this document and start collaborating. Click the button below to get started:</p>
            
            <a href="${documentUrl}" class="button">
              📄 Open Document
            </a>
            
            <p><small>If the button doesn't work, copy and paste this link into your browser:</small><br>
            <small>${documentUrl}</small></p>
            
            <h3>What you can do with ${permissionText} access:</h3>
            <ul>
              ${permission === 'VIEW' ? '<li>👀 View the document</li>' : ''}
              ${permission === 'COMMENT' ? '<li>👀 View the document</li><li>💬 Add comments and replies</li>' : ''}
              ${permission === 'EDIT' ? '<li>👀 View the document</li><li>💬 Add comments and replies</li><li>✏️ Edit document content</li>' : ''}
              ${permission === 'ADMIN' ? '<li>👀 View the document</li><li>💬 Add comments and replies</li><li>✏️ Edit document content</li><li>👥 Manage collaborators</li><li>🔗 Share with others</li>' : ''}
            </ul>
          </div>
          
          <div class="footer">
            <p>You're receiving this because ${addedBy} added you to collaborate on "${documentTitle}".</p>
            <p>Happy collaborating! 🎉</p>
          </div>
        </div>
      </body>
      </html>
    `;

  const textContent = `
Document Collaboration

Hello ${recipientName}!

${addedBy} has added you as a collaborator on "${documentTitle}" with ${permissionText} access.

${message ? `Message from ${addedBy}: ${message}` : ''}

To access the document, visit: ${documentUrl}

What you can do with ${permissionText} access:
${permission === 'VIEW' ? '- View the document' : ''}
${permission === 'COMMENT' ? '- View the document\n- Add comments and replies' : ''}
${permission === 'EDIT' ? '- View the document\n- Add comments and replies\n- Edit document content' : ''}
${permission === 'ADMIN' ? '- View the document\n- Add comments and replies\n- Edit document content\n- Manage collaborators\n- Share with others' : ''}

You're receiving this because ${addedBy} added you to collaborate on "${documentTitle}".
Happy collaborating!
    `;

  return {
    subject,
    html: htmlContent,
    text: textContent
  };
}