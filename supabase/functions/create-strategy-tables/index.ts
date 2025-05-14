
import { serve } from "https://deno.land/std@0.195.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { corsHeaders, setupStrategyFunctions } from "../utils.ts";

// Get environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { createDeepProfile, createMissionMap } = await req.json();

    // Initialize the Supabase client with service key for full admin privileges
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Set up the helper functions for strategy data
    await setupStrategyFunctions(supabase);
    
    // Create necessary tables
    if (createDeepProfile) {
      const { error: deepProfileError } = await supabase.rpc('create_strategy_deep_profile_table');
      
      if (deepProfileError) {
        console.error("Error creating strategy_deep_profile table:", deepProfileError);
        return new Response(
          JSON.stringify({ success: false, error: deepProfileError.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
    }
    
    if (createMissionMap) {
      const { error: missionMapError } = await supabase.rpc('create_mission_map_plans_table');
      
      if (missionMapError) {
        console.error("Error creating mission_map_plans table:", missionMapError);
        return new Response(
          JSON.stringify({ success: false, error: missionMapError.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in create-strategy-tables:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || "An unexpected error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
