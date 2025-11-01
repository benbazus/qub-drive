//import { EmailConfig, EmailService } from '../email.service';
import { EmailConfig, EmailService } from '../email.service';
import { EmailAnalyticsService } from './email-analytics.service';
import { EmailQueueService } from './email-queue.service';
import { EmailTemplateService } from './mail-template.service';



export class EmailServiceFactory {
  /**
   * Creates a production-ready EmailService instance with full functionality
   * @param config Optional email configuration overrides
   * @returns Configured EmailService instance
   */
  static create(config?: Partial<EmailConfig>): EmailService {
    // Validate and build email configuration
    const emailConfig: EmailConfig = this.buildEmailConfig(config);

    // Validate configuration before creating services
    this.validateEmailConfig(emailConfig);

    // Create service dependencies
    const templateService = new EmailTemplateService();
    const queueService = new EmailQueueService();
    const analyticsService = new EmailAnalyticsService();

    console.log('✅ EmailService created with configuration:', {
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      from: emailConfig.from,
      hasAuth: !!(emailConfig.auth.user && emailConfig.auth.pass)
    });

    return new EmailService(
      emailConfig,
      templateService,
      queueService,
      analyticsService
    );
  }

  /**
   * Creates different email service configurations for various providers
   */
  static createWithProvider(provider: 'gmail' | 'outlook' | 'sendgrid' | 'ses', config: any): EmailService {
    let emailConfig: EmailConfig;

    switch (provider) {
      case 'gmail':
        emailConfig = this.createGmailConfig(config);
        break;
      case 'outlook':
        emailConfig = this.createOutlookConfig(config);
        break;
      case 'sendgrid':
        // Note: SendGrid would require a different implementation using their API
        throw new Error('SendGrid provider requires API-based implementation, not SMTP');
      case 'ses':
        emailConfig = this.createSESConfig(config);
        break;
      default:
        throw new Error(`Unsupported email provider: ${provider}`);
    }

    const templateService = new EmailTemplateService();
    const queueService = new EmailQueueService();
    const analyticsService = new EmailAnalyticsService();

    return new EmailService(emailConfig, templateService, queueService, analyticsService);
  }

  static createForTesting(): EmailService {
    const mockConfig: EmailConfig = {
      host: 'localhost',
      port: 587,
      secure: false,
      auth: { user: 'test', pass: 'test' },
      from: 'test@example.com',
    };

    // Use in-memory implementations for testing
    const templateService = new EmailTemplateService();
    const queueService = new MockEmailQueueService();
    const analyticsService = new MockEmailAnalyticsService();

    console.log('🧪 Mock EmailService created for testing');

    return new EmailService(
      mockConfig,
      templateService,
      queueService as any,
      analyticsService as any
    );
  }


  private static buildEmailConfig(config?: Partial<EmailConfig>): EmailConfig {

    console.log("11111111 build Email Config 1111111111")

    return {
      host: config?.host || process.env['SMTP_HOST'] || 'localhost',
      port: config?.port || parseInt(process.env['SMTP_PORT'] || '587'),
      secure: config?.secure ?? (process.env['SMTP_SECURE'] === 'true'),
      auth: {
        user: config?.auth?.user || process.env['SMTP_USER'] || '',
        pass: config?.auth?.pass || process.env['SMTP_PASS'] || '',
      },
      from: config?.from || process.env['SMTP_FROM'] || 'marvin.ssekebi@gmail.com',
      replyTo: config?.replyTo || process.env['SMTP_REPLY_TO'],
    };
  }


  private static validateEmailConfig(config: EmailConfig): void {
    const errors: string[] = [];

    console.log("11111111 Validate Email Config 1111111111")

    if (!config.host) errors.push('SMTP host is required');
    if (!config.port || config.port <= 0) errors.push('Valid SMTP port is required');
    if (!config.from) errors.push('From email address is required');

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(config.from)) {
      errors.push('From email address must be valid');
    }

    if (config.replyTo && !emailRegex.test(config.replyTo)) {
      errors.push('Reply-to email address must be valid');
    }

    // Warn about missing auth (but don't fail for local development)
    if (!config.auth.user || !config.auth.pass) {
      console.warn('⚠️  SMTP authentication not configured - emails may fail in production');
    }

    if (errors.length > 0) {
      throw new Error(`Email configuration validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Creates Gmail SMTP configuration
   */
  private static createGmailConfig(config: { user: string; pass: string; from?: string }): EmailConfig {
    console.log("11111111 create-Gmail-Config 1111111111")
    return {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
        user: "benjamin.uboegbu@gmail.com",//config.user,
        pass: "ivlziwugyqeewgxz",// config.pass, // Use App Password, not regular password
      },
      from: "benjamin.uboegbu@gmail.com",//config.from || config.user,
    };
  }

  /**
   * Creates Outlook/Hotmail SMTP configuration
   */
  private static createOutlookConfig(config: { user: string; pass: string; from?: string }): EmailConfig {
    return {
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
        user: config.user,
        pass: config.pass,
      },
      from: config.from || config.user,
    };
  }

  /**
   * Creates AWS SES SMTP configuration
   */
  private static createSESConfig(config: {
    region: string;
    accessKey: string;
    secretKey: string;
    from: string
  }): EmailConfig {
    return {
      host: `email-smtp.${config.region}.amazonaws.com`,
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
        user: config.accessKey,
        pass: config.secretKey,
      },
      from: config.from,
    };
  }
}

// Mock services for testing
class MockEmailQueueService {
  private queue: any[] = [];

  async queueEmail(email: any): Promise<string> {
    const id = Math.random().toString(36);
    this.queue.push({ ...email, id });
    return id;
  }

  async getQueueStatus() {
    return {
      pending: this.queue.length,
      sent: 0,
      failed: 0,
      processing: false,
    };
  }

  async close(): Promise<void> {
    this.queue = [];
  }
}

class MockEmailAnalyticsService {
  private events: any[] = [];

  async trackEmailSent(event: any): Promise<void> {
    this.events.push({ ...event, status: 'sent', timestamp: new Date() });
  }

  async trackEmailFailed(event: any): Promise<void> {
    this.events.push({ ...event, status: 'failed', timestamp: new Date() });
  }

  async getAnalytics() {
    return {
      totalSent: this.events.filter(e => e.status === 'sent').length,
      totalFailed: this.events.filter(e => e.status === 'failed').length,
      successRate: 100,
      topEmailTypes: [],
      recentActivity: [],
    };
  }
}


// ================================
// COMPREHENSIVE USAGE EXAMPLES
// ================================

/*
// 1. BASIC EMAIL SERVICE SETUP
// =============================

// Create email service with default configuration (uses environment variables)
const emailService = EmailServiceFactory.create();

// Create with custom configuration
const emailService = EmailServiceFactory.create({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  },
  from: 'noreply@yourapp.com'
});

// Create with specific provider
const gmailService = EmailServiceFactory.createWithProvider('gmail', {
  user: 'your-email@gmail.com',
  pass: 'your-app-password',
  from: 'noreply@yourapp.com'
});

// Create for testing
const testEmailService = EmailServiceFactory.createForTesting();


// 2. ENVIRONMENT VARIABLES SETUP
// ===============================

// Add these to your .env file:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourapp.com
SMTP_REPLY_TO=support@yourapp.com

// Company branding (optional)
COMPANY_NAME=FileShare
COMPANY_LOGO=https://yourapp.com/logo.png
SUPPORT_EMAIL=support@yourapp.com
FRONTEND_URL=https://yourapp.com


// 3. BASIC EMAIL SENDING
// =======================

// Send a simple email
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to our platform',
  html: '<h1>Welcome!</h1><p>Thanks for joining us.</p>',
  text: 'Welcome! Thanks for joining us.'
});

// Send to multiple recipients
await emailService.sendEmail({
  to: ['user1@example.com', 'user2@example.com'],
  cc: 'manager@example.com',
  bcc: 'admin@example.com',
  subject: 'Team Update',
  html: '<p>Important team update...</p>',
  priority: 'high'
});


// 4. TEMPLATE-BASED EMAILS
// =========================

// Send welcome email
await emailService.sendWelcomeEmail('newuser@example.com', {
  userName: 'John Doe',
  userEmail: 'newuser@example.com',
  dashboardUrl: 'https://yourapp.com/dashboard',
  verificationUrl: 'https://yourapp.com/verify/token123',
  isEmailVerificationRequired: true,
  recipientName: 'John',
  companyName: 'FileShare',
  supportEmail: 'support@yourapp.com'
});

// Send share notification
await emailService.sendShareNotificationEmail('recipient@example.com', {
  fileName: 'Important Document.pdf',
  sharedBy: 'Jane Smith',
  message: 'Please review this document by Friday',
  shareUrl: 'https://yourapp.com/share/abc123',
  fileSize: '2.5 MB',
  fileType: 'PDF Document',
  expiresAt: new Date('2024-12-31'),
  recipientName: 'John',
  requireApproval: false
});

// Send password reset email
await emailService.sendPasswordResetEmail('user@example.com', {
  userName: 'John Doe',
  resetUrl: 'https://yourapp.com/reset/token456',
  expiresIn: '1 hour',
  requestedAt: new Date(),
  recipientName: 'John'
});

// Send OTP email
await emailService.sendOtpEmail(
  'user@example.com',
  '123456',
  'REGISTRATION', // or 'PASSWORD_RESET'
  new Date(Date.now() + 10 * 60 * 1000) // expires in 10 minutes
);


// 5. BULK EMAIL SENDING
// ======================

// Send bulk emails with rate limiting
await emailService.sendBulkEmail({
  recipients: [
    'user1@example.com',
    'user2@example.com',
    'user3@example.com'
  ],
  subject: 'Monthly Newsletter',
  html: '<h1>Newsletter</h1><p>This month\'s updates...</p>',
  text: 'Newsletter: This month\'s updates...',
  batchSize: 10,           // Send 10 emails at a time
  delayBetweenBatches: 2000, // Wait 2 seconds between batches
  metadata: {
    campaign: 'monthly_newsletter',
    type: 'marketing'
  }
});


// 6. DELAYED EMAIL SENDING
// =========================

// Send email after 1 hour delay
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Reminder: Complete your profile',
  html: '<p>Don\'t forget to complete your profile setup!</p>',
  delay: 60 * 60 * 1000, // 1 hour in milliseconds
  retries: 3,
  metadata: {
    type: 'reminder',
    trigger: 'incomplete_profile'
  }
});

// Send reminder 24 hours before expiry
const expiryDate = new Date('2024-12-31');
const reminderDate = new Date(expiryDate.getTime() - 24 * 60 * 60 * 1000);
const delayMs = reminderDate.getTime() - Date.now();

if (delayMs > 0) {
  await emailService.sendShareExpiryEmail('user@example.com', {
    fileName: 'Contract.pdf',
    expiresAt: expiryDate,
    shareUrl: 'https://yourapp.com/share/xyz789',
    daysUntilExpiry: 1,
    isExpired: false,
    recipientName: 'John'
  });
}


// 7. INTEGRATION WITH NOTIFICATION SERVICE
// =========================================

export class NotificationServiceImpl implements NotificationService {
  constructor(
    private prisma: PrismaClient,
    private emailService: EmailService = EmailServiceFactory.create()
  ) {}

  async sendShareNotification(shareId: string, userId: string, message?: string): Promise<void> {
    try {
      // Get share and user data from database
      const share = await this.prisma.share.findUnique({
        where: { id: shareId },
        include: {
          file: true,
          createdBy: true
        }
      });

      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!share || !user) {
        throw new Error('Share or user not found');
      }

      // Send notification email
      await this.emailService.sendShareNotificationEmail(user.email, {
        fileName: share.file.fileName,
        sharedBy: share.createdBy.name || share.createdBy.email,
        message,
        shareUrl: `${process.env.FRONTEND_URL}/share/${share.shareToken || share.id}`,
        fileSize: this.formatFileSize(share.file.fileSize),
        fileType: share.file.mimeType,
        expiresAt: share.expiresAt,
        recipientName: user.name || user.email.split('@')[0],
        requireApproval: share.requireApproval
      });

      // Log notification
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'SHARE_NOTIFICATION',
          title: `File shared: ${share.file.fileName}`,
          message: `${share.createdBy.name} shared a file with you`,
          metadata: { shareId, emailSent: true }
        }
      });

    } catch (error) {
      console.error('Failed to send share notification:', error);
      throw error;
    }
  }

  async sendBulkShareNotifications(shareIds: string[]): Promise<void> {
    const notifications = await Promise.all(
      shareIds.map(async (shareId) => {
        const share = await this.prisma.share.findUnique({
          where: { id: shareId },
          include: { file: true, createdBy: true, user: true }
        });
        return share;
      })
    );

    const validNotifications = notifications.filter(Boolean);

    await this.emailService.sendBulkEmail({
      recipients: validNotifications.map(n => n!.user.email),
      subject: 'New files shared with you',
      html: this.generateBulkShareHtml(validNotifications),
      batchSize: 20,
      delayBetweenBatches: 1000,
      metadata: { type: 'bulk_share_notification' }
    });
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  private generateBulkShareHtml(shares: any[]): string {
    // Generate HTML for bulk share notification
    return `
      <h2>New Files Shared With You</h2>
      <p>You have ${shares.length} new file(s) shared with you:</p>
      <ul>
        ${shares.map(share => `
          <li>
            <strong>${share.file.fileName}</strong> 
            shared by ${share.createdBy.name}
            <br>
            <a href="${process.env.FRONTEND_URL}/share/${share.shareToken}">View File</a>
          </li>
        `).join('')}
      </ul>
    `;
  }
}


// 8. EMAIL SERVICE HEALTH MONITORING
// ===================================

// Check email service health
const healthStatus = await emailService.healthCheck();
console.log('Email service status:', healthStatus);

// Get queue statistics
const queueStatus = await emailService.queueService?.getQueueStatus();
console.log('Email queue status:', queueStatus);

// Get analytics
const analytics = await emailService.analyticsService?.getAnalytics(30); // Last 30 days
console.log('Email analytics:', analytics);


// 9. ERROR HANDLING AND RETRY LOGIC
// ==================================

async function sendEmailWithRetry(emailData: any, maxRetries = 3): Promise<void> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await emailService.sendEmail(emailData);
      console.log(`✅ Email sent successfully on attempt ${attempt}`);
      return;
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️  Email send attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Failed to send email after ${maxRetries} attempts: ${lastError?.message}`);
}


// 10. TESTING EXAMPLES
// =====================

// Unit test example
describe('EmailService', () => {
  let emailService: EmailService;

  beforeEach(() => {
    emailService = EmailServiceFactory.createForTesting();
  });

  it('should send welcome email', async () => {
    await expect(emailService.sendWelcomeEmail('test@example.com', {
      userName: 'Test User',
      userEmail: 'test@example.com',
      dashboardUrl: 'https://test.com/dashboard'
    })).resolves.not.toThrow();
  });

  it('should handle bulk email sending', async () => {
    await expect(emailService.sendBulkEmail({
      recipients: ['test1@example.com', 'test2@example.com'],
      subject: 'Test',
      html: '<p>Test</p>',
      batchSize: 1
    })).resolves.not.toThrow();
  });
});


// 11. PACKAGE.JSON DEPENDENCIES
// ==============================

{
  "dependencies": {
    "nodemailer": "^6.9.8",
    "node-cron": "^3.0.3",
    "@prisma/client": "^5.7.1"
  },
  "devDependencies": {
    "@types/nodemailer": "^6.4.14",
    "@types/node-cron": "^3.0.8"
  }
}


// 12. PRISMA SCHEMA ADDITIONS
// ============================

// Add these models to your schema.prisma:

model EmailQueue {
  id          String   @id @default(cuid())
  to          String
  cc          String?
  bcc         String?
  subject     String
  html        String   @db.Text
  text        String?  @db.Text
  priority    String   @default("normal")
  sendAt      DateTime
  retries     Int      @default(0)
  maxRetries  Int      @default(3)
  status      String   @default("pending") // pending, sent, failed, cancelled
  error       String?  @db.Text
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([status, sendAt])
  @@index([createdAt])
}

model EmailAnalytics {
  id          String   @id @default(cuid())
  messageId   String?
  recipients  String
  subject     String
  status      String   // sent, failed
  emailType   String   // welcome, share_notification, etc.
  error       String?  @db.Text
  metadata    Json?
  sentAt      DateTime @default(now())

  @@index([status, sentAt])
  @@index([emailType, sentAt])
}

*/