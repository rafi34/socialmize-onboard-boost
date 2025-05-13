// @ts-ignore - Deno imports are not recognized by TypeScript but work at runtime
import { serve } from "https://deno.land/std@0.195.0/http/server.ts";

// Get environment variables
// @ts-ignore
const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || "";

console.log("🟢 check-run-status function initializing");

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { threadId, runId } = await req.json();
    
    if (!threadId || !runId) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing threadId or runId"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      });
    }

    // Check if OpenAI API key is available
    if (!openaiApiKey) {
      console.error("❌ Missing OpenAI API key");
      return new Response(JSON.stringify({
        success: false,
        error: "Missing OpenAI API key configuration"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      });
    }
    
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openaiApiKey}`,
      "OpenAI-Beta": "assistants=v2"
    };

    console.log(`Checking run status for thread ${threadId}, run ${runId}`);
    console.log(`Using OpenAI API key starting with: ${openaiApiKey.substring(0, 5)}***`);

    // Get run status - using try-catch for better error handling
    try {
      console.log(`Sending request to OpenAI API: GET /threads/${threadId}/runs/${runId}`);
      const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        method: "GET",
        headers: headers
      });
      
      console.log(`Response status: ${response.status}`);
      
      // Log headers for debugging
      console.log('Response headers:', [...response.headers.entries()].reduce((obj, [key, val]) => {
        obj[key] = val;
        return obj;
      }, {}));
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error("Error from OpenAI:", errorData);
        throw new Error(`Failed to check run: ${errorData}`);
      }
      
      const responseText = await response.text();
      console.log('Raw response:', responseText.substring(0, 200) + '...');
      
      // Parse the JSON response
      const runData = JSON.parse(responseText);
      console.log(`Run status: ${runData.status}`);
      
      return new Response(JSON.stringify({
        success: true,
        run: runData
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      throw new Error(`Network error checking run status: ${fetchError.message}`);
    }
    
  } catch (error) {
    console.error("❌ Error in check-run-status:", error.message);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "An unexpected error occurred"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
