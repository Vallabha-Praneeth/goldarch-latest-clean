'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Switch } from '@/components/ui/switch';
import { FileText, Plus, MoreVertical, Eye, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { Breadcrumbs } from '@/components/cross-section/Breadcrumbs';

type TemplateType = 'quotation' | 'invoice' | 'email';
type TemplateStatus = 'active' | 'draft';
type ViewMode = 'list' | 'editor' | 'preview';

interface Template {
  id: string;
  name: string;
  type: TemplateType;
  status: TemplateStatus;
  lastModified: string;
  header: string;
  body: string;
  footer: string;
}

const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'Standard Quote',
    type: 'quotation',
    status: 'active',
    lastModified: '2024-01-15',
    header: 'Dear {{client_name}},\n\nThank you for your interest in our services.',
    body: 'Please find below our quotation for {{project_name}}:\n\nTotal: {{quote_total}}',
    footer: 'Best regards,\n{{company_name}}',
  },
  {
    id: '2',
    name: 'Invoice Template',
    type: 'invoice',
    status: 'active',
    lastModified: '2024-01-10',
    header: 'INVOICE\n\nBill To: {{client_name}}',
    body: 'Invoice Number: {{invoice_number}}\nAmount Due: {{total_amount}}',
    footer: 'Thank you for your business!',
  },
  {
    id: '3',
    name: 'Welcome Email',
    type: 'email',
    status: 'draft',
    lastModified: '2024-01-05',
    header: 'Subject: Welcome to {{company_name}}',
    body: 'Hi {{client_name}},\n\nWelcome aboard!',
    footer: 'Cheers,\nThe Team',
  },
];

const availableTokens = [
  '{{client_name}}',
  '{{project_name}}',
  '{{quote_total}}',
  '{{invoice_number}}',
  '{{total_amount}}',
  '{{company_name}}',
  '{{date}}',
  '{{due_date}}',
];

export default function TemplatesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedType, setSelectedType] = useState<TemplateType>('quotation');
  const [templates] = useState<Template[]>(mockTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showSampleData, setShowSampleData] = useState(false);

  // Editor state
  const [editorData, setEditorData] = useState({
    name: '',
    type: 'quotation' as TemplateType,
    status: 'draft' as TemplateStatus,
    header: '',
    body: '',
    footer: '',
  });

  const filteredTemplates = templates.filter((t) => t.type === selectedType);

  const handleCreateNew = () => {
    setEditorData({
      name: '',
      type: selectedType,
      status: 'draft',
      header: '',
      body: '',
      footer: '',
    });
    setViewMode('editor');
  };

  const handleEdit = (template: Template) => {
    setEditorData(template);
    setViewMode('editor');
  };

  const handlePreview = (template: Template) => {
    setSelectedTemplate(template);
    setViewMode('preview');
  };

  const handleSave = () => {
    // Mock save - in real app, would call API
    console.log('Saving template:', editorData);
    setViewMode('list');
  };

  const insertToken = (token: string, field: 'header' | 'body' | 'footer') => {
    setEditorData({
      ...editorData,
      [field]: editorData[field] + ' ' + token,
    });
  };

  const renderSampleData = (text: string) => {
    if (!showSampleData) return text;

    return text
      .replace(/{{client_name}}/g, 'John Doe')
      .replace(/{{project_name}}/g, 'Office Renovation')
      .replace(/{{quote_total}}/g, '₹15,00,000')
      .replace(/{{invoice_number}}/g, 'INV-2024-001')
      .replace(/{{total_amount}}/g, '₹18,50,000')
      .replace(/{{company_name}}/g, 'Gold.Arch CRM')
      .replace(/{{date}}/g, new Date().toLocaleDateString())
      .replace(/{{due_date}}/g, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString());
  };

  // List View
  const renderListView = () => (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Templates
          </h1>
          <p className="text-muted-foreground">Manage quotation, invoice, and email templates</p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Template
        </Button>
      </div>

      <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as TemplateType)}>
        <TabsList>
          <TabsTrigger value="quotation">Quotations</TabsTrigger>
          <TabsTrigger value="invoice">Invoices</TabsTrigger>
          <TabsTrigger value="email">Emails</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedType} className="mt-6">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No templates found. Create your first template to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell className="capitalize">{template.type}</TableCell>
                        <TableCell>{new Date(template.lastModified).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={template.status === 'active' ? 'default' : 'secondary'}>
                            {template.status}
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
                              <DropdownMenuItem onClick={() => handleEdit(template)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePreview(template)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  // Editor View
  const renderEditorView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setViewMode('list')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Template Editor</h1>
          <p className="text-muted-foreground">Create or edit your template</p>
        </div>
        <Button onClick={handleSave}>Save Template</Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Editor */}
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Header Section</CardTitle>
              <CardDescription>Top of the document</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={editorData.header}
                onChange={(e) => setEditorData({ ...editorData, header: e.target.value })}
                rows={4}
                placeholder="Enter header content..."
              />
              <div className="flex flex-wrap gap-2">
                {availableTokens.slice(0, 4).map((token) => (
                  <Button
                    key={token}
                    variant="outline"
                    size="sm"
                    onClick={() => insertToken(token, 'header')}
                  >
                    {token}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Body Section</CardTitle>
              <CardDescription>Main content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={editorData.body}
                onChange={(e) => setEditorData({ ...editorData, body: e.target.value })}
                rows={8}
                placeholder="Enter body content..."
              />
              <div className="flex flex-wrap gap-2">
                {availableTokens.map((token) => (
                  <Button
                    key={token}
                    variant="outline"
                    size="sm"
                    onClick={() => insertToken(token, 'body')}
                  >
                    {token}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Footer Section</CardTitle>
              <CardDescription>Bottom of the document</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={editorData.footer}
                onChange={(e) => setEditorData({ ...editorData, footer: e.target.value })}
                rows={4}
                placeholder="Enter footer content..."
              />
              <div className="flex flex-wrap gap-2">
                {availableTokens.slice(0, 3).map((token) => (
                  <Button
                    key={token}
                    variant="outline"
                    size="sm"
                    onClick={() => insertToken(token, 'footer')}
                  >
                    {token}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Properties */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={editorData.name}
                  onChange={(e) => setEditorData({ ...editorData, name: e.target.value })}
                  placeholder="Enter template name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Document Type</Label>
                <Select
                  value={editorData.type}
                  onValueChange={(value) => setEditorData({ ...editorData, type: value as TemplateType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quotation">Quotation</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="status">Active Status</Label>
                <Switch
                  id="status"
                  checked={editorData.status === 'active'}
                  onCheckedChange={(checked) =>
                    setEditorData({ ...editorData, status: checked ? 'active' : 'draft' })
                  }
                />
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Available Tokens:</p>
                <div className="flex flex-wrap gap-1">
                  {availableTokens.map((token) => (
                    <Badge key={token} variant="outline" className="text-xs">
                      {token}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  // Preview View
  const renderPreviewView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setViewMode('list')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Template Preview</h1>
          <p className="text-muted-foreground">{selectedTemplate?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="sample-data" className="text-sm">Show sample data</Label>
          <Switch
            id="sample-data"
            checked={showSampleData}
            onCheckedChange={setShowSampleData}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="bg-white text-black p-8 rounded border shadow-sm min-h-[600px] space-y-6 font-serif">
            {/* Header */}
            <div className="pb-4 border-b border-gray-300">
              <div className="whitespace-pre-wrap">
                {renderSampleData(selectedTemplate?.header || '')}
              </div>
            </div>

            {/* Body */}
            <div className="py-6">
              <div className="whitespace-pre-wrap">
                {renderSampleData(selectedTemplate?.body || '')}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-gray-300">
              <div className="whitespace-pre-wrap">
                {renderSampleData(selectedTemplate?.footer || '')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div>
      {viewMode === 'list' && renderListView()}
      {viewMode === 'editor' && renderEditorView()}
      {viewMode === 'preview' && renderPreviewView()}
    </div>
  );
}
