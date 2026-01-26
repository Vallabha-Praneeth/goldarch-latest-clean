import React, { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';

interface QuantityEditorProps {
  initialQuantity: number;
  unit?: string;
  onSave?: (newQuantity: number) => void;
  isAdjusted?: boolean;
}

export const QuantityEditor: React.FC<QuantityEditorProps> = ({
  initialQuantity,
  unit = 'units',
  onSave,
  isAdjusted = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [tempQuantity, setTempQuantity] = useState(initialQuantity);

  const handleEdit = () => {
    setTempQuantity(quantity);
    setIsEditing(true);
  };

  const handleSave = () => {
    setQuantity(tempQuantity);
    onSave?.(tempQuantity);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempQuantity(quantity);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="inline-flex items-center gap-2">
        <div className="flex flex-col">
          <input
            type="number"
            value={tempQuantity}
            onChange={(e) => setTempQuantity(Number(e.target.value))}
            className="
              w-24 h-9 px-3 text-sm font-semibold text-navy
              border border-gold-brand rounded-md
              focus:outline-none focus:ring-2 focus:ring-gold-brand focus:ring-opacity-50
            "
            autoFocus
            min="0"
          />
          {initialQuantity !== quantity && (
            <span className="text-xs text-navy-light mt-1">
              Original: {initialQuantity}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            className="p-1.5 bg-navy text-gold-light rounded hover:bg-navy-light transition-colors"
            title="Save"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition-colors"
            title="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-navy">
          {quantity} {unit}
        </span>
        {isAdjusted && (
          <span className="px-2 py-0.5 rounded bg-gold-light bg-opacity-15 border border-gold-brand border-opacity-30">
            <span className="text-tiny text-gold-dark uppercase tracking-wide">
              Adjusted
            </span>
          </span>
        )}
      </div>
      <button
        onClick={handleEdit}
        className="p-1.5 text-gray-400 hover:text-gold-brand transition-colors group"
        title="Edit quantity"
      >
        <Edit2 className="h-4 w-4" />
      </button>
    </div>
  );
};
