/**
 * MODULE-0C: Team Management UI
 * File: components/supplier-access-dialog.tsx
 *
 * Purpose: Dialog for managing per-user supplier access rules
 * Status: SKELETON - Structure complete, logic placeholder
 *
 * Allows admins to control which suppliers a user can view based on category/region.
 */

'use client';

import { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Filter, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Types from MODULE-0B
import type { SupplierAccessRule, SupplierRegion } from '../../MODULE-0B/types/rbac.types';
import { SUPPLIER_REGIONS } from '../../MODULE-0B/types/rbac.types';

// Hooks
import {
  useUserAccessRules,
  useCreateAccessRule,
  useDeleteAccessRule,
  useCategories,
} from '../hooks/use-team-data';

interface SupplierAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  onSuccess?: () => void;
}

/**
 * Supplier Access Dialog Component
 *
 * Features:
 * - View existing access rules
 * - Add new access rules (category + region filters)
 * - Remove access rules
 * - Validation: At least one filter required
 */
export function SupplierAccessDialog({
  open,
  onOpenChange,
  userId,
  onSuccess,
}: SupplierAccessDialogProps) {
  // Form state for new rule
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  // Fetch existing access rules (SKELETON)
  const { data: accessRules = [], isLoading: isLoadingRules, refetch } = useUserAccessRules(userId);

  // Fetch categories for dropdown (SKELETON)
  const { data: categories = [] } = useCategories();

  // Mutations (SKELETON)
  const { mutate: createRule, isPending: isCreating } = useCreateAccessRule();
  const { mutate: deleteRule, isPending: isDeleting } = useDeleteAccessRule();

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setCategoryId(null);
      setRegion(null);
      setNotes('');
    }
  }, [open]);

  // Validation: At least one filter required
  const isValidRule = categoryId || region;

  // Handle add new rule
  const handleAddRule = () => {
    if (!userId || !isValidRule) return;

    createRule(
      {
        userId,
        categoryId,
        region,
        notes,
      },
      {
        onSuccess: () => {
          // Reset form
          setCategoryId(null);
          setRegion(null);
          setNotes('');

          // Refresh rules list
          refetch();
        },
      }
    );
  };

  // Handle delete rule
  const handleDeleteRule = (ruleId: string) => {
    deleteRule(ruleId, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  // Handle dialog close
  const handleClose = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Manage Supplier Access
          </DialogTitle>
          <DialogDescription>
            Control which suppliers this user can view based on category and region filters.
            {userId && ` User ID: ${userId.slice(0, 8)}...`}
          </DialogDescription>
        </DialogHeader>

        {isLoadingRules ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Existing Rules */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">Current Access Rules</Label>
                <Badge variant="outline">
                  {accessRules.length} rule{accessRules.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {accessRules.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No access rules defined</AlertTitle>
                  <AlertDescription>
                    This user has no supplier access rules. Add rules below to grant access.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accessRules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell>
                            {rule.category_id ? (
                              <Badge variant="secondary">
                                {categories.find(c => c.id === rule.category_id)?.name || 'Category'}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">All categories</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {rule.region ? (
                              <Badge variant="secondary">{rule.region}</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">All regions</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {rule.notes || '—'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRule(rule.id)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Delete rule</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Add New Rule Form */}
            <div className="space-y-4 pt-4 border-t">
              <Label className="text-base">Add New Access Rule</Label>

              <div className="grid grid-cols-2 gap-4">
                {/* Category Filter */}
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Select
                    value={categoryId || 'null'}
                    onValueChange={(value) => setCategoryId(value === 'null' ? null : value)}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">
                        <span className="text-muted-foreground">All categories</span>
                      </SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Region Filter */}
                <div className="space-y-2">
                  <Label htmlFor="region">
                    Region <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Select
                    value={region || 'null'}
                    onValueChange={(value) => setRegion(value === 'null' ? null : value)}
                  >
                    <SelectTrigger id="region">
                      <SelectValue placeholder="All regions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">
                        <span className="text-muted-foreground">All regions</span>
                      </SelectItem>
                      {SUPPLIER_REGIONS.map((regionOption) => (
                        <SelectItem key={regionOption} value={regionOption}>
                          {regionOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Validation Error */}
              {!isValidRule && (categoryId !== null || region !== null) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    At least one filter (category or region) must be selected
                  </AlertDescription>
                </Alert>
              )}

              {/* Add Rule Button */}
              <Button
                onClick={handleAddRule}
                disabled={!isValidRule || isCreating}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Access Rule
                  </>
                )}
              </Button>

              {/* Help Text */}
              <Alert>
                <Filter className="h-4 w-4" />
                <AlertTitle>How access rules work</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                    <li>Select <strong>category only</strong> to allow all suppliers in that category (any region)</li>
                    <li>Select <strong>region only</strong> to allow all suppliers in that region (any category)</li>
                    <li>Select <strong>both</strong> to allow only suppliers matching both filters</li>
                    <li>Multiple rules act as <strong>OR</strong> - user sees suppliers matching any rule</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={handleClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * INTEGRATION NOTES:
 *
 * 1. Access Rule Logic:
 *    - NULL category = all categories
 *    - NULL region = all regions
 *    - Multiple rules = OR condition (user sees suppliers matching ANY rule)
 *    - Example: Rule 1 (Kitchen, US) + Rule 2 (Bathroom, NULL) = Kitchen in US + All Bathroom
 *
 * 2. Database Queries:
 *    ```typescript
 *    // Create rule
 *    await supabase.from('supplier_access_rules').insert({
 *      user_id: userId,
 *      category_id: categoryId,
 *      region: region,
 *      created_by: currentUserId
 *    });
 *
 *    // Delete rule
 *    await supabase.from('supplier_access_rules').delete().eq('id', ruleId);
 *    ```
 *
 * 3. RLS Policy Application:
 *    - Rules are automatically enforced by RLS policies (MODULE-0B)
 *    - No application code needed to filter suppliers
 *    - User queries suppliers table, RLS handles filtering
 *
 * 4. Category Management:
 *    - Fetches categories from existing categories table
 *    - If category doesn't exist, dropdown will be empty
 *    - Categories should be managed separately
 *
 * 5. Region Management:
 *    - Regions are predefined in SUPPLIER_REGIONS constant
 *    - Can be extended in MODULE-0B/types/rbac.types.ts
 *    - Free-text regions also supported
 *
 * 6. Validation:
 *    - Client-side: At least one filter required
 *    - Server-side: CHECK constraint enforces same rule
 *    - Duplicate rules allowed (no unique constraint)
 *
 * DEPENDENCIES:
 * - MODULE-0B: SupplierAccessRule type, SUPPLIER_REGIONS constant
 * - useUserAccessRules hook (fetches existing rules)
 * - useCreateAccessRule hook (creates new rule)
 * - useDeleteAccessRule hook (deletes rule)
 * - useCategories hook (fetches categories)
 * - shadcn/ui components: Dialog, Select, Table, Badge, Alert
 *
 * TODO (Full Implementation):
 * - Add bulk delete (select multiple rules)
 * - Add rule preview (show which suppliers will be visible)
 * - Add rule templates (common combinations)
 * - Add expiration dates for temporary access
 * - Add rule priority/ordering
 * - Add conflict detection (overlapping rules)
 * - Add audit log for rule changes
 * - Add copy rules from another user
 */
