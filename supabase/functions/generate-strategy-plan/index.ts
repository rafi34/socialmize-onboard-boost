
// supabase/functions/generate-strategy-plan/index.ts
import { serve } from "https://deno.land/std@0.195.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.28.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Get environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

console.log("🟢 generate-strategy-plan function initializing");

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
  console.log("🟢 generate-strategy-plan function triggered");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("🟢 CORS preflight request handled");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    console.log("🟢 Parsing request body");
    const requestData = await req.json().catch(e => {
      console.error("❌ Failed to parse request JSON:", e.message);
      return {};
    });
    
    const { userId, onboardingData } = requestData;
    
    console.log("📥 Incoming userId:", userId);
    console.log("🧠 OnboardingData:", onboardingData ? "present" : "missing");
    if (onboardingData) {
      console.log("🧠 OnboardingData keys:", Object.keys(onboardingData || {}));
    }

    if (!userId) {
      console.error("❌ Missing userId in request");
      return new Response(
        JSON.stringify({ success: false, error: "User ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("🟢 Processing strategy plan generation for user:", userId);
    
    // Get the assistant ID - using specifically SOCIALMIZE_AFTER_ONBOARDING_ASSISTANT_ID for dashboard
    const assistantIdRaw = Deno.env.get("SOCIALMIZE_AFTER_ONBOARDING_ASSISTANT_ID");
    const assistantId = assistantIdRaw ? assistantIdRaw.trim() : null;
    console.log("🧠 Assistant ID loaded:", assistantId ? "present" : "missing");
    
    if (!assistantId) {
      console.error("❌ Missing SOCIALMIZE_AFTER_ONBOARDING_ASSISTANT_ID environment variable");
      // Use mock data to allow development without OpenAI setup
      return createMockStrategyResponse(userId, onboardingData, corsHeaders);
    }

    // Initialize the Supabase client
    console.log("🟢 Initializing Supabase client");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("🟢 Supabase client initialized");
    
    try {
      // Create a thread
      console.log("🟢 Creating OpenAI thread");
      const thread = await openai.beta.threads.create().catch(e => {
        console.error("❌ Failed to create thread:", e.message);
        throw e;
      });
      console.log("🟢 Thread created:", thread.id);
      
      // Create the message in the thread
      console.log("🟢 Creating message in thread");
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: `I need a content strategy plan based on my profile data: ${JSON.stringify(onboardingData)}`,
      }).catch(e => {
        console.error("❌ Failed to create message:", e.message);
        throw e;
      });
      console.log("🟢 Message created in thread");
      
      // Run the assistant
      console.log("🟢 Running assistant with ID:", assistantId);
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistantId,
      }).catch(e => {
        console.error("❌ Failed to create run:", e.message);
        throw e;
      });
      
      console.log("🟢 Run created:", run.id);
      
      // Poll for completion
      let completedRun;
      let attempts = 0;
      const maxAttempts = 30; // 30 second timeout (1s * 30)
      
      console.log("🟢 Polling for run completion");
      while (attempts < maxAttempts) {
        // Check run status
        console.log(`🟢 Checking run status (attempt ${attempts + 1}/${maxAttempts})`);
        const runStatus = await openai.beta.threads.runs.retrieve(
          thread.id,
          run.id
        ).catch(e => {
          console.error(`❌ Failed to retrieve run status (attempt ${attempts + 1}):`, e.message);
          throw e;
        });
        
        console.log(`🟢 Run status: ${runStatus.status}`);
        if (runStatus.status === "completed") {
          console.log("🟢 Run completed successfully");
          completedRun = runStatus;
          break;
        } else if (["failed", "cancelled", "expired"].includes(runStatus.status)) {
          console.error(`❌ Run ended with status: ${runStatus.status}`);
          throw new Error(`Run ended with status: ${runStatus.status}`);
        }
        
        // Wait before polling again
        console.log("🟢 Waiting before next poll...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      }
      
      if (!completedRun) {
        console.error("❌ Assistant run timed out");
        throw new Error("Assistant run timed out");
      }
      
      // Get the messages with the completion
      console.log("🟢 Retrieving messages");
      const messages = await openai.beta.threads.messages.list(thread.id).catch(e => {
        console.error("❌ Failed to list messages:", e.message);
        throw e;
      });
      
      const assistantMessages = messages.data
        .filter((message) => message.role === "assistant")
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      console.log(`🟢 Found ${assistantMessages.length} assistant messages`);
      
      if (assistantMessages.length === 0) {
        console.error("❌ No assistant messages found");
        throw new Error("No assistant messages found");
      }
      
      // Get the latest assistant message
      const latestMessage = assistantMessages[assistantMessages.length - 1];
      console.log("🟢 Latest message ID:", latestMessage.id);
      
      // Check if the message has content
      if (!latestMessage.content || latestMessage.content.length === 0) {
        console.error("❌ Latest message has no content");
        throw new Error("Latest message has no content");
      }
      
      console.log("🟢 Message content type:", latestMessage.content[0].type);
      
      const messageContent = latestMessage.content[0].type === "text" 
        ? latestMessage.content[0].text.value 
        : "";
      
      console.log("🟢 Message content length:", messageContent.length);
      
      if (!messageContent || messageContent.trim().length === 0) {
        console.error("❌ Empty message content");
        throw new Error("Empty message content");
      }
      
      try {
        // Parse the JSON response
        console.log("🟢 Attempting to parse message content as JSON");
        const parsedContent = JSON.parse(messageContent);
        console.log("🟢 Successfully parsed JSON content");
        console.log("🟢 JSON keys:", Object.keys(parsedContent));
        
        // Save to the database using upsert pattern
        console.log("🟢 Saving to database");
        const { data: upsertData, error: upsertError } = await upsertStrategyProfile(supabase, {
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
          console.error("❌ Error saving strategy plan:", upsertError);
          throw upsertError;
        }
        
        console.log("🟢 Strategy plan generated and saved successfully, ID:", upsertData ? upsertData.id : "unknown");
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Strategy plan generated successfully"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (parseError) {
        console.error("❌ Error parsing strategy plan:", parseError.message);
        
        // Save the raw response as fallback
        console.log("🟢 Saving raw response as fallback");
        const { data: upsertData, error: upsertError } = await upsertStrategyProfile(supabase, {
          userId,
          data: {
            full_plan_text: messageContent,
            niche_topic: onboardingData.niche_topic || null,
            creator_style: onboardingData.creator_style || null,
            posting_frequency: onboardingData.posting_frequency_goal || null,
          }
        });
        
        if (upsertError) {
          console.error("❌ Error saving raw strategy plan:", upsertError);
          throw upsertError;
        }
        
        console.log("🟢 Raw strategy plan saved successfully, ID:", upsertData ? upsertData.id : "unknown");
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Strategy plan saved as raw text"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (openaiError) {
      console.error("❌ OpenAI API Error:", openaiError.message);
      console.error("❌ Full error:", JSON.stringify(openaiError));
      
      // Try to use mock data as fallback
      console.log("🟢 Falling back to mock data");
      return createMockStrategyResponse(userId, onboardingData, corsHeaders);
    }
  } catch (error) {
    console.error("❌ Error in generate-strategy-plan:", error.message);
    console.error("❌ Full error:", JSON.stringify(error));
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || "An unexpected error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// Helper function to upsert a strategy profile
async function upsertStrategyProfile(supabase, { userId, data }) {
  console.log("🟢 Upserting strategy profile for user:", userId);
  
  // First check if a profile exists
  const { data: existingProfile, error: checkError } = await supabase
    .from('strategy_profiles')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (checkError) {
    console.error("❌ Error checking for existing profile:", checkError);
    throw checkError;
  }

  if (existingProfile) {
    // Update existing profile
    console.log("🟢 Updating existing strategy profile:", existingProfile.id);
    return supabase
      .from('strategy_profiles')
      .update(data)
      .eq('id', existingProfile.id)
      .select();
  } else {
    // Create new profile
    console.log("🟢 Creating new strategy profile");
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
  console.log("🟢 Using mock strategy plan data");
  
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
  console.log("🟢 Creating Supabase client for mock data");
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Save mock data to the database
  console.log("🟢 Saving mock data to database");
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
  }).catch(error => console.error("❌ Error saving mock strategy:", error));
  
  // Return success response
  console.log("🟢 Returning mock data success response");
  return new Response(
    JSON.stringify({ 
      success: true,
      message: "Mock strategy plan generated successfully",
      mock: true
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
