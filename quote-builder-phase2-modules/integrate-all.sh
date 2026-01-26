#!/bin/bash

# Phase 2 - Complete Integration Script
# Integrates all Phase 2 modules automatically

set -e

echo "🚀 Quote Builder Phase 2 - Complete Integration"
echo "==============================================="
echo ""
echo "This script will integrate all Phase 2 modules:"
echo "  1. PDF Generation"
echo "  2. Email Delivery"
echo "  3. Product Images"
echo "  4. Manual Quantity Editing"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Ask for confirmation
read -p "Continue with integration? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Integration cancelled."
    exit 0
fi

echo ""
echo "Starting integration..."
echo ""

# Step 1: Install Dependencies
echo "📦 Step 1: Installing dependencies..."
npm install puppeteer resend
echo -e "${GREEN}✓${NC} Dependencies installed"
echo ""

# Step 2: Create Directory Structure
echo "📁 Step 2: Creating directory structure..."
mkdir -p lib/pdf
mkdir -p lib/email
mkdir -p lib/storage
mkdir -p lib/extraction
mkdir -p app/api/quote/pdf/[quoteId]
mkdir -p app/api/quote/email/[quoteId]
mkdir -p app/api/quote/products/images
mkdir -p app/api/quote/extraction/[jobId]/adjust
echo -e "${GREEN}✓${NC} Directories created"
echo ""

# Step 3: Copy PDF Generation Files
echo "📄 Step 3: Integrating PDF Generation module..."
cp quote-builder-phase2-modules/pdf-generation/types/index.ts lib/pdf/types.ts
cp quote-builder-phase2-modules/pdf-generation/lib/pdf-generator.ts lib/pdf/pdf-generator.ts
cp quote-builder-phase2-modules/pdf-generation/api/route.ts app/api/quote/pdf/[quoteId]/route.ts

# Update imports
sed -i.bak "s|from '../types'|from './types'|g" lib/pdf/pdf-generator.ts
rm lib/pdf/pdf-generator.ts.bak 2>/dev/null || true

echo -e "${GREEN}✓${NC} PDF Generation integrated"
echo ""

# Step 4: Copy Email Delivery Files
echo "📧 Step 4: Integrating Email Delivery module..."
cp quote-builder-phase2-modules/email-delivery/types/index.ts lib/email/types.ts
cp quote-builder-phase2-modules/email-delivery/lib/email-service.ts lib/email/email-service.ts
cp quote-builder-phase2-modules/email-delivery/api/route.ts app/api/quote/email/[quoteId]/route.ts
cp quote-builder-phase2-modules/email-delivery/sql/email-tracking-table.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_create_email_tracking.sql

# Update imports
sed -i.bak "s|from '../types'|from './types'|g" lib/email/email-service.ts
rm lib/email/email-service.ts.bak 2>/dev/null || true

echo -e "${GREEN}✓${NC} Email Delivery integrated"
echo ""

# Step 5: Copy Product Images Files
echo "🖼️  Step 5: Integrating Product Images module..."
cp quote-builder-phase2-modules/product-images/types/index.ts lib/storage/types.ts
cp quote-builder-phase2-modules/product-images/lib/image-uploader.ts lib/storage/image-uploader.ts
cp quote-builder-phase2-modules/product-images/lib/ImageUploadComponent.tsx lib/storage/ImageUploadComponent.tsx
cp quote-builder-phase2-modules/product-images/api/route.ts app/api/quote/products/images/route.ts
cp quote-builder-phase2-modules/product-images/sql/product-images-migration.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_add_product_images.sql

# Update imports
sed -i.bak "s|from '../types'|from './types'|g" lib/storage/image-uploader.ts
sed -i.bak "s|from '../types'|from './types'|g" lib/storage/ImageUploadComponent.tsx
rm lib/storage/image-uploader.ts.bak lib/storage/ImageUploadComponent.tsx.bak 2>/dev/null || true

echo -e "${GREEN}✓${NC} Product Images integrated"
echo ""

# Step 6: Copy Quantity Editing Files
echo "✏️  Step 6: Integrating Manual Quantity Editing module..."
cp quote-builder-phase2-modules/quantity-editing/types/index.ts lib/extraction/types.ts
cp quote-builder-phase2-modules/quantity-editing/lib/QuantityEditor.tsx lib/extraction/QuantityEditor.tsx
cp quote-builder-phase2-modules/quantity-editing/api/route.ts app/api/quote/extraction/[jobId]/adjust/route.ts
cp quote-builder-phase2-modules/quantity-editing/sql/adjustments-table.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_create_extraction_adjustments.sql

# Update imports
sed -i.bak "s|from '../types'|from './types'|g" lib/extraction/QuantityEditor.tsx
rm lib/extraction/QuantityEditor.tsx.bak 2>/dev/null || true

echo -e "${GREEN}✓${NC} Quantity Editing integrated"
echo ""

# Step 7: Run Database Migrations
echo "🗄️  Step 7: Running database migrations..."
if command -v supabase &> /dev/null; then
    supabase db push
    echo -e "${GREEN}✓${NC} Database migrations applied"
else
    echo -e "${YELLOW}⚠${NC}  Supabase CLI not found. Please run migrations manually:"
    echo "   1. Go to Supabase Dashboard → SQL Editor"
    echo "   2. Run each migration file in supabase/migrations/"
fi
echo ""

# Step 8: Environment Variables Check
echo "🔐 Step 8: Checking environment variables..."
ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
    touch "$ENV_FILE"
fi

MISSING_VARS=()

if ! grep -q "RESEND_API_KEY" "$ENV_FILE"; then
    MISSING_VARS+=("RESEND_API_KEY")
fi

if ! grep -q "EMAIL_FROM_ADDRESS" "$ENV_FILE"; then
    MISSING_VARS+=("EMAIL_FROM_ADDRESS")
fi

if ! grep -q "EMAIL_FROM_NAME" "$ENV_FILE"; then
    MISSING_VARS+=("EMAIL_FROM_NAME")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠${NC}  Missing environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Add these to .env.local:"
    echo "RESEND_API_KEY=re_xxxxxxxxxxxx"
    echo "EMAIL_FROM_ADDRESS=quotes@your-domain.com"
    echo "EMAIL_FROM_NAME=GoldArch Construction"
    echo ""
else
    echo -e "${GREEN}✓${NC} Environment variables configured"
fi
echo ""

# Step 9: Supabase Storage Setup
echo "🗄️  Step 9: Supabase Storage setup..."
echo -e "${YELLOW}⚠${NC}  Manual step required:"
echo "   1. Go to Supabase Dashboard → Storage"
echo "   2. Create bucket named 'products'"
echo "   3. Set bucket to public"
echo "   4. Run storage policies from:"
echo "      supabase/migrations/*_add_product_images.sql"
echo ""

# Complete
echo "==============================================="
echo -e "${GREEN}✅ Integration Complete!${NC}"
echo ""
echo "Next Steps:"
echo "1. Configure environment variables (see above)"
echo "2. Set up Supabase Storage bucket"
echo "3. Add UI components to your pages:"
echo "   - PDF download button to review page"
echo "   - Email send button to review page"
echo "   - ImageUploadComponent to admin page"
echo "   - QuantityEditor to extraction review page"
echo ""
echo "4. Run tests:"
echo "   bash quote-builder-phase2-modules/testing/test-all-modules.sh"
echo ""
echo "5. Read integration guide:"
echo "   cat quote-builder-phase2-modules/INTEGRATION_GUIDE.md"
echo ""
echo "🎉 Happy coding!"
