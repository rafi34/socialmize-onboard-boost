
import { serve } from "https://deno.land/std@0.195.0/http/server.ts";

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
    // Get message type from request
    let messageType = "default";
    try {
      const body = await req.json();
      if (body && body.type) {
        messageType = body.type;
      }
    } catch (e) {
      // If we can't parse the body, use default message type
      console.log("No message type specified, using default");
    }
    
    // Select a random message based on message type
    const message = getRandomMessage(messageType);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-waiting-message:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: "Failed to generate waiting message" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

function getRandomMessage(type: string): string {
  const messagesByType: Record<string, string[]> = {
    "strategy": [
      "Analyzing your content style...",
      "Building your strategy framework...",
      "Mapping out content opportunities...",
      "Evaluating your creator profile...",
      "Crafting your personalized strategy...",
      "Identifying audience growth tactics...",
      "Designing your content roadmap...",
      "Optimizing your content formats...",
      "Planning your growth trajectory...",
      "Developing your creator narrative..."
    ],
    "content_ideas": [
      "Brainstorming fresh content ideas...",
      "Mining trending topics in your niche...",
      "Crafting viral hooks for your content...",
      "Generating audience-focused concepts...",
      "Creating engagement-driving ideas...",
      "Designing scroll-stopping content themes...",
      "Formulating high-performance content angles...",
      "Developing your content calendar...",
      "Mapping out content series concepts...",
      "Finding your unique content edge..."
    ],
    "deep_dive": [
      "Analyzing your brand positioning...",
      "Evaluating your audience needs...",
      "Mapping your content ecosystem...",
      "Identifying your creator superpowers...",
      "Assessing your growth opportunities...",
      "Building your creator positioning...",
      "Crafting your content differentiators...",
      "Defining your audience segments...",
      "Analyzing competitive landscape...",
      "Mapping your monetization path..."
    ],
    "default": [
      "Thinking...",
      "Processing your request...",
      "Working on your response...",
      "Building insights for you...",
      "Analyzing data...",
      "Generating personalized response...",
      "Creating your answer...",
      "Loading content...",
      "Crafting response...",
      "Almost ready..."
    ]
  };
  
  // Use the specified message type or default to "default"
  const messages = messagesByType[type] || messagesByType.default;
  return messages[Math.floor(Math.random() * messages.length)];
}
