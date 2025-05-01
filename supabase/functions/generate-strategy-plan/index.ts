
// supabase/functions/generate-strategy-plan/index.ts
import { serve } from "https://deno.land/std@0.195.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.28.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Get environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Initialize OpenAI and Supabase clients
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
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
    const { userId, onboardingData } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "User ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("Processing strategy plan generation for user:", userId);
    
    // Get the assistant ID - using specifically SOCIALMIZE_AFTER_ONBOARDING_ASSISTANT_ID for dashboard
    const assistantIdRaw = Deno.env.get("SOCIALMIZE_AFTER_ONBOARDING_ASSISTANT_ID");
    const assistantId = assistantIdRaw ? assistantIdRaw.trim() : null;
    
    if (!assistantId) {
      console.error("Missing SOCIALMIZE_AFTER_ONBOARDING_ASSISTANT_ID environment variable");
      return new Response(
        JSON.stringify({
          success: false,
          error: "SOCIALMIZE_AFTER_ONBOARDING_ASSISTANT_ID not configured",
          mock: true,
          // Return mock data for testing when assistant ID is not configured
          results: { /* mock data structure */ }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize the Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    try {
      // Create a thread
      const thread = await openai.beta.threads.create();
      console.log("Thread created:", thread.id);
      
      // Create the message in the thread
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: `I need a content strategy plan based on my profile data: ${JSON.stringify(onboardingData)}`,
      });
      
      // Run the assistant
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistantId,
      });
      
      console.log("Run created:", run.id);
      
      // Poll for completion
      let completedRun;
      while (true) {
        // Check run status
        const runStatus = await openai.beta.threads.runs.retrieve(
          thread.id,
          run.id
        );
        
        if (runStatus.status === "completed") {
          completedRun = runStatus;
          break;
        } else if (["failed", "cancelled", "expired"].includes(runStatus.status)) {
          throw new Error(`Run ended with status: ${runStatus.status}`);
        }
        
        // Wait before polling again
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      
      // Get the messages with the completion
      const messages = await openai.beta.threads.messages.list(thread.id);
      const assistantMessages = messages.data
        .filter((message) => message.role === "assistant")
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      if (assistantMessages.length === 0) {
        throw new Error("No assistant messages found");
      }
      
      // Get the latest assistant message
      const latestMessage = assistantMessages[assistantMessages.length - 1];
      const messageContent = latestMessage.content[0].type === "text" 
        ? latestMessage.content[0].text.value 
        : "";
      
      try {
        // Parse the JSON response
        const parsedContent = JSON.parse(messageContent);
        
        // First, check if a profile exists
        const { data: existingProfile } = await supabase
          .from('strategy_profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
          
        // Prepare the data to insert/update
        const strategyData = {
          user_id: userId,
          summary: parsedContent.summary || null,
          phases: parsedContent.phases || null,
          niche_topic: onboardingData.niche_topic || null,
          experience_level: onboardingData.experience_level || "beginner",
          creator_style: onboardingData.creator_style || null,
          posting_frequency: onboardingData.posting_frequency_goal || null,
          topic_ideas: parsedContent.topic_ideas || [],
          full_plan_text: messageContent
        };
        
        let response;
        
        if (existingProfile) {
          // Update the existing profile
          response = await supabase
            .from('strategy_profiles')
            .update(strategyData)
            .eq('id', existingProfile.id)
            .select();
        } else {
          // Create a new profile
          response = await supabase
            .from('strategy_profiles')
            .insert(strategyData)
            .select();
        }
        
        if (response.error) {
          console.error("Error saving strategy plan:", response.error);
          throw response.error;
        }
        
        console.log("Strategy plan generated and saved successfully");
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Strategy plan generated successfully"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (parseError) {
        console.error("Error parsing strategy plan:", parseError);
        
        // Save the raw response as fallback
        // First, check if a profile exists
        const { data: existingProfile } = await supabase
          .from('strategy_profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        // Prepare the data to insert/update
        const rawData = {
          user_id: userId,
          full_plan_text: messageContent,
          niche_topic: onboardingData.niche_topic || null,
          creator_style: onboardingData.creator_style || null,
          posting_frequency: onboardingData.posting_frequency_goal || null,
        };
        
        let response;
        
        if (existingProfile) {
          // Update the existing profile
          response = await supabase
            .from('strategy_profiles')
            .update(rawData)
            .eq('id', existingProfile.id)
            .select();
        } else {
          // Create a new profile
          response = await supabase
            .from('strategy_profiles')
            .insert(rawData)
            .select();
        }
        
        if (response.error) {
          console.error("Error saving raw strategy plan:", response.error);
          throw response.error;
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Strategy plan saved as raw text"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (openaiError) {
      console.error("OpenAI API Error:", openaiError);
      throw openaiError;
    }
  } catch (error) {
    console.error("Error in generate-strategy-plan:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || "An unexpected error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
