-- Create assistant_threads table to track OpenAI Assistant conversations
CREATE TABLE IF NOT EXISTS assistant_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL DEFAULT 'content_plan',
  assistant_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(thread_id),
  UNIQUE(user_id, purpose)
);

-- Create assistant_messages table to store message history
CREATE TABLE IF NOT EXISTS assistant_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE(message_id)
);

-- Create content_plans table for storing 30-day content plans
CREATE TABLE IF NOT EXISTS content_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Format: YYYY-MM
  summary TEXT,
  mission TEXT,
  weekly_objective TEXT,
  content_schedule JSONB,
  content_ideas JSONB,
  thread_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(user_id, month, is_active)
);

-- Create strategy_generation_jobs table to track job status
CREATE TABLE IF NOT EXISTS strategy_generation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'expired')),
  strategy_type TEXT NOT NULL DEFAULT 'starter',
  is_regen BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Add job_id column to strategy_profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                WHERE table_name = 'strategy_profiles' AND column_name = 'job_id') THEN
    ALTER TABLE strategy_profiles ADD COLUMN job_id TEXT;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assistant_threads_user_id ON assistant_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_assistant_messages_thread_id ON assistant_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_assistant_messages_user_id ON assistant_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_content_plans_user_id ON content_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_content_plans_month ON content_plans(month);
CREATE INDEX IF NOT EXISTS idx_strategy_generation_jobs_user_id ON strategy_generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_strategy_generation_jobs_job_id ON strategy_generation_jobs(job_id);

-- Add RLS policies
ALTER TABLE assistant_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for assistant_threads
CREATE POLICY "Users can view their own threads" 
  ON assistant_threads FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all threads" 
  ON assistant_threads FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create policies for assistant_messages
CREATE POLICY "Users can view their own messages" 
  ON assistant_messages FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all messages" 
  ON assistant_messages FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create policies for content_plans
CREATE POLICY "Users can view their own content plans" 
  ON content_plans FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own content plans" 
  ON content_plans FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all content plans" 
  ON content_plans FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create policies for strategy_generation_jobs
CREATE POLICY "Users can view their own jobs" 
  ON strategy_generation_jobs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all jobs" 
  ON strategy_generation_jobs FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');
