/**
 * PDF Generation Module - Test Script
 * Tests PDF generation API endpoint
 */

import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const QUOTE_ID = process.env.TEST_QUOTE_ID || 'test-quote-id';

async function testPDFGeneration() {
  console.log('🧪 Testing PDF Generation Module');
  console.log('================================\n');

  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Quote ID: ${QUOTE_ID}\n`);

  try {
    // Test PDF generation
    console.log('📄 Generating PDF...');
    const response = await fetch(`${BASE_URL}/api/quote/pdf/${QUOTE_ID}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (contentType !== 'application/pdf') {
      throw new Error(`Expected PDF, got ${contentType}`);
    }

    // Get PDF buffer
    const buffer = await response.arrayBuffer();
    const pdfBuffer = Buffer.from(buffer);

    console.log(`✅ PDF generated successfully`);
    console.log(`   Size: ${pdfBuffer.length} bytes`);

    // Save to file
    const outputPath = join(__dirname, 'test-output.pdf');
    await fs.writeFile(outputPath, pdfBuffer);
    console.log(`   Saved to: ${outputPath}`);

    // Verify PDF header
    const header = pdfBuffer.slice(0, 5).toString();
    if (header === '%PDF-') {
      console.log('✅ Valid PDF format');
    } else {
      console.warn('⚠️  Warning: PDF header not detected');
    }

    console.log('\n✅ PDF Generation Test Passed!');
    return true;
  } catch (error) {
    console.error('\n❌ PDF Generation Test Failed!');
    console.error(error.message);

    if (QUOTE_ID === 'test-quote-id') {
      console.log('\n💡 Tip: Set a real quote ID:');
      console.log('   export TEST_QUOTE_ID=your-actual-quote-id');
    }

    return false;
  }
}

// Run test
testPDFGeneration().then(success => {
  process.exit(success ? 0 : 1);
});
