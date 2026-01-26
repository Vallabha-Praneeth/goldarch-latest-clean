import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TrendIndicatorProps {
  value: number;
  showValue?: boolean;
  showArrow?: boolean;
  className?: string;
}

export function TrendIndicator({
  value,
  showValue = true,
  showArrow = true,
  className,
}: TrendIndicatorProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  const absValue = Math.abs(value);

  const colorClass = isNeutral
    ? 'text-muted-foreground'
    : isPositive
    ? 'text-emerald-600'
    : 'text-red-600';

  const Icon = isNeutral ? Minus : isPositive ? ArrowUp : ArrowDown;

  return (
    <div className={cn('flex items-center gap-1 text-sm font-medium', colorClass, className)}>
      {showArrow && <Icon className="h-3 w-3" />}
      {showValue && (
        <span>
          {isPositive && '+'}
          {value.toFixed(1)}%
        </span>
      )}
    </div>
  );
}
