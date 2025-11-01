import nodemailer from 'nodemailer';

export interface SimpleEmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export class SimpleEmailService {
  private transporter: nodemailer.Transporter;
  private config: SimpleEmailConfig;

  constructor(config?: SimpleEmailConfig) {
    // Use environment variables or default config
    //TODO
    this.config = config || {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
      from: process.env.SMTP_FROM || 'noreply@localhost',
    };

    this.transporter = nodemailer.createTransport({
      host: "localhost",// this.config.host,
      port: 25,// this.config.port,
      secure: this.config.secure,
      auth: this.config.auth,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });

    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      console.log('✅ Simple Email service connected successfully');
    } catch (error) {
      console.error('Simple Email service connection failed:', error);
      // Don't throw error to prevent app from crashing
    }
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    try {
      const mailOptions = {
        from: this.config.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      // Don't throw error to prevent app from crashing
    }
  }

  // Document sharing notification
  async sendDocumentShareNotification(data: {
    recipientEmail: string;
    recipientName: string;
    documentTitle: string;
    sharedByName: string;
    permission: string;
    message?: string;
    documentUrl: string;
  }): Promise<void> {
    const permissionText = {
      'VIEW': 'view',
      'COMMENT': 'view and comment on',
      'EDIT': 'edit',
      'ADMIN': 'manage'
    }[data.permission] || 'access';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document Shared</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .permission-badge { background: #E0E7FF; color: #4F46E5; padding: 4px 12px; border-radius: 20px; font-size: 14px; }
          .message-box { background: white; border-left: 4px solid #4F46E5; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 Document Shared</h1>
          </div>
          <div class="content">
            <p>Hello ${data.recipientName},</p>
            
            <p><strong>${data.sharedByName}</strong> has shared a document with you:</p>
            
            <h2 style="color: #4F46E5;">"${data.documentTitle}"</h2>
            
            <p>You have been granted <span class="permission-badge">${permissionText}</span> permissions.</p>
            
            ${data.message ? `
              <div class="message-box">
                <h3>Message from ${data.sharedByName}:</h3>
                <p>${data.message}</p>
              </div>
            ` : ''}
            
            <p>Click the button below to access the document:</p>
            
            <a href="${data.documentUrl}" class="button">Open Document</a>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              If you're having trouble clicking the button, copy and paste this URL into your browser:<br>
              <a href="${data.documentUrl}">${data.documentUrl}</a>
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            
            <p style="font-size: 12px; color: #888;">
              This email was sent because ${data.sharedByName} shared a document with you. 
              If you believe this was sent in error, please contact support.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const subject = `📄 ${data.sharedByName} shared "${data.documentTitle}" with you`;

    await this.sendEmail({
      to: data.recipientEmail,
      subject,
      html,
    });
  }

  async close(): Promise<void> {
    this.transporter.close();
  }
}