'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { FileText, Plus, MoreVertical, Eye, Edit, Trash2, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Breadcrumbs } from '@/components/cross-section/Breadcrumbs';
import { toast } from 'sonner';

type TemplateType = 'quotation' | 'invoice' | 'email';
type TemplateStatus = 'active' | 'draft' | 'archived';
type ViewMode = 'list' | 'editor' | 'preview';

interface Template {
  id: string;
  name: string;
  type: TemplateType;
  status: TemplateStatus;
  content: {
    header?: string;
    body?: string;
    footer?: string;
  };
  subject?: string;
  description?: string;
  tokens?: string[];
  is_default?: boolean;
  created_at: string;
  created_by?: string;
}

const availableTokens = [
  '{{client_name}}',
  '{{client_company}}',
  '{{project_name}}',
  '{{quote_number}}',
  '{{quote_total}}',
  '{{invoice_number}}',
  '{{total_amount}}',
  '{{company_name}}',
  '{{date}}',
  '{{due_date}}',
  '{{valid_until}}',
];

// API functions
async function fetchTemplates(type?: string): Promise<Template[]> {
  const url = type ? `/api/templates?type=${type}` : '/api/templates';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch templates');
  const data = await res.json();
  return data.data || [];
}

async function createTemplate(template: Partial<Template>): Promise<Template> {
  const res = await fetch('/api/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(template),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create template');
  }
  const data = await res.json();
  return data.data;
}

async function updateTemplate(id: string, template: Partial<Template>): Promise<Template> {
  const res = await fetch(`/api/templates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(template),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update template');
  }
  const data = await res.json();
  return data.data;
}

async function deleteTemplate(id: string): Promise<void> {
  const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete template');
  }
}

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedType, setSelectedType] = useState<TemplateType>('quotation');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showSampleData, setShowSampleData] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch templates from API
  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ['templates'],
    queryFn: () => fetchTemplates(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template created successfully');
      setViewMode('list');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Template> }) => updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template updated successfully');
      setViewMode('list');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template archived successfully');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Editor state
  const [editorData, setEditorData] = useState({
    name: '',
    type: 'quotation' as TemplateType,
    status: 'draft' as TemplateStatus,
    subject: '',
    description: '',
    header: '',
    body: '',
    footer: '',
  });

  const filteredTemplates = templates.filter((t) => t.type === selectedType && t.status !== 'archived');

  const handleCreateNew = () => {
    setEditingId(null);
    setEditorData({
      name: '',
      type: selectedType,
      status: 'draft',
      subject: '',
      description: '',
      header: '',
      body: '',
      footer: '',
    });
    setViewMode('editor');
  };

  const handleEdit = (template: Template) => {
    setEditingId(template.id);
    setEditorData({
      name: template.name,
      type: template.type,
      status: template.status,
      subject: template.subject || '',
      description: template.description || '',
      header: template.content?.header || '',
      body: template.content?.body || '',
      footer: template.content?.footer || '',
    });
    setViewMode('editor');
  };

  const handlePreview = (template: Template) => {
    setSelectedTemplate(template);
    setViewMode('preview');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to archive this template?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSave = () => {
    if (!editorData.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    const templateData = {
      name: editorData.name,
      type: editorData.type,
      status: editorData.status,
      subject: editorData.subject || undefined,
      description: editorData.description || undefined,
      content: {
        header: editorData.header,
        body: editorData.body,
        footer: editorData.footer,
      },
      tokens: availableTokens,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: templateData });
    } else {
      createMutation.mutate(templateData);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

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
      .replace(/{{client_company}}/g, 'Acme Corp')
      .replace(/{{project_name}}/g, 'Office Renovation')
      .replace(/{{quote_number}}/g, 'QT-2026-0001')
      .replace(/{{quote_total}}/g, '$15,000.00')
      .replace(/{{invoice_number}}/g, 'INV-2026-001')
      .replace(/{{total_amount}}/g, '$18,500.00')
      .replace(/{{company_name}}/g, 'GoldArch Construction')
      .replace(/{{date}}/g, new Date().toLocaleDateString())
      .replace(/{{due_date}}/g, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString())
      .replace(/{{valid_until}}/g, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString());
  };

  // List View - Gold.Arch Styling
  const renderListView = () => (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-amber-600" />
            Templates
          </h1>
          <p className="text-muted-foreground">Manage quotation, invoice, and email templates</p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2 bg-slate-800 hover:bg-slate-700">
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as TemplateType)}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="quotation" className="data-[state=active]:bg-white data-[state=active]:text-slate-900">
            Quotations
          </TabsTrigger>
          <TabsTrigger value="invoice" className="data-[state=active]:bg-white data-[state=active]:text-slate-900">
            Invoices
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-white data-[state=active]:text-slate-900">
            Emails
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedType} className="mt-6">
          <Card className="overflow-hidden border-0 shadow-sm">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-500">
                  Failed to load templates. Please try again.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    {/* Gold.Arch style: Dark slate header */}
                    <TableRow className="bg-slate-800 hover:bg-slate-800">
                      <TableHead className="text-white font-medium">Name</TableHead>
                      <TableHead className="text-white font-medium">Description</TableHead>
                      <TableHead className="text-white font-medium">Last Modified</TableHead>
                      <TableHead className="text-white font-medium">Status</TableHead>
                      <TableHead className="text-white font-medium text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                          <p className="text-lg font-medium">No templates yet</p>
                          <p className="text-sm">Create your first {selectedType} template to get started.</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTemplates.map((template) => (
                        <TableRow key={template.id} className="hover:bg-slate-50">
                          <TableCell className="font-medium">{template.name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-[300px] truncate">
                            {template.description || 'No description'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(template.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {/* Gold.Arch style: Green badge for active, similar to "Valid" badge */}
                            {template.status === 'active' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                <CheckCircle2 className="h-3 w-3" />
                                Active
                              </span>
                            ) : (
                              <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                Draft
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="hover:bg-slate-100">
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
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => handleDelete(template.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  // Editor View - Gold.Arch Styling
  const renderEditorView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setViewMode('list')} className="hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {editingId ? 'Edit Template' : 'Create Template'}
          </h1>
          <p className="text-muted-foreground">
            {editingId ? 'Update your template content and settings' : 'Create a new template for your documents'}
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-slate-800 hover:bg-slate-700"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Template'
          )}
        </Button>
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

        {/* Right: Properties - Gold.Arch Styling */}
        <div className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg">Template Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700">Template Name *</Label>
                <Input
                  id="name"
                  value={editorData.name}
                  onChange={(e) => setEditorData({ ...editorData, name: e.target.value })}
                  placeholder="e.g., Standard Quote Template"
                  className="border-slate-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-700">Description</Label>
                <Textarea
                  id="description"
                  value={editorData.description}
                  onChange={(e) => setEditorData({ ...editorData, description: e.target.value })}
                  placeholder="Brief description of this template..."
                  rows={2}
                  className="border-slate-300"
                />
              </div>

              {editorData.type === 'email' && (
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-slate-700">Email Subject</Label>
                  <Input
                    id="subject"
                    value={editorData.subject}
                    onChange={(e) => setEditorData({ ...editorData, subject: e.target.value })}
                    placeholder="e.g., Your Quote from {{company_name}}"
                    className="border-slate-300"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="type" className="text-slate-700">Document Type</Label>
                <Select
                  value={editorData.type}
                  onValueChange={(value) => setEditorData({ ...editorData, type: value as TemplateType })}
                >
                  <SelectTrigger className="border-slate-300">
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

              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-3">Available Tokens</p>
                <p className="text-xs text-slate-500 mb-2">Click to copy, then paste in content areas</p>
                <div className="flex flex-wrap gap-1.5">
                  {availableTokens.map((token) => (
                    <Badge
                      key={token}
                      variant="outline"
                      className="text-xs cursor-pointer hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-colors"
                      onClick={() => {
                        navigator.clipboard.writeText(token);
                        toast.success(`Copied ${token}`);
                      }}
                    >
                      {token}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Help Card */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <h4 className="font-medium text-amber-800 mb-2">How Tokens Work</h4>
              <p className="text-sm text-amber-700">
                Tokens like <code className="bg-white px-1 rounded">{'{{client_name}}'}</code> will be
                automatically replaced with real data when generating documents.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  // Preview View - Gold.Arch Styling (matching quote preview)
  const renderPreviewView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setViewMode('list')} className="hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Template Preview</h1>
          <p className="text-muted-foreground">{selectedTemplate?.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="sample-data" className="text-sm">Show sample data</Label>
            <Switch
              id="sample-data"
              checked={showSampleData}
              onCheckedChange={setShowSampleData}
            />
          </div>
          {/* Status badge like quote preview */}
          {selectedTemplate?.status === 'active' && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200">
              <CheckCircle2 className="h-4 w-4" />
              Active
            </span>
          )}
        </div>
      </div>

      {/* Gold.Arch style document preview */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          <div className="bg-white rounded-lg overflow-hidden">
            {/* Document Header - matching quote preview style */}
            <div className="p-8 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {renderSampleData(selectedTemplate?.name || 'Template')}
                  </h2>
                  {selectedTemplate?.subject && (
                    <p className="text-slate-600 mt-1">
                      {renderSampleData(selectedTemplate.subject)}
                    </p>
                  )}
                </div>
              </div>
              <div className="whitespace-pre-wrap mt-6 text-slate-700">
                {renderSampleData(selectedTemplate?.content?.header || '')}
              </div>
            </div>

            {/* Document Body - with Gold.Arch table styling if applicable */}
            <div className="p-8">
              <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                {renderSampleData(selectedTemplate?.content?.body || '')}
              </div>
            </div>

            {/* Document Footer */}
            <div className="p-8 border-t bg-slate-50">
              <div className="whitespace-pre-wrap text-slate-600">
                {renderSampleData(selectedTemplate?.content?.footer || '')}
              </div>
              {/* Gold.Arch branding footer */}
              <div className="mt-8 pt-4 border-t border-slate-200 text-center">
                <p className="text-amber-600 font-semibold">GoldArch Construction</p>
                <p className="text-slate-500 text-sm">Thank you for your business!</p>
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
