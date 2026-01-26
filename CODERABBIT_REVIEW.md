# CodeRabbit Security & Code Review Issues

**Project:** Quote Builder Phase 1 & 2
**Review Date:** January 19, 2026
**PR:** https://github.com/Vallabha-Praneeth/goldarch-quote-builder/pull/1
**Status:** 8 Actionable Comments | Critical Issues Found

---

## 📊 Review Summary

- **Total Comments:** 8 actionable issues
- **Critical Issues:** Multiple security vulnerabilities
- **Pre-merge Checks:** ✅ 3/3 Passed
  - Title check: ✅ Passed
  - Docstring coverage: ✅ 81.40% (threshold: 80%)
  - Description check: ✅ Skipped (summary enabled)

---

## 🔴 CRITICAL ISSUES (Must Fix Before Production)

### Issue #1: Unauthenticated Email API - RLS Bypass

**File:** `app/api/quote/email/[quoteId]/route.ts`
**Lines:** 18-170 (POST handler), 186-220 (GET handler)
**Severity:** 🔴 CRITICAL

#### Problem Description:
The POST and GET handlers use `SUPABASE_SERVICE_ROLE_KEY` which bypasses Row Level Security (RLS) and allows unauthenticated access. This creates multiple security vulnerabilities:

1. **No Authentication:** Anyone can call the API without logging in
2. **No Authorization:** No ownership verification of quotes
3. **Email Override Abuse:** Accepts arbitrary email addresses via `emailOverride`
4. **Data Exfiltration:** Attackers can access any quote by iterating through IDs
5. **Spam/Phishing Vector:** Can send legitimate-looking PDFs to victims

#### Current Vulnerable Code:
```typescript
// Lines 31-36 (POST handler)
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // ❌ Bypasses RLS
);

// Line 28 - Accepts arbitrary email
const emailOverride = body.email;  // ❌ No validation

// Lines 195-199 (GET handler) - Same issue
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // ❌ Bypasses RLS
);
```

#### Attack Scenarios:

**Scenario 1: Data Breach**
```bash
# Attacker iterates through quote IDs
curl -X POST http://yoursite.com/api/quote/email/123 \
  -H "Content-Type: application/json" \
  -d '{"email":"attacker@evil.com"}'

# Gets sensitive customer quotes sent to their email
```

**Scenario 2: Phishing**
```bash
# Attacker sends legitimate quotes to victims
curl -X POST http://yoursite.com/api/quote/email/456 \
  -d '{"email":"victim@company.com"}'

# Victim receives real quote PDF, thinks it's from you
```

**Scenario 3: Spam Abuse**
```bash
# Attacker uses your system to spam
for id in {1..1000}; do
  curl -X POST http://yoursite.com/api/quote/email/$id \
    -d '{"email":"spam-target@example.com"}'
done
```

#### Required Fix:

**Step 1: Use authenticated Supabase client**
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ quoteId: string }> }
) {
  // 1. Create authenticated client
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,  // ✅ Use anon key with RLS
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
```

**Step 2: Require authentication**
```typescript
  // 2. Verify user is logged in
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
```

**Step 3: Verify ownership**
```typescript
  // 3. Fetch quote and verify ownership
  const { data: quotation, error: quotationError } = await supabase
    .from('quotations')
    .select(`
      *,
      quotation_lines(*),
      quote_leads(*)
    `)
    .eq('id', quoteId)
    .single();

  if (quotationError || !quotation) {
    return NextResponse.json(
      { error: 'Quotation not found' },
      { status: 404 }
    );
  }

  // 4. Check ownership
  const isOwner =
    quotation.user_id === session.user.id ||
    quotation.quote_leads?.user_id === session.user.id ||
    quotation.created_by === session.user.id;

  if (!isOwner) {
    return NextResponse.json(
      { error: 'Forbidden - You do not own this quotation' },
      { status: 403 }
    );
  }
```

**Step 4: Restrict or remove emailOverride**
```typescript
  // 5. Validate email override
  const emailOverride = body.email;

  if (emailOverride) {
    // Only allow sending to the lead's email
    if (emailOverride !== quotation.quote_leads.email) {
      return NextResponse.json(
        { error: 'Cannot send quote to arbitrary email addresses' },
        { status: 400 }
      );
    }
  }
```

**Step 5: Apply same fixes to GET handler**
```typescript
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ quoteId: string }> }
) {
  // Apply same authentication + ownership checks
  const cookieStore = cookies();
  const supabase = createServerClient(...);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ... verify ownership before returning email history
}
```

#### Why We Used Service Role (Testing Context):
- **Current Approach:** Service role was used to allow unauthenticated quote builder flow
- **Test-friendly:** Allows testing without login
- **Production Risk:** Cannot go live with this approach

#### Recommended Approach for Quote Builder Flow:
```typescript
// Option A: Require login only for email/PDF download
// - Allow unauthenticated quote creation (current flow)
// - Require authentication ONLY for email/PDF endpoints

// Option B: Use temporary tokens for unauthenticated flow
// - Generate secure token when creating quote
// - Validate token instead of user session
// - Token expires after quote validity period
```

---

### Issue #2: Quote Generation API - Trust Client Pricing & No Auth

**File:** `app/api/quote/generate/route.ts`
**Lines:** 48-61 (POST handler), 212-234 (audit log)
**Severity:** 🔴 CRITICAL
**CodeRabbit Comments:** 2 separate critical flags (same root issue)

#### Problem Description:
The POST handler trusts client-supplied pricing totals and uses service role without authentication. This creates multiple vulnerabilities:

1. **Price Manipulation:** Client can send fake subtotal/tax/total values
2. **No Server-Side Validation:** Doesn't recompute pricing to verify correctness
3. **Unauthenticated Writes:** Uses service role, bypassing RLS
4. **No Ownership Verification:** Anyone can create quotes for any leadId
5. **Silent Audit Failures:** Swallows audit log errors (lines 212-234)

#### Current Vulnerable Code:

**Lines 48-61: Service Role + No Auth**
```typescript
// 1. Initialize Supabase with service role (allow unauthenticated quote builder flow)
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // ❌ Bypasses RLS
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

**Lines 33-38: Trusts Client Pricing**
```typescript
const GenerateQuoteSchema = z.object({
  // ... other fields ...
  subtotal: z.number(),           // ❌ Client sends this
  taxPlaceholder: z.number().optional().default(0),  // ❌ Client sends this
  discountAmount: z.number().optional().default(0),  // ❌ Client sends this
  total: z.number(),              // ❌ Client sends this - NEVER trust!
  // ... other fields ...
});
```

**Lines 212-234: Silent Audit Failures**
```typescript
// 9. Create audit log entry
await supabase
  .from('quotation_audit_log')
  .insert({
    entity_type: 'quotation',
    entity_id: quotation.id,
    action: 'created',
    // ... fields ...
  });
  // ❌ No error handling - failure is silently ignored
```

#### Attack Scenarios:

**Scenario 1: Price Manipulation**
```javascript
// Attacker sends fake pricing
fetch('/api/quote/generate', {
  method: 'POST',
  body: JSON.stringify({
    leadId: 'any-lead-id',
    lineItems: [
      { productId: 'expensive-product', quantity: 100, unitPrice: 1000 }
      // Should total $100,000
    ],
    subtotal: 10,      // ❌ Fake: claims only $10
    total: 10          // ❌ Gets quote for $10 instead of $100,000
  })
});
// System creates quote with fake pricing!
```

**Scenario 2: Unauthorized Quote Creation**
```javascript
// Attacker creates quotes for other people's leads
fetch('/api/quote/generate', {
  method: 'POST',
  body: JSON.stringify({
    leadId: 'someone-elses-lead-id',  // ❌ No ownership check
    // ... can create quote for anyone
  })
});
```

**Scenario 3: Negative Pricing Exploit**
```javascript
// Attacker gets "paid" to take products
fetch('/api/quote/generate', {
  method: 'POST',
  body: JSON.stringify({
    leadId: 'attacker-lead',
    lineItems: [{ productId: 'x', quantity: 1, unitPrice: 100 }],
    subtotal: -1000,   // ❌ Negative total
    total: -1000       // ❌ System "owes" attacker money
  })
});
```

#### Required Fixes:

**Fix 1: Server-Side Pricing Calculation**
```typescript
import { calculatePricing } from './pricing/calculate/route';  // Reuse pricing logic

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ❌ REMOVE: Don't accept client pricing
    // const quoteRequest: GenerateQuoteRequest = validationResult.data;

    // ✅ REQUIRED: Recompute pricing server-side
    const serverPricing = await calculatePricing({
      leadId: body.leadId,
      items: body.lineItems.map(item => ({
        productId: item.productId,
        category: item.category,
        quantity: item.quantity
      }))
    });

    // ✅ Verify client pricing matches server calculation
    const clientTotal = body.total;
    const serverTotal = serverPricing.summary.total;

    if (Math.abs(clientTotal - serverTotal) > 0.01) {
      return NextResponse.json(
        {
          error: 'Price mismatch',
          details: `Client total ($${clientTotal}) does not match server calculation ($${serverTotal})`
        },
        { status: 400 }
      );
    }

    // ✅ Use server-calculated pricing (never trust client)
    const quotation = await supabase.from('quotations').insert({
      subtotal: serverPricing.summary.subtotal,  // ✅ Server value
      tax_placeholder: serverPricing.summary.tax.amount,  // ✅ Server value
      discount_amount: serverPricing.summary.tierDiscount.amount,  // ✅ Server value
      total: serverPricing.summary.total,  // ✅ Server value
      // ... other fields ...
    });
  }
}
```

**Fix 2: Authentication (Choose One Approach)**

**Option A: Token-Based Auth for Unauthenticated Flow**
```typescript
import { createHash } from 'crypto';

// Generate token when lead is created
function generateQuoteToken(leadId: string): string {
  const secret = process.env.QUOTE_TOKEN_SECRET!;
  const expiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
  const payload = `${leadId}:${expiry}`;
  const signature = createHash('sha256')
    .update(payload + secret)
    .digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64');
}

// Validate token in POST handler
export async function POST(request: NextRequest) {
  const body = await request.json();
  const token = request.headers.get('X-Quote-Token');

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 401 });
  }

  // Verify token and extract leadId
  const [leadId, expiry, signature] = Buffer.from(token, 'base64')
    .toString()
    .split(':');

  if (Date.now() > parseInt(expiry)) {
    return NextResponse.json({ error: 'Token expired' }, { status: 401 });
  }

  if (leadId !== body.leadId) {
    return NextResponse.json({ error: 'Token/lead mismatch' }, { status: 403 });
  }

  // ✅ Proceed with quote generation (token verified)
}
```

**Option B: Session-Based Auth (Require Login)**
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: () => cookieStore }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Login required' }, { status: 401 });
  }

  // ✅ Verify lead ownership
  const { data: lead } = await supabase
    .from('quote_leads')
    .select('user_id')
    .eq('id', body.leadId)
    .single();

  if (lead.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Not your lead' }, { status: 403 });
  }

  // ✅ Proceed with quote generation
}
```

**Fix 3: Enable RLS on Quotations Table**
```sql
-- Enable RLS
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own quotes
CREATE POLICY "Users can read own quotes"
  ON quotations
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    created_by = auth.uid() OR
    lead_id IN (
      SELECT id FROM quote_leads WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can only create quotes for their leads
CREATE POLICY "Users can create quotes for own leads"
  ON quotations
  FOR INSERT
  WITH CHECK (
    lead_id IN (
      SELECT id FROM quote_leads WHERE user_id = auth.uid()
    )
  );
```

**Fix 4: Handle Audit Log Errors**
```typescript
// 9. Create audit log entry - MUST NOT fail silently
const { error: auditError } = await supabase
  .from('quotation_audit_log')
  .insert({
    entity_type: 'quotation',
    entity_id: quotation.id,
    action: 'created',
    field_name: null,
    old_value: null,
    new_value: JSON.stringify({ status: 'draft', total: quotation.total }),
    reason: 'Quote generated from lead',
    created_by: leadData.user_id || null,
  });

// ✅ REQUIRED: Surface audit failures
if (auditError) {
  console.error('CRITICAL: Audit log failed:', auditError);

  // Rollback the quote (audit is critical for compliance)
  await supabase.from('quotations').delete().eq('id', quotation.id);

  return NextResponse.json(
    {
      error: 'Failed to create audit trail',
      details: 'Quote creation aborted due to audit log failure'
    },
    { status: 500 }
  );
}
```

**Fix 5: Rate Limiting**
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 h'),  // 5 quotes per hour
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  const { success } = await ratelimit.limit(`quote_gen_${ip}`);
  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  // ... proceed with quote generation
}
```

#### Why We Used This Approach (Testing Context):
- **Current:** Accepts client pricing to avoid complex server-side recalculation
- **Risk:** Price manipulation in production
- **Must Fix:** Recompute all pricing server-side

#### Recommended Production Approach:
```typescript
// ✅ PRODUCTION READY FLOW:
// 1. Client calls /api/quote/pricing/calculate (gets server pricing)
// 2. Client displays pricing to user
// 3. Client submits to /api/quote/generate WITHOUT pricing
// 4. Server recalculates pricing internally
// 5. Server verifies line items haven't changed
// 6. Server creates quote with server-calculated pricing
```

---

### Issue #3: PDF Generation API - PII Exposure via Unauthenticated Access

**File:** `app/api/quote/pdf/[quoteId]/route.ts`
**Lines:** 23-41 (GET handler)
**Severity:** 🔴 CRITICAL

#### Problem Description:
The GET handler uses service role client without authentication, exposing Personally Identifiable Information (PII) to anyone who knows a quote ID. This is a **data breach vulnerability**.

**Exposed PII:**
- Customer names
- Email addresses
- Phone numbers
- Company information
- Pricing details
- Purchase history

#### Current Vulnerable Code:

**Lines 23-28: Service Role Without Auth**
```typescript
// Initialize Supabase with service role
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // ❌ Bypasses RLS
);
```

**Lines 30-41: No Ownership Check**
```typescript
// Fetch quotation
const { data: quotation, error: quotationError } = await supabase
  .from('quotations')
  .select('*')
  .eq('id', quoteId)  // ❌ Only checks ID, not ownership
  .single();

if (quotationError || !quotation) {
  return NextResponse.json(
    { error: 'Quotation not found', details: quotationError?.message },
    { status: 404 }
  );
}
// ❌ Returns PDF to ANYONE who knows the quote ID
```

**Lines 56-65: Exposes Customer PII**
```typescript
// Fetch lead
const { data: quote_leads, error: leadError } = await supabase
  .from('quote_leads')
  .select('*')  // ❌ Fetches ALL customer data
  .eq('id', quotation.lead_id)
  .single();

// Later returns in PDF:
// - name, email, phone, company (PII)
```

#### Attack Scenarios:

**Scenario 1: Data Breach - Customer Info Theft**
```bash
# Attacker iterates through quote IDs
for id in $(cat quote-ids.txt); do
  curl -s "http://yoursite.com/api/quote/pdf/$id" > "$id.pdf"
done

# Extracts:
# - Customer names, emails, phones
# - Company information
# - Pricing data
# - Purchase patterns
```

**Scenario 2: Competitor Intelligence**
```bash
# Competitor downloads all your quotes
curl "http://yoursite.com/api/quote/pdf/abc-123" -o competitor-quote.pdf

# Learns:
# - Your pricing strategy
# - Customer base
# - Product margins
# - Deal sizes
```

**Scenario 3: Phishing Attack**
```bash
# Attacker gets customer details
curl "http://yoursite.com/api/quote/pdf/xyz-789" | pdftotext - -

# Uses real customer info for convincing phishing:
# "Hi [Real Name], this is about quote [Real Quote #]..."
```

#### GDPR/Privacy Law Violations:

**This vulnerability violates:**
- ❌ **GDPR Article 32:** Inadequate security of personal data
- ❌ **CCPA:** Unauthorized disclosure of personal information
- ❌ **HIPAA** (if applicable): PHI exposure
- ❌ **PCI DSS** (if storing payment info): Cardholder data exposure

**Potential Fines:**
- GDPR: Up to €20M or 4% of annual revenue
- CCPA: $2,500-$7,500 per violation
- Data breach notification costs
- Class action lawsuits

#### Required Fixes:

**Fix 1: Authentication + Ownership Verification**
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ quoteId: string }> }
) {
  try {
    const params = await context.params;
    const { quoteId } = params;

    // ✅ Use authenticated client
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,  // ✅ RLS enabled
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // ✅ Require authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // ✅ Fetch with ownership check
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select(`
        *,
        quotation_lines(*),
        quote_leads(*)
      `)
      .eq('id', quoteId)
      .single();  // RLS will automatically filter by ownership

    if (quotationError || !quotation) {
      // Could be not found OR not authorized (RLS blocked it)
      return NextResponse.json(
        { error: 'Quotation not found or access denied' },
        { status: 404 }
      );
    }

    // ✅ Double-check ownership (defense in depth)
    const isOwner =
      quotation.user_id === session.user.id ||
      quotation.created_by === session.user.id ||
      quotation.quote_leads?.user_id === session.user.id;

    if (!isOwner) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this quotation' },
        { status: 403 }
      );
    }

    // ✅ Proceed with PDF generation (ownership verified)
    // ... rest of PDF generation code
  }
}
```

**Fix 2: Short-lived Signed URLs (Alternative for Unauthenticated Flow)**
```typescript
import { createHmac } from 'crypto';

// Generate signed URL when quote is created
export function generatePDFAccessToken(quoteId: string, expiresInHours = 24): string {
  const secret = process.env.PDF_TOKEN_SECRET!;
  const expiry = Date.now() + (expiresInHours * 60 * 60 * 1000);
  const payload = `${quoteId}:${expiry}`;
  const signature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

// Validate token in PDF route
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ quoteId: string }> }
) {
  const params = await context.params;
  const { quoteId } = params;

  // ✅ Require token in query or header
  const token = request.nextUrl.searchParams.get('token') ||
                request.headers.get('X-PDF-Token');

  if (!token) {
    return NextResponse.json({ error: 'Access token required' }, { status: 401 });
  }

  // ✅ Validate token
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const [tokenQuoteId, expiry, signature] = decoded.split(':');

    // Verify quote ID matches
    if (tokenQuoteId !== quoteId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }

    // Verify not expired
    if (Date.now() > parseInt(expiry)) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }

    // Verify signature
    const secret = process.env.PDF_TOKEN_SECRET!;
    const expectedSignature = createHmac('sha256', secret)
      .update(`${tokenQuoteId}:${expiry}`)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    // ✅ Token valid - proceed with PDF generation
    // Use service role ONLY after token validation
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch and generate PDF...
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
  }
}

// Usage: Include token in URL
// /api/quote/pdf/123?token=eyJxdW90ZUlkIjoiMTIzIiwiZXhwaXJ5Ijo...
```

**Fix 3: RLS Policies on Quotations Table**
```sql
-- Enable RLS (if not already enabled)
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own quotes
CREATE POLICY "Users can read own quotations"
  ON quotations
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() = created_by OR
    lead_id IN (
      SELECT id FROM quote_leads WHERE user_id = auth.uid()
    )
  );

-- Same for quotation_lines and quote_leads
ALTER TABLE quotation_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own quotation lines"
  ON quotation_lines
  FOR SELECT
  USING (
    quotation_id IN (
      SELECT id FROM quotations WHERE
        user_id = auth.uid() OR
        created_by = auth.uid()
    )
  );

CREATE POLICY "Users can read own leads"
  ON quote_leads
  FOR SELECT
  USING (user_id = auth.uid());
```

**Fix 4: Redact Sensitive Data in Logs**
```typescript
// ❌ NEVER log PII
console.log('Quote:', quotation);  // BAD - logs customer email, phone, etc.

// ✅ Log only safe identifiers
console.log('Generating PDF for quote:', {
  quoteId: quotation.id,
  quoteNumber: quotation.quote_number,
  // No PII logged
});
```

**Fix 5: Rate Limiting for PDF Generation**
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'),  // 10 PDFs per hour per IP
});

export async function GET(request: NextRequest, context: any) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  const { success } = await ratelimit.limit(`pdf_gen_${ip}`);
  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded - too many PDF downloads' },
      { status: 429 }
    );
  }

  // ... proceed with PDF generation
}
```

#### Why We Used Service Role (Testing Context):
- **Current:** Service role allows unauthenticated PDF downloads for testing
- **Risk:** Exposes ALL customer data to the internet
- **Must Fix:** CRITICAL - this is a severe data breach vulnerability

#### Recommended Production Approaches:

**Option 1: Require Login (Most Secure)**
- ✅ User must be logged in
- ✅ Ownership verified via RLS
- ✅ Full audit trail

**Option 2: Signed Tokens (For Unauthenticated Sharing)**
- ✅ Generate token when quote is created
- ✅ Token expires after 24-48 hours
- ✅ Token tied to specific quote ID
- ✅ Can be revoked if needed
- ✅ Include in email: "Download your quote: [url with token]"

**Option 3: Hybrid Approach**
- ✅ Authenticated users: Direct access via session
- ✅ Unauthenticated: Require signed token
- ✅ Best of both worlds

#### Compliance Checklist:

**Before deploying to production:**
- [ ] Remove service role from PDF endpoint
- [ ] Implement authentication OR signed tokens
- [ ] Enable RLS on all quote tables
- [ ] Add ownership verification
- [ ] Add rate limiting
- [ ] Audit logging (who accessed what PDF when)
- [ ] Data breach response plan
- [ ] GDPR consent for data processing
- [ ] Privacy policy updated
- [ ] Security audit completed

---

### Issue #4: Input Validation Issues

**File:** `app/api/quote/generate/route.ts`
**Lines:** Schema validation
**Severity:** ⚠️ WARNING

#### Issues Found During Testing:
Based on edge case testing, validation gaps:
- [ ] Accepts negative quantities (should reject)
- [ ] Accepts zero quantities (should reject)
- [ ] Accepts empty line items array (should reject)
- [ ] No validation for non-existent products

#### Current Schema:
```typescript
lineItems: z.array(z.object({
  quantity: z.number().int().positive(),  // ✅ Positive check exists
  // ... but not enforced in all paths
})),
```

#### Required Fixes:
```typescript
const GenerateQuoteSchema = z.object({
  lineItems: z
    .array(z.object({
      quantity: z.number().int().positive().min(1),  // ✅ Enforce > 0
      unitPrice: z.number().positive().min(0.01),    // ✅ Enforce > 0
      // ...
    }))
    .nonempty()  // ✅ Require at least 1 item
    .max(100),   // ✅ Prevent DoS with huge arrays
});
```

#### Status:
- [ ] Update Zod schema with stricter validation
- [ ] Add product existence check
- [ ] Add tests for edge cases

---

### Issue #4-8: Additional Issues

**Status:** Pending extraction from CodeRabbit inline comments

---

## 📝 Action Plan

### Phase 1: Security Fixes (URGENT)
- [ ] Fix email API authentication (Issue #1)
- [ ] Fix PDF API authentication (Issue #2)
- [ ] Review all service role usage across codebase
- [ ] Add ownership verification to all quote endpoints

### Phase 2: Input Validation
- [ ] Add quantity validation (> 0)
- [ ] Add line items validation (not empty)
- [ ] Add email format validation

### Phase 3: Testing
- [ ] Test authenticated flows
- [ ] Test ownership verification
- [ ] Test error responses (401, 403)
- [ ] Re-run security tests

---

## 🔍 Testing Strategy After Fixes

### Authentication Tests:
```bash
# Test 1: Unauthenticated request should fail
curl -X POST http://localhost:3000/api/quote/email/123
# Expected: 401 Unauthorized

# Test 2: Authenticated but not owner should fail
curl -X POST http://localhost:3000/api/quote/email/123 \
  -H "Cookie: session=other-user-token"
# Expected: 403 Forbidden

# Test 3: Owner should succeed
curl -X POST http://localhost:3000/api/quote/email/123 \
  -H "Cookie: session=owner-token"
# Expected: 200 OK
```

---

## 📚 References

- **CodeRabbit Review:** https://github.com/Vallabha-Praneeth/goldarch-quote-builder/pull/1
- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth
- **Next.js Server Components:** https://nextjs.org/docs/app/building-your-application/rendering/server-components
- **OWASP Top 10:** https://owasp.org/www-project-top-ten/

---

## 🎯 Priority Matrix

| Issue | Severity | Impact | Effort | Priority |
|-------|----------|--------|--------|----------|
| Email API Auth | Critical | High | Medium | 🔴 P0 |
| PDF API Auth | Critical | High | Medium | 🔴 P0 |
| Input Validation | Warning | Medium | Low | 🟡 P1 |
| Docstring Generation | Info | Low | Low | 🟢 P2 |

---

## ✅ Definition of Done

Before merging to production:
- [ ] All CRITICAL issues fixed
- [ ] Authentication tests passing
- [ ] Ownership verification working
- [ ] No arbitrary email sending
- [ ] Security audit passed
- [ ] CodeRabbit re-review approved

---

**Last Updated:** January 19, 2026
**Next Review:** After implementing fixes
**Assigned To:** Development team
**Estimated Fix Time:** 4-6 hours for all critical issues
