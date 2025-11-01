import { BaseTemplate } from './base-template';
import { ContactFormConfirmationEmailData } from './types';

export class ContactFormConfirmationTemplate extends BaseTemplate {
  generate(data: ContactFormConfirmationEmailData): { html: string; text: string; subject: string } {
    const subject = `Thank you for contacting Loveworld Suite - ${data.planInterest}`;

    const html = `
      ${this.getHeader(data)}
      
      <div style="background-color: #ffffff; margin: 0 auto; max-width: 600px; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <!-- Header Section -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <div style="background-color: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 40px;">✅</span>
          </div>
          <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            Thank You for Contacting Us!
          </h1>
          <p style="color: #d1fae5; font-size: 16px; margin: 15px 0 0 0; opacity: 0.95;">
            We've received your ${data.planInterest} plan inquiry
          </p>
        </div>

        <!-- Confirmation Details -->
        <div style="padding: 30px;">
          <div style="background-color: #f0f9ff; padding: 25px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin-bottom: 30px;">
            <h2 style="color: #0c4a6e; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">
              📋 Your Submission Details
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #475569; width: 40%;">Reference ID:</td>
                <td style="padding: 8px 0; color: #1e293b; font-family: monospace; background-color: #e0f2fe; padding: 4px 8px; border-radius: 4px;">
                  ${data.submissionId}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #475569;">Plan Interest:</td>
                <td style="padding: 8px 0;">
                  <span style="background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500;">
                    ${data.planInterest}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #475569;">Company:</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${data.company}</td>
              </tr>
            </table>
          </div>

          <!-- What Happens Next -->
          <div style="background-color: #fefce8; padding: 25px; border-radius: 8px; border-left: 4px solid #eab308; margin-bottom: 30px;">
            <h2 style="color: #a16207; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">
              🚀 What happens next?
            </h2>
            <div style="space-y: 15px;">
              <div style="display: flex; align-items: start; margin-bottom: 15px;">
                <div style="background-color: #fbbf24; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 15px; flex-shrink: 0;">
                  1
                </div>
                <p style="color: #92400e; margin: 0; line-height: 1.5;">
                  <strong>Within 24 hours:</strong> Our solution engineer will contact you to discuss your specific needs
                </p>
              </div>
              <div style="display: flex; align-items: start; margin-bottom: 15px;">
                <div style="background-color: #fbbf24; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 15px; flex-shrink: 0;">
                  2
                </div>
                <p style="color: #92400e; margin: 0; line-height: 1.5;">
                  <strong>Discovery call:</strong> We'll schedule a conversation to understand your requirements
                </p>
              </div>
              <div style="display: flex; align-items: start; margin-bottom: 15px;">
                <div style="background-color: #fbbf24; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 15px; flex-shrink: 0;">
                  3
                </div>
                <p style="color: #92400e; margin: 0; line-height: 1.5;">
                  <strong>Custom proposal:</strong> We'll prepare a tailored solution and pricing for your organization
                </p>
              </div>
            </div>
          </div>

          <!-- Contact Information -->
          <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">
              📞 Need immediate assistance?
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
              <div style="text-align: center;">
                <div style="background-color: #2563eb; color: #ffffff; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 18px;">
                  📞
                </div>
                <p style="margin: 0; color: #475569; font-size: 14px; font-weight: 600;">Phone</p>
                <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px; font-weight: 500;">
                  <a href="tel:+15551234567" style="color: #2563eb; text-decoration: none;">+1 (555) 123-4567</a>
                </p>
              </div>
              <div style="text-align: center;">
                <div style="background-color: #059669; color: #ffffff; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 18px;">
                  📧
                </div>
                <p style="margin: 0; color: #475569; font-size: 14px; font-weight: 600;">Email</p>
                <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px; font-weight: 500;">
                  <a href="mailto:enterprise@loveworld.com" style="color: #059669; text-decoration: none;">enterprise@loveworld.com</a>
                </p>
              </div>
            </div>
          </div>

          <!-- Why Choose Us -->
          <div style="background-color: #faf5ff; padding: 25px; border-radius: 8px; border-left: 4px solid #8b5cf6;">
            <h2 style="color: #6b21a8; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">
              ✨ Why choose Loveworld Suite?
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
              <div style="text-align: center; padding: 15px;">
                <div style="font-size: 24px; margin-bottom: 10px;">🔒</div>
                <p style="margin: 0; color: #7c3aed; font-weight: 600; font-size: 14px;">Enterprise Security</p>
                <p style="margin: 5px 0 0; color: #6b21a8; font-size: 12px;">SOC 2 compliance & advanced encryption</p>
              </div>
              <div style="text-align: center; padding: 15px;">
                <div style="font-size: 24px; margin-bottom: 10px;">🚀</div>
                <p style="margin: 0; color: #7c3aed; font-weight: 600; font-size: 14px;">99.9% Uptime</p>
                <p style="margin: 5px 0 0; color: #6b21a8; font-size: 12px;">Reliable, enterprise-grade infrastructure</p>
              </div>
              <div style="text-align: center; padding: 15px;">
                <div style="font-size: 24px; margin-bottom: 10px;">👥</div>
                <p style="margin: 0; color: #7c3aed; font-weight: 600; font-size: 14px;">24/7 Support</p>
                <p style="margin: 5px 0 0; color: #6b21a8; font-size: 12px;">Dedicated account management</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 20px 30px; background-color: #f8fafc; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">
            Thank you for considering Loveworld Suite for your ${data.planInterest.toLowerCase()} needs.
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            This is an automated confirmation email. Please save your reference ID: <strong>${data.submissionId}</strong>
          </p>
        </div>
      </div>

      ${this.getFooter(data)}
    `;

    const text = `
THANK YOU FOR CONTACTING LOVEWORLD SUITE

Dear ${data.firstName},

Thank you for your interest in our ${data.planInterest} plan. We have received your message and will get back to you within 24 hours.

YOUR SUBMISSION DETAILS:
Reference ID: ${data.submissionId}
Plan Interest: ${data.planInterest}
Company: ${data.company}

WHAT HAPPENS NEXT:
1. Within 24 hours: Our solution engineer will contact you
2. Discovery call: We'll discuss your specific requirements
3. Custom proposal: We'll prepare a tailored solution for your organization

NEED IMMEDIATE ASSISTANCE?
Phone: +1 (555) 123-4567
Email: enterprise@loveworld.com

WHY CHOOSE LOVEWORLD SUITE?
• Enterprise Security: SOC 2 compliance & advanced encryption
• 99.9% Uptime: Reliable, enterprise-grade infrastructure  
• 24/7 Support: Dedicated account management

Thank you for considering Loveworld Suite for your ${data.planInterest.toLowerCase()} needs.

Best regards,
The Loveworld Suite Sales Team

---
This is an automated confirmation email.
Reference ID: ${data.submissionId}
    `;

    return { html, text, subject };
  }
}

export const contactFormConfirmationTemplate = new ContactFormConfirmationTemplate();