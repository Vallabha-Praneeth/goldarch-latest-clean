-- Enable RLS on all key tables
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Public read suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can view their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can create their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can update their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can delete their own suppliers" ON public.suppliers;

-- Suppliers: Users can manage their own suppliers
CREATE POLICY "Users can view their own suppliers" 
ON public.suppliers FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own suppliers" 
ON public.suppliers FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suppliers" 
ON public.suppliers FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own suppliers" 
ON public.suppliers FOR DELETE 
USING (auth.uid() = user_id);

-- Projects: Users can manage their own projects
CREATE POLICY "Users can view their own projects" 
ON public.projects FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own projects" 
ON public.projects FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own projects" 
ON public.projects FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own projects" 
ON public.projects FOR DELETE 
USING (auth.uid() = owner_id);

-- Deals: Users can manage their own deals
CREATE POLICY "Users can view their own deals" 
ON public.deals FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own deals" 
ON public.deals FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own deals" 
ON public.deals FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own deals" 
ON public.deals FOR DELETE 
USING (auth.uid() = owner_id);

-- Quotes: Users can manage quotes for their deals
CREATE POLICY "Users can view quotes for their deals" 
ON public.quotes FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.deals 
    WHERE deals.id = quotes.deal_id 
    AND deals.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can create quotes for their deals" 
ON public.quotes FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.deals 
    WHERE deals.id = deal_id 
    AND deals.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update quotes for their deals" 
ON public.quotes FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.deals 
    WHERE deals.id = quotes.deal_id 
    AND deals.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete quotes for their deals" 
ON public.quotes FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.deals 
    WHERE deals.id = quotes.deal_id 
    AND deals.owner_id = auth.uid()
  )
);

-- Activities: Users can manage their own activities
CREATE POLICY "Users can view their own activities" 
ON public.activities FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activities" 
ON public.activities FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" 
ON public.activities FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" 
ON public.activities FOR DELETE 
USING (auth.uid() = user_id);

-- Tasks: Users can view tasks they created or are assigned to
CREATE POLICY "Users can view their tasks" 
ON public.tasks FOR SELECT 
USING (auth.uid() = created_by OR auth.uid() = assigned_to);

CREATE POLICY "Users can create tasks" 
ON public.tasks FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their tasks" 
ON public.tasks FOR UPDATE 
USING (auth.uid() = created_by OR auth.uid() = assigned_to);

CREATE POLICY "Users can delete their tasks" 
ON public.tasks FOR DELETE 
USING (auth.uid() = created_by);

-- Notes: Users can manage their own notes
CREATE POLICY "Users can view their own notes" 
ON public.notes FOR SELECT 
USING (auth.uid() = author_id);

CREATE POLICY "Users can create their own notes" 
ON public.notes FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own notes" 
ON public.notes FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own notes" 
ON public.notes FOR DELETE 
USING (auth.uid() = author_id);

-- Profiles: Users can view all profiles but only update their own
CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();