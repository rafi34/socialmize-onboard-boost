// supabase/functions/create-assistant-thread/index.ts
// @ts-ignore - Deno imports are not recognized by TypeScript but work at runtime
import { serve } from "https://deno.land/std@0.195.0/http/server.ts";
// @ts-ignore
import OpenAI from "https://esm.sh/openai@4.28.0";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Get environment variables
// @ts-ignore
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
// @ts-ignore
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
// @ts-ignore
const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || "";

console.log("🟢 create-assistant-thread function initializing");

// Required headers for OpenAI Assistants v2 API
const assistantsV2Headers = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${openaiApiKey}`,
  "OpenAI-Beta": "assistants=v2" // Required for v2 API
};

// Function to create a thread using v2 API
async function createThreadV2() {
  console.log("Creating thread with Assistants v2 API");
  
  const response = await fetch("https://api.openai.com/v1/threads", {
    method: "POST",
    headers: assistantsV2Headers,
    body: JSON.stringify({}) // Empty body for thread creation
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Thread creation failed: ${response.status}`, errorText);
    throw new Error(`Thread creation failed: ${errorText}`);
  }
  
  return await response.json();
}

console.log("📝 OpenAI client initialized with key length:", openaiApiKey ? openaiApiKey.length : 0);

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
    const { userId, purpose, assistantId: requestAssistantId } = await req.json();
    let assistantId = requestAssistantId;

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required parameters" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // If no assistantId provided, try to get it from app_config
    if (!assistantId) {
      console.log("No assistantId provided, fetching from app_config");
      try {
        const { data, error } = await supabase
          .from('app_config')
          .select('config_value')
          .eq('config_key', 'CONTENT_PLAN_ASSISTANT_ID')
          .single();
          
        if (error) throw error;
        
        if (data?.config_value) {
          assistantId = data.config_value;
          console.log("✅ Got assistantId from app_config:", assistantId);
        } else {
          console.error("❌ No assistantId found in app_config");
          return new Response(
            JSON.stringify({ success: false, error: "No assistant ID configured" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
          );
        }
      } catch (configError) {
        console.error("❌ Error fetching assistantId from app_config:", configError);
        return new Response(
          JSON.stringify({ success: false, error: "Error fetching assistant configuration" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
    }

    // Check if OpenAI API key is available
    if (!openaiApiKey) {
      console.error("❌ Missing OpenAI API key");
      return new Response(
        JSON.stringify({ success: false, error: "Missing OpenAI API key configuration" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Create a new thread with v2 headers
    const thread = await createThreadV2();
    console.log("🟢 Created thread:", thread.id);

    // Store thread information in database
    const { error: dbError } = await supabase
      .from("assistant_threads")
      .insert({
        thread_id: thread.id,
        user_id: userId,
        purpose: purpose || "content_plan",
        assistant_id: assistantId,
        created_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error("❌ Error storing thread in database:", dbError);
      // Continue anyway as the thread was created
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        threadId: thread.id,
        message: "Thread created successfully" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Error in create-assistant-thread:", error.message);
    console.error("❌ Full error:", JSON.stringify(error));
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || "An unexpected error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
