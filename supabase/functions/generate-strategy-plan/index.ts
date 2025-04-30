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
    const { userId, onboardingData } = await req.json();

    if (!userId) {
      throw new Error('Missing required parameters');
    }

    // Get secrets directly in the Edge Function
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    // Trim any whitespace from the assistant ID to avoid issues with newlines
    const assistantIdRaw = Deno.env.get('SOCIALMIZE_AFTER_ONBOARDING_ASSISTANT_ID') || 
                           Deno.env.get('ASSISTANT_ID');
    const assistantId = assistantIdRaw ? assistantIdRaw.trim() : null;

    if (!openaiApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    if (!assistantId) {
      console.error('Assistant ID not configured');
      console.error('Available env variables:', Object.keys(Deno.env.toObject()).map(key => `${key}: ${Deno.env.get(key)?.substring(0, 10)}...`));
      throw new Error('Assistant ID not configured');
    }

    console.log(`Generating strategy plan for user ${userId} with assistant ${assistantId}`);
    
    // Always use the OpenAI API to generate a strategy plan
    // Create thread
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({}),
    });

    if (!threadResponse.ok) {
      const error = await threadResponse.json();
      console.error('Error creating thread:', error);
      throw new Error(`Failed to create thread: ${error.error?.message || 'Unknown error'}`);
    }

    const thread = await threadResponse.json();
    const threadId = thread.id;
    console.log(`Created new thread with ID: ${threadId}`);

    // Create a message with onboarding data
    const onboardingMessage = createOnboardingDataMessage(onboardingData);
    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        role: 'user',
        content: onboardingMessage,
      }),
    });
    
    console.log("Added onboarding data message to thread");

    // Add a specific request for generating a structured strategy plan with clear JSON-like format
    const strategyPlanPrompt = `Based on my onboarding information, please generate a comprehensive content strategy plan.
Please structure your response in the following JSON-like format for easy parsing:

1. Start with a summary paragraph explaining the overall strategy
2. Then, provide 3-5 distinct phases, each containing:
   - Phase title (clearly labeled as "Phase X: Title")
   - Goal description
   - List of specific tactics (as bullet points)
   - A content plan with weekly schedule (content type -> frequency) and example post ideas

Please make each phase clearly distinguishable with proper headings and formatting.
For example:

SUMMARY: Your strategy focuses on...

PHASE 1: Establish Your Presence
GOAL: Build a foundation for...
TACTICS:
- Create consistent branding
- Post 3x per week
- etc.

CONTENT PLAN:
WEEKLY SCHEDULE:
- Instagram posts: 2x
- Stories: 5x
- etc.

EXAMPLE POST IDEAS:
- Behind the scenes look at...
- Tutorial on how to...
- etc.

Please follow this format strictly for each phase to ensure your strategy is properly structured.`;

    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        role: 'user',
        content: strategyPlanPrompt,
      }),
    });

    console.log("Added strategy plan prompt to thread");

    // Run the assistant
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        assistant_id: assistantId,
      }),
    });

    if (!runResponse.ok) {
      const error = await runResponse.json();
      console.error('Error running assistant:', error);
      throw new Error(`Failed to run assistant: ${error.error?.message || 'Unknown error'}`);
    }

    const run = await runResponse.json();
    const runId = run.id;
    console.log(`Started run ${runId}`);

    // Poll for the run completion
    let runStatus = run.status;
    let attempts = 0;
    const maxAttempts = 60; // Maximum 60 attempts (10 minutes with 10-second intervals)
    
    while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < maxAttempts) {
      console.log(`Checking run status (attempt ${attempts + 1})...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds
      
      const runCheckResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
        },
      });

      if (!runCheckResponse.ok) {
        const error = await runCheckResponse.json();
        console.error('Error checking run:', error);
        throw new Error(`Failed to check run: ${error.error?.message || 'Unknown error'}`);
      }

      const runCheck = await runCheckResponse.json();
      runStatus = runCheck.status;
      attempts++;

      console.log(`Current run status: ${runStatus}`);
    }

    if (runStatus !== 'completed') {
      throw new Error(`Run did not complete successfully. Status: ${runStatus}`);
    }

    // Get messages
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
    });

    if (!messagesResponse.ok) {
      const error = await messagesResponse.json();
      console.error('Error retrieving messages:', error);
      throw new Error(`Failed to retrieve messages: ${error.error?.message || 'Unknown error'}`);
    }

    const messages = await messagesResponse.json();
    
    // Get the latest assistant message
    const assistantMessages = messages.data.filter(msg => msg.role === 'assistant');
    const latestAssistantMessage = assistantMessages[0];
    
    if (!latestAssistantMessage) {
      throw new Error('No assistant message found');
    }

    // Extract content text from the message
    let messageContent = '';
    if (latestAssistantMessage.content && latestAssistantMessage.content.length > 0) {
      messageContent = latestAssistantMessage.content[0].text?.value || '';
    }

    console.log('Assistant response received. Processing...');
    console.log('Raw assistant response:', messageContent.substring(0, 500) + '...');

    // Process the message content to extract structured data
    const strategyPlan = processStrategyPlanFromText(messageContent);
    
    // Log the strategy plan to help with debugging
    console.log('Processed strategy plan:', JSON.stringify(strategyPlan, null, 2));
    
    // Save to both strategy_plans and strategy_profiles tables
    await saveStrategyPlan(userId, assistantId, strategyPlan.summary, strategyPlan.phases);
    
    console.log('Strategy plan successfully generated and saved');

    return new Response(JSON.stringify({
      success: true,
      message: 'Strategy plan generated and saved',
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in generate-strategy-plan function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});

// Helper function to save strategy plan to both tables
async function saveStrategyPlan(userId: string, assistantId: string, summary: string, phases: any[]) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase URL or service key not configured');
    throw new Error('Database configuration error');
  }

  // First, save to strategy_plans table like before
  const planData = {
    user_id: userId,
    assistant_id: assistantId,
    summary: summary,
    phases: phases
  };
  
  console.log('Saving to strategy_plans table...');
  const insertResponsePlans = await fetch(`${supabaseUrl}/rest/v1/strategy_plans`, {
    method: 'POST',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(planData)
  });
  
  if (!insertResponsePlans.ok) {
    const error = await insertResponsePlans.text();
    console.error('Error inserting into strategy_plans:', error);
    throw new Error(`Failed to save to strategy_plans: ${error}`);
  }
  
  // Then also save to strategy_profiles table for backward compatibility
  // First check if the user already has a strategy profile
  console.log('Checking for existing strategy_profiles entry...');
  const getProfileResponse = await fetch(`${supabaseUrl}/rest/v1/strategy_profiles?user_id=eq.${userId}&select=id`, {
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  const existingProfile = await getProfileResponse.json();
  let method = 'POST';
  let url = `${supabaseUrl}/rest/v1/strategy_profiles`;
  let headers = {
    'apikey': supabaseServiceKey,
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };
  
  // Structure data for strategy_profiles table
  // Extract content types, weekly schedule, etc. from phases
  const profileData: any = {
    user_id: userId,
    summary: summary,
    phases: phases,
    full_plan_text: summary,
    updated_at: new Date().toISOString()
  };
  
  // If experience_level doesn't exist in onboardingData, set to "Beginner"
  profileData.experience_level = "Beginner";
  
  // Extract content types from phases
  const contentTypes = extractContentTypesFromPhases(phases);
  if (contentTypes.length > 0) {
    profileData.content_types = contentTypes;
  }
  
  // Extract weekly calendar from phases
  const weeklyCalendar = extractWeeklyCalendarFromPhases(phases);
  if (Object.keys(weeklyCalendar).length > 0) {
    profileData.weekly_calendar = weeklyCalendar;
  }
  
  // Extract example scripts as first_five_scripts
  const scripts = extractExampleScriptsFromPhases(phases);
  if (scripts.length > 0) {
    profileData.first_five_scripts = scripts;
  }
  
  if (existingProfile && existingProfile.length > 0) {
    // Update existing record
    method = 'PATCH';
    url = `${supabaseUrl}/rest/v1/strategy_profiles?user_id=eq.${userId}`;
    console.log('Updating existing strategy_profiles entry...');
  } else {
    console.log('Creating new strategy_profiles entry...');
  }
  
  console.log('Saving to strategy_profiles table with method:', method);
  const insertResponseProfiles = await fetch(url, {
    method: method,
    headers: headers,
    body: JSON.stringify(profileData)
  });
  
  if (!insertResponseProfiles.ok) {
    const error = await insertResponseProfiles.text();
    console.error('Error saving to strategy_profiles:', error);
    console.error('Failed with data:', JSON.stringify(profileData));
    throw new Error(`Failed to save to strategy_profiles: ${error}`);
  }
  
  console.log('Successfully saved data to both tables');
}

function extractContentTypesFromPhases(phases: any[]): string[] {
  const contentTypes: Set<string> = new Set();
  
  phases.forEach(phase => {
    if (phase.tactics && Array.isArray(phase.tactics)) {
      phase.tactics.forEach((tactic: string) => {
        // Extract content types from tactics based on common patterns
        if (tactic.includes('video')) contentTypes.add('Video');
        if (tactic.includes('post')) contentTypes.add('Post');
        if (tactic.includes('carousel')) contentTypes.add('Carousel');
        if (tactic.includes('story') || tactic.includes('stories')) contentTypes.add('Story');
        if (tactic.includes('reel')) contentTypes.add('Reel');
        if (tactic.includes('live')) contentTypes.add('Live');
      });
    }
    
    if (phase.content_plan && phase.content_plan.weekly_schedule) {
      Object.keys(phase.content_plan.weekly_schedule).forEach(type => {
        contentTypes.add(type);
      });
    }
  });
  
  // If we couldn't extract any content types, add some defaults
  if (contentTypes.size === 0) {
    return ["Video", "Carousel", "Post", "Story"];
  }
  
  return Array.from(contentTypes);
}

function extractWeeklyCalendarFromPhases(phases: any[]): Record<string, string[]> {
  const weeklyCalendar: Record<string, string[]> = {
    "Monday": [],
    "Tuesday": [],
    "Wednesday": [],
    "Thursday": [],
    "Friday": [],
    "Saturday": [],
    "Sunday": []
  };
  
  // Try to extract calendar information from phases
  phases.forEach(phase => {
    if (phase.content_plan && phase.content_plan.example_post_ideas) {
      const ideas = phase.content_plan.example_post_ideas;
      if (ideas.length >= 7) {
        Object.keys(weeklyCalendar).forEach((day, index) => {
          if (ideas[index]) {
            weeklyCalendar[day].push(ideas[index]);
          }
        });
      }
    }
  });
  
  // Add default content if calendar is empty
  let isEmpty = true;
  Object.values(weeklyCalendar).forEach(posts => {
    if (posts.length > 0) isEmpty = false;
  });
  
  if (isEmpty) {
    weeklyCalendar["Monday"] = ["Morning motivation post", "Weekly goals update"];
    weeklyCalendar["Wednesday"] = ["Mid-week inspiration", "Behind-the-scenes content"];
    weeklyCalendar["Friday"] = ["Weekly win celebration", "Weekend engagement question"];
    weeklyCalendar["Sunday"] = ["Week reflection", "Next week preview"];
  }
  
  return weeklyCalendar;
}

function extractExampleScriptsFromPhases(phases: any[]): { title: string, script: string }[] {
  const scripts: { title: string, script: string }[] = [];
  
  // Try to extract script ideas from phases
  phases.forEach(phase => {
    if (phase.content_plan && phase.content_plan.example_post_ideas) {
      phase.content_plan.example_post_ideas.forEach((idea: string, index: number) => {
        if (scripts.length < 5) {
          scripts.push({
            title: `Script Idea ${scripts.length + 1}: ${idea.substring(0, 30)}...`,
            script: `Hook: Start with an attention-grabbing question or statement.\n\nContent: ${idea}\n\nCall to Action: Ask viewers to engage by commenting or sharing.`
          });
        }
      });
    }
  });
  
  // Add default scripts if we don't have enough
  if (scripts.length === 0) {
    scripts.push(
      {
        title: "Introductory Video",
        script: "Hook: \"Ever wondered how to...?\"\nContent: Introduce yourself and your expertise.\nCall to Action: \"Follow for more tips!\""
      },
      {
        title: "Tutorial Basics",
        script: "Hook: \"This changed everything for me...\"\nContent: Share one key insight or tip.\nCall to Action: \"Try this and let me know how it works for you!\""
      },
      {
        title: "Q&A Session",
        script: "Hook: \"Your top question answered!\"\nContent: Address a common question in your niche.\nCall to Action: \"What other questions do you have? Comment below!\""
      }
    );
  }
  
  return scripts;
}

// Helper function to create a message with onboarding data information
function createOnboardingDataMessage(onboardingData) {
  let message = 'Here is my onboarding information to help personalize my content strategy:\n\n';
  
  for (const [key, value] of Object.entries(onboardingData)) {
    if (value !== null && value !== undefined) {
      message += `${key}: ${value}\n`;
    }
  }
  
  message += '\nPlease use this information to create a personalized content strategy plan for me.';
  return message;
}

// Helper function to process and extract structured data from the assistant's response
function processStrategyPlanFromText(text) {
  console.log("Processing strategy plan from text...");
  
  try {
    // Extract summary - first paragraph before any headings
    const summaryMatch = text.match(/^(.*?)(?=SUMMARY:|PHASE \d|Phase \d|\n\s*\n\s*PHASE|\n\s*\n\s*Phase|\n# |\n## |\n### )/s);
    const summary = summaryMatch ? summaryMatch[1].trim() : text.split('\n\n')[0].trim();
    
    console.log("Extracted summary:", summary);
    
    // Define regex patterns for different phase heading formats
    const phasePatterns = [
      // Format: "PHASE 1: Title" or "Phase 1: Title"
      /(?:PHASE|Phase)\s+(\d+)\s*:\s*([^\n]+)(?:\n+(?:GOAL|Goal)\s*:\s*([^\n]+))?[\s\n]+((?:.+\n)+?)(?=(?:(?:PHASE|Phase)\s+\d|CONTENT PLAN|Content Plan|$))/gi,
      
      // Format: "# Phase 1: Title" (markdown style)
      /#+\s*(?:PHASE|Phase)\s+(\d+)\s*:\s*([^\n]+)(?:\n+(?:GOAL|Goal)\s*:\s*([^\n]+))?[\s\n]+((?:.+\n)+?)(?=(?:#|PHASE|Phase|\s*\d|CONTENT PLAN|Content Plan|$))/gi,
      
      // Format: Section with just "Phase 1" as a heading
      /(?:^|\n\n)(?:PHASE|Phase)\s+(\d+)\s*\n+([^\n]+)?(?:\n+(?:GOAL|Goal)\s*:\s*([^\n]+))?[\s\n]+((?:.+\n)+?)(?=(?:(?:PHASE|Phase)\s+\d|CONTENT PLAN|Content Plan|$))/gi
    ];
    
    let phases = [];
    let matchFound = false;
    
    // Try each pattern until we find matches
    for (const pattern of phasePatterns) {
      const matches = Array.from(text.matchAll(pattern));
      if (matches.length > 0) {
        matchFound = true;
        console.log(`Found ${matches.length} phases using pattern:`, pattern);
        
        matches.forEach(match => {
          const phaseNumber = match[1];
          const title = match[2] ? match[2].trim() : `Phase ${phaseNumber}`;
          const goal = match[3] ? match[3].trim() : "Implement this phase of your content strategy";
          const details = match[4] ? match[4].trim() : "";
          
          // Extract tactics
          const tactics = extractTactics(details);
          
          // Extract content plan
          const contentPlan = extractContentPlan(details);
          
          phases.push({
            title,
            goal,
            tactics,
            content_plan: contentPlan
          });
        });
        
        break; // Stop after finding matches with one pattern
      }
    }
    
    // If no phases were found using the structured patterns, try fallback approach
    if (!matchFound || phases.length === 0) {
      console.log("No phases found with structured patterns, trying fallback approach");
      
      // Try to find sections that might represent phases
      const phaseCandidates = text.split(/(?:\n\n|\n###|\n##|\n#)/g).filter(section => 
        section.trim().length > 0 && 
        (section.toLowerCase().includes('phase') || 
         section.includes('establish') ||
         section.includes('grow') ||
         section.includes('expand'))
      );
      
      if (phaseCandidates.length > 0) {
        console.log(`Found ${phaseCandidates.length} potential phase candidates`);
        
        phaseCandidates.forEach((section, index) => {
          const lines = section.split('\n');
          const title = lines[0].trim();
          
          // Try to extract a goal if it exists
          let goal = "Implement this phase of your content strategy";
          const goalLine = lines.find(line => 
            line.toLowerCase().includes('goal:') || 
            line.toLowerCase().includes('aim:') || 
            line.toLowerCase().includes('objective:')
          );
          
          if (goalLine) {
            const goalMatch = goalLine.match(/(?:goal|aim|objective):\s*(.+)/i);
            if (goalMatch && goalMatch[1]) {
              goal = goalMatch[1].trim();
            }
          }
          
          // Extract tactics
          const tactics = lines.filter(line => 
            line.trim().startsWith('-') || 
            line.trim().startsWith('*')
          ).map(line => line.replace(/^[*-]\s*/, '').trim());
          
          phases.push({
            title: title || `Phase ${index + 1}`,
            goal,
            tactics: tactics.length > 0 ? tactics : ["Implement strategies aligned with your content goals"],
            content_plan: null
          });
        });
      }
    }
    
    // If we still don't have phases, create a default one
    if (phases.length === 0) {
      console.log("No phases found, creating default phase");
      phases = [{
        title: "Content Strategy",
        goal: "Implement your personalized content strategy",
        tactics: ["Create engaging content based on your niche", "Post regularly following your schedule", "Engage with your audience"],
        content_plan: null
      }];
    }
    
    console.log(`Final result: ${phases.length} phases extracted`);
    return { summary, phases };
  } catch (error) {
    console.error("Error processing strategy plan text:", error);
    return {
      summary: "Your personalized content strategy plan is ready. Below you'll find a structured approach to grow your creator presence.",
      phases: [
        {
          title: "Getting Started",
          goal: "Build your foundation and establish your presence",
          tactics: ["Create a content calendar", "Define your core topics", "Set up your creator profiles"],
          content_plan: null
        }
      ]
    };
  }
}

// Helper function to extract tactics from phase details
function extractTactics(details) {
  // Look for sections labeled as "TACTICS:" or bullet points
  const tacticsSection = details.match(/(?:TACTICS|Tactics):\s*((?:[\s\S](?!CONTENT PLAN|Content Plan|WEEKLY SCHEDULE|Weekly Schedule|EXAMPLE POST|Example Post))+)/i);
  
  if (tacticsSection && tacticsSection[1]) {
    // Extract bullet points from tactics section
    return tacticsSection[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
      .map(line => line.replace(/^[*-]\s*/, '').trim());
  }
  
  // If no explicitly labeled tactics section, look for bullet points in general
  const bulletPoints = details
    .split('\n')
    .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
    .map(line => line.replace(/^[*-]\s*/, '').trim());
  
  // Only use bullet points if they're not part of a content plan section
  if (bulletPoints.length > 0 && !details.includes('CONTENT PLAN') && !details.includes('Content Plan')) {
    return bulletPoints;
  }
  
  // Default tactics if none found
  return ["Implement strategies aligned with your content goals"];
}

// Helper function to extract content plan from phase details
function extractContentPlan(details) {
  // Check if there's a content plan section
  if (!details.includes('CONTENT PLAN') && !details.includes('Content Plan') && 
      !details.includes('WEEKLY SCHEDULE') && !details.includes('Weekly Schedule')) {
    return null;
  }
  
  const contentPlan = {
    weekly_schedule: {},
    example_post_ideas: []
  };
  
  // Extract weekly schedule
  const scheduleSection = details.match(/(?:WEEKLY SCHEDULE|Weekly Schedule):\s*((?:[\s\S](?!EXAMPLE POST|Example Post))+)/i);
  if (scheduleSection && scheduleSection[1]) {
    const scheduleLines = scheduleSection[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'));
    
    scheduleLines.forEach(line => {
      const formatMatch = line.match(/[*-]\s*([^:]+):\s*(\d+)/);
      if (formatMatch) {
        const format = formatMatch[1].trim();
        const count = parseInt(formatMatch[2], 10);
        contentPlan.weekly_schedule[format] = count;
      }
    });
  }
  
  // Extract example post ideas
  const ideasSection = details.match(/(?:EXAMPLE POST IDEAS|Example Post Ideas):\s*([\s\S]+)/i);
  if (ideasSection && ideasSection[1]) {
    const ideas = ideasSection[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
      .map(line => line.replace(/^[*-]\s*/, '').trim());
    
    contentPlan.example_post_ideas = ideas;
  }
  
  // If we have any data, return the content plan
  if (Object.keys(contentPlan.weekly_schedule).length > 0 || contentPlan.example_post_ideas.length > 0) {
    return contentPlan;
  }
  
  // Otherwise return null
  return null;
}
