/**
 * Quote Workflow Email Notifications
 * MODULE-1C Integration
 *
 * Sends email notifications for quote workflow events:
 * - Quote Submitted (to approvers)
 * - Quote Approved (to owner)
 * - Quote Rejected (to owner)
 * - Quote Accepted (to team)
 * - Quote Declined (to team)
 */

import { Resend } from 'resend';
import {
  QuoteNotificationData,
  QuoteNotificationType,
  NotificationResult,
} from './types';

// Initialize Resend client (if available)
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const COMPANY_NAME = process.env.EMAIL_FROM_NAME || 'Gold.Arch';
const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || 'noreply@goldarch.app';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Send quote workflow notification
 */
export async function sendQuoteNotification(
  data: QuoteNotificationData
): Promise<NotificationResult> {
  // Check if email is configured
  if (!resend) {
    console.log('[Notifications] Email not configured, skipping notification');
    return { success: true, error: 'Email not configured' };
  }

  try {
    const template = generateTemplate(data);

    const result = await resend.emails.send({
      from: `${COMPANY_NAME} <${FROM_ADDRESS}>`,
      to: data.recipientEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (!result.data) {
      return { success: false, error: 'Failed to send email' };
    }

    console.log(`[Notifications] Sent ${data.type} email to ${data.recipientEmail}`);
    return { success: true, emailId: result.data.id };
  } catch (error) {
    console.error('[Notifications] Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate email template based on notification type
 */
function generateTemplate(data: QuoteNotificationData): {
  subject: string;
  html: string;
  text: string;
} {
  const quoteUrl = `${BASE_URL}/app-dashboard/quotes?id=${data.quoteId}`;
  const formattedTotal = data.total
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: data.currency || 'USD',
      }).format(data.total)
    : null;

  switch (data.type) {
    case 'quote_submitted':
      return {
        subject: `Quote ${data.quoteNumber} Awaiting Your Approval`,
        html: generateHtml({
          greeting: `Hi ${data.recipientName}`,
          headline: 'Quote Submitted for Approval',
          icon: '📋',
          iconBg: '#FEF3C7',
          message: `${data.actorName || 'A team member'} has submitted quote <strong>${data.quoteNumber}</strong> for your approval.`,
          details: [
            { label: 'Quote Number', value: data.quoteNumber },
            ...(data.title ? [{ label: 'Title', value: data.title }] : []),
            ...(formattedTotal ? [{ label: 'Total', value: formattedTotal }] : []),
            ...(data.notes ? [{ label: 'Notes', value: data.notes }] : []),
          ],
          ctaText: 'Review Quote',
          ctaUrl: quoteUrl,
          badgeText: 'Pending Approval',
          badgeColor: '#F59E0B',
        }),
        text: `Hi ${data.recipientName},\n\n${data.actorName || 'A team member'} has submitted quote ${data.quoteNumber} for your approval.\n\nReview it here: ${quoteUrl}`,
      };

    case 'quote_approved':
      return {
        subject: `Quote ${data.quoteNumber} Has Been Approved`,
        html: generateHtml({
          greeting: `Hi ${data.recipientName}`,
          headline: 'Your Quote Has Been Approved!',
          icon: '✅',
          iconBg: '#D1FAE5',
          message: `Great news! Quote <strong>${data.quoteNumber}</strong> has been approved by ${data.actorName || 'a manager'}.`,
          details: [
            { label: 'Quote Number', value: data.quoteNumber },
            ...(data.title ? [{ label: 'Title', value: data.title }] : []),
            ...(formattedTotal ? [{ label: 'Total', value: formattedTotal }] : []),
            ...(data.notes ? [{ label: 'Approval Notes', value: data.notes }] : []),
          ],
          ctaText: 'View Quote',
          ctaUrl: quoteUrl,
          badgeText: 'Approved',
          badgeColor: '#10B981',
        }),
        text: `Hi ${data.recipientName},\n\nGreat news! Quote ${data.quoteNumber} has been approved.\n\nView it here: ${quoteUrl}`,
      };

    case 'quote_rejected':
      return {
        subject: `Quote ${data.quoteNumber} Requires Changes`,
        html: generateHtml({
          greeting: `Hi ${data.recipientName}`,
          headline: 'Quote Requires Changes',
          icon: '↩️',
          iconBg: '#FEE2E2',
          message: `Quote <strong>${data.quoteNumber}</strong> has been returned by ${data.actorName || 'a manager'} and requires changes.`,
          details: [
            { label: 'Quote Number', value: data.quoteNumber },
            ...(data.title ? [{ label: 'Title', value: data.title }] : []),
            ...(data.reason ? [{ label: 'Reason', value: data.reason }] : []),
          ],
          ctaText: 'Review Feedback',
          ctaUrl: quoteUrl,
          badgeText: 'Changes Required',
          badgeColor: '#EF4444',
        }),
        text: `Hi ${data.recipientName},\n\nQuote ${data.quoteNumber} requires changes.\n\nReason: ${data.reason || 'See quote for details'}\n\nReview it here: ${quoteUrl}`,
      };

    case 'quote_accepted':
      return {
        subject: `Quote ${data.quoteNumber} Accepted by Client`,
        html: generateHtml({
          greeting: `Hi ${data.recipientName}`,
          headline: 'Quote Accepted!',
          icon: '🎉',
          iconBg: '#D1FAE5',
          message: `Quote <strong>${data.quoteNumber}</strong> has been accepted. Time to celebrate!`,
          details: [
            { label: 'Quote Number', value: data.quoteNumber },
            ...(data.title ? [{ label: 'Title', value: data.title }] : []),
            ...(formattedTotal ? [{ label: 'Value', value: formattedTotal }] : []),
          ],
          ctaText: 'View Details',
          ctaUrl: quoteUrl,
          badgeText: 'Accepted',
          badgeColor: '#10B981',
        }),
        text: `Hi ${data.recipientName},\n\nQuote ${data.quoteNumber} has been accepted!\n\nView it here: ${quoteUrl}`,
      };

    case 'quote_declined':
      return {
        subject: `Quote ${data.quoteNumber} Was Declined`,
        html: generateHtml({
          greeting: `Hi ${data.recipientName}`,
          headline: 'Quote Declined',
          icon: '📭',
          iconBg: '#F3F4F6',
          message: `Quote <strong>${data.quoteNumber}</strong> was declined after approval.`,
          details: [
            { label: 'Quote Number', value: data.quoteNumber },
            ...(data.title ? [{ label: 'Title', value: data.title }] : []),
          ],
          ctaText: 'View Quote',
          ctaUrl: quoteUrl,
          badgeText: 'Declined',
          badgeColor: '#6B7280',
        }),
        text: `Hi ${data.recipientName},\n\nQuote ${data.quoteNumber} was declined.\n\nView it here: ${quoteUrl}`,
      };

    default:
      return {
        subject: `Quote ${data.quoteNumber} Update`,
        html: generateHtml({
          greeting: `Hi ${data.recipientName}`,
          headline: 'Quote Update',
          icon: '📄',
          iconBg: '#E5E7EB',
          message: `There's an update on quote <strong>${data.quoteNumber}</strong>.`,
          details: [{ label: 'Quote Number', value: data.quoteNumber }],
          ctaText: 'View Quote',
          ctaUrl: quoteUrl,
          badgeText: 'Updated',
          badgeColor: '#6B7280',
        }),
        text: `Hi ${data.recipientName},\n\nThere's an update on quote ${data.quoteNumber}.\n\nView it here: ${quoteUrl}`,
      };
  }
}

/**
 * Generate HTML email template with Gold.Arch styling
 */
function generateHtml(options: {
  greeting: string;
  headline: string;
  icon: string;
  iconBg: string;
  message: string;
  details: Array<{ label: string; value: string }>;
  ctaText: string;
  ctaUrl: string;
  badgeText: string;
  badgeColor: string;
}): string {
  const detailRows = options.details
    .map(
      (d) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-weight: 500;">${d.label}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; text-align: right; color: #1F2937;">${d.value}</td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F9FAFB;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F9FAFB; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 560px; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1E293B 0%, #334155 100%); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
              <div style="width: 56px; height: 56px; background-color: ${options.iconBg}; border-radius: 50%; margin: 0 auto 16px; line-height: 56px; font-size: 24px;">
                ${options.icon}
              </div>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 600;">
                ${options.headline}
              </h1>
              <div style="display: inline-block; background-color: ${options.badgeColor}; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; margin-top: 12px;">
                ${options.badgeText}
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 8px; font-size: 16px; color: #374151;">
                ${options.greeting},
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; color: #4B5563; line-height: 1.6;">
                ${options.message}
              </p>

              <!-- Details Table -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F9FAFB; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      ${detailRows}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${options.ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #1E293B 0%, #334155 100%); color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                      ${options.ctaText} →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #E5E7EB; text-align: center;">
              <p style="margin: 0 0 8px; color: #9CA3AF; font-size: 13px;">
                Sent by <strong style="color: #D97706;">${COMPANY_NAME}</strong>
              </p>
              <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                This is an automated notification. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export default {
  sendQuoteNotification,
};
