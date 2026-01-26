#!/bin/bash

# Phase 2 - Module Testing Script
# Tests all Phase 2 modules to verify integration

set -e

echo "🧪 Testing Quote Builder Phase 2 Modules"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL (change if needed)
BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "Testing against: $BASE_URL"
echo ""

# Check if server is running
echo "📡 Checking if server is running..."
if curl -s --head "$BASE_URL" | head -n 1 | grep "200\|301\|302" > /dev/null; then
  echo -e "${GREEN}✓${NC} Server is running"
else
  echo -e "${RED}✗${NC} Server is not running. Please start with: npm run dev"
  exit 1
fi
echo ""

# Test 1: PDF Generation
echo "📄 Testing PDF Generation..."
if [ -z "$TEST_QUOTE_ID" ]; then
  echo -e "${YELLOW}⚠${NC}  TEST_QUOTE_ID not set. Skipping PDF test."
  echo "   Set it with: export TEST_QUOTE_ID=your-quote-id"
else
  PDF_RESPONSE=$(curl -s -o /tmp/test-quote.pdf -w "%{http_code}" "$BASE_URL/api/quote/pdf/$TEST_QUOTE_ID")

  if [ "$PDF_RESPONSE" = "200" ]; then
    if [ -f /tmp/test-quote.pdf ] && [ -s /tmp/test-quote.pdf ]; then
      PDF_SIZE=$(wc -c < /tmp/test-quote.pdf)
      echo -e "${GREEN}✓${NC} PDF generated successfully (${PDF_SIZE} bytes)"
      rm /tmp/test-quote.pdf
    else
      echo -e "${RED}✗${NC} PDF file is empty"
    fi
  else
    echo -e "${RED}✗${NC} PDF generation failed (HTTP $PDF_RESPONSE)"
  fi
fi
echo ""

# Test 2: Email Configuration
echo "📧 Testing Email Configuration..."
if [ -z "$RESEND_API_KEY" ]; then
  echo -e "${YELLOW}⚠${NC}  RESEND_API_KEY not set in environment"
  echo "   Email delivery will not work without this"
else
  echo -e "${GREEN}✓${NC} RESEND_API_KEY is configured"
fi

if [ -z "$EMAIL_FROM_ADDRESS" ]; then
  echo -e "${YELLOW}⚠${NC}  EMAIL_FROM_ADDRESS not set"
else
  echo -e "${GREEN}✓${NC} EMAIL_FROM_ADDRESS: $EMAIL_FROM_ADDRESS"
fi
echo ""

# Test 3: Storage Configuration
echo "🖼️  Testing Storage Configuration..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo -e "${RED}✗${NC} NEXT_PUBLIC_SUPABASE_URL not set"
else
  echo -e "${GREEN}✓${NC} Supabase URL configured"
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}✗${NC} SUPABASE_SERVICE_ROLE_KEY not set"
else
  echo -e "${GREEN}✓${NC} Supabase service role key configured"
fi
echo ""

# Test 4: Database Tables
echo "🗄️  Testing Database Tables..."
if command -v psql &> /dev/null && [ -n "$DATABASE_URL" ]; then
  # Check for email tracking table
  if psql "$DATABASE_URL" -c "SELECT 1 FROM quote_email_tracking LIMIT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} quote_email_tracking table exists"
  else
    echo -e "${RED}✗${NC} quote_email_tracking table not found"
  fi

  # Check for adjustments table
  if psql "$DATABASE_URL" -c "SELECT 1 FROM quote_extraction_adjustments LIMIT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} quote_extraction_adjustments table exists"
  else
    echo -e "${RED}✗${NC} quote_extraction_adjustments table not found"
  fi

  # Check for products.images column
  if psql "$DATABASE_URL" -c "SELECT images FROM products LIMIT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} products.images column exists"
  else
    echo -e "${RED}✗${NC} products.images column not found"
  fi
else
  echo -e "${YELLOW}⚠${NC}  Cannot test database (psql not available or DATABASE_URL not set)"
fi
echo ""

# Test 5: API Endpoints
echo "🔌 Testing API Endpoints..."

# Test image upload endpoint (just check if route exists)
IMAGES_API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/quote/products/images" -F "file=@/dev/null" -F "category=test" -F "productId=test" 2>/dev/null || echo "000")
if [ "$IMAGES_API_RESPONSE" = "400" ] || [ "$IMAGES_API_RESPONSE" = "401" ]; then
  echo -e "${GREEN}✓${NC} Image upload API endpoint exists (HTTP $IMAGES_API_RESPONSE)"
elif [ "$IMAGES_API_RESPONSE" = "404" ]; then
  echo -e "${RED}✗${NC} Image upload API endpoint not found (HTTP 404)"
else
  echo -e "${YELLOW}⚠${NC}  Image upload API response: HTTP $IMAGES_API_RESPONSE"
fi

echo ""

# Test 6: Node Modules
echo "📦 Testing Dependencies..."

if [ -d "node_modules/puppeteer" ]; then
  echo -e "${GREEN}✓${NC} puppeteer installed"
else
  echo -e "${RED}✗${NC} puppeteer not installed (run: npm install puppeteer)"
fi

if [ -d "node_modules/resend" ]; then
  echo -e "${GREEN}✓${NC} resend installed"
else
  echo -e "${RED}✗${NC} resend not installed (run: npm install resend)"
fi

echo ""
echo "=========================================="
echo "🏁 Testing Complete!"
echo ""
echo "Next Steps:"
echo "1. Fix any issues marked with ${RED}✗${NC}"
echo "2. Review warnings marked with ${YELLOW}⚠${NC}"
echo "3. Set TEST_QUOTE_ID to test PDF generation"
echo "4. Run manual tests in browser"
echo ""
