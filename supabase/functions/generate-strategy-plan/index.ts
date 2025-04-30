
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
    const assistantId = Deno.env.get('SOCIALMIZE_AFTER_ONBOARDING_ASSISTANT_ID');

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
    
    // For this example, we'll create a thread, add a message, and run the assistant
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

    // Add a specific request for generating a structured strategy plan
    const strategyPlanPrompt = `Based on my onboarding information, please generate a comprehensive content strategy plan. 
Structure your response with:

1. A summary paragraph explaining the overall strategy
2. 3-5 phases, each containing:
   - Phase title
   - Goal description
   - List of specific tactics
   - A content plan with weekly schedule (content type -> frequency) and 3-5 example post ideas

Format this as structured data so it can be displayed in my dashboard.`;

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

    // Process the message content to extract structured data
    const strategyPlan = processStrategyPlanFromText(messageContent);
    
    // Save to strategy_plans table using the Supabase REST API
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase URL or service key not configured');
      throw new Error('Database configuration error');
    }

    // Save the strategy plan
    const planData = {
      user_id: userId,
      assistant_id: assistantId,
      summary: strategyPlan.summary,
      phases: strategyPlan.phases
    };
    
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/strategy_plans`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(planData)
    });
    
    if (!insertResponse.ok) {
      const error = await insertResponse.text();
      console.error('Error inserting strategy plan:', error);
      throw new Error(`Failed to save strategy plan: ${error}`);
    }
    
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
  // This is a simplified parser - in production you might want more robust parsing
  // or ask GPT to respond in JSON format directly
  
  try {
    // Extract summary (first paragraph)
    const summaryMatch = text.match(/^(.*?)(?:\n\n|\n)/s);
    const summary = summaryMatch ? summaryMatch[1].trim() : '';
    
    // Identify phases
    const phaseMatches = text.matchAll(/[#*]?\s*Phase\s*\d+[:#\s-]*([^\n]+)[\s\n]+(?:Goal[:#\s-]*([^\n]+))?[\s\n]+((?:.+\n)+)/gi);
    
    const phases = [];
    for (const match of phaseMatches) {
      const title = match[1]?.trim();
      const goal = match[2]?.trim() || "Implement this phase of your content strategy";
      const details = match[3]?.trim();
      
      // Extract tactics
      const tactics = [];
      const tacticSection = details.match(/Tactics?[:#\s-]*((?:[\s\S](?!Content Plan))+)/i);
      if (tacticSection && tacticSection[1]) {
        const tacticLines = tacticSection[1].split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'));
        tactics.push(...tacticLines.map(line => line.replace(/^[*-]\s*/, '').trim()));
      }
      
      // Extract content plan (weekly schedule and example post ideas)
      let contentPlan = null;
      
      const contentPlanSection = details.match(/Content Plan[:#\s-]*([\s\S]+)/i);
      if (contentPlanSection && contentPlanSection[1]) {
        const contentPlanText = contentPlanSection[1];
        
        // Extract weekly schedule
        const weeklySchedule = {};
        const scheduleLines = contentPlanText.match(/Weekly Schedule[:#\s-]*((?:[\s\S](?!Example Post Ideas))+)/i);
        if (scheduleLines && scheduleLines[1]) {
          const lines = scheduleLines[1].split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'));
          lines.forEach(line => {
            const formatMatch = line.match(/[*-]\s*([^:]+):\s*(\d+)/);
            if (formatMatch) {
              const format = formatMatch[1].trim();
              const count = parseInt(formatMatch[2], 10);
              weeklySchedule[format] = count;
            }
          });
        }
        
        // Extract example post ideas
        const exampleIdeas = [];
        const ideasSection = contentPlanText.match(/Example Post Ideas[:#\s-]*([\s\S]+)/i);
        if (ideasSection && ideasSection[1]) {
          const ideas = ideasSection[1].split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'));
          exampleIdeas.push(...ideas.map(idea => idea.replace(/^[*-]\s*/, '').trim()));
        }
        
        // Only create content plan if we have data
        if (Object.keys(weeklySchedule).length > 0 || exampleIdeas.length > 0) {
          contentPlan = {
            weekly_schedule: weeklySchedule,
            example_post_ideas: exampleIdeas
          };
        }
      }
      
      phases.push({
        title,
        goal,
        tactics,
        content_plan: contentPlan
      });
    }
    
    // If no phases were found using the structured approach, try a simpler approach
    if (phases.length === 0) {
      // Split by headers that might indicate phases
      const sections = text.split(/#{1,3}\s+|\*\*\*|\*\*/);
      if (sections.length > 1) {
        for (let i = 1; i < Math.min(sections.length, 6); i++) {
          const section = sections[i].trim();
          if (section) {
            // Extract title from first line
            const lines = section.split('\n');
            const title = lines[0].replace(/[:*-]+$/, '').trim();
            
            // Simplistically extract content as tactics
            const content = lines.slice(1).filter(line => 
              line.trim() && 
              line.trim().startsWith('-') || 
              line.trim().startsWith('*')
            ).map(line => line.replace(/^[*-]\s*/, '').trim());
            
            phases.push({
              title: title || `Phase ${i}`,
              goal: "Implement this phase of your content strategy",
              tactics: content
            });
          }
        }
      }
    }
    
    return {
      summary,
      phases: phases.length > 0 ? phases : [
        {
          title: "Content Strategy",
          goal: "Implement your personalized content strategy",
          tactics: ["Create engaging content based on your niche", "Post regularly following your schedule", "Engage with your audience"]
        }
      ]
    };
  } catch (error) {
    console.error("Error processing strategy plan text:", error);
    return {
      summary: "Your personalized content strategy plan is ready. Below you'll find a structured approach to grow your creator presence.",
      phases: [
        {
          title: "Getting Started",
          goal: "Build your foundation and establish your presence",
          tactics: ["Create a content calendar", "Define your core topics", "Set up your creator profiles"]
        }
      ]
    };
  }
}
