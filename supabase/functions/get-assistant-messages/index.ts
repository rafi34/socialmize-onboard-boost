// supabase/functions/get-assistant-messages/index.ts
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

console.log("🟢 get-assistant-messages function initializing");

// Initialize OpenAI client with v2 header
const openai = new OpenAI({
  // @ts-ignore
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

// Helper function to check if a run is completed and contains content plan related markers
const checkForContentPlan = async (threadId: string, userId: string) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get all messages from the thread
    const messages = await openai.beta.threads.messages.list(threadId);
    
    // Look for completed content plan indication in the most recent messages
    let planDetected = false;
    
    for (const message of messages.data.slice(0, 5)) {
      if (message.role === 'assistant' && message.content && message.content.length > 0) {
        const content = message.content[0].type === 'text' ? message.content[0].text.value : '';
        
        // Look for markers that indicate a completed content plan
        if (
          content.includes("30-day content plan") && 
          content.includes("saving this plan") &&
          (content.includes("content ideas") || content.includes("content schedule"))
        ) {
          planDetected = true;
          break;
        }
      }
    }
    
    if (planDetected) {
      console.log("🟢 Content plan detected in thread, saving to database");
      
      // Get the latest assistant message with the plan details
      const latestAssistantMessage = messages.data
        .filter(msg => msg.role === 'assistant')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      
      if (latestAssistantMessage && latestAssistantMessage.content && latestAssistantMessage.content.length > 0) {
        const content = latestAssistantMessage.content[0].type === 'text' 
          ? latestAssistantMessage.content[0].text.value 
          : '';
          
        // Parse content to extract plan components
        // Note: This is a simple implementation - in a real app, you'd want more robust parsing
        const missionMatch = content.match(/Mission:([^\n]*)/);
        const objectiveMatch = content.match(/Weekly Objective:([^\n]*)/);
        
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
        
        // Create a simple content schedule
        const contentSchedule: Record<string, string[]> = {
          "Monday": ["Talking Head", "Carousel"],
          "Wednesday": ["Video Tutorial", "Story"],
          "Friday": ["Behind the Scenes", "Trend"]
        };
        
        // Define the type for content ideas
        type ContentIdea = {
          day: number;
          title: string;
          content_type: string;
          description: string;
          status: string;
        };
        
        // Create sample content ideas
        const contentIdeas: ContentIdea[] = [];
        for (let i = 1; i <= 20; i++) {
          contentIdeas.push({
            day: i,
            title: `Content Idea ${i}`,
            content_type: i % 3 === 0 ? "Video" : i % 2 === 0 ? "Carousel" : "Story",
            description: `This is a placeholder for content idea ${i}. The actual content would be extracted from the AI's response.`,
            status: "pending"
          });
        }
        
        // Save to content_plans table
        const { error: planError } = await supabase
          .from("content_plans")
          .insert({
            user_id: userId,
            month: currentMonth,
            summary: content.substring(0, 500), // First 500 chars as summary
            mission: missionMatch ? missionMatch[1].trim() : "Grow your audience with consistent, high-quality content",
            weekly_objective: objectiveMatch ? objectiveMatch[1].trim() : "Post 4-5 pieces of engaging content per week",
            content_schedule: contentSchedule,
            content_ideas: contentIdeas,
            thread_id: threadId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (planError) {
          console.error("❌ Error saving content plan:", planError);
          return false;
        }
        
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("❌ Error checking for content plan:", error);
    return false;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { threadId, after, userId } = await req.json();

    if (!threadId) {
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

    // Get thread information
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

    // Check if there are any active runs
    const runs = await openai.beta.threads.runs.list(threadId);
    const latestRun = runs.data[0];
    
    let planCreated = false;

    // If there's a run that's still in progress, wait
    if (latestRun && ["in_progress", "queued", "cancelling"].includes(latestRun.status)) {
      console.log(`🟢 Latest run is still ${latestRun.status}, waiting...`);
      // Just return the status without messages
      return new Response(
        JSON.stringify({ 
          success: true, 
          runStatus: latestRun.status,
          messages: []
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // If the run is completed, collect messages and check for content plan
    if (latestRun && latestRun.status === "completed" && userId) {
      planCreated = await checkForContentPlan(threadId, userId);
    }

    // List messages from the thread, optionally filtering by 'after' parameter
    let messagesParams: any = { limit: 50 };
    if (after) {
      messagesParams.after = after;
    }

    const messages = await openai.beta.threads.messages.list(threadId, messagesParams);
    console.log(`🟢 Retrieved ${messages.data.length} messages from thread`);

    // Format the messages for the client
    const formattedMessages = messages.data.map((msg) => {
      // Extract the text content if it exists
      let content = "";
      if (msg.content && msg.content.length > 0 && msg.content[0].type === "text") {
        content = msg.content[0].text.value;
      }

      return {
        id: msg.id,
        role: msg.role,
        content,
        created_at: msg.created_at
      };
    });

    // Store the assistant messages in our database for reference
    const assistantMessages = formattedMessages.filter(msg => msg.role === 'assistant');
    if (assistantMessages.length > 0) {
      const messagesToInsert = assistantMessages.map(msg => ({
        thread_id: threadId,
        message_id: msg.id,
        user_id: threadData.user_id,
        content: msg.content,
        role: 'assistant',
        created_at: msg.created_at
      }));

      const { error: msgError } = await supabase
        .from("assistant_messages")
        .insert(messagesToInsert);

      if (msgError) {
        console.error("❌ Error storing assistant messages in database:", msgError);
        // Continue anyway as we have the messages
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messages: formattedMessages,
        runStatus: latestRun?.status || "none",
        planCreated
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
