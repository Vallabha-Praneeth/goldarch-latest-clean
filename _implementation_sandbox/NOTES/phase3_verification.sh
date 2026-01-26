#!/bin/bash
# PHASE 3 Verification Script
# Checks that all files were cloned successfully

echo "=== PHASE 3 Clone Verification ==="
echo ""

ERRORS=0

# Check core library files
echo "Checking core library files..."
for file in auth-provider.tsx supabase-client.ts supabase-types.ts utils.ts; do
  if [ -f "_implementation_sandbox/CLONED/lib/$file" ]; then
    echo "  ✓ lib/$file"
  else
    echo "  ✗ lib/$file MISSING"
    ERRORS=$((ERRORS + 1))
  fi
done
echo ""

# Check UI components
echo "Checking UI components..."
for file in dialog.tsx button.tsx input.tsx table.tsx select.tsx badge.tsx \
            alert-dialog.tsx tabs.tsx progress.tsx checkbox.tsx card.tsx \
            label.tsx alert.tsx textarea.tsx; do
  if [ -f "_implementation_sandbox/CLONED/components/ui/$file" ]; then
    echo "  ✓ components/ui/$file"
  else
    echo "  ✗ components/ui/$file MISSING"
    ERRORS=$((ERRORS + 1))
  fi
done
echo ""

# Check page files
echo "Checking page files..."
for file in "app/app-dashboard/layout.tsx" \
            "app/app-dashboard/suppliers/page.tsx" \
            "app/app-dashboard/quotes/page.tsx" \
            "app/app-dashboard/projects/page.tsx" \
            "app/app-dashboard/documents/page.tsx" \
            "app/auth/page.tsx"; do
  if [ -f "_implementation_sandbox/CLONED/$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ $file MISSING"
    ERRORS=$((ERRORS + 1))
  fi
done
echo ""

# Summary
echo "=== Summary ==="
if [ $ERRORS -eq 0 ]; then
  echo "✅ All files cloned successfully!"
  echo ""
  echo "File counts:"
  find _implementation_sandbox/CLONED -type f -name "*.tsx" -o -name "*.ts" | wc -l | xargs echo "  TypeScript files:"
  du -sh _implementation_sandbox/CLONED | awk '{print "  Total size: " $1}'
else
  echo "❌ $ERRORS files missing or failed to clone"
  exit 1
fi

echo ""
echo "Next step: PHASE 4 - Module skeleton implementation"
