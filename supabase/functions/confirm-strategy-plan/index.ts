
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmPlanRequest {
  userId: string;
  strategyPlanId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // Get the request body
    const { userId, strategyPlanId } = await req.json() as ConfirmPlanRequest;

    // Validate required parameters
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create a Supabase client with the service role key (for admin privileges)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    // Fetch the strategy plan data
    const { data: strategyData, error: strategyError } = await supabaseAdmin
      .from("strategy_profiles")
      .select("id, phases")
      .eq("id", strategyPlanId)
      .eq("user_id", userId)
      .single();
    
    if (strategyError || !strategyData) {
      console.error("Error fetching strategy plan:", strategyError);
      return new Response(
        JSON.stringify({ error: "Strategy plan not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Generate simple weekly calendar based on the phases
    const phases = strategyData.phases as any[] || [];
    
    // Create a simple weekly calendar
    const weeklyCalendar = {
      "Monday": ["Content Brainstorming"],
      "Tuesday": ["Script Writing"],
      "Wednesday": ["Filming"],
      "Thursday": ["Editing"],
      "Friday": ["Posting"],
      "Saturday": ["Engagement"],
      "Sunday": ["Rest & Planning"]
    };
    
    // Update the strategy profile with weekly_calendar
    const { error: updateError } = await supabaseAdmin
      .from("strategy_profiles")
      .update({
        weekly_calendar: weeklyCalendar
      })
      .eq("id", strategyPlanId)
      .eq("user_id", userId);
    
    if (updateError) {
      console.error("Error updating strategy profile:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update strategy profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Strategy plan confirmed successfully"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in confirm-strategy-plan function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
