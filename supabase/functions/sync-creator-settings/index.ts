
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
      if (onboardingError.code !== 'PGRST116') { // If table doesn't exist yet, we just continue with profile data
        throw onboardingError;
      }
    }
    
    if (!onboardingData) {
      console.log("No onboarding data found, checking if we need to create an empty record");
      
      // Create an empty onboarding record if it doesn't exist
      const { error: insertError } = await supabase
        .from('onboarding_answers')
        .insert({ user_id: userId })
        .select()
        .maybeSingle();
      
      if (insertError && insertError.code !== '23505') { // Not a uniqueness violation
        console.error("Error creating onboarding record:", insertError);
        throw insertError;
      }
    }
    
    // Try to get data from profiles as backup
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error("Error fetching profile data:", profileError);
      throw profileError;
    }
    
    // Prepare update data with fields from onboarding answers
    const updateData = {
      creator_style: onboardingData?.creator_style || null,
      niche_topic: onboardingData?.niche_topic || null,
      posting_frequency: onboardingData?.posting_frequency_goal || null,
      updated_at: new Date().toISOString()
    };
    
    // Check if strategy profile exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('strategy_profiles')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error("Error checking existing profile:", profileCheckError);
      // If table doesn't exist yet, we just create it
      if (profileCheckError.code !== '42P01') {
        throw profileCheckError;
      }
    }
    
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
          user_id: userId,
          is_active: true,
          strategy_type: 'starter',
          weekly_calendar: {} // Initialize with empty object to prevent null issues
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
      JSON.stringify({ 
        success: false, 
        error: error.message || "An unexpected error occurred"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
