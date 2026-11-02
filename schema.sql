-- ========================================================
-- MyWealth: PostgreSQL Schema & Realtime Setup for Supabase
-- Paste and run this in Supabase -> SQL Editor -> New Query
-- ========================================================

-- 1. Create the users table (clean: username + password only, no gender)
create table if not exists public.users (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  password text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create the assets table
create table if not exists public.assets (
  id uuid default gen_random_uuid() primary key,
  username text,
  name text not null,
  category text not null,
  quantity numeric not null default 0,
  buy_price numeric not null default 0,
  current_price numeric not null default 0,
  currency text not null default 'INR',
  broker_app text,
  is_sip boolean default false,
  sip_amount numeric default 0,
  sip_day integer default 5,
  last_sip_date text,
  sip_status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Database Cleanup & Migration: Remove gender column if it was ever present
alter table if exists public.users drop column if exists gender;
alter table if exists public.assets drop column if exists gender;

-- 4. Ensure recent columns exist for existing deployments
alter table if exists public.assets add column if not exists username text;
alter table if exists public.assets add column if not exists broker_app text;
alter table if exists public.assets add column if not exists is_sip boolean default false;
alter table if exists public.assets add column if not exists sip_amount numeric default 0;
alter table if exists public.assets add column if not exists sip_day integer default 5;
alter table if exists public.assets add column if not exists last_sip_date text;
alter table if exists public.assets add column if not exists sip_status text default 'active';

-- 5. Enable Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.assets enable row level security;

-- 6. Allow public access policies (matching app-level authentication)
drop policy if exists "Allow all actions for public" on public.assets;
create policy "Allow all actions for public" on public.assets
  for all using (true) with check (true);

drop policy if exists "Allow all actions for public users" on public.users;
create policy "Allow all actions for public users" on public.users
  for all using (true) with check (true);

-- 7. Enable Realtime Replication on tables
alter publication supabase_realtime add table public.assets;
alter table public.assets replica identity full;
