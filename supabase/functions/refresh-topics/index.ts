
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
    const usedTopicsResponse = await fetch(`${supabaseUrl}/rest/v1/used_topics?user_id=eq.${userId}&select=topic`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      }
    });

    if (!usedTopicsResponse.ok) {
      throw new Error('Failed to fetch used topics');
    }

    const usedTopics = await usedTopicsResponse.json();
    const usedTopicSet = new Set(usedTopics.map(item => item.topic.toLowerCase()));

    // Fetch the user's strategy profile for topic ideas
    const strategyResponse = await fetch(`${supabaseUrl}/rest/v1/strategy_profiles?user_id=eq.${userId}&select=topic_ideas`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      }
    });

    if (!strategyResponse.ok) {
      throw new Error('Failed to fetch strategy profile');
    }

    const strategyData = await strategyResponse.json();
    
    if (!strategyData.length || !strategyData[0].topic_ideas) {
      // Generate fresh topics if none exist
      const freshTopics = await generateFreshTopics(userId);
      return new Response(JSON.stringify({ 
        topics: freshTopics,
        usedCount: usedTopicSet.size,
        totalCount: freshTopics.length + usedTopicSet.size
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const allTopics = strategyData[0].topic_ideas;
    
    // Filter out used topics
    const availableTopics = allTopics.filter(topic => !usedTopicSet.has(topic.toLowerCase()));
    
    // If fewer than 3 topics remain, generate new ones
    if (availableTopics.length < 3) {
      const freshTopics = await generateFreshTopics(userId);
      
      // Combine and deduplicate topics
      const combinedTopics = [...availableTopics, ...freshTopics];
      const dedupedTopics = Array.from(new Set(combinedTopics));
      
      // Update the strategy_profiles table with the new topics
      await fetch(`${supabaseUrl}/rest/v1/strategy_profiles?user_id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          topic_ideas: dedupedTopics
        })
      });
      
      return new Response(JSON.stringify({ 
        topics: dedupedTopics,
        usedCount: usedTopicSet.size,
        totalCount: dedupedTopics.length + usedTopicSet.size,
        refreshed: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ 
      topics: availableTopics,
      usedCount: usedTopicSet.size,
      totalCount: allTopics.length,
      refreshed: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in refresh-topics function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to generate fresh topic ideas
async function generateFreshTopics(userId: string): Promise<string[]> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    console.error('OpenAI API key not configured');
    return [];
  }
  
  try {
    // Fetch the user's niche topic and creator style for context
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    const strategyResponse = await fetch(`${supabaseUrl}/rest/v1/strategy_profiles?user_id=eq.${userId}&select=niche_topic,creator_style`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      }
    });
    
    if (!strategyResponse.ok) {
      throw new Error('Failed to fetch strategy profile');
    }
    
    const strategyData = await strategyResponse.json();
    const nicheTopic = strategyData[0]?.niche_topic || "content creation";
    const creatorStyle = strategyData[0]?.creator_style || "authentic";
    
    // Generate fresh topics using OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a creative content strategy assistant. Generate a list of 10 unique content topic ideas.' 
          },
          { 
            role: 'user', 
            content: `I need 10 fresh content topic ideas for a ${creatorStyle} creator in the ${nicheTopic} niche. Format the response as a JSON array of strings ONLY, with no additional text or explanations.` 
          }
        ],
        response_format: { type: "json_object" }
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate topics with OpenAI');
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      // Parse the JSON response and extract the topics
      const parsedContent = JSON.parse(content);
      return Array.isArray(parsedContent.topics) ? parsedContent.topics : [];
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      return [];
    }
  } catch (error) {
    console.error('Error generating fresh topics:', error);
    return [];
  }
}
