import { BaseTemplate } from './base-template';
import { ContactFormNotificationEmailData } from './types';

export class ContactFormNotificationTemplate extends BaseTemplate {
  generate(data: ContactFormNotificationEmailData): { html: string; text: string; subject: string } {
    const subject = `New Contact Form Submission - ${data.planInterest} Interest`;

    const html = `
      ${this.getHeader(data)}
      
      <div style="background-color: #ffffff; margin: 0 auto; max-width: 600px; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <!-- Header Section -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            📧 New Contact Form Submission
          </h1>
          <p style="color: #f0f8ff; font-size: 16px; margin: 10px 0 0 0; opacity: 0.9;">
            ${data.planInterest} Plan Interest
          </p>
        </div>

        <!-- Submission Details -->
        <div style="padding: 30px; background-color: #f8fafc; border-left: 4px solid #4f46e5;">
          <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">
            📋 Submission Details
          </h2>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #475569; width: 35%;">Submission ID:</td>
                <td style="padding: 8px 0; color: #1e293b; font-family: monospace; background-color: #f1f5f9; padding: 4px 8px; border-radius: 4px;">${data.submissionId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #475569;">Submitted:</td>
                <td style="padding: 8px 0; color: #1e293b;">${data.submittedAt.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #475569;">Plan Interest:</td>
                <td style="padding: 8px 0;">
                  <span style="background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500;">
                    ${data.planInterest}
                  </span>
                </td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Contact Information -->
        <div style="padding: 0 30px 30px;">
          <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">
            👤 Contact Information
          </h2>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; font-weight: 600; color: #475569; width: 35%;">Name:</td>
                <td style="padding: 10px 0; color: #1e293b; font-size: 16px; font-weight: 500;">${data.firstName} ${data.lastName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: 600; color: #475569;">Email:</td>
                <td style="padding: 10px 0;">
                  <a href="mailto:${data.email}" style="color: #2563eb; text-decoration: none; font-weight: 500;">
                    ${data.email}
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: 600; color: #475569;">Company:</td>
                <td style="padding: 10px 0; color: #1e293b; font-size: 16px; font-weight: 500;">${data.company}</td>
              </tr>
              ${data.jobTitle ? `
              <tr>
                <td style="padding: 10px 0; font-weight: 600; color: #475569;">Job Title:</td>
                <td style="padding: 10px 0; color: #64748b;">${data.jobTitle}</td>
              </tr>
              ` : ''}
              ${data.phone ? `
              <tr>
                <td style="padding: 10px 0; font-weight: 600; color: #475569;">Phone:</td>
                <td style="padding: 10px 0;">
                  <a href="tel:${data.phone}" style="color: #2563eb; text-decoration: none;">
                    ${data.phone}
                  </a>
                </td>
              </tr>
              ` : ''}
              ${data.companySize ? `
              <tr>
                <td style="padding: 10px 0; font-weight: 600; color: #475569;">Company Size:</td>
                <td style="padding: 10px 0; color: #64748b;">${data.companySize}</td>
              </tr>
              ` : ''}
            </table>
          </div>
        </div>

        <!-- Message -->
        <div style="padding: 0 30px 30px;">
          <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">
            💬 Message
          </h2>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; border-left: 4px solid #10b981;">
            <p style="color: #374151; line-height: 1.6; margin: 0; white-space: pre-wrap; font-size: 15px;">
              ${data.message}
            </p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="padding: 0 30px 30px; text-align: center;">
          <div style="background-color: #f1f5f9; padding: 20px; border-radius: 6px;">
            <p style="color: #475569; margin: 0 0 20px 0; font-size: 14px;">
              <strong>Next Steps:</strong> Contact the lead within 24 hours for best conversion rates
            </p>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
              <a href="mailto:${data.email}?subject=Re: ${data.planInterest} Plan Inquiry&body=Hi ${data.firstName},%0D%0A%0D%0AThank you for your interest in our ${data.planInterest} plan. I'd love to discuss how we can help ${data.company}..." 
                 style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block; margin: 5px;">
                📧 Reply via Email
              </a>
              ${data.phone ? `
              <a href="tel:${data.phone}" 
                 style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block; margin: 5px;">
                📞 Call Now
              </a>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 20px 30px; background-color: #f8fafc; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 12px; margin: 0; text-align: center;">
            This is an automated notification from the contact form system.<br>
            Submission received at ${data.submittedAt.toLocaleString()}
          </p>
        </div>
      </div>

      ${this.getFooter(data)}
    `;

    const text = `
NEW CONTACT FORM SUBMISSION

Submission ID: ${data.submissionId}
Submitted: ${data.submittedAt.toLocaleString()}
Plan Interest: ${data.planInterest}

CONTACT INFORMATION:
Name: ${data.firstName} ${data.lastName}
Email: ${data.email}
Company: ${data.company}
${data.jobTitle ? `Job Title: ${data.jobTitle}` : ''}
${data.phone ? `Phone: ${data.phone}` : ''}
${data.companySize ? `Company Size: ${data.companySize}` : ''}

MESSAGE:
${data.message}

---
This is an automated notification from the contact form system.
Reply to this email or call the prospect directly to follow up.
    `;

    return { html, text, subject };
  }
}

export const contactFormNotificationTemplate = new ContactFormNotificationTemplate();