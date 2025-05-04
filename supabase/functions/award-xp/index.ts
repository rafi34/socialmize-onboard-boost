
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
    const { userId, reminderId, type = 'REMINDER_COMPLETED', amount = 0 } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "User ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Initialize the Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine XP amount based on action type
    let xpAmount = amount;
    if (amount <= 0) {
      switch (type) {
        case 'CONTENT_MISSION_COMPLETED':
          xpAmount = 50;
          break;
        case 'RECORD_REMINDER':
          xpAmount = 25;
          break;
        case 'REMINDER_COMPLETED':
        default:
          xpAmount = 20;
      }
    }
    
    // Create XP event
    const { error: xpError } = await supabase
      .from('xp_events')
      .insert([
        {
          user_id: userId,
          type: type,
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
      .select('current_xp, current_level, streak_days, last_activity_date')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Calculate new streak and update progress
    let currentXp = xpAmount;
    let currentLevel = 1;
    let streakDays = 1;
    let lastActivity = new Date().toISOString();
    
    if (!progressSelectError && progressData) {
      currentXp = (progressData.current_xp || 0) + xpAmount;
      currentLevel = progressData.current_level || 1;
      
      // Check if level up needed (100 XP per level)
      if (currentXp >= currentLevel * 100) {
        currentLevel += 1;
      }
      
      // Update streak logic
      const today = new Date();
      const lastActivityDate = new Date(progressData.last_activity_date);
      
      // Reset date times to compare just the dates
      today.setHours(0, 0, 0, 0);
      lastActivityDate.setHours(0, 0, 0, 0);
      
      const diffTime = Math.abs(today.getTime() - lastActivityDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // If last activity was yesterday, increase streak
      if (diffDays === 1) {
        streakDays = (progressData.streak_days || 0) + 1;
      }
      // If last activity was today, maintain current streak
      else if (diffDays === 0) {
        streakDays = progressData.streak_days || 1;
      }
      // Otherwise reset streak (been more than a day)
      else {
        streakDays = 1;
      }
    }
    
    // Update or insert progress tracking
    const { error: progressUpdateError } = await supabase
      .from('progress_tracking')
      .upsert({
        user_id: userId,
        current_xp: currentXp,
        current_level: currentLevel,
        streak_days: streakDays,
        last_activity_date: new Date().toISOString()
      });
    
    if (progressUpdateError) {
      console.error("Error updating progress:", progressUpdateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to update progress" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // If a reminder ID was provided, mark it as completed
    if (reminderId) {
      const { error: reminderUpdateError } = await supabase
        .from('reminders')
        .update({ 
          completed: true,
          xp_awarded: true
        })
        .eq('id', reminderId)
        .eq('user_id', userId);
      
      if (reminderUpdateError) {
        console.error("Error updating reminder:", reminderUpdateError);
        // Continue execution even if reminder update fails
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "XP awarded successfully", 
        xpAwarded: xpAmount,
        newLevel: currentXp >= currentLevel * 100, // Indicate if user leveled up
        streak: streakDays
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in award-xp:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "An unexpected error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
