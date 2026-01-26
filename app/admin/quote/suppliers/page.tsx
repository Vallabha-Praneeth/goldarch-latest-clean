/**
 * Admin - Supplier & Product Management
 * Manage suppliers, products, pricing, and visibility rules
 * Controls which products are shown to which customer tiers (premium filtering)
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Building2,
  Package,
  DollarSign,
  Shield,
  Plus,
  Edit,
  Trash2,
  Upload,
  Download,
  Info,
  CheckCircle2,
} from 'lucide-react';

export default function AdminSuppliersPage() {
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // Mock data for demonstration (in real app, fetch from API)
  const [products, setProducts] = useState([
    {
      id: '1',
      sku: 'DOOR-001',
      name: '36" Entry Door - Oak',
      category: 'doors',
      price: 450.00,
      tier: 'all',
      region: 'los-angeles',
      inStock: true,
    },
    {
      id: '2',
      sku: 'WIN-001',
      name: 'Casement Window 24x36',
      category: 'windows',
      price: 280.00,
      tier: 'premium',
      region: 'los-angeles',
      inStock: true,
    },
  ]);

  const handleAddProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const newProduct = {
      id: String(products.length + 1),
      sku: formData.get('sku') as string,
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      price: parseFloat(formData.get('price') as string),
      tier: formData.get('tier') as string,
      region: formData.get('region') as string,
      inStock: true,
    };

    setProducts([...products, newProduct]);
    setShowAddProductDialog(false);
    setShowSuccessAlert(true);

    // Hide success alert after 3 seconds
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-3">
            Supplier & Product Management
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Manage your 200-270 suppliers, products, pricing, and premium filtering
          </p>
        </div>

        {/* Success Alert */}
        {showSuccessAlert && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800 dark:text-green-200">Success!</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
              Product added successfully
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500">
                Total Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{products.length}</div>
              <p className="text-xs text-slate-500 mt-1">Across all categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500">
                Premium Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {products.filter(p => p.tier === 'premium').length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Premium tier only</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500">
                Regions Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">1</div>
              <p className="text-xs text-slate-500 mt-1">Los Angeles (Phase 1)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500">
                Suppliers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">2</div>
              <p className="text-xs text-slate-500 mt-1">Target: 200-270</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">
              <Package className="mr-2 h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="pricing">
              <DollarSign className="mr-2 h-4 w-4" />
              Pricing Rules
            </TabsTrigger>
            <TabsTrigger value="visibility">
              <Shield className="mr-2 h-4 w-4" />
              Premium Filtering
            </TabsTrigger>
            <TabsTrigger value="import">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Import
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Product Catalog</CardTitle>
                    <CardDescription>
                      Manage products across all suppliers and categories
                    </CardDescription>
                  </div>
                  <Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Product</DialogTitle>
                        <DialogDescription>
                          Add a product to your catalog
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddProduct} className="space-y-4">
                        <div>
                          <Label htmlFor="sku">SKU</Label>
                          <Input id="sku" name="sku" placeholder="DOOR-001" required />
                        </div>
                        <div>
                          <Label htmlFor="name">Product Name</Label>
                          <Input id="name" name="name" placeholder="36 inch Entry Door - Oak" required />
                        </div>
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select name="category" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="doors">Doors</SelectItem>
                              <SelectItem value="windows">Windows</SelectItem>
                              <SelectItem value="kitchen">Kitchen</SelectItem>
                              <SelectItem value="bathrooms">Bathrooms</SelectItem>
                              <SelectItem value="fixtures">Fixtures</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="price">Price (USD)</Label>
                          <Input
                            id="price"
                            name="price"
                            type="number"
                            step="0.01"
                            placeholder="450.00"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="tier">Customer Tier Visibility</Label>
                          <Select name="tier" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select tier" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Customers</SelectItem>
                              <SelectItem value="premium">Premium Only</SelectItem>
                              <SelectItem value="standard">Standard Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="region">Region</Label>
                          <Select name="region" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select region" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="los-angeles">Los Angeles, CA</SelectItem>
                              <SelectItem value="new-york" disabled>New York, NY (Coming Soon)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowAddProductDialog(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">Add Product</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                          No products yet. Add your first product to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map(product => (
                        <TableRow key={product.id}>
                          <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {product.category}
                            </Badge>
                          </TableCell>
                          <TableCell>${product.price.toFixed(2)}</TableCell>
                          <TableCell>
                            {product.tier === 'premium' ? (
                              <Badge className="bg-purple-600">Premium</Badge>
                            ) : product.tier === 'standard' ? (
                              <Badge variant="secondary">Standard</Badge>
                            ) : (
                              <Badge variant="outline">All Tiers</Badge>
                            )}
                          </TableCell>
                          <TableCell className="capitalize">{product.region.replace('-', ' ')}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Rules Tab */}
          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle>Pricing Rules</CardTitle>
                <CardDescription>
                  Set region and tier-specific pricing. Prices update every 10-15 days.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Price Versioning</AlertTitle>
                  <AlertDescription>
                    Price changes are tracked with effective dates. Historical quotes remain accurate.
                    Current implementation uses base prices. Advanced pricing rules coming in Phase 2.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Premium Filtering Tab */}
          <TabsContent value="visibility">
            <Card>
              <CardHeader>
                <CardTitle>Premium Product Filtering</CardTitle>
                <CardDescription>
                  Control which products are visible to which customer tiers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <Shield className="h-4 w-4" />
                  <AlertTitle>How Premium Filtering Works</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>
                      When adding products above, you can set the tier visibility:
                    </p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li><strong>All Customers</strong> - Visible to both premium and standard tiers</li>
                      <li><strong>Premium Only</strong> - Hidden from standard customers</li>
                      <li><strong>Standard Only</strong> - Shown only to standard customers</li>
                    </ul>
                    <p className="mt-3">
                      The catalog API automatically filters products based on the customer's assigned tier.
                    </p>
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Premium Tier</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 mb-3">
                        Products visible to premium customers:
                      </p>
                      <div className="space-y-2">
                        {products.filter(p => p.tier === 'premium' || p.tier === 'all').map(p => (
                          <div key={p.id} className="p-2 bg-slate-50 dark:bg-slate-900 rounded text-sm">
                            {p.name}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Standard Tier</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 mb-3">
                        Products visible to standard customers:
                      </p>
                      <div className="space-y-2">
                        {products.filter(p => p.tier === 'standard' || p.tier === 'all').map(p => (
                          <div key={p.id} className="p-2 bg-slate-50 dark:bg-slate-900 rounded text-sm">
                            {p.name}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bulk Import Tab */}
          <TabsContent value="import">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Import</CardTitle>
                <CardDescription>
                  Import products from CSV for faster catalog setup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>CSV Import (Phase 2 Feature)</AlertTitle>
                  <AlertDescription>
                    Bulk CSV import will be available in Phase 2. For now, use the "Add Product" button
                    to add products individually.
                  </AlertDescription>
                </Alert>

                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="font-semibold mb-2">CSV Import Coming Soon</p>
                  <p className="text-sm text-slate-500">
                    Will support bulk upload of supplier catalogs
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Expected CSV Format:</h3>
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded text-xs overflow-x-auto">
                    sku,name,category,price,tier,region{'\n'}
                    DOOR-001,36" Entry Door - Oak,doors,450.00,all,los-angeles{'\n'}
                    WIN-001,Casement Window 24x36,windows,280.00,premium,los-angeles
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
