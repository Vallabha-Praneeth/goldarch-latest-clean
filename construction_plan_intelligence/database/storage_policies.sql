-- Construction Plan Intelligence - Storage Bucket Policies
-- Fix RLS for the 'plans' storage bucket

-- ============================================================================
-- STORAGE BUCKET POLICIES
-- ============================================================================

-- Allow authenticated users to upload to their own folder
-- Pattern: plans/{user_id}/*

-- 1. INSERT Policy - Allow users to upload files to their own folder
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'plans' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. SELECT Policy - Allow users to view their own files
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'plans' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. UPDATE Policy - Allow users to update their own files (optional)
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'plans' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. DELETE Policy - Allow users to delete their own files (optional)
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'plans' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check the policies were created
SELECT
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%own%';

-- ============================================================================
-- ALTERNATIVE: Disable RLS (simpler but less secure)
-- ============================================================================

/*
If the above policies don't work, you can disable RLS on the bucket entirely:

UPDATE storage.buckets
SET public = false,
    file_size_limit = 52428800,  -- 50MB
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
WHERE id = 'plans';

-- Then disable RLS (WARNING: Less secure, but works for testing)
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
*/
