// supabase/functions/generate-content-plan/index.ts
import { serve } from "https://deno.land/std@0.195.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.28.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Get environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || "";

// Initialize OpenAI client with v2 header
const openai = new OpenAI({
  apiKey: openaiApiKey,
  defaultHeaders: {
    "OpenAI-Beta": "assistants=v2" // Set v2 header for Assistants API
  }
});

// CORS headers for browser requests
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
    // Parse request body
    const { 
      userId, 
      userMessage, 
      threadId
    } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "User ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    console.log("Processing content plan for user:", userId);
    
    // Initialize the Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get Assistant ID from app_config
    const { data: configData, error: configError } = await supabase
      .from('app_config')
      .select('config_value')
      .eq('config_key', 'CONTENT_PLAN_ASSISTANT_ID')
      .single();
      
    if (configError || !configData?.config_value) {
      console.error("Error fetching assistant ID:", configError || "No assistant ID found");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to get assistant configuration",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    const assistantId = configData.config_value;
    console.log("Using Assistant ID:", assistantId);
    
    if (!assistantId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Assistant ID not configured",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Proceed with normal message handling
    if (!userMessage) {
      return new Response(
        JSON.stringify({ success: false, error: "User message is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    try {
      // Create or retrieve a thread
      let currentThreadId = threadId;
      
      try {
        if (!currentThreadId) {
          // Create a new thread
          const thread = await openai.beta.threads.create();
          currentThreadId = thread.id;
          console.log("New thread created:", currentThreadId);
          
          // Record thread in assistant_threads table
          const { error: threadError } = await supabase
            .from('assistant_threads')
            .insert({
              thread_id: currentThreadId,
              user_id: userId,
              purpose: 'content_planning',
              assistant_id: assistantId,
              created_at: new Date().toISOString()
            });
            
          if (threadError) {
            console.error("Error saving thread:", threadError);
          }
        } else {
          console.log("Using existing thread:", currentThreadId);
        }
        
        // Add the user message to the thread
        await openai.beta.threads.messages.create(currentThreadId, {
          role: "user",
          content: userMessage,
        });
        
        console.log("Added user message to thread");
        
        // Run the assistant
        const run = await openai.beta.threads.runs.create(currentThreadId, {
          assistant_id: assistantId,
        });
        
        console.log("Run created:", run.id);
        
        // Poll for completion
        let completedRun;
        let runStatus;
        const maxAttempts = 30;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
          attempts++;
          try {
            // Check run status
            runStatus = await openai.beta.threads.runs.retrieve(
              currentThreadId,
              run.id
            );
            
            console.log("Current run status:", runStatus.status, "- Attempt:", attempts);
            
            if (runStatus.status === "completed") {
              completedRun = runStatus;
              break;
            } else if (["failed", "cancelled", "expired"].includes(runStatus.status)) {
              throw new Error(`Run ended with status: ${runStatus.status}, error: ${JSON.stringify(runStatus.last_error || {})}`);
            }
            
            // Wait before polling again
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (pollError) {
            console.error("Error during polling:", pollError);
            throw pollError;
          }
        }
        
        if (!completedRun) {
          throw new Error(`Run did not complete after ${maxAttempts} attempts`);
        }
        
        // Get the messages with the completion
        const messages = await openai.beta.threads.messages.list(currentThreadId);
        const assistantMessages = messages.data
          .filter((message) => message.role === "assistant")
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        if (assistantMessages.length === 0) {
          throw new Error("No assistant messages found");
        }
        
        // Get the latest assistant message
        const latestMessage = assistantMessages[0];
        let messageContent = "";
        
        if (latestMessage.content && latestMessage.content.length > 0 && latestMessage.content[0].type === "text") {
          messageContent = latestMessage.content[0].text.value;
        } else {
          console.warn("Unexpected message format:", JSON.stringify(latestMessage.content));
          messageContent = "I'm having trouble generating a response right now. Please try again.";
        }
        
        // Return the successful response
        return new Response(
          JSON.stringify({
            success: true,
            threadId: currentThreadId,
            message: {
              id: latestMessage.id,
              content: messageContent,
              created_at: latestMessage.created_at
            }
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (chatError) {
        console.error("Error processing chat:", chatError);
        throw chatError;
      }
    } catch (error) {
      console.error("API error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message || "Error generating content plan"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
  } catch (error) {
    console.error("Request error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Invalid request"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
