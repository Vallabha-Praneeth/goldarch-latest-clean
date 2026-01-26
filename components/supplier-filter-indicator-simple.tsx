/**
 * Supplier Filter Indicator - Shows when view is filtered by access rules
 */

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Info, Shield } from 'lucide-react';
import type { SupplierAccessRule } from '@/lib/types/supplier-types';

interface SupplierFilterIndicatorProps {
  accessRules: SupplierAccessRule[];
  totalCount: number;
  showDetails?: boolean;
}

export function SupplierFilterIndicator({
  accessRules,
  totalCount,
  showDetails = false,
}: SupplierFilterIndicatorProps) {
  if (accessRules.length === 0) {
    return null;
  }

  // Parse access rules to get categories and regions
  const allCategories = new Set<string>();
  const allRegions = new Set<string>();

  accessRules.forEach((rule) => {
    if (rule.rule_data) {
      rule.rule_data.categories?.forEach((cat) => allCategories.add(cat));
      rule.rule_data.regions?.forEach((reg) => allRegions.add(reg));
    }
  });

  return (
    <Alert className="border-purple-200 bg-purple-50">
      <Shield className="h-4 w-4 text-purple-600" />
      <AlertTitle className="text-purple-900">Filtered View</AlertTitle>
      <AlertDescription className="text-purple-800">
        <div className="space-y-2">
          <p>
            You are viewing <strong>{totalCount}</strong> suppliers based on your access permissions.
          </p>

          {showDetails && (
            <div className="mt-2 space-y-1 text-sm">
              {allCategories.size > 0 && (
                <div>
                  <span className="font-medium">Categories: </span>
                  <span>{Array.from(allCategories).join(', ')}</span>
                </div>
              )}
              {allRegions.size > 0 && (
                <div>
                  <span className="font-medium">Regions: </span>
                  <span>{Array.from(allRegions).join(', ')}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="bg-white">
              {accessRules.length} access {accessRules.length === 1 ? 'rule' : 'rules'}
            </Badge>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * No Access Indicator - Shows when user has no access rules
 */
export function NoAccessIndicator() {
  return (
    <Alert className="border-yellow-200 bg-yellow-50">
      <Info className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-900">No Access</AlertTitle>
      <AlertDescription className="text-yellow-800">
        You don't have access to any suppliers yet. Please contact your administrator to request access.
      </AlertDescription>
    </Alert>
  );
}

/**
 * Compact Filter Badge
 */
interface FilterBadgeProps {
  accessRules: SupplierAccessRule[];
  onClick?: () => void;
}

export function SupplierFilterBadge({ accessRules, onClick }: FilterBadgeProps) {
  if (accessRules.length === 0) {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className="bg-purple-50 border-purple-200 text-purple-700 cursor-pointer hover:bg-purple-100"
      onClick={onClick}
    >
      <Shield className="h-3 w-3 mr-1" />
      Filtered ({accessRules.length} {accessRules.length === 1 ? 'rule' : 'rules'})
    </Badge>
  );
}
