
import { serve } from "https://deno.land/std@0.195.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers
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
    // Parse request body
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "User ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    console.log(`Syncing creator settings for user: ${userId}`);
    
    // Fetch the latest onboarding answers
    const { data: onboardingData, error: onboardingError } = await supabase
      .from('onboarding_answers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (onboardingError) {
      console.error("Error fetching onboarding data:", onboardingError);
      throw onboardingError;
    }
    
    if (!onboardingData) {
      console.log("No onboarding data found for user");
      return new Response(
        JSON.stringify({ success: false, error: "No onboarding data found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }
    
    console.log("Fetched onboarding data:", onboardingData);
    
    // Check if strategy profile exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('strategy_profiles')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (profileCheckError) {
      console.error("Error checking existing profile:", profileCheckError);
      throw profileCheckError;
    }
    
    // Prepare update data with fields from onboarding answers
    const updateData = {
      creator_style: onboardingData.creator_style,
      niche_topic: onboardingData.niche_topic,
      posting_frequency: onboardingData.posting_frequency_goal,
      updated_at: new Date().toISOString()
    };
    
    let result;
    
    // Update or create strategy profile
    if (existingProfile) {
      console.log(`Updating existing strategy profile: ${existingProfile.id}`);
      const { data, error } = await supabase
        .from('strategy_profiles')
        .update(updateData)
        .eq('id', existingProfile.id)
        .select();
        
      if (error) {
        console.error("Error updating strategy profile:", error);
        throw error;
      }
      
      result = data;
    } else {
      console.log("Creating new strategy profile");
      const { data, error } = await supabase
        .from('strategy_profiles')
        .insert({
          ...updateData,
          user_id: userId
        })
        .select();
        
      if (error) {
        console.error("Error creating strategy profile:", error);
        throw error;
      }
      
      result = data;
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Creator settings synced with strategy profile",
        data: result
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in sync-creator-settings:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || "An unexpected error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
