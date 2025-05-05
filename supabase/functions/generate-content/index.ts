
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const { user_id, type, additional_input, creator_style, topic } = await req.json();

    if (!user_id || !type) {
      throw new Error('Missing required parameters');
    }

    console.log(`Generating content of type ${type} for user ${user_id}`);
    console.log(`Additional input: ${additional_input?.substring(0, 50)}...`);
    console.log(`Creator style: ${creator_style}, Topic: ${topic}`);

    if (!openaiApiKey) {
      // For development without OpenAI key, return mock data
      console.log("Using mock data (OpenAI API key not configured)");
      const mockResults = [{
        title: `Sample ${type.replace('_', ' ')} Content`,
        hook: "This is a sample attention-grabbing hook for your content.",
        content: "This is the main content of your generated script.\n\nIt includes multiple paragraphs that explain your topic in detail.\n\nThe content is formatted with line breaks where appropriate and includes all the key points you'd want to communicate.\n\nFinally, it ends with a strong call-to-action.",
        format_type: type.replace('_', ' ')
      }];
      
      // Store mock content in database
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (supabaseUrl && supabaseServiceKey) {
        try {
          const scriptData = {
            user_id,
            title: mockResults[0].title,
            hook: mockResults[0].hook,
            content: mockResults[0].content,
            format_type: mockResults[0].format_type
          };
          
          await fetch(`${supabaseUrl}/rest/v1/generated_scripts`, {
            method: 'POST',
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(scriptData)
          });
          
          console.log("Stored mock content in database");
        } catch (dbError) {
          console.error("Error storing mock content:", dbError);
        }
      }
      
      return new Response(JSON.stringify({
        success: true,
        results: mockResults,
        mock: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // For real usage with OpenAI
    // Prepare context based on content type
    let contentContext = "";
    switch (type) {
      case "duet":
        contentContext = "a duet-style video where you react to trending content";
        break;
      case "meme":
        contentContext = "a funny, viral short-form video content that's entertaining and shareable";
        break;
      case "carousel":
        contentContext = "an educational slide deck with multiple points presented in sequence";
        break;
      case "voiceover":
        contentContext = "a voiceover script that will be narrated over visuals";
        break;
      case "talking_head":
        contentContext = "a direct-to-camera talking head video where you speak directly to the audience";
        break;
      default:
        contentContext = "social media content";
    }
    
    // Create prompt for OpenAI
    const topicPrompt = topic ? `on the topic of ${topic}` : "on a topic relevant to your niche";
    const stylePrompt = creator_style ? `Your content style is ${creator_style}.` : "";
    const additionalDetails = additional_input ? `\n\nAdditional details or transcript: ${additional_input}` : "";
    
    const systemPrompt = `You are an expert social media content creator specializing in ${contentContext}. ${stylePrompt} Create engaging, authentic content that resonates with audiences.`;
    
    const userPrompt = `Generate a script for ${contentContext} ${topicPrompt}.${additionalDetails}`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const responseData = await response.json();
    console.log("Got response from OpenAI");
    
    // Parse the JSON response and validate it has the expected format
    let content;
    try {
      content = JSON.parse(responseData.choices[0].message.content);
      if (!content.title || !content.content) {
        throw new Error("Incomplete content format");
      }
      
      // Ensure hook is present (default value if not)
      if (!content.hook) {
        content.hook = content.title;
      }
      
      // Ensure format_type is present
      if (!content.format_type) {
        content.format_type = type.replace('_', ' ');
      }
    } catch (parseError) {
      console.error("Error parsing content:", parseError);
      console.log("Raw content:", responseData.choices[0].message.content);
      
      // Create a default structure
      content = {
        title: "Generated Content",
        hook: "Attention-grabbing opening",
        content: responseData.choices[0].message.content,
        format_type: type.replace('_', ' ')
      };
    }
    
    // Store content in database using Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL or service key not configured');
    }
    
    const scriptData = {
      user_id,
      title: content.title,
      hook: content.hook,
      content: content.content,
      format_type: content.format_type
    };
    
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/generated_scripts`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(scriptData)
    });
    
    if (!insertResponse.ok) {
      const error = await insertResponse.text();
      throw new Error(`Failed to insert script: ${error}`);
    }
    
    const insertedScript = await insertResponse.json();
    console.log("Stored content in database");

    return new Response(JSON.stringify({
      success: true,
      results: [content],
      stored: insertedScript
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in generate-content function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
