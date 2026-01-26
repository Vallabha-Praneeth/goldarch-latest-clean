# Email Delivery Module - Phase 2

**Status:** Ready for Integration
**Priority:** ⭐⭐⭐ Critical
**Estimated Integration Time:** 45 minutes

---

## 📋 Overview

This module enables automated email delivery of quotes with PDF attachments. It uses Resend (or SendGrid) for reliable email delivery with tracking and professional templates.

## 🎯 Features

- ✅ Professional HTML email templates
- ✅ PDF quote attachment
- ✅ Email delivery tracking
- ✅ Custom messages support
- ✅ Email validation
- ✅ Plain text fallback
- ✅ Error handling and logging
- ✅ Delivery status tracking

---

## 📦 Installation

### Step 1: Get API Key

**Option A: Resend (Recommended)**

1. Go to https://resend.com
2. Sign up for free account (100 emails/day free)
3. Verify your domain or use test email
4. Create API key
5. Copy the key

**Option B: SendGrid**

1. Go to https://sendgrid.com
2. Sign up (100 emails/day free)
3. Create API key
4. Copy the key

### Step 2: Configure Environment

Add to your `.env.local`:

```bash
# Email Configuration (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx

# Email Settings
EMAIL_FROM_ADDRESS=quotes@your-domain.com
EMAIL_FROM_NAME=GoldArch Construction
```

### Step 3: Install Dependencies

```bash
npm install resend
```

### Step 4: Run Database Migration

```bash
# Copy SQL file to migrations
cp quote-builder-phase2-modules/email-delivery/sql/email-tracking-table.sql \
   supabase/migrations/$(date +%Y%m%d%H%M%S)_create_email_tracking.sql

# Apply migration (if using Supabase CLI)
supabase db push

# Or run directly in Supabase SQL Editor
```

### Step 5: Copy Module Files

```bash
# Create directories
mkdir -p lib/email

# Copy type definitions
cp quote-builder-phase2-modules/email-delivery/types/index.ts lib/email/types.ts

# Copy email service
cp quote-builder-phase2-modules/email-delivery/lib/email-service.ts lib/email/email-service.ts

# Copy API route
mkdir -p app/api/quote/email/[quoteId]
cp quote-builder-phase2-modules/email-delivery/api/route.ts app/api/quote/email/[quoteId]/route.ts
```

### Step 6: Update Imports

In `lib/email/email-service.ts`, update:
```typescript
import { QuoteEmailData, EmailConfig, EmailSendResult, EmailTemplate } from './types';
```

---

## 🚀 Usage

### API Endpoints

```bash
# Send email with PDF attachment
POST /api/quote/email/[quoteId]
Body: {
  "email": "override@email.com",  # Optional: override recipient
  "customMessage": "Looking forward to working with you!"  # Optional
}

# Get email history for quote
GET /api/quote/email/[quoteId]
```

### Frontend Integration

Add to your review page:

```typescript
import { Mail, Loader2 } from 'lucide-react';
import { useState } from 'react';

// Add state
const [sending, setSending] = useState(false);
const [emailSent, setEmailSent] = useState(false);

// Add handler
const handleSendEmail = async () => {
  try {
    setSending(true);

    const response = await fetch(`/api/quote/email/${quoteId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Optional: override email
        // email: 'custom@email.com',
        // customMessage: 'Thank you for your interest!'
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send email');
    }

    const result = await response.json();
    setEmailSent(true);
    alert(`Quote sent successfully to ${result.sentTo}!`);
  } catch (error) {
    console.error('Email send error:', error);
    alert('Failed to send email. Please try again.');
  } finally {
    setSending(false);
  }
};

// Add button to your UI
<Button
  variant="outline"
  size="lg"
  onClick={handleSendEmail}
  disabled={sending || emailSent}
>
  {sending ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Sending Email...
    </>
  ) : emailSent ? (
    <>
      <Check className="mr-2 h-4 w-4" />
      Email Sent!
    </>
  ) : (
    <>
      <Mail className="mr-2 h-4 w-4" />
      Send Email
    </>
  )}
</Button>
```

---

## 🎨 Customization

### Customize Email Template

Edit `lib/email/email-service.ts`, function `generateQuoteEmailTemplate()`:

```typescript
// Change colors
const primaryColor = '#ff6b00'; // Your brand color

// Modify content
const html = `
  <!-- Your custom HTML here -->
`;
```

### Add Company Logo

```typescript
<div class="header">
  <img src="https://your-domain.com/logo.png" alt="Logo" style="max-height: 50px; margin-bottom: 15px;" />
  <h1>📄 Your Quote is Ready!</h1>
</div>
```

### Change Contact Information

In `.env.local`:
```bash
EMAIL_FROM_ADDRESS=sales@yourcompany.com
EMAIL_FROM_NAME=Your Company Name
```

### Add Custom Message Support

When sending email:
```typescript
await fetch(`/api/quote/email/${quoteId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customMessage: 'We appreciate your business and look forward to serving you!'
  }),
});
```

---

## ✅ Testing

### Test Email Configuration

Create `scripts/test-email-config.mjs`:

```javascript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

try {
  const result = await resend.emails.send({
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: 'your-test@email.com',
    subject: 'Test Email Configuration',
    html: '<p>Email configuration is working!</p>',
  });

  console.log('✅ Email sent successfully!');
  console.log('Message ID:', result.data.id);
} catch (error) {
  console.error('❌ Email test failed:', error);
}
```

Run:
```bash
node scripts/test-email-config.mjs
```

### Test via API

```bash
# Send test email
curl -X POST http://localhost:3000/api/quote/email/[quote-id] \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Check email history
curl http://localhost:3000/api/quote/email/[quote-id]
```

### Manual Testing

1. Start dev server: `npm run dev`
2. Create a test quote
3. Go to review page
4. Click "Send Email" button
5. Check recipient's email inbox
6. Verify PDF is attached
7. Check email looks professional

---

## 📊 Email Tracking

### View Email History

```typescript
const response = await fetch(`/api/quote/email/${quoteId}`);
const data = await response.json();

console.log('Email history:', data.history);
// [
//   {
//     id: '...',
//     recipient_email: 'customer@email.com',
//     sent_at: '2026-01-18T...',
//     status: 'sent',
//     provider_message_id: 're_...'
//   }
// ]
```

### Track Delivery Status

Resend provides webhooks for tracking:
- Email delivered
- Email opened
- Link clicked
- Bounce/complaint

See: https://resend.com/docs/webhooks

---

## 🐛 Troubleshooting

### Error: "RESEND_API_KEY not configured"

**Solution:**
1. Make sure `.env.local` has `RESEND_API_KEY`
2. Restart dev server after adding environment variable
3. Verify key is correct (starts with `re_`)

### Error: "Email sending failed"

**Check:**
1. API key is valid
2. FROM address is verified in Resend
3. Recipient email is valid
4. No rate limits hit (100/day on free tier)

### Emails go to spam

**Solutions:**
1. Verify your domain in Resend
2. Set up SPF and DKIM records
3. Use verified FROM address
4. Avoid spam trigger words
5. Include unsubscribe link (for marketing)

### FROM address not working

**Resend Limitations:**
- Free tier: Only send from verified domains
- Can't use Gmail, Yahoo, etc. as FROM address
- Must verify domain ownership

**Quick Fix:**
Use Resend's test domain: `onboarding@resend.dev`

---

## 🔐 Security Notes

- ✅ Uses service role for database access
- ✅ Validates email addresses
- ✅ Sanitizes user input
- ✅ API keys stored in environment variables
- ⚠️ Track email delivery for audit trail
- ⚠️ Consider rate limiting for production

---

## 💰 Pricing

**Resend:**
- Free: 3,000 emails/month
- Pro: $20/month for 50,000 emails

**SendGrid:**
- Free: 100 emails/day
- Essentials: $20/month for 50,000 emails

---

## 📝 Integration Checklist

- [ ] Get Resend API key
- [ ] Add environment variables to `.env.local`
- [ ] Install `resend` package
- [ ] Run database migration for email tracking
- [ ] Copy type definitions to `lib/email/types.ts`
- [ ] Copy email service to `lib/email/email-service.ts`
- [ ] Copy API route to `app/api/quote/email/[quoteId]/route.ts`
- [ ] Update imports in service file
- [ ] Add send email button to review page
- [ ] Test email sending
- [ ] Verify PDF attachment works
- [ ] Check email looks good on desktop
- [ ] Check email looks good on mobile
- [ ] Customize branding and colors
- [ ] Verify FROM address
- [ ] Test with real customer email
- [ ] Set up domain verification (production)
- [ ] Document any customizations

---

## 🎉 Success Criteria

- ✅ Emails send successfully
- ✅ PDF is attached correctly
- ✅ Email looks professional
- ✅ Responsive on mobile
- ✅ Customer receives email in inbox (not spam)
- ✅ Email tracking records created
- ✅ No errors in console
- ✅ Works in production environment

---

**Module Complete!** Ready for integration with your quote builder.
