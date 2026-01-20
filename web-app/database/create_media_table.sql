-- Create app_assets table
create table if not exists public.app_assets (
  key text not null primary key,
  url text not null,
  title text,
  type text default 'image',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.app_assets enable row level security;

-- Policies for app_assets
drop policy if exists "Allow public read access" on public.app_assets;
create policy "Allow public read access"
  on public.app_assets for select
  using (true);

drop policy if exists "Allow authenticated insert" on public.app_assets;
create policy "Allow authenticated insert"
  on public.app_assets for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Allow authenticated update" on public.app_assets;
create policy "Allow authenticated update"
  on public.app_assets for update
  using (auth.role() = 'authenticated');

drop policy if exists "Allow authenticated delete" on public.app_assets;
create policy "Allow authenticated delete"
  on public.app_assets for delete
  using (auth.role() = 'authenticated');

-- Storage Bucket Setup (This usually needs to be done via dashboard or specific storage API, 
-- but we can try inserting into storage.buckets if permissions allow, or user must do it manually)
-- primarily we will assume 'media' bucket exists or we create it via client side if possible.
-- For now, we will handle table creation.
