
-- Add full_plan_text column to strategy_profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'strategy_profiles'
        AND column_name = 'full_plan_text'
    ) THEN
        ALTER TABLE public.strategy_profiles ADD COLUMN full_plan_text TEXT;
    END IF;
END $$;
