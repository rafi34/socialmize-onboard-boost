
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

    // Fetch user's strategy profile
    const { data: strategyData, error: strategyError } = await supabase
      .from('strategy_profiles')
      .select('weekly_calendar, posting_frequency')
      .eq('user_id', userId)
      .maybeSingle();

    if (strategyError) {
      console.error("Error fetching strategy:", strategyError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch user strategy" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    if (!strategyData || !strategyData.weekly_calendar) {
      return new Response(
        JSON.stringify({ success: false, error: "No strategy found for user" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Fetch user profile for preferences
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('preferred_recording_days, preferred_reminder_time')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
    }

    // Get user onboarding data for shooting preference
    const { data: onboardingData, error: onboardingError } = await supabase
      .from('onboarding_answers')
      .select('shooting_preference')
      .eq('user_id', userId)
      .maybeSingle();

    if (onboardingError) {
      console.error("Error fetching onboarding data:", onboardingError);
    }

    const shootingPreference = onboardingData?.shooting_preference || 'bulk';
    const preferredRecordingDays = profileData?.preferred_recording_days || ['Monday', 'Thursday']; // Default to Monday and Thursday
    const preferredTime = profileData?.preferred_reminder_time || '09:00:00'; // Default to 9 AM

    // Get current date and generate dates for the next 7 days
    const today = new Date();
    const next7Days = [];
    
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(today);
      nextDay.setDate(today.getDate() + i);
      next7Days.push(nextDay);
    }

    // Build reminders based on strategy calendar and shooting preference
    const reminders = [];
    const weeklyCalendar = strategyData.weekly_calendar;
    const dayMapping = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday'
    };

    // Create posting reminders
    for (const date of next7Days) {
      const dayOfWeek = dayMapping[date.getDay()].toLowerCase();
      
      if (weeklyCalendar[dayOfWeek] && weeklyCalendar[dayOfWeek].length > 0) {
        for (const content of weeklyCalendar[dayOfWeek]) {
          // Set reminder for 10 AM by default, or user's preferred time
          const reminderTime = new Date(date);
          const [hours, minutes] = preferredTime.split(':');
          reminderTime.setHours(parseInt(hours, 10), parseInt(minutes, 10) || 0, 0, 0);
          
          reminders.push({
            user_id: userId,
            reminder_type: 'post',
            content_format: content,
            content_title: `Time to post: ${content}`,
            reminder_time: reminderTime.toISOString(),
            is_active: true
          });
        }
      }
    }

    // Create recording reminders based on shooting preference
    if (shootingPreference === 'daily') {
      // Daily recording reminder at 9 AM every day
      for (const date of next7Days) {
        const recordingTime = new Date(date);
        recordingTime.setHours(9, 0, 0, 0);
        
        reminders.push({
          user_id: userId,
          reminder_type: 'record',
          content_format: 'Recording Session',
          content_title: 'Daily recording session',
          reminder_time: recordingTime.toISOString(),
          is_active: true
        });
      }
    } else {
      // Bulk recording reminder (twice a week)
      for (const date of next7Days) {
        const dayName = dayMapping[date.getDay()];
        
        if (Array.isArray(preferredRecordingDays) && 
            preferredRecordingDays.some(d => d.toLowerCase() === dayName.toLowerCase())) {
          const recordingTime = new Date(date);
          recordingTime.setHours(9, 0, 0, 0);
          
          reminders.push({
            user_id: userId,
            reminder_type: 'record',
            content_format: 'Bulk Recording',
            content_title: 'Bulk recording session',
            reminder_time: recordingTime.toISOString(),
            is_active: true
          });
        }
      }
    }

    // Insert reminders (skip if they already exist due to unique constraint)
    const { data: insertData, error: insertError } = await supabase
      .from('reminders')
      .upsert(reminders, { 
        onConflict: 'user_id,content_title,reminder_time',
        ignoreDuplicates: true 
      });

    if (insertError) {
      console.error("Error inserting reminders:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create reminders", details: insertError }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${reminders.length} reminders created/updated`,
        reminderCount: reminders.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-reminders:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "An unexpected error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
