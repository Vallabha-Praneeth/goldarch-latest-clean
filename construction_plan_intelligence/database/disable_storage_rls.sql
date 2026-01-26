-- Temporary fix: Disable RLS on storage for the plans bucket
-- This allows authenticated users to upload files
-- For production, you'll want proper RLS policies

-- Option 1: Keep RLS enabled but add a permissive policy for authenticated users
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'plans')
WITH CHECK (bucket_id = 'plans');

-- Verify the policy
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage';
