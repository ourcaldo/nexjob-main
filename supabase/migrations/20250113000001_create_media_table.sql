
-- Create media table for file management
create table if not exists public.nxdb_media (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  url text not null,
  name text not null,
  path text not null,
  size bigint not null,
  mime_type text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.nxdb_media enable row level security;

-- Policy: Users can only see their own media
create policy "Users can view own media" on public.nxdb_media
  for select using (auth.uid() = user_id);

-- Policy: Users can insert their own media
create policy "Users can insert own media" on public.nxdb_media
  for insert with check (auth.uid() = user_id);

-- Policy: Users can update their own media
create policy "Users can update own media" on public.nxdb_media
  for update using (auth.uid() = user_id);

-- Policy: Users can delete their own media
create policy "Users can delete own media" on public.nxdb_media
  for delete using (auth.uid() = user_id);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_nxdb_media_updated_at
  before update on public.nxdb_media
  for each row execute procedure public.handle_updated_at();

-- Create indexes for performance
create index if not exists nxdb_media_user_id_idx on public.nxdb_media(user_id);
create index if not exists nxdb_media_created_at_idx on public.nxdb_media(created_at desc);
