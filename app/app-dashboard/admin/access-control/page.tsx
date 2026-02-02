'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Plus, MoreVertical, ArrowLeft, Users, UserCog, Info } from 'lucide-react';
import { Breadcrumbs } from '@/components/cross-section/Breadcrumbs';
import { Alert, AlertDescription } from '@/components/ui/alert';

type ViewMode = 'home' | 'role-detail' | 'user-access';
type UserStatus = 'active' | 'invited' | 'disabled';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: UserStatus;
}

interface Role {
  id: string;
  name: string;
  permissions: {
    suppliers: { view: boolean; create: boolean; edit: boolean; delete: boolean };
    quotes: { view: boolean; create: boolean; approve: boolean };
    documents: { view: boolean; upload: boolean };
    projects: { view: boolean; edit: boolean };
  };
  dataScope: {
    categories: string[];
    regions: string[];
  };
}

const mockUsers: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Manager', status: 'active' },
  { id: '3', name: 'Bob Wilson', email: 'bob@example.com', role: 'Viewer', status: 'invited' },
  { id: '4', name: 'Alice Brown', email: 'alice@example.com', role: 'Editor', status: 'active' },
];

const mockRoles: Role[] = [
  {
    id: '1',
    name: 'Admin',
    permissions: {
      suppliers: { view: true, create: true, edit: true, delete: true },
      quotes: { view: true, create: true, approve: true },
      documents: { view: true, upload: true },
      projects: { view: true, edit: true },
    },
    dataScope: { categories: [], regions: [] },
  },
  {
    id: '2',
    name: 'Manager',
    permissions: {
      suppliers: { view: true, create: true, edit: true, delete: false },
      quotes: { view: true, create: true, approve: true },
      documents: { view: true, upload: true },
      projects: { view: true, edit: true },
    },
    dataScope: { categories: ['Kitchen', 'Electrical'], regions: ['North', 'South'] },
  },
  {
    id: '3',
    name: 'Viewer',
    permissions: {
      suppliers: { view: true, create: false, edit: false, delete: false },
      quotes: { view: true, create: false, approve: false },
      documents: { view: true, upload: false },
      projects: { view: true, edit: false },
    },
    dataScope: { categories: ['Kitchen'], regions: ['North'] },
  },
];

const availableCategories = ['Kitchen', 'Bathroom', 'Electrical', 'Plumbing', 'Flooring', 'Painting'];
const availableRegions = ['North', 'South', 'East', 'West'];

export default function AccessControlPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Role editor state
  const [roleData, setRoleData] = useState<Role>({
    id: '',
    name: '',
    permissions: {
      suppliers: { view: false, create: false, edit: false, delete: false },
      quotes: { view: false, create: false, approve: false },
      documents: { view: false, upload: false },
      projects: { view: false, edit: false },
    },
    dataScope: { categories: [], regions: [] },
  });

  const handleEditRole = (role: Role) => {
    setRoleData(role);
    setSelectedRole(role);
    setViewMode('role-detail');
  };

  const handleCreateRole = () => {
    setRoleData({
      id: '',
      name: '',
      permissions: {
        suppliers: { view: false, create: false, edit: false, delete: false },
        quotes: { view: false, create: false, approve: false },
        documents: { view: false, upload: false },
        projects: { view: false, edit: false },
      },
      dataScope: { categories: [], regions: [] },
    });
    setViewMode('role-detail');
  };

  const handleEditUserAccess = (user: User) => {
    setSelectedUser(user);
    setViewMode('user-access');
  };

  const handleSaveRole = () => {
    console.log('Saving role:', roleData);
    setViewMode('home');
  };

  const toggleCategory = (category: string) => {
    const categories = roleData.dataScope.categories.includes(category)
      ? roleData.dataScope.categories.filter((c) => c !== category)
      : [...roleData.dataScope.categories, category];
    setRoleData({
      ...roleData,
      dataScope: { ...roleData.dataScope, categories },
    });
  };

  const toggleRegion = (region: string) => {
    const regions = roleData.dataScope.regions.includes(region)
      ? roleData.dataScope.regions.filter((r) => r !== region)
      : [...roleData.dataScope.regions, region];
    setRoleData({
      ...roleData,
      dataScope: { ...roleData.dataScope, regions },
    });
  };

  // Home View
  const renderHomeView = () => (
    <div className="space-y-6">
      <Breadcrumbs />

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Admin Access Control:</strong> Manage user permissions and data access restrictions.
          Assign roles to control what users can view and edit across the system.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Access Control
          </h1>
          <p className="text-muted-foreground">Manage user permissions and roles</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'users' | 'roles')}>
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Invite User
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.status === 'active'
                              ? 'default'
                              : user.status === 'invited'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditUserAccess(user)}>
                              <UserCog className="h-4 w-4 mr-2" />
                              Edit Access
                            </DropdownMenuItem>
                            <DropdownMenuItem>Resend Invite</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Disable User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleCreateRole} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Role
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockRoles.map((role) => (
              <Card key={role.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {Object.values(role.permissions).reduce(
                          (acc, perms) => acc + Object.values(perms).filter(Boolean).length,
                          0
                        )}{' '}
                        permissions
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditRole(role)}>
                          Edit Role
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Delete Role
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {role.dataScope.categories.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Categories:</p>
                        <div className="flex flex-wrap gap-1">
                          {role.dataScope.categories.map((cat) => (
                            <Badge key={cat} variant="outline" className="text-xs">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {role.dataScope.regions.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Regions:</p>
                        <div className="flex flex-wrap gap-1">
                          {role.dataScope.regions.map((region) => (
                            <Badge key={region} variant="outline" className="text-xs">
                              {region}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  // Role Detail/Edit View
  const renderRoleDetailView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setViewMode('home')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {roleData.id ? 'Edit Role' : 'Create Role'}
          </h1>
          <p className="text-muted-foreground">Configure permissions and data access</p>
        </div>
        <Button onClick={handleSaveRole}>Save Role</Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Role Name */}
          <Card>
            <CardHeader>
              <CardTitle>Role Name</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={roleData.name}
                onChange={(e) => setRoleData({ ...roleData, name: e.target.value })}
                placeholder="Enter role name"
              />
            </CardContent>
          </Card>

          {/* Permissions Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>Control what actions this role can perform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Suppliers */}
                <div>
                  <h4 className="font-medium mb-3">Suppliers</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="suppliers-view"
                        checked={roleData.permissions.suppliers.view}
                        onCheckedChange={(checked) =>
                          setRoleData({
                            ...roleData,
                            permissions: {
                              ...roleData.permissions,
                              suppliers: { ...roleData.permissions.suppliers, view: !!checked },
                            },
                          })
                        }
                      />
                      <Label htmlFor="suppliers-view">View</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="suppliers-create"
                        checked={roleData.permissions.suppliers.create}
                        onCheckedChange={(checked) =>
                          setRoleData({
                            ...roleData,
                            permissions: {
                              ...roleData.permissions,
                              suppliers: { ...roleData.permissions.suppliers, create: !!checked },
                            },
                          })
                        }
                      />
                      <Label htmlFor="suppliers-create">Create</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="suppliers-edit"
                        checked={roleData.permissions.suppliers.edit}
                        onCheckedChange={(checked) =>
                          setRoleData({
                            ...roleData,
                            permissions: {
                              ...roleData.permissions,
                              suppliers: { ...roleData.permissions.suppliers, edit: !!checked },
                            },
                          })
                        }
                      />
                      <Label htmlFor="suppliers-edit">Edit</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="suppliers-delete"
                        checked={roleData.permissions.suppliers.delete}
                        onCheckedChange={(checked) =>
                          setRoleData({
                            ...roleData,
                            permissions: {
                              ...roleData.permissions,
                              suppliers: { ...roleData.permissions.suppliers, delete: !!checked },
                            },
                          })
                        }
                      />
                      <Label htmlFor="suppliers-delete">Delete</Label>
                    </div>
                  </div>
                </div>

                {/* Quotes */}
                <div>
                  <h4 className="font-medium mb-3">Quotes</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="quotes-view"
                        checked={roleData.permissions.quotes.view}
                        onCheckedChange={(checked) =>
                          setRoleData({
                            ...roleData,
                            permissions: {
                              ...roleData.permissions,
                              quotes: { ...roleData.permissions.quotes, view: !!checked },
                            },
                          })
                        }
                      />
                      <Label htmlFor="quotes-view">View</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="quotes-create"
                        checked={roleData.permissions.quotes.create}
                        onCheckedChange={(checked) =>
                          setRoleData({
                            ...roleData,
                            permissions: {
                              ...roleData.permissions,
                              quotes: { ...roleData.permissions.quotes, create: !!checked },
                            },
                          })
                        }
                      />
                      <Label htmlFor="quotes-create">Create</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="quotes-approve"
                        checked={roleData.permissions.quotes.approve}
                        onCheckedChange={(checked) =>
                          setRoleData({
                            ...roleData,
                            permissions: {
                              ...roleData.permissions,
                              quotes: { ...roleData.permissions.quotes, approve: !!checked },
                            },
                          })
                        }
                      />
                      <Label htmlFor="quotes-approve">Approve</Label>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h4 className="font-medium mb-3">Documents</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="documents-view"
                        checked={roleData.permissions.documents.view}
                        onCheckedChange={(checked) =>
                          setRoleData({
                            ...roleData,
                            permissions: {
                              ...roleData.permissions,
                              documents: { ...roleData.permissions.documents, view: !!checked },
                            },
                          })
                        }
                      />
                      <Label htmlFor="documents-view">View</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="documents-upload"
                        checked={roleData.permissions.documents.upload}
                        onCheckedChange={(checked) =>
                          setRoleData({
                            ...roleData,
                            permissions: {
                              ...roleData.permissions,
                              documents: { ...roleData.permissions.documents, upload: !!checked },
                            },
                          })
                        }
                      />
                      <Label htmlFor="documents-upload">Upload</Label>
                    </div>
                  </div>
                </div>

                {/* Projects */}
                <div>
                  <h4 className="font-medium mb-3">Projects</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="projects-view"
                        checked={roleData.permissions.projects.view}
                        onCheckedChange={(checked) =>
                          setRoleData({
                            ...roleData,
                            permissions: {
                              ...roleData.permissions,
                              projects: { ...roleData.permissions.projects, view: !!checked },
                            },
                          })
                        }
                      />
                      <Label htmlFor="projects-view">View</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="projects-edit"
                        checked={roleData.permissions.projects.edit}
                        onCheckedChange={(checked) =>
                          setRoleData({
                            ...roleData,
                            permissions: {
                              ...roleData.permissions,
                              projects: { ...roleData.permissions.projects, edit: !!checked },
                            },
                          })
                        }
                      />
                      <Label htmlFor="projects-edit">Edit</Label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Scope */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Scope</CardTitle>
              <CardDescription>Restrict access to specific categories and regions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Categories</Label>
                <div className="grid grid-cols-1 gap-2">
                  {availableCategories.map((cat) => (
                    <Button
                      key={cat}
                      type="button"
                      variant={roleData.dataScope.categories.includes(cat) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleCategory(cat)}
                      className="justify-start"
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty for unrestricted access
                </p>
              </div>

              <div className="space-y-2">
                <Label>Regions</Label>
                <div className="grid grid-cols-1 gap-2">
                  {availableRegions.map((region) => (
                    <Button
                      key={region}
                      type="button"
                      variant={roleData.dataScope.regions.includes(region) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleRegion(region)}
                      className="justify-start"
                    >
                      {region}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty for unrestricted access
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  // User Access Assignment View
  const renderUserAccessView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setViewMode('home')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">User Access</h1>
          <p className="text-muted-foreground">Assign role and configure access for {selectedUser?.name}</p>
        </div>
        <Button>Save Changes</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Name</Label>
              <p className="font-medium">{selectedUser?.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium">{selectedUser?.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Current Role</Label>
              <p className="font-medium">{selectedUser?.role}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <Badge variant="default">{selectedUser?.status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Assignment</CardTitle>
          <CardDescription>Select a role for this user</CardDescription>
        </CardHeader>
        <CardContent>
          <Select defaultValue={selectedUser?.role}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mockRoles.map((role) => (
                <SelectItem key={role.id} value={role.name}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Access Restrictions (Optional)</CardTitle>
          <CardDescription>
            Override default role restrictions for this specific user
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Restrict Categories</Label>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((cat) => (
                <Badge key={cat} variant="outline">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Restrict Regions</Label>
            <div className="flex flex-wrap gap-2">
              {availableRegions.map((region) => (
                <Badge key={region} variant="outline">
                  {region}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div>
      {viewMode === 'home' && renderHomeView()}
      {viewMode === 'role-detail' && renderRoleDetailView()}
      {viewMode === 'user-access' && renderUserAccessView()}
    </div>
  );
}
