// supabase/functions/generate-strategy-plan/index.ts
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
// @ts-ignore
const strategyAssistantId = Deno.env.get("STRATEGY_ASSISTANT_ID") || "";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Maximum number of polling attempts
const MAX_POLLING_ATTEMPTS = 30;

console.log("🟢 generate-strategy-plan function initializing");

// Initialize OpenAI client with v2 header
const openai = new OpenAI({
  // @ts-ignore
  apiKey: openaiApiKey,
  defaultHeaders: {
    "OpenAI-Beta": "assistants=v2" // Set v2 header for Assistants API
  }
});

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// The exact GPT instructions for content strategy generation
const GPT_STRATEGY_INSTRUCTIONS = `You are a world-class content strategist for social media creators. Your job is to return a personalized 4-week (30-day) content plan in JSON format using only the predefined content types provided by the SocialMize platform.

📌 VERY IMPORTANT:
- ONLY return valid, parsable JSON
- DO NOT include any conversational text, greetings, markdown, or explanations
- DO NOT include phases like "Phase 1" or "Phase 2"
- Your output must be ready to be rendered by a UI as JSON

📋 Use only the following content types:
- static_meme
- video_meme
- static_quote
- video_quote
- carousel
- static_infographic
- video_tutorial
- short_form_video
- livestream
- video_case_study
- podcast
- poll
- text_post
- behind_the_scenes
- question_post
- user_generated_content
- trending_news
`;

// Format content type to be more display-friendly
function formatContentType(contentType: string): string {
  // Convert snake_case to Title Case
  return contentType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Extract topic ideas from the parsed strategy
function extractTopicIdeas(parsedStrategy: any): string[] {
  try {
    const ideas: string[] = [];
    
    // Gather ideas from each week's example_post_ideas
    if (parsedStrategy.weeks && Array.isArray(parsedStrategy.weeks)) {
      parsedStrategy.weeks.forEach((week: any) => {
        if (week.example_post_ideas) {
          Object.values(week.example_post_ideas).forEach((typeIdeas: any) => {
            if (Array.isArray(typeIdeas)) {
              ideas.push(...typeIdeas);
            }
          });
        }
      });
    }
    
    // Also check for a dedicated topic_ideas section
    if (parsedStrategy.topic_ideas && Array.isArray(parsedStrategy.topic_ideas)) {
      ideas.push(...parsedStrategy.topic_ideas);
    }
    
    // De-duplicate ideas and return
    return [...new Set(ideas)];
  } catch (error) {
    console.error("Error extracting topic ideas:", error);
    return [];
  }
}

// Extract unique content types from the strategy
function extractContentTypes(parsedStrategy: any): string[] {
  try {
    const contentTypes = new Set<string>();
    
    // Gather content types from each post in each week
    if (parsedStrategy.weeks && Array.isArray(parsedStrategy.weeks)) {
      parsedStrategy.weeks.forEach((week: any) => {
        if (week.posts && Array.isArray(week.posts)) {
          week.posts.forEach((post: any) => {
            if (post.content_type) {
              contentTypes.add(post.content_type);
            }
          });
        }
      });
    }
    
    // Return formatted content types
    return Array.from(contentTypes);
  } catch (error) {
    console.error("Error extracting content types:", error);
    return [];
  }
}

// Extract weekly content summary from the parsed strategy
function extractWeeklySummary(parsedStrategy: any): Record<string, string[]> {
  try {
    const weeklySummary: Record<string, string[]> = {
      "Monday": [],
      "Tuesday": [],
      "Wednesday": [],
      "Thursday": [],
      "Friday": [],
      "Saturday": [],
      "Sunday": []
    };
    
    // Map numeric day to day name
    const dayMap: Record<number, string> = {
      1: "Monday",
      2: "Tuesday",
      3: "Wednesday",
      4: "Thursday",
      5: "Friday",
      6: "Saturday",
      0: "Sunday"
    };
    
    // Group content types by day of week
    if (parsedStrategy.weeks && Array.isArray(parsedStrategy.weeks)) {
      parsedStrategy.weeks.forEach((week: any) => {
        if (week.posts && Array.isArray(week.posts)) {
          week.posts.forEach((post: any) => {
            if (post.day_of_week !== undefined && post.content_type) {
              const dayName = dayMap[post.day_of_week];
              if (dayName && !weeklySummary[dayName].includes(post.content_type)) {
                weeklySummary[dayName].push(formatContentType(post.content_type));
              }
            }
          });
        }
      });
    }
    
    return weeklySummary;
  } catch (error) {
    console.error("Error extracting weekly summary:", error);
    return {
      "Monday": [],
      "Tuesday": [],
      "Wednesday": [],
      "Thursday": [],
      "Friday": [],
      "Saturday": [],
      "Sunday": []
    };
  }
}

// Function to create a mock strategy response for development/fallback
function createMockStrategyResponse(userId: string, onboardingData: any): Response {
  console.log("🟢 Creating mock strategy response");
  
  // Mock strategy data
  const mockStrategy = {
    "creator_info": {
      "niche": onboardingData?.niche || "Productivity",
      "goals": onboardingData?.goals || ["Grow audience", "Increase engagement"],
      "target_audience": onboardingData?.targetAudience || "Professionals aged 25-35",
      "content_themes": onboardingData?.contentThemes || ["Productivity tips", "Time management", "Goal setting"]
    },
    "strategy_summary": "Create a mix of educational and inspirational content focused on productivity and time management for young professionals. Post consistently 3-5 times per week, focusing on high-quality, actionable advice.",
    "content_pillars": [
      "Productivity Tips & Tricks",
      "Time Management Strategies",
      "Goal Setting Framework",
      "Work-Life Balance"
    ],
    "weeks": [
      {
        "week_number": 1,
        "theme": "Establishing Productivity Foundations",
        "posts": [
          {
            "day_of_week": 1,
            "content_type": "carousel",
            "topic": "5 Productivity Myths Debunked",
            "description": "Create a carousel post debunking common productivity myths and provide actionable alternatives."
          },
          {
            "day_of_week": 3,
            "content_type": "video_tutorial",
            "topic": "Setting Up Your Ideal Workspace",
            "description": "Share a tutorial on optimizing your workspace for maximum productivity."
          },
          {
            "day_of_week": 5,
            "content_type": "static_infographic",
            "topic": "The Pomodoro Technique Explained",
            "description": "Create an infographic explaining the Pomodoro Technique and its benefits."
          }
        ],
        "example_post_ideas": {
          "carousel": [
            "10 Must-Have Productivity Apps for 2025",
            "5 Morning Routines of Successful People",
            "The Science Behind Flow State: 7 Ways to Enter the Zone"
          ],
          "video_tutorial": [
            "How to Use the Eisenhower Matrix for Better Prioritization",
            "Digital Decluttering: 5 Steps to a Cleaner Digital Life",
            "3 Note-taking Methods That Will Transform Your Learning"
          ]
        }
      }
    ]
  };
  
  // Create mock record in strategy_profiles table
  console.log("🟢 Saving mock strategy to database");
  supabase
    .from('strategy_profiles')
    .upsert({
      user_id: userId,
      strategy_data: mockStrategy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      confirmed_at: null,
      is_active: true
    })
    .select()
    .then(response => {
      console.log("🟢 Mock strategy saved to database", response.data ? "successfully" : "with errors");
      if (response.error) {
        console.error("❌ Error saving mock strategy:", response.error);
      }
    })
    .catch(error => {
      console.error("❌ Error saving mock strategy:", error);
    });
  
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

// Main server function to handle requests
serve(async (req) => {
  console.log("🟢 generate-strategy-plan function triggered");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Parse request body
    console.log("🟢 Parsing request body");
    const requestData = await req.json().catch(e => {
      console.error("❌ Failed to parse request JSON:", e.message);
      throw new Error("Invalid JSON");
    });
    
    // Extract userId and onboarding data from request
    const { userId, onboardingData, isRegen = false, jobId } = requestData;
    
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing userId" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    if (!onboardingData) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing onboarding data" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check if we have a valid Strategy Assistant ID
    if (!strategyAssistantId) {
      console.warn("⚠️ No strategy assistant ID found in environment variables. Using mock data.");
      return createMockStrategyResponse(userId, onboardingData);
    }
    
    // Track the job status in the database
    console.log("🟢 Tracking job in database");
    await supabase
      .from('strategy_generation_jobs')
      .upsert({
        job_id: jobId,
        user_id: userId,
        status: 'processing',
        strategy_type: 'starter',
        is_regen: isRegen,
        created_at: new Date().toISOString()
      })
      .select();
    
    try {
      // Create a new thread specifically for strategy generation
      console.log("🟢 Creating a new thread for strategy generation");
      const thread = await openai.beta.threads.create();
      const threadId = thread.id;
      console.log("🟢 Created thread with ID:", threadId);
      
      // Prepare user message with onboarding data
      console.log("🟢 Adding user message to thread");
      await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: `Please create a content strategy plan based on the following information:\n\nNiche: ${onboardingData.niche || 'Not specified'}\nTarget Audience: ${onboardingData.targetAudience || 'Not specified'}\nContent Types: ${onboardingData.contentTypes?.join(', ') || 'Not specified'}\nGoals: ${onboardingData.goals?.join(', ') || 'Not specified'}\nPosting Frequency: ${onboardingData.postingFrequency || 'Not specified'}\nContent Themes: ${onboardingData.contentThemes?.join(', ') || 'Not specified'}`
      });
      
      // Run the assistant on the thread
      console.log("🟢 Running assistant on thread");
      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: strategyAssistantId,
        instructions: GPT_STRATEGY_INSTRUCTIONS
      });
      
      // Poll for completion
      console.log("🟢 Polling for run completion");
      let completedRun = null;
      let attempts = 0;
      
      while (!completedRun && attempts < MAX_POLLING_ATTEMPTS) {
        attempts++;
        
        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check run status
        const runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
        console.log(`🟢 Run status (attempt ${attempts}):`, runStatus.status);
        
        if (runStatus.status === "completed") {
          completedRun = runStatus;
          break;
        } else if (runStatus.status === "failed" || runStatus.status === "cancelled" || runStatus.status === "expired") {
          throw new Error(`Run failed with status: ${runStatus.status}`);
        }
      }
      
      // Get messages from the thread
      console.log("🟢 Retrieving messages from thread");
      const messages = await openai.beta.threads.messages.list(threadId);
      
      // Find assistant messages (the strategy plan)
      const assistantMessages = messages.data.filter(message => message.role === "assistant");
      
      if (assistantMessages.length === 0) {
        console.error("❌ No assistant messages found");
        throw new Error("No assistant messages found");
      }
      
      // Extract content from the latest assistant message
      const latestMessage = assistantMessages[0];
      let strategyContent = "";
      
      if (latestMessage.content && latestMessage.content.length > 0) {
        const textContent = latestMessage.content.find(c => c.type === "text");
        if (textContent && 'text' in textContent) {
          strategyContent = textContent.text.value;
        }
      }
      
      if (!strategyContent) {
        console.error("❌ No content found in assistant message");
        throw new Error("No content found in assistant message");
      }
      
      console.log("🟢 Parsing strategy content");
      let parsedStrategy;
      try {
        parsedStrategy = JSON.parse(strategyContent);
      } catch (parseError) {
        console.error("❌ Failed to parse strategy JSON:", parseError);
        throw new Error("Failed to parse strategy JSON. The assistant did not return valid JSON.");
      }
      
      // Save strategy to database
      console.log("🟢 Saving strategy to database");
      const { data, error } = await supabase
        .from('strategy_profiles')
        .upsert({
          user_id: userId,
          strategy_data: parsedStrategy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          confirmed_at: null,
          is_active: true,
          job_id: jobId
        })
        .select();
      
      if (error) {
        console.error("❌ Error saving strategy:", error);
        throw new Error(`Failed to save strategy: ${error.message}`);
      }
      
      // Update job status to completed
      console.log("🟢 Updating job status to completed");
      await supabase
        .from('strategy_generation_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('job_id', jobId);
      
      // Return success response
      console.log("🟢 Returning success response");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Strategy plan generated successfully",
          mock: false,
          strategy: {
            id: data?.[0]?.id,
            topicIdeas: extractTopicIdeas(parsedStrategy),
            contentTypes: extractContentTypes(parsedStrategy).map(formatContentType),
            weeklySummary: extractWeeklySummary(parsedStrategy)
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (innerError: any) {
      console.error("❌ Error in strategy generation:", innerError);
      
      // Update job status to failed
      await supabase
        .from('strategy_generation_jobs')
        .update({
          status: 'failed',
          error_message: innerError.message || 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('job_id', jobId);
      
      throw innerError; // Re-throw to be caught by outer catch
    }
  } catch (error: any) {
    console.error('Error in generate-strategy-plan:', error.message);
    console.error('Full error:', JSON.stringify(error));

    return new Response(
      JSON.stringify({ success: false, error: error.message || 'An unexpected error occurred' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
