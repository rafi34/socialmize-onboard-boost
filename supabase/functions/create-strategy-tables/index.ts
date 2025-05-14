
// Supabase Edge Function to create strategy tables
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.22.0";
import { corsHeaders } from "../utils.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { createDeepProfile, createMissionMap } = await req.json();

    console.log("Creating tables:", { createDeepProfile, createMissionMap });

    let result = { 
      success: true,
      deepProfile: false,
      missionMap: false,
      error: null
    };

    if (createDeepProfile) {
      try {
        // Create strategy_deep_profile table if it doesn't exist
        await supabase.rpc('execute_system_sql', {
          sql_string: `
            CREATE TABLE IF NOT EXISTS public.strategy_deep_profile (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL REFERENCES auth.users(id),
              data JSONB NOT NULL,
              created_at TIMESTAMPTZ DEFAULT now()
            );

            ALTER TABLE public.strategy_deep_profile ENABLE ROW LEVEL SECURITY;

            DROP POLICY IF EXISTS "Users can view their own profile" ON public.strategy_deep_profile;
            CREATE POLICY "Users can view their own profile"
              ON public.strategy_deep_profile
              FOR SELECT
              USING (auth.uid() = user_id);

            DROP POLICY IF EXISTS "Users can insert their own profile" ON public.strategy_deep_profile;
            CREATE POLICY "Users can insert their own profile"
              ON public.strategy_deep_profile
              FOR INSERT
              WITH CHECK (auth.uid() = user_id);
          `
        });
        result.deepProfile = true;
      } catch (err) {
        console.error("Error creating strategy_deep_profile table:", err);
      }
    }

    if (createMissionMap) {
      try {
        // Create mission_map_plans table if it doesn't exist
        await supabase.rpc('execute_system_sql', {
          sql_string: `
            CREATE TABLE IF NOT EXISTS public.mission_map_plans (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL REFERENCES auth.users(id),
              data JSONB NOT NULL,
              created_at TIMESTAMPTZ DEFAULT now()
            );

            ALTER TABLE public.mission_map_plans ENABLE ROW LEVEL SECURITY;

            DROP POLICY IF EXISTS "Users can view their own mission maps" ON public.mission_map_plans;
            CREATE POLICY "Users can view their own mission maps"
              ON public.mission_map_plans
              FOR SELECT
              USING (auth.uid() = user_id);

            DROP POLICY IF EXISTS "Users can insert their own mission maps" ON public.mission_map_plans;
            CREATE POLICY "Users can insert their own mission maps"
              ON public.mission_map_plans
              FOR INSERT
              WITH CHECK (auth.uid() = user_id);
          `
        });
        result.missionMap = true;
      } catch (err) {
        console.error("Error creating mission_map_plans table:", err);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in create-strategy-tables function:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
