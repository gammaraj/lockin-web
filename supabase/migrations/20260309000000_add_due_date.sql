-- Add due_date column to tasks table
alter table public.tasks add column if not exists due_date text;
