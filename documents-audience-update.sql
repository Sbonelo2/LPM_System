-- Extend documents table to support system/targeted documents
alter table public.documents
  add column if not exists document_scope text default 'personal',
  add column if not exists target_user_ids uuid[],
  add column if not exists target_roles text[],
  add column if not exists uploaded_by uuid,
  add column if not exists review_owner_role text,
  add column if not exists review_status text,
  add column if not exists document_type text,
  add column if not exists storage_path text;

-- Allow users to view documents assigned to them (system/role/targeted)
drop policy if exists "Users can view assigned documents" on public.documents;
create policy "Users can view assigned documents"
  on public.documents
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or document_scope = 'system'
    or (target_user_ids is not null and auth.uid() = any(target_user_ids))
    or (
      target_roles is not null
      and exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role = any(target_roles)
      )
    )
    or (
      review_owner_role is not null
      and exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role = review_owner_role
      )
      and (
        review_owner_role <> 'mentor'
        or exists (
          select 1
          from public.learner_profiles lp
          where lp.user_id = documents.user_id
            and lp.mentor_id = auth.uid()
        )
      )
    )
  );

-- Allow uploaders to update their own documents
create policy "Users can update their own documents"
  on public.documents
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow reviewers (mentor/facilitator/super admin) to update assigned documents
drop policy if exists "Reviewers can update assigned documents" on public.documents;
create policy "Reviewers can update assigned documents"
  on public.documents
  for update
  to authenticated
  using (
    review_owner_role is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = review_owner_role
    )
    and (
      review_owner_role <> 'mentor'
      or exists (
        select 1
        from public.learner_profiles lp
        where lp.user_id = documents.user_id
          and lp.mentor_id = auth.uid()
      )
    )
  )
  with check (
    review_owner_role is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = review_owner_role
    )
    and (
      review_owner_role <> 'mentor'
      or exists (
        select 1
        from public.learner_profiles lp
        where lp.user_id = documents.user_id
          and lp.mentor_id = auth.uid()
      )
    )
  );
