create extension if not exists pgcrypto;

create or replace function lib_hospital.is_atlas_editor()
returns boolean
language sql
stable
security definer
set search_path = lib_hospital, pg_temp
as $$
  select exists (
    select 1
    from lib_hospital.profiles
    where user_id = auth.uid()
      and role in ('admin', 'editor')
  );
$$;

revoke all on function lib_hospital.is_atlas_editor() from public;
revoke all on function lib_hospital.is_atlas_editor() from anon;
grant execute on function lib_hospital.is_atlas_editor() to authenticated;

-- Profile roles control privileged application actions. Users may edit their
-- display name, while role changes must pass the admin check below.
revoke update on table lib_hospital.profiles from authenticated;
grant update (display_name, updated_at) on lib_hospital.profiles to authenticated;

create or replace function lib_hospital.set_user_role(
  target_user_id uuid,
  new_role lib_hospital.app_role
)
returns void
language plpgsql
security definer
set search_path = lib_hospital, pg_temp
as $$
begin
  if not exists (
    select 1
    from lib_hospital.profiles
    where user_id = auth.uid()
      and role = 'admin'
  ) then
    raise exception 'Only administrators may change user roles'
      using errcode = '42501';
  end if;

  update lib_hospital.profiles
  set role = new_role,
      updated_at = now()
  where user_id = target_user_id;

  if not found then
    raise exception 'User profile not found'
      using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function lib_hospital.set_user_role(uuid, lib_hospital.app_role) from public;
revoke all on function lib_hospital.set_user_role(uuid, lib_hospital.app_role) from anon;
grant execute on function lib_hospital.set_user_role(uuid, lib_hospital.app_role) to authenticated;

create table if not exists lib_hospital.atlas_image_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id text not null,
  image_url text not null check (image_url ~ '^https?://'),
  source_url text check (source_url is null or source_url ~ '^https?://'),
  source_label text,
  is_shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, case_id)
);

create table if not exists lib_hospital.atlas_custom_cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chapter text not null,
  diagnosis_vi text not null,
  diagnosis_en text,
  image_url text check (image_url is null or image_url ~ '^https?://'),
  source_url text check (source_url is null or source_url ~ '^https?://'),
  source_label text,
  microscopic_features_vi text[] not null default '{}',
  microscopic_features_en text[] not null default '{}',
  memory_point_vi text,
  memory_point_en text,
  pitfall_vi text,
  pitfall_en text,
  markers text[] not null default '{}',
  icdo_code text,
  who_url text check (who_url is null or who_url ~ '^https?://'),
  pathology_outlines_url text check (pathology_outlines_url is null or pathology_outlines_url ~ '^https?://'),
  is_shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table lib_hospital.atlas_image_overrides enable row level security;
alter table lib_hospital.atlas_custom_cases enable row level security;

drop policy if exists "atlas overrides read" on lib_hospital.atlas_image_overrides;
create policy "atlas overrides read"
on lib_hospital.atlas_image_overrides
for select to authenticated
using (user_id = auth.uid() or is_shared);

drop policy if exists "atlas overrides insert own" on lib_hospital.atlas_image_overrides;
create policy "atlas overrides insert own"
on lib_hospital.atlas_image_overrides
for insert to authenticated
with check (
  user_id = auth.uid()
  and (not is_shared or lib_hospital.is_atlas_editor())
);

drop policy if exists "atlas overrides update own" on lib_hospital.atlas_image_overrides;
create policy "atlas overrides update own"
on lib_hospital.atlas_image_overrides
for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and (not is_shared or lib_hospital.is_atlas_editor())
);

drop policy if exists "atlas overrides delete own" on lib_hospital.atlas_image_overrides;
create policy "atlas overrides delete own"
on lib_hospital.atlas_image_overrides
for delete to authenticated
using (user_id = auth.uid());

drop policy if exists "atlas custom cases read" on lib_hospital.atlas_custom_cases;
create policy "atlas custom cases read"
on lib_hospital.atlas_custom_cases
for select to authenticated
using (user_id = auth.uid() or is_shared);

drop policy if exists "atlas custom cases insert own" on lib_hospital.atlas_custom_cases;
create policy "atlas custom cases insert own"
on lib_hospital.atlas_custom_cases
for insert to authenticated
with check (
  user_id = auth.uid()
  and (not is_shared or lib_hospital.is_atlas_editor())
);

drop policy if exists "atlas custom cases update own" on lib_hospital.atlas_custom_cases;
create policy "atlas custom cases update own"
on lib_hospital.atlas_custom_cases
for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and (not is_shared or lib_hospital.is_atlas_editor())
);

drop policy if exists "atlas custom cases delete own" on lib_hospital.atlas_custom_cases;
create policy "atlas custom cases delete own"
on lib_hospital.atlas_custom_cases
for delete to authenticated
using (user_id = auth.uid());

grant select, insert, update, delete on lib_hospital.atlas_image_overrides to authenticated;
grant select, insert, update, delete on lib_hospital.atlas_custom_cases to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'atlas-images',
  'atlas-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "atlas images public read" on storage.objects;
create policy "atlas images public read"
on storage.objects
for select
using (bucket_id = 'atlas-images');

drop policy if exists "atlas images insert own folder" on storage.objects;
create policy "atlas images insert own folder"
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'atlas-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "atlas images update own folder" on storage.objects;
create policy "atlas images update own folder"
on storage.objects
for update to authenticated
using (
  bucket_id = 'atlas-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'atlas-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "atlas images delete own folder" on storage.objects;
create policy "atlas images delete own folder"
on storage.objects
for delete to authenticated
using (
  bucket_id = 'atlas-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
