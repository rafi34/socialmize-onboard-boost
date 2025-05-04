
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
    let generatedTopics: string[] = [];

    // Add random variations and adjustments to make topics more diverse
    const prefixes = [
      "How I", "Why you should", "The ultimate guide to", 
      "3 ways to", "5 tips for", "What nobody tells you about",
      "The truth about", "My honest review of", "How to quickly",
      "The secret to", "I tried", "Why I stopped"
    ];
    
    const suffixes = [
      "that changed everything", "in just 10 minutes a day",
      "without expensive tools", "like a professional",
      "and what I learned", "that nobody talks about",
      "that will blow your mind", "- my honest journey",
      "for beginners", "for experienced creators",
      "the easy way", "step by step"
    ];
    
    const contentFormats = [
      "video", "post", "carousel", "live stream",
      "challenge", "tutorial", "behind the scenes", 
      "day in the life", "review", "comparison"
    ];

    // Generate a variety of topics based on niche + random elements
    for (let i = 0; i < 15; i++) {
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const suffix = Math.random() > 0.5 ? ` ${suffixes[Math.floor(Math.random() * suffixes.length)]}` : '';
      const format = contentFormats[Math.floor(Math.random() * contentFormats.length)];
      
      // Generate variations of topics
      if (i % 3 === 0) {
        // Format-focused topics
        generatedTopics.push(`${prefix} create a ${format} about ${nicheTopic}${suffix}`);
      } else if (i % 3 === 1) {
        // Niche-focused topics
        generatedTopics.push(`${prefix} ${nicheTopic} ${suffix}`);
      } else {
        // Combination topics
        generatedTopics.push(`My ${format} on ${nicheTopic}: ${prefix.toLowerCase()} it works${suffix}`);
      }
    }

    // Ensure we have a diverse set without duplicates
    generatedTopics = [...new Set(generatedTopics)];

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
      JSON.stringify({ success: true, topics: finalTopics.slice(0, 10) }),
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
