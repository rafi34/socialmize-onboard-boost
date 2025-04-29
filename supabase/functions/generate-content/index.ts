
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Prompt wrappers for different content types
const promptWrappers = {
  duet: (input: string, creatorStyle: string) => {
    return {
      system: `You are a professional content creator specializing in creating viral short-form video captions for Duet/Stitch content. Generate 3-5 caption options that are short (under 15 words), highly engaging, and match a ${creatorStyle} style. Your captions should use proven viral hook structures and create curiosity without revealing too much. Respond only with valid JSON in the format: {"captions": [{"text": "caption here", "hook_type": "Question/Shock/Challenge/etc"}]}.`,
      user: `Here's my video transcript or idea: ${input}. Please create 3-5 viral caption options that will make viewers stop scrolling and engage.`
    };
  },

  meme: (input: string, creatorStyle: string) => {
    return {
      system: `You are a comedy writer specializing in short-form video meme captions. Generate 3-5 caption options that are funny, relatable, and match a ${creatorStyle} style. Your captions should be punchy, use cultural references when relevant, and have a comedic twist. Respond only with valid JSON in the format: {"captions": [{"text": "caption here", "meme_style": "observation/punchline/relatable/etc"}]}.`,
      user: `Here's my video clip description or transcript: ${input}. Please create 3-5 meme caption options that will make people laugh and share.`
    };
  },

  carousel: (input: string, creatorStyle: string) => {
    return {
      system: `You are an educational content strategist specializing in carousel posts. Generate a plan for a carousel post (5-6 slides) that tells a micro-story with ${creatorStyle} style. Each slide should build on the previous one and maintain reader interest. The last slide should include a call-to-action. Respond only with valid JSON in the format: {"title": "Carousel Title", "slides": [{"slide_number": 1, "content": "slide content here", "type": "hook/context/point/etc"}]}.`,
      user: input ? `Here's my topic idea: ${input}. Please create a carousel plan with 5-6 slides that educates and engages my audience.` : `Please create a carousel plan with 5-6 slides that educates and engages my audience. Choose a relevant topic that would be valuable for someone with my creator style.`
    };
  },

  voiceover: (input: string, creatorStyle: string) => {
    return {
      system: `You are a voiceover script specialist for short-form video content. Create a voiceover script that follows the Hook → Context → Conflict → Resolution → CTA structure. The script should match a ${creatorStyle} style and be conversational. The entire script should be under 60 seconds of speaking time. Respond only with valid JSON in the format: {"title": "Script Title", "sections": [{"type": "hook/context/conflict/resolution/cta", "content": "script text here"}], "total_duration": "estimated seconds"}.`,
      user: input ? `Here's my topic idea: ${input}. Please create a voiceover script that will engage viewers from start to finish.` : `Please create a voiceover script that will engage viewers from start to finish. Choose a relevant topic that would work well with my creator style.`
    };
  },

  talking_head: (input: string, creatorStyle: string) => {
    return {
      system: `You are a talking head video script expert. Create a script with a conversational, friend-to-friend style that matches a ${creatorStyle} creator style. The script should have a hook that grabs attention in the first 3 seconds, a body that delivers value, and a clear call-to-action. Format the script to be easy to read while recording. Respond only with valid JSON in the format: {"title": "Video Title", "parts": [{"type": "hook/body/cta", "content": "script text here"}], "estimated_duration": "in seconds"}.`,
      user: input ? `Here's my topic idea: ${input}. Please create a talking head script that feels authentic and engaging.` : `Please create a talking head script that feels authentic and engaging. Choose a relevant topic that would work well with my creator style.`
    };
  }
};

// Function to generate content using OpenAI
async function generateWithOpenAI(messages: any[], model = "gpt-4o-mini") {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not set in environment variables");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openaiApiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.7,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("OpenAI API Error:", error);
    throw new Error(`OpenAI API error: ${error.error?.message || "Unknown error"}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, type, additional_input = "", creator_style = "Authentic & Educational" } = await req.json();
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!type || !promptWrappers[type]) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing content type", validTypes: Object.keys(promptWrappers) }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's creator style from the database if not provided
    let userCreatorStyle = creator_style;
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get creator style from strategy_profiles if not provided
    if (creator_style === "Authentic & Educational") {
      const { data: strategyData, error: strategyError } = await supabase
        .from('strategy_profiles')
        .select('full_plan_text')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (strategyError) {
        console.error("Error fetching strategy:", strategyError);
      } else if (strategyData?.full_plan_text) {
        // Extract creator style from the full plan if possible
        // For now, just use the default if we can't find it
        userCreatorStyle = "Authentic & Educational";
      }
    }

    // Get the prompt for the requested content type
    const prompt = promptWrappers[type](additional_input, userCreatorStyle);
    
    // Generate content with OpenAI
    const messages = [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user }
    ];
    
    console.log("Generating content with prompt:", JSON.stringify(messages, null, 2));
    const generatedContent = await generateWithOpenAI(messages);
    
    // Parse the generated content as JSON
    let parsedContent;
    try {
      parsedContent = JSON.parse(generatedContent);
    } catch (error) {
      console.error("Error parsing OpenAI response:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse generated content", 
          raw_content: generatedContent 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Store the generated content in the database
    const title = parsedContent.title || `${type.charAt(0).toUpperCase() + type.slice(1)} Content`;
    const content = JSON.stringify(parsedContent);
    
    const { data: insertData, error: insertError } = await supabase
      .from('generated_scripts')
      .insert([
        {
          user_id,
          title,
          content,
          format_type: type,
          created_at: new Date().toISOString()
        }
      ])
      .select();
    
    if (insertError) {
      console.error("Error inserting generated content:", insertError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to save generated content to database",
          details: insertError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        content: parsedContent,
        saved_script: insertData?.[0] || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error in generate-content function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
