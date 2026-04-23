-- Run this in the Supabase SQL editor (Dashboard > SQL Editor > New query).
-- Creates the videos table, the storage bucket, and open RLS policies for the
-- films-night use case (trusted room, no auth). Tighten if you ever expose this.

create extension if not exists "pgcrypto";

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  uploader_name text not null,
  storage_path text not null,
  video_url text not null,
  position double precision not null,
  created_at timestamptz not null default now()
);

create index if not exists videos_position_idx on public.videos (position);

alter table public.videos enable row level security;

drop policy if exists "videos anon read" on public.videos;
create policy "videos anon read" on public.videos for select using (true);

drop policy if exists "videos anon insert" on public.videos;
create policy "videos anon insert" on public.videos for insert with check (true);

drop policy if exists "videos anon update" on public.videos;
create policy "videos anon update" on public.videos for update using (true) with check (true);

drop policy if exists "videos anon delete" on public.videos;
create policy "videos anon delete" on public.videos for delete using (true);

-- Storage bucket for the clips. Public read so the <video> tag can stream them.
insert into storage.buckets (id, name, public)
  values ('films', 'films', true)
  on conflict (id) do update set public = excluded.public;

drop policy if exists "films anon read" on storage.objects;
create policy "films anon read" on storage.objects for select
  using (bucket_id = 'films');

drop policy if exists "films anon insert" on storage.objects;
create policy "films anon insert" on storage.objects for insert
  with check (bucket_id = 'films');

drop policy if exists "films anon delete" on storage.objects;
create policy "films anon delete" on storage.objects for delete
  using (bucket_id = 'films');
