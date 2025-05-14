
// supabase/functions/generate-strategy/index.ts
import { serve } from "https://deno.land/std@0.195.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.28.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Get environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Initialize OpenAI client with v2 header
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
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
    const { userId, userMessage, threadId, onboardingData } = await req.json();

    if (!userId || !userMessage) {
      return new Response(
        JSON.stringify({ success: false, error: "User ID and message are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("Processing strategy chat for user:", userId);
    
    // Get the assistant ID - specifically using ASSISTANT_ID for strategy chat
    const assistantIdRaw = Deno.env.get("ASSISTANT_ID");
    const assistantId = assistantIdRaw ? assistantIdRaw.trim() : null;
    
    if (!assistantId) {
      console.error("Missing ASSISTANT_ID environment variable");
      return new Response(
        JSON.stringify({
          success: false,
          error: "ASSISTANT_ID not configured",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Using Assistant ID:", assistantId);

    // Initialize the Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    try {
      // Create or retrieve a thread
      let currentThreadId = threadId;
      
      if (!currentThreadId) {
        // Create a new thread
        const thread = await openai.beta.threads.create();
        currentThreadId = thread.id;
        console.log("New thread created:", currentThreadId);
      } else {
        console.log("Using existing thread:", currentThreadId);
      }
      
      // Create the message in the thread
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
      while (true) {
        try {
          // Check run status
          const runStatus = await openai.beta.threads.runs.retrieve(
            currentThreadId,
            run.id
          );
          
          console.log("Run status:", runStatus.status);
          
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
      
      // Check for completion markers in the message
      const isCompleted = messageContent.includes("[COMPLETED]") || 
                        messageContent.includes("[STRATEGY_COMPLETE]") || 
                        messageContent.includes("[CONTENT_IDEAS]");
      
      // Extract content ideas if present
      let contentIdeas = [];
      if (isCompleted) {
        try {
          // Look for content ideas in the message
          const ideasMatch = messageContent.match(/\[CONTENT_IDEAS\]([\s\S]*?)(?:\[|$)/);
          if (ideasMatch && ideasMatch[1]) {
            contentIdeas = ideasMatch[1]
              .split('\n')
              .filter(line => line.trim().length > 0)
              .map(line => line.replace(/^-\s*/, '').trim());
          }
        } catch (error) {
          console.error("Error extracting content ideas:", error);
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          threadId: currentThreadId,
          message: messageContent,
          completed: isCompleted,
          contentIdeas: contentIdeas
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      
    } catch (openaiError) {
      console.error("OpenAI API Error:", openaiError);
      
      // Try to provide more specific error information
      let errorMessage = "An error occurred with the AI service.";
      if (openaiError.error?.message) {
        errorMessage = openaiError.error.message;
      } else if (typeof openaiError.message === 'string') {
        errorMessage = openaiError.message;
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage,
          threadId: currentThreadId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in generate-strategy:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || "An unexpected error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
