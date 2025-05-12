// supabase/functions/test-function/index.ts
import { serve } from "https://deno.land/std@0.195.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.28.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get environment variables
const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  // Diagnostic info to include in response
  const diagnostics = {
    hasOpenAiKey: openaiApiKey.length > 0,
    hasSupabaseUrl: supabaseUrl.length > 0,
    hasServiceKey: supabaseServiceKey.length > 0,
    openaiTest: null,
    error: null
  };
  
  // Test OpenAI connection
  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: openaiApiKey,
      defaultHeaders: {
        "OpenAI-Beta": "assistants=v2"
      }
    });
    
    // Simple test to check OpenAI API access
    const models = await openai.models.list();
    diagnostics.openaiTest = {
      success: true,
      modelCount: models.data.length
    };
  } catch (error) {
    diagnostics.openaiTest = {
      success: false
    };
    diagnostics.error = error.message;
  }

  return new Response(JSON.stringify({
    success: true,
    message: "Edge functions are working!",
    diagnostics: diagnostics
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
