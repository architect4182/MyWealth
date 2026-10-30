-- ========================================================
-- MyWealth: PostgreSQL Schema & Realtime Setup for Supabase
-- Paste and run this in Supabase -> SQL Editor -> New Query
-- ========================================================

-- 1. Create the assets table
create table if not exists public.assets (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text not null,
  quantity numeric not null default 0,
  buy_price numeric not null default 0,
  current_price numeric not null default 0,
  currency text not null default 'INR',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.assets enable row level security;

-- 3. Policy to allow reading, inserting, updating, and deleting
create policy "Allow all actions for public" on public.assets
  for all using (true) with check (true);

-- 4. Enable Realtime Replication on the assets table
alter publication supabase_realtime add table public.assets;
alter table public.assets replica identity full;

