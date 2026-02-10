-- Comprehensive diagnostic script for delete issues

-- 1. Check if RLS is enabled on documents table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'documents';

-- 2. Check all policies on documents table
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'documents';

-- 3. Check all policies on storage.objects table
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects';

-- 4. Test current user permissions
SELECT 
    current_user as current_user,
    auth.uid() as current_auth_uid,
    auth.role() as current_auth_role;

-- 5. Check if user has any documents
SELECT id, user_id, file_name, created_at
FROM documents 
LIMIT 5;

-- 6. Try to simulate delete permission check
-- This will show if the policy condition would match
SELECT 
    id, 
    user_id,
    file_name,
    (auth.uid() = user_id) as can_delete,
    CASE 
        WHEN auth.uid() = user_id THEN 'Can delete'
        ELSE 'Cannot delete'
    END as delete_permission
FROM documents 
LIMIT 5;

-- 7. Check storage bucket exists
SELECT * FROM storage.buckets WHERE name = 'documents';

-- 8. Check storage objects
SELECT bucket_id, name, created_at, owner_id
FROM storage.objects 
WHERE bucket_id = 'documents'
LIMIT 5;
