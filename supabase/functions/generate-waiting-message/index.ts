
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    // Array of encouraging waiting messages
    const waitingMessages = [
      "I'm crafting a thoughtful response for you...",
      "Working on your content strategy...",
      "Analyzing your creator style to give you the best advice...",
      "Building personalized recommendations just for you...",
      "Thinking about the perfect content approach for your goals...",
      "Creating magic behind the scenes, just a moment...",
      "Your content strategy is being crafted with care...",
      "Exploring the best ideas for your creator journey...",
      "Taking a moment to develop the perfect response...",
      "Almost there! Putting the final touches on your answer..."
    ];

    // Select a random message from the array
    const randomIndex = Math.floor(Math.random() * waitingMessages.length);
    const message = waitingMessages[randomIndex];

    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-waiting-message function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
