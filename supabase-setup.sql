-- Create the documents table
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read their own documents and public documents
CREATE POLICY "Users can view their own documents." ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow uploaders to insert documents
CREATE POLICY "Only authenticated users can upload documents." ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow authenticated users to delete their own documents
CREATE POLICY "Allow authenticated users to delete their own documents." ON public.documents
  FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage security for the 'documents' bucket
-- Allow authenticated users to upload PDF files to their own folder
CREATE POLICY "Allow authenticated users to upload PDFs." ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    auth.role() = 'authenticated' AND
    -- Ensure the path starts with the user's ID
    split_part(name, '/', 1) = auth.uid()::text AND
    -- Ensure the file is a PDF
    lower(substring(name from '(?<=\.)[^.]+$')) = 'pdf'
  );

-- Allow authenticated users to view all documents in the 'documents' bucket
CREATE POLICY "Allow authenticated users to view documents." ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    auth.role() = 'authenticated'
  );

-- Allow authenticated users to delete their own documents
CREATE POLICY "Allow authenticated users to delete their own documents in storage." ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND
    auth.uid()::text = split_part(name, '/', 1)
  );
