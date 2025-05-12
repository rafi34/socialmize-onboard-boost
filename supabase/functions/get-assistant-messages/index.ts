
// @ts-ignore - Deno imports are not recognized by TypeScript but work at runtime
import { serve } from "https://deno.land/std@0.195.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Get environment variables
// @ts-ignore
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
// @ts-ignore
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
// @ts-ignore
const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || "";

console.log("🟢 get-assistant-messages function initializing");

// Required headers for OpenAI Assistants v2 API
const assistantsV2Headers = {
  "Authorization": `Bearer ${openaiApiKey}`,
  "Content-Type": "application/json",
  "OpenAI-Beta": "assistants=v2" // Required for v2 API
};

// Function to list messages in a thread using v2 API
async function listMessagesV2(threadId: string) {
  console.log("Listing messages from thread using Assistants v2 API");
  
  const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
    method: "GET",
    headers: assistantsV2Headers
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Message listing failed: ${response.status}`, errorText);
    throw new Error(`Message listing failed: ${errorText}`);
  }
  
  return await response.json();
}

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { threadId } = await req.json();

    if (!threadId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing thread ID" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check if OpenAI API key is available
    if (!openaiApiKey) {
      console.error("❌ Missing OpenAI API key");
      return new Response(
        JSON.stringify({ success: false, error: "Missing OpenAI API key configuration" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get thread information to verify it exists
    const { data: threadData, error: threadError } = await supabase
      .from("assistant_threads")
      .select("*")
      .eq("thread_id", threadId)
      .maybeSingle();

    if (threadError || !threadData) {
      console.error("❌ Error retrieving thread information:", threadError || "Thread not found");
      return new Response(
        JSON.stringify({ success: false, error: "Thread not found or database error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get messages from the thread using v2 API
    const messagesResponse = await listMessagesV2(threadId);
    
    console.log("🟢 Retrieved messages:", messagesResponse.data.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messages: messagesResponse.data,
        message: "Messages retrieved successfully" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Error in get-assistant-messages:", error.message);
    console.error("❌ Full error:", JSON.stringify(error));
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || "An unexpected error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
