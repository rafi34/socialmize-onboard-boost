
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
    
    // Get and clean the Assistant ID - handle potential whitespace or newlines
    let assistantId = null;
    const assistantIdRaw = Deno.env.get('SOCIALMIZE_AFTER_ONBOARDING_ASSISTANT_ID') || 
                           Deno.env.get('ASSISTANT_ID');
                           
    if (assistantIdRaw) {
      // Trim any whitespace, newlines, etc.
      assistantId = assistantIdRaw.trim();
      console.log(`Using Assistant ID (cleaned): ${assistantId}`);
    }

    if (!openaiApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    if (!assistantId) {
      console.error('Assistant ID not configured');
      console.error('Available env variables:', Object.keys(Deno.env.toObject()));
      throw new Error('Assistant ID not configured');
    }

    console.log(`Generating strategy plan for user ${userId} with assistant ${assistantId}`);
    
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

    // Format onboarding data as clean JSON - ONLY send the user's onboarding data
    console.log('Onboarding data being sent to assistant:', JSON.stringify(onboardingData));
    
    // Send only the onboarding data to the assistant without any additional prompting
    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        role: 'user',
        content: JSON.stringify(onboardingData),
      }),
    });
    
    console.log("Added onboarding data message to thread");

    // Run the assistant - it already has the proper system instructions
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

    console.log('Assistant response received.');
    console.log('Raw assistant response:', messageContent);

    // Try to parse as JSON directly first, since the assistant is configured to return JSON
    try {
      // Attempt to parse the response as JSON
      let strategyPlan;
      try {
        strategyPlan = JSON.parse(messageContent);
        console.log('Successfully parsed assistant response as JSON');
      } catch (parseError) {
        console.error('Failed to parse assistant response as JSON:', parseError);
        console.log('Falling back to text processing');
        // Fall back to the text processing if JSON parsing fails
        strategyPlan = processStrategyPlanFromText(messageContent);
      }
      
      // Log the strategy plan to help with debugging
      console.log('Processed strategy plan:', JSON.stringify(strategyPlan, null, 2));
      
      // Save to both strategy_plans and strategy_profiles tables
      await saveStrategyPlan(userId, assistantId, strategyPlan.summary, strategyPlan.phases || []);
      
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
      console.error('Error processing or saving strategy plan:', error);
      throw error;
    }
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

// Fallback helper function to process and extract structured data from the assistant's response if JSON parsing fails
function processStrategyPlanFromText(text: string) {
  console.log("Processing strategy plan from text (fallback mode)...");
  
  try {
    // Extract summary
    let summary = '';
    let phases = [];
    
    // First, clean up the text by removing any markdown formatting
    const cleanedText = text.replace(/#+\s+/g, ''); // Remove markdown headings
    
    // Split the text into sections based on "SUMMARY:" and "PHASE" markers
    const sections = cleanedText.split(/\n(?:SUMMARY:|PHASE \d+:)/g).filter(section => section.trim().length > 0);
    
    // Log sections for debugging
    console.log(`Found ${sections.length} sections in the text`);
    
    if (sections.length > 0) {
      // First section should be the summary if it doesn't start with a phase marker
      if (!cleanedText.trim().startsWith('PHASE')) {
        summary = sections[0].trim();
        console.log("Found summary:", summary);
      }
      
      // Extract phase information using regex pattern matching
      const phasePattern = /PHASE (\d+):(.*?)(?=PHASE \d+:|$)/gs;
      const phaseMatches = Array.from(text.matchAll(phasePattern));
      
      console.log(`Found ${phaseMatches.length} phase matches with regex`);
      
      if (phaseMatches.length > 0) {
        phases = phaseMatches.map(match => {
          const phaseNumber = match[1];
          const phaseContent = match[2].trim();
          
          // Extract phase title
          const titleMatch = phaseContent.match(/^(.+?)(?=\n|$)/);
          const title = titleMatch ? `Phase ${phaseNumber}: ${titleMatch[1].trim()}` : `Phase ${phaseNumber}`;
          
          // Extract goal
          let goal = "Implement this phase of your content strategy";
          const goalMatch = phaseContent.match(/GOAL:(.*?)(?=\n\s*TACTICS:|$)/s);
          if (goalMatch && goalMatch[1]) {
            goal = goalMatch[1].trim();
          }
          
          // Extract tactics
          const tactics = [];
          const tacticsMatch = phaseContent.match(/TACTICS:([^]*?)(?=CONTENT PLAN:|$)/s);
          if (tacticsMatch && tacticsMatch[1]) {
            const tacticsLines = tacticsMatch[1].trim().split('\n');
            tacticsLines.forEach(line => {
              if (line.trim().startsWith('-')) {
                tactics.push(line.trim().substring(1).trim());
              }
            });
          }
          
          // Extract content plan
          let contentPlan = null;
          const contentPlanMatch = phaseContent.match(/CONTENT PLAN:([^]*?)(?=PHASE \d+:|$)/s);
          if (contentPlanMatch && contentPlanMatch[1]) {
            const contentPlanText = contentPlanMatch[1].trim();
            
            // Extract weekly schedule
            const weeklySchedule = {};
            const scheduleMatch = contentPlanText.match(/WEEKLY SCHEDULE:([^]*?)(?=EXAMPLE POST IDEAS:|$)/s);
            if (scheduleMatch && scheduleMatch[1]) {
              const scheduleLines = scheduleMatch[1].trim().split('\n');
              scheduleLines.forEach(line => {
                if (line.trim().startsWith('-')) {
                  const parts = line.substring(1).trim().split(':');
                  if (parts.length === 2) {
                    const contentType = parts[0].trim();
                    const frequency = parseInt(parts[1].trim());
                    if (!isNaN(frequency)) {
                      weeklySchedule[contentType] = frequency;
                    }
                  }
                }
              });
            }
            
            // Extract example post ideas
            const examplePostIdeas = [];
            const ideasMatch = contentPlanText.match(/EXAMPLE POST IDEAS:([^]*?)$/s);
            if (ideasMatch && ideasMatch[1]) {
              const ideasLines = ideasMatch[1].trim().split('\n');
              ideasLines.forEach(line => {
                if (line.trim().startsWith('-')) {
                  examplePostIdeas.push(line.substring(1).trim());
                }
              });
            }
            
            if (Object.keys(weeklySchedule).length > 0 || examplePostIdeas.length > 0) {
              contentPlan = {
                weekly_schedule: weeklySchedule,
                example_post_ideas: examplePostIdeas
              };
            }
          }
          
          return {
            title,
            goal,
            tactics: tactics.length > 0 ? tactics : ["Create engaging content aligned with your strategy"],
            content_plan: contentPlan
          };
        });
      }
      // If no phases were found with regex, try an alternative approach
      else if (sections.length > 1) {
        console.log("Using fallback approach to extract phases from sections");
        
        // Skip the first section if it's the summary
        const startIndex = summary ? 1 : 0;
        
        for (let i = startIndex; i < sections.length; i++) {
          const phaseContent = sections[i].trim();
          
          // Try to determine phase number from context
          const phaseNumber = i - startIndex + 1;
          
          // Extract phase title - first line is likely the title
          const lines = phaseContent.split('\n');
          const title = lines.length > 0 ? `Phase ${phaseNumber}: ${lines[0].trim()}` : `Phase ${phaseNumber}`;
          
          // Extract goal
          let goal = "Implement this phase of your content strategy";
          const goalIndex = phaseContent.indexOf('GOAL:');
          if (goalIndex !== -1) {
            const goalText = phaseContent.substring(goalIndex + 5);
            const endIndex = goalText.indexOf('\n');
            if (endIndex !== -1) {
              goal = goalText.substring(0, endIndex).trim();
            } else {
              goal = goalText.trim();
            }
          }
          
          // Extract tactics - look for bullet points
          const tactics = [];
          const tacticLines = phaseContent.split('\n');
          let inTacticsSection = false;
          
          tacticLines.forEach(line => {
            if (line.includes('TACTICS:')) {
              inTacticsSection = true;
            } else if (inTacticsSection && line.includes('CONTENT PLAN:')) {
              inTacticsSection = false;
            } else if (inTacticsSection && line.trim().startsWith('-')) {
              tactics.push(line.trim().substring(1).trim());
            }
          });
          
          // Add the phase with extracted information
          phases.push({
            title,
            goal,
            tactics: tactics.length > 0 ? tactics : ["Create engaging content aligned with your strategy"],
            content_plan: null // Content plan parsing would be more complex here
          });
        }
      }
    }
    
    // If we couldn't extract anything useful, create a default placeholder
    if (summary === '' && phases.length === 0) {
      console.log("Couldn't extract useful data, creating default structure");
      summary = text.split('\n')[0]; // Just use the first line as summary
      phases = [{
        title: "Content Strategy",
        goal: "Build your social media presence",
        tactics: ["Create consistent content", "Engage with your audience", "Analyze and adjust your strategy"],
        content_plan: null
      }];
    }
    
    console.log(`Final result: Summary and ${phases.length} phases extracted`);
    return { summary, phases };
  } catch (error) {
    console.error("Error processing strategy plan text:", error);
    // Return a default structure in case of parsing failure
    return {
      summary: "Your personalized content strategy plan is ready. Below you'll find a structured approach to grow your creator presence.",
      phases: [
        {
          title: "Phase 1: Getting Started",
          goal: "Build your foundation and establish your presence",
          tactics: ["Create a content calendar", "Define your core topics", "Set up your creator profiles"],
          content_plan: null
        },
        {
          title: "Phase 2: Content Development",
          goal: "Create engaging content for your audience",
          tactics: ["Develop your unique voice", "Experiment with different formats", "Focus on quality over quantity"],
          content_plan: null
        },
        {
          title: "Phase 3: Community Building",
          goal: "Grow your audience and foster engagement",
          tactics: ["Engage with comments and messages", "Collaborate with other creators", "Host Q&A sessions"],
          content_plan: null
        }
      ]
    };
  }
}
