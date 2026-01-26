#!/bin/bash

# Phase 2 Migration Script
# Applies all Phase 2 database changes to Supabase

set -e

echo "🚀 Starting Phase 2 Migration..."
echo ""

# Check if environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL is not set"
  echo "Please set your Supabase environment variables first:"
  echo "  export NEXT_PUBLIC_SUPABASE_URL='your-url'"
  echo "  export SUPABASE_SERVICE_ROLE_KEY='your-key'"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY is not set"
  exit 1
fi

# Extract project ref from URL
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's/https:\/\/\([^.]*\).*/\1/')

echo "📍 Project: $PROJECT_REF"
echo ""

# Run the migration using Supabase CLI or direct SQL
echo "📝 Applying migration..."
echo ""

if command -v supabase &> /dev/null; then
  # Use Supabase CLI if available
  echo "Using Supabase CLI..."
  supabase db push
else
  # Use psql if available
  if command -v psql &> /dev/null; then
    echo "Using psql..."
    DB_URL="postgresql://postgres:$SUPABASE_SERVICE_ROLE_KEY@db.$PROJECT_REF.supabase.co:5432/postgres"
    psql "$DB_URL" -f supabase/migrations/20260119_phase2_complete.sql
  else
    echo "⚠️  Neither Supabase CLI nor psql found."
    echo ""
    echo "Please apply the migration manually:"
    echo "1. Go to your Supabase Dashboard"
    echo "2. Navigate to SQL Editor"
    echo "3. Copy and paste the contents of:"
    echo "   supabase/migrations/20260119_phase2_complete.sql"
    echo "4. Run the query"
    exit 1
  fi
fi

echo ""
echo "✅ Migration completed!"
echo ""
echo "⚠️  IMPORTANT: Manual Steps Required"
echo ""
echo "You must manually create the 'products' Storage bucket:"
echo "1. Go to Supabase Dashboard > Storage"
echo "2. Click 'New Bucket'"
echo "3. Name: 'products'"
echo "4. Public: Yes"
echo "5. File size limit: 5MB"
echo "6. Allowed MIME types: image/jpeg, image/png, image/webp"
echo ""
echo "The storage policies will be automatically applied after bucket creation."
echo ""
