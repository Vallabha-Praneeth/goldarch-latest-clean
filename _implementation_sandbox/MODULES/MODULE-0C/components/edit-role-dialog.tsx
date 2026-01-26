/**
 * MODULE-0C: Team Management UI
 * File: components/edit-role-dialog.tsx
 *
 * Purpose: Dialog for changing a user's role
 * Status: SKELETON - Structure complete, logic placeholder
 *
 * Allows admins to update user roles with confirmation and notes.
 */

'use client';

import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Save, Loader2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Types from MODULE-0B
import type { UserRole, UserWithRole } from '../../MODULE-0B/types/rbac.types';
import {
  getRoleDisplayName,
  getRoleDescription,
  canAssignRole,
} from '../../MODULE-0B/types/rbac.types';

// Hooks
import { useUserDetails, useUpdateUserRole } from '../hooks/use-team-data';

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  onSuccess?: () => void;
}

const AVAILABLE_ROLES: UserRole[] = ['Admin', 'Manager', 'Viewer', 'Procurement'];

/**
 * Edit Role Dialog Component
 *
 * Features:
 * - Load current user details
 * - Select new role with radio buttons
 * - Add notes about role change
 * - Confirmation for Admin role changes
 * - Permission check before submission
 */
export function EditRoleDialog({
  open,
  onOpenChange,
  userId,
  onSuccess,
}: EditRoleDialogProps) {
  // Form state
  const [newRole, setNewRole] = useState<UserRole>('Viewer');
  const [notes, setNotes] = useState('');
  const [showAdminWarning, setShowAdminWarning] = useState(false);

  // Fetch user details (SKELETON)
  const { data: user, isLoading: isLoadingUser } = useUserDetails(userId);

  // Mutation hook (SKELETON)
  const { mutate: updateRole, isPending, error } = useUpdateUserRole();

  // Current user role (for permission check) - SKELETON: Mock as Admin
  const currentUserRole: UserRole = 'Admin';

  // Update newRole when user data loads
  useEffect(() => {
    if (user?.role) {
      setNewRole(user.role);
    }
  }, [user]);

  // Show warning when selecting Admin role
  useEffect(() => {
    setShowAdminWarning(newRole === 'Admin' && user?.role !== 'Admin');
  }, [newRole, user?.role]);

  // Check if role change is allowed
  const permissionCheck = canAssignRole(currentUserRole, newRole);
  const hasChanges = user?.role !== newRole;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId || !user) return;

    // Permission check
    if (!permissionCheck.allowed) {
      alert(permissionCheck.reason);
      return;
    }

    // SKELETON: Mock API call
    updateRole(
      {
        userId,
        newRole,
        notes,
      },
      {
        onSuccess: () => {
          // Reset form
          setNotes('');

          // Close dialog
          onOpenChange(false);

          // Trigger parent refresh
          onSuccess?.();
        },
      }
    );
  };

  // Handle dialog close
  const handleClose = () => {
    if (isPending) return; // Don't close while saving

    // Reset form
    setNotes('');

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Change User Role
          </DialogTitle>
          <DialogDescription>
            {user ? (
              <>Update role for <strong>{user.email}</strong></>
            ) : (
              'Loading user information...'
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoadingUser ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : user ? (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Current Role (Read-only) */}
              <div className="space-y-2">
                <Label>Current Role</Label>
                <div className="px-3 py-2 bg-muted rounded-md">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{getRoleDisplayName(user.role || 'Viewer')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getRoleDescription(user.role || 'Viewer')}
                  </p>
                </div>
              </div>

              {/* New Role Selection */}
              <div className="space-y-3">
                <Label>
                  New Role <span className="text-destructive">*</span>
                </Label>
                <RadioGroup value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
                  {AVAILABLE_ROLES.map((roleOption) => (
                    <div
                      key={roleOption}
                      className="flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer hover:bg-muted/50"
                      onClick={() => setNewRole(roleOption)}
                    >
                      <RadioGroupItem value={roleOption} id={`role-${roleOption}`} />
                      <div className="flex-1">
                        <label
                          htmlFor={`role-${roleOption}`}
                          className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                        >
                          <Shield className="h-4 w-4" />
                          {getRoleDisplayName(roleOption)}
                        </label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {getRoleDescription(roleOption)}
                        </p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Admin Role Warning */}
              {showAdminWarning && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warning: Admin Role</AlertTitle>
                  <AlertDescription>
                    You are assigning the Admin role, which grants full access to all features
                    including user management and system settings. Only assign this role to trusted
                    users.
                  </AlertDescription>
                </Alert>
              )}

              {/* Notes (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="notes">
                  Notes <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Reason for role change, additional context, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isPending}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  These notes will be recorded for audit purposes
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {error instanceof Error ? error.message : 'Failed to update role'}
                  </AlertDescription>
                </Alert>
              )}

              {/* Permission Denied */}
              {!permissionCheck.allowed && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{permissionCheck.reason}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending || !hasChanges || !permissionCheck.allowed}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            User not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * INTEGRATION NOTES:
 *
 * 1. Data Flow:
 *    - useUserDetails fetches current user info
 *    - useUpdateUserRole mutation updates the role
 *    - Both hooks use React Query for caching/invalidation
 *
 * 2. Permission Checks:
 *    - canAssignRole() validates if current user can assign target role
 *    - Only Admins can assign Admin role
 *    - Server-side validation required as well
 *
 * 3. API Integration:
 *    ```typescript
 *    // PATCH /api/team/{userId}/role
 *    await supabase
 *      .from('user_roles')
 *      .update({ role: newRole, assigned_by: currentUserId })
 *      .eq('user_id', userId);
 *    ```
 *
 * 4. Audit Trail:
 *    - Notes are saved with role change
 *    - assigned_by tracks who made the change
 *    - assigned_at tracks when the change was made
 *
 * 5. Security:
 *    - Client-side permission check (UX)
 *    - Server-side permission check (security)
 *    - Prevent self-demotion from Admin (future enhancement)
 *
 * 6. User Experience:
 *    - Shows current role (read-only)
 *    - Radio buttons for new role selection
 *    - Warning for Admin role assignment
 *    - Disable save if no changes
 *    - Loading state while fetching/saving
 *
 * DEPENDENCIES:
 * - MODULE-0B: UserRole types, permission helpers
 * - useUserDetails hook (fetches user data)
 * - useUpdateUserRole hook (mutation)
 * - shadcn/ui components: Dialog, RadioGroup, Alert, Textarea
 *
 * TODO (Full Implementation):
 * - Add confirmation step for destructive changes (Admin → Viewer)
 * - Add role change history viewer
 * - Add "notify user" checkbox (send email about role change)
 * - Add validation: prevent last admin from being demoted
 * - Add dry-run mode to preview permission changes
 * - Show what permissions are being added/removed
 */
