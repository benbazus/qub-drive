import { ContactFormData, ContactSubmission } from '../types/contact.types';
import { EmailServiceFactory } from './email/email-service.factory';

class ContactService {
  private submissions: Map<string, ContactSubmission> = new Map();
  private emailService = EmailServiceFactory.create();

  async submitContactForm(formData: ContactFormData): Promise<ContactSubmission> {
    const submissionId = `contact_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const submission: ContactSubmission = {
      ...formData,
      id: submissionId,
      submittedAt: new Date(),
      status: 'new'
    };

    // Store the submission
    this.submissions.set(submissionId, submission);

    // Send notification email to sales team
    await this.sendSalesNotification(submission);

    // Send confirmation email to the customer
    await this.sendCustomerConfirmation(submission);

    return submission;
  }

  async getSubmission(submissionId: string): Promise<ContactSubmission | null> {
    return this.submissions.get(submissionId) || null;
  }

  async getAllSubmissions(): Promise<ContactSubmission[]> {
    return Array.from(this.submissions.values()).sort(
      (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()
    );
  }

  async updateSubmissionStatus(
    submissionId: string, 
    status: ContactSubmission['status'],
    assignedTo?: string,
    notes?: string
  ): Promise<ContactSubmission | null> {
    const submission = this.submissions.get(submissionId);
    if (!submission) {
      return null;
    }

    submission.status = status;
    if (assignedTo) submission.assignedTo = assignedTo;
    if (notes) submission.notes = notes;

    this.submissions.set(submissionId, submission);
    return submission;
  }

  private async sendSalesNotification(submission: ContactSubmission): Promise<void> {
    try {
      await this.emailService.sendContactFormNotificationEmail(
        process.env.SALES_EMAIL || 'sales@loveworld.com',
        {
          submissionId: submission.id,
          firstName: submission.firstName,
          lastName: submission.lastName,
          email: submission.email,
          company: submission.company,
          jobTitle: submission.jobTitle,
          phone: submission.phone,
          companySize: submission.companySize,
          message: submission.message,
          planInterest: submission.planInterest,
          submittedAt: submission.submittedAt,
          companyName: process.env.COMPANY_NAME || 'Loveworld Suite',
          supportEmail: process.env.SUPPORT_EMAIL || 'support@loveworld.com'
        }
      );
    } catch (error) {
      console.error('Failed to send sales notification:', error);
      // Don't throw here - we don't want contact form submission to fail due to email issues
    }
  }

  private async sendCustomerConfirmation(submission: ContactSubmission): Promise<void> {
    try {
      await this.emailService.sendContactFormConfirmationEmail(
        submission.email,
        {
          firstName: submission.firstName,
          lastName: submission.lastName,
          submissionId: submission.id,
          planInterest: submission.planInterest,
          company: submission.company,
          companyName: process.env.COMPANY_NAME || 'Loveworld Suite',
          supportEmail: process.env.SUPPORT_EMAIL || 'support@loveworld.com'
        }
      );
    } catch (error) {
      console.error('Failed to send customer confirmation:', error);
      // Don't throw here - we don't want contact form submission to fail due to email issues
    }
  }

  async getSubmissionsByStatus(status: ContactSubmission['status']): Promise<ContactSubmission[]> {
    return Array.from(this.submissions.values())
      .filter(submission => submission.status === status)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }

  async getSubmissionsByPlan(planInterest: string): Promise<ContactSubmission[]> {
    return Array.from(this.submissions.values())
      .filter(submission => submission.planInterest.toLowerCase() === planInterest.toLowerCase())
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }
}

export default new ContactService();