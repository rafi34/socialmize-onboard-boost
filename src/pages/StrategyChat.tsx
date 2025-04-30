
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
import { Send } from "lucide-react";

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

const StrategyChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [contentIdeas, setContentIdeas] = useState<string[]>([]);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Initial welcome message from the assistant
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;
      
      // Fetch onboarding data
      await fetchOnboardingData();
      
      const initialMessage: ChatMessage = {
        id: "welcome",
        role: "assistant",
        message: "Welcome to your strategy onboarding session! I'm your AI Strategist, and I'll help build your personalized content plan. To start, could you tell me your main goal as a content creator? (For example: grow followers, get leads, build a community, etc.)"
      };
      
      setMessages([initialMessage]);
      
      // Try to retrieve the thread ID from localStorage
      const storedThreadId = localStorage.getItem('strategyThreadId');
      if (storedThreadId) {
        setThreadId(storedThreadId);
      }
      
      // Fetch existing message history from Supabase if a threadId exists
      if (storedThreadId && user) {
        fetchMessageHistory(storedThreadId);
      }
    };

    fetchInitialData();
  }, [user]);

  // Fetch user's onboarding data
  const fetchOnboardingData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('onboarding_answers')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        // If we have history, replace our initial message
        setMessages(data as ChatMessage[]);
      }
    } catch (error) {
      console.error('Error fetching message history:', error);
      toast({
        title: "Error loading message history",
        description: "There was a problem loading your previous messages.",
        variant: "destructive"
      });
    }
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
          message: message.message
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
      const ideaObjects = ideas.map(idea => ({
        user_id: user.id,
        idea: idea,
        selected: false
      }));
      
      const { error } = await supabase
        .from('content_ideas')
        .insert(ideaObjects);
        
      if (error) {
        throw error;
      }
      
      console.log('Content ideas saved successfully');
    } catch (error) {
      console.error('Error saving content ideas:', error);
      toast({
        title: "Error saving content ideas",
        description: "Your content ideas couldn't be saved. Please try again.",
        variant: "destructive"
      });
    }
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

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user || isLoading) return;
    
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
      
      // Save user message to Supabase
      await saveMessage(userMessage, currentThreadId);
      
      // Call the edge function with onboardingData
      const { data, error } = await supabase.functions.invoke("generate-strategy", {
        body: {
          userId: user.id,
          userMessage: inputMessage,
          threadId: currentThreadId,
          onboardingData: onboardingData // Pass onboarding data to the edge function
        }
      });
      
      if (error) {
        throw error;
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
      
      // Save assistant message to Supabase
      await saveMessage(assistantMessage, data.threadId);
      
      // Check for completion
      if (data.completed) {
        setShowConfetti(true);
        setTimeout(() => setCompletionModalOpen(true), 1000);
        
        // Save content ideas if they exist
        if (data.contentIdeas && data.contentIdeas.length > 0) {
          setContentIdeas(data.contentIdeas);
          await saveContentIdeas(data.contentIdeas);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "There was a problem sending your message. Please try again.",
        variant: "destructive"
      });
      
      // Remove the waiting message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempAssistantId));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleViewContentIdeas = () => {
    // Navigate to the content ideas review page (to be implemented)
    navigate('/review-ideas');
    setCompletionModalOpen(false);
  };
  
  if (!user) {
    // Redirect to auth if not logged in
    return <div className="p-6">Please log in to access this feature.</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="premium-header p-6">
        <h1 className="text-3xl font-bold bg-gradient-to-br from-socialmize-dark-purple to-socialmize-purple bg-clip-text text-transparent">Strategy Onboarding</h1>
        <p className="text-muted-foreground mt-1">Let's get deeper so we can build your best-ever content plan.</p>
      </div>
      
      {/* Chat area */}
      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4 chat-container">
        <div className="max-w-3xl mx-auto">
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              role={message.role}
              message={message.message}
              isLoading={isLoading && message.id.includes('temp-assistant')}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input area */}
      <div className="border-t border-border/40 p-4 md:p-6 bg-gradient-to-t from-background/80 to-background">
        <div className="max-w-3xl mx-auto flex gap-3">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="resize-none premium-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="bg-gradient-to-br from-socialmize-purple to-socialmize-dark-purple hover:opacity-90 transition-opacity"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
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
