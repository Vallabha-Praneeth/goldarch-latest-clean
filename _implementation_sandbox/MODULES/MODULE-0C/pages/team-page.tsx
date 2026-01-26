/**
 * MODULE-0C: Team Management UI
 * File: pages/team-page.tsx
 *
 * Purpose: Main team management page - view users, assign roles, manage access
 * Status: SKELETON - Structure complete, logic placeholder
 *
 * This page provides a complete UI for managing users and their roles.
 * Based on app-dashboard/suppliers/page.tsx template.
 */

'use client';

import { useState } from 'react';
import { Plus, UserCog, Shield, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Module-specific components (created in this module)
import { UserListTable } from '../components/user-list-table';
import { InviteUserDialog } from '../components/invite-user-dialog';
import { EditRoleDialog } from '../components/edit-role-dialog';
import { SupplierAccessDialog } from '../components/supplier-access-dialog';

// Hooks from this module
import { useTeamData, useUserRoles, useSupplierAccessRules } from '../hooks/use-team-data';

// Types from MODULE-0B
import type { UserRole, UserWithRole, SupplierAccessRule } from '../../MODULE-0B/types/rbac.types';

/**
 * Team Management Page Component
 *
 * Features:
 * - View all users and their roles
 * - Invite new users
 * - Assign/change user roles
 * - Manage supplier access rules (per user)
 * - Filter by role
 * - Search by email/name
 */
export default function TeamPage() {
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false);
  const [supplierAccessDialogOpen, setSupplierAccessDialogOpen] = useState(false);

  // Data fetching (SKELETON - uses mock data)
  const {
    users,
    isLoading,
    error,
    refetch
  } = useTeamData({
    search: searchQuery,
    roleFilter: roleFilter === 'all' ? undefined : roleFilter
  });

  // Role statistics (SKELETON - calculated from mock data)
  const roleStats = {
    total: users?.length || 0,
    admins: users?.filter(u => u.role === 'Admin').length || 0,
    managers: users?.filter(u => u.role === 'Manager').length || 0,
    viewers: users?.filter(u => u.role === 'Viewer').length || 0,
    procurement: users?.filter(u => u.role === 'Procurement').length || 0,
  };

  // Handlers
  const handleInviteUser = () => {
    setInviteDialogOpen(true);
  };

  const handleEditRole = (userId: string) => {
    setSelectedUserId(userId);
    setEditRoleDialogOpen(true);
  };

  const handleManageAccess = (userId: string) => {
    setSelectedUserId(userId);
    setSupplierAccessDialogOpen(true);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value as UserRole | 'all');
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage users, assign roles, and control access permissions
          </p>
        </div>
        <Button onClick={handleInviteUser} className="gap-2">
          <Plus className="h-4 w-4" />
          Invite User
        </Button>
      </div>

      {/* Role Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.admins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Managers</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.managers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viewers</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.viewers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procurement</CardTitle>
            <Shield className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.procurement}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Viewer">Viewer</SelectItem>
                <SelectItem value="Procurement">Procurement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {roleStats.total} total users
            {roleFilter !== 'all' && ` • Filtered by: ${roleFilter}`}
            {searchQuery && ` • Search: "${searchQuery}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserListTable
            users={users || []}
            isLoading={isLoading}
            onEditRole={handleEditRole}
            onManageAccess={handleManageAccess}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={refetch}
      />

      <EditRoleDialog
        open={editRoleDialogOpen}
        onOpenChange={setEditRoleDialogOpen}
        userId={selectedUserId}
        onSuccess={refetch}
      />

      <SupplierAccessDialog
        open={supplierAccessDialogOpen}
        onOpenChange={setSupplierAccessDialogOpen}
        userId={selectedUserId}
        onSuccess={refetch}
      />
    </div>
  );
}

/**
 * INTEGRATION NOTES:
 *
 * 1. Authentication Required:
 *    - This page must be wrapped with withPageAuth() from MODULE-0A
 *    - Only Admins can access this page
 *
 *    Example (in app/app-dashboard/team/page.tsx):
 *    ```typescript
 *    import { withPageAuth } from '@/_implementation_sandbox/MODULES/MODULE-0A/middleware/page-auth';
 *    import TeamPage from '@/_implementation_sandbox/MODULES/MODULE-0C/pages/team-page';
 *
 *    export default withPageAuth(TeamPage, {
 *      requiredRole: 'Admin',
 *      redirectTo: '/app-dashboard'
 *    });
 *    ```
 *
 * 2. Layout:
 *    - Uses existing app-dashboard layout (sidebar, header already in place)
 *    - Follows same visual style as suppliers/quotes pages
 *
 * 3. Data Flow:
 *    - useTeamData hook fetches users from API
 *    - API routes defined in api/team-routes.ts
 *    - Data cached with React Query
 *
 * 4. Permissions:
 *    - Only Admins can invite users
 *    - Only Admins can change roles
 *    - Only Admins can manage supplier access rules
 *
 * 5. Real-time Updates:
 *    - All mutations trigger refetch
 *    - React Query handles cache invalidation
 *
 * DEPENDENCIES:
 * - MODULE-0A: withPageAuth wrapper
 * - MODULE-0B: User roles and supplier access rules tables
 * - shadcn/ui components (already installed)
 * - React Query (already installed)
 *
 * TODO (Full Implementation):
 * - Replace mock data with real Supabase queries
 * - Add optimistic updates for better UX
 * - Add toast notifications for success/error states
 * - Add confirmation dialogs for destructive actions
 * - Add pagination for large user lists
 * - Add export users functionality
 * - Add bulk role assignment
 * - Add user activity log
 */
