-- Complete fix for document deletion issues

-- First, let's see what we're working with
SELECT 'Current policies on documents table:' as info;
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'documents';

-- Drop ALL existing policies on documents table to start fresh
DROP POLICY IF EXISTS "Users can view their own documents." ON public.documents;
DROP POLICY IF EXISTS "Only authenticated users can upload documents." ON public.documents;
DROP POLICY IF EXISTS "Allow users to delete their own documents" ON public.documents;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own documents" ON public.documents;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own documents." ON public.documents;

-- Recreate all policies with correct syntax
-- 1. SELECT policy - users can view their own documents
CREATE POLICY "Users can view their own documents" ON public.documents
    FOR SELECT USING (auth.uid() = user_id);

-- 2. INSERT policy - users can upload their own documents  
CREATE POLICY "Only authenticated users can upload documents" ON public.documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. DELETE policy - users can delete their own documents
CREATE POLICY "Allow users to delete their own documents" ON public.documents
    FOR DELETE USING (auth.uid() = user_id);

-- Verify the policies were created correctly
SELECT 'Updated policies on documents table:' as info;
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'documents';

-- Now fix storage policies
SELECT 'Current storage policies:' as info;
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'objects';

-- Drop existing storage policies
DROP POLICY IF EXISTS "Allow authenticated users to upload PDFs." ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view documents." ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own documents in storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own documents in storage." ON storage.objects;

-- Recreate storage policies
-- 1. INSERT policy for uploads
CREATE POLICY "Allow authenticated users to upload PDFs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents' AND
        auth.role() = 'authenticated' AND
        split_part(name, '/', 1) = auth.uid()::text AND
        lower(substring(name from '(?<=\.)[^.]+$')) = 'pdf'
    );

-- 2. SELECT policy for viewing
CREATE POLICY "Allow authenticated users to view documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents' AND
        auth.role() = 'authenticated'
    );

-- 3. DELETE policy for storage
CREATE POLICY "Allow authenticated users to delete their own documents in storage" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'documents' AND
        auth.uid()::text = split_part(name, '/', 1)
    );

-- Verify storage policies
SELECT 'Updated storage policies:' as info;
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'objects';

-- Test the setup by checking a sample document
SELECT 'Sample documents and delete permission check:' as info;
SELECT 
    id, 
    user_id,
    file_name,
    (auth.uid() = user_id) as can_delete
FROM documents 
LIMIT 3;

-- Final verification
SELECT 'RLS enabled status:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'documents';
