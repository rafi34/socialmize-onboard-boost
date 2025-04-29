
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const assistantId = Deno.env.get('ASSISTANT_ID');

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
    const { userId, userMessage, threadId } = await req.json();

    if (!userId || !userMessage) {
      throw new Error('Missing required parameters');
    }

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!assistantId) {
      throw new Error('Assistant ID not configured');
    }

    console.log(`Processing request for user ${userId}, message: "${userMessage.substring(0, 30)}..."`);

    // Create or retrieve thread
    let currentThreadId = threadId;
    if (!currentThreadId) {
      console.log("Creating new thread...");
      const threadResponse = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v1',
        },
        body: JSON.stringify({}),
      });

      if (!threadResponse.ok) {
        const error = await threadResponse.json();
        console.error('Error creating thread:', error);
        throw new Error(`Failed to create thread: ${error.error?.message || 'Unknown error'}`);
      }

      const thread = await threadResponse.json();
      currentThreadId = thread.id;
      console.log(`Created new thread with ID: ${currentThreadId}`);
    } else {
      console.log(`Using existing thread with ID: ${currentThreadId}`);
    }

    // Add message to thread
    console.log(`Adding user message to thread...`);
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v1',
      },
      body: JSON.stringify({
        role: 'user',
        content: userMessage,
      }),
    });

    if (!messageResponse.ok) {
      const error = await messageResponse.json();
      console.error('Error adding message:', error);
      throw new Error(`Failed to add message: ${error.error?.message || 'Unknown error'}`);
    }

    // Run the assistant
    console.log(`Running assistant ${assistantId} on thread...`);
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v1',
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
      
      const runCheckResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v1',
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
      
      if (runStatus === 'requires_action') {
        console.log("Run requires action, not handling function calls in this version");
        // Here you could implement function calling if needed
        break;
      }
    }

    if (runStatus !== 'completed') {
      throw new Error(`Run did not complete successfully. Status: ${runStatus}`);
    }

    // Get messages (newest first)
    console.log(`Retrieving messages from thread...`);
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v1',
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
    let isCompleted = false;
    let contentIdeas = [];

    if (latestAssistantMessage.content && latestAssistantMessage.content.length > 0) {
      messageContent = latestAssistantMessage.content[0].text?.value || '';
      
      // Check if message contains completion marker
      if (messageContent.includes('ONBOARDING_COMPLETE') || 
          messageContent.includes('onboarding_complete') || 
          messageContent.toLowerCase().includes('content ideas:')) {
        isCompleted = true;
        
        // Try to extract content ideas if they exist
        try {
          // Look for content ideas in the form of a list
          const ideasMatch = messageContent.match(/content ideas:.*?((?:\d+\.\s+.+?[\n\r])+)/is);
          if (ideasMatch && ideasMatch[1]) {
            const ideasText = ideasMatch[1];
            const ideaLines = ideasText.split(/[\n\r]+/).filter(line => line.trim());
            
            contentIdeas = ideaLines.map(line => {
              // Remove the number and any leading symbols
              return line.replace(/^\d+[\.\)\s]+/, '').trim();
            }).filter(idea => idea.length > 0);
          }
        } catch (error) {
          console.error('Error parsing content ideas:', error);
        }
      }
    }

    console.log(`Retrieved assistant message, completion status: ${isCompleted}`);
    if (isCompleted) {
      console.log(`Found ${contentIdeas.length} content ideas`);
    }

    return new Response(JSON.stringify({
      threadId: currentThreadId,
      message: messageContent,
      completed: isCompleted,
      contentIdeas: contentIdeas,
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in generate-strategy function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
