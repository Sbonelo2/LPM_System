-- Check the user_id in your documents table
SELECT id, user_id, file_name FROM documents;

-- Get your current authenticated user ID
SELECT auth.uid();

-- Check if the document's user_id matches your user_id
-- Replace 'b6999d59-4e2f-4c8a-ad21-72a6db324b3d' with your actual user_id
SELECT 
  d.id,
  d.user_id AS document_owner,
  (SELECT auth.uid()) AS current_user,
  CASE 
    WHEN d.user_id = (SELECT auth.uid()) THEN 'MATCH - You can delete'
    ELSE 'MISMATCH - You cannot delete'
  END AS delete_status
FROM documents d;
