/**
 * MODULE-1A: Supplier Access Filtering
 * File: components/supplier-filter-indicator.tsx
 *
 * Purpose: Visual indicator showing active supplier access filters
 * Status: SKELETON - Structure complete, ready for use
 *
 * Displays a banner/alert when user's supplier view is filtered by access rules.
 * Helps users understand why they're seeing a limited set of suppliers.
 */

'use client';

import { Info, Filter, AlertCircle, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';

// Types from MODULE-0B
import type { SupplierAccessRule } from '../../MODULE-0B/types/rbac.types';

interface SupplierFilterIndicatorProps {
  accessRules: SupplierAccessRule[];
  totalCount?: number;
  showDetails?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
}

/**
 * Supplier Filter Indicator Component
 *
 * Shows a visual indicator when supplier list is filtered by access rules.
 * Displays:
 * - Number of suppliers visible
 * - Number of access rules active
 * - Details of each access rule (collapsible)
 */
export function SupplierFilterIndicator({
  accessRules,
  totalCount,
  showDetails = false,
  dismissible = false,
  onDismiss,
}: SupplierFilterIndicatorProps) {
  const [isOpen, setIsOpen] = useState(showDetails);
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if no access rules (admin user)
  if (accessRules.length === 0) return null;

  // Don't show if dismissed
  if (isDismissed && dismissible) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <Alert className="border-blue-200 bg-blue-50">
      <Info className="h-4 w-4 text-blue-600" />
      <div className="flex items-start justify-between gap-4 flex-1">
        <div className="flex-1">
          <AlertTitle className="text-blue-900">
            Supplier Access Filter Active
          </AlertTitle>
          <AlertDescription className="text-blue-800 mt-1">
            You are viewing a filtered list of suppliers based on your access permissions.
            {totalCount !== undefined && (
              <span className="font-medium"> {totalCount} supplier{totalCount !== 1 ? 's' : ''} visible</span>
            )}
            {' '}
            ({accessRules.length} access rule{accessRules.length !== 1 ? 's' : ''} applied)
          </AlertDescription>

          {/* Collapsible Details */}
          <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-blue-700 hover:text-blue-900 hover:bg-blue-100 px-2">
                <Filter className="h-3 w-3 mr-1" />
                {isOpen ? 'Hide' : 'Show'} filter details
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3 space-y-2">
              <p className="text-sm font-medium text-blue-900">Active Access Rules:</p>
              <div className="space-y-2">
                {accessRules.map((rule, index) => (
                  <div
                    key={rule.id}
                    className="flex items-start gap-2 p-2 bg-white rounded-md border border-blue-200"
                  >
                    <Badge variant="outline" className="mt-0.5 bg-blue-100 text-blue-800 border-blue-300">
                      Rule {index + 1}
                    </Badge>
                    <div className="flex-1 text-sm">
                      <div className="flex items-center gap-2 flex-wrap">
                        {rule.category_id ? (
                          <Badge variant="secondary" className="text-xs">
                            Category: {rule.category_id.slice(0, 8)}...
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">All categories</span>
                        )}
                        <span className="text-muted-foreground">+</span>
                        {rule.region ? (
                          <Badge variant="secondary" className="text-xs">
                            Region: {rule.region}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">All regions</span>
                        )}
                      </div>
                      {rule.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{rule.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Help Text */}
              <div className="flex items-start gap-2 p-2 bg-blue-100 rounded-md mt-3">
                <AlertCircle className="h-4 w-4 text-blue-700 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-800">
                  <strong>How filters work:</strong> You can see suppliers that match ANY of the above rules.
                  Within each rule, both category and region filters must match (if specified).
                  Contact your admin to modify your access permissions.
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Dismiss Button */}
        {dismissible && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-6 w-6 text-blue-700 hover:text-blue-900 hover:bg-blue-100 flex-shrink-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        )}
      </div>
    </Alert>
  );
}

/**
 * Compact version - shows just a badge with rule count
 */
export function SupplierFilterBadge({
  accessRules,
  onClick,
}: {
  accessRules: SupplierAccessRule[];
  onClick?: () => void;
}) {
  if (accessRules.length === 0) return null;

  return (
    <Badge
      variant="outline"
      className="bg-blue-50 text-blue-700 border-blue-300 cursor-pointer hover:bg-blue-100"
      onClick={onClick}
    >
      <Filter className="h-3 w-3 mr-1" />
      {accessRules.length} filter{accessRules.length !== 1 ? 's' : ''} active
    </Badge>
  );
}

/**
 * No access state - shown when user has zero access rules
 */
export function NoAccessIndicator() {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>No Supplier Access</AlertTitle>
      <AlertDescription>
        You don't have permission to view any suppliers. Contact your administrator to request access.
      </AlertDescription>
    </Alert>
  );
}

/**
 * INTEGRATION NOTES:
 *
 * 1. Basic Usage in Suppliers Page:
 *    ```typescript
 *    import { SupplierFilterIndicator } from '@/MODULE-1A/components/supplier-filter-indicator';
 *    import { useFilteredSuppliers, useIsFiltered, useActiveAccessRules } from '@/MODULE-1A/hooks/use-filtered-suppliers';
 *
 *    export default function SuppliersPage() {
 *      const { data } = useFilteredSuppliers();
 *      const isFiltered = useIsFiltered();
 *      const accessRules = useActiveAccessRules();
 *
 *      return (
 *        <div>
 *          {isFiltered && (
 *            <SupplierFilterIndicator
 *              accessRules={accessRules}
 *              totalCount={data?.total}
 *            />
 *          )}
 *          <SupplierTable suppliers={data?.suppliers || []} />
 *        </div>
 *      );
 *    }
 *    ```
 *
 * 2. With Dismissible Option:
 *    ```typescript
 *    const [showIndicator, setShowIndicator] = useState(true);
 *
 *    {showIndicator && (
 *      <SupplierFilterIndicator
 *        accessRules={accessRules}
 *        dismissible
 *        onDismiss={() => setShowIndicator(false)}
 *      />
 *    )}
 *    ```
 *
 * 3. Compact Badge in Header:
 *    ```typescript
 *    <PageHeader>
 *      <h1>Suppliers</h1>
 *      <SupplierFilterBadge
 *        accessRules={accessRules}
 *        onClick={() => setShowDetails(true)}
 *      />
 *    </PageHeader>
 *    ```
 *
 * 4. No Access State:
 *    ```typescript
 *    if (accessRules.length === 0 && !isAdmin) {
 *      return <NoAccessIndicator />;
 *    }
 *    ```
 *
 * DEPENDENCIES:
 * - shadcn/ui components: Alert, Badge, Button, Collapsible
 * - MODULE-0B: SupplierAccessRule type
 * - Lucide icons: Info, Filter, AlertCircle, X
 *
 * TODO (Full Implementation):
 * - Add link to admin contact page
 * - Add link to access request form
 * - Add persist dismissed state (localStorage)
 * - Add animation on show/hide
 * - Add tooltip on hover showing rule details
 */
