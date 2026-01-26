/**
 * Selection Checkbox Component
 * Used in bulk operations for selecting individual items
 */

'use client';

import { Checkbox } from '@/components/ui/checkbox';

interface SelectionCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  indeterminate?: boolean;
  'aria-label'?: string;
}

export function SelectionCheckbox({
  checked,
  onCheckedChange,
  indeterminate,
  'aria-label': ariaLabel,
}: SelectionCheckboxProps) {
  return (
    <Checkbox
      checked={indeterminate ? 'indeterminate' : checked}
      onCheckedChange={onCheckedChange}
      aria-label={ariaLabel}
      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      onClick={(e) => e.stopPropagation()}
    />
  );
}
