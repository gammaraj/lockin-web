-- Tempo: Supabase Database Schema
-- Run this in the Supabase SQL Editor to set up your tables.

-- ── Settings ──────────────────────────────────────────────────
create table if not exists public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  work_duration bigint not null default 1800000,
  break_duration bigint not null default 300000,
  inactivity_threshold bigint not null default 60000,
  daily_goal int not null default 3,
  auto_start_enabled boolean not null default true,
  notifications_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ── Daily Goal Data ───────────────────────────────────────────
create table if not exists public.daily_goal_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  date text not null,
  session_count int not null default 0,
  streak int not null default 0,
  last_streak_update text,
  updated_at timestamptz not null default now()
);

-- ── Streak History ────────────────────────────────────────────
create table if not exists public.streak_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date_key text not null,
  session_count int not null default 0,
  goal_met boolean not null default false,
  recorded_at bigint not null,
  unique(user_id, date_key)
);

-- ── Projects ──────────────────────────────────────────────────
create table if not exists public.projects (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at bigint not null default 0,
  primary key (user_id, id)
);

-- ── Tasks ─────────────────────────────────────────────────────
create table if not exists public.tasks (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  sessions int not null default 0,
  time_spent bigint not null default 0,
  created_at bigint not null,
  project_id text not null default '__general__',
  subtasks jsonb not null default '[]'::jsonb,
  primary key (user_id, id)
);

-- ── Selected Project ──────────────────────────────────────────
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  selected_project_id text not null default '__general__'
);

-- ── Row Level Security ────────────────────────────────────────
alter table public.settings enable row level security;
alter table public.daily_goal_data enable row level security;
alter table public.streak_history enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.user_preferences enable row level security;

-- Policies: users can only access their own data
create policy "Users can manage their own settings"
  on public.settings for all using (auth.uid() = user_id);

create policy "Users can manage their own daily goal data"
  on public.daily_goal_data for all using (auth.uid() = user_id);

create policy "Users can manage their own streak history"
  on public.streak_history for all using (auth.uid() = user_id);

create policy "Users can manage their own projects"
  on public.projects for all using (auth.uid() = user_id);

create policy "Users can manage their own tasks"
  on public.tasks for all using (auth.uid() = user_id);

create policy "Users can manage their own preferences"
  on public.user_preferences for all using (auth.uid() = user_id);
