
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
    const { userId, reminderId } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "User ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    if (!reminderId) {
      return new Response(
        JSON.stringify({ success: false, error: "Reminder ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Initialize the Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the reminder
    const { data: reminderData, error: reminderError } = await supabase
      .from('reminders')
      .select('*')
      .eq('id', reminderId)
      .single();
      
    if (reminderError) {
      console.error("Error fetching reminder:", reminderError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch reminder" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    if (reminderData.user_id !== userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized access to reminder" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }
    
    // Check if XP has already been awarded for this reminder
    if (reminderData.xp_awarded) {
      return new Response(
        JSON.stringify({ success: true, message: "XP already awarded for this reminder", xpAwarded: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    
    // Set the reward amount based on reminder type
    const xpAmount = reminderData.reminder_type === 'record' ? 50 : 25;
    
    // Update the reminder as completed and mark XP as awarded
    const { error: updateError } = await supabase
      .from('reminders')
      .update({ 
        completed: true,
        xp_awarded: true 
      })
      .eq('id', reminderId);
      
    if (updateError) {
      console.error("Error updating reminder:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to update reminder" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Create XP event
    const { error: xpError } = await supabase
      .from('xp_events')
      .insert({
        user_id: userId,
        type: reminderData.reminder_type === 'record' ? 'complete_recording' : 'complete_posting',
        amount: xpAmount,
        source_id: reminderId
      });
      
    if (xpError) {
      console.error("Error creating XP event:", xpError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create XP event" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Update user's progress
    const { data: progressData, error: progressFetchError } = await supabase
      .from('progress_tracking')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (progressFetchError) {
      console.error("Error fetching progress:", progressFetchError);
    }
    
    if (progressData) {
      // Calculate new XP and level
      const currentXP = progressData.current_xp + xpAmount;
      const xpToNextLevel = (progressData.current_level + 1) * 100;
      
      // Check if user levels up
      let newLevel = progressData.current_level;
      if (currentXP >= xpToNextLevel) {
        newLevel += 1;
      }
      
      // Update progress tracking
      const { error: progressUpdateError } = await supabase
        .from('progress_tracking')
        .update({
          current_xp: currentXP,
          current_level: newLevel,
          last_activity_date: new Date().toISOString()
        })
        .eq('id', progressData.id);
        
      if (progressUpdateError) {
        console.error("Error updating progress:", progressUpdateError);
      }
    } else {
      // Create initial progress record if it doesn't exist
      const { error: progressCreateError } = await supabase
        .from('progress_tracking')
        .insert({
          user_id: userId,
          current_xp: xpAmount,
          current_level: 1,
          streak_days: 1,
          last_activity_date: new Date().toISOString()
        });
        
      if (progressCreateError) {
        console.error("Error creating progress record:", progressCreateError);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Successfully marked reminder as completed",
        xpAwarded: xpAmount
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
    
  } catch (error) {
    console.error("Error in award-reminder-xp:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "An unexpected error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
