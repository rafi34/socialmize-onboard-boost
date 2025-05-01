
// supabase/functions/generate-strategy-plan/index.ts
import { serve } from "https://deno.land/std@0.195.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.28.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Get environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || "";

console.log("🟢 generate-strategy-plan function initializing");

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: openaiApiKey
});

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
- duet
- overlay_music_video
- talking_head
- podcast_clip
- carousel
- blog_style
- cta_video
- lifestyle_image
- skit_style

🎯 For each week:
- Pick 3–5 relevant content types based on the user's goals and style
- Recommend how many times to post each one per week
- Provide 1–2 example ideas for each content type
- Also include a "weekly_table" object that lists the content types, labels, and frequency for rendering
`;

// Expected JSON structure for reference - used in prompt
const JSON_STRUCTURE = `
{
  "summary": "Why this strategy is a good fit...",
  "weeks": [
    {
      "week": 1,
      "schedule": {
        "talking_head": 2,
        "video_meme": 1,
        "carousel": 1
      },
      "weekly_table": [
        {
          "content_type": "talking_head",
          "label": "🎙️ Talking Head",
          "frequency_per_week": 2
        },
        {
          "content_type": "video_meme",
          "label": "🎬 Video Meme",
          "frequency_per_week": 1
        },
        {
          "content_type": "carousel",
          "label": "📊 Carousel",
          "frequency_per_week": 1
        }
      ],
      "example_post_ideas": {
        "talking_head": [
          "Why your moisturizer isn't working",
          "3 skincare myths I believed at 19"
        ],
        "video_meme": [
          "When you skip SPF and instantly regret it"
        ],
        "carousel": [
          "Morning vs. Night Skincare Routine"
        ]
      }
    }
  ]
}`;

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

    // Check if OpenAI API key is available
    if (!openaiApiKey) {
      console.error("❌ Missing OpenAI API key");
      return createMockStrategyResponse(userId, onboardingData, corsHeaders);
    }

    console.log("🟢 Processing strategy plan generation for user:", userId);
    
    // Initialize the Supabase client
    console.log("🟢 Initializing Supabase client");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("🟢 Supabase client initialized");
    
    try {
      // Build a comprehensive prompt based on the onboarding data
      const userProfilePrompt = `
Creator profile information:
- Niche/Topic: ${onboardingData.niche_topic || "General content creation"}
- Creator Style: ${onboardingData.creator_style || "Authentic and engaging"}
- Content Format Preferences: ${onboardingData.content_formats || "Mixed formats"}
- Posting Frequency Goal: ${onboardingData.posting_frequency_goal || "3-5 times per week"}
- Experience Level: ${onboardingData.experience_level || "Beginner"}
- Creator Mission: ${onboardingData.creator_mission || "To provide valuable and engaging content to their audience"}

Based on this profile, create a personalized 4-week content strategy plan following the format provided.
      `;
      
      console.log("🟢 Making direct OpenAI chat completion request");
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: `${GPT_STRATEGY_INSTRUCTIONS}\n\nOutput format should match:\n${JSON_STRUCTURE}` },
          { role: "user", content: userProfilePrompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }).catch(e => {
        console.error("❌ OpenAI API Error:", e.message);
        throw e;
      });
      
      console.log("🟢 Received response from OpenAI");
      
      if (!completion.choices || completion.choices.length === 0) {
        console.error("❌ No completion choices returned");
        throw new Error("No completion choices returned from OpenAI");
      }
      
      const strategyContent = completion.choices[0].message.content;
      console.log("🟢 Strategy content length:", strategyContent?.length || 0);
      
      if (!strategyContent || strategyContent.trim().length === 0) {
        console.error("❌ Empty strategy content");
        throw new Error("Empty strategy content from OpenAI");
      }
      
      try {
        // Parse the JSON response
        console.log("🟢 Parsing strategy JSON");
        const parsedStrategy = JSON.parse(strategyContent);
        console.log("🟢 Successfully parsed JSON content");
        console.log("🟢 JSON keys:", Object.keys(parsedStrategy));
        
        // Extract key elements for the database
        const weeklySummary = extractWeeklySummary(parsedStrategy);
        const topicIdeas = extractTopicIdeas(parsedStrategy);
        
        // Save to the database using upsert pattern
        console.log("🟢 Saving to database");
        const { data: upsertData, error: upsertError } = await upsertStrategyProfile(supabase, {
          userId,
          data: {
            summary: parsedStrategy.summary || null,
            niche_topic: onboardingData.niche_topic || null,
            experience_level: onboardingData.experience_level || "beginner",
            creator_style: onboardingData.creator_style || null,
            posting_frequency: onboardingData.posting_frequency_goal || null,
            topic_ideas: topicIdeas,
            weekly_calendar: weeklySummary,
            content_types: extractContentTypes(parsedStrategy),
            full_plan_text: strategyContent // Store complete JSON response
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
        console.error("❌ Raw content:", strategyContent);
        
        // Save the raw response as fallback
        console.log("🟢 Saving raw response as fallback");
        const { data: upsertData, error: upsertError } = await upsertStrategyProfile(supabase, {
          userId,
          data: {
            full_plan_text: strategyContent,
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

// Extract weekly calendar summary from the parsed strategy
function extractWeeklySummary(parsedStrategy) {
  try {
    if (!parsedStrategy.weeks || !Array.isArray(parsedStrategy.weeks)) {
      return null;
    }
    
    // Convert the first week's schedule to a weekly calendar format
    // that's compatible with the existing code
    const firstWeek = parsedStrategy.weeks[0];
    if (!firstWeek || !firstWeek.schedule) {
      return null;
    }
    
    // Create a simple weekly calendar with all content on Monday, Wednesday, Friday
    // This maintains compatibility with the existing UI
    const weeklyCalendar = {
      "Monday": [],
      "Wednesday": [],
      "Friday": []
    };
    
    // Distribute content types across days
    let dayIndex = 0;
    const days = ["Monday", "Wednesday", "Friday"];
    
    Object.entries(firstWeek.schedule).forEach(([contentType, count]) => {
      // Add this content type to the current day
      const day = days[dayIndex % days.length];
      for (let i = 0; i < Number(count); i++) {
        weeklyCalendar[day].push(formatContentType(contentType));
      }
      dayIndex++;
    });
    
    return weeklyCalendar;
  } catch (error) {
    console.error("❌ Error extracting weekly summary:", error);
    return null;
  }
}

// Format content type to be more display-friendly
function formatContentType(contentType) {
  // Convert snake_case to Title Case
  return contentType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Extract topic ideas from the parsed strategy
function extractTopicIdeas(parsedStrategy) {
  try {
    const ideas = [];
    
    // Gather ideas from each week's example_post_ideas
    if (parsedStrategy.weeks && Array.isArray(parsedStrategy.weeks)) {
      parsedStrategy.weeks.forEach(week => {
        if (week.example_post_ideas) {
          Object.values(week.example_post_ideas).forEach(typeIdeas => {
            if (Array.isArray(typeIdeas)) {
              ideas.push(...typeIdeas);
            }
          });
        }
      });
    }
    
    // Limit to 8 ideas to match the mock data format
    return ideas.slice(0, 8);
  } catch (error) {
    console.error("❌ Error extracting topic ideas:", error);
    return [];
  }
}

// Extract unique content types from the strategy
function extractContentTypes(parsedStrategy) {
  try {
    const contentTypes = new Set();
    
    // Gather content types from each week's schedule
    if (parsedStrategy.weeks && Array.isArray(parsedStrategy.weeks)) {
      parsedStrategy.weeks.forEach(week => {
        if (week.schedule) {
          Object.keys(week.schedule).forEach(contentType => {
            contentTypes.add(formatContentType(contentType));
          });
        }
      });
    }
    
    return Array.from(contentTypes);
  } catch (error) {
    console.error("❌ Error extracting content types:", error);
    return [];
  }
}

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
  
  // Create mock strategy data with more comprehensive structure
  const mockStrategy = {
    summary: "Your personalized content strategy focuses on growing your audience through consistent, high-quality content that showcases your unique perspective and expertise.",
    weeks: [
      {
        week: 1,
        schedule: {
          talking_head: 2,
          video_meme: 1,
          carousel: 1
        },
        weekly_table: [
          {
            content_type: "talking_head",
            label: "🎙️ Talking Head",
            frequency_per_week: 2
          },
          {
            content_type: "video_meme",
            label: "🎬 Video Meme",
            frequency_per_week: 1
          },
          {
            content_type: "carousel",
            label: "📊 Carousel",
            frequency_per_week: 1
          }
        ],
        example_post_ideas: {
          talking_head: [
            "Day in the life as a creator",
            "Behind the scenes of content creation"
          ],
          video_meme: [
            "When your first video goes viral"
          ],
          carousel: [
            "Top 5 tools I use for content creation"
          ]
        }
      },
      {
        week: 2,
        schedule: {
          duet: 1,
          podcast_clip: 1,
          static_meme: 1
        },
        weekly_table: [
          {
            content_type: "duet",
            label: "🎭 Duet",
            frequency_per_week: 1
          },
          {
            content_type: "podcast_clip",
            label: "🎧 Podcast Clip",
            frequency_per_week: 1
          },
          {
            content_type: "static_meme",
            label: "🖼️ Static Meme",
            frequency_per_week: 1
          }
        ],
        example_post_ideas: {
          duet: [
            "React to a trending creator in your niche"
          ],
          podcast_clip: [
            "Share an insight from your creative journey"
          ],
          static_meme: [
            "Relatable moment all creators face"
          ]
        }
      }
    ]
  };
  
  // Convert mock strategy to pure JSON string
  const mockStrategyJson = JSON.stringify(mockStrategy);
  
  // Create client to save mock data
  console.log("🟢 Creating Supabase client for mock data");
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Extract data using the same helper functions as real data
  const weeklySummary = extractWeeklySummary(mockStrategy);
  const topicIdeas = extractTopicIdeas(mockStrategy);
  const contentTypes = extractContentTypes(mockStrategy);
  
  // Save mock data to the database with more fields
  console.log("🟢 Saving mock data to database");
  upsertStrategyProfile(supabase, {
    userId,
    data: {
      summary: mockStrategy.summary,
      niche_topic: onboardingData?.niche_topic || "Content Creation",
      experience_level: onboardingData?.experience_level || "beginner",
      creator_style: onboardingData?.creator_style || "Authentic",
      posting_frequency: onboardingData?.posting_frequency_goal || "3-5 times per week",
      topic_ideas: topicIdeas,
      weekly_calendar: weeklySummary,
      content_types: contentTypes,
      full_plan_text: mockStrategyJson // Store as clean JSON
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
