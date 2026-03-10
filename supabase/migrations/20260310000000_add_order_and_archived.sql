-- Add order and archived_at columns to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS "order" int;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS archived_at bigint;
