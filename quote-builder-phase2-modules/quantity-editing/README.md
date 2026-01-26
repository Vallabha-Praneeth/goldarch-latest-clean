# Manual Quantity Editing Module - Phase 2

**Status:** Ready for Integration
**Priority:** ⭐⭐ High
**Estimated Integration Time:** 1-2 hours

---

## 📋 Overview

This module enables manual editing of AI-extracted quantities from construction plans. It tracks adjustments, maintains history, and allows users to revert changes. Perfect for correcting extraction errors or accommodating design changes.

## 🎯 Features

- ✅ Inline quantity editing
- ✅ Adjustment tracking and history
- ✅ Reason selection for changes
- ✅ Revert to original quantities
- ✅ Visual indicators for adjusted items
- ✅ Database persistence with RLS
- ✅ React component included
- ✅ Audit trail for adjustments

---

## 📦 Installation

### Step 1: Run Database Migration

```bash
# Copy SQL migration
cp quote-builder-phase2-modules/quantity-editing/sql/adjustments-table.sql \
   supabase/migrations/$(date +%Y%m%d%H%M%S)_create_extraction_adjustments.sql

# Apply migration
supabase db push

# Or run directly in Supabase SQL Editor
```

### Step 2: Copy Module Files

```bash
# Create directories
mkdir -p lib/extraction

# Copy type definitions
cp quote-builder-phase2-modules/quantity-editing/types/index.ts \
   lib/extraction/types.ts

# Copy React component
cp quote-builder-phase2-modules/quantity-editing/lib/QuantityEditor.tsx \
   lib/extraction/QuantityEditor.tsx

# Copy API route
mkdir -p app/api/quote/extraction/[jobId]/adjust
cp quote-builder-phase2-modules/quantity-editing/api/route.ts \
   app/api/quote/extraction/[jobId]/adjust/route.ts
```

### Step 3: Install Dependencies

```bash
npm install zod  # For validation (if not already installed)
```

---

## 🚀 Usage

### Integration with Extraction Review Page

Update your extraction review page to include the quantity editor:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { QuantityEditor } from '@/lib/extraction/QuantityEditor';
import { ExtractedItem, ExtractionAdjustment } from '@/lib/extraction/types';

export default function ExtractionReviewPage({ params }: { params: { jobId: string } }) {
  const [items, setItems] = useState<ExtractedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExtractedData();
    loadAdjustments();
  }, [params.jobId]);

  const loadExtractedData = async () => {
    // Load your extracted data from API
    const response = await fetch(`/api/quote/extraction/${params.jobId}`);
    const data = await response.json();

    setItems(data.extracted.map((item: any) => ({
      category: item.category,
      itemType: item.type,
      quantity: item.quantity,
      hasAdjustment: false,
    })));
  };

  const loadAdjustments = async () => {
    // Load existing adjustments
    const response = await fetch(`/api/quote/extraction/${params.jobId}/adjust`);
    const data = await response.json();

    if (data.success && data.adjustments.length > 0) {
      setItems(prev => prev.map(item => {
        const adjustment = data.adjustments.find(
          (adj: ExtractionAdjustment) =>
            adj.category === item.category && adj.item_type === item.itemType
        );

        if (adjustment) {
          return {
            ...item,
            adjustedQuantity: adjustment.adjusted_quantity,
            hasAdjustment: true,
            adjustmentReason: adjustment.reason,
          };
        }

        return item;
      }));
    }

    setLoading(false);
  };

  const handleAdjustmentSaved = (updatedItem: ExtractedItem) => {
    setItems(prev =>
      prev.map(item =>
        item.category === updatedItem.category && item.itemType === updatedItem.itemType
          ? updatedItem
          : item
      )
    );
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Review Extracted Quantities</h1>

      <div className="space-y-6">
        {Object.entries(
          items.reduce((acc, item) => {
            if (!acc[item.category]) acc[item.category] = [];
            acc[item.category].push(item);
            return acc;
          }, {} as Record<string, ExtractedItem[]>)
        ).map(([category, categoryItems]) => (
          <div key={category} className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 capitalize">{category}</h2>

            <div className="space-y-4">
              {categoryItems.map((item) => (
                <div
                  key={`${item.category}-${item.itemType}`}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{item.itemType}</h3>
                    <p className="text-sm text-gray-500">Category: {item.category}</p>
                  </div>

                  <QuantityEditor
                    jobId={params.jobId}
                    item={item}
                    onAdjustmentSaved={handleAdjustmentSaved}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={() => {
            // Navigate to catalog with adjusted quantities
            window.location.href = `/quote-builder/catalog/${params.jobId}`;
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Continue to Catalog
        </button>
      </div>
    </div>
  );
}
```

### Using Simple Inline Editor

For a minimal implementation:

```typescript
import { SimpleQuantityEditor } from '@/lib/extraction/QuantityEditor';

<SimpleQuantityEditor
  jobId={jobId}
  category="doors"
  itemType="Interior 6-Panel"
  originalQuantity={15}
  currentQuantity={18}
  onQuantityChange={(newQty) => console.log('New quantity:', newQty)}
/>
```

---

## 📐 API Endpoints

### Create/Update Adjustment

```bash
POST /api/quote/extraction/[jobId]/adjust
Content-Type: application/json

Body:
{
  "category": "doors",
  "itemType": "Interior 6-Panel",
  "originalQuantity": 15,
  "adjustedQuantity": 18,
  "reason": "Customer requested 3 additional doors for new closets"
}

Response:
{
  "success": true,
  "adjustment": {
    "id": "uuid",
    "job_id": "job-uuid",
    "category": "doors",
    "item_type": "Interior 6-Panel",
    "original_quantity": 15,
    "adjusted_quantity": 18,
    "reason": "Customer requested...",
    "adjusted_at": "2026-01-18T..."
  }
}
```

### Get All Adjustments

```bash
GET /api/quote/extraction/[jobId]/adjust

Response:
{
  "success": true,
  "adjustments": [
    {
      "id": "uuid",
      "category": "doors",
      "item_type": "Interior 6-Panel",
      "original_quantity": 15,
      "adjusted_quantity": 18,
      "reason": "...",
      "adjusted_at": "2026-01-18T..."
    }
  ]
}
```

### Delete Adjustment (Revert)

```bash
DELETE /api/quote/extraction/[jobId]/adjust?category=doors&itemType=Interior%206-Panel

Response:
{
  "success": true,
  "message": "Adjustment removed successfully"
}
```

---

## 🎨 Customization

### Add Custom Adjustment Reasons

In `lib/extraction/types.ts`:

```typescript
export const ADJUSTMENT_REASONS = {
  MANUAL_CORRECTION: 'Manual correction based on plan review',
  CUSTOMER_REQUEST: 'Customer requested quantity change',
  MEASUREMENT_ERROR: 'Original measurement/extraction error',
  DESIGN_CHANGE: 'Design or scope change',
  SUPPLIER_RECOMMENDATION: 'Supplier recommended adjustment',
  SITE_VISIT_UPDATE: 'Updated based on site visit',  // Add custom reason
  OTHER: 'Other reason',
} as const;
```

### Customize Component Styling

The `QuantityEditor` component uses Tailwind CSS. Modify classes in `QuantityEditor.tsx`:

```typescript
// Change primary color from blue to your brand color
className="bg-blue-600"  →  className="bg-purple-600"
className="text-blue-600"  →  className="text-purple-600"
```

### Add Approval Workflow

Require admin approval for large adjustments:

```typescript
const handleSave = async () => {
  const change = Math.abs(quantity - item.quantity);

  // Require approval if change > 10
  if (change > 10 && !isAdmin) {
    alert('Large adjustments require admin approval');
    return;
  }

  // Continue with save...
};
```

---

## ✅ Testing

### Manual Testing

1. **Test Basic Edit:**
   - Go to extraction review page
   - Click edit button on any item
   - Change quantity
   - Click save
   - Verify "Adjusted" badge appears
   - Refresh page - adjustment persists

2. **Test with Reason:**
   - Edit a quantity
   - Select reason from dropdown
   - Save
   - Verify reason displays

3. **Test Revert:**
   - Click "Revert to Original" on adjusted item
   - Verify quantity returns to original
   - Verify "Adjusted" badge removed

4. **Test Multiple Edits:**
   - Edit same item multiple times
   - Verify latest adjustment saves
   - Check database - should have one record per item

5. **Test in Catalog:**
   - Make adjustments
   - Continue to catalog
   - Verify adjusted quantities are used for pricing

### API Testing

```bash
# Test create adjustment
curl -X POST http://localhost:3000/api/quote/extraction/[job-id]/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "category": "doors",
    "itemType": "Interior Door",
    "originalQuantity": 10,
    "adjustedQuantity": 12,
    "reason": "Test adjustment"
  }'

# Test get adjustments
curl http://localhost:3000/api/quote/extraction/[job-id]/adjust

# Test delete adjustment
curl -X DELETE "http://localhost:3000/api/quote/extraction/[job-id]/adjust?category=doors&itemType=Interior%20Door"
```

---

## 📊 Database Queries

### View All Adjustments

```sql
SELECT
  j.file_name,
  a.category,
  a.item_type,
  a.original_quantity,
  a.adjusted_quantity,
  (a.adjusted_quantity - a.original_quantity) as change,
  a.reason,
  a.adjusted_at
FROM quote_extraction_adjustments a
JOIN plan_jobs j ON a.job_id = j.id
ORDER BY a.adjusted_at DESC;
```

### Find Jobs with Most Adjustments

```sql
SELECT
  job_id,
  COUNT(*) as adjustment_count,
  SUM(adjusted_quantity - original_quantity) as total_change
FROM quote_extraction_adjustments
GROUP BY job_id
ORDER BY adjustment_count DESC
LIMIT 10;
```

### Get Adjustment Summary

```sql
SELECT
  category,
  COUNT(*) as adjustments,
  AVG(adjusted_quantity - original_quantity) as avg_change
FROM quote_extraction_adjustments
GROUP BY category;
```

---

## 🐛 Troubleshooting

### Adjustments Not Saving

**Check:**
1. Database table exists: `quote_extraction_adjustments`
2. RLS policies are configured
3. User is authenticated
4. job_id exists in plan_jobs table
5. Network tab for actual error response

### Adjustments Not Loading

**Check:**
1. GET request to `/api/quote/extraction/[jobId]/adjust` returns data
2. Adjustments are being applied to items array
3. React state is updating correctly
4. Console for errors

### Quantities Not Updating in Catalog

**Solution:**
When loading catalog, merge adjustments with extracted data:

```typescript
const loadCatalogData = async (jobId: string) => {
  // Load extraction results
  const extractionData = await fetch(`/api/quote/extraction/${jobId}`);
  const extracted = await extractionData.json();

  // Load adjustments
  const adjustmentsData = await fetch(`/api/quote/extraction/${jobId}/adjust`);
  const adjustments = await adjustmentsData.json();

  // Merge adjustments
  const items = extracted.items.map(item => {
    const adjustment = adjustments.adjustments.find(
      adj => adj.category === item.category && adj.item_type === item.type
    );

    return {
      ...item,
      quantity: adjustment ? adjustment.adjusted_quantity : item.quantity,
    };
  });

  return items;
};
```

---

## 🔐 Security Notes

- ✅ RLS policies restrict access to user's own jobs
- ✅ Input validation with Zod schema
- ✅ Quantity constraints (non-negative integers)
- ✅ Audit trail with timestamps and user IDs
- ⚠️ Consider adding approval workflow for production
- ⚠️ Monitor for unusual adjustment patterns

---

## 📝 Integration Checklist

- [ ] Run SQL migration to create `quote_extraction_adjustments` table
- [ ] Verify RLS policies are active
- [ ] Copy type definitions to `lib/extraction/types.ts`
- [ ] Copy QuantityEditor component to `lib/extraction/QuantityEditor.tsx`
- [ ] Copy API route to `app/api/quote/extraction/[jobId]/adjust/route.ts`
- [ ] Update extraction review page to use QuantityEditor
- [ ] Load existing adjustments on page load
- [ ] Handle adjustment saves and updates
- [ ] Pass adjusted quantities to catalog page
- [ ] Test edit, save, and revert functions
- [ ] Test with multiple categories
- [ ] Verify database persistence
- [ ] Test RLS policies work correctly
- [ ] Document any customizations

---

## 🎉 Success Criteria

- ✅ Can edit quantities inline
- ✅ Adjustments save to database
- ✅ Adjusted items show badge
- ✅ Reasons display correctly
- ✅ Can revert to original
- ✅ Adjustments persist after refresh
- ✅ Adjusted quantities used in catalog
- ✅ Multiple edits work correctly
- ✅ No console errors
- ✅ Mobile view works well

---

**Module Complete!** Ready to give users control over extracted quantities.
