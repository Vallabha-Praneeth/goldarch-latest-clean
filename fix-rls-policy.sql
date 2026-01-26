-- Allow public read access to suppliers for the landing page
CREATE POLICY "Public read access to suppliers"
ON public.suppliers
FOR SELECT
USING (true);

-- Allow public read access to categories
CREATE POLICY "Public read access to categories"
ON public.categories
FOR SELECT
USING (true);
