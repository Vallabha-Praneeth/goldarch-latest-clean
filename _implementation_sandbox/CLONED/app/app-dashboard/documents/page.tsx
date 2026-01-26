'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Files,
  Plus,
  FileText,
  Receipt,
  FileSignature,
  FileSpreadsheet,
  File,
  Upload,
  Download,
  Eye,
  Trash2,
  Calendar,
  Loader2,
  Search,
  Building2,
  FolderKanban,
  Handshake,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-provider';
import { AIChatWidget } from '@/components/ai-chat-widget';
import { DocumentSummaryModal } from '@/components/document-summary-modal';
import { DocumentFiltersComponent, type DocumentFilters } from '@/components/document-filters';
import { indexDocument, isIndexableFileType } from '@/lib/document-indexer';

type DocumentType = 'quote' | 'invoice' | 'contract' | 'proposal' | 'purchase_order' | 'receipt' | 'other';

const documentTypeConfig: Record<DocumentType, { label: string; icon: any; color: string }> = {
  quote: { label: 'Quote', icon: FileText, color: 'text-blue-500' },
  invoice: { label: 'Invoice', icon: Receipt, color: 'text-green-500' },
  contract: { label: 'Contract', icon: FileSignature, color: 'text-purple-500' },
  proposal: { label: 'Proposal', icon: FileSpreadsheet, color: 'text-amber-500' },
  purchase_order: { label: 'Purchase Order', icon: FileText, color: 'text-indigo-500' },
  receipt: { label: 'Receipt', icon: Receipt, color: 'text-pink-500' },
  other: { label: 'Other', icon: File, color: 'text-gray-500' },
};

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState<'all' | DocumentType>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [selectedDocForSummary, setSelectedDocForSummary] = useState<any>(null);
  const [filters, setFilters] = useState<DocumentFilters>({
    dateFrom: undefined,
    dateTo: undefined,
    documentTypes: [],
    projectId: undefined,
    supplierId: undefined,
  });
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    document_type: 'other' as DocumentType,
    supplier_id: '',
    project_id: '',
    deal_id: '',
  });

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          supplier:suppliers(id, name),
          project:projects(id, name),
          deal:deals(id, title)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: async () => {
      const { data } = await supabase.from('suppliers').select('id, name').order('name');
      return data || [];
    },
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-list'],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('id, name').order('name');
      return data || [];
    },
  });

  const { data: deals } = useQuery({
    queryKey: ['deals-list'],
    queryFn: async () => {
      const { data } = await supabase.from('deals').select('id, title').order('title');
      return data || [];
    },
  });

  const filteredDocuments = documents?.filter((doc) => {
    // Tab filter
    const matchesType = activeTab === 'all' || doc.document_type === activeTab;

    // Search filter
    const matchesSearch = searchQuery === '' ||
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Advanced filters
    const matchesDateFrom = !filters.dateFrom ||
      new Date(doc.created_at) >= filters.dateFrom;

    const matchesDateTo = !filters.dateTo ||
      new Date(doc.created_at) <= filters.dateTo;

    const matchesDocTypes = filters.documentTypes.length === 0 ||
      filters.documentTypes.includes(doc.document_type as DocumentType);

    const matchesProject = !filters.projectId ||
      doc.project_id === filters.projectId;

    const matchesSupplier = !filters.supplierId ||
      doc.supplier_id === filters.supplierId;

    return matchesType && matchesSearch && matchesDateFrom &&
           matchesDateTo && matchesDocTypes && matchesProject && matchesSupplier;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      document_type: 'other',
      supplier_id: '',
      project_id: '',
      deal_id: '',
    });
    setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Document name is required');
      return;
    }

    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setLoading(true);

    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `documents/${formData.document_type}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('supplier-files')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('supplier-files')
        .getPublicUrl(filePath);

      // Insert document record
      const { error } = await supabase.from('documents').insert({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        document_type: formData.document_type,
        file_url: urlData.publicUrl,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        supplier_id: formData.supplier_id || null,
        project_id: formData.project_id || null,
        deal_id: formData.deal_id || null,
        user_id: user?.id || null,
      });

      if (error) throw error;

      toast.success('Document uploaded successfully');

      // Auto-index document to Framework B (if supported file type)
      if (isIndexableFileType(selectedFile.name)) {
        toast.info('Indexing document for AI search...');

        // Run indexing in background (don't await)
        indexDocument({
          file: selectedFile,
          documentId: formData.name,
          projectId: formData.project_id || undefined,
          supplierId: formData.supplier_id || undefined,
          dealId: formData.deal_id || undefined,
          metadata: {
            documentType: formData.document_type,
            description: formData.description,
            filename: selectedFile.name,
          },
        }).then((result) => {
          if (result.success) {
            toast.success(
              `AI indexing complete: ${result.chunksCreated} chunks created`,
              { duration: 3000 }
            );
          } else {
            toast.warning('AI indexing failed - document saved but not searchable via AI');
          }
        });
      }

      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (url: string, name: string) => {
    setPreviewUrl(url);
    setPreviewName(name);
    setPreviewOpen(true);
  };

  const handleDelete = async (documentId: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      // Delete from database
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      toast.success('Document deleted');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete document');
    }
  };

  const handleSummarize = (doc: any) => {
    setSelectedDocForSummary(doc);
    setSummaryOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getDocumentCounts = () => {
    const counts: Record<string, number> = { all: documents?.length || 0 };
    Object.keys(documentTypeConfig).forEach((type) => {
      counts[type] = documents?.filter((d) => d.document_type === type).length || 0;
    });
    return counts;
  };

  const counts = getDocumentCounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Files className="h-8 w-8" />
            Documents
          </h1>
          <p className="text-muted-foreground">Manage quotes, invoices, contracts, and more</p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Upload Document Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Add a new document to your collection
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Document Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Steel Quote Q-2024-001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document_type">Document Type</Label>
              <Select
                value={formData.document_type}
                onValueChange={(value) => setFormData({ ...formData, document_type: value as DocumentType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(documentTypeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File *</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details about this document"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deal">Deal</Label>
                <Select
                  value={formData.deal_id}
                  onValueChange={(value) => setFormData({ ...formData, deal_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {deals?.map((deal) => (
                      <SelectItem key={deal.id} value={deal.id}>
                        {deal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload Document
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewName}</DialogTitle>
          </DialogHeader>
          <div className="w-full h-[70vh]">
            {previewUrl && (
              previewUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img src={previewUrl} alt={previewName} className="w-full h-full object-contain" />
              ) : previewUrl.match(/\.pdf$/i) ? (
                <iframe src={previewUrl} className="w-full h-full" title={previewName} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <File className="h-16 w-16 text-muted-foreground" />
                  <p className="text-muted-foreground">Preview not available for this file type</p>
                  <Button onClick={() => window.open(previewUrl, '_blank')}>
                    <Download className="mr-2 h-4 w-4" />
                    Download File
                  </Button>
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Advanced Filters */}
      <DocumentFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        projects={projects || []}
        suppliers={suppliers || []}
      />

      {/* Document Type Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="flex flex-wrap h-auto gap-2 p-2">
          <TabsTrigger value="all" className="gap-1">
            All ({counts.all})
          </TabsTrigger>
          {Object.entries(documentTypeConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <TabsTrigger key={key} value={key} className="gap-1">
                <Icon className={`h-3 w-3 ${config.color}`} />
                {config.label} ({counts[key]})
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
              <p className="text-muted-foreground mt-2">Loading documents...</p>
            </div>
          ) : filteredDocuments && filteredDocuments.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDocuments.map((doc) => {
                const config = documentTypeConfig[doc.document_type as DocumentType] || documentTypeConfig.other;
                const Icon = config.icon;

                return (
                  <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center`}>
                            <Icon className={`h-5 w-5 ${config.color}`} />
                          </div>
                          <div>
                            <CardTitle className="text-base line-clamp-1">{doc.name}</CardTitle>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {config.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {doc.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {doc.description}
                        </p>
                      )}

                      <div className="space-y-1 text-xs text-muted-foreground">
                        {doc.supplier?.name && (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {doc.supplier.name}
                          </div>
                        )}
                        {doc.project?.name && (
                          <div className="flex items-center gap-1">
                            <FolderKanban className="h-3 w-3" />
                            {doc.project.name}
                          </div>
                        )}
                        {doc.deal?.title && (
                          <div className="flex items-center gap-1">
                            <Handshake className="h-3 w-3" />
                            {doc.deal.title}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <File className="h-3 w-3" />
                          {formatFileSize(doc.file_size)}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 pt-2 border-t">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handlePreview(doc.file_url, doc.name)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => window.open(doc.file_url, '_blank')}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(doc.id, doc.file_url)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        {isIndexableFileType(doc.file_name) && (
                          <Button
                            size="sm"
                            variant="default"
                            className="w-full gap-2"
                            onClick={() => handleSummarize(doc)}
                          >
                            <Sparkles className="h-3 w-3" />
                            AI Summary
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Files className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No documents found matching your search' : 'No documents yet'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Click "Upload Document" to add your first document
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Document Summary Modal */}
      {selectedDocForSummary && (
        <DocumentSummaryModal
          open={summaryOpen}
          onOpenChange={setSummaryOpen}
          documentId={selectedDocForSummary.name}
          documentName={selectedDocForSummary.name}
          projectId={selectedDocForSummary.project_id}
          supplierId={selectedDocForSummary.supplier_id}
        />
      )}

      {/* AI Chat Widget */}
      <AIChatWidget />
    </div>
  );
}
