
import nodemailer from 'nodemailer';
import { EmailTemplateService } from './email/mail-template.service';
import { EmailQueueService } from './email/email-queue.service';
import { EmailAnalyticsService } from './email/email-analytics.service';

import {
  CommentNotificationEmailData,
  PasswordResetEmailData,
  ShareAccessRequestEmailData,
  ShareApprovalEmailData,
  ShareNotificationEmailData,
  WelcomeEmailData,
  ShareExpiryEmailData,
  OtpEmailData,
  AccountLockedEmailData,
  FileUploadNotificationEmailData,
  SystemMaintenanceEmailData,
  DocumentInvitationEmailData,
  CollaborationNotificationEmailData,
  ContactFormNotificationEmailData,
  ContactFormConfirmationEmailData,
  DemoRequestNotificationEmailData,
  DemoRequestConfirmationEmailData,
  DemoScheduledEmailData,
  SpreadsheetShareNotificationEmailData,
  BulkTransferEmailData
} from './email/types';
import { OtpType } from '@prisma/client';




export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  replyTo?: string | undefined;
}

export interface SendEmailOptions {
  to: string | string[];
  cc?: string | string[] | undefined;
  bcc?: string | string[] | undefined;
  subject: string;
  html: string;
  text?: string | undefined;
  priority?: 'high' | 'normal' | 'low' | undefined;
  delay?: number | undefined; // Delay in milliseconds
  retries?: number | undefined;
  metadata?: Record<string, any> | undefined;
}
interface BulkEmailOptions {
  recipients: string[];
  subject: string;
  html: string;
  text?: string;
  batchSize?: number;
  delayBetweenBatches?: number;
  metadata?: Record<string, any>;
}



export class EmailService {
  private transporter: nodemailer.Transporter;
  private templateService: EmailTemplateService;
  private queueService: EmailQueueService;
  private analyticsService: EmailAnalyticsService;
  private config: EmailConfig;

  constructor(config: EmailConfig, templateService: EmailTemplateService, queueService: EmailQueueService, analyticsService: EmailAnalyticsService) {
    this.config = config;
    this.templateService = templateService;
    this.queueService = queueService;
    this.analyticsService = analyticsService;

    // Use actual configuration instead of hardcoded localhost values
    this.transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "benjamin.uboegbu@gmail.com",
        pass: "bxoq cyvj luuz mggj",
      },
    });

    // Comment out the old hardcoded configuration for reference

    // OLD HARDCODED CONFIG - COMMENTED OUT FOR REFERENCE
    // this.transporter = nodemailer.createTransport({
    //   host: "localhost",
    //   port: parseInt("25"),
    //   secure: false,
    //   auth: {
    //     user: "",
    //     pass: "",
    //   },
    //   pool: true,
    //   maxConnections: 5,
    //   maxMessages: 100,
    // });


    // Verify connection
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connected successfully');
    } catch (error) {
      console.error('Email service connection failed:', error);
    }
  }

  // Core email sending method
  async sendEmail(options: SendEmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: this.config.from,
        replyTo: this.config.replyTo || this.config.from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
        subject: options.subject,
        html: options.html,
        text: options.text,
        priority: options.priority || 'normal',
      };

      if (options.delay && options.delay > 0) {
        // Queue the email for delayed sending
        await this.queueService.queueEmail({
          ...mailOptions,
          sendAt: new Date(Date.now() + options.delay),
          retries: options.retries ?? 3,
          maxRetries: options.retries ?? 3,
          cc: options.cc as string,
          bcc: options.bcc as string,
          text: options.text as string,
          priority: options.priority as string,
          metadata: options.metadata!,
        });
      } else {
        // Send immediately
        const result = await this.transporter.sendMail(mailOptions);

        // Track analytics
        await this.analyticsService.trackEmailSent({
          messageId: result.messageId,
          to: options.to,
          subject: options.subject,
          metadata: options.metadata!,
        });
      }
    } catch (error) {
      console.error('Failed to send email:', error);

      // Track failed email
      await this.analyticsService.trackEmailFailed({
        to: options.to,
        subject: options.subject,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: options.metadata!,
      });

      throw error;
    }
  }

  // Bulk email sending with rate limiting

  public sendBulkEmail = async (options: BulkEmailOptions): Promise<void> => {
    const {
      recipients,
      subject,
      html,
      text,
      batchSize = 10,
      delayBetweenBatches = 1000,
      metadata,
    } = options;

    // Validate inputs
    if (!recipients || recipients.length === 0) {
      throw new Error('No recipients provided');
    }
    if (!subject || (!html && !text)) {
      throw new Error('Subject and either html or text content are required');
    }

    const batches = this.chunkArray(recipients, batchSize);

    // Skip processing if no batches
    if (batches.length === 0) {
      console.warn('No batches to process');
      return;
    }

    // Use for...of with entries() to ensure type safety
    for (const [i, batch] of batches.entries()) {
      // Skip empty batches
      if (batch.length === 0) {
        console.warn(`Skipping empty batch ${i + 1}/${batches.length}`);
        continue;
      }

      try {
        await Promise.all(
          batch.map(recipient =>
            this.sendEmail({
              to: recipient,
              subject,
              html,
              text,
              priority: 'normal',
              delay: 3,
              retries: 3,
              metadata: { ...metadata, batchIndex: i },
            })
          )
        );

        console.log(`Sent batch ${i + 1}/${batches.length} (${batch.length} emails)`); // No batch! needed

        // Add delay between batches (except for the last batch)
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      } catch (error) {
        console.error(`Failed to send batch ${i + 1}:`, error);
        // Continue with next batch even if current batch fails
      }
    }
  }


  async sendShareNotificationEmail(to: string, data: ShareNotificationEmailData): Promise<void> {
    const html = this.templateService.renderShareNotificationTemplate(data);
    const subject = `📁 ${data.sharedBy} shared "${data.fileName}" with you`;

    await this.sendEmail({
      to,
      subject,
      html,
      metadata: {
        type: 'share_notification',
        fileName: data.fileName,
        sharedBy: data.sharedBy,
      },
    });
  }

  async sendShareApprovalEmail(to: string, data: ShareApprovalEmailData): Promise<void> {
    const html = this.templateService.renderShareApprovalTemplate(data);
    const subject = `✅ Your access to "${data.fileName}" has been approved`;

    await this.sendEmail({
      to,
      subject,
      html,
      metadata: {
        type: 'share_approval',
        fileName: data.fileName,
        approvedBy: data.approvedBy,
      },
    });
  }

  async sendApprovalResponseEmail(to: string, data: {
    fileName: string;
    approved: boolean;
    message?: string;
    shareUrl?: string;
    recipientName: string;
  }): Promise<void> {
    const subject = data.approved
      ? `✅ Your access to "${data.fileName}" has been approved`
      : `❌ Your access request for "${data.fileName}" was declined`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Access Request ${data.approved ? 'Approved' : 'Declined'}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${data.approved ? '#10B981' : '#EF4444'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .status-badge { background: ${data.approved ? '#D1FAE5' : '#FEE2E2'}; color: ${data.approved ? '#065F46' : '#991B1B'}; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block; margin: 10px 0; }
          .message-box { background: white; border-left: 4px solid #4F46E5; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${data.approved ? '✅' : '❌'} Access Request ${data.approved ? 'Approved' : 'Declined'}</h1>
          </div>
          <div class="content">
            <p>Hello ${data.recipientName},</p>
            
            <p>Your request to access <strong>"${data.fileName}"</strong> has been:</p>
            
            <div class="status-badge">
              ${data.approved ? 'APPROVED' : 'DECLINED'}
            </div>
            
            ${data.message ? `
              <div class="message-box">
                <h3>Message from the file owner:</h3>
                <p>${data.message}</p>
              </div>
            ` : ''}
            
            ${data.approved && data.shareUrl ? `
              <p>You can now access the file using the link below:</p>
              <a href="${data.shareUrl}" class="button">Access File</a>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                If you're having trouble clicking the button, copy and paste this URL into your browser:<br>
                <a href="${data.shareUrl}">${data.shareUrl}</a>
              </p>
            ` : ''}
            
            ${!data.approved ? `
              <p>If you believe this was declined in error, you may contact the file owner directly or reach out to our support team.</p>
            ` : ''}
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            
            <p style="font-size: 12px; color: #888;">
              This email was sent in response to your access request. 
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to,
      subject,
      html,
      metadata: {
        type: 'approval_response',
        fileName: data.fileName,
        approved: data.approved,
      },
    });
  }

  async sendShareAccessRequestEmail(to: string, data: ShareAccessRequestEmailData): Promise<void> {
    const html = this.templateService.renderShareAccessRequestTemplate(data);
    const subject = `🔔 Access request for "${data.fileName}"`;

    await this.sendEmail({
      to,
      subject,
      html,
      priority: 'high',
      metadata: {
        type: 'share_access_request',
        fileName: data.fileName,
        requesterEmail: data.requesterEmail,
      },
    });
  }

  async sendCommentNotificationEmail(to: string, data: CommentNotificationEmailData): Promise<void> {
    const html = this.templateService.renderCommentNotificationTemplate(data);
    const subject = `💬 New comment on "${data.fileName}"`;

    await this.sendEmail({
      to,
      subject,
      html,
      metadata: {
        type: 'comment_notification',
        fileName: data.fileName,
        commenterName: data.commenterName,
      },
    });
  }

  async sendShareExpiryEmail(to: string, data: ShareExpiryEmailData): Promise<void> {
    const html = this.templateService.renderShareExpiryTemplate(data);
    const urgency = data.daysUntilExpiry && data.daysUntilExpiry <= 1 ? 'urgent' : 'warning';
    const subject = data.isExpired
      ? `❌ Your share for "${data.fileName}" has expired`
      : `⏰ Your share for "${data.fileName}" expires ${urgency === 'urgent' ? 'soon' : 'in ' + data.daysUntilExpiry + ' days'}`;

    await this.sendEmail({
      to,
      subject,
      html,
      priority: urgency === 'urgent' ? 'high' : 'normal',
      metadata: {
        type: 'share_expiry',
        fileName: data.fileName,
        isExpired: data.isExpired,
        daysUntilExpiry: data.daysUntilExpiry,
      },
    });
  }

  async sendWelcomeEmail(to: string, data: WelcomeEmailData): Promise<void> {
    const html = this.templateService.renderWelcomeTemplate(data);
    const subject = `🎉 Welcome to Qub Drive, ${data.userName}!`;

    await this.sendEmail({
      to,
      subject,
      html,
      metadata: {
        type: 'welcome',
        userName: data.userName,
        userEmail: data.userEmail,
      },
    });
  }
  async sendOtpEmail(to: string, otp: string, type: OtpType, expiresAt: Date): Promise<void> {
    const html = this.templateService.renderOtpEmailTemplate({ otpCode: otp, type, recipientEmail: to, recipientName: '', expiresAt });
    const subject = type === OtpType.EMAIL_VERIFICATION ? 'Verify your email for Qub Drive' : 'Qub Drive Password Reset OTP';

    await this.sendEmail({
      to,
      subject,
      html,
      metadata: {
        type: `otp_${type}`,
      },
    });
  }

  async sendPasswordResetEmail(to: string, data: PasswordResetEmailData): Promise<void> {
    const html = this.templateService.renderPasswordResetTemplate(data);
    const subject = `🔑 Password reset for your FileShare account`;

    await this.sendEmail({
      to,
      subject,
      html,
      priority: 'high',
      metadata: {
        type: 'password_reset',
        userName: data.userName,
      },
    });
  }

  async sendAccountLockedEmail(to: string, data: AccountLockedEmailData): Promise<void> {
    const html = this.templateService.renderAccountLockedTemplate(data);
    const subject = `🔒 Account Security Alert - Account Locked`;

    await this.sendEmail({
      to,
      subject,
      html,
      priority: 'high',
      metadata: {
        type: 'account_locked',
        userName: data.userName,
        lockReason: data.lockReason,
      },
    });
  }

  async sendFileUploadNotificationEmail(to: string, data: FileUploadNotificationEmailData): Promise<void> {
    const html = this.templateService.renderFileUploadNotificationTemplate(data);
    const subject = `📤 New file uploaded: ${data.fileName}`;

    await this.sendEmail({
      to,
      subject,
      html,
      metadata: {
        type: 'file_upload_notification',
        fileName: data.fileName,
        uploadedBy: data.uploadedBy,
        fileSize: data.fileSize,
      },
    });
  }

  async sendSystemMaintenanceEmail(to: string | string[], data: SystemMaintenanceEmailData): Promise<void> {
    const html = this.templateService.renderSystemMaintenanceTemplate(data);
    const isCompleted = data.maintenanceType === 'completed';
    const isEmergency = data.maintenanceType === 'emergency';

    const subject = isCompleted
      ? '✅ System Maintenance Completed'
      : `${isEmergency ? '🚨 Emergency' : '🔧'} System Maintenance ${isEmergency ? 'Alert' : 'Notice'}`;

    await this.sendEmail({
      to,
      subject,
      html,
      priority: isEmergency ? 'high' : 'normal',
      metadata: {
        type: 'system_maintenance',
        maintenanceType: data.maintenanceType,
        impact: data.impact,
        affectedServices: data.affectedServices,
      },
    });
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
      metadata: {
        type: 'document_share',
        documentTitle: data.documentTitle,
        sharedBy: data.sharedByName,
        permission: data.permission,
      },
    });
  }

  // Bulk maintenance notification
  async sendBulkMaintenanceNotification(recipients: string[], data: SystemMaintenanceEmailData): Promise<void> {
    const html = this.templateService.renderSystemMaintenanceTemplate(data);
    const isCompleted = data.maintenanceType === 'completed';
    const isEmergency = data.maintenanceType === 'emergency';

    const subject = isCompleted
      ? '✅ System Maintenance Completed'
      : `${isEmergency ? '🚨 Emergency' : '🔧'} System Maintenance ${isEmergency ? 'Alert' : 'Notice'}`;

    await this.sendBulkEmail({
      recipients,
      subject,
      html,
      batchSize: isEmergency ? 50 : 20, // Send faster for emergency notifications
      delayBetweenBatches: isEmergency ? 500 : 1000,
      metadata: {
        type: 'bulk_system_maintenance',
        maintenanceType: data.maintenanceType,
        impact: data.impact,
      },
    });
  }

  // Send document invitation email
  async sendInvitation(to: string, data: DocumentInvitationEmailData): Promise<void> {
    const template = this.templateService.renderDocumentInvitationTemplate(data);

    await this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      priority: 'normal',
      metadata: {
        type: 'document_invitation',
        documentTitle: data.documentTitle,
        inviterName: data.inviterName,
        role: data.role,
        isExistingUser: data.isExistingUser,
      },
    });
  }

  // Send collaboration notification email
  async sendCollaborationNotification(to: string, data: CollaborationNotificationEmailData): Promise<void> {
    const template = this.templateService.renderCollaborationNotificationTemplate(data);

    await this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      priority: 'normal',
      metadata: {
        type: 'collaboration_notification',
        documentTitle: data.documentTitle,
        addedBy: data.addedBy,
        permission: data.permission,
        collaboratorEmail: data.collaboratorEmail,
      },
    });
  }

  // Send collaboration invite email
  async sendCollaborationInvite(to: string, data: {
    documentTitle: string;
    inviterName: string;
    role: string;
    message?: string;
    documentUrl: string;
    recipientName: string;
  }): Promise<void> {
    const permissionText = {
      'editor': 'edit',
      'commenter': 'comment on',
      'viewer': 'view',
      'admin': 'manage'
    }[data.role.toLowerCase()] || 'access';

    const html = `
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
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .permission-badge { background: #E0E7FF; color: #4F46E5; padding: 4px 12px; border-radius: 20px; font-size: 14px; }
          .message-box { background: white; border-left: 4px solid #4F46E5; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤝 You're Invited to Collaborate</h1>
          </div>
          <div class="content">
            <p>Hello ${data.recipientName},</p>
            
            <p><strong>${data.inviterName}</strong> has invited you to collaborate on a document:</p>
            
            <h2 style="color: #4F46E5;">"${data.documentTitle}"</h2>
            
            <p>You have been granted <span class="permission-badge">${permissionText}</span> permissions.</p>
            
            ${data.message ? `
              <div class="message-box">
                <h3>Message from ${data.inviterName}:</h3>
                <p>${data.message}</p>
              </div>
            ` : ''}
            
            <p>Click the button below to start collaborating:</p>
            
            <a href="${data.documentUrl}" class="button">Open Document</a>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              If you're having trouble clicking the button, copy and paste this URL into your browser:<br>
              <a href="${data.documentUrl}">${data.documentUrl}</a>
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            
            <p style="font-size: 12px; color: #888;">
              This email was sent because ${data.inviterName} invited you to collaborate on their document. 
              If you believe this was sent in error, please contact support.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const subject = `🤝 ${data.inviterName} invited you to collaborate on "${data.documentTitle}"`;

    await this.sendEmail({
      to,
      subject,
      html,
      metadata: {
        type: 'collaboration_invite',
        documentTitle: data.documentTitle,
        inviterName: data.inviterName,
        role: data.role,
      },
    });
  }

  // Send contact form notification email to sales team
  async sendContactFormNotificationEmail(to: string, data: ContactFormNotificationEmailData): Promise<void> {
    const template = this.templateService.renderContactFormNotificationTemplate(data);

    await this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      priority: 'high',
      metadata: {
        type: 'contact_form_notification',
        submissionId: data.submissionId,
        planInterest: data.planInterest,
        company: data.company,
        email: data.email,
      },
    });
  }

  // Send contact form confirmation email to customer
  async sendContactFormConfirmationEmail(to: string, data: ContactFormConfirmationEmailData): Promise<void> {
    const template = this.templateService.renderContactFormConfirmationTemplate(data);

    await this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      priority: 'normal',
      metadata: {
        type: 'contact_form_confirmation',
        submissionId: data.submissionId,
        planInterest: data.planInterest,
        company: data.company,
      },
    });
  }

  // Send demo request notification email to sales team
  async sendDemoRequestNotificationEmail(to: string, data: DemoRequestNotificationEmailData): Promise<void> {
    const template = this.templateService.renderDemoRequestNotificationTemplate(data);

    await this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      priority: 'high',
      metadata: {
        type: 'demo_request_notification',
        requestId: data.requestId,
        demoType: data.demoType,
        planInterest: data.planInterest,
        company: data.company,
        email: data.email,
      },
    });
  }

  // Send demo request confirmation email to customer
  async sendDemoRequestConfirmationEmail(to: string, data: DemoRequestConfirmationEmailData): Promise<void> {
    const template = this.templateService.renderDemoRequestConfirmationTemplate(data);

    await this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      priority: 'normal',
      metadata: {
        type: 'demo_request_confirmation',
        requestId: data.requestId,
        demoType: data.demoType,
        planInterest: data.planInterest,
        company: data.company,
      },
    });
  }

  // Send demo scheduled notification email
  async sendDemoScheduledEmail(to: string, data: DemoScheduledEmailData): Promise<void> {
    const template = this.templateService.renderDemoScheduledTemplate(data);

    await this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      priority: 'normal',
      metadata: {
        type: 'demo_scheduled',
        requestId: data.requestId,
        planInterest: data.planInterest,
        company: data.company,
        scheduledDate: data.scheduledDate.toISOString(),
        assignedTo: data.assignedTo,
      },
    });
  }

  // Utility methods
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Health check
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      await this.transporter.verify();
      const queueStatus = await this.queueService.getQueueStatus();

      return {
        status: 'healthy',
        details: {
          connection: 'connected',
          queue: queueStatus,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          connection: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  // Close connections
  async close(): Promise<void> {
    this.transporter.close();
    await this.queueService.close();
  }

  async sendSpreadsheetShareNotification(data: SpreadsheetShareNotificationEmailData): Promise<void> {
    try {
      const subject = `${data.granterName} shared a spreadsheet with you`;
      const permissionText = data.permission.toLowerCase() === 'view' ? 'view' :
        data.permission.toLowerCase() === 'edit' ? 'edit' : 'collaborate on';

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited to ${permissionText} a spreadsheet</h2>
          <p>Hi ${data.recipientName},</p>
          <p><strong>${data.granterName}</strong> has shared the spreadsheet "<strong>${data.spreadsheetTitle}</strong>" with you.</p>
          <p>You have <strong>${data.permission.toLowerCase()}</strong> access to this spreadsheet.</p>
          <div style="margin: 30px 0;">
            <a href="${data.spreadsheetUrl}" 
               style="background-color: #4285f4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Open Spreadsheet
            </a>
          </div>
          <p>Best regards,<br>The Team</p>
        </div>
      `;

      const text = `
        You've been invited to ${permissionText} a spreadsheet
        
        Hi ${data.recipientName},
        
        ${data.granterName} has shared the spreadsheet "${data.spreadsheetTitle}" with you.
        You have ${data.permission.toLowerCase()} access to this spreadsheet.
        
        Open the spreadsheet: ${data.spreadsheetUrl}
        
        Best regards,
        The Team
      `;

      await this.sendEmail({
        to: data.recipientEmail,
        subject,
        html,
        text,
        priority: 'normal'
      });

      await this.analyticsService.trackEmail({
        to: data.recipientEmail,
        subject,
        type: 'spreadsheet_share',
        status: 'sent'
      });

    } catch (error) {
      console.error('Failed to send spreadsheet share notification:', error);
      await this.analyticsService.trackEmail({
        to: data.recipientEmail,
        subject: 'Spreadsheet Share Notification',
        type: 'spreadsheet_share',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async sendBulkTransferEmail(data: any): Promise<void> {
    try {
      // Ensure we have required fields
      if (!data.recipientEmail && !data.senderEmail) {
        console.warn('No recipient or sender email provided for bulk transfer notification');
        return;
      }

      const recipient = data.recipientEmail || data.senderEmail;

      // Build the email data with proper types
      const emailData: BulkTransferEmailData = {
        title: data.title,
        message: data.message,
        senderEmail: data.senderEmail,
        senderName: data.senderName || data.senderEmail?.split('@')[0],
        recipientEmail: data.recipientEmail,
        recipientName: data.recipientName || data.recipientEmail?.split('@')[0],
        fileCount: data.fileCount || 1,
        totalSize: data.totalSize || '0 MB',
        downloadUrl: data.downloadUrl || data.shareLink || '#',
        expiresAt: data.expiresAt || new Date(Date.now() + data.expirationDays * 24 * 60 * 60 * 1000),
        downloadLimit: data.downloadLimit,
        hasPassword: !!data.password,
        trackingEnabled: data.trackingEnabled || false,
      };

      const html = this.templateService.renderBulkTransferTemplate(emailData);
      const subject = `📦 ${emailData.senderName || 'Someone'} sent you ${emailData.fileCount} file${emailData.fileCount > 1 ? 's' : ''} via Qub Drive`;

      await this.sendEmail({
        to: recipient,
        subject,
        html,
        priority: 'normal',
        metadata: {
          type: 'bulk_transfer',
          fileCount: emailData.fileCount,
          totalSize: emailData.totalSize,
          senderEmail: emailData.senderEmail,
        },
      });

      console.log(`✅ Bulk transfer email sent to ${recipient}`);
    } catch (error) {
      console.error('Failed to send bulk transfer email:', error);
      // Don't throw error, just log it to prevent breaking the transfer creation
    }
  }
}




// Basic Email Sending:
// typescriptconst emailService = EmailServiceFactory.create(prisma);

// await emailService.sendShareNotificationEmail('user@example.com', {
//   fileName: 'document.pdf',
//   sharedBy: 'John Doe',
//   shareUrl: 'https://app.com/share/abc123',
//   message: 'Please review this document',
//   expiresAt: new Date('2024-12-31'),
// });
// Bulk Email with Rate Limiting:
// typescriptawait emailService.sendBulkEmail({
//   recipients: ['user1@example.com', 'user2@example.com'],
//   subject: 'Weekly Report',
//   html: templateHtml,
//   batchSize: 10,
//   delayBetweenBatches: 2000,
// });
// Delayed Email:
// typescriptawait emailService.sendEmail({
//   to: 'user@example.com',
//   subject: 'Reminder',
//   html: reminderHtml,
//   delay: 24 * 60 * 60 * 1000, // 24 hours
// });
// 5. Configuration Support
// Multiple Email Providers:
// typescript// SMTP, SendGrid, AWS SES, Mailgun support
// const emailService = EmailServiceFactory.create(prisma, {
//   provider: 'sendgrid',
//   apiKey: process.env.SENDGRID_API_KEY,
// });
// Environment Variables:
// bash# SMTP Configuration
// SMTP_HOST = smtp.gmail.com
// SMTP_PORT = 587
// SMTP_SECURE = false
// SMTP_USER = your - email@gmail.com
// SMTP_PASS = your - app - password
// SMTP_FROM = noreply@yourapp.com

// # Company Branding
// COMPANY_NAME = Qub Drive
// COMPANY_LOGO = https://yourapp.com/logo.png
// SUPPORT_EMAIL = support@yourapp.com

// # Provider - specific
// SENDGRID_API_KEY = your - sendgrid - key
// AWS_SES_ACCESS_KEY = your - aws - key

// 9. Testing Support
// typescript// Mock services for unit testing
// const emailService = EmailServiceFactory.createForTesting();
// 10. Integration Points
// typescript// Easy integration with existing notification service
// const notificationService = new NotificationServiceImpl(
//   prisma,
//   emailService  // Uses consolidated email service
// );