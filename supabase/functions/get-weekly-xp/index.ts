
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
    const { userId, startDate } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "User ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Initialize the Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate one week ago if startDate not provided
    const oneWeekAgo = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // Query the XP events table directly since we can't be sure the RPC function exists yet
    const { data: xpEvents, error: xpError } = await supabase
      .from('xp_events')
      .select('amount')
      .eq('user_id', userId)
      .gte('created_at', oneWeekAgo);
    
    if (xpError) {
      console.error("Error fetching XP events:", xpError);
      
      // Try the get_weekly_xp RPC function as a fallback
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_weekly_xp', {
          user_id_param: userId,
          start_date_param: oneWeekAgo
        });
        
        if (rpcError) {
          throw rpcError;
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            xp: rpcData || 0,
            source: "rpc"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (rpcFallbackError) {
        console.error("RPC fallback error:", rpcFallbackError);
        // If both methods fail, return 0 XP
        return new Response(
          JSON.stringify({ 
            success: true, 
            xp: 0,
            source: "default"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Calculate total XP from events
    const totalXP = xpEvents?.reduce((sum, event) => sum + (event.amount || 0), 0) || 0;

    return new Response(
      JSON.stringify({ 
        success: true, 
        xp: totalXP,
        source: "direct_query" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in get-weekly-xp:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "An unexpected error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
