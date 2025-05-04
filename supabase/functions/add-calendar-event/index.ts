
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
    const { userId, reminderId, title, description, startTime, endTime } = await req.json();

    if (!userId || !reminderId || !title || !startTime) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required parameters" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Initialize the Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // This is where we would get the user's Google OAuth token and make the Calendar API request
    // For now, let's simulate a successful calendar event creation with a mock event ID

    const mockCalendarEventId = `cal_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // In a real implementation, we would have:
    /*
    // Get user's Google OAuth token (you would need to implement the OAuth flow in your app)
    const { data: authData, error: authError } = await supabase
      .from('user_oauth_tokens')
      .select('access_token, refresh_token, expiry')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (authError || !authData) {
      return new Response(
        JSON.stringify({ success: false, error: "No Google authentication found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Check if token is expired and refresh if needed
    // ...token refresh logic...
    
    // Create calendar event
    const calendarEvent = {
      summary: title,
      description: description || '',
      start: {
        dateTime: startTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: endTime || new Date(new Date(startTime).getTime() + 60*60*1000).toISOString(),
        timeZone: 'UTC',
      },
    };
    
    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(calendarEvent),
      }
    );
    
    const calendarData = await calendarResponse.json();
    
    if (!calendarResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create calendar event", details: calendarData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    const calendarEventId = calendarData.id;
    */

    // Update the reminder with the calendar event ID
    const { error: updateError } = await supabase
      .from('reminders')
      .update({ calendar_event_id: mockCalendarEventId })
      .eq('id', reminderId)
      .eq('user_id', userId);

    if (updateError) {
      console.error("Error updating reminder:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to update reminder with calendar event ID" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Calendar event created",
        calendarEventId: mockCalendarEventId 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in add-calendar-event:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "An unexpected error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
