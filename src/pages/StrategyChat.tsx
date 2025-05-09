import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChatBubble } from "@/components/strategy-chat/ChatBubble";
import { ConfettiExplosion } from "@/components/strategy-chat/ConfettiExplosion";
import { CompletionModal } from "@/components/strategy-chat/CompletionModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sparkles, Send, ArrowLeft, AlertCircle, Play } from "lucide-react";
import { Json } from "@/integrations/supabase/types";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  message: string;
  created_at?: string;
}

interface OnboardingData {
  creator_mission?: string;
  creator_style?: string;
  content_format_preference?: string;
  posting_frequency_goal?: string;
  existing_content?: string;
  niche_topic?: string;
  shooting_preference?: string;
}

interface StrategyProfileData {
  id?: string;
  user_id?: string;
  summary?: string;
  phases?: Json;
  weekly_calendar?: Json;
  content_types?: Json;
  topic_ideas?: Json;
  experience_level?: string;
  creator_style?: string;
  posting_frequency?: string;
  niche_topic?: string;
  full_plan_text?: string;
  created_at?: string;
  updated_at?: string;
  first_five_scripts?: Json;
  strategy_type?: string;
}

interface UserProfileData {
  id?: string;
  email?: string;
  level?: number;
}

const StrategyChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [contentIdeas, setContentIdeas] = useState<string[]>([]);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [strategyData, setStrategyData] = useState<StrategyProfileData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [redirectTriggered, setRedirectTriggered] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [hasExistingChat, setHasExistingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Initial data loading
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;
      
      // Try to retrieve the thread ID from localStorage
      const storedThreadId = localStorage.getItem('strategyThreadId');
      if (storedThreadId) {
        setThreadId(storedThreadId);
        setHasExistingChat(true);
      }
      
      // Fetch onboarding data
      await fetchOnboardingData();
      
      // Fetch strategy profile data
      await fetchStrategyData();
      
      // Fetch user profile data
      await fetchUserProfile();
      
      // Fetch existing message history from Supabase if a threadId exists
      if (storedThreadId && user) {
        await fetchMessageHistory(storedThreadId);
      } else {
        // No existing thread, set up welcome message
        prepareWelcomeMessage();
      }
    };

    fetchInitialData();
  }, [user]);

  // Create personalized welcome message
  const prepareWelcomeMessage = () => {
    if (!userProfile || !onboardingData) return;
    
    // Extract first name from email if available
    const firstName = userProfile.email 
      ? userProfile.email.split('@')[0].split('.')[0]
      : 'there';
    
    // Format the name with capitalized first letter
    const formattedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
    
    // Create personalized welcome message
    const strategyType = strategyData?.strategy_type || "starter";
    const welcomeMessage = `
Hi ${formattedName}! 👋 Welcome to your strategy session!

Based on your profile, I see that:
${onboardingData.niche_topic ? `- You create content about ${onboardingData.niche_topic}` : ''}
${onboardingData.creator_style ? `- Your creator style is ${onboardingData.creator_style?.replace('_', ' ')}` : ''}
${onboardingData.posting_frequency_goal ? `- You aim to post ${onboardingData.posting_frequency_goal?.replace('_', ' ')}` : ''}
${onboardingData.content_format_preference ? `- You prefer creating ${onboardingData.content_format_preference?.replace('_', ' ')} content` : ''}

You're currently on our ${strategyType.charAt(0).toUpperCase() + strategyType.slice(1)} strategy plan.

I'm your AI Strategist, and I'll help build your personalized content plan. Click the Start Session button when you're ready to begin our conversation!
`;

    const initialMessage: ChatMessage = {
      id: "welcome",
      role: "assistant",
      message: welcomeMessage
    };
    
    setMessages([initialMessage]);
  };

  // Fetch user's onboarding data
  const fetchOnboardingData = async () => {
    if (!user || !user.id) return;
    
    try {
      const { data, error } = await supabase
        .from('onboarding_answers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching onboarding data:', error);
        return;
      }
      
      if (data) {
        console.log('Fetched onboarding data:', data);
        setOnboardingData(data);
      }
    } catch (error) {
      console.error('Error in fetchOnboardingData:', error);
    }
  };

  // Fetch user's profile data
  const fetchUserProfile = async () => {
    if (!user || !user.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, level')
        .eq('id', user.id)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      if (data) {
        console.log('Fetched user profile:', data);
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  // Fetch user's strategy profile data
  const fetchStrategyData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('strategy_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true) // Only fetch active strategies
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching strategy data:', error);
        return;
      }
      
      if (data) {
        console.log('Fetched strategy profile data:', data);
        setStrategyData(data);
      }
    } catch (error) {
      console.error('Error in fetchStrategyData:', error);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Effect to handle redirection after content is generated
  useEffect(() => {
    if (contentIdeas.length > 0 && showConfetti && !redirectTriggered) {
      const timer = setTimeout(() => {
        setRedirectTriggered(true);
        navigate('/review-ideas');
      }, 2000); // Short delay to allow confetti to show
      
      return () => clearTimeout(timer);
    }
  }, [contentIdeas, showConfetti, navigate, redirectTriggered]);

  // Fetch message history from Supabase
  const fetchMessageHistory = async (threadId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('thread_id', threadId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        // Map the data from database format to ChatMessage format
        // Ensure the roles match the expected union type
        const formattedMessages: ChatMessage[] = data.map(msg => ({
          id: msg.id,
          role: normalizeRole(msg.role),
          message: msg.message || msg.content, // Handle both field names
          created_at: msg.created_at
        }));
        
        setMessages(formattedMessages);
        setSessionStarted(true); // Mark session as started since we have existing messages
      } else {
        // No messages found for this thread
        prepareWelcomeMessage();
      }
    } catch (error) {
      console.error('Error fetching message history:', error);
      toast({
        title: "Error loading message history",
        description: "There was a problem loading your previous messages.",
        variant: "destructive"
      });
      
      // Fall back to welcome message
      prepareWelcomeMessage();
    }
  };

  // Helper function to normalize role to the expected union type
  const normalizeRole = (role: string): 'user' | 'assistant' | 'system' => {
    if (role === 'user' || role === 'assistant' || role === 'system') {
      return role as 'user' | 'assistant' | 'system';
    }
    return 'user'; // Default fallback
  };

  // Save message to Supabase
  const saveMessage = async (message: Omit<ChatMessage, 'id' | 'created_at'>, currentThreadId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('ai_messages')
        .insert({
          user_id: user.id,
          thread_id: currentThreadId,
          role: message.role,
          content: message.message, // Map message field to content
          message: message.message  // Also save to message field for compatibility
        });
        
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error saving message:', error);
      toast({
        title: "Error saving message",
        description: "Your message couldn't be saved. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Save content ideas to Supabase
  const saveContentIdeas = async (ideas: string[]) => {
    if (!user || ideas.length === 0) return;
    
    try {
      // First, delete any existing unselected content ideas to avoid duplication
      await supabase
        .from('content_ideas')
        .delete()
        .eq('user_id', user.id)
        .eq('selected', false);
      
      // Now add the new content ideas
      const ideaObjects = ideas.map(idea => ({
        user_id: user.id,
        idea: idea,
        selected: false,
        format_type: getRandomFormat(),
        difficulty: getRandomDifficulty(),
        xp_reward: getRandomXp(),
        generated_at: new Date().toISOString()
      }));
      
      const { error } = await supabase
        .from('content_ideas')
        .insert(ideaObjects);
        
      if (error) {
        throw error;
      }
      
      console.log('Content ideas saved successfully:', ideaObjects.length);
    } catch (error) {
      console.error('Error saving content ideas:', error);
      toast({
        title: "Error saving content ideas",
        description: "Your content ideas couldn't be saved. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Helper functions
  const getRandomFormat = () => {
    const formats = ["Video", "Carousel", "Talking Head", "Meme", "Duet"];
    return formats[Math.floor(Math.random() * formats.length)];
  };
  
  const getRandomDifficulty = () => {
    const difficulties = ["Easy", "Medium", "Hard"];
    return difficulties[Math.floor(Math.random() * difficulties.length)];
  };
  
  const getRandomXp = () => {
    return [25, 50, 75, 100][Math.floor(Math.random() * 4)];
  };

  // Get random waiting message
  const getWaitingMessage = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-waiting-message", {});
      
      if (error) {
        throw error;
      }
      
      return data.message || "Thinking...";
    } catch (error) {
      console.error('Error getting waiting message:', error);
      return "Thinking...";
    }
  };

  // Handle starting the session
  const handleStartSession = async () => {
    setErrorMessage(null);
    setSessionStarted(true);
    
    // Prepare initial context message with user data
    const contextMessage = `I am starting a new strategy session. Here's my profile info:
- Creator type: ${onboardingData?.creator_mission || 'Not specified'}
- Style: ${onboardingData?.creator_style || 'Not specified'}
- Content format: ${onboardingData?.content_format_preference || 'Not specified'}
- Posting frequency: ${onboardingData?.posting_frequency_goal || 'Not specified'}
- Niche topic: ${onboardingData?.niche_topic || 'Not specified'}
- Experience level: ${strategyData?.experience_level || 'Beginner'}

Help me develop a content strategy for my ${onboardingData?.niche_topic || 'content'}.`;

    // Add user context message to state
    const userContextMessage: ChatMessage = {
      id: `start-${Date.now()}`,
      role: "user",
      message: contextMessage
    };
    
    setMessages(prev => [...prev, userContextMessage]);
    setIsLoading(true);
    
    // Add temporary waiting message
    const waitingMessage = await getWaitingMessage();
    const tempAssistantId = `temp-assistant-${Date.now()}`;
    setMessages(prev => [...prev, { id: tempAssistantId, role: "assistant", message: waitingMessage }]);
    
    try {
      // Call the edge function with context data
      const { data, error } = await supabase.functions.invoke("generate-strategy-chat", {
        body: {
          userId: user?.id,
          userMessage: contextMessage,
          threadId: null, // Create a new thread
          onboardingData: onboardingData,
          strategyData: strategyData
        }
      });
      
      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || "An error occurred while starting your session.");
      }
      
      // Get the thread ID from the response and store it
      if (data.threadId) {
        setThreadId(data.threadId);
        localStorage.setItem('strategyThreadId', data.threadId);
      }
      
      // Get assistant's response and update the message
      const assistantMessage: Omit<ChatMessage, 'id' | 'created_at'> = {
        role: "assistant",
        message: data.message || "I'm ready to help you develop your content strategy. What specific aspects would you like to focus on?"
      };
      
      // Replace the waiting message with the actual response
      setMessages(prev => prev.map(msg => 
        msg.id === tempAssistantId ? { ...assistantMessage, id: `assistant-${Date.now()}` } : msg
      ));
    } catch (error: any) {
      console.error('Error starting session:', error);
      
      // Set error message for display
      setErrorMessage(error.message || "There was a problem starting your strategy session. Please try again.");
      
      // Show toast with error
      toast({
        title: "Error",
        description: error.message || "There was a problem starting your strategy session. Please try again.",
        variant: "destructive"
      });
      
      // Remove the waiting message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempAssistantId));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user || isLoading) return;
    
    setErrorMessage(null);
    const userMessage: Omit<ChatMessage, 'id' | 'created_at'> = {
      role: "user",
      message: inputMessage
    };
    
    // Optimistically add user message to state
    setMessages(prev => [...prev, { ...userMessage, id: `temp-${Date.now()}` }]);
    setInputMessage("");
    setIsLoading(true);
    
    // Add temporary placeholder for assistant's response with waiting message
    const waitingMessage = await getWaitingMessage();
    const tempAssistantId = `temp-assistant-${Date.now()}`;
    setMessages(prev => [...prev, { id: tempAssistantId, role: "assistant", message: waitingMessage }]);
    
    try {
      // Get or create a thread ID
      const currentThreadId = threadId || "";
      
      // Call the edge function with onboarding and strategy data
      const { data, error } = await supabase.functions.invoke("generate-strategy-chat", {
        body: {
          userId: user.id,
          userMessage: inputMessage,
          threadId: currentThreadId,
          onboardingData: onboardingData,
          strategyData: strategyData
        }
      });
      
      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || "An error occurred while processing your message.");
      }
      
      // Get the thread ID from the response and store it
      if (data.threadId) {
        setThreadId(data.threadId);
        localStorage.setItem('strategyThreadId', data.threadId);
      }
      
      // Get assistant's response and update the message
      const assistantMessage: Omit<ChatMessage, 'id' | 'created_at'> = {
        role: "assistant",
        message: data.message || "I'm having trouble responding right now. Let's continue."
      };
      
      // Replace the waiting message with the actual response
      setMessages(prev => prev.map(msg => 
        msg.id === tempAssistantId ? { ...assistantMessage, id: `assistant-${Date.now()}` } : msg
      ));
      
      // Check for completion
      if (data.completed) {
        setShowConfetti(true);
        
        // Process content ideas if they exist
        if (data.contentIdeas && data.contentIdeas.length > 0) {
          console.log('Content ideas received:', data.contentIdeas.length);
          setContentIdeas(data.contentIdeas);
          await saveContentIdeas(data.contentIdeas);
          
          // Show completion modal briefly before redirect
          setCompletionModalOpen(true);
        } else {
          // If no content ideas, try to generate some using the refresh-topics function
          try {
            console.log('No content ideas from assistant, generating with refresh-topics');
            const { data: topicsData, error: topicsError } = await supabase.functions.invoke('refresh-topics', {
              body: { userId: user.id }
            });
            
            if (topicsError) throw topicsError;
            
            if (topicsData && topicsData.topics && topicsData.topics.length > 0) {
              console.log('Generated topics from refresh-topics:', topicsData.topics.length);
              setContentIdeas(topicsData.topics);
              await saveContentIdeas(topicsData.topics);
            }
          } catch (topicError) {
            console.error('Error generating backup topics:', topicError);
          }
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Set error message for display
      setErrorMessage(error.message || "There was a problem sending your message. Please try again.");
      
      // Show toast with error
      toast({
        title: "Error",
        description: error.message || "There was a problem sending your message. Please try again.",
        variant: "destructive"
      });
      
      // Remove the waiting message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempAssistantId));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleViewContentIdeas = () => {
    // Navigate to the content ideas review page
    navigate('/review-ideas');
    setCompletionModalOpen(false);
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };
  
  // Handle starting a new session
  const handleNewSession = () => {
    // Clear existing thread ID from localStorage
    localStorage.removeItem('strategyThreadId');
    
    // Clear state
    setThreadId(null);
    setMessages([]);
    setSessionStarted(false);
    setHasExistingChat(false);
    
    // Prepare welcome message
    prepareWelcomeMessage();
  };
  
  if (!user) {
    // Redirect to auth if not logged in
    return <div className="p-6">Please log in to access this feature.</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background to-background/90">
      {/* Header */}
      <div className="premium-header p-4 md:p-6 sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b border-border/20 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-3" 
            onClick={handleBackToDashboard}
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-br from-[#0540F2] to-[#446FF2] bg-clip-text text-transparent flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-[#446FF2]" />
              Strategy Session
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">Let's build your personalized content strategy</p>
          </div>
          
          {/* New Session Button (only shown if there's an existing chat) */}
          {hasExistingChat && (
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-auto"
              onClick={handleNewSession}
            >
              New Session
            </Button>
          )}
        </div>
      </div>
      
      {/* Chat area */}
      <div className="flex-1 overflow-auto p-4 md:p-6 chat-container bg-background/60">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              role={message.role}
              message={message.message}
              isLoading={isLoading && message.id.includes('temp-assistant')}
            />
          ))}
          
          {/* Start Session button (only shown before session starts) */}
          {!sessionStarted && messages.length > 0 && (
            <div className="flex justify-center mt-6">
              <Button
                onClick={handleStartSession}
                disabled={isLoading}
                className="bg-gradient-to-br from-[#1FBF57] to-[#1CB955] hover:opacity-90 transition-all shadow-md px-6 py-3 text-lg"
              >
                <Play className="mr-2 h-5 w-5" />
                Start Session
              </Button>
            </div>
          )}
          
          {/* Error message display */}
          {errorMessage && (
            <div className="rounded-md bg-destructive/15 p-4 mb-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-destructive mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-destructive">Error</p>
                <p className="text-sm text-destructive/90">{errorMessage}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={() => setErrorMessage(null)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input area - only shown after session has started */}
      {sessionStarted && (
        <div className="border-t border-border/20 p-3 md:p-6 bg-gradient-to-t from-background/95 to-background/80 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto">
            <div className="relative glass-panel rounded-lg shadow-lg">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="resize-none min-h-[60px] md:min-h-[80px] premium-input border-0 focus-visible:ring-1 focus-visible:ring-[#0540F2]/50 bg-transparent rounded-tl-lg rounded-tr-lg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
              />
              <div className="absolute bottom-3 right-3">
                <Button 
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-gradient-to-br from-[#1FBF57] to-[#1CB955] hover:opacity-90 transition-all shadow-md"
                  size={isMobile ? "sm" : "default"}
                >
                  <Send className={`h-4 w-4 ${isMobile ? 'mr-0' : 'mr-2'}`} />
                  {!isMobile && "Send"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Confetti effect on completion */}
      {showConfetti && <ConfettiExplosion />}
      
      {/* Completion modal */}
      <CompletionModal 
        open={completionModalOpen} 
        onClose={() => setCompletionModalOpen(false)}
        onViewIdeas={handleViewContentIdeas}
        ideasCount={contentIdeas.length}
      />
    </div>
  );
};

export default StrategyChat;
