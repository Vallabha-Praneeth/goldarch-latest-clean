/**
 * Manual Quantity Editing Module - React Component
 * Phase 2 - Modular Implementation
 *
 * Component for editing extracted quantities inline
 * Integrate this into your extraction review page
 */

'use client';

import React, { useState } from 'react';
import { Edit2, Check, X, AlertCircle } from 'lucide-react';
import { ExtractedItem, AdjustmentRequest, ADJUSTMENT_REASONS } from '../types';

interface QuantityEditorProps {
  jobId: string;
  item: ExtractedItem;
  onAdjustmentSaved: (item: ExtractedItem) => void;
}

export function QuantityEditor({ jobId, item, onAdjustmentSaved }: QuantityEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [quantity, setQuantity] = useState(item.adjustedQuantity || item.quantity);
  const [reason, setReason] = useState(item.adjustmentReason || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayQuantity = item.adjustedQuantity ?? item.quantity;
  const hasChanged = quantity !== displayQuantity || (reason && reason !== item.adjustmentReason);

  const handleStartEdit = () => {
    setIsEditing(true);
    setQuantity(displayQuantity);
    setReason(item.adjustmentReason || '');
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setQuantity(displayQuantity);
    setReason(item.adjustmentReason || '');
    setError(null);
  };

  const handleSave = async () => {
    if (quantity === item.quantity && !item.hasAdjustment) {
      // No change, just cancel
      handleCancel();
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const adjustmentData: AdjustmentRequest = {
        category: item.category,
        itemType: item.itemType,
        originalQuantity: item.quantity,
        adjustedQuantity: quantity,
        reason: reason || ADJUSTMENT_REASONS.MANUAL_CORRECTION,
      };

      const response = await fetch(`/api/quote/extraction/${jobId}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adjustmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save adjustment');
      }

      const result = await response.json();

      // Update parent component
      onAdjustmentSaved({
        ...item,
        adjustedQuantity: quantity,
        hasAdjustment: true,
        adjustmentReason: reason || ADJUSTMENT_REASONS.MANUAL_CORRECTION,
      });

      setIsEditing(false);
    } catch (err) {
      console.error('Save adjustment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save adjustment');
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = async () => {
    if (!item.hasAdjustment) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/quote/extraction/${jobId}/adjust?category=${encodeURIComponent(item.category)}&itemType=${encodeURIComponent(item.itemType)}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to revert adjustment');
      }

      // Update parent component
      onAdjustmentSaved({
        ...item,
        adjustedQuantity: undefined,
        hasAdjustment: false,
        adjustmentReason: undefined,
      });

      setIsEditing(false);
    } catch (err) {
      console.error('Revert adjustment error:', err);
      setError('Failed to revert adjustment');
    } finally {
      setSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className={`font-semibold text-lg ${item.hasAdjustment ? 'text-blue-600' : ''}`}>
            {displayQuantity}
          </span>

          {item.hasAdjustment && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              Adjusted
            </span>
          )}
        </div>

        <button
          onClick={handleStartEdit}
          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="Edit quantity"
        >
          <Edit2 className="h-4 w-4" />
        </button>

        {item.hasAdjustment && item.adjustmentReason && (
          <div className="text-xs text-gray-500 italic">
            {item.adjustmentReason}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 border border-blue-200 rounded-lg bg-blue-50">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Quantity
          </label>
          <input
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
        </div>

        {item.hasAdjustment && (
          <div className="text-xs text-gray-500 pt-5">
            <div>Original: {item.quantity}</div>
            <div>Change: {quantity - item.quantity > 0 ? '+' : ''}{quantity - item.quantity}</div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Reason (optional)
        </label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <option value="">Select a reason...</option>
          {Object.entries(ADJUSTMENT_REASONS).map(([key, value]) => (
            <option key={key} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !hasChanged}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
        >
          <Check className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save'}
        </button>

        <button
          onClick={handleCancel}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 text-sm font-medium transition-colors"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>

        {item.hasAdjustment && (
          <button
            onClick={handleRevert}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 disabled:opacity-50 text-sm font-medium transition-colors ml-auto"
          >
            Revert to Original
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Usage in extraction review page:
 *
 * import { QuantityEditor } from '@/lib/extraction/QuantityEditor';
 *
 * function ExtractionReview({ jobId, extractedData }) {
 *   const [items, setItems] = useState(extractedData);
 *
 *   const handleAdjustmentSaved = (updatedItem) => {
 *     setItems(prev => prev.map(item =>
 *       item.category === updatedItem.category && item.itemType === updatedItem.itemType
 *         ? updatedItem
 *         : item
 *     ));
 *   };
 *
 *   return (
 *     <div>
 *       {items.map(item => (
 *         <div key={`${item.category}-${item.itemType}`}>
 *           <h3>{item.itemType}</h3>
 *           <QuantityEditor
 *             jobId={jobId}
 *             item={item}
 *             onAdjustmentSaved={handleAdjustmentSaved}
 *           />
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 */

/**
 * Simple inline editor (alternative version)
 */
export function SimpleQuantityEditor({
  jobId,
  category,
  itemType,
  originalQuantity,
  currentQuantity,
  onQuantityChange,
}: {
  jobId: string;
  category: string;
  itemType: string;
  originalQuantity: number;
  currentQuantity: number;
  onQuantityChange: (newQuantity: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentQuantity);

  const handleSave = async () => {
    if (value === currentQuantity) {
      setIsEditing(false);
      return;
    }

    try {
      const response = await fetch(`/api/quote/extraction/${jobId}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          itemType,
          originalQuantity,
          adjustedQuantity: value,
          reason: 'Manual adjustment',
        }),
      });

      if (response.ok) {
        onQuantityChange(value);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Save error:', error);
      setValue(currentQuantity);
    }
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-semibold">{currentQuantity}</span>
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 text-gray-400 hover:text-blue-600"
        >
          <Edit2 className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(parseInt(e.target.value) || 0)}
        className="w-20 px-2 py-1 border rounded"
        autoFocus
      />
      <button onClick={handleSave} className="p-1 text-green-600">
        <Check className="h-4 w-4" />
      </button>
      <button onClick={() => { setValue(currentQuantity); setIsEditing(false); }} className="p-1 text-red-600">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
