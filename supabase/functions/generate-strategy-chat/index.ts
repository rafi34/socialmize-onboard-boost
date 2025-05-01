
// supabase/functions/generate-strategy-chat/index.ts
import { serve } from "https://deno.land/std@0.195.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.28.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Get environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || "";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: openaiApiKey,
});

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System message for content strategy
const STRATEGY_SYSTEM_MESSAGE = `You are an expert content strategist for social media creators. 
Your job is to help the creator develop a personalized content strategy and plan.

IMPORTANT GUIDELINES:
- Be conversational, encouraging, and supportive
- Ask clarifying questions to understand their goals, audience, and style preferences
- Provide specific, actionable advice that they can implement right away
- Focus on helping them build an effective content strategy for their chosen platforms
- When the conversation is complete and you've provided a full strategy, include [STRATEGY_COMPLETE] in your response.
- When suggesting content ideas, provide a list with the [CONTENT_IDEAS] tag followed by the ideas.

Assume you're speaking with a content creator who wants to grow their audience and needs guidance.`;

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
    
    // Initialize the Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    try {
      // Create or retrieve conversation history
      let messageHistory = [];
      let currentThreadId = threadId;
      
      // If there's a threadId, fetch previous messages from Supabase
      if (currentThreadId) {
        console.log("Using existing thread:", currentThreadId);
        const { data: historyData, error: historyError } = await supabase
          .from('ai_messages')
          .select('*')
          .eq('thread_id', currentThreadId)
          .eq('user_id', userId)
          .order('created_at', { ascending: true });
          
        if (historyError) {
          console.error("Error fetching message history:", historyError);
        } else if (historyData) {
          // Format the messages for OpenAI API
          messageHistory = historyData.map(msg => ({
            role: msg.role,
            content: msg.message
          }));
        }
      } else {
        // Generate a new thread ID
        currentThreadId = crypto.randomUUID();
        console.log("Created new thread ID:", currentThreadId);
        
        // Add system message at the beginning of a new conversation
        messageHistory.push({
          role: "system",
          content: STRATEGY_SYSTEM_MESSAGE
        });
      }
      
      // Add the user's current message
      messageHistory.push({
        role: "user",
        content: userMessage
      });
      
      // If onboarding data is provided, add a context message
      if (onboardingData && Object.keys(onboardingData).length > 0 && messageHistory.length <= 3) {
        // Create a context message from onboarding data
        const contextMessage = `
Creator profile information:
- Niche/Topic: ${onboardingData.niche_topic || "General content creation"}
- Creator Style: ${onboardingData.creator_style || "Authentic and engaging"}
- Content Format Preferences: ${onboardingData.content_format_preference || "Mixed formats"} 
- Posting Frequency Goal: ${onboardingData.posting_frequency_goal || "3-5 times per week"}
- Creator Mission: ${onboardingData.creator_mission || "To provide valuable content"}
- Shooting Preference: ${onboardingData.shooting_preference || "Not specified"}
        `;
        
        // Insert context message after system message but before user messages
        messageHistory.splice(1, 0, {
          role: "system",
          content: `Here is additional information about the creator to help you provide better guidance: ${contextMessage}`
        });
      }
      
      console.log("Sending messages to OpenAI:", messageHistory.length);
      
      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using the modern API with a cost-effective model
        messages: messageHistory,
        temperature: 0.7,
        max_tokens: 1000,
      });
      
      if (!completion.choices || completion.choices.length === 0) {
        throw new Error("No response from OpenAI");
      }
      
      const assistantMessage = completion.choices[0].message.content;
      
      // Check if message contains completion markers
      const isCompleted = assistantMessage.includes("[STRATEGY_COMPLETE]") || 
                         assistantMessage.includes("[COMPLETED]") || 
                         assistantMessage.includes("[CONTENT_IDEAS]");
      
      // Extract content ideas if present
      let contentIdeas = [];
      if (isCompleted) {
        try {
          // Look for content ideas in the message
          const ideasMatch = assistantMessage.match(/\[CONTENT_IDEAS\]([\s\S]*?)(?:\[|$)/);
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
      
      // Save the user message to Supabase
      await supabase.from('ai_messages').insert({
        user_id: userId,
        thread_id: currentThreadId,
        role: "user",
        message: userMessage
      });
      
      // Save the assistant message to Supabase
      await supabase.from('ai_messages').insert({
        user_id: userId,
        thread_id: currentThreadId,
        role: "assistant",
        message: assistantMessage
      });
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          threadId: currentThreadId,
          message: assistantMessage,
          completed: isCompleted,
          contentIdeas: contentIdeas
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      
    } catch (openaiError) {
      console.error("OpenAI API Error:", openaiError);
      throw openaiError;
    }
  } catch (error) {
    console.error("Error in generate-strategy-chat:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || "An unexpected error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
