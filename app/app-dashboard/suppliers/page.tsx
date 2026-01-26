'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Plus, MapPin, Phone, Mail, Loader2, Upload } from 'lucide-react';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-provider';
import { QuickActions } from '@/components/cross-section/QuickActions';
import { Breadcrumbs } from '@/components/cross-section/Breadcrumbs';

// MODULE-1A: Supplier Filtering Integration
import {
  useFilteredSuppliers,
  useSupplierAccessSummary,
  useIsFiltered,
  useActiveAccessRules,
} from '@/lib/hooks/use-supplier-filtering';
import {
  SupplierFilterIndicator,
  NoAccessIndicator,
} from '@/components/supplier-filter-indicator-simple';

// MODULE-1B: Enhanced Search & Filters Integration
import { SearchBar } from '@/components/search-bar';
import { FilterPanel, type FilterField, type FilterValues, ActiveFilterBadges } from '@/components/filter-panel';
import { SimpleSortDropdown, type SortState, type SortOption } from '@/components/sort-dropdown';
import { useSearchFilters } from '@/lib/hooks/use-search-filters';

export default function SuppliersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [catalogFile, setCatalogFile] = useState<File | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    city: '',
    address: '',
    category_id: '',
    products: '',
    contact_person: '',
  });

  // Fetch categories for filter options
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      return data || [];
    },
  });

  // MODULE-1B: Enhanced Search & Filters
  const searchFilters = useSearchFilters({
    initialFilters: {
      category_id: null,
      region: null,
    },
    initialSort: {
      field: 'name',
      direction: 'asc',
    },
    syncWithUrl: true, // Enable URL sync for shareable filtered views
  });

  // Map search/filter/sort state to SupplierFilterParams for MODULE-1A
  const filterParams = useMemo(() => {
    return {
      search: searchFilters.query,
      categoryId: (searchFilters.filters.category_id as string) || undefined,
      region: (searchFilters.filters.region as string) || undefined,
      sortBy: searchFilters.sort.field as 'name' | 'created_at' | 'city' | undefined,
      sortOrder: searchFilters.sort.direction,
    };
  }, [searchFilters.query, searchFilters.filters, searchFilters.sort]);

  // MODULE-1A: Use filtered suppliers with MODULE-1B params
  const { data: supplierData, isLoading } = useFilteredSuppliers(filterParams);

  // MODULE-1A: Get filter status
  const isFiltered = useIsFiltered();
  const accessRules = useActiveAccessRules();
  const { data: accessSummary } = useSupplierAccessSummary();

  // Extract suppliers from filtered result
  const suppliers = supplierData?.suppliers || [];

  // MODULE-1B: Filter configuration
  const filterFields: FilterField[] = useMemo(() => {
    const fields: FilterField[] = [];

    // Category filter
    if (categories && categories.length > 0) {
      fields.push({
        id: 'category_id',
        label: 'Category',
        type: 'select',
        options: categories.map((cat) => ({
          label: cat.name,
          value: cat.id,
        })),
        placeholder: 'All categories',
      });
    }

    // Region filter (if you have region data)
    fields.push({
      id: 'region',
      label: 'Region',
      type: 'select',
      options: [
        { label: 'North', value: 'north' },
        { label: 'South', value: 'south' },
        { label: 'East', value: 'east' },
        { label: 'West', value: 'west' },
      ],
      placeholder: 'All regions',
    });

    return fields;
  }, [categories]);

  // MODULE-1B: Sort configuration
  const sortOptions: SortOption[] = [
    { value: 'name', label: 'Name', defaultDirection: 'asc' },
    { value: 'created_at', label: 'Date Added', defaultDirection: 'desc' },
    { value: 'city', label: 'City', defaultDirection: 'asc' },
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      website: '',
      city: '',
      address: '',
      category_id: '',
      products: '',
      contact_person: '',
    });
    setCatalogFile(null);
  };

  const validateUrl = (url: string) => {
    if (!url) return true;
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Company name is required');
      return;
    }
    if (!formData.category_id) {
      toast.error('Category is required');
      return;
    }
    if (formData.website && !validateUrl(formData.website)) {
      toast.error('Please enter a valid website URL');
      return;
    }

    setLoading(true);

    try {
      let catalog_url = null;
      let catalog_title = null;

      // Upload catalog file if provided
      if (catalogFile) {
        const fileExt = catalogFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `catalogs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('supplier-files')
          .upload(filePath, catalogFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error('Catalog upload failed, but supplier will be created');
        } else {
          const { data: urlData } = supabase.storage
            .from('supplier-files')
            .getPublicUrl(filePath);
          catalog_url = urlData.publicUrl;
          catalog_title = catalogFile.name;
        }
      }

      const { error } = await supabase.from('suppliers').insert({
        ...formData,
        category_id: formData.category_id || null,
        catalog_url,
        catalog_title,
        user_id: user?.id || null,
      });

      if (error) throw error;

      toast.success('Supplier created successfully');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-suppliers'] });
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create supplier');
    } finally {
      setLoading(false);
    }
  };

  // MODULE-1A: Show no access indicator if user has no access
  if (!isLoading && accessSummary && !accessSummary.isAdmin && accessSummary.totalAccessible === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-8 w-8" />
              Suppliers
            </h1>
            <p className="text-muted-foreground">Manage your supplier network</p>
          </div>
        </div>
        <NoAccessIndicator />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8" />
            Suppliers
          </h1>
          <p className="text-muted-foreground">Manage your supplier network</p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      {/* MODULE-1A: Show filter indicator if view is filtered */}
      {isFiltered && supplierData && (
        <SupplierFilterIndicator
          accessRules={accessRules}
          totalCount={supplierData.total}
          showDetails={false}
        />
      )}

      {/* Add Supplier Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Supplier</DialogTitle>
            <DialogDescription>
              Add a new supplier to your directory
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter company name"
                  required
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="Contact name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Contact Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="www.company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="products">Products/Services</Label>
                <Textarea
                  id="products"
                  value={formData.products}
                  onChange={(e) => setFormData({ ...formData, products: e.target.value })}
                  placeholder="Describe the products or services offered"
                  rows={3}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="catalog">Catalog (optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="catalog"
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => setCatalogFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  {catalogFile && (
                    <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                      {catalogFile.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  PDF, Word, or Excel files accepted
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Supplier
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODULE-1B: Enhanced Search & Filters */}
      <div className="flex flex-col gap-4">
        {/* Search + Filters + Sort Row */}
        <div className="flex items-center gap-3">
          <SearchBar
            value={searchFilters.query}
            onChange={searchFilters.setQuery}
            placeholder="Search suppliers..."
            className="flex-1"
          />

          <FilterPanel
            fields={filterFields}
            values={searchFilters.filters}
            onApply={searchFilters.setFilters}
            onReset={searchFilters.resetFilters}
            title="Filter Suppliers"
            description="Filter by category and region"
          />

          <SimpleSortDropdown
            options={sortOptions}
            value={searchFilters.sort}
            onChange={searchFilters.setSort}
            placeholder="Sort by..."
            className="w-[200px]"
          />
        </div>

        {/* Active Filter Badges */}
        <ActiveFilterBadges
          fields={filterFields}
          values={searchFilters.filters}
          onRemove={(fieldId) => {
            searchFilters.setFilters({
              ...searchFilters.filters,
              [fieldId]: null,
            });
          }}
          onClearAll={searchFilters.resetFilters}
        />

        {/* Clear All Button (if any filters active) */}
        {searchFilters.hasAnyActive && (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={searchFilters.resetAll}>
              Clear all filters
            </Button>
          </div>
        )}
      </div>

      {/* Suppliers Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading suppliers...</p>
        </div>
      ) : suppliers && suppliers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier) => (
            <Card key={supplier.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <Link href={`/supplier/${supplier.id}`} className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 hover:text-primary transition-colors">{supplier.name}</h3>
                    {supplier.category_id && (
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                        Category
                      </span>
                    )}
                  </Link>
                  <QuickActions entityType="supplier" entityId={supplier.id} />
                </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    {supplier.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {supplier.city}
                      </div>
                    )}
                    {supplier.contact_person && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {supplier.contact_person}
                      </div>
                    )}
                    {supplier.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {supplier.email}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchFilters.hasAnyActive
              ? 'No suppliers found matching your search or filters'
              : 'No suppliers yet'}
          </p>
          {searchFilters.hasAnyActive && (
            <Button
              variant="outline"
              onClick={searchFilters.resetAll}
              className="mt-4"
            >
              Clear all filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
