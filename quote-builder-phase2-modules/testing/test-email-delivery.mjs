/**
 * Email Delivery Module - Test Script
 * Tests email configuration and sending
 */

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const QUOTE_ID = process.env.TEST_QUOTE_ID || 'test-quote-id';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';

async function testEmailConfiguration() {
  console.log('🧪 Testing Email Delivery Module');
  console.log('=================================\n');

  // Check environment variables
  console.log('📋 Environment Check:');

  const requiredVars = [
    'RESEND_API_KEY',
    'EMAIL_FROM_ADDRESS',
    'EMAIL_FROM_NAME',
  ];

  let allConfigured = true;

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: ${varName === 'RESEND_API_KEY' ? '***' : process.env[varName]}`);
    } else {
      console.log(`❌ ${varName}: Not set`);
      allConfigured = false;
    }
  }

  if (!allConfigured) {
    console.log('\n❌ Email configuration incomplete!');
    console.log('\n💡 Set required environment variables:');
    console.log('   export RESEND_API_KEY=re_xxxx');
    console.log('   export EMAIL_FROM_ADDRESS=quotes@your-domain.com');
    console.log('   export EMAIL_FROM_NAME="Your Company"');
    return false;
  }

  console.log('\n📧 Testing Email Send...');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Quote ID: ${QUOTE_ID}`);
  console.log(`   Test Email: ${TEST_EMAIL}`);

  try {
    const response = await fetch(`${BASE_URL}/api/quote/email/${QUOTE_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        customMessage: 'This is a test email from the Phase 2 integration test.',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP ${response.status}: ${errorData.error || 'Unknown error'}`);
    }

    const result = await response.json();

    console.log('\n✅ Email sent successfully!');
    console.log(`   Email ID: ${result.emailId || 'N/A'}`);
    console.log(`   Sent to: ${result.sentTo || TEST_EMAIL}`);

    console.log('\n💡 Check the recipient inbox to verify:');
    console.log('   - Email received');
    console.log('   - PDF attached');
    console.log('   - Formatting looks good');

    return true;
  } catch (error) {
    console.error('\n❌ Email test failed!');
    console.error(error.message);

    if (QUOTE_ID === 'test-quote-id') {
      console.log('\n💡 Tip: Set a real quote ID:');
      console.log('   export TEST_QUOTE_ID=your-actual-quote-id');
    }

    return false;
  }
}

// Run test
testEmailConfiguration().then(success => {
  process.exit(success ? 0 : 1);
});
