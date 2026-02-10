-- Simple test to verify delete permissions work

-- First, let's see what documents exist and who owns them
SELECT 'Current documents:' as info;
SELECT id, user_id, file_name, created_at FROM documents ORDER BY created_at DESC LIMIT 5;

-- Check current authenticated user
SELECT 'Current user context:' as info;
SELECT auth.uid() as current_user_id, auth.role() as current_role;

-- Test if delete policy would allow deletion for each document
SELECT 'Delete permission test:' as info;
SELECT 
    id,
    user_id,
    file_name,
    (auth.uid() = user_id) as can_delete_based_on_policy,
    CASE 
        WHEN auth.uid() = user_id THEN 'DELETE ALLOWED'
        ELSE 'DELETE BLOCKED'
    END as delete_status
FROM documents 
ORDER BY created_at DESC LIMIT 5;

-- Check if RLS is actually enabled
SELECT 'RLS Status:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'documents';

-- Check existing delete policies
SELECT 'Delete policies:' as info;
SELECT policyname, cmd, roles, qual 
FROM pg_policies 
WHERE tablename = 'documents' AND cmd = 'DELETE';
