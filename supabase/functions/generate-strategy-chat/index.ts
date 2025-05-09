// supabase/functions/generate-strategy-chat/index.ts
import { serve } from "https://deno.land/std@0.195.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.28.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Get environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || "";
const assistantId = Deno.env.get("ASSISTANT_ID") || "";

// Initialize OpenAI client with correct v2 header
const openai = new OpenAI({
  apiKey: openaiApiKey,
  defaultHeaders: {
    "OpenAI-Beta": "assistants=v2" // Ensure correct v2 header
  }
});

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to parse JSON strategy data
function parseStrategyJson(text) {
  if (!text) return null;
  
  try {
    // Clean the text to handle potential formatting issues
    let cleaned = text.trim()
      .replace(/^```json\s*/g, '')  // Remove opening ```json
      .replace(/^```\s*/g, '')      // Remove opening ``` without json
      .replace(/```$/g, '');        // Remove closing ```
    
    // Try to find JSON object boundaries if there's other text
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    // Fix common JSON string issues
    cleaned = cleaned
      .replace(/\\"/g, '"') // Fix escaped quotes inside already escaped content
      .replace(/\\n/g, ' ') // Replace \n with spaces for better readability
      .replace(/\r\n/g, ' ') // Replace Windows line breaks
      .replace(/\n/g, ' '); // Replace Unix line breaks
      
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Error parsing strategy JSON:", error);
    return null;
  }
}

// Helper function to format strategy data
function formatStrategyData(strategyData) {
  if (!strategyData) return {};
  
  // Parse full plan text if it exists
  const parsedPlan = strategyData.full_plan_text ? 
    parseStrategyJson(strategyData.full_plan_text) : null;
  
  // Extract key information
  return {
    type: strategyData.strategy_type || "starter",
    is_confirmed: !!strategyData.confirmed_at,
    content_types: strategyData.content_types || [],
    posting_frequency: strategyData.posting_frequency || "Not specified",
    niche: strategyData.niche_topic || "Not specified",
    experience_level: strategyData.experience_level || "beginner",
    creator_style: strategyData.creator_style || "Not specified",
    summary: strategyData.summary || (parsedPlan?.summary || ""),
    plan_details: parsedPlan || {},
    has_full_plan: !!strategyData.full_plan_text
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { userId, userMessage, threadId, onboardingData, strategyData } = await req.json();

    if (!userId || !userMessage) {
      return new Response(
        JSON.stringify({ success: false, error: "User ID and message are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("Processing strategy chat for user:", userId);
    console.log("Assistant ID:", assistantId);
    
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

    // Initialize the Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    try {
      // Fetch the user's strategy profile data
      const { data: strategyProfileData, error: strategyError } = await supabase
        .from('strategy_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (strategyError) {
        console.error("Error fetching strategy profile:", strategyError);
      }
      
      console.log("Strategy profile data retrieved:", strategyProfileData ? "yes" : "no");
      
      // Format strategy data for better context
      const formattedStrategy = formatStrategyData(strategyProfileData || strategyData);
      
      // Create or retrieve a thread
      let currentThreadId = threadId;
      
      try {
        if (!currentThreadId) {
          // Create a new thread
          const thread = await openai.beta.threads.create();
          currentThreadId = thread.id;
          console.log("New thread created:", currentThreadId);
          
          // Format onboarding data for better readability
          const formattedOnboarding = {};
          
          // Convert snake_case keys and values to readable format
          if (onboardingData) {
            Object.entries(onboardingData).forEach(([key, value]) => {
              if (typeof value === 'string' && !key.includes('id') && key !== 'created_at' && key !== 'updated_at') {
                // Format the key
                const formattedKey = key.replace(/_/g, ' ')
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');
                
                // Format the value
                const formattedValue = typeof value === 'string' ? 
                  value.replace(/_/g, ' ')
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ') : 
                  value;
                  
                formattedOnboarding[formattedKey] = formattedValue;
              }
            });
          }
          
          // Create a detailed but well-formatted context message
          const contextMessage = `
# Content Strategy Assistant Context

## User Profile
${Object.entries(formattedOnboarding)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}

## Strategy Information
- Strategy Type: ${formattedStrategy.type.charAt(0).toUpperCase() + formattedStrategy.type.slice(1)}
- Status: ${formattedStrategy.is_confirmed ? 'Confirmed' : 'Not yet confirmed'}
- Content Types: ${Array.isArray(formattedStrategy.content_types) ? formattedStrategy.content_types.join(', ') : 'Not specified'}
- Posting Frequency: ${formattedStrategy.posting_frequency}
- Niche: ${formattedStrategy.niche}
- Experience Level: ${formattedStrategy.experience_level.charAt(0).toUpperCase() + formattedStrategy.experience_level.slice(1)}
- Creator Style: ${formattedStrategy.creator_style}

${formattedStrategy.summary ? `## Strategy Summary\n${formattedStrategy.summary}` : ''}

## Assistant Instructions
You are a friendly Content Strategy Assistant helping creators implement their content strategy plans.
When responding:
- Use a conversational, helpful tone
- Organize your responses with clear headings and bullet points using markdown
- Provide specific, actionable advice related to their content niche and creator style
- Never show raw JSON data in your responses
- Format your advice to be easily scannable and digestible
- If providing content ideas, format them as a bulleted list at the end of your message
- Address the user directly and be encouraging

Remember that the user wants practical guidance on implementing their strategy, not technical explanations about the strategy itself.
`;

          // Add initial context message to the thread
          await openai.beta.threads.messages.create(currentThreadId, {
            role: "user",
            content: contextMessage,
          });
          
          console.log("Added comprehensive context message to new thread");
        } else {
          console.log("Using existing thread:", currentThreadId);
        }
        
        // Add the user message to the thread
        await openai.beta.threads.messages.create(currentThreadId, {
          role: "user",
          content: userMessage,
        });
        
        console.log("Added user message to thread");
        
        // Add instructions to respond in a conversational format
        const instructionsMessage = `
Remember to respond in a conversational, helpful tone. 
Format your response with clear markdown structure for readability.
Provide specific, actionable advice tailored to the user's content niche and creator style.
Never include raw JSON in your responses.
`;

        // Add formatting instructions
        await openai.beta.threads.messages.create(currentThreadId, {
          role: "user", 
          content: instructionsMessage
        });
        
        // Run the assistant
        const run = await openai.beta.threads.runs.create(currentThreadId, {
          assistant_id: assistantId,
          instructions: "Respond in a conversational tone. Always format your responses with clear markdown structure for readability. Provide specific, actionable advice tailored to the user's content niche and creator style. Never include raw JSON or technical code in your responses."
        });
        
        console.log("Run created:", run.id);
        
        // Poll for completion
        let completedRun;
        let runStatus;
        
        while (true) {
          try {
            // Check run status
            runStatus = await openai.beta.threads.runs.retrieve(
              currentThreadId,
              run.id
            );
            
            console.log("Current run status:", runStatus.status);
            
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
          
          // Make a final check for raw JSON in the response and clean if needed
          if (messageContent.includes('```json')) {
            messageContent = messageContent.replace(/```json[\s\S]*?```/g, 
              '*(Strategy information available but shown in a more readable format)*');
          }
        } else {
          console.warn("Unexpected message format:", JSON.stringify(latestMessage.content));
          messageContent = "I'm having trouble generating a response right now. Please try again.";
        }
        
        // Check for completion markers in the message
        const isCompleted = messageContent.includes("[content_ideas_ready]") || 
                            messageContent.includes("[CONTENT_IDEAS]") ||
                            messageContent.includes("[STRATEGY_COMPLETE]") ||
                            messageContent.includes("[COMPLETED]");

        // Extract content ideas if present
        let contentIdeas = [];
        let jsonMatch = null;
        
        if (isCompleted) {
          try {
            // First look for JSON structure in the message
            jsonMatch = messageContent.match(/```json([\s\S]*?)```/);
            
            if (jsonMatch && jsonMatch[1]) {
              try {
                const jsonData = JSON.parse(jsonMatch[1].trim());
                if (jsonData.content_ideas && Array.isArray(jsonData.content_ideas)) {
                  contentIdeas = jsonData.content_ideas;
                  console.log("Content ideas extracted from JSON:", contentIdeas.length);
                }
              } catch (jsonError) {
                console.error("Error parsing JSON content ideas:", jsonError);
              }
            }
            
            // If no JSON was found or parsing failed, try alternative formats
            if (contentIdeas.length === 0) {
              // Look for content ideas in various formats
              const ideasMatch = messageContent.match(/\[CONTENT_IDEAS\]([\s\S]*?)(?:\[|$)/);
              if (ideasMatch && ideasMatch[1]) {
                contentIdeas = ideasMatch[1]
                  .split('\n')
                  .filter(line => line.trim().length > 0)
                  .map(line => line.replace(/^-\s*/, '').trim());
                console.log("Content ideas extracted from markup:", contentIdeas.length);
              }
            }
            
            // Save content ideas to the database if we have them
            if (contentIdeas.length > 0) {
              const ideaObjects = contentIdeas.map(idea => ({
                user_id: userId,
                idea: idea,
                selected: false
              }));
              
              const { error: saveError } = await supabase
                .from('content_ideas')
                .insert(ideaObjects);
                
              if (saveError) {
                console.error("Error saving content ideas:", saveError);
              } else {
                console.log("Successfully saved content ideas to database");
              }
            }
          } catch (error) {
            console.error("Error processing content ideas:", error);
          }
        }
        
        // Save the user message to Supabase
        await supabase.from('ai_messages').insert({
          user_id: userId,
          thread_id: currentThreadId,
          role: "user",
          content: userMessage,
          message: userMessage // Add the message field explicitly
        });
        
        // Save the assistant message to Supabase
        await supabase.from('ai_messages').insert({
          user_id: userId,
          thread_id: currentThreadId,
          role: "assistant",
          content: messageContent,
          message: messageContent // Add the message field explicitly
        });
        
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
      console.error("Error in generate-strategy-chat:", error);
      
      return new Response(
        JSON.stringify({ success: false, error: error.message || "An unexpected error occurred" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
  } catch (error) {
    console.error("Error parsing request:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: "Invalid request format" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
