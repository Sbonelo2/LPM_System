-- Add mentor_id to learner_profiles to link learners with mentors
ALTER TABLE public.learner_profiles 
ADD COLUMN IF NOT EXISTS mentor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add a column to documents to indicate who uploaded it
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update documents table to handle template/fillable docs
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS is_template boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.documents(id) ON DELETE SET NULL;

-- Policy to allow mentors to view documents of their learners
CREATE POLICY "Mentors can view their learners' documents" ON public.documents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.learner_profiles
    WHERE public.learner_profiles.user_id = public.documents.user_id
    AND public.learner_profiles.mentor_id = auth.uid()
  )
);

-- Policy to allow mentors to insert documents for their learners
CREATE POLICY "Mentors can insert documents for their learners" ON public.documents
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.learner_profiles
    WHERE public.learner_profiles.user_id = public.documents.user_id
    AND public.learner_profiles.mentor_id = auth.uid()
  )
);

-- Policy to allow mentors to update documents of their learners
CREATE POLICY "Mentors can update their learners' documents" ON public.documents
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.learner_profiles
    WHERE public.learner_profiles.user_id = public.documents.user_id
    AND public.learner_profiles.mentor_id = auth.uid()
  )
);
