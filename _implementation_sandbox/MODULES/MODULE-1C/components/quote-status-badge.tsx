/**
 * MODULE-1C: Quote Approval Workflow
 * File: components/quote-status-badge.tsx
 *
 * Purpose: Visual badge component for quote status
 * Status: COMPLETE - Production-ready
 *
 * Displays color-coded badge showing current quote status.
 */

'use client';

import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

// Types
import type { QuoteStatus } from '../types/quote-approval.types';
import {
  QUOTE_STATUS_LABELS,
  getStatusBadgeVariant,
} from '../types/quote-approval.types';

interface QuoteStatusBadgeProps {
  status: QuoteStatus;
  showIcon?: boolean;
  className?: string;
}

/**
 * Status icon mapping
 */
const STATUS_ICONS = {
  draft: FileText,
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  accepted: ThumbsUp,
  declined: ThumbsDown,
};

/**
 * Quote Status Badge Component
 *
 * Shows color-coded badge with icon and label for quote status.
 */
export function QuoteStatusBadge({
  status,
  showIcon = true,
  className = '',
}: QuoteStatusBadgeProps) {
  const variant = getStatusBadgeVariant(status);
  const label = QUOTE_STATUS_LABELS[status];
  const Icon = STATUS_ICONS[status];

  return (
    <Badge variant={variant} className={className}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {label}
    </Badge>
  );
}

/**
 * Compact status dot (no text, just colored dot)
 */
export function QuoteStatusDot({
  status,
  className = '',
}: {
  status: QuoteStatus;
  className?: string;
}) {
  const colorClasses = {
    draft: 'bg-gray-400',
    pending: 'bg-yellow-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
    accepted: 'bg-blue-500',
    declined: 'bg-orange-500',
  };

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colorClasses[status]} ${className}`}
      title={QUOTE_STATUS_LABELS[status]}
    />
  );
}

/**
 * Status badge with timestamp
 */
export function QuoteStatusWithTimestamp({
  status,
  timestamp,
}: {
  status: QuoteStatus;
  timestamp: string | null;
}) {
  return (
    <div className="flex items-center gap-2">
      <QuoteStatusBadge status={status} />
      {timestamp && (
        <span className="text-sm text-muted-foreground">
          {new Date(timestamp).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}

/**
 * INTEGRATION NOTES:
 *
 * 1. Basic Usage:
 *    ```typescript
 *    <QuoteStatusBadge status={quote.status} />
 *    ```
 *
 * 2. Without Icon:
 *    ```typescript
 *    <QuoteStatusBadge status="approved" showIcon={false} />
 *    ```
 *
 * 3. Status Dot (compact):
 *    ```typescript
 *    <QuoteStatusDot status={quote.status} />
 *    ```
 *
 * 4. With Timestamp:
 *    ```typescript
 *    <QuoteStatusWithTimestamp
 *      status={quote.status}
 *      timestamp={quote.approved_at || quote.submitted_at}
 *    />
 *    ```
 *
 * 5. In Table:
 *    ```typescript
 *    <TableCell>
 *      <QuoteStatusBadge status={quote.status} />
 *    </TableCell>
 *    ```
 *
 * DEPENDENCIES:
 * - shadcn/ui: Badge component
 * - Lucide icons
 * - MODULE-1C types: QuoteStatus, helper functions
 */
