
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const { ideaId, userId } = await req.json();

    if (!ideaId || !userId) {
      throw new Error('Missing required parameters');
    }

    // Get Supabase credentials from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    // Fetch the basic content idea
    const ideaResponse = await fetch(`${supabaseUrl}/rest/v1/content_ideas?id=eq.${ideaId}&user_id=eq.${userId}`, {
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        apikey: supabaseServiceKey,
      },
    });

    if (!ideaResponse.ok) {
      throw new Error('Failed to fetch content idea');
    }

    const ideas = await ideaResponse.json();
    
    if (!ideas || ideas.length === 0) {
      throw new Error('Content idea not found');
    }

    const idea = ideas[0];

    // Generate dynamic content based on the idea
    const format = idea.format_type || 'Video';
    const content = idea.idea;
    const difficulty = idea.difficulty || 'Standard';

    // Generate hooks based on format and content
    let hook = '';
    if (format === 'talking_head') {
      hook = `Have you ever wondered ${content.toLowerCase().includes('how') ? content.toLowerCase() : 'how to ' + content.toLowerCase()}? In this video, I'm going to show you exactly how I do it...`;
    } else if (format === 'carousel') {
      hook = `${content} - Follow these ${Math.floor(Math.random() * 5) + 3} steps to see amazing results!`;
    } else if (format === 'meme') {
      hook = `When people try ${content} for the first time... 😂`;
    } else {
      hook = `Want to know the secrets behind ${content}? Let me break it down for you...`;
    }

    // Generate relevant talking points
    const talkingPoints = [
      `Introduce why ${content} matters to your audience`,
      `Share a common mistake people make with ${content}`,
      `Explain your unique approach to ${content}`,
      `Show proof or results from your experience`,
      `Provide a quick actionable tip the viewer can try today`
    ];

    // Generate call-to-action based on format
    let cta = '';
    if (format === 'talking_head') {
      cta = `Drop a comment below with your biggest question about ${content}!`;
    } else if (format === 'carousel') {
      cta = `Save this post for later and tag someone who needs to see this!`;
    } else if (format === 'meme') {
      cta = `Tag a friend who can relate to this! 😂`;
    } else {
      cta = `Like if this was helpful and follow for more content about ${content}`;
    }

    // Generate shooting tips based on format and difficulty
    let shootTips = '';
    if (format === 'talking_head') {
      shootTips = `Film in good lighting with clear audio. Keep it under ${difficulty === 'Easy' ? '60' : '90'} seconds. Start with an attention-grabbing question.`;
    } else if (format === 'carousel') {
      shootTips = `Use consistent templates for each slide. Limit text to 1-2 sentences per slide. Include a compelling cover image.`;
    } else if (format === 'meme') {
      shootTips = `Keep it simple and relatable. Use trending formats but add your unique twist. Ensure text is easy to read.`;
    } else {
      shootTips = `Plan your shots beforehand. Use a tripod for stability. Consider adding captions to improve accessibility.`;
    }

    // Construct the enhanced content idea
    const enhancedIdea = {
      ...idea,
      hook,
      talking_points: talkingPoints,
      cta,
      shoot_tips: shootTips,
      edit_help_link: format === 'talking_head' ? 'https://support.socialmize.app/editing-tutorial' : null
    };

    return new Response(
      JSON.stringify({ success: true, idea: enhancedIdea }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching content idea details:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'An error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
