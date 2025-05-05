
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
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('Missing required parameters');
    }

    console.log(`Generating content ideas for user: ${userId}`);

    // Get Supabase credentials from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    // Fetch used topics for this user
    const usedTopicsResponse = await fetch(`${supabaseUrl}/rest/v1/used_topics?user_id=eq.${userId}`, {
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        apikey: supabaseServiceKey,
      },
    });

    if (!usedTopicsResponse.ok) {
      throw new Error(`Failed to fetch used topics: ${usedTopicsResponse.statusText}`);
    }

    const usedTopics = await usedTopicsResponse.json();
    const usedTopicsList = usedTopics.map((topic: any) => topic.topic.toLowerCase());
    console.log(`Found ${usedTopicsList.length} previously used topics`);

    // Fetch strategy profile for this user
    const strategyResponse = await fetch(`${supabaseUrl}/rest/v1/strategy_profiles?user_id=eq.${userId}&order=created_at.desc&limit=1`, {
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        apikey: supabaseServiceKey,
      },
    });

    if (!strategyResponse.ok) {
      throw new Error(`Failed to fetch strategy profile: ${strategyResponse.statusText}`);
    }

    const strategyProfiles = await strategyResponse.json();
    
    // If no strategy profile exists, fetch onboarding data as a fallback
    let creatorStyle = 'educational';
    let nicheTopic = 'content creation';
    
    if (strategyProfiles.length === 0) {
      console.log('No strategy profile found, checking onboarding data');
      
      const onboardingResponse = await fetch(`${supabaseUrl}/rest/v1/onboarding_answers?user_id=eq.${userId}&order=created_at.desc&limit=1`, {
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          apikey: supabaseServiceKey,
        },
      });
      
      if (onboardingResponse.ok) {
        const onboardingData = await onboardingResponse.json();
        
        if (onboardingData.length > 0) {
          creatorStyle = onboardingData[0].creator_style || creatorStyle;
          nicheTopic = onboardingData[0].niche_topic || nicheTopic;
          console.log(`Using onboarding data: style=${creatorStyle}, niche=${nicheTopic}`);
        }
      } else {
        console.log('No onboarding data found, using defaults');
      }
    } else {
      const profile = strategyProfiles[0];
      creatorStyle = profile.creator_style || creatorStyle;
      nicheTopic = profile.niche_topic || nicheTopic;
      console.log(`Using strategy profile: style=${creatorStyle}, niche=${nicheTopic}`);
    }

    // Generate topics based on profile
    let generatedTopics: string[] = [];

    // Add random variations and adjustments to make topics more diverse
    const prefixes = [
      "How I", "Why you should", "The ultimate guide to", 
      "3 ways to", "5 tips for", "What nobody tells you about",
      "The truth about", "My honest review of", "How to quickly",
      "The secret to", "I tried", "Why I stopped"
    ];
    
    const suffixes = [
      "that changed everything", "in just 10 minutes a day",
      "without expensive tools", "like a professional",
      "and what I learned", "that nobody talks about",
      "that will blow your mind", "- my honest journey",
      "for beginners", "for experienced creators",
      "the easy way", "step by step"
    ];
    
    const contentFormats = [
      "video", "post", "carousel", "live stream",
      "challenge", "tutorial", "behind the scenes", 
      "day in the life", "review", "comparison"
    ];

    // Add creator style-specific prefixes
    const styleBasedPrefixes: Record<string, string[]> = {
      educational: [
        "How to master", 
        "The complete guide to", 
        "What I learned about", 
        "Common mistakes when", 
        "Step-by-step tutorial for"
      ],
      entertaining: [
        "I tried the viral", 
        "You won't believe what happened when I", 
        "Testing popular", 
        "Day in the life of a", 
        "What it's really like to"
      ],
      inspirational: [
        "How I overcame", 
        "My journey to", 
        "Life lessons from", 
        "Finding purpose in", 
        "Transforming your"
      ],
      authoritative: [
        "Expert analysis of", 
        "The data behind", 
        "Why most people fail at", 
        "The science of", 
        "Debunking myths about"
      ]
    };
    
    // Add some style-specific prefixes based on creator style
    if (styleBasedPrefixes[creatorStyle]) {
      prefixes.push(...styleBasedPrefixes[creatorStyle]);
    }

    // Generate a variety of topics based on niche + random elements
    for (let i = 0; i < 25; i++) {
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const suffix = Math.random() > 0.5 ? ` ${suffixes[Math.floor(Math.random() * suffixes.length)]}` : '';
      const format = contentFormats[Math.floor(Math.random() * contentFormats.length)];
      
      // Generate variations of topics
      if (i % 3 === 0) {
        // Format-focused topics
        generatedTopics.push(`${prefix} create a ${format} about ${nicheTopic}${suffix}`);
      } else if (i % 3 === 1) {
        // Niche-focused topics
        generatedTopics.push(`${prefix} ${nicheTopic} ${suffix}`);
      } else {
        // Combination topics
        generatedTopics.push(`My ${format} on ${nicheTopic}: ${prefix.toLowerCase()} it works${suffix}`);
      }
    }

    // Add some highly specific topics based on the niche
    const nicheSpecificTopics = [
      `5 ${nicheTopic} hacks that nobody is talking about`,
      `The truth about ${nicheTopic} that I wish I knew earlier`,
      `How to grow your audience using ${nicheTopic} content`,
      `Behind the scenes of my ${nicheTopic} creative process`,
      `Why ${nicheTopic} is changing the way people think`,
      `A day in the life of a ${nicheTopic} creator`,
      `What I learned from 30 days of ${nicheTopic}`,
      `How to make money with ${nicheTopic} content in 2025`,
      `${nicheTopic} myths debunked: What actually works`
    ];
    
    generatedTopics = [...generatedTopics, ...nicheSpecificTopics];

    // Ensure we have a diverse set without duplicates
    generatedTopics = [...new Set(generatedTopics)];

    // Filter out topics that have already been used
    const filteredTopics = generatedTopics.filter(topic => 
      !usedTopicsList.includes(topic.toLowerCase())
    );

    // If we've used up all our generated topics, create more variations
    const finalTopics = filteredTopics.length > 5 ? filteredTopics : generatedTopics;
    
    console.log(`Generated ${finalTopics.length} content ideas`);

    // Record a subset of these as used topics
    for (const topic of finalTopics.slice(0, 5)) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/used_topics`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`,
            apikey: supabaseServiceKey,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            user_id: userId,
            topic: topic,
            content_type: 'content_idea'
          }),
        });
      } catch (error) {
        console.error('Error recording used topic:', error);
      }
    }

    // Delete any existing unselected content ideas for this user
    try {
      await fetch(`${supabaseUrl}/rest/v1/content_ideas?user_id=eq.${userId}&selected=eq.false`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          apikey: supabaseServiceKey,
          Prefer: 'return=minimal',
        },
      });
      
      console.log('Deleted existing unselected content ideas');
    } catch (error) {
      console.error('Error deleting existing content ideas:', error);
    }

    // Insert the new content ideas
    const formats = ["Video", "Carousel", "Talking Head", "Meme", "Duet"];
    const difficulties = ["Easy", "Medium", "Hard"];
    const xpRewards = [25, 50, 75, 100];
    
    try {
      for (let i = 0; i < Math.min(finalTopics.length, 15); i++) {
        await fetch(`${supabaseUrl}/rest/v1/content_ideas`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`,
            apikey: supabaseServiceKey,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            user_id: userId,
            idea: finalTopics[i],
            format_type: formats[Math.floor(Math.random() * formats.length)],
            difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
            xp_reward: xpRewards[Math.floor(Math.random() * xpRewards.length)],
            selected: false,
            generated_at: new Date().toISOString()
          }),
        });
      }
      
      console.log(`Created ${Math.min(finalTopics.length, 15)} new content ideas`);
    } catch (error) {
      console.error('Error creating content ideas:', error);
      throw new Error(`Failed to create content ideas: ${error.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        topics: finalTopics.slice(0, 15),
        creatorStyle,
        nicheTopic
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error refreshing topics:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'An error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
