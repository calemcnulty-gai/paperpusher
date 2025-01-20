-- Enable necessary extensions
create extension if not exists "vector" with schema "public";

-- Create enum types for ticket status and priority
create type ticket_status as enum ('open', 'pending', 'resolved', 'closed');
create type ticket_priority as enum ('low', 'medium', 'high', 'urgent');

-- Create profiles table that extends auth.users
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text check (role in ('admin', 'agent', 'customer')),
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create teams table
create table teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create team_members junction table
create table team_members (
  team_id uuid references teams on delete cascade,
  user_id uuid references profiles on delete cascade,
  role text check (role in ('leader', 'member')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (team_id, user_id)
);

-- Create tickets table
create table tickets (
  id uuid default gen_random_uuid() primary key,
  subject text not null,
  description text,
  status ticket_status default 'open' not null,
  priority ticket_priority default 'medium' not null,
  customer_id uuid references profiles(id) not null,
  assigned_to uuid references profiles(id),
  team_id uuid references teams(id),
  custom_fields jsonb default '{}'::jsonb,
  tags text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create ticket_messages table for conversation history
create table ticket_messages (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references tickets on delete cascade not null,
  sender_id uuid references profiles(id) not null,
  message text not null,
  is_internal boolean default false,
  attachments jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create knowledge_articles table
create table knowledge_articles (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  author_id uuid references profiles(id) not null,
  category text,
  tags text[],
  embedding vector(1536),
  published boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create audit_logs table
create table audit_logs (
  id uuid default gen_random_uuid() primary key,
  table_name text not null,
  record_id uuid not null,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  actor_id uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table profiles enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table tickets enable row level security;
alter table ticket_messages enable row level security;
alter table knowledge_articles enable row level security;
alter table audit_logs enable row level security;

-- Basic RLS policies (these should be refined based on specific requirements)
create policy "Public profiles are viewable by everyone"
on profiles for select
to authenticated
using (true);

create policy "Users can update their own profile"
on profiles for update
to authenticated
using (auth.uid() = id);

create policy "Tickets are viewable by assigned team members and ticket owner"
on tickets for select
to authenticated
using (
  auth.uid() = customer_id
  or auth.uid() = assigned_to
  or exists (
    select 1 from team_members
    where team_id = tickets.team_id
    and user_id = auth.uid()
  )
);

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

create trigger update_teams_updated_at
  before update on teams
  for each row
  execute function update_updated_at_column();

create trigger update_tickets_updated_at
  before update on tickets
  for each row
  execute function update_updated_at_column();

create trigger update_knowledge_articles_updated_at
  before update on knowledge_articles
  for each row
  execute function update_updated_at_column();

-- Create function to log changes
create or replace function log_changes()
returns trigger as $$
begin
  insert into audit_logs (table_name, record_id, action, old_data, new_data, actor_id)
  values (
    TG_TABLE_NAME,
    coalesce(new.id, old.id),
    TG_OP,
    case when TG_OP = 'DELETE' then row_to_json(old) else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then row_to_json(new) else null end,
    auth.uid()
  );
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- Create audit triggers
create trigger audit_profiles
  after insert or update or delete on profiles
  for each row execute function log_changes();

create trigger audit_tickets
  after insert or update or delete on tickets
  for each row execute function log_changes();

create trigger audit_ticket_messages
  after insert or update or delete on ticket_messages
  for each row execute function log_changes();