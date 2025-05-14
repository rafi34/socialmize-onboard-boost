// supabase/functions/send-assistant-message/index.ts
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

console.log("🟢 send-assistant-message function initializing");

// Required headers for OpenAI Assistants v2 API
const assistantsV2Headers = {
  "Authorization": `Bearer ${openaiApiKey}`,
  "Content-Type": "application/json",
  "OpenAI-Beta": "assistants=v2" // Required for v2 API
};

// Function to send a message to a thread using v2 API
async function sendMessageV2(threadId: string, message: string) {
  console.log("Sending message to thread using Assistants v2 API");
  
  const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
    method: "POST",
    headers: assistantsV2Headers,
    body: JSON.stringify({
      role: "user",
      content: message
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Message creation failed: ${response.status}`, errorText);
    throw new Error(`Message creation failed: ${errorText}`);
  }
  
  return await response.json();
}

// Function to create a run with the assistant using v2 API
async function createRunV2(threadId: string, assistantId: string, additionalInstructions: string) {
  console.log("Creating run with Assistants v2 API");
  
  const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
    method: "POST",
    headers: assistantsV2Headers,
    body: JSON.stringify({
      assistant_id: assistantId,
      additional_instructions: additionalInstructions
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Run creation failed: ${response.status}`, errorText);
    throw new Error(`Run creation failed: ${errorText}`);
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
    const { threadId, userId, message } = await req.json();

    if (!threadId || !userId || !message) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required parameters" }),
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

    // Get thread information to obtain the associated assistant ID
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

    // Get the assistant ID from the thread data
    const assistantId = threadData.assistant_id;
    
    if (!assistantId) {
      console.error("❌ No assistant ID associated with this thread");
      return new Response(
        JSON.stringify({ success: false, error: "No assistant ID associated with this thread" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get onboarding data to provide context for the assistant
    const { data: onboardingData, error: onboardingError } = await supabase
      .from("onboarding_answers")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (onboardingError) {
      console.error("❌ Error retrieving onboarding data:", onboardingError);
      // Continue anyway as this is supplementary context
    }

    // Get the active strategy for additional context
    const { data: strategyData, error: strategyError } = await supabase
      .from("strategy_profiles")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .not("confirmed_at", "is", null)
      .maybeSingle();

    if (strategyError) {
      console.error("❌ Error retrieving strategy data:", strategyError);
      // Continue anyway as this is supplementary context
    }

    // Add user message to thread using the helper function
    const userMessage = await sendMessageV2(threadId, message);
    console.log("🟢 Added user message to thread:", userMessage.id);

    // Create additional instructions with user context
    const additionalInstructions = `
      This user has the following profile:
      ${onboardingData ? `- Experience Level: ${onboardingData.experience_level}
      - Niche: ${onboardingData.niche_topic}
      - Content Types: ${onboardingData.content_types?.join(", ") || "Not specified"}
      - Creator Style: ${onboardingData.creator_style || "Not specified"}` : "No onboarding data available."}
      
      ${strategyData ? `- Current Strategy Type: ${strategyData.strategy_type}
      - Posting Frequency: ${strategyData.posting_frequency}` : "No strategy data available."}
      
      Remember: Generate a detailed 30-day content plan with specific content ideas tailored to the user's goals. The plan should include a mission, weekly objective, content schedule, and at least 15-20 specific content ideas.
    `;
    
    // Begin running the assistant on the thread using the helper function
    const run = await createRunV2(threadId, assistantId, additionalInstructions);
    console.log("🟢 Started run:", run.id);

    // Store message information in database for tracking
    const { error: msgError } = await supabase
      .from("assistant_messages")
      .insert({
        thread_id: threadId,
        message_id: userMessage.id,
        user_id: userId,
        content: message,
        role: "user",
        created_at: new Date().toISOString(),
      });

    if (msgError) {
      console.error("❌ Error storing message in database:", msgError);
      // Continue anyway as the message was sent
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: userMessage.id,
        runId: run.id,
        message: "Message sent and run started" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Error in send-assistant-message:", error.message);
    console.error("❌ Full error:", JSON.stringify(error));
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || "An unexpected error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
