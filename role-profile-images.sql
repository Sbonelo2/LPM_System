-- Role profile images table (for mentor, facilitator, super admin, etc.)
create table if not exists public.role_profile_images (
  user_id uuid primary key references auth.users(id) on delete cascade,
  image_url text,
  updated_at timestamptz not null default now()
);

alter table public.role_profile_images enable row level security;

-- Allow users to read their own profile image
create policy "role_profile_images_select_own"
  on public.role_profile_images
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Allow users to insert their own profile image
create policy "role_profile_images_insert_own"
  on public.role_profile_images
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Allow users to update their own profile image
create policy "role_profile_images_update_own"
  on public.role_profile_images
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
