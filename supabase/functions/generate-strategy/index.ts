
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const { onboardingAnswers } = await req.json();

    if (!onboardingAnswers) {
      return new Response(
        JSON.stringify({ error: "Missing onboarding answers" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Generating strategy for user with answers:", onboardingAnswers);

    // Create the prompt for OpenAI
    const prompt = `
You are a content strategist specializing in short-form social media growth. Your job is to create personalized content strategies and first 5 content scripts for users based on their creator profile.

USER INPUTS:
- Creator Mission: ${onboardingAnswers.creator_mission || "Not specified"}
- Creator Style: ${onboardingAnswers.creator_style || "Not specified"}
- Content Format Preference: ${onboardingAnswers.content_format_preference || "Not specified"}
- Posting Frequency: ${onboardingAnswers.posting_frequency_goal || "Not specified"}
- Existing Content: ${onboardingAnswers.existing_content !== null ? String(onboardingAnswers.existing_content) : "Not specified"}
- Shooting Preference: ${onboardingAnswers.shooting_preference || "Not specified"}

OUTPUT:
1. Define their Experience Level (Beginner / Intermediate / Advanced) based on inputs.
2. Suggest the best content types they should post each week (7-14 types).
3. Create a Weekly Calendar plan based on their posting pace.
4. Write 5 Starter Content Scripts with:
    - A strong viral hook (use the best hooks that grab attention immediately).
    - Context + Conflict storytelling.
    - Friendly conversational tone.
    - End with a looping statement or CTA.

Make the style motivational and practical, easy to shoot for the user based on their equipment and experience.
`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a content strategist specializing in short-form social media growth." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    const openAIResponse = await response.json();
    
    if (!openAIResponse.choices || !openAIResponse.choices[0]) {
      console.error("Invalid OpenAI response:", openAIResponse);
      return new Response(
        JSON.stringify({ error: "Failed to generate strategy", details: openAIResponse }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const generatedStrategy = openAIResponse.choices[0].message.content;
    console.log("Generated strategy:", generatedStrategy);

    // Try to parse the response as JSON
    let strategyData;
    try {
      // Extract JSON from the response if it's wrapped in markdown code blocks
      const jsonMatch = generatedStrategy.match(/```json\n([\s\S]*?)\n```/) || 
                        generatedStrategy.match(/```\n([\s\S]*?)\n```/) ||
                        [null, generatedStrategy];
      
      const jsonContent = jsonMatch[1] || generatedStrategy;
      strategyData = JSON.parse(jsonContent);
    } catch (error) {
      console.error("Failed to parse strategy as JSON:", error);
      // Still return the raw text even if parsing failed
      return new Response(
        JSON.stringify({ 
          strategy: generatedStrategy, 
          error: "Failed to parse as JSON, returning raw text" 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ strategy: strategyData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in generate-strategy function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
