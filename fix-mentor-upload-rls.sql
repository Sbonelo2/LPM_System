-- FIX: Allow Mentors to upload documents for their learners

-- 1. DROP old conflicting policies if they exist (to ensure fresh state)
DROP POLICY IF EXISTS "Mentors can insert documents for their learners" ON public.documents;
DROP POLICY IF EXISTS "Mentors can view their learners' documents" ON public.documents;
DROP POLICY IF EXISTS "Mentors can update their learners' documents" ON public.documents;
DROP POLICY IF EXISTS "Mentors can upload to learner storage" ON storage.objects;

-- 2. UPDATE Documents Table Policies

-- INSERT: Allow mentors to insert rows for their assigned learners
CREATE POLICY "Mentors can insert documents for their learners" ON public.documents
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.learner_profiles
    WHERE public.learner_profiles.user_id = public.documents.user_id
    AND public.learner_profiles.mentor_id = auth.uid()
  )
);

-- SELECT: Allow mentors to see rows for their assigned learners
CREATE POLICY "Mentors can view their learners' documents" ON public.documents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.learner_profiles
    WHERE public.learner_profiles.user_id = public.documents.user_id
    AND public.learner_profiles.mentor_id = auth.uid()
  )
);

-- UPDATE: Allow mentors to update (approve) rows for their assigned learners
CREATE POLICY "Mentors can update their learners' documents" ON public.documents
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.learner_profiles
    WHERE public.learner_profiles.user_id = public.documents.user_id
    AND public.learner_profiles.mentor_id = auth.uid()
  )
);

-- 3. UPDATE Storage Policies (Crucial for the actual file upload)

-- Storage INSERT: Allow mentors to upload to the learner's folder
-- The path format used in code is: `${learner_user_id}/mentor_uploads/${fileName}`
CREATE POLICY "Mentors can upload to learner storage" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.learner_profiles
    WHERE public.learner_profiles.user_id::text = split_part(name, '/', 1)
    AND public.learner_profiles.mentor_id = auth.uid()
  )
);

-- Storage SELECT: Allow mentors to view files in learner's folder
CREATE POLICY "Mentors can view learner storage" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.learner_profiles
    WHERE public.learner_profiles.user_id::text = split_part(name, '/', 1)
    AND public.learner_profiles.mentor_id = auth.uid()
  )
);

-- 4. Reload schema cache
NOTIFY pgrst, 'reload schema';
