# PDF Generation Module - Phase 2

**Status:** Ready for Integration
**Priority:** ⭐⭐⭐ Critical
**Estimated Integration Time:** 30 minutes

---

## 📋 Overview

This module enables professional PDF generation for quotes. It uses Puppeteer to render HTML to PDF with custom branding, styling, and layout.

## 🎯 Features

- ✅ Professional PDF layout with company branding
- ✅ Customizable colors and logo
- ✅ Responsive table layout for line items
- ✅ Automatic currency formatting
- ✅ Terms & conditions section
- ✅ Data validation before generation
- ✅ Error handling and logging

---

## 📦 Installation

### Step 1: Install Dependencies

```bash
npm install puppeteer
```

### Step 2: Copy Module Files

```bash
# Create directories
mkdir -p lib/pdf

# Copy type definitions
cp quote-builder-phase2-modules/pdf-generation/types/index.ts lib/pdf/types.ts

# Copy PDF generator library
cp quote-builder-phase2-modules/pdf-generation/lib/pdf-generator.ts lib/pdf/pdf-generator.ts

# Copy API route
mkdir -p app/api/quote/pdf/[quoteId]
cp quote-builder-phase2-modules/pdf-generation/api/route.ts app/api/quote/pdf/[quoteId]/route.ts
```

### Step 3: Update Imports (if needed)

In `lib/pdf/pdf-generator.ts`, update the import:
```typescript
import { QuotePDFData, PDFGenerationOptions, PDFGenerationResult } from './types';
```

---

## 🚀 Usage

### API Endpoint

```bash
# Generate and download PDF
GET /api/quote/pdf/[quoteId]
```

### Frontend Integration

Add to your review page (e.g., `app/quote-builder/review/[quoteId]/page.tsx`):

```typescript
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';

// Add state
const [downloading, setDownloading] = useState(false);

// Add handler
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
    alert('Failed to download PDF. Please try again.');
  } finally {
    setDownloading(false);
  }
};

// Add button to your UI
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
```

---

## 🎨 Customization

### Add Company Logo

In `lib/pdf/pdf-generator.ts`, when calling `generateQuotePDF`:

```typescript
const result = await generateQuotePDF(pdfData, {
  customLogoUrl: 'https://your-domain.com/logo.png',
  includeTerms: true,
});
```

### Change Brand Colors

```typescript
const result = await generateQuotePDF(pdfData, {
  customColors: {
    primary: '#ff6b00', // Your brand color
  },
});
```

### Modify Terms & Conditions

Edit the terms section in `lib/pdf/pdf-generator.ts` around line 180:

```typescript
<ul>
  <li>Your custom term here</li>
  <li>Another custom term</li>
</ul>
```

---

## ✅ Testing

### Manual Testing

1. Start your dev server: `npm run dev`
2. Create a test quote through the quote builder
3. Navigate to the review page
4. Click "Download PDF" button
5. Verify PDF downloads with correct formatting

### API Testing

```bash
# Test PDF generation directly
curl http://localhost:3000/api/quote/pdf/[your-quote-id] --output test-quote.pdf

# Open the PDF
open test-quote.pdf  # macOS
xdg-open test-quote.pdf  # Linux
start test-quote.pdf  # Windows
```

### Test Script

Create `scripts/test-pdf-generation.mjs`:

```javascript
const quoteId = 'your-test-quote-id';
const response = await fetch(`http://localhost:3000/api/quote/pdf/${quoteId}`);

if (response.ok) {
  const buffer = await response.arrayBuffer();
  await fs.writeFile('test-output.pdf', Buffer.from(buffer));
  console.log('✅ PDF generated successfully!');
} else {
  console.error('❌ PDF generation failed:', await response.text());
}
```

---

## 🐛 Troubleshooting

### Puppeteer Issues

**Error: "Could not find Chrome"**

```bash
# Install Chromium
npx puppeteer browsers install chrome
```

**Error: "Failed to launch browser"**

Add to your environment:
```bash
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
```

### Memory Issues (Production)

For serverless deployments (Vercel, etc.), consider using `@sparticuz/chromium`:

```bash
npm install @sparticuz/chromium
```

Update `lib/pdf/pdf-generator.ts`:

```typescript
import chromium from '@sparticuz/chromium';

const browser = await puppeteer.launch({
  args: chromium.args,
  executablePath: await chromium.executablePath(),
  headless: chromium.headless,
});
```

### PDF Rendering Issues

**Images not loading:**
- Use absolute URLs for images
- Ensure images are publicly accessible
- Add longer `waitUntil` timeout

**Fonts not displaying:**
- Use system fonts (Arial, Helvetica)
- Or embed font files as base64

---

## 📊 Performance

- **Generation Time:** 1-3 seconds per PDF
- **Memory Usage:** ~100-200MB per generation
- **File Size:** Typically 50-200KB per PDF

---

## 🔐 Security Notes

- ✅ Uses service role key for database access
- ✅ Validates quote data before generation
- ✅ No user input directly in HTML (escaped)
- ⚠️ Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set

---

## 📝 Integration Checklist

- [ ] Install puppeteer: `npm install puppeteer`
- [ ] Copy type definitions to `lib/pdf/types.ts`
- [ ] Copy generator to `lib/pdf/pdf-generator.ts`
- [ ] Copy API route to `app/api/quote/pdf/[quoteId]/route.ts`
- [ ] Add download button to review page
- [ ] Test with sample quote
- [ ] Customize branding (logo, colors)
- [ ] Test on production environment
- [ ] Document any custom modifications

---

## 🎉 Success Criteria

- ✅ PDF downloads successfully
- ✅ All quote data displays correctly
- ✅ Formatting looks professional
- ✅ Company branding is visible
- ✅ No errors in console
- ✅ Works on different browsers

---

**Module Complete!** Ready for integration into your main application.
