
-- Add posting_frequency and creator_style columns to strategy_profiles table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'strategy_profiles' AND column_name = 'posting_frequency') THEN
        ALTER TABLE public.strategy_profiles ADD COLUMN posting_frequency TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'strategy_profiles' AND column_name = 'creator_style') THEN
        ALTER TABLE public.strategy_profiles ADD COLUMN creator_style TEXT;
    END IF;
END
$$;
