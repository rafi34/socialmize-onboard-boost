
import { serve } from "https://deno.land/std@0.195.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Get environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize the Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("Creating tables for strategy chat feature...");

    // Create assistant_threads table if it doesn't exist
    const { error: threadsError } = await supabase.rpc('execute_if_not_exists', {
      sql_statement: `
        CREATE TABLE IF NOT EXISTS assistant_threads (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES auth.users(id),
          thread_id TEXT NOT NULL,
          assistant_id TEXT,
          purpose TEXT NOT NULL DEFAULT 'strategy',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ
        );
      `
    });
    
    if (threadsError) {
      throw new Error(`Error creating assistant_threads table: ${threadsError.message}`);
    }
    
    // Create strategy_deep_profile table if it doesn't exist
    const { error: profileError } = await supabase.rpc('execute_if_not_exists', {
      sql_statement: `
        CREATE TABLE IF NOT EXISTS strategy_deep_profile (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES auth.users(id),
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `
    });
    
    if (profileError) {
      throw new Error(`Error creating strategy_deep_profile table: ${profileError.message}`);
    }
    
    // Create mission_map_plans table if it doesn't exist
    const { error: missionError } = await supabase.rpc('execute_if_not_exists', {
      sql_statement: `
        CREATE TABLE IF NOT EXISTS mission_map_plans (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES auth.users(id),
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `
    });
    
    if (missionError) {
      throw new Error(`Error creating mission_map_plans table: ${missionError.message}`);
    }
    
    return new Response(
      JSON.stringify({ success: true, message: "Strategy chat tables created successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in create-strategy-tables function:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || "An unexpected error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
