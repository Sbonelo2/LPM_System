-- Check table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'documents';

-- Check existing policies on documents table
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'documents';

-- Check storage policies
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'objects';

-- Drop existing delete policies if they exist
DROP POLICY IF EXISTS "Allow users to delete their own documents" ON public.documents;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own documents" ON public.documents;

-- Drop storage delete policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to delete their own documents in storage" ON storage.objects;

-- Create DELETE policy for documents table
CREATE POLICY "Allow users to delete their own documents"
ON public.documents
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create DELETE policy for storage objects
CREATE POLICY "Allow authenticated users to delete their own documents in storage"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'documents' AND
    auth.uid()::text = split_part(name, '/', 1)
);

-- Verify the policies were created
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'documents' AND cmd = 'DELETE';

SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'objects' AND cmd = 'DELETE';
