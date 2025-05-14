
// Helper functions for Supabase Edge Functions

// CORS headers for browser requests
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create database functions if they don't exist
export async function setupStrategyFunctions(supabase) {
  try {
    // Create strategy_deep_profile helper functions
    await supabase.rpc('execute_system_sql', {
      sql_string: `
        -- Function to get strategy deep profile
        CREATE OR REPLACE FUNCTION public.get_strategy_deep_profile(user_id_param UUID)
        RETURNS TABLE (id UUID, user_id UUID, data JSONB, created_at TIMESTAMPTZ)
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          RETURN QUERY
          SELECT * FROM public.strategy_deep_profile
          WHERE user_id = user_id_param
          ORDER BY created_at DESC
          LIMIT 1;
        END;
        $$;

        -- Function to save strategy deep profile
        CREATE OR REPLACE FUNCTION public.save_strategy_deep_profile(user_id_param UUID, data_param JSONB)
        RETURNS VOID
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          INSERT INTO public.strategy_deep_profile (user_id, data)
          VALUES (user_id_param, data_param);
        END;
        $$;
      `
    });

    // Create mission_map_plans helper functions
    await supabase.rpc('execute_system_sql', {
      sql_string: `
        -- Function to get mission map plan
        CREATE OR REPLACE FUNCTION public.get_mission_map_plan(user_id_param UUID)
        RETURNS TABLE (id UUID, user_id UUID, data JSONB, created_at TIMESTAMPTZ)
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          RETURN QUERY
          SELECT * FROM public.mission_map_plans
          WHERE user_id = user_id_param
          ORDER BY created_at DESC
          LIMIT 1;
        END;
        $$;

        -- Function to save mission map plan
        CREATE OR REPLACE FUNCTION public.save_mission_map_plan(user_id_param UUID, data_param JSONB)
        RETURNS VOID
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          INSERT INTO public.mission_map_plans (user_id, data)
          VALUES (user_id_param, data_param);
        END;
        $$;
      `
    });

    return true;
  } catch (err) {
    console.error("Error setting up strategy functions:", err);
    return false;
  }
}
