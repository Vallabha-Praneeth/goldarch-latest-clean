# Clone Manifest: MODULE-2A (Template System)

**Module Purpose**: Create template management and document generation
**Implementation Order**: 7th
**Phase**: 2 (Document Templates)

---

## Files to Clone

### 1. Documents Page
**Source**: `app/app-dashboard/documents/page.tsx`
**Destination**: `_implementation_sandbox/CLONED/app/app-dashboard/documents/page.tsx`
**Reason**: Understand existing document upload/display pattern to add templates
**Will Change**: YES - Will add "Templates" tab or section
**Will NOT Change**: Existing document upload, layout structure

### 2. Suppliers Page (for dialog patterns)
**Source**: `app/app-dashboard/suppliers/page.tsx`
**Destination**: `_implementation_sandbox/CLONED/app/app-dashboard/suppliers/page.tsx`
**Reason**: Use dialog pattern for template creation (similar to Add Supplier)
**Will Change**: NO - Reference only
**Will NOT Change**: Everything (read-only reference)

**Note**: If already cloned for other modules, reuse.

### 3. Supabase Client
**Source**: `lib/supabase-client.ts`
**Destination**: `_implementation_sandbox/CLONED/lib/supabase-client.ts`
**Reason**: Understand storage patterns for template files
**Will Change**: NO - Reference only
**Will NOT Change**: Everything (read-only reference)

### 4. UI Components (Tabs, Dialog, Input)
**Source**: `components/ui/tabs.tsx`
**Destination**: `_implementation_sandbox/CLONED/components/ui/tabs.tsx`
**Reason**: Use for Documents/Templates tabs
**Will Change**: NO - Reference only
**Will NOT Change**: Everything (read-only reference)

---

## Files NOT to Clone

- Other page files
- Non-document related components
- Project/deal detail pages (will reference in NEW files)

---

## What Will Be Created (NEW files)

All new files will be in `_implementation_sandbox/MODULES/MODULE-2A/`:

1. **`pages/templates-page.tsx`**
   - Template library view
   - List of available templates (grid/list)
   - Upload new template button (admin only)
   - Preview template button
   - Uses Documents page as layout template

2. **`components/template-upload-dialog.tsx`**
   - Dialog to create/upload template
   - Template name input
   - Template type select (Quotation, Invoice, Letter, etc.)
   - File upload (.docx with placeholders)
   - Placeholder instructions
   - Save button

3. **`components/generate-document-dialog.tsx`**
   - Dialog to generate document from template
   - Template selection dropdown
   - Data source selection (project, deal, custom)
   - Field mapping UI (if custom)
   - Generate button
   - Download/save options

4. **`components/template-card.tsx`**
   - Template display card
   - Shows: name, type, preview thumbnail
   - Actions: Use Template, Edit, Delete
   - Matches supplier card styling

5. **`components/template-field-mapper.tsx`**
   - UI for mapping template placeholders to data
   - Shows: {{field_name}} → Data source
   - Auto-maps common fields (project_name, date, etc.)
   - Manual mapping for custom fields

6. **`utils/template-engine.ts`**
   - Function: `generateDocument(templateId, dataSource, mappings)`
   - Uses docxtemplater to merge data
   - Replaces {{placeholders}} with actual values
   - Returns: Generated file blob
   - Skeleton only (structure, not full implementation)

7. **`utils/template-parser.ts`**
   - Function: `parseTemplatePlaceholders(fileContent)`
   - Extracts {{field}} placeholders from template
   - Returns: List of required fields
   - Used for field mapping UI

8. **`api/template-routes.ts`**
   - GET /api/templates (list templates)
   - POST /api/templates (upload template)
   - POST /api/templates/:id/generate (generate document)
   - DELETE /api/templates/:id (delete template)
   - Skeleton only (structure, not full implementation)

9. **`schema/templates.sql`**
   - CREATE TABLE templates
   - Columns: id, name, type, file_path, placeholders, created_by, etc.
   - Indexes for querying

10. **`README.md`**
    - Integration instructions
    - How to create templates (DOCX format guide)
    - Placeholder syntax ({{field_name}})
    - How to integrate with documents page
    - docxtemplater usage guide

---

## Integration Strategy

### Documents Page Enhancement:

**Option A: Tabs** (recommended)
```tsx
<Tabs defaultValue="documents">
  <TabsList>
    <TabsTrigger value="documents">Documents</TabsTrigger>
    <TabsTrigger value="templates">Templates</TabsTrigger>
  </TabsList>

  <TabsContent value="documents">
    {/* Existing document list */}
  </TabsContent>

  <TabsContent value="templates">
    <TemplatesPage />
  </TabsContent>
</Tabs>
```

**Option B: Separate Page** (if navigation allows)
- Create `/app-dashboard/templates` route
- Access via URL (not in nav menu)

---

## Template System Architecture

### Template File Format:
- DOCX file with placeholders: `{{field_name}}`
- Supported placeholders:
  - `{{project_name}}`
  - `{{client_name}}`
  - `{{date}}`
  - `{{amount}}`
  - `{{supplier_name}}`
  - `{{address}}`
  - Custom: `{{custom_field}}`

### Generation Flow:
1. User selects template
2. User selects data source (project/deal)
3. System fetches data from database
4. System maps data to placeholders
5. docxtemplater merges data with template
6. System generates new DOCX file
7. User downloads or saves to documents

---

## Template Card Design

```tsx
// components/template-card.tsx
export function TemplateCard({ template, onUse, onEdit, onDelete }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
            <Badge variant="outline">{template.type}</Badge>
          </div>
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {template.placeholders?.length || 0} fields
        </p>

        <div className="flex gap-2">
          <Button size="sm" onClick={() => onUse(template.id)} className="flex-1">
            Use Template
          </Button>
          <Button size="sm" variant="outline" onClick={() => onEdit(template.id)}>
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Generate Document Dialog Design

```tsx
// components/generate-document-dialog.tsx
export function GenerateDocumentDialog({ open, onOpenChange, templates }) {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [dataSource, setDataSource] = useState({ type: 'project', id: '' });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Document</DialogTitle>
          <DialogDescription>
            Select a template and data source to generate your document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {templates?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data Source Selection */}
          <div className="space-y-2">
            <Label>Data Source</Label>
            <Select
              value={dataSource.type}
              onValueChange={(v) => setDataSource({ ...dataSource, type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="deal">Deal</SelectItem>
                <SelectItem value="supplier">Supplier</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ID Selection (would be dropdown of actual projects/deals) */}
          <div className="space-y-2">
            <Label>Select {dataSource.type}</Label>
            <Input
              placeholder={`Enter ${dataSource.type} ID`}
              value={dataSource.id}
              onChange={(e) => setDataSource({ ...dataSource, id: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={!selectedTemplate || !dataSource.id}>
            Generate Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Template Engine (Skeleton)

```typescript
// utils/template-engine.ts
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

export async function generateDocument(
  templatePath: string,
  data: Record<string, any>
) {
  // Fetch template file from Supabase storage
  const { data: fileData } = await supabase.storage
    .from('templates')
    .download(templatePath);

  if (!fileData) throw new Error('Template not found');

  // Load template
  const zip = new PizZip(await fileData.arrayBuffer());
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  // Set data
  doc.setData(data);

  // Render
  doc.render();

  // Generate blob
  const blob = doc.getZip().generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  return blob;
}
```

---

## Database Schema

```sql
-- schema/templates.sql
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'quotation', 'invoice', 'letter', etc.
  file_path TEXT NOT NULL, -- Path in Supabase storage
  placeholders JSONB, -- Array of placeholder field names
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_type ON templates(type);
CREATE INDEX idx_templates_created_by ON templates(created_by);
```

---

## Verification After Clone

- [ ] documents/page.tsx cloned successfully
- [ ] Dialog patterns understood (from suppliers/page.tsx)
- [ ] Can identify insertion point for templates tab
- [ ] docxtemplater library available (package.json)

---

**Status**: Ready for PHASE 3 (cloning)
**Estimated Clone Size**: ~500 lines total
