
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

    // Map posting frequency goals to human-readable format
    const postingFrequencyMap: Record<string, string> = {
      'multiple_daily': 'Multiple times daily',
      'once_daily': 'Once daily',
      'few_weekly': '3-5x per week',
      'once_weekly': 'Once weekly',
      'few_monthly': 'Few times monthly'
    };

    // Map creator styles to human-readable format
    const creatorStyleMap: Record<string, string> = {
      'bold_energetic': 'Bold & Energetic',
      'calm_motivational': 'Calm & Motivational',
      'funny_relatable': 'Funny & Relatable',
      'inspirational_wise': 'Inspirational & Wise',
      'raw_authentic': 'Raw & Authentic'
    };

    // Get human-readable posting frequency and creator style
    const postingFrequency = postingFrequencyMap[onboardingAnswers.posting_frequency_goal] || '3-5x per week';
    const creatorStyle = creatorStyleMap[onboardingAnswers.creator_style] || 'Authentic';

    // Create a more detailed prompt for OpenAI to ensure uniqueness
    const prompt = `
You are a content strategist specializing in short-form social media growth. Your job is to create personalized content strategies and first 5 content scripts for users based on their creator profile.

USER INPUTS:
- Creator Mission: ${onboardingAnswers.creator_mission || "Not specified"}
- Creator Style: ${onboardingAnswers.creator_style || "Not specified"}
- Content Format Preference: ${onboardingAnswers.content_format_preference || "Not specified"}
- Posting Frequency: ${onboardingAnswers.posting_frequency_goal || "Not specified"}
- Existing Content: ${onboardingAnswers.existing_content !== null ? String(onboardingAnswers.existing_content) : "Not specified"}
- Shooting Preference: ${onboardingAnswers.shooting_preference || "Not specified"}
- Content Niche/Topic: ${onboardingAnswers.niche_topic || "Not specified"}
- User ID (use this to ensure strategy is unique): ${onboardingAnswers.user_id || "Not specified"}

OUTPUT:
1. Define their Experience Level (Beginner / Intermediate / Advanced) based on inputs.
2. Suggest specific and unique content types they should post each week (7-14 types) that directly relate to their niche and style.
3. Create a detailed Weekly Calendar plan with specific content ideas (not just "Content 1", "Content 2") for each day based on their posting pace.
4. Write 5 Starter Content Scripts with:
    - A strong viral hook (use the best hooks that grab attention immediately).
    - Context + Conflict storytelling.
    - Friendly conversational tone.
    - End with a looping statement or CTA.
5. Create a full plan text that outlines the entire strategy in a human-readable format.
6. Generate a list of 20 content topic ideas specifically for their niche or topic area.

IMPORTANT: Make the plan completely unique and personalized to this specific user's profile. Include their specific niche and style in all aspects of the strategy. No generic plans.

Make the style motivational and practical, easy to shoot for the user based on their equipment and experience.

IMPORTANT: Format your response as valid JSON with this structure:
{
  "experience_level": "Beginner/Intermediate/Advanced",
  "content_types": ["Specific Type 1 related to their niche", "Specific Type 2", "etc"],
  "weekly_calendar": {
    "Monday": ["Specific Content Idea 1", "Specific Content Idea 2"],
    "Tuesday": ["Specific Content Idea 3"],
    ...and so on for each day of the week
  },
  "starter_scripts": [
    {
      "title": "Script Title 1",
      "script": "Full script text with hook, context, conflict and CTA"
    },
    {
      "title": "Script Title 2",
      "script": "Full script text with hook, context, conflict and CTA"
    },
    ...and so on for all 5 scripts
  ],
  "full_plan_text": "Complete human-readable strategy plan with all details...",
  "topic_ideas": [
    "Specific Topic idea 1 related to their niche",
    "Specific Topic idea 2 related to their niche",
    ...and so on for all 20 topic ideas
  ]
}
`;

    // Call OpenAI API with increased temperature for more creativity and uniqueness
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a content strategist specializing in short-form social media growth. Create completely unique and personalized strategies." },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" }
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

    let strategyData;
    try {
      const generatedStrategy = openAIResponse.choices[0].message.content;
      console.log("Raw strategy from OpenAI:", generatedStrategy);
      
      // Parse the JSON response
      strategyData = JSON.parse(generatedStrategy);
      
      // Add the human-readable posting frequency and creator style
      strategyData.posting_frequency = postingFrequency;
      strategyData.creator_style = creatorStyle;
      
      // Validate the structure of the response
      if (!strategyData.experience_level || !strategyData.content_types || 
          !strategyData.weekly_calendar || !strategyData.starter_scripts ||
          !strategyData.topic_ideas) {
        throw new Error("Strategy data is missing required fields");
      }
      
      console.log("Successfully parsed strategy data");
      
      // Store the strategy in the database
      const { error: upsertError } = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/rest/v1/strategy_profiles`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            user_id: onboardingAnswers.user_id,
            experience_level: strategyData.experience_level,
            content_types: strategyData.content_types,
            weekly_calendar: strategyData.weekly_calendar,
            first_five_scripts: strategyData.starter_scripts,
            full_plan_text: strategyData.full_plan_text,
            niche_topic: onboardingAnswers.niche_topic,
            topic_ideas: strategyData.topic_ideas,
            posting_frequency: postingFrequency,
            creator_style: creatorStyle
          }),
        }
      ).then(res => {
        if (!res.ok) {
          return res.json().then(err => ({ error: err }));
        }
        return { error: null };
      });

      if (upsertError) {
        console.error("Error storing strategy:", upsertError);
        throw new Error("Failed to store strategy data");
      }
      
    } catch (error) {
      console.error("Failed to parse or store strategy data:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse or store strategy data", 
          details: error.message,
          raw_response: openAIResponse.choices[0].message.content
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return the parsed strategy data
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
