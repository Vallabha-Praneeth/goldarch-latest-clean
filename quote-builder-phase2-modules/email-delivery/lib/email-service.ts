/**
 * Email Delivery Module - Core Library
 * Phase 2 - Modular Implementation
 *
 * Dependencies: npm install resend
 * Alternative: npm install @sendgrid/mail
 */

import { Resend } from 'resend';
import {
  QuoteEmailData,
  EmailConfig,
  EmailSendResult,
  EmailTemplate,
} from '../types';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send quote email with PDF attachment
 */
export async function sendQuoteEmail(
  data: QuoteEmailData,
  config?: Partial<EmailConfig>
): Promise<EmailSendResult> {
  try {
    // Validate email configuration
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    if (!process.env.EMAIL_FROM_ADDRESS) {
      throw new Error('EMAIL_FROM_ADDRESS not configured');
    }

    // Generate email template
    const template = generateQuoteEmailTemplate(data);

    // Prepare email data
    const emailData: any = {
      from: config?.fromAddress || `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: data.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    };

    // Add reply-to if configured
    if (config?.replyTo) {
      emailData.reply_to = config.replyTo;
    }

    // Add CC/BCC if configured
    if (config?.ccAddresses && config.ccAddresses.length > 0) {
      emailData.cc = config.ccAddresses;
    }

    if (config?.bccAddresses && config.bccAddresses.length > 0) {
      emailData.bcc = config.bccAddresses;
    }

    // Add PDF attachment if provided
    if (data.pdfAttachment) {
      emailData.attachments = [
        {
          filename: `Quote-${data.quoteNumber}.pdf`,
          content: data.pdfAttachment,
        },
      ];
    }

    // Send email via Resend
    const result = await resend.emails.send(emailData);

    if (!result.data) {
      throw new Error('Email send failed - no data returned');
    }

    return {
      success: true,
      emailId: result.data.id,
      provider: 'resend',
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'resend',
    };
  }
}

/**
 * Generate email template for quote
 */
function generateQuoteEmailTemplate(data: QuoteEmailData): EmailTemplate {
  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: data.currency,
  }).format(data.total);

  const validUntilDate = new Date(data.validUntil).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const companyName = process.env.EMAIL_FROM_NAME || 'GoldArch Construction';
  const primaryColor = '#2563eb';

  const subject = `Your Quote ${data.quoteNumber} from ${companyName}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 0;
          }

          .email-container {
            background: #ffffff;
          }

          .header {
            background: ${primaryColor};
            color: white;
            padding: 40px 30px;
            text-align: center;
          }

          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }

          .content {
            padding: 40px 30px;
            background: #f8fafc;
          }

          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #1e293b;
          }

          .quote-details {
            background: white;
            padding: 25px;
            border-radius: 8px;
            margin: 25px 0;
            border: 1px solid #e2e8f0;
          }

          .quote-details h2 {
            margin: 0 0 20px 0;
            color: ${primaryColor};
            font-size: 20px;
          }

          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #f1f5f9;
          }

          .detail-row:last-child {
            border-bottom: none;
          }

          .detail-label {
            font-weight: 600;
            color: #64748b;
          }

          .detail-value {
            color: #1e293b;
          }

          .quote-number {
            font-size: 24px;
            font-weight: bold;
            color: ${primaryColor};
          }

          .total-amount {
            font-size: 32px;
            font-weight: bold;
            color: #10b981;
          }

          .message {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 4px;
          }

          .cta-button {
            display: inline-block;
            background: ${primaryColor};
            color: white !important;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
            text-align: center;
          }

          .contact-info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
          }

          .contact-info h3 {
            margin: 0 0 15px 0;
            color: #1e293b;
            font-size: 16px;
          }

          .contact-info ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .contact-info li {
            padding: 5px 0;
            color: #64748b;
          }

          .footer {
            text-align: center;
            padding: 30px;
            color: #64748b;
            font-size: 13px;
            border-top: 1px solid #e2e8f0;
          }

          .footer p {
            margin: 8px 0;
          }

          @media only screen and (max-width: 600px) {
            .header {
              padding: 30px 20px;
            }

            .content {
              padding: 30px 20px;
            }

            .quote-details {
              padding: 20px;
            }

            .total-amount {
              font-size: 28px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>📄 Your Quote is Ready!</h1>
          </div>

          <div class="content">
            <div class="greeting">
              Hi ${data.customerName},
            </div>

            <p>
              Thank you for requesting a quote from <strong>${companyName}</strong>.
              We're pleased to provide you with the following quotation:
            </p>

            <div class="quote-details">
              <h2>Quote Summary</h2>

              <div class="detail-row">
                <span class="detail-label">Quote Number:</span>
                <span class="quote-number">${data.quoteNumber}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Total Amount:</span>
                <span class="total-amount">${formattedTotal}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Valid Until:</span>
                <span class="detail-value">${validUntilDate}</span>
              </div>
            </div>

            ${data.customMessage ? `
              <div class="message">
                <strong>Note:</strong> ${data.customMessage}
              </div>
            ` : ''}

            <p>
              📎 Your detailed quote is attached as a PDF file. Please review it carefully
              and let us know if you have any questions or would like to discuss any details.
            </p>

            <div class="contact-info">
              <h3>📞 Have Questions?</h3>
              <p>Feel free to reach out to us:</p>
              <ul>
                <li>✉️ Email: ${process.env.EMAIL_FROM_ADDRESS}</li>
                <li>📱 Phone: (555) 123-4567</li>
                <li>🕐 Hours: Monday-Friday, 9AM-5PM PST</li>
              </ul>
            </div>

            <p>
              We look forward to working with you on your construction project!
            </p>

            <p>
              <strong>Best regards,</strong><br/>
              The ${companyName} Team
            </p>
          </div>

          <div class="footer">
            <p><strong>${companyName}</strong></p>
            <p>This quote is valid for 30 days from the issue date.</p>
            <p>Please do not reply directly to this email.</p>
            <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Plain text version for email clients that don't support HTML
  const text = `
Hi ${data.customerName},

Your Quote is Ready!

Thank you for requesting a quote from ${companyName}. We're pleased to provide you with the following quotation:

Quote Number: ${data.quoteNumber}
Total Amount: ${formattedTotal}
Valid Until: ${validUntilDate}

${data.customMessage ? `Note: ${data.customMessage}\n\n` : ''}

Your detailed quote is attached as a PDF file. Please review it carefully and let us know if you have any questions.

Have Questions?
Email: ${process.env.EMAIL_FROM_ADDRESS}
Phone: (555) 123-4567
Hours: Monday-Friday, 9AM-5PM PST

We look forward to working with you on your construction project!

Best regards,
The ${companyName} Team

---
This quote is valid for 30 days from the issue date.
© ${new Date().getFullYear()} ${companyName}. All rights reserved.
  `;

  return { subject, html, text };
}

/**
 * Validate email data before sending
 */
export function validateEmailData(data: QuoteEmailData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!data.to || !emailRegex.test(data.to)) {
    errors.push('Valid recipient email is required');
  }

  if (!data.customerName) {
    errors.push('Customer name is required');
  }

  if (!data.quoteNumber) {
    errors.push('Quote number is required');
  }

  if (data.total === undefined || data.total === null) {
    errors.push('Total amount is required');
  }

  if (!data.validUntil) {
    errors.push('Valid until date is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<{ success: boolean; message: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return {
        success: false,
        message: 'RESEND_API_KEY not configured in environment',
      };
    }

    if (!process.env.EMAIL_FROM_ADDRESS) {
      return {
        success: false,
        message: 'EMAIL_FROM_ADDRESS not configured in environment',
      };
    }

    // Test API key validity (simplified check)
    const testResult = await resend.apiKeys.list();

    return {
      success: true,
      message: 'Email configuration is valid',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Configuration test failed',
    };
  }
}
