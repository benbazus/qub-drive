// src/templates/email/base-template.ts

export interface BaseEmailData {
    recipientName?: string;
    senderName?: string;
    companyName?: string;
    companyLogo?: string;
    supportEmail?: string;
    unsubscribeUrl?: string;
}

export abstract class BaseTemplate {
  protected getHeader(data: BaseEmailData): string {
    const companyName = data.companyName || process.env["COMPANY_NAME"] || 'FileShare';
    const companyLogo = data.companyLogo || process.env["COMPANY_LOGO"] || '';
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          /* Reset styles */
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          /* Base styles */
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background-color: #f8f9fa;
            margin: 0;
            padding: 20px;
          }
          
          /* Responsive */
          @media only screen and (max-width: 600px) {
            body { padding: 10px; }
          }
        </style>
      </head>
      <body>
    `;
  }

  protected getFooter(data: BaseEmailData): string {
    const companyName = data.companyName || process.env["COMPANY_NAME"] || 'FileShare';
    const supportEmail = data.supportEmail || process.env["SUPPORT_EMAIL"] || 'support@example.com';
    const unsubscribeUrl = data.unsubscribeUrl || process.env["UNSUBSCRIBE_URL"] || '#';
    
    return `
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef; margin-top: 20px;">
          <p style="margin: 5px 0; font-size: 12px; color: #6c757d;">
            This email was sent by <strong>${companyName}</strong>
          </p>
          <p style="margin: 5px 0; font-size: 12px; color: #6c757d;">
            If you have any questions, contact us at <a href="mailto:${supportEmail}" style="color: #007bff; text-decoration: none;">${supportEmail}</a>
          </p>
          <p style="margin: 5px 0; font-size: 12px; color: #6c757d;">
            <a href="${unsubscribeUrl}" style="color: #007bff; text-decoration: none;">Unsubscribe</a> | 
            <a href="${process.env["FRONTEND_URL"]}/privacy" style="color: #007bff; text-decoration: none;">Privacy Policy</a> | 
            <a href="${process.env["FRONTEND_URL"]}/terms" style="color: #007bff; text-decoration: none;">Terms of Service</a>
          </p>
          <p style="margin: 5px 0; font-size: 12px; color: #6c757d;">
            &copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  abstract generate(data: any): { html: string; text: string; subject: string };
}

export function renderBaseTemplate(
    title: string,
    content: string,
    data: BaseEmailData = {}
): string {
    const {
        companyName = process.env["COMPANY_NAME"] || 'FileShare',
        companyLogo = process.env["COMPANY_LOGO"] || '',
        supportEmail = process.env["SUPPORT_EMAIL"] || 'support@example.com',
        unsubscribeUrl = process.env["UNSUBSCRIBE_URL"] || '#'
    } = data;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          /* Reset styles */
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          /* Base styles */
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background-color: #f8f9fa;
          }
          
          .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          
          .email-header { 
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          
          .email-header h1 { 
            font-size: 24px; 
            font-weight: 600; 
            margin-bottom: 8px; 
          }
          
          .company-logo { 
            max-height: 40px; 
            margin-bottom: 15px; 
          }
          
          .email-content { 
            padding: 30px 20px; 
            background-color: #ffffff; 
          }
          
          .email-content h2 { 
            color: #333; 
            font-size: 20px; 
            margin-bottom: 15px; 
            font-weight: 600; 
          }
          
          .email-content p { 
            margin-bottom: 15px; 
            color: #555; 
          }
          
          .btn { 
            display: inline-block; 
            padding: 12px 30px; 
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); 
            color: white; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: 600; 
            font-size: 16px;
            transition: all 0.3s ease;
          }
          
          .btn:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3); 
          }
          
          .btn-success { 
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
          }
          
          .btn-warning { 
            background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); 
            color: #333; 
          }
          
          .btn-info { 
            background: linear-gradient(135deg, #17a2b8 0%, #20c997 100%); 
          }
          
          .btn-center { 
            text-align: center; 
            margin: 30px 0; 
          }
          
          .info-box { 
            background: #f8f9fa; 
            border-left: 4px solid #007bff; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 0 6px 6px 0; 
          }
          
          .warning-box { 
            background: #fff3cd; 
            border-left: 4px solid #ffc107; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 0 6px 6px 0; 
          }
          
          .success-box { 
            background: #d4edda; 
            border-left: 4px solid #28a745; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 0 6px 6px 0; 
          }
          
          .comment-box { 
            background: #ffffff; 
            border: 1px solid #e9ecef; 
            border-left: 4px solid #17a2b8; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 0 6px 6px 0; 
            font-style: italic; 
          }
          
          .file-info { 
            background: #ffffff; 
            border: 1px solid #e9ecef; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
            text-align: center; 
          }
          
          .file-icon { 
            font-size: 48px; 
            margin-bottom: 15px; 
          }
          
          .link-fallback { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 6px; 
            margin: 20px 0; 
            border: 1px solid #e9ecef; 
          }
          
          .link-fallback p { 
            margin: 0; 
            font-size: 12px; 
            color: #6c757d; 
          }
          
          .link-fallback a { 
            color: #007bff; 
            word-break: break-all; 
          }
          
          .email-footer { 
            background-color: #f8f9fa; 
            padding: 20px; 
            text-align: center; 
            border-top: 1px solid #e9ecef; 
          }
          
          .email-footer p { 
            margin: 5px 0; 
            font-size: 12px; 
            color: #6c757d; 
          }
          
          .email-footer a { 
            color: #007bff; 
            text-decoration: none; 
          }
          
          .social-links { 
            margin: 15px 0; 
          }
          
          .social-links a { 
            display: inline-block; 
            margin: 0 10px; 
            color: #6c757d; 
            font-size: 18px; 
          }
          
          /* Responsive */
          @media only screen and (max-width: 600px) {
            .email-container { margin: 0; }
            .email-header, .email-content, .email-footer { padding: 20px 15px; }
            .email-header h1 { font-size: 20px; }
            .email-content h2 { font-size: 18px; }
            .btn { padding: 10px 20px; font-size: 14px; }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            ${companyLogo ? `<img src="${companyLogo}" alt="${companyName}" class="company-logo">` : ''}
            <h1>${title}</h1>
          </div>
          
          <div class="email-content">
            ${content}
          </div>
          
          <div class="email-footer">
            <p>This email was sent by <strong>${companyName}</strong></p>
            <p>If you have any questions, contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
            <div class="social-links">
              <!-- Add your social media links here -->
            </div>
            <p>
              <a href="${unsubscribeUrl}">Unsubscribe</a> | 
              <a href="${process.env["FRONTEND_URL"]}/privacy">Privacy Policy</a> | 
              <a href="${process.env["FRONTEND_URL"]}/terms">Terms of Service</a>
            </p>
            <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
}


