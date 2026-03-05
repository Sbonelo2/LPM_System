-- Learner backend setup for profile + placements

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
as $$
  select
    coalesce(
      auth.jwt() ->> 'role',
      auth.jwt() -> 'app_metadata' ->> 'role',
      auth.jwt() -> 'user_metadata' ->> 'role',
      ''
    ) = 'super_admin'
    or coalesce(lower(auth.email()), '') = 'office@admin.com';
$$;

-- Create profiles table if not exists
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text default 'learner',
  created_at timestamp with time zone default now()
);

-- Create learner_profiles table
create table if not exists public.learner_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  learner_name text,
  email text,
  learner_address text,
  learner_identifier text,
  programme text default 'Software Development',
  profile_image_url text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Create learner_placements table
create table if not exists public.learner_placements (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references auth.users(id) on delete cascade,
  host_name text not null,
  program text not null,
  status text not null default 'Pending',
  start_date date,
  end_date date,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Create triggers for updated_at
drop trigger if exists learner_profiles_set_updated_at on public.learner_profiles;
create trigger learner_profiles_set_updated_at
before update on public.learner_profiles
for each row execute function public.set_updated_at();

drop trigger if exists learner_placements_set_updated_at on public.learner_placements;
create trigger learner_placements_set_updated_at
before update on public.learner_placements
for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.learner_profiles enable row level security;
alter table public.learner_placements enable row level security;

-- Profiles policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
using (id = auth.uid());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
with check (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Super admin can view all profiles" on public.profiles;
create policy "Super admin can view all profiles"
on public.profiles
for select
using (public.is_super_admin());

drop policy if exists "Super admin can update profiles" on public.profiles;
create policy "Super admin can update profiles"
on public.profiles
for update
using (public.is_super_admin())
with check (public.is_super_admin());

-- Learner profiles policies
drop policy if exists "Learner can view own profile" on public.learner_profiles;
create policy "Learner can view own profile"
on public.learner_profiles
for select
using (user_id = auth.uid());

drop policy if exists "Learner can insert own profile" on public.learner_profiles;
create policy "Learner can insert own profile"
on public.learner_profiles
for insert
with check (user_id = auth.uid());

drop policy if exists "Learner can update own profile" on public.learner_profiles;
create policy "Learner can update own profile"
on public.learner_profiles
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Super admin can view learner profiles" on public.learner_profiles;
create policy "Super admin can view learner profiles"
on public.learner_profiles
for select
using (public.is_super_admin());

drop policy if exists "Super admin can update learner profiles" on public.learner_profiles;
create policy "Super admin can update learner profiles"
on public.learner_profiles
for update
using (public.is_super_admin())
with check (public.is_super_admin());

-- Learner placements policies
drop policy if exists "Learner can view own placements" on public.learner_placements;
create policy "Learner can view own placements"
on public.learner_placements
for select
using (learner_id = auth.uid());

drop policy if exists "Learner can insert own placements" on public.learner_placements;
create policy "Learner can insert own placements"
on public.learner_placements
for insert
with check (learner_id = auth.uid());

drop policy if exists "Learner can update own placements" on public.learner_placements;
create policy "Learner can update own placements"
on public.learner_placements
for update
using (learner_id = auth.uid())
with check (learner_id = auth.uid());

drop policy if exists "Super admin can view learner placements" on public.learner_placements;
create policy "Super admin can view learner placements"
on public.learner_placements
for select
using (public.is_super_admin());

drop policy if exists "Super admin can update learner placements" on public.learner_placements;
create policy "Super admin can update learner placements"
on public.learner_placements
for update
using (public.is_super_admin())
with check (public.is_super_admin());

-- Notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  details text,
  read boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  can_reply boolean not null default false,
  created_at timestamp with time zone not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
on public.notifications
for select
using (user_id = auth.uid());

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
on public.notifications
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can insert own notifications" on public.notifications;
create policy "Users can insert own notifications"
on public.notifications
for insert
with check (user_id = auth.uid());

drop policy if exists "Super admin can view all notifications" on public.notifications;
create policy "Super admin can view all notifications"
on public.notifications
for select
using (public.is_super_admin());

drop policy if exists "Super admin can create notifications" on public.notifications;
create policy "Super admin can create notifications"
on public.notifications
for insert
with check (public.is_super_admin());

drop policy if exists "Super admin can update notifications" on public.notifications;
create policy "Super admin can update notifications"
on public.notifications
for update
using (public.is_super_admin())
with check (public.is_super_admin());

-- Notification replies table
create table if not exists public.notification_replies (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reply_text text not null,
  created_at timestamp with time zone not null default now()
);

alter table public.notification_replies enable row level security;

drop policy if exists "Users can view notification replies" on public.notification_replies;
create policy "Users can view notification replies"
on public.notification_replies
for select
using (
  exists (
    select 1
    from public.notifications n
    where n.id = notification_replies.notification_id
      and (n.user_id = auth.uid() or n.created_by = auth.uid() or public.is_super_admin())
  )
);

drop policy if exists "Users can insert notification replies" on public.notification_replies;
create policy "Users can insert notification replies"
on public.notification_replies
for insert
with check (
  exists (
    select 1
    from public.notifications n
    where n.id = notification_replies.notification_id
      and (
        public.is_super_admin()
        or n.created_by = auth.uid()
        or (n.user_id = auth.uid() and n.can_reply = true)
      )
  )
  and notification_replies.user_id = auth.uid()
);

-- Host organizations table
create table if not exists public.host_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text not null default 'General',
  location text,
  contact_person text,
  email text,
  phone text,
  capacity integer not null default 0 check (capacity >= 0),
  status text not null default 'Pending' check (status in ('Active', 'Pending', 'Rejected')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

drop trigger if exists host_organizations_set_updated_at on public.host_organizations;
create trigger host_organizations_set_updated_at
before update on public.host_organizations
for each row execute function public.set_updated_at();

alter table public.host_organizations enable row level security;

drop policy if exists "Users can view host organizations" on public.host_organizations;
create policy "Users can view host organizations"
on public.host_organizations
for select
using (true);

drop policy if exists "Super admin can manage host organizations" on public.host_organizations;
create policy "Super admin can manage host organizations"
on public.host_organizations
for all
using (public.is_super_admin())
with check (public.is_super_admin());

-- Documents table
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  storage_path text,
  document_type text,
  review_owner_role text not null default 'mentor',
  review_status text not null default 'pending',
  mentor_feedback text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

alter table public.documents enable row level security;

drop policy if exists "Learner can view own documents" on public.documents;
create policy "Learner can view own documents"
on public.documents
for select
using (user_id = auth.uid());

drop policy if exists "Learner can insert own documents" on public.documents;
create policy "Learner can insert own documents"
on public.documents
for insert
with check (user_id = auth.uid());

drop policy if exists "Learner can update own documents" on public.documents;
create policy "Learner can update own documents"
on public.documents
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Learner can delete own documents" on public.documents;
create policy "Learner can delete own documents"
on public.documents
for delete
using (user_id = auth.uid());

drop policy if exists "Super admin can view all documents" on public.documents;
create policy "Super admin can view all documents"
on public.documents
for select
using (public.is_super_admin());

drop policy if exists "Super admin can review documents" on public.documents;
create policy "Super admin can review documents"
on public.documents
for update
using (public.is_super_admin())
with check (public.is_super_admin());

-- Storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
drop policy if exists "Users can upload documents" on storage.objects;
create policy "Users can upload documents" on storage.objects
  for insert with check (
    bucket_id = 'documents' and
    auth.role() = 'authenticated' and
    split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Users can view documents" on storage.objects;
create policy "Users can view documents" on storage.objects
  for select using (
    bucket_id = 'documents' and
    auth.role() = 'authenticated'
  );

drop policy if exists "Users can delete own documents" on storage.objects;
create policy "Users can delete own documents" on storage.objects
  for delete using (
    bucket_id = 'documents' and
    auth.uid()::text = split_part(name, '/', 1)
  );

-- Add realtime (safely - only if not already added)
do $$
begin
  -- Check and add documents table
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'documents'
  ) then
    alter publication supabase_realtime add table public.documents;
  end if;

  -- Check and add notifications table
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;

  -- Check and add host_organizations table
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'host_organizations'
  ) then
    alter publication supabase_realtime add table public.host_organizations;
  end if;

  -- Check and add learner_placements table
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'learner_placements'
  ) then
    alter publication supabase_realtime add table public.learner_placements;
  end if;

  -- Check and add profiles table
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;

  -- Check and add notification_replies table
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'notification_replies'
  ) then
    alter publication supabase_realtime add table public.notification_replies;
  end if;
end $$;

