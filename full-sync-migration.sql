-- =====================================================
-- FULL SYNC MIGRATION: Mobile App ↔ Website
-- Makes all data publicly accessible and synced in real-time
-- =====================================================

-- 1. Make user_id nullable for all tables (allows public/shared data)
ALTER TABLE public.suppliers ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.suppliers ALTER COLUMN user_id SET DEFAULT NULL;

ALTER TABLE public.projects ALTER COLUMN owner_id DROP NOT NULL;
ALTER TABLE public.projects ALTER COLUMN owner_id SET DEFAULT NULL;

ALTER TABLE public.deals ALTER COLUMN owner_id DROP NOT NULL;
ALTER TABLE public.deals ALTER COLUMN owner_id SET DEFAULT NULL;

ALTER TABLE public.activities ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.activities ALTER COLUMN user_id SET DEFAULT NULL;

ALTER TABLE public.tasks ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.tasks ALTER COLUMN created_by SET DEFAULT NULL;

ALTER TABLE public.notes ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE public.notes ALTER COLUMN author_id SET DEFAULT NULL;

-- 2. DROP all restrictive RLS policies
-- Suppliers
DROP POLICY IF EXISTS "Users can view their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can create their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can update their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can delete their own suppliers" ON public.suppliers;

-- Projects
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

-- Deals
DROP POLICY IF EXISTS "Users can view their own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can create their own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can update their own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can delete their own deals" ON public.deals;

-- Quotes
DROP POLICY IF EXISTS "Users can view quotes for their deals" ON public.quotes;
DROP POLICY IF EXISTS "Users can create quotes for their deals" ON public.quotes;
DROP POLICY IF EXISTS "Users can update quotes for their deals" ON public.quotes;
DROP POLICY IF EXISTS "Users can delete quotes for their deals" ON public.quotes;

-- Activities
DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can create their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can delete their own activities" ON public.activities;

-- Tasks
DROP POLICY IF EXISTS "Users can view their tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their tasks" ON public.tasks;

-- Notes
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can create their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;

-- 3. CREATE new public access policies for full sync
-- SUPPLIERS - Full public access
CREATE POLICY "Public full access to suppliers"
ON public.suppliers
FOR ALL
USING (true)
WITH CHECK (true);

-- PROJECTS - Full public access
CREATE POLICY "Public full access to projects"
ON public.projects
FOR ALL
USING (true)
WITH CHECK (true);

-- DEALS - Full public access
CREATE POLICY "Public full access to deals"
ON public.deals
FOR ALL
USING (true)
WITH CHECK (true);

-- QUOTES - Full public access
CREATE POLICY "Public full access to quotes"
ON public.quotes
FOR ALL
USING (true)
WITH CHECK (true);

-- ACTIVITIES - Full public access
CREATE POLICY "Public full access to activities"
ON public.activities
FOR ALL
USING (true)
WITH CHECK (true);

-- TASKS - Full public access
CREATE POLICY "Public full access to tasks"
ON public.tasks
FOR ALL
USING (true)
WITH CHECK (true);

-- NOTES - Full public access
CREATE POLICY "Public full access to notes"
ON public.notes
FOR ALL
USING (true)
WITH CHECK (true);

-- CATEGORIES - Already has public read, add write access
DROP POLICY IF EXISTS "Public read access to categories" ON public.categories;
CREATE POLICY "Public full access to categories"
ON public.categories
FOR ALL
USING (true)
WITH CHECK (true);

-- 4. Keep profiles user-specific (for security)
-- Profiles policies remain unchanged - users can only see/edit their own profile

-- =====================================================
-- SUMMARY:
-- ✅ All suppliers, projects, deals, quotes, tasks, activities, notes are now PUBLIC
-- ✅ Changes in mobile app will instantly appear on website
-- ✅ Changes on website will instantly appear in mobile app
-- ✅ No authentication required to view or edit (shared company database)
-- ✅ Profiles remain private and user-specific
-- =====================================================
