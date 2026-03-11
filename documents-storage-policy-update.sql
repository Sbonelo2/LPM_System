-- Allow authenticated users to upload images to their own folder in documents bucket
create policy "Allow authenticated users to upload images."
  on storage.objects
  for insert
  with check (
    bucket_id = 'documents' and
    auth.role() = 'authenticated' and
    split_part(name, '/', 1) = auth.uid()::text and
    lower(substring(name from '(?<=\.)[^.]+$')) in ('png', 'jpg', 'jpeg')
  );
