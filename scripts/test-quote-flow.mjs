import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oszfxrubmstdavcehhkn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zemZ4cnVibXN0ZGF2Y2VoaGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA3MjgwOSwiZXhwIjoyMDc5NjQ4ODA5fQ.HF5keNFFa_Br4H-25lIkkAvm7ubvE90v2Fsipw0awx4'
);

const testLeadId = '9cd14112-86a1-4803-9c15-13e833483d89';
const testJobId = '14a184a7-68b5-44de-a88e-6c7fc00e5093';

console.log('=== Step 1: Get a product ===');
const { data: products } = await supabase
  .from('products')
  .select('id, sku, name, base_price, category')
  .limit(1);

console.log('Product:', products[0]);

console.log('\n=== Step 2: Call pricing API ===');
const pricingPayload = {
  leadId: testLeadId,
  extractionJobId: testJobId,
  items: [{
    productId: products[0].id,
    category: products[0].category,
    quantity: 2
  }]
};

console.log('Pricing Request:', JSON.stringify(pricingPayload, null, 2));

const pricingResponse = await fetch('http://localhost:3000/api/quote/pricing/calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(pricingPayload)
});

const pricingResult = await pricingResponse.json();

if (!pricingResponse.ok) {
  console.error('Pricing Error:', JSON.stringify(pricingResult, null, 2));
  process.exit(1);
}

console.log('Pricing Success - Summary:', {
  itemCount: pricingResult.lineItems?.length,
  subtotal: pricingResult.summary?.subtotal,
  total: pricingResult.summary?.total
});

console.log('\n=== Step 3: Call quote generation API ===');
const quotePayload = {
  leadId: testLeadId,
  extractionJobId: testJobId,
  lineItems: pricingResult.lineItems.map(item => ({
    productId: item.productId,
    category: item.category,
    subcategory: item.subcategory,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    extractionEvidence: item.extractionEvidence
  })),
  subtotal: pricingResult.summary.subtotal,
  taxPlaceholder: pricingResult.summary.tax.amount,
  discountAmount: pricingResult.summary.tierDiscount.amount,
  total: pricingResult.summary.total
};

console.log('Quote Request:', JSON.stringify(quotePayload, null, 2));

const quoteResponse = await fetch('http://localhost:3000/api/quote/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(quotePayload)
});

const quoteResult = await quoteResponse.json();

if (!quoteResponse.ok) {
  console.error('\n=== QUOTE GENERATION ERROR ===');
  console.error('Status:', quoteResponse.status);
  console.error('Error:', JSON.stringify(quoteResult, null, 2));
  process.exit(1);
}

console.log('\n=== SUCCESS ===');
console.log('Quote ID:', quoteResult.quotation?.id);
console.log('Quote Number:', quoteResult.quotation?.quoteNumber);
console.log('Total:', quoteResult.quotation?.total);
