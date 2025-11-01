import { BaseTemplate } from './base-template';
import { DemoRequestNotificationEmailData } from './types';

export class DemoRequestNotificationTemplate extends BaseTemplate {
  generate(data: DemoRequestNotificationEmailData): { html: string; text: string; subject: string } {
    const subject = `New Demo Request - ${data.demoType} demo for ${data.planInterest}`;

    const demoTypeLabels = {
      live: '🎥 Live Demo',
      recorded: '📹 Recorded Demo',
      trial: '🚀 Free Trial'
    };

    const demoTypeDescriptions = {
      live: '30-minute personalized demonstration',
      recorded: 'On-demand product overview',
      trial: '14-day enterprise trial access'
    };

    const html = `
      ${this.getHeader(data)}
      
      <div style="background-color: #ffffff; margin: 0 auto; max-width: 600px; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <!-- Header Section -->
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            🎯 New Demo Request
          </h1>
          <p style="color: #e0e7ff; font-size: 16px; margin: 10px 0 0 0; opacity: 0.9;">
            ${demoTypeLabels[data.demoType]} - ${data.planInterest} Plan
          </p>
        </div>

        <!-- Demo Request Details -->
        <div style="padding: 30px; background-color: #f8fafc; border-left: 4px solid #7c3aed;">
          <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">
            📋 Request Details
          </h2>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #475569; width: 35%;">Request ID:</td>
                <td style="padding: 8px 0; color: #1e293b; font-family: monospace; background-color: #f1f5f9; padding: 4px 8px; border-radius: 4px;">${data.requestId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #475569;">Submitted:</td>
                <td style="padding: 8px 0; color: #1e293b;">${data.submittedAt.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #475569;">Demo Type:</td>
                <td style="padding: 8px 0;">
                  <span style="background-color: #ddd6fe; color: #5b21b6; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500;">
                    ${demoTypeLabels[data.demoType]}
                  </span>
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
                <td style="padding: 8px 0; font-weight: 600; color: #475569;">Use Case:</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${data.useCase}</td>
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
              <tr>
                <td style="padding: 10px 0; font-weight: 600; color: #475569;">Company Size:</td>
                <td style="padding: 10px 0; color: #64748b;">${data.companySize}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Demo Preferences -->
        ${data.demoType === 'live' && (data.preferredDate || data.preferredTime) ? `
        <div style="padding: 0 30px 30px;">
          <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">
            📅 Scheduling Preferences
          </h2>
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; border-left: 4px solid #f59e0b;">
            <table style="width: 100%; border-collapse: collapse;">
              ${data.preferredDate ? `
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #92400e; width: 35%;">Preferred Date:</td>
                <td style="padding: 8px 0; color: #451a03; font-weight: 500;">${data.preferredDate}</td>
              </tr>
              ` : ''}
              ${data.preferredTime ? `
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #92400e;">Preferred Time:</td>
                <td style="padding: 8px 0; color: #451a03; font-weight: 500;">${data.preferredTime} (EST)</td>
              </tr>
              ` : ''}
            </table>
          </div>
        </div>
        ` : ''}

        <!-- Additional Message -->
        ${data.message ? `
        <div style="padding: 0 30px 30px;">
          <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">
            💬 Additional Information
          </h2>
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 6px; border-left: 4px solid #0ea5e9;">
            <p style="color: #374151; line-height: 1.6; margin: 0; white-space: pre-wrap; font-size: 15px;">
              ${data.message}
            </p>
          </div>
        </div>
        ` : ''}

        <!-- Action Buttons -->
        <div style="padding: 0 30px 30px; text-align: center;">
          <div style="background-color: #f1f5f9; padding: 25px; border-radius: 8px;">
            <p style="color: #475569; margin: 0 0 20px 0; font-size: 16px; font-weight: 600;">
              <strong>📞 Recommended Actions</strong>
            </p>
            <p style="color: #64748b; margin: 0 0 20px 0; font-size: 14px;">
              ${demoTypeDescriptions[data.demoType]} • Contact within 4 hours for optimal conversion
            </p>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
              <a href="mailto:${data.email}?subject=Re: ${data.demoType} Demo Request for ${data.planInterest}&body=Hi ${data.firstName},%0D%0A%0D%0AThank you for requesting a ${data.demoType} demo of our ${data.planInterest} solution. I'd love to discuss how we can help ${data.company} with ${data.useCase.toLowerCase()}..." 
                 style="background-color: #7c3aed; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block; margin: 5px;">
                📧 Reply to Request
              </a>
              ${data.phone ? `
              <a href="tel:${data.phone}" 
                 style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block; margin: 5px;">
                📞 Call Prospect
              </a>
              ` : ''}
              ${data.demoType === 'live' ? `
              <a href="#" onclick="window.open('https://calendly.com/your-calendar', 'popup', 'width=800,height=600'); return false;"
                 style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block; margin: 5px;">
                📅 Schedule Demo
              </a>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Demo Type Info -->
        <div style="padding: 0 30px 30px;">
          <div style="background-color: #faf5ff; padding: 20px; border-radius: 6px; border-left: 4px solid #8b5cf6;">
            <h3 style="color: #6b21a8; font-size: 16px; margin: 0 0 15px 0; font-weight: 600;">
              ${demoTypeLabels[data.demoType]} Requirements:
            </h3>
            ${data.demoType === 'live' ? `
            <ul style="color: #7c2d92; margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>Schedule 30-minute meeting slot</li>
              <li>Prepare customized demo based on ${data.useCase}</li>
              <li>Send calendar invite with Zoom/Teams link</li>
              <li>Follow up with demo recording and next steps</li>
            </ul>
            ` : data.demoType === 'recorded' ? `
            <ul style="color: #7c2d92; margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>Send link to recorded demo video</li>
              <li>Include ${data.planInterest} plan pricing sheet</li>
              <li>Schedule follow-up call within 48 hours</li>
              <li>Track video engagement metrics</li>
            </ul>
            ` : `
            <ul style="color: #7c2d92; margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>Set up 14-day enterprise trial account</li>
              <li>Provide onboarding documentation</li>
              <li>Schedule kick-off call for setup</li>
              <li>Monitor trial usage and provide support</li>
            </ul>
            `}
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 20px 30px; background-color: #f8fafc; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 12px; margin: 0; text-align: center;">
            This is an automated notification from the demo request system.<br>
            Request received at ${data.submittedAt.toLocaleString()} • Reference: ${data.requestId}
          </p>
        </div>
      </div>

      ${this.getFooter(data)}
    `;

    const text = `
NEW DEMO REQUEST - ${data.demoType.toUpperCase()} DEMO

Request ID: ${data.requestId}
Submitted: ${data.submittedAt.toLocaleString()}
Demo Type: ${demoTypeLabels[data.demoType]}
Plan Interest: ${data.planInterest}

CONTACT INFORMATION:
Name: ${data.firstName} ${data.lastName}
Email: ${data.email}
Company: ${data.company}
${data.jobTitle ? `Job Title: ${data.jobTitle}` : ''}
${data.phone ? `Phone: ${data.phone}` : ''}
Company Size: ${data.companySize}
Use Case: ${data.useCase}

${data.preferredDate || data.preferredTime ? `
SCHEDULING PREFERENCES:
${data.preferredDate ? `Preferred Date: ${data.preferredDate}` : ''}
${data.preferredTime ? `Preferred Time: ${data.preferredTime} (EST)` : ''}
` : ''}

${data.message ? `
ADDITIONAL INFORMATION:
${data.message}
` : ''}

RECOMMENDED ACTIONS:
- ${demoTypeDescriptions[data.demoType]}
- Contact within 4 hours for optimal conversion
- Reply to: ${data.email}
${data.phone ? `- Call: ${data.phone}` : ''}

---
This is an automated notification from the demo request system.
Reference: ${data.requestId}
    `;

    return { html, text, subject };
  }
}

export const demoRequestNotificationTemplate = new DemoRequestNotificationTemplate();