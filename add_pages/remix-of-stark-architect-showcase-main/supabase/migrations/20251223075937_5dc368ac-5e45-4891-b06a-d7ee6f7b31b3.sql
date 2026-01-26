-- Enable RLS on remaining tables
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_rating_history ENABLE ROW LEVEL SECURITY;

-- Email templates: Users can view templates they created
CREATE POLICY "Users can view their email templates" 
ON public.email_templates FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create email templates" 
ON public.email_templates FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their email templates" 
ON public.email_templates FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their email templates" 
ON public.email_templates FOR DELETE 
USING (auth.uid() = created_by);

-- Import batches: Users can view imports they made
CREATE POLICY "Users can view their import batches" 
ON public.import_batches FOR SELECT 
USING (auth.uid() = imported_by);

CREATE POLICY "Users can create import batches" 
ON public.import_batches FOR INSERT 
WITH CHECK (auth.uid() = imported_by);

-- Project access: Users can view access for their projects
CREATE POLICY "Project owners can view access" 
ON public.project_access FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_access.project_id 
    AND projects.owner_id = auth.uid()
  )
  OR auth.uid() = user_id
);

CREATE POLICY "Project owners can manage access" 
ON public.project_access FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_id 
    AND projects.owner_id = auth.uid()
  )
);

CREATE POLICY "Project owners can update access" 
ON public.project_access FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_access.project_id 
    AND projects.owner_id = auth.uid()
  )
);

CREATE POLICY "Project owners can delete access" 
ON public.project_access FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_access.project_id 
    AND projects.owner_id = auth.uid()
  )
);

-- Project BOM items: Users can manage BOM for their projects
CREATE POLICY "Users can view BOM for their projects" 
ON public.project_bom_items FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_bom_items.project_id 
    AND projects.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can create BOM for their projects" 
ON public.project_bom_items FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_id 
    AND projects.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update BOM for their projects" 
ON public.project_bom_items FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_bom_items.project_id 
    AND projects.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete BOM for their projects" 
ON public.project_bom_items FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_bom_items.project_id 
    AND projects.owner_id = auth.uid()
  )
);

-- Project files: Users can manage files for their projects
CREATE POLICY "Users can view files for their projects" 
ON public.project_files FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_files.project_id 
    AND projects.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can upload files to their projects" 
ON public.project_files FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_id 
    AND projects.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update files in their projects" 
ON public.project_files FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_files.project_id 
    AND projects.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete files from their projects" 
ON public.project_files FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_files.project_id 
    AND projects.owner_id = auth.uid()
  )
);

-- Supplier rating history: Users can manage ratings they created
CREATE POLICY "Users can view their ratings" 
ON public.supplier_rating_history FOR SELECT 
USING (auth.uid() = rated_by);

CREATE POLICY "Users can create ratings" 
ON public.supplier_rating_history FOR INSERT 
WITH CHECK (auth.uid() = rated_by);

CREATE POLICY "Users can update their ratings" 
ON public.supplier_rating_history FOR UPDATE 
USING (auth.uid() = rated_by);

CREATE POLICY "Users can delete their ratings" 
ON public.supplier_rating_history FOR DELETE 
USING (auth.uid() = rated_by);