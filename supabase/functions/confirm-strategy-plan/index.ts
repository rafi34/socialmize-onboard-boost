
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
    
    // Generate simple starter scripts based on the phases
    const phases = strategyData.phases as any[] || [];
    
    // Create sample scripts based on the phases
    const starterScripts = [];
    
    // Generate 5 starter scripts
    for (let i = 0; i < Math.min(5, phases.length * 2); i++) {
      const phaseIndex = i % phases.length;
      const phase = phases[phaseIndex];
      
      if (phase && phase.tactics && Array.isArray(phase.tactics)) {
        const tacticIndex = Math.floor(i / phases.length) % phase.tactics.length;
        const tactic = phase.tactics[tacticIndex];
        
        starterScripts.push({
          title: `${phase.title} - ${tactic.substring(0, 30)}...`,
          script: `# ${phase.title} Script\n\n**Objective:** ${phase.goal}\n\n**Based on tactic:** ${tactic}\n\n## Script:\n\n[Hook - Attention grabber related to ${phase.title}]\n\n[Main Content - Explain the value and demonstrate ${tactic}]\n\n[Call to Action - Ask viewers to engage]`
        });
      }
    }
    
    // Fill in with generic scripts if we don't have enough
    while (starterScripts.length < 5) {
      starterScripts.push({
        title: `Starter Script ${starterScripts.length + 1}`,
        script: `# Starter Script\n\n**Objective:** Build your audience\n\n## Script:\n\n[Hook - Grab attention in the first 3 seconds]\n\n[Main Content - Deliver value to your audience]\n\n[Call to Action - Ask for engagement]`
      });
    }
    
    // Generate a simple weekly calendar
    const weeklyCalendar = {
      "Monday": ["Content Brainstorming"],
      "Tuesday": ["Script Writing"],
      "Wednesday": ["Filming"],
      "Thursday": ["Editing"],
      "Friday": ["Posting"],
      "Saturday": ["Engagement"],
      "Sunday": ["Rest & Planning"]
    };
    
    // Update the strategy profile with first_five_scripts and weekly_calendar
    const { error: updateError } = await supabaseAdmin
      .from("strategy_profiles")
      .update({
        first_five_scripts: starterScripts,
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
