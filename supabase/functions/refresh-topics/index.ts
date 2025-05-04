
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
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('Missing required parameters');
    }

    // Get Supabase credentials from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    // Fetch used topics for this user
    const usedTopicsResponse = await fetch(`${supabaseUrl}/rest/v1/used_topics?user_id=eq.${userId}`, {
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        apikey: supabaseServiceKey,
      },
    });

    if (!usedTopicsResponse.ok) {
      throw new Error('Failed to fetch used topics');
    }

    const usedTopics = await usedTopicsResponse.json();
    const usedTopicsList = usedTopics.map((topic: any) => topic.topic.toLowerCase());

    // Fetch strategy profile for this user
    const strategyResponse = await fetch(`${supabaseUrl}/rest/v1/strategy_profiles?user_id=eq.${userId}&order=created_at.desc&limit=1`, {
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        apikey: supabaseServiceKey,
      },
    });

    if (!strategyResponse.ok) {
      throw new Error('Failed to fetch strategy profile');
    }

    const strategyProfiles = await strategyResponse.json();

    if (strategyProfiles.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          topics: [
            "How to grow your social media following in 30 days",
            "My top 3 content creation tools that save me hours",
            "Answering your most asked questions about my niche",
            "What I learned from going viral on TikTok",
            "Behind the scenes of my content creation process"
          ]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const profile = strategyProfiles[0];
    const creatorStyle = profile.creator_style || 'educational';
    const nicheTopic = profile.niche_topic || 'content creation';

    // Generate topics based on profile
    let generatedTopics = [];

    // Add some basic topics that always work well
    generatedTopics = [
      `How I ${creatorStyle === 'funny_relatable' ? 'hilariously' : 'effectively'} approach ${nicheTopic}`,
      `3 ${creatorStyle === 'inspirational_wise' ? 'inspiring' : 'unexpected'} ways to improve your ${nicheTopic} skills`,
      `What nobody tells you about ${nicheTopic} (my honest review)`,
      `Day in the life: How I manage my ${nicheTopic} business`,
      `The biggest mistake people make with ${nicheTopic} (and how to avoid it)`,
      `How to get started with ${nicheTopic} as a beginner`,
      `My favorite tools for ${nicheTopic} that most people don't know about`,
      `The truth about ${nicheTopic} that nobody is talking about`,
      `${nicheTopic} hacks that changed my workflow completely`,
      `Answering your most asked questions about ${nicheTopic}`
    ];

    // Filter out topics that have already been used
    const filteredTopics = generatedTopics.filter(topic => 
      !usedTopicsList.includes(topic.toLowerCase())
    );

    // If we've used up all our generated topics, create more variations
    const finalTopics = filteredTopics.length > 0 ? filteredTopics : generatedTopics;

    // Record these as used topics
    for (const topic of finalTopics.slice(0, 3)) {
      await fetch(`${supabaseUrl}/rest/v1/used_topics`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          apikey: supabaseServiceKey,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          user_id: userId,
          topic: topic,
          content_type: 'content_idea'
        }),
      });
    }

    return new Response(
      JSON.stringify({ success: true, topics: finalTopics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error refreshing topics:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'An error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
