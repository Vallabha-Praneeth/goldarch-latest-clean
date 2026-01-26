/**
 * PDF Generation Module - Core Library
 * Phase 2 - Modular Implementation
 *
 * Dependencies: npm install puppeteer
 */

import puppeteer from 'puppeteer';
import { QuotePDFData, PDFGenerationOptions, PDFGenerationResult } from '../types';

/**
 * Generate a PDF from quote data
 */
export async function generateQuotePDF(
  data: QuotePDFData,
  options: PDFGenerationOptions = {}
): Promise<PDFGenerationResult> {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Set PDF content
    await page.setContent(getQuoteHTML(data, options), {
      waitUntil: 'networkidle0',
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: options.format || 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    await browser.close();

    return {
      success: true,
      buffer: Buffer.from(pdfBuffer),
      fileName: `Quote-${data.quoteNumber}.pdf`,
    };
  } catch (error) {
    if (browser) {
      await browser.close();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate HTML content for the PDF
 */
function getQuoteHTML(data: QuotePDFData, options: PDFGenerationOptions): string {
  const primaryColor = options.customColors?.primary || '#2563eb';
  const companyName = 'GoldArch Construction';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            color: #333;
            line-height: 1.6;
            padding: 20px;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            border-bottom: 3px solid ${primaryColor};
            padding-bottom: 20px;
          }

          .company-logo {
            font-size: 28px;
            font-weight: bold;
            color: ${primaryColor};
            letter-spacing: -0.5px;
          }

          .quote-info {
            text-align: right;
          }

          .quote-info h1 {
            font-size: 32px;
            color: ${primaryColor};
            margin-bottom: 10px;
          }

          .quote-info p {
            margin: 5px 0;
            font-size: 14px;
          }

          .customer-info {
            background: #f8fafc;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 40px;
            border-left: 4px solid ${primaryColor};
          }

          .customer-info h2 {
            color: ${primaryColor};
            margin-bottom: 15px;
            font-size: 18px;
          }

          .customer-info p {
            margin: 5px 0;
            font-size: 14px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }

          th {
            background: ${primaryColor};
            color: white;
            padding: 14px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
          }

          th:last-child,
          td:last-child {
            text-align: right;
          }

          td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 14px;
          }

          tr:nth-child(even) {
            background: #f8fafc;
          }

          .totals {
            margin-left: auto;
            width: 350px;
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            font-size: 15px;
          }

          .total-row.discount {
            color: #ef4444;
          }

          .grand-total {
            font-size: 22px;
            font-weight: bold;
            border-top: 2px solid #333;
            margin-top: 10px;
            padding-top: 15px;
            color: ${primaryColor};
          }

          .terms {
            margin-top: 50px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
          }

          .terms h3 {
            color: ${primaryColor};
            margin-bottom: 15px;
            font-size: 16px;
          }

          .terms ul {
            margin-left: 20px;
          }

          .terms li {
            margin: 8px 0;
            font-size: 13px;
          }

          .footer {
            margin-top: 60px;
            text-align: center;
            color: #64748b;
            font-size: 12px;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
          }

          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-logo">
            ${options.customLogoUrl
              ? `<img src="${options.customLogoUrl}" alt="${companyName}" style="max-height: 60px;" />`
              : companyName
            }
          </div>
          <div class="quote-info">
            <h1>QUOTATION</h1>
            <p><strong>Quote #:</strong> ${data.quoteNumber}</p>
            <p><strong>Date:</strong> ${new Date(data.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
            <p><strong>Valid Until:</strong> ${new Date(data.validUntil).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
          </div>
        </div>

        <div class="customer-info">
          <h2>Quote Prepared For:</h2>
          <p><strong>${data.lead.name}</strong></p>
          ${data.lead.company ? `<p>${data.lead.company}</p>` : ''}
          <p>Email: ${data.lead.email}</p>
          <p>Phone: ${data.lead.phone}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 45%;">Description</th>
              <th style="width: 15%;">Quantity</th>
              <th style="width: 17.5%;">Unit Price</th>
              <th style="width: 17.5%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.lineItems.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.unitPrice, data.currency)}</td>
                <td>${formatCurrency(item.lineTotal, data.currency)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(data.subtotal, data.currency)}</span>
          </div>
          ${data.discount > 0 ? `
            <div class="total-row discount">
              <span>Discount:</span>
              <span>-${formatCurrency(data.discount, data.currency)}</span>
            </div>
          ` : ''}
          <div class="total-row">
            <span>Tax:</span>
            <span>${formatCurrency(data.tax, data.currency)}</span>
          </div>
          <div class="total-row grand-total">
            <span>TOTAL:</span>
            <span>${formatCurrency(data.total, data.currency)}</span>
          </div>
        </div>

        ${options.includeTerms !== false ? `
          <div class="terms">
            <h3>Terms & Conditions</h3>
            <ul>
              <li>Payment due within 30 days of invoice date</li>
              <li>This quote is valid for 30 days from the issue date</li>
              <li>Prices are subject to change based on material availability</li>
              <li>Installation and delivery charges may apply</li>
              <li>All work subject to final site inspection and approval</li>
            </ul>
          </div>
        ` : ''}

        <div class="footer">
          <p><strong>${companyName}</strong></p>
          <p>Thank you for your business!</p>
          <p>For questions, please contact us at the information provided above.</p>
          <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Format currency values
 */
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
}

/**
 * Validate quote data before generating PDF
 */
export function validateQuoteData(data: QuotePDFData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.quoteNumber) errors.push('Quote number is required');
  if (!data.lead?.name) errors.push('Lead name is required');
  if (!data.lead?.email) errors.push('Lead email is required');
  if (!data.lineItems || data.lineItems.length === 0) errors.push('At least one line item is required');
  if (data.total === undefined || data.total === null) errors.push('Total amount is required');

  return {
    valid: errors.length === 0,
    errors,
  };
}
