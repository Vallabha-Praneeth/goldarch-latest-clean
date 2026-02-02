'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, Trash2, Loader2, AlertTriangle, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Breadcrumbs } from '@/components/cross-section/Breadcrumbs';

interface AccessRule {
  id: string;
  user_id: string;
  rule_data?: {
    categories?: string[];
    regions?: string[];
  };
  category_id?: string | null;
  region?: string | null;
  notes?: string | null;
  created_at: string;
  created_by: string;
  assigned_user?: {
    id: string;
    email: string;
  };
}

interface OrgMember {
  user_id: string;
  role: string;
  users?: {
    id: string;
    email: string;
  };
}

interface Category {
  id: string;
  name: string;
}

export default function SupplierAccessPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    user_id: '',
    categories: [] as string[],
    regions: [] as string[],
    notes: '',
  });

  // Fetch access rules
  const {
    data: rulesData,
    isLoading: rulesLoading,
    isError: rulesError,
    error: rulesErrorObj,
    refetch: refetchRules,
  } = useQuery({
    queryKey: ['supplier-access-rules'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/access-rules');
      if (!response.ok) throw new Error('Failed to fetch access rules');
      const data = await response.json();
      return data;
    },
  });

  // Fetch organization members
  const { data: membersData } = useQuery({
    queryKey: ['org-members'],
    queryFn: async () => {
      const response = await fetch('/api/organizations/members');
      if (!response.ok) throw new Error('Failed to fetch members');
      const data = await response.json();
      return data.data || [];
    },
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { createClient } = await import('@/lib/supabase-client');
      const supabase = createClient();
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      return data || [];
    },
  });

  // Create access rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/suppliers/access-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: data.user_id,
          rule_data: {
            categories: data.categories.length > 0 ? data.categories : undefined,
            regions: data.regions.length > 0 ? data.regions : undefined,
          },
          notes: data.notes || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create access rule');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Access rule created successfully');
      queryClient.invalidateQueries({ queryKey: ['supplier-access-rules'] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create access rule');
    },
  });

  // Delete access rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const response = await fetch(`/api/suppliers/access-rules/${ruleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete access rule');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Access rule deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['supplier-access-rules'] });
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete access rule');
    },
  });

  const resetForm = () => {
    setFormData({
      user_id: '',
      categories: [],
      regions: [],
      notes: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.user_id) {
      toast.error('Please select a user');
      return;
    }

    if (formData.categories.length === 0 && formData.regions.length === 0) {
      toast.error('Please select at least one category or region');
      return;
    }

    createRuleMutation.mutate(formData);
  };

  const handleDelete = (ruleId: string) => {
    setRuleToDelete(ruleId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (ruleToDelete) {
      deleteRuleMutation.mutate(ruleToDelete);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  const toggleRegion = (region: string) => {
    setFormData(prev => ({
      ...prev,
      regions: prev.regions.includes(region)
        ? prev.regions.filter(r => r !== region)
        : [...prev.regions, region],
    }));
  };

  const rules: AccessRule[] = rulesData?.data || [];
  const isAdmin = rulesData?.isAdmin || false;

  // Handle error state
  if (rulesError) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle>Error Loading Access Rules</CardTitle>
            </div>
            <CardDescription>
              Failed to load access rules: {(rulesErrorObj as Error)?.message || 'Unknown error'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetchRules()} variant="outline">
              <Loader2 className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin && !rulesLoading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle>Access Denied</CardTitle>
            </div>
            <CardDescription>
              Only administrators can manage supplier access rules.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const regionOptions = [
    { value: 'north', label: 'North' },
    { value: 'south', label: 'South' },
    { value: 'east', label: 'East' },
    { value: 'west', label: 'West' },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Supplier Access Control
          </h1>
          <p className="text-muted-foreground">
            Manage user access to suppliers by category and region
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Access Rule
        </Button>
      </div>

      {/* Create Access Rule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Access Rule</DialogTitle>
            <DialogDescription>
              Assign supplier access permissions to a user
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Selection */}
            <div className="space-y-2">
              <Label htmlFor="user">User *</Label>
              <Select
                value={formData.user_id}
                onValueChange={(value) => setFormData({ ...formData, user_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {(membersData || []).map((member: OrgMember) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.users?.email || member.user_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <Label>Categories (select one or more)</Label>
              <div className="grid grid-cols-2 gap-2">
                {(categories || []).map((cat: Category) => (
                  <Button
                    key={cat.id}
                    type="button"
                    variant={formData.categories.includes(cat.id) ? 'default' : 'outline'}
                    onClick={() => toggleCategory(cat.id)}
                    className="justify-start"
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
              {formData.categories.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Leave empty to grant access to all categories
                </p>
              )}
            </div>

            {/* Regions */}
            <div className="space-y-2">
              <Label>Regions (select one or more)</Label>
              <div className="grid grid-cols-2 gap-2">
                {regionOptions.map((region) => (
                  <Button
                    key={region.value}
                    type="button"
                    variant={formData.regions.includes(region.value) ? 'default' : 'outline'}
                    onClick={() => toggleRegion(region.value)}
                    className="justify-start"
                  >
                    {region.label}
                  </Button>
                ))}
              </div>
              {formData.regions.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Leave empty to grant access to all regions
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes about this access rule..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createRuleMutation.isPending}
              >
                {createRuleMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Rule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Access Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this access rule? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteRuleMutation.isPending}
            >
              {deleteRuleMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Rules List */}
      {rulesLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Loading access rules...</p>
            </div>
          </CardContent>
        </Card>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No access rules configured yet</p>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(true)}
                className="mt-4"
              >
                Create your first rule
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-base">
                      {rule.assigned_user?.email || 'Unknown User'}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Created {new Date(rule.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(rule.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Categories */}
                {rule.rule_data?.categories && rule.rule_data.categories.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Categories:</p>
                    <div className="flex flex-wrap gap-2">
                      {rule.rule_data.categories.map((catId) => {
                        const category = categories?.find((c: Category) => c.id === catId);
                        return (
                          <Badge key={catId} variant="secondary">
                            {category?.name || catId}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Regions */}
                {rule.rule_data?.regions && rule.rule_data.regions.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Regions:</p>
                    <div className="flex flex-wrap gap-2">
                      {rule.rule_data.regions.map((region) => (
                        <Badge key={region} variant="secondary">
                          {regionOptions.find(r => r.value === region)?.label || region}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Legacy fields (for backward compatibility) */}
                {rule.category_id && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Category (legacy):</p>
                    <Badge variant="outline">{rule.category_id}</Badge>
                  </div>
                )}
                {rule.region && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Region (legacy):</p>
                    <Badge variant="outline">{rule.region}</Badge>
                  </div>
                )}

                {/* Notes */}
                {rule.notes && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Notes:</p>
                    <p className="text-sm text-muted-foreground">{rule.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
