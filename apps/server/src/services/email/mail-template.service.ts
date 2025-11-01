
import {
    renderShareNotificationTemplate,
    renderShareApprovalTemplate,
    renderShareAccessRequestTemplate,
    renderCommentNotificationTemplate,
    renderShareExpiryTemplate,
    renderWelcomeTemplate,
    renderPasswordResetTemplate,
    renderOtpEmailTemplate,
    renderAccountLockedTemplate,
    renderFileUploadNotificationTemplate,
    renderSystemMaintenanceTemplate,
    renderDocumentInvitationTemplate,
    renderCollaborationNotificationTemplate,
    renderBulkTransferTemplate,
} from './index';

// Import contact form templates
import { contactFormNotificationTemplate } from './contact-form-notification.template';
import { contactFormConfirmationTemplate } from './contact-form-confirmation.template';

// Import demo templates
import { demoRequestNotificationTemplate } from './demo-request-notification.template';
import { demoRequestConfirmationTemplate } from './demo-request-confirmation.template';
import { demoScheduledTemplate } from './demo-scheduled.template';

// Import types from local types file
import {
    ShareNotificationEmailData,
    ShareApprovalEmailData,
    ShareAccessRequestEmailData,
    CommentNotificationEmailData,
    ShareExpiryEmailData,
    WelcomeEmailData,
    PasswordResetEmailData,
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
    BulkTransferEmailData,
} from './types';

export class EmailTemplateService {
    renderShareNotificationTemplate(data: ShareNotificationEmailData): string {
        return renderShareNotificationTemplate(data);
    }

    renderShareApprovalTemplate(data: ShareApprovalEmailData): string {
        return renderShareApprovalTemplate(data);
    }

    renderShareAccessRequestTemplate(data: ShareAccessRequestEmailData): string {
        return renderShareAccessRequestTemplate(data);
    }

    renderCommentNotificationTemplate(data: CommentNotificationEmailData): string {
        return renderCommentNotificationTemplate(data);
    }

    renderShareExpiryTemplate(data: ShareExpiryEmailData): string {
        return renderShareExpiryTemplate(data);
    }

    renderWelcomeTemplate(data: WelcomeEmailData): string {
        return renderWelcomeTemplate(data);
    }

    renderPasswordResetTemplate(data: PasswordResetEmailData): string {
        return renderPasswordResetTemplate(data);
    }

    renderOtpEmailTemplate(data: OtpEmailData): string {
        return renderOtpEmailTemplate(data);
    }

    renderAccountLockedTemplate(data: AccountLockedEmailData): string {
        return renderAccountLockedTemplate(data);
    }

    renderFileUploadNotificationTemplate(data: FileUploadNotificationEmailData): string {
        return renderFileUploadNotificationTemplate(data);
    }

    renderSystemMaintenanceTemplate(data: SystemMaintenanceEmailData): string {
        return renderSystemMaintenanceTemplate(data);
    }

    renderDocumentInvitationTemplate(data: DocumentInvitationEmailData): { subject: string; html: string; text: string } {
        return renderDocumentInvitationTemplate(data);
    }

    renderCollaborationNotificationTemplate(data: CollaborationNotificationEmailData): { subject: string; html: string; text: string } {
        return renderCollaborationNotificationTemplate(data);
    }

    renderContactFormNotificationTemplate(data: ContactFormNotificationEmailData): { subject: string; html: string; text: string } {
        return contactFormNotificationTemplate.generate(data);
    }

    renderContactFormConfirmationTemplate(data: ContactFormConfirmationEmailData): { subject: string; html: string; text: string } {
        return contactFormConfirmationTemplate.generate(data);
    }

    renderDemoRequestNotificationTemplate(data: DemoRequestNotificationEmailData): { subject: string; html: string; text: string } {
        return demoRequestNotificationTemplate.generate(data);
    }

    renderDemoRequestConfirmationTemplate(data: DemoRequestConfirmationEmailData): { subject: string; html: string; text: string } {
        return demoRequestConfirmationTemplate.generate(data);
    }

    renderDemoScheduledTemplate(data: DemoScheduledEmailData): { subject: string; html: string; text: string } {
        return demoScheduledTemplate.generate(data);
    }

    renderBulkTransferTemplate(data: BulkTransferEmailData): string {
        return renderBulkTransferTemplate(data);
    }

    // Custom template rendering
    renderCustomTemplate(
        templateName: string,
        _data: Record<string, any>
    ): string {
        // Implementation for custom templates
        // This could load templates from a database or file system
        throw new Error(`Custom template '${templateName}' not implemented`);
    }

    // Template validation
    validateTemplateData(
        templateType: string,
        data: Record<string, any>
    ): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        switch (templateType) {
            case 'share_notification':
                if (!data['fileName']) errors.push('fileName is required');
                if (!data['sharedBy']) errors.push('sharedBy is required');
                if (!data['shareUrl']) errors.push('shareUrl is required');
                break;
            case 'share_approval':
                if (!data['fileName']) errors.push('fileName is required');
                if (!data['approvedBy']) errors.push('approvedBy is required');
                if (!data['shareUrl']) errors.push('shareUrl is required');
                break;
            case 'welcome':
                if (!data['userName']) errors.push('userName is required');
                if (!data['userEmail']) errors.push('userEmail is required');
                if (!data['dashboardUrl']) errors.push('dashboardUrl is required');
                break;
            case 'contact_form_notification':
                if (!data['firstName']) errors.push('firstName is required');
                if (!data['lastName']) errors.push('lastName is required');
                if (!data['email']) errors.push('email is required');
                if (!data['company']) errors.push('company is required');
                if (!data['message']) errors.push('message is required');
                if (!data['planInterest']) errors.push('planInterest is required');
                break;
            case 'contact_form_confirmation':
                if (!data['firstName']) errors.push('firstName is required');
                if (!data['lastName']) errors.push('lastName is required');
                if (!data['submissionId']) errors.push('submissionId is required');
                if (!data['planInterest']) errors.push('planInterest is required');
                if (!data['company']) errors.push('company is required');
                break;
            case 'demo_request_notification':
                if (!data['firstName']) errors.push('firstName is required');
                if (!data['lastName']) errors.push('lastName is required');
                if (!data['email']) errors.push('email is required');
                if (!data['company']) errors.push('company is required');
                if (!data['demoType']) errors.push('demoType is required');
                if (!data['planInterest']) errors.push('planInterest is required');
                if (!data['useCase']) errors.push('useCase is required');
                if (!data['requestId']) errors.push('requestId is required');
                if (!data['submittedAt']) errors.push('submittedAt is required');
                if (!data['companySize']) errors.push('companySize is required');
                break;
            case 'demo_request_confirmation':
                if (!data['firstName']) errors.push('firstName is required');
                if (!data['lastName']) errors.push('lastName is required');
                if (!data['demoType']) errors.push('demoType is required');
                if (!data['planInterest']) errors.push('planInterest is required');
                if (!data['company']) errors.push('company is required');
                if (!data['useCase']) errors.push('useCase is required');
                if (!data['requestId']) errors.push('requestId is required');
                break;
            case 'demo_scheduled':
                if (!data['firstName']) errors.push('firstName is required');
                if (!data['planInterest']) errors.push('planInterest is required');
                if (!data['company']) errors.push('company is required');
                if (!data['useCase']) errors.push('useCase is required');
                if (!data['scheduledDate']) errors.push('scheduledDate is required');
                if (!data['requestId']) errors.push('requestId is required');
                break;
            // Add more validation rules as needed
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}

