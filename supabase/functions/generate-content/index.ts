
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
    const { userId, idea, ideaId } = await req.json();

    if (!userId || !idea) {
      throw new Error('Missing required parameters');
    }

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log(`Generating script for user ${userId}, idea: "${idea.substring(0, 30)}..."`);

    // Generate content using OpenAI
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
            content: 'You are a professional social media content writer. You create engaging scripts for social media posts based on content ideas. Your scripts should include a hook, main content, and call-to-action. ALWAYS return valid JSON that can be parsed directly without needing additional processing.'
          },
          {
            role: 'user',
            content: `Create a social media script based on this content idea: "${idea}". Format your response as a JSON object with the following structure: { "title": "Catchy title", "hook": "Attention-grabbing hook", "content": "Main content with paragraph breaks where appropriate", "format_type": "Talking Head" }`
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }, // Ensure we get a properly formatted JSON response
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const responseData = await response.json();
    const generatedContent = responseData.choices[0].message.content;
    
    // Parse the JSON response
    let parsedContent;
    try {
      // First try direct parsing since we requested json_object format
      parsedContent = JSON.parse(generatedContent);
      console.log("Successfully parsed JSON response");
    } catch (e) {
      console.error('Error parsing JSON from OpenAI response:', e);
      // Fallback: extract content by regex
      const titleMatch = generatedContent.match(/"title":\s*"([^"]*)"/);
      const hookMatch = generatedContent.match(/"hook":\s*"([^"]*)"/);
      const contentMatch = generatedContent.match(/"content":\s*"([^"]*)"/);
      const formatMatch = generatedContent.match(/"format_type":\s*"([^"]*)"/);
      
      parsedContent = {
        title: titleMatch ? titleMatch[1] : 'Untitled Content',
        hook: hookMatch ? hookMatch[1] : 'No hook provided',
        content: contentMatch ? contentMatch[1].replace(/\\n/g, '\n') : 'No content provided',
        format_type: formatMatch ? formatMatch[1] : 'Talking Head'
      };
      
      console.log("Used regex fallback to parse content");
    }

    // Save to database using Supabase REST API
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL or service key not configured');
    }
    
    // Create the script object
    const scriptData = {
      user_id: userId,
      idea_id: ideaId, // Make sure to save the idea_id
      title: parsedContent.title,
      hook: parsedContent.hook,
      content: parsedContent.content,
      format_type: parsedContent.format_type || 'Talking Head'
    };
    
    // Insert into Supabase
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

    return new Response(JSON.stringify({
      success: true,
      script: insertedScript[0],
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in generate-content function:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
