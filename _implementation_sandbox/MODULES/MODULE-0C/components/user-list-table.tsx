/**
 * MODULE-0C: Team Management UI
 * File: components/user-list-table.tsx
 *
 * Purpose: Table displaying all users with their roles and actions
 * Status: SKELETON - Structure complete, logic placeholder
 *
 * Displays users in a sortable, filterable table with action buttons.
 */

'use client';

import { useState } from 'react';
import {
  MoreHorizontal,
  Shield,
  UserCog,
  Mail,
  Calendar,
  Trash2,
  Key,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Types from MODULE-0B
import type { UserWithRole, UserRole } from '../../MODULE-0B/types/rbac.types';
import { getRoleDisplayName } from '../../MODULE-0B/types/rbac.types';

interface UserListTableProps {
  users: UserWithRole[];
  isLoading?: boolean;
  onEditRole: (userId: string) => void;
  onManageAccess: (userId: string) => void;
  onDeleteUser?: (userId: string) => void;
}

/**
 * Role badge with color coding
 */
function RoleBadge({ role }: { role: UserRole | null }) {
  if (!role) {
    return <Badge variant="outline">No Role</Badge>;
  }

  const colors: Record<UserRole, string> = {
    Admin: 'bg-red-100 text-red-800 hover:bg-red-100',
    Manager: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    Viewer: 'bg-green-100 text-green-800 hover:bg-green-100',
    Procurement: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  };

  return (
    <Badge className={colors[role]}>
      <Shield className="h-3 w-3 mr-1" />
      {getRoleDisplayName(role)}
    </Badge>
  );
}

/**
 * Format date for display
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch {
    return 'Invalid date';
  }
}

/**
 * User List Table Component
 *
 * Features:
 * - Sortable columns
 * - Role badge with color coding
 * - Action menu per user
 * - Loading skeleton state
 */
export function UserListTable({
  users,
  isLoading = false,
  onEditRole,
  onManageAccess,
  onDeleteUser,
}: UserListTableProps) {
  const [sortColumn, setSortColumn] = useState<keyof UserWithRole>('email');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Handle column header click for sorting
  const handleSort = (column: keyof UserWithRole) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort users (SKELETON - basic implementation)
  const sortedUsers = [...users].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (aValue === null) return 1;
    if (bValue === null) return -1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return 0;
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  // Empty state
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <UserCog className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-1">No users found</h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your search or filter criteria
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('email')}
            >
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('role')}
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Role
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                Assigned By
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('role_assigned_at')}
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Assigned Date
              </div>
            </TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedUsers.map((user) => (
            <TableRow key={user.id}>
              {/* Email */}
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>{user.email}</span>
                  <span className="text-xs text-muted-foreground">
                    ID: {user.id.slice(0, 8)}...
                  </span>
                </div>
              </TableCell>

              {/* Role Badge */}
              <TableCell>
                <RoleBadge role={user.role} />
              </TableCell>

              {/* Assigned By */}
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {user.role_assigned_by
                    ? `User ${user.role_assigned_by.slice(0, 8)}...`
                    : 'System'}
                </span>
              </TableCell>

              {/* Assigned Date */}
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatDate(user.role_assigned_at)}
                </span>
              </TableCell>

              {/* Actions Menu */}
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => onEditRole(user.id)}>
                      <Shield className="mr-2 h-4 w-4" />
                      Change Role
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => onManageAccess(user.id)}>
                      <Key className="mr-2 h-4 w-4" />
                      Manage Access
                    </DropdownMenuItem>

                    {onDeleteUser && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDeleteUser(user.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove User
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * INTEGRATION NOTES:
 *
 * 1. Data Source:
 *    - Receives users array from parent (team-page.tsx)
 *    - Users fetched via useTeamData hook
 *
 * 2. User Actions:
 *    - Edit Role: Opens EditRoleDialog
 *    - Manage Access: Opens SupplierAccessDialog
 *    - Delete User: Optional, only Admins
 *
 * 3. Sorting:
 *    - Click column header to sort
 *    - Toggle asc/desc on repeated clicks
 *    - SKELETON: Basic sorting, needs enhancement
 *
 * 4. Empty States:
 *    - Shows friendly message when no users match filter
 *    - Loading skeleton while fetching data
 *
 * 5. Visual Design:
 *    - Role badges color-coded by role type
 *    - Follows shadcn/ui table component patterns
 *    - Responsive design
 *
 * DEPENDENCIES:
 * - MODULE-0B: UserWithRole type, getRoleDisplayName helper
 * - shadcn/ui components: Table, Badge, DropdownMenu, Skeleton, Button
 *
 * TODO (Full Implementation):
 * - Add advanced sorting (multi-column)
 * - Add column visibility toggles
 * - Add row selection for bulk actions
 * - Add pagination controls
 * - Add row expansion for more details
 * - Add copy email to clipboard
 * - Add user profile link
 * - Highlight current user row
 */
