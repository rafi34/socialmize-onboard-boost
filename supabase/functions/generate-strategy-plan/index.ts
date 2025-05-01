
// supabase/functions/generate-strategy-plan/index.ts
import { serve } from "https://deno.land/std@0.195.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.28.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Get environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Initialize OpenAI client with v2 Assistants API header
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
  defaultHeaders: {
    "OpenAI-Beta": "assistants=v2"  // Add this header for v2 compatibility
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
      // Use mock data to allow development without OpenAI setup
      return createMockStrategyResponse(userId, onboardingData, corsHeaders);
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
      let attempts = 0;
      const maxAttempts = 30; // 30 second timeout (1s * 30)
      
      while (attempts < maxAttempts) {
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
        attempts++;
      }
      
      if (!completedRun) {
        throw new Error("Assistant run timed out");
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
        
        // Save to the database using upsert pattern
        const { error: upsertError } = await upsertStrategyProfile(supabase, {
          userId,
          data: {
            summary: parsedContent.summary || null,
            phases: parsedContent.phases || null,
            niche_topic: onboardingData.niche_topic || null,
            experience_level: onboardingData.experience_level || "beginner",
            creator_style: onboardingData.creator_style || null,
            posting_frequency: onboardingData.posting_frequency_goal || null,
            topic_ideas: parsedContent.topic_ideas || [],
            full_plan_text: messageContent
          }
        });
        
        if (upsertError) {
          console.error("Error saving strategy plan:", upsertError);
          throw upsertError;
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
        const { error: upsertError } = await upsertStrategyProfile(supabase, {
          userId,
          data: {
            full_plan_text: messageContent,
            niche_topic: onboardingData.niche_topic || null,
            creator_style: onboardingData.creator_style || null,
            posting_frequency: onboardingData.posting_frequency_goal || null,
          }
        });
        
        if (upsertError) {
          console.error("Error saving raw strategy plan:", upsertError);
          throw upsertError;
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
      
      // Try to use mock data as fallback
      return createMockStrategyResponse(userId, onboardingData, corsHeaders);
    }
  } catch (error) {
    console.error("Error in generate-strategy-plan:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || "An unexpected error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// Helper function to upsert a strategy profile
async function upsertStrategyProfile(supabase, { userId, data }) {
  // First check if a profile exists
  const { data: existingProfile } = await supabase
    .from('strategy_profiles')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingProfile) {
    // Update existing profile
    return supabase
      .from('strategy_profiles')
      .update(data)
      .eq('id', existingProfile.id)
      .select();
  } else {
    // Create new profile
    return supabase
      .from('strategy_profiles')
      .insert({
        ...data,
        user_id: userId
      })
      .select();
  }
}

// Function to create a mock strategy response for development/fallback
function createMockStrategyResponse(userId, onboardingData, corsHeaders) {
  console.log("Using mock strategy plan data");
  
  // Create mock strategy data
  const mockStrategy = {
    summary: "Your personalized content strategy focuses on growing your audience through consistent, high-quality content that showcases your unique perspective.",
    phases: [
      {
        title: "Phase 1: Foundation Building",
        goal: "Establish your presence and find your voice",
        tactics: [
          "Create a consistent posting schedule",
          "Experiment with different content formats",
          "Analyze what resonates with your audience"
        ],
        content_plan: {
          weekly_schedule: {
            "Talking Head": 2,
            "Tutorial": 1
          }
        }
      },
      {
        title: "Phase 2: Growth & Engagement",
        goal: "Expand reach and build community",
        tactics: [
          "Collaborate with complementary creators",
          "Implement engagement-focused calls to action",
          "Repurpose successful content across platforms"
        ]
      }
    ],
    topic_ideas: [
      "Day in the life as a creator",
      "Behind the scenes of content creation",
      "Top tips for your niche area",
      "Answering common questions in your field"
    ]
  };
  
  // Create client to save mock data
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Save mock data to the database
  upsertStrategyProfile(supabase, {
    userId,
    data: {
      summary: mockStrategy.summary,
      phases: mockStrategy.phases,
      niche_topic: onboardingData?.niche_topic || "Content Creation",
      experience_level: onboardingData?.experience_level || "beginner",
      creator_style: onboardingData?.creator_style || "Authentic",
      posting_frequency: onboardingData?.posting_frequency_goal || "3-5 times per week",
      topic_ideas: mockStrategy.topic_ideas,
      full_plan_text: JSON.stringify(mockStrategy)
    }
  }).catch(error => console.error("Error saving mock strategy:", error));
  
  // Return success response
  return new Response(
    JSON.stringify({ 
      success: true,
      message: "Mock strategy plan generated successfully",
      mock: true
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
