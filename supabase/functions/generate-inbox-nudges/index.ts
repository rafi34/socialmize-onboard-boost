
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

// Main function to handle request
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "User ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Initialize the Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the database functions to generate nudges
    const weeklyGoalResult = await supabase.rpc('generate_weekly_goal_nudge', { user_id_param: userId });
    const streakNudgeResult = await supabase.rpc('generate_streak_nudge', { user_id_param: userId });
    
    if (weeklyGoalResult.error) {
      console.error("Error generating weekly goal nudge:", weeklyGoalResult.error);
    }
    
    if (streakNudgeResult.error) {
      console.error("Error generating streak nudge:", streakNudgeResult.error);
    }
    
    // Fetch the latest inbox items for the user
    const { data: inboxItems, error: fetchError } = await supabase
      .from('inbox_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
      
    if (fetchError) {
      throw new Error(`Failed to fetch inbox items: ${fetchError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Nudges generated successfully",
        inboxItems 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-inbox-nudges:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "An unexpected error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
