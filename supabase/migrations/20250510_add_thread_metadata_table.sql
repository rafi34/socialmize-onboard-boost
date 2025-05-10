
-- Create a new table for thread metadata
CREATE TABLE IF NOT EXISTS public.thread_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  metadata JSONB
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS thread_metadata_user_id_idx ON public.thread_metadata (user_id);
CREATE INDEX IF NOT EXISTS thread_metadata_status_idx ON public.thread_metadata (status);

-- Add RLS policies
ALTER TABLE public.thread_metadata ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own threads
CREATE POLICY thread_metadata_select ON public.thread_metadata 
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own threads
CREATE POLICY thread_metadata_insert ON public.thread_metadata 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own threads
CREATE POLICY thread_metadata_update ON public.thread_metadata 
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow service role to do everything
CREATE POLICY thread_metadata_service ON public.thread_metadata 
  FOR ALL USING (true);
