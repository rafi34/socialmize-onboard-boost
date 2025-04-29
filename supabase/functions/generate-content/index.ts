
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define content type prompts
const contentPrompts = {
  duet: (input: string, creatorStyle: string, topic: string) => ({
    system: `You are an expert social media content creator specializing in creating viral duet captions for creators. 
    Format all responses as JSON with an array of 3 caption options.
    Each caption should be under 15 words and match the following creator style: ${creatorStyle || 'Authentic & Educational'}.
    Use powerful hooks and make the captions shareable, emotional, and intriguing.
    Generate captions that will make viewers want to engage with the content.
    Focus on this topic/niche: ${topic || 'general content'}`,
    user: `Create 3 viral duet captions for this context: ${input || topic || 'trending content'}. 
    Each caption should have a hook that grabs attention immediately.
    Format the response as valid JSON with an array of objects, each with title and content fields.`
  }),
  
  meme: (input: string, creatorStyle: string, topic: string) => ({
    system: `You are an expert in creating viral meme captions for social media. 
    Format all responses as JSON with an array of 3 caption options.
    Each caption should be brief, funny, and match this creator style: ${creatorStyle || 'Authentic & Humorous'}.
    Use trending formats, relatable humor, and meme culture references when appropriate.
    Focus on this topic/niche: ${topic || 'general content'}`,
    user: `Create 3 viral meme captions related to ${input || topic || 'trending content'}.
    Each caption should be humorous but aligned with the creator's style.
    Format the response as valid JSON with an array of objects, each with title and content fields.`
  }),
  
  carousel: (input: string, creatorStyle: string, topic: string) => ({
    system: `You are an expert in creating educational carousel content for social media. 
    Format all responses as JSON with a complete carousel script.
    The carousel should have 5-6 slides that tell a cohesive story, with the creator style: ${creatorStyle || 'Educational & Valuable'}.
    Use a clear structure: Introduction → Problem → Solution → Examples → Call to Action.
    Focus on this topic/niche: ${topic || 'general informational content'}`,
    user: `Create a complete carousel script about ${input || topic || 'a topic relevant to the creator\'s niche'}.
    Include a title for the carousel and content for each slide (5-6 slides).
    The final slide should include a call to action.
    Format the response as valid JSON with title and an array of slide content.`
  }),
  
  voiceover: (input: string, creatorStyle: string, topic: string) => ({
    system: `You are an expert in creating viral voiceover scripts for social media reels. 
    Format all responses as JSON with a complete voiceover script.
    The script should follow a Hook → Context → Conflict → Resolution → CTA structure and match the creator style: ${creatorStyle || 'Conversational & Engaging'}.
    The entire script should be under 60 seconds when spoken.
    Focus on this topic/niche: ${topic || 'general information'}`,
    user: `Create a voiceover script about ${input || topic || 'a topic in the creator\'s niche'}.
    The script must start with a powerful hook, then provide context, present a conflict, offer a resolution, and end with a call to action.
    Format the response as valid JSON with title, hook, and content fields.`
  }),
  
  talking_head: (input: string, creatorStyle: string, topic: string) => ({
    system: `You are an expert in creating talking head scripts for social media creators. 
    Format all responses as JSON with a complete talking head script.
    The script should be conversational, as if talking to a friend, and match the creator style: ${creatorStyle || 'Authentic & Personable'}.
    Use a Hook + Body + CTA structure and include natural speech patterns.
    Focus on this topic/niche: ${topic || 'general advice'}`,
    user: `Create a talking head script about ${input || topic || 'a topic in the creator\'s niche'}.
    Make it conversational and authentic, as if the creator is speaking directly to their audience.
    Include a strong hook at the beginning and a clear call to action at the end.
    Format the response as valid JSON with title, hook, and content fields.`
  })
};

// Process OpenAI response
async function processOpenAIResponse(content: string): Promise<any> {
  try {
    // Find JSON content (may be wrapped in ```json or just plain JSON)
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                      content.match(/```([\s\S]*?)```/) || 
                      [null, content];
    
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1].trim());
    }
    
    // If no JSON formatting, try parsing the entire response
    return JSON.parse(content.trim());
  } catch (error) {
    console.error('Error parsing OpenAI response:', error);
    return { error: 'Failed to parse response' };
  }
}

// Fetch a random unused topic for a user
async function getRandomTopic(user_id: string, preferredTopic: string = ""): Promise<string> {
  try {
    // If user provided a specific topic, use that
    if (preferredTopic) {
      return preferredTopic;
    }
    
    // Get the user's strategy profile to access their topic ideas
    const { data: strategyData, error: strategyError } = await fetch(
      `${SUPABASE_URL}/rest/v1/strategy_profiles?user_id=eq.${user_id}&order=created_at.desc&limit=1`, 
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    ).then(res => res.json());
    
    if (strategyError || !strategyData || strategyData.length === 0) {
      console.log("No strategy data found, using fallback topic");
      return "content creation tips";
    }
    
    const strategy = strategyData[0];
    const nicheTopic = strategy.niche_topic || "content creation";
    const topicIdeas = strategy.topic_ideas || [];
    
    if (topicIdeas.length === 0) {
      return nicheTopic;
    }
    
    // Get used topics
    const { data: usedTopics, error: usedTopicsError } = await fetch(
      `${SUPABASE_URL}/rest/v1/used_topics?user_id=eq.${user_id}&select=topic`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    ).then(res => res.json());
    
    if (usedTopicsError) {
      console.log("Error fetching used topics, using random topic");
      return topicIdeas[Math.floor(Math.random() * topicIdeas.length)];
    }
    
    // Filter out used topics
    const usedTopicsList = usedTopics ? usedTopics.map((item: any) => item.topic) : [];
    const unusedTopics = topicIdeas.filter((topic: string) => !usedTopicsList.includes(topic));
    
    // If we have unused topics, pick one randomly
    if (unusedTopics.length > 0) {
      return unusedTopics[Math.floor(Math.random() * unusedTopics.length)];
    }
    
    // If all topics have been used, just pick a random one
    return topicIdeas[Math.floor(Math.random() * topicIdeas.length)];
  } catch (error) {
    console.error("Error getting random topic:", error);
    return "content creation";
  }
}

// Record a used topic
async function recordUsedTopic(user_id: string, topic: string, content_type: string): Promise<void> {
  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/used_topics`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          user_id,
          topic,
          content_type,
          used_at: new Date().toISOString()
        })
      }
    );
  } catch (error) {
    console.error("Error recording used topic:", error);
  }
}

// Get creator style from strategy profile
async function getCreatorStyle(user_id: string): Promise<string> {
  try {
    const { data, error } = await fetch(
      `${SUPABASE_URL}/rest/v1/strategy_profiles?user_id=eq.${user_id}&order=created_at.desc&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    ).then(res => res.json());
    
    if (error || !data || data.length === 0) {
      return '';
    }
    
    return data[0].creator_style || '';
  } catch (error) {
    console.error("Error fetching creator style:", error);
    return '';
  }
}

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, type, additional_input = "", creator_style = "", topic = "" } = await req.json();
    
    if (!user_id) {
      throw new Error("User ID is required");
    }
    
    if (!type || !Object.keys(contentPrompts).includes(type)) {
      throw new Error(`Invalid content type: ${type}`);
    }
    
    // Get creator style if not provided
    const creatorStyleToUse = creator_style || await getCreatorStyle(user_id);
    
    // Get a topic if not provided
    const topicToUse = await getRandomTopic(user_id, topic);
    console.log(`Using topic: ${topicToUse} for content type: ${type}`);
    
    // Get the appropriate prompt for the content type
    const promptFn = contentPrompts[type as keyof typeof contentPrompts];
    if (!promptFn) {
      throw new Error(`Prompt not found for content type: ${type}`);
    }
    
    const prompt = promptFn(additional_input, creatorStyleToUse, topicToUse);

    // Call OpenAI API
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }
    
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user }
        ],
        temperature: 0.7
      })
    });
    
    const openAIData = await openAIResponse.json();
    
    if (!openAIData.choices || openAIData.choices.length === 0) {
      throw new Error("Invalid response from OpenAI");
    }
    
    const content = openAIData.choices[0].message.content;
    const processedContent = await processOpenAIResponse(content);
    
    // Create formatted response based on content type
    let formattedResults: Array<{title: string, content: string, format_type: string, hook?: string, topic: string}>;
    
    switch (type) {
      case 'duet':
      case 'meme':
        formattedResults = processedContent.map((item: any) => ({
          title: item.title || `${type.charAt(0).toUpperCase() + type.slice(1)} Caption`,
          content: item.content,
          format_type: type,
          hook: item.hook || item.content.split('.')[0],
          topic: topicToUse
        }));
        break;
        
      case 'carousel':
        formattedResults = [{
          title: processedContent.title || `Carousel: ${topicToUse || additional_input || 'Educational Content'}`,
          content: JSON.stringify(processedContent.slides || processedContent),
          format_type: type,
          hook: processedContent.slides?.[0] || processedContent[0] || "Start your carousel journey...",
          topic: topicToUse
        }];
        break;
        
      case 'voiceover':
      case 'talking_head':
        formattedResults = [{
          title: processedContent.title || `${type.replace('_', ' ')} Script`,
          content: processedContent.content || processedContent.script || JSON.stringify(processedContent),
          format_type: type,
          hook: processedContent.hook || "",
          topic: topicToUse
        }];
        break;
        
      default:
        formattedResults = [{
          title: `Generated ${type}`,
          content: JSON.stringify(processedContent),
          format_type: type,
          topic: topicToUse
        }];
    }
    
    // Record the used topic
    await recordUsedTopic(user_id, topicToUse, type);
    
    // Insert results into database
    const supaRes = await fetch(`${SUPABASE_URL}/rest/v1/generated_scripts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(
        formattedResults.map(result => ({
          user_id,
          title: result.title,
          content: result.content,
          format_type: result.format_type,
          hook: result.hook,
          topic: result.topic,
          created_at: new Date().toISOString()
        }))
      )
    });
    
    if (!supaRes.ok) {
      const errorText = await supaRes.text();
      console.error('Error inserting into Supabase:', errorText);
      throw new Error(`Failed to save generated content: ${errorText}`);
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      results: formattedResults 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('Error in generate-content function:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "An unexpected error occurred" 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
