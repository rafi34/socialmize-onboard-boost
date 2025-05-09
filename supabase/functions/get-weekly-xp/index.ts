
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const { userId, startDate } = await req.json();

    if (!userId || !startDate) {
      throw new Error('Missing required parameters');
    }

    // Get Supabase credentials from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    console.log(`Fetching weekly XP for user ${userId} from ${startDate}`);

    // Calculate total XP since the start date
    const xpResponse = await fetch(`${supabaseUrl}/rest/v1/xp_events?user_id=eq.${userId}&created_at=gte.${startDate}`, {
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        apikey: supabaseServiceKey,
      },
    });

    if (!xpResponse.ok) {
      console.error(`XP events fetch failed with status: ${xpResponse.status}`);
      throw new Error(`Failed to fetch XP events: ${xpResponse.statusText}`);
    }

    const xpEvents = await xpResponse.json();
    console.log(`Found ${xpEvents.length} XP events for user ${userId}`);
    
    const totalXp = xpEvents.reduce((sum: number, event: any) => sum + (event.amount || 0), 0);

    // Get the user's streak from progress_tracking
    const progressResponse = await fetch(`${supabaseUrl}/rest/v1/progress_tracking?user_id=eq.${userId}&order=created_at.desc&limit=1`, {
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        apikey: supabaseServiceKey,
      },
    });

    if (!progressResponse.ok) {
      console.error(`Progress tracking fetch failed with status: ${progressResponse.status}`);
      throw new Error(`Failed to fetch progress tracking: ${progressResponse.statusText}`);
    }

    const progressData = await progressResponse.json();
    const streak = progressData.length > 0 ? progressData[0].streak_days || 0 : 0;

    console.log(`User ${userId} has earned ${totalXp} XP this week with a streak of ${streak} days`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        xp: totalXp, 
        streak: streak 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-weekly-xp function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'An error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
