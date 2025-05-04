
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

    if (!userId || !reminderId) {
      return new Response(
        JSON.stringify({ success: false, error: "User ID and reminder ID are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Initialize the Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the reminder data
    const { data: reminderData, error: reminderError } = await supabase
      .from('reminders')
      .select('*')
      .eq('id', reminderId)
      .eq('user_id', userId)
      .maybeSingle();

    if (reminderError || !reminderData) {
      console.error("Error fetching reminder:", reminderError);
      return new Response(
        JSON.stringify({ success: false, error: "Reminder not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Mark reminder as completed
    const { error: updateError } = await supabase
      .from('reminders')
      .update({ completed: true })
      .eq('id', reminderId)
      .eq('user_id', userId);

    if (updateError) {
      console.error("Error updating reminder:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to mark reminder as completed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Check if XP has already been awarded
    if (!reminderData.xp_awarded) {
      // Amount of XP to award based on type
      const xpAmount = reminderData.type === 'record' ? 25 : 20;
      
      // Create XP event
      const { error: xpError } = await supabase
        .from('xp_events')
        .insert([
          {
            user_id: userId,
            type: reminderData.type === 'record' ? 'RECORD_REMINDER' : 'POST_REMINDER',
            amount: xpAmount,
            source_id: reminderId
          }
        ]);

      if (xpError) {
        console.error("Error creating XP event:", xpError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to create XP event" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      // Update user's progress_tracking
      const { data: progressData, error: progressSelectError } = await supabase
        .from('progress_tracking')
        .select('current_xp, current_level')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!progressSelectError && progressData) {
        // Calculate new XP and level
        let currentXp = (progressData.current_xp || 0) + xpAmount;
        let currentLevel = progressData.current_level || 1;
        
        // Check if level up needed (100 XP per level)
        if (currentXp >= currentLevel * 100) {
          currentLevel += 1;
        }
        
        const { error: progressUpdateError } = await supabase
          .from('progress_tracking')
          .update({ 
            current_xp: currentXp,
            current_level: currentLevel,
            last_activity_date: new Date().toISOString()
          })
          .eq('user_id', userId);
        
        if (progressUpdateError) {
          console.error("Error updating progress:", progressUpdateError);
        }
      } else {
        // Create new progress record if none exists
        const { error: progressInsertError } = await supabase
          .from('progress_tracking')
          .insert([
            {
              user_id: userId,
              current_xp: xpAmount,
              current_level: 1,
              streak_days: 1,
              last_activity_date: new Date().toISOString()
            }
          ]);
        
        if (progressInsertError) {
          console.error("Error creating progress record:", progressInsertError);
        }
      }
      
      // Mark XP as awarded in the reminder
      const { error: xpAwardedError } = await supabase
        .from('reminders')
        .update({ xp_awarded: true })
        .eq('id', reminderId);
      
      if (xpAwardedError) {
        console.error("Error marking XP as awarded:", xpAwardedError);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Reminder completed and XP awarded", 
          xpAwarded: xpAmount 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // XP already awarded
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Reminder marked as completed (XP already awarded)" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("Error in award-xp:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "An unexpected error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
