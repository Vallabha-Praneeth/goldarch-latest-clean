# Quote Builder - Phase 2 Implementation Plan

**Date:** January 18, 2026
**Status:** Ready for Implementation
**Prerequisites:** Phase 1 Complete ✅

---

## 📋 Overview

This document provides step-by-step implementation instructions for all Phase 2 features. Each feature is designed to be implemented independently, so you can pick and choose based on priority.

**Estimated Total Time:** 3-4 weeks
**Recommended Order:** PDF → Email → Images → Quantity Editing

---

## 1️⃣ PDF Generation (Priority: ⭐⭐⭐ Critical)

**Estimated Time:** 1-2 days
**Complexity:** Medium
**User Impact:** High - Most requested feature

### Prerequisites

```bash
# Choose ONE PDF library:

# Option A: Puppeteer (Recommended - easiest)
npm install puppeteer

# Option B: React-PDF (Good for React devs)
npm install @react-pdf/renderer

# Option C: PDFKit (Low-level control)
npm install pdfkit
```

### Files to Create

**1. PDF Generation Utility (`lib/pdf/pdf-generator.ts`)**

```typescript
import puppeteer from 'puppeteer';

export interface QuotePDFData {
  quoteNumber: string;
  createdAt: string;
  validUntil: string;
  lead: {
    name: string;
    email: string;
    phone: string;
    company?: string;
  };
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
}

export async function generateQuotePDF(data: QuotePDFData): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Set PDF content
  await page.setContent(getQuoteHTML(data), {
    waitUntil: 'networkidle0',
  });

  // Generate PDF
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm',
    },
  });

  await browser.close();
  return pdf;
}

function getQuoteHTML(data: QuotePDFData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            line-height: 1.6;
          }
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
          }
          .company-logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
          }
          .quote-info {
            text-align: right;
          }
          .customer-info {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            background: #2563eb;
            color: white;
            padding: 12px;
            text-align: left;
          }
          td {
            padding: 10px;
            border-bottom: 1px solid #e2e8f0;
          }
          .totals {
            margin-left: auto;
            width: 300px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
          }
          .grand-total {
            font-size: 18px;
            font-weight: bold;
            border-top: 2px solid #333;
            margin-top: 10px;
            padding-top: 10px;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            color: #64748b;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-logo">
            <!-- Replace with your company logo -->
            GoldArch Construction
          </div>
          <div class="quote-info">
            <h1>QUOTATION</h1>
            <p><strong>Quote #:</strong> ${data.quoteNumber}</p>
            <p><strong>Date:</strong> ${new Date(data.createdAt).toLocaleDateString()}</p>
            <p><strong>Valid Until:</strong> ${new Date(data.validUntil).toLocaleDateString()}</p>
          </div>
        </div>

        <div class="customer-info">
          <h2>Quote For:</h2>
          <p><strong>${data.lead.name}</strong></p>
          ${data.lead.company ? `<p>${data.lead.company}</p>` : ''}
          <p>${data.lead.email}</p>
          <p>${data.lead.phone}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
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
            <div class="total-row">
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

        <div class="footer">
          <p>This quote is valid for 30 days from the issue date.</p>
          <p>Thank you for your business!</p>
        </div>
      </body>
    </html>
  `;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
}
```

**2. PDF API Endpoint (`app/api/quote/pdf/[quoteId]/route.ts`)**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateQuotePDF } from '@/lib/pdf/pdf-generator';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ quoteId: string }> }
) {
  try {
    const params = await context.params;
    const { quoteId } = params;

    // Initialize Supabase with service role
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch quotation
    const { data: quotation, error } = await supabase
      .from('quotations')
      .select(`
        *,
        quotation_lines(*),
        quote_leads(*)
      `)
      .eq('id', quoteId)
      .single();

    if (error || !quotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    // Transform data for PDF
    const pdfData = {
      quoteNumber: quotation.quote_number,
      createdAt: quotation.created_at,
      validUntil: quotation.valid_until,
      lead: {
        name: quotation.quote_leads.name,
        email: quotation.quote_leads.email,
        phone: quotation.quote_leads.phone,
        company: quotation.quote_leads.company,
      },
      lineItems: quotation.quotation_lines.map((line: any) => ({
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unit_price,
        lineTotal: line.line_total,
      })),
      subtotal: quotation.subtotal,
      discount: quotation.discount_amount,
      tax: quotation.tax_placeholder,
      total: quotation.total,
      currency: quotation.currency,
    };

    // Generate PDF
    const pdfBuffer = await generateQuotePDF(pdfData);

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Quote-${quotation.quote_number}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
```

**3. Update Review Page (`app/quote-builder/review/[quoteId]/page.tsx`)**

Add download button after line 109 (in the action buttons section):

```typescript
// Add to imports
import { Download } from 'lucide-react';

// Add button in the actions section
<Button
  variant="default"
  size="lg"
  onClick={handleDownloadPDF}
  disabled={downloading}
>
  {downloading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Generating PDF...
    </>
  ) : (
    <>
      <Download className="mr-2 h-4 w-4" />
      Download PDF
    </>
  )}
</Button>

// Add handler function
const [downloading, setDownloading] = useState(false);

const handleDownloadPDF = async () => {
  try {
    setDownloading(true);
    const response = await fetch(`/api/quote/pdf/${quoteId}`);

    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Quote-${quotation?.quoteNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('PDF download error:', error);
    setError('Failed to download PDF. Please try again.');
  } finally {
    setDownloading(false);
  }
};
```

### Testing

```bash
# Start dev server
npm run dev

# Test PDF generation
curl http://localhost:3000/api/quote/pdf/[your-quote-id] --output test-quote.pdf

# Or test via browser:
# 1. Go to review page
# 2. Click "Download PDF"
# 3. Verify PDF downloads with correct formatting
```

### Customization Options

**Add Company Logo:**
```typescript
// In getQuoteHTML function, replace company-logo div with:
<div class="company-logo">
  <img src="https://your-domain.com/logo.png" alt="Company Logo" height="60" />
</div>
```

**Customize Colors:**
```css
/* Change primary color from blue to your brand color */
.header {
  border-bottom: 3px solid #your-color;
}
th {
  background: #your-color;
}
```

**Add Terms & Conditions:**
```typescript
// Add before footer div:
<div class="terms">
  <h3>Terms & Conditions</h3>
  <ul>
    <li>Payment due within 30 days of invoice date</li>
    <li>Prices subject to change based on material availability</li>
    <li>Installation not included unless specified</li>
  </ul>
</div>
```

---

## 2️⃣ Email Delivery (Priority: ⭐⭐⭐ Critical)

**Estimated Time:** 1-2 days
**Complexity:** Medium
**User Impact:** High

### Prerequisites

```bash
# Choose ONE email provider:

# Option A: Resend (Recommended - modern, simple)
npm install resend

# Option B: SendGrid (Enterprise-grade)
npm install @sendgrid/mail
```

### Get API Key

**Resend:**
1. Go to https://resend.com
2. Sign up for free account
3. Create API key
4. Copy key to `.env.local`

**SendGrid:**
1. Go to https://sendgrid.com
2. Sign up for free account (100 emails/day)
3. Create API key
4. Copy key to `.env.local`

### Environment Setup

Add to `.env.local`:

```bash
# Email Configuration
RESEND_API_KEY=re_xxxxxxxxxxxx
# OR
SENDGRID_API_KEY=SG.xxxxxxxxxxxx

# Email Settings
EMAIL_FROM_ADDRESS=quotes@your-domain.com
EMAIL_FROM_NAME=GoldArch Construction
```

### Files to Create

**1. Email Service (`lib/email/email-service.ts`)**

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface QuoteEmailData {
  to: string;
  customerName: string;
  quoteNumber: string;
  total: number;
  currency: string;
  validUntil: string;
  pdfAttachment?: Buffer;
}

export async function sendQuoteEmail(data: QuoteEmailData) {
  try {
    const emailHtml = getQuoteEmailHTML(data);

    const emailData: any = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: data.to,
      subject: `Your Quote ${data.quoteNumber} from ${process.env.EMAIL_FROM_NAME}`,
      html: emailHtml,
    };

    // Add PDF attachment if provided
    if (data.pdfAttachment) {
      emailData.attachments = [
        {
          filename: `Quote-${data.quoteNumber}.pdf`,
          content: data.pdfAttachment,
        },
      ];
    }

    const result = await resend.emails.send(emailData);

    return {
      success: true,
      emailId: result.data?.id,
    };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

function getQuoteEmailHTML(data: QuoteEmailData): string {
  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: data.currency,
  }).format(data.total);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
          }
          .header {
            background: #2563eb;
            color: white;
            padding: 30px;
            text-align: center;
          }
          .content {
            padding: 30px;
            background: #f8fafc;
          }
          .quote-details {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .quote-number {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
          }
          .total {
            font-size: 28px;
            font-weight: bold;
            color: #10b981;
          }
          .button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #64748b;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Your Quote is Ready!</h1>
        </div>

        <div class="content">
          <p>Hi ${data.customerName},</p>

          <p>Thank you for requesting a quote from ${process.env.EMAIL_FROM_NAME}. We're pleased to provide you with the following quotation:</p>

          <div class="quote-details">
            <p><strong>Quote Number:</strong></p>
            <p class="quote-number">${data.quoteNumber}</p>

            <p><strong>Total Amount:</strong></p>
            <p class="total">${formattedTotal}</p>

            <p><strong>Valid Until:</strong> ${new Date(data.validUntil).toLocaleDateString()}</p>
          </div>

          <p>Your detailed quote is attached as a PDF file. Please review it carefully and let us know if you have any questions.</p>

          <p>To accept this quote or discuss further, please contact us at:</p>
          <ul>
            <li>Email: ${process.env.EMAIL_FROM_ADDRESS}</li>
            <li>Phone: (555) 123-4567</li>
          </ul>

          <p>We look forward to working with you on your construction project!</p>

          <p>Best regards,<br/>
          <strong>${process.env.EMAIL_FROM_NAME}</strong></p>
        </div>

        <div class="footer">
          <p>This quote is valid for 30 days from the issue date.</p>
          <p>&copy; 2026 ${process.env.EMAIL_FROM_NAME}. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
}
```

**2. Email API Endpoint (`app/api/quote/email/[quoteId]/route.ts`)**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sendQuoteEmail } from '@/lib/email/email-service';
import { generateQuotePDF } from '@/lib/pdf/pdf-generator';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ quoteId: string }> }
) {
  try {
    const params = await context.params;
    const { quoteId } = params;

    // Get optional email override from request body
    const body = await request.json().catch(() => ({}));
    const emailTo = body.email;

    // Initialize Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch quotation
    const { data: quotation, error } = await supabase
      .from('quotations')
      .select(`
        *,
        quotation_lines(*),
        quote_leads(*)
      `)
      .eq('id', quoteId)
      .single();

    if (error || !quotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    // Generate PDF for attachment
    const pdfData = {
      quoteNumber: quotation.quote_number,
      createdAt: quotation.created_at,
      validUntil: quotation.valid_until,
      lead: {
        name: quotation.quote_leads.name,
        email: quotation.quote_leads.email,
        phone: quotation.quote_leads.phone,
        company: quotation.quote_leads.company,
      },
      lineItems: quotation.quotation_lines.map((line: any) => ({
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unit_price,
        lineTotal: line.line_total,
      })),
      subtotal: quotation.subtotal,
      discount: quotation.discount_amount,
      tax: quotation.tax_placeholder,
      total: quotation.total,
      currency: quotation.currency,
    };

    const pdfBuffer = await generateQuotePDF(pdfData);

    // Send email
    const emailResult = await sendQuoteEmail({
      to: emailTo || quotation.quote_leads.email,
      customerName: quotation.quote_leads.name,
      quoteNumber: quotation.quote_number,
      total: quotation.total,
      currency: quotation.currency,
      validUntil: quotation.valid_until,
      pdfAttachment: pdfBuffer,
    });

    // Track email in database
    await supabase.from('quote_email_tracking').insert({
      quotation_id: quoteId,
      recipient_email: emailTo || quotation.quote_leads.email,
      subject: `Your Quote ${quotation.quote_number}`,
      sent_at: new Date().toISOString(),
      provider: 'resend',
      provider_message_id: emailResult.emailId,
      status: 'sent',
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      emailId: emailResult.emailId,
    });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

**3. Update Review Page**

Add email button and handler:

```typescript
// Add to imports
import { Mail } from 'lucide-react';

// Add state
const [sending, setSending] = useState(false);

// Add button
<Button
  variant="outline"
  size="lg"
  onClick={handleSendEmail}
  disabled={sending}
>
  {sending ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Sending Email...
    </>
  ) : (
    <>
      <Mail className="mr-2 h-4 w-4" />
      Send Email
    </>
  )}
</Button>

// Add handler
const handleSendEmail = async () => {
  try {
    setSending(true);
    const response = await fetch(`/api/quote/email/${quoteId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    alert('Quote sent successfully! Check your email.');
  } catch (error) {
    console.error('Email send error:', error);
    setError('Failed to send email. Please try again.');
  } finally {
    setSending(false);
  }
};
```

### Testing

```bash
# Test email sending
curl -X POST http://localhost:3000/api/quote/email/[quote-id]

# Test with custom email
curl -X POST http://localhost:3000/api/quote/email/[quote-id] \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Check Resend dashboard for delivery status
```

### Customization

**Add Company Branding:**
```typescript
// Add logo to email header
<div class="header">
  <img src="https://your-domain.com/email-logo.png" alt="Logo" height="50" />
  <h1>Your Quote is Ready!</h1>
</div>
```

**Track Email Opens:**
```typescript
// Use Resend webhooks to track opens/clicks
// Add webhook endpoint: /api/webhooks/email
```

---

## 3️⃣ Product Images (Priority: ⭐⭐ High)

**Estimated Time:** 2 days
**Complexity:** Medium

### Supabase Storage Setup

1. Go to Supabase Dashboard → Storage
2. Create new bucket: `products`
3. Make bucket public
4. Create folder structure: `products/[category]/`

### RLS Policies for Storage

```sql
-- Allow public to read product images
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'products');

-- Only admins can upload
CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'products' AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );
```

### Database Changes

```sql
-- Add images column to products table
ALTER TABLE products
ADD COLUMN images JSONB DEFAULT '[]'::jsonb;

-- Example structure:
-- images: [
--   {
--     "url": "https://...supabase.co/storage/v1/object/public/products/doors/door1.jpg",
--     "alt": "6-panel interior door",
--     "isPrimary": true
--   },
--   {
--     "url": "https://...supabase.co/storage/v1/object/public/products/doors/door1-detail.jpg",
--     "alt": "Door hardware detail",
--     "isPrimary": false
--   }
-- ]
```

### Files to Create

**1. Image Upload Utility (`lib/storage/image-uploader.ts`)**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function uploadProductImage(
  file: File,
  category: string,
  productId: string
): Promise<string> {
  // Generate unique filename
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const filename = `${category}/${productId}-${timestamp}.${extension}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('products')
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('products')
    .getPublicUrl(filename);

  return publicUrl;
}

export async function deleteProductImage(url: string): Promise<void> {
  // Extract path from URL
  const path = url.split('/products/')[1];

  const { error } = await supabase.storage
    .from('products')
    .remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}
```

**2. Image Upload API (`app/api/quote/products/images/route.ts`)**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { uploadProductImage } from '@/lib/storage/image-uploader';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;
    const productId = formData.get('productId') as string;

    if (!file || !category || !productId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum 5MB allowed.' },
        { status: 400 }
      );
    }

    // Upload image
    const imageUrl = await uploadProductImage(file, category, productId);

    return NextResponse.json({
      success: true,
      url: imageUrl,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
```

**3. Update Admin Panel**

Add image upload to product dialog in `app/admin/quote/suppliers/page.tsx`:

```typescript
// Add to product form dialog
<div className="space-y-2">
  <Label>Product Images</Label>
  <Input
    type="file"
    accept="image/jpeg,image/png,image/webp"
    multiple
    onChange={handleImageUpload}
  />

  {/* Image preview */}
  {images.length > 0 && (
    <div className="grid grid-cols-3 gap-2 mt-2">
      {images.map((img, index) => (
        <div key={index} className="relative">
          <img
            src={img.url}
            alt={img.alt}
            className="w-full h-24 object-cover rounded"
          />
          <Button
            size="sm"
            variant="destructive"
            className="absolute top-1 right-1"
            onClick={() => removeImage(index)}
          >
            ✕
          </Button>
        </div>
      ))}
    </div>
  )}
</div>

// Handler
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);

  for (const file of files) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', formData.category);
    formData.append('productId', productId);

    const response = await fetch('/api/quote/products/images', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    if (result.success) {
      setImages(prev => [...prev, {
        url: result.url,
        alt: file.name,
        isPrimary: prev.length === 0,
      }]);
    }
  }
};
```

**4. Update Catalog Page**

Display images in product cards:

```typescript
// In catalog page product card
{product.images && product.images.length > 0 ? (
  <img
    src={product.images.find(img => img.isPrimary)?.url || product.images[0].url}
    alt={product.name}
    className="w-full h-48 object-cover rounded-t-lg"
  />
) : (
  <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-t-lg">
    <Package className="h-12 w-12 text-gray-400" />
  </div>
)}
```

### Testing

1. Go to `/admin/quote/suppliers`
2. Add/edit product
3. Upload 2-3 images
4. Mark one as primary
5. Save product
6. Go to catalog page
7. Verify image displays correctly

---

## 4️⃣ Manual Quantity Editing (Priority: ⭐⭐ High)

**Estimated Time:** 1-2 days
**Complexity:** Medium

### Database Changes

```sql
-- Create adjustments tracking table
CREATE TABLE quote_extraction_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES plan_jobs(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item_type TEXT NOT NULL,
  original_quantity INTEGER NOT NULL,
  adjusted_quantity INTEGER NOT NULL,
  reason TEXT,
  adjusted_by UUID REFERENCES auth.users(id),
  adjusted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for fast lookups
CREATE INDEX idx_extraction_adjustments_job_id
  ON quote_extraction_adjustments(job_id);

-- RLS policies
CREATE POLICY "Users can view their adjustments"
  ON quote_extraction_adjustments FOR SELECT
  TO authenticated
  USING (
    job_id IN (
      SELECT id FROM plan_jobs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create adjustments"
  ON quote_extraction_adjustments FOR INSERT
  TO authenticated
  WITH CHECK (
    job_id IN (
      SELECT id FROM plan_jobs WHERE user_id = auth.uid()
    )
  );
```

### Files to Create/Modify

**1. Adjustment API (`app/api/quote/extraction/[jobId]/adjust/route.ts`)**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const AdjustmentSchema = z.object({
  category: z.string(),
  itemType: z.string(),
  originalQuantity: z.number().int(),
  adjustedQuantity: z.number().int().min(0),
  reason: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const params = await context.params;
    const { jobId } = params;
    const body = await request.json();

    // Validate
    const adjustment = AdjustmentSchema.parse(body);

    // Initialize Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Save adjustment
    const { data, error } = await supabase
      .from('quote_extraction_adjustments')
      .insert({
        job_id: jobId,
        category: adjustment.category,
        item_type: adjustment.itemType,
        original_quantity: adjustment.originalQuantity,
        adjusted_quantity: adjustment.adjustedQuantity,
        reason: adjustment.reason,
        adjusted_by: null, // Will be set by RLS in production
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      adjustment: data,
    });
  } catch (error) {
    console.error('Adjustment error:', error);
    return NextResponse.json(
      { error: 'Failed to save adjustment' },
      { status: 500 }
    );
  }
}

// GET adjustments for a job
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const params = await context.params;
    const { jobId } = params;

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('quote_extraction_adjustments')
      .select('*')
      .eq('job_id', jobId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ adjustments: data });
  } catch (error) {
    console.error('Fetch adjustments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch adjustments' },
      { status: 500 }
    );
  }
}
```

**2. Update Extraction Page**

Add edit mode to extraction review page:

```typescript
// Add state for editing
const [editingItem, setEditingItem] = useState<string | null>(null);
const [adjustedQuantities, setAdjustedQuantities] = useState<Record<string, number>>({});

// Add edit button to each quantity display
<div className="flex items-center gap-2">
  {editingItem === `${category}-${itemType}` ? (
    <>
      <Input
        type="number"
        min="0"
        value={adjustedQuantities[`${category}-${itemType}`] ?? originalQuantity}
        onChange={(e) => handleQuantityChange(category, itemType, parseInt(e.target.value))}
        className="w-20"
      />
      <Button
        size="sm"
        onClick={() => saveAdjustment(category, itemType, originalQuantity)}
      >
        Save
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setEditingItem(null)}
      >
        Cancel
      </Button>
    </>
  ) : (
    <>
      <span className="font-semibold">{displayQuantity}</span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => startEditing(category, itemType)}
      >
        <Edit className="h-3 w-3" />
      </Button>
    </>
  )}
</div>

// Handlers
const startEditing = (category: string, itemType: string) => {
  setEditingItem(`${category}-${itemType}`);
};

const handleQuantityChange = (category: string, itemType: string, value: number) => {
  setAdjustedQuantities(prev => ({
    ...prev,
    [`${category}-${itemType}`]: value,
  }));
};

const saveAdjustment = async (category: string, itemType: string, original: number) => {
  const key = `${category}-${itemType}`;
  const adjusted = adjustedQuantities[key] ?? original;

  try {
    const response = await fetch(`/api/quote/extraction/${jobId}/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category,
        itemType,
        originalQuantity: original,
        adjustedQuantity: adjusted,
        reason: 'Manual adjustment',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save adjustment');
    }

    setEditingItem(null);
    // Show success message
    alert('Quantity updated successfully');
  } catch (error) {
    console.error('Save adjustment error:', error);
    alert('Failed to save adjustment. Please try again.');
  }
};

// Load adjustments on mount
useEffect(() => {
  if (jobId) {
    loadAdjustments();
  }
}, [jobId]);

const loadAdjustments = async () => {
  const response = await fetch(`/api/quote/extraction/${jobId}/adjust`);
  const data = await response.json();

  const adjustments: Record<string, number> = {};
  data.adjustments.forEach((adj: any) => {
    adjustments[`${adj.category}-${adj.item_type}`] = adj.adjusted_quantity;
  });

  setAdjustedQuantities(adjustments);
};
```

### Testing

1. Go to extraction review page
2. Click edit button on any quantity
3. Change value
4. Save
5. Verify "Adjusted" badge appears
6. Refresh page - adjustment persists
7. Proceed to catalog - adjusted quantities used

---

## 📝 Implementation Checklist

Use this checklist as you implement each feature:

### PDF Generation
- [ ] Install Puppeteer
- [ ] Create `lib/pdf/pdf-generator.ts`
- [ ] Create `app/api/quote/pdf/[quoteId]/route.ts`
- [ ] Update review page with download button
- [ ] Test PDF generation
- [ ] Customize branding/colors
- [ ] Add company logo
- [ ] Test PDF on mobile

### Email Delivery
- [ ] Get Resend/SendGrid API key
- [ ] Add to `.env.local`
- [ ] Create `lib/email/email-service.ts`
- [ ] Create `app/api/quote/email/[quoteId]/route.ts`
- [ ] Update review page with send button
- [ ] Test email sending
- [ ] Verify PDF attachment
- [ ] Customize email template
- [ ] Test email on different clients

### Product Images
- [ ] Create Supabase Storage bucket
- [ ] Set up RLS policies
- [ ] Add `images` column to products
- [ ] Create `lib/storage/image-uploader.ts`
- [ ] Create image upload API
- [ ] Update admin panel with upload
- [ ] Update catalog with image display
- [ ] Test image upload
- [ ] Test multiple images
- [ ] Test image deletion

### Manual Quantity Editing
- [ ] Create `quote_extraction_adjustments` table
- [ ] Add RLS policies
- [ ] Create adjustment API
- [ ] Add edit mode to extraction page
- [ ] Add save/cancel buttons
- [ ] Load existing adjustments
- [ ] Test editing
- [ ] Test persistence
- [ ] Verify adjustments flow to catalog

---

## 🚀 Quick Start Guide

**To implement PDF generation today:**

```bash
# 1. Install dependency
npm install puppeteer

# 2. Create files (copy from above):
#    - lib/pdf/pdf-generator.ts
#    - app/api/quote/pdf/[quoteId]/route.ts

# 3. Update review page with download button

# 4. Test
npm run dev
# Go to review page, click Download PDF
```

**To implement email delivery:**

```bash
# 1. Get Resend API key from https://resend.com

# 2. Add to .env.local
echo "RESEND_API_KEY=re_xxx" >> .env.local

# 3. Install dependency
npm install resend

# 4. Create files (copy from above):
#    - lib/email/email-service.ts
#    - app/api/quote/email/[quoteId]/route.ts

# 5. Update review page with send button

# 6. Test
npm run dev
# Go to review page, click Send Email
```

---

## 📚 Additional Resources

- Puppeteer Docs: https://pptr.dev
- Resend Docs: https://resend.com/docs
- Supabase Storage: https://supabase.com/docs/guides/storage
- React-PDF: https://react-pdf.org

---

**End of Phase 2 Implementation Plan**

**Ready to Implement:** All instructions provided
**Estimated Total Time:** 3-4 weeks
**Next Step:** Choose which feature to implement first!
