import { BaseTemplate } from './base-template';
import { DemoScheduledEmailData } from './types';

export class DemoScheduledTemplate extends BaseTemplate {
  generate(data: DemoScheduledEmailData): { html: string; text: string; subject: string } {
    const subject = `Demo Scheduled - ${data.scheduledDate.toLocaleDateString()} at ${data.scheduledDate.toLocaleTimeString()}`;

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        timeZoneName: 'short'
      });
    };

    const html = `
      ${this.getHeader(data)}
      
      <div style="background-color: #ffffff; margin: 0 auto; max-width: 600px; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <!-- Header Section -->
        <div style="background: linear-gradient(135deg, #059669 0%, #0891b2 100%); padding: 40px 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <div style="background-color: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 40px;">📅</span>
          </div>
          <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            Your Demo is Scheduled!
          </h1>
          <p style="color: #a7f3d0; font-size: 16px; margin: 15px 0 0 0; opacity: 0.95;">
            ${data.planInterest} Solution Demonstration
          </p>
        </div>

        <!-- Demo Details -->
        <div style="padding: 30px;">
          <div style="background-color: #ecfeff; padding: 25px; border-radius: 8px; border-left: 4px solid #0891b2; margin-bottom: 30px;">
            <h2 style="color: #0c4a6e; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">
              🎯 Demo Information
            </h2>
            <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; border: 1px solid #e0f2fe;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; font-weight: 600; color: #0c4a6e; width: 30%;">Date:</td>
                  <td style="padding: 12px 0; color: #164e63; font-size: 16px; font-weight: 500;">
                    ${formatDate(data.scheduledDate)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; font-weight: 600; color: #0c4a6e;">Time:</td>
                  <td style="padding: 12px 0; color: #164e63; font-size: 16px; font-weight: 500;">
                    ${formatTime(data.scheduledDate)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; font-weight: 600; color: #0c4a6e;">Duration:</td>
                  <td style="padding: 12px 0; color: #164e63;">30 minutes</td>
                </tr>
                ${data.assignedTo ? `
                <tr>
                  <td style="padding: 12px 0; font-weight: 600; color: #0c4a6e;">Solution Engineer:</td>
                  <td style="padding: 12px 0; color: #164e63; font-weight: 500;">${data.assignedTo}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 12px 0; font-weight: 600; color: #0c4a6e;">Reference ID:</td>
                  <td style="padding: 12px 0; color: #164e63; font-family: monospace; background-color: #f0f9ff; padding: 4px 8px; border-radius: 4px;">${data.requestId}</td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Meeting Link -->
          ${data.meetingLink ? `
          <div style="background-color: #f0fdf4; padding: 25px; border-radius: 8px; border-left: 4px solid #22c55e; margin-bottom: 30px; text-align: center;">
            <h2 style="color: #166534; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">
              🔗 Join Your Demo
            </h2>
            <a href="${data.meetingLink}" 
               style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin-bottom: 15px;">
              Join Demo Meeting
            </a>
            <p style="color: #166534; margin: 0; font-size: 14px;">
              Meeting ID: ${data.meetingLink.split('/').pop() || 'See calendar invite'}
            </p>
          </div>
          ` : ''}

          <!-- Demo Agenda -->
          <div style="background-color: #faf5ff; padding: 25px; border-radius: 8px; border-left: 4px solid #8b5cf6; margin-bottom: 30px;">
            <h2 style="color: #6b21a8; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">
              📋 Demo Agenda
            </h2>
            <div style="space-y: 15px;">
              <div style="display: flex; align-items: start; margin-bottom: 15px;">
                <div style="background-color: #8b5cf6; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 15px; flex-shrink: 0;">
                  1
                </div>
                <div>
                  <p style="color: #6b21a8; margin: 0; font-weight: 600;">Welcome & Introductions (5 min)</p>
                  <p style="color: #7c2d92; margin: 5px 0 0; font-size: 14px;">Brief introductions and agenda overview</p>
                </div>
              </div>
              <div style="display: flex; align-items: start; margin-bottom: 15px;">
                <div style="background-color: #8b5cf6; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 15px; flex-shrink: 0;">
                  2
                </div>
                <div>
                  <p style="color: #6b21a8; margin: 0; font-weight: 600;">Your Use Case Discussion (5 min)</p>
                  <p style="color: #7c2d92; margin: 5px 0 0; font-size: 14px;">Understanding your ${data.useCase.toLowerCase()} requirements</p>
                </div>
              </div>
              <div style="display: flex; align-items: start; margin-bottom: 15px;">
                <div style="background-color: #8b5cf6; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 15px; flex-shrink: 0;">
                  3
                </div>
                <div>
                  <p style="color: #6b21a8; margin: 0; font-weight: 600;">Live Product Demonstration (15 min)</p>
                  <p style="color: #7c2d92; margin: 5px 0 0; font-size: 14px;">Customized walkthrough of ${data.planInterest} features</p>
                </div>
              </div>
              <div style="display: flex; align-items: start; margin-bottom: 15px;">
                <div style="background-color: #8b5cf6; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 15px; flex-shrink: 0;">
                  4
                </div>
                <div>
                  <p style="color: #6b21a8; margin: 0; font-weight: 600;">Q&A and Next Steps (5 min)</p>
                  <p style="color: #7c2d92; margin: 5px 0 0; font-size: 14px;">Your questions and implementation timeline</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Preparation Checklist -->
          <div style="background-color: #fefce8; padding: 25px; border-radius: 8px; border-left: 4px solid #eab308; margin-bottom: 30px;">
            <h2 style="color: #a16207; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">
              ✅ Pre-Demo Checklist
            </h2>
            <div style="space-y: 12px;">
              <div style="display: flex; align-items: start; margin-bottom: 12px;">
                <div style="background-color: #eab308; color: #ffffff; width: 20px; height: 20px; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 12px; flex-shrink: 0; margin-top: 2px;">
                  ☐
                </div>
                <p style="color: #92400e; margin: 0; line-height: 1.5;">Test your audio and video settings</p>
              </div>
              <div style="display: flex; align-items: start; margin-bottom: 12px;">
                <div style="background-color: #eab308; color: #ffffff; width: 20px; height: 20px; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 12px; flex-shrink: 0; margin-top: 2px;">
                  ☐
                </div>
                <p style="color: #92400e; margin: 0; line-height: 1.5;">Ensure stable internet connection</p>
              </div>
              <div style="display: flex; align-items: start; margin-bottom: 12px;">
                <div style="background-color: #eab308; color: #ffffff; width: 20px; height: 20px; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 12px; flex-shrink: 0; margin-top: 2px;">
                  ☐
                </div>
                <p style="color: #92400e; margin: 0; line-height: 1.5;">Prepare your specific questions</p>
              </div>
              <div style="display: flex; align-items: start; margin-bottom: 12px;">
                <div style="background-color: #eab308; color: #ffffff; width: 20px; height: 20px; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 12px; flex-shrink: 0; margin-top: 2px;">
                  ☐
                </div>
                <p style="color: #92400e; margin: 0; line-height: 1.5;">Invite relevant team members</p>
              </div>
              <div style="display: flex; align-items: start; margin-bottom: 12px;">
                <div style="background-color: #eab308; color: #ffffff; width: 20px; height: 20px; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 12px; flex-shrink: 0; margin-top: 2px;">
                  ☐
                </div>
                <p style="color: #92400e; margin: 0; line-height: 1.5;">Join 2-3 minutes early</p>
              </div>
            </div>
          </div>

          <!-- Contact Information -->
          <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">
              📞 Need to reschedule or have questions?
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
              <div>
                <p style="margin: 0; color: #475569; font-size: 14px; font-weight: 600;">Phone</p>
                <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">
                  <a href="tel:+15551234567" style="color: #0891b2; text-decoration: none;">+1 (555) 123-4567</a>
                </p>
              </div>
              <div>
                <p style="margin: 0; color: #475569; font-size: 14px; font-weight: 600;">Email</p>
                <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">
                  <a href="mailto:demos@loveworld.com" style="color: #0891b2; text-decoration: none;">demos@loveworld.com</a>
                </p>
              </div>
              ${data.assignedTo ? `
              <div>
                <p style="margin: 0; color: #475569; font-size: 14px; font-weight: 600;">Your Engineer</p>
                <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${data.assignedTo}</p>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Calendar Reminder -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background-color: #e0f2fe; padding: 20px; border-radius: 8px; border: 2px dashed #0891b2;">
              <h3 style="color: #0c4a6e; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
                📅 Add to Calendar
              </h3>
              <p style="color: #164e63; margin: 0 0 15px 0; font-size: 14px;">
                A calendar invite has been sent to your email. Please accept it to add this demo to your calendar.
              </p>
              <p style="color: #0369a1; margin: 0; font-size: 12px; font-style: italic;">
                Time: ${formatDate(data.scheduledDate)} at ${formatTime(data.scheduledDate)}
              </p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 20px 30px; background-color: #f8fafc; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">
            We're excited to show you how ${data.planInterest} can transform ${data.company}'s ${data.useCase.toLowerCase()}!
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            Demo scheduled for ${formatDate(data.scheduledDate)} • Reference: ${data.requestId}
          </p>
        </div>
      </div>

      ${this.getFooter(data)}
    `;

    const text = `
YOUR DEMO IS SCHEDULED!

Dear ${data.firstName},

Great news! Your ${data.planInterest} solution demo has been scheduled.

DEMO DETAILS:
Date: ${formatDate(data.scheduledDate)}
Time: ${formatTime(data.scheduledDate)}
Duration: 30 minutes
${data.assignedTo ? `Solution Engineer: ${data.assignedTo}` : ''}
Reference ID: ${data.requestId}

${data.meetingLink ? `
JOIN YOUR DEMO:
Meeting Link: ${data.meetingLink}
Meeting ID: ${data.meetingLink.split('/').pop() || 'See calendar invite'}
` : ''}

DEMO AGENDA:
1. Welcome & Introductions (5 min)
2. Your Use Case Discussion (5 min) - ${data.useCase}
3. Live Product Demonstration (15 min) - ${data.planInterest} features
4. Q&A and Next Steps (5 min)

PRE-DEMO CHECKLIST:
☐ Test your audio and video settings
☐ Ensure stable internet connection
☐ Prepare your specific questions
☐ Invite relevant team members
☐ Join 2-3 minutes early

NEED TO RESCHEDULE OR HAVE QUESTIONS?
Phone: +1 (555) 123-4567
Email: demos@loveworld.com
${data.assignedTo ? `Your Engineer: ${data.assignedTo}` : ''}

CALENDAR REMINDER:
A calendar invite has been sent to your email. Please accept it to add this demo to your calendar.

We're excited to show you how ${data.planInterest} can transform ${data.company}'s ${data.useCase.toLowerCase()}!

Best regards,
The Loveworld Suite Demo Team

---
Demo scheduled for ${formatDate(data.scheduledDate)}
Reference: ${data.requestId}
    `;

    return { html, text, subject };
  }
}

export const demoScheduledTemplate = new DemoScheduledTemplate();