import { BaseTemplate } from './base-template';
import { DemoRequestConfirmationEmailData } from './types';

export class DemoRequestConfirmationTemplate extends BaseTemplate {
  generate(data: DemoRequestConfirmationEmailData): { html: string; text: string; subject: string } {
    const subject = `Demo Request Confirmed - ${data.planInterest} Solution`;

    const demoTypeInfo = {
      live: {
        icon: '🎥',
        title: 'Live Demo',
        description: '30-minute personalized demonstration',
        timeline: 'We will contact you within 24 hours to schedule your demo',
        benefits: [
          'Personalized walkthrough based on your use case',
          'Live Q&A with our solution engineer',
          'Custom scenario demonstrations',
          'Immediate answers to your questions'
        ]
      },
      recorded: {
        icon: '📹',
        title: 'Recorded Demo',
        description: 'Comprehensive product overview',
        timeline: 'You will receive demo access within 1 hour',
        benefits: [
          'Watch at your convenience',
          'Comprehensive product overview',
          'Detailed feature demonstrations',
          'Follow-up resources included'
        ]
      },
      trial: {
        icon: '🚀',
        title: 'Free Trial',
        description: '14-day enterprise trial access',
        timeline: 'Your trial will be set up within 24 hours',
        benefits: [
          'Full enterprise feature access',
          'Dedicated onboarding support',
          'Custom data import assistance',
          'Weekly check-in calls'
        ]
      }
    };

    const demoInfo = demoTypeInfo[data.demoType];

    const html = `
      ${this.getHeader(data)}
      
      <div style="background-color: #ffffff; margin: 0 auto; max-width: 600px; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <!-- Header Section -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <div style="background-color: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 40px;">${demoInfo.icon}</span>
          </div>
          <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            Demo Request Confirmed!
          </h1>
          <p style="color: #dbeafe; font-size: 16px; margin: 15px 0 0 0; opacity: 0.95;">
            ${demoInfo.title} for ${data.planInterest} Solution
          </p>
        </div>

        <!-- Confirmation Details -->
        <div style="padding: 30px;">
          <div style="background-color: #f0f9ff; padding: 25px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 30px;">
            <h2 style="color: #1e40af; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">
              📋 Your Request Details
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #475569; width: 40%;">Reference ID:</td>
                <td style="padding: 8px 0; color: #1e293b; font-family: monospace; background-color: #e0f2fe; padding: 4px 8px; border-radius: 4px;">
                  ${data.requestId}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #475569;">Demo Type:</td>
                <td style="padding: 8px 0;">
                  <span style="background-color: #ddd6fe; color: #5b21b6; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500;">
                    ${demoInfo.title}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #475569;">Solution:</td>
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
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #475569;">Use Case:</td>
                <td style="padding: 8px 0; color: #64748b;">${data.useCase}</td>
              </tr>
              ${data.preferredDate ? `
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #475569;">Preferred Date:</td>
                <td style="padding: 8px 0; color: #64748b;">${data.preferredDate}</td>
              </tr>
              ` : ''}
              ${data.preferredTime ? `
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #475569;">Preferred Time:</td>
                <td style="padding: 8px 0; color: #64748b;">${data.preferredTime} (EST)</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <!-- Timeline -->
          <div style="background-color: #f0fdf4; padding: 25px; border-radius: 8px; border-left: 4px solid #22c55e; margin-bottom: 30px;">
            <h2 style="color: #166534; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">
              ⏰ What happens next?
            </h2>
            <p style="color: #15803d; margin: 0; font-size: 16px; font-weight: 500;">
              ${demoInfo.timeline}
            </p>
          </div>

          <!-- Demo Benefits -->
          <div style="background-color: #faf5ff; padding: 25px; border-radius: 8px; border-left: 4px solid #8b5cf6; margin-bottom: 30px;">
            <h2 style="color: #6b21a8; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">
              ✨ What you'll experience
            </h2>
            <div style="space-y: 15px;">
              ${demoInfo.benefits.map((benefit, index) => `
              <div style="display: flex; align-items: start; margin-bottom: 12px;">
                <div style="background-color: #8b5cf6; color: #ffffff; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; margin-right: 12px; flex-shrink: 0; margin-top: 2px;">
                  ✓
                </div>
                <p style="color: #7c2d92; margin: 0; line-height: 1.5; font-size: 15px;">
                  ${benefit}
                </p>
              </div>
              `).join('')}
            </div>
          </div>

          <!-- Preparation Tips -->
          <div style="background-color: #fefce8; padding: 25px; border-radius: 8px; border-left: 4px solid #eab308; margin-bottom: 30px;">
            <h2 style="color: #a16207; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">
              📝 How to prepare
            </h2>
            ${data.demoType === 'live' ? `
            <div style="space-y: 12px;">
              <div style="display: flex; align-items: start; margin-bottom: 12px;">
                <span style="color: #92400e; margin-right: 8px;">•</span>
                <p style="color: #92400e; margin: 0; line-height: 1.5;">Think about your current workflow challenges</p>
              </div>
              <div style="display: flex; align-items: start; margin-bottom: 12px;">
                <span style="color: #92400e; margin-right: 8px;">•</span>
                <p style="color: #92400e; margin: 0; line-height: 1.5;">Prepare specific questions about your use case</p>
              </div>
              <div style="display: flex; align-items: start; margin-bottom: 12px;">
                <span style="color: #92400e; margin-right: 8px;">•</span>
                <p style="color: #92400e; margin: 0; line-height: 1.5;">Consider inviting key stakeholders to join</p>
              </div>
              <div style="display: flex; align-items: start; margin-bottom: 12px;">
                <span style="color: #92400e; margin-right: 8px;">•</span>
                <p style="color: #92400e; margin: 0; line-height: 1.5;">Have your current system details ready for integration discussion</p>
              </div>
            </div>
            ` : data.demoType === 'trial' ? `
            <div style="space-y: 12px;">
              <div style="display: flex; align-items: start; margin-bottom: 12px;">
                <span style="color: #92400e; margin-right: 8px;">•</span>
                <p style="color: #92400e; margin: 0; line-height: 1.5;">Prepare sample data for testing (we can help with this)</p>
              </div>
              <div style="display: flex; align-items: start; margin-bottom: 12px;">
                <span style="color: #92400e; margin-right: 8px;">•</span>
                <p style="color: #92400e; margin: 0; line-height: 1.5;">Identify key team members who will test the platform</p>
              </div>
              <div style="display: flex; align-items: start; margin-bottom: 12px;">
                <span style="color: #92400e; margin-right: 8px;">•</span>
                <p style="color: #92400e; margin: 0; line-height: 1.5;">List your must-have features and integration requirements</p>
              </div>
            </div>
            ` : `
            <div style="space-y: 12px;">
              <div style="display: flex; align-items: start; margin-bottom: 12px;">
                <span style="color: #92400e; margin-right: 8px;">•</span>
                <p style="color: #92400e; margin: 0; line-height: 1.5;">Set aside uninterrupted time to watch the demo</p>
              </div>
              <div style="display: flex; align-items: start; margin-bottom: 12px;">
                <span style="color: #92400e; margin-right: 8px;">•</span>
                <p style="color: #92400e; margin: 0; line-height: 1.5;">Take notes on features relevant to your use case</p>
              </div>
              <div style="display: flex; align-items: start; margin-bottom: 12px;">
                <span style="color: #92400e; margin-right: 8px;">•</span>
                <p style="color: #92400e; margin: 0; line-height: 1.5;">Prepare questions for our follow-up call</p>
              </div>
            </div>
            `}
          </div>

          <!-- Contact Information -->
          <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">
              📞 Questions before your demo?
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
              <div style="text-align: center;">
                <div style="background-color: #3b82f6; color: #ffffff; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 18px;">
                  📞
                </div>
                <p style="margin: 0; color: #475569; font-size: 14px; font-weight: 600;">Phone</p>
                <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px; font-weight: 500;">
                  <a href="tel:+15551234567" style="color: #3b82f6; text-decoration: none;">+1 (555) 123-4567</a>
                </p>
              </div>
              <div style="text-align: center;">
                <div style="background-color: #8b5cf6; color: #ffffff; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 18px;">
                  📧
                </div>
                <p style="margin: 0; color: #475569; font-size: 14px; font-weight: 600;">Email</p>
                <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px; font-weight: 500;">
                  <a href="mailto:demos@loveworld.com" style="color: #8b5cf6; text-decoration: none;">demos@loveworld.com</a>
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 20px 30px; background-color: #f8fafc; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">
            Excited to show you how ${data.planInterest} can transform ${data.company}'s ${data.useCase.toLowerCase()}.
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            This is an automated confirmation email. Reference ID: <strong>${data.requestId}</strong>
          </p>
        </div>
      </div>

      ${this.getFooter(data)}
    `;

    const text = `
DEMO REQUEST CONFIRMED!

Dear ${data.firstName},

Thank you for requesting a ${demoInfo.title} of our ${data.planInterest} solution. ${demoInfo.timeline}

YOUR REQUEST DETAILS:
Reference ID: ${data.requestId}
Demo Type: ${demoInfo.title}
Solution: ${data.planInterest}
Company: ${data.company}
Use Case: ${data.useCase}
${data.preferredDate ? `Preferred Date: ${data.preferredDate}` : ''}
${data.preferredTime ? `Preferred Time: ${data.preferredTime} (EST)` : ''}

WHAT YOU'LL EXPERIENCE:
${demoInfo.benefits.map(benefit => `• ${benefit}`).join('\n')}

${data.demoType === 'live' ? `
HOW TO PREPARE:
• Think about your current workflow challenges
• Prepare specific questions about your use case
• Consider inviting key stakeholders to join
• Have your current system details ready for integration discussion
` : data.demoType === 'trial' ? `
HOW TO PREPARE:
• Prepare sample data for testing (we can help with this)
• Identify key team members who will test the platform
• List your must-have features and integration requirements
` : `
HOW TO PREPARE:
• Set aside uninterrupted time to watch the demo
• Take notes on features relevant to your use case
• Prepare questions for our follow-up call
`}

QUESTIONS BEFORE YOUR DEMO?
Phone: +1 (555) 123-4567
Email: demos@loveworld.com

We're excited to show you how ${data.planInterest} can transform ${data.company}'s ${data.useCase.toLowerCase()}.

Best regards,
The Loveworld Suite Demo Team

---
This is an automated confirmation email.
Reference ID: ${data.requestId}
    `;

    return { html, text, subject };
  }
}

export const demoRequestConfirmationTemplate = new DemoRequestConfirmationTemplate();