
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

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
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: "User ID is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Refreshing topics for user:", user_id);
    
    // Fetch the user's strategy profile to get their niche topic
    const { data: strategyData, error: strategyError } = await fetch(
      `${supabaseUrl}/rest/v1/strategy_profiles?user_id=eq.${user_id}&order=created_at.desc&limit=1`,
      {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      }
    ).then(res => res.json());
    
    if (strategyError || !strategyData || strategyData.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Strategy profile not found" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const strategy = strategyData[0];
    const nicheTopic = strategy.niche_topic || "content creation";
    
    // Call OpenAI API to generate new topics
    const prompt = `
You are a content strategist specializing in content creation for social media.

Generate 20 specific content topic ideas for a creator who focuses on: ${nicheTopic}

These topics should be:
1. Specific enough to create a single piece of content about
2. Varied to cover different aspects of the niche
3. Engaging and likely to perform well on social media
4. A mix of trending and evergreen ideas
5. Formatted as a short phrase (3-7 words each)

Format your response as a valid JSON array of strings, with each string being a topic idea.
For example: ["How to grow on TikTok", "My morning routine", "3 productivity hacks"]
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a content strategist specializing in social media growth." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    const openAIResponse = await response.json();
    
    if (!openAIResponse.choices || !openAIResponse.choices[0]) {
      console.error("Invalid OpenAI response:", openAIResponse);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to generate topics" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let topicIdeas;
    try {
      const generatedContent = openAIResponse.choices[0].message.content;
      console.log("Raw topics from OpenAI:", generatedContent);
      
      const parsedContent = JSON.parse(generatedContent);
      topicIdeas = Array.isArray(parsedContent) ? parsedContent : parsedContent.topics || [];
      
      if (!Array.isArray(topicIdeas)) {
        throw new Error("Invalid topics format returned");
      }
      
      // Update the strategy profile with the new topics
      const { error: updateError } = await fetch(
        `${supabaseUrl}/rest/v1/strategy_profiles?id=eq.${strategy.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            topic_ideas: topicIdeas,
            updated_at: new Date().toISOString()
          })
        }
      ).then(res => {
        if (!res.ok) {
          return res.json().then(err => ({ error: err }));
        }
        return { error: null };
      });

      if (updateError) {
        console.error("Error updating topics:", updateError);
        throw new Error("Failed to update topics");
      }
      
    } catch (error) {
      console.error("Failed to parse or store topics:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to process topics" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, topics: topicIdeas }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in refresh-topics function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
