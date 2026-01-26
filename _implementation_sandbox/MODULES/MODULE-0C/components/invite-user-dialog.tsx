/**
 * MODULE-0C: Team Management UI
 * File: components/invite-user-dialog.tsx
 *
 * Purpose: Dialog for inviting new users via email
 * Status: SKELETON - Structure complete, logic placeholder
 *
 * Allows admins to send invitations to new users with initial role assignment.
 */

'use client';

import { useState } from 'react';
import { Mail, Shield, Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Types from MODULE-0B
import type { UserRole } from '../../MODULE-0B/types/rbac.types';
import { getRoleDisplayName, getRoleDescription } from '../../MODULE-0B/types/rbac.types';

// Hook for invitation mutation
import { useInviteUser } from '../hooks/use-team-data';

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AVAILABLE_ROLES: UserRole[] = ['Admin', 'Manager', 'Viewer', 'Procurement'];

/**
 * Invite User Dialog Component
 *
 * Features:
 * - Email input with validation
 * - Role selection dropdown
 * - Optional notes/message field
 * - Send invitation via Supabase Auth
 */
export function InviteUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: InviteUserDialogProps) {
  // Form state
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Viewer');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Mutation hook (SKELETON)
  const { mutate: inviteUser, isPending } = useInviteUser();

  // Email validation
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // SKELETON: Mock API call
    inviteUser(
      {
        email,
        role,
        notes,
      },
      {
        onSuccess: () => {
          // Reset form
          setEmail('');
          setRole('Viewer');
          setNotes('');
          setError(null);

          // Close dialog
          onOpenChange(false);

          // Trigger parent refresh
          onSuccess?.();
        },
        onError: (error: any) => {
          setError(error.message || 'Failed to send invitation');
        },
      }
    );
  };

  // Handle dialog close
  const handleClose = () => {
    if (isPending) return; // Don't close while sending

    // Reset form
    setEmail('');
    setRole('Viewer');
    setNotes('');
    setError(null);

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite New User
          </DialogTitle>
          <DialogDescription>
            Send an invitation email to a new team member. They'll receive a link to create their account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                required
              />
              <p className="text-xs text-muted-foreground">
                User will receive an invitation email at this address
              </p>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role">
                Initial Role <span className="text-destructive">*</span>
              </Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)} disabled={isPending}>
                <SelectTrigger id="role">
                  <Shield className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ROLES.map((roleOption) => (
                    <SelectItem key={roleOption} value={roleOption}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{getRoleDisplayName(roleOption)}</span>
                        <span className="text-xs text-muted-foreground">
                          {getRoleDescription(roleOption)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                You can change this role later from the team management page
              </p>
            </div>

            {/* Notes/Message (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="notes">
                Personal Message <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="notes"
                placeholder="Add a welcome message or instructions for the new user..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isPending}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This message will be included in the invitation email
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
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
            <Button type="submit" disabled={isPending || !email || !isValidEmail(email)}>
              {isPending ? (
                <>
                  <Send className="h-4 w-4 mr-2 animate-pulse" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * INTEGRATION NOTES:
 *
 * 1. Supabase Auth Integration:
 *    - Uses Supabase Auth's admin invite function
 *    - Requires service role key (server-side only)
 *    - Real implementation in api/team-routes.ts
 *
 *    Example API call:
 *    ```typescript
 *    // POST /api/team/invite
 *    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
 *      data: { role, notes }
 *    });
 *    ```
 *
 * 2. Email Template:
 *    - Configure in Supabase Dashboard → Authentication → Email Templates
 *    - Customize invitation email with company branding
 *    - Include role information in template variables
 *
 * 3. Validation:
 *    - Client-side: Email format validation
 *    - Server-side: Check if email already exists
 *    - Server-side: Verify inviter is Admin
 *
 * 4. Role Assignment:
 *    - Role is assigned when user accepts invitation
 *    - Handled by Supabase Auth trigger function
 *    - See MODULE-0B for user_roles table structure
 *
 * 5. Error Handling:
 *    - Email already exists
 *    - Invalid email format
 *    - Supabase API errors
 *    - Permission denied (non-admin)
 *
 * DEPENDENCIES:
 * - MODULE-0B: UserRole type, role helpers
 * - Supabase Auth (admin API)
 * - useInviteUser hook (React Query mutation)
 * - shadcn/ui components: Dialog, Input, Select, Textarea, Alert
 *
 * TODO (Full Implementation):
 * - Add multiple email input (invite multiple users at once)
 * - Add email template preview
 * - Add invitation expiration settings
 * - Add resend invitation functionality
 * - Add invitation history/audit log
 * - Add bulk invite via CSV upload
 * - Add domain restriction (only allow certain email domains)
 */
