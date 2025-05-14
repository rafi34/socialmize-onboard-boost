import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ChatBubble } from "./ChatBubble";
import { Sparkles, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface AIAssistantProps {
  onComplete?: (contentIdeas: string[]) => void;
  onProgress?: (progress: number) => void;
}

export function AIAssistant({ onComplete, onProgress }: AIAssistantProps) {
  const [messages, setMessages] = useState<Array<{id: string; role: 'user' | 'assistant'; message: string}>>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Fetch existing thread ID or fetch initial messages
  useEffect(() => {
    if (!user) return;
    
    const initializeChat = async () => {
      // Try to get existing thread ID from database
      const { data: threadData } = await supabase
        .from('assistant_threads')
        .select('thread_id')
        .eq('user_id', user.id)
        .eq('purpose', 'strategy')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (threadData?.thread_id) {
        console.log("Found existing thread:", threadData.thread_id);
        setThreadId(threadData.thread_id);
        // Fetch message history for this thread
        await fetchMessageHistory(threadData.thread_id);
      } else {
        // Initialize with welcome message for new users
        const welcomeMessage = {
          id: "welcome",
          role: "assistant" as const,
          message: "👋 Welcome to your Strategy Chat! I'm your AI Strategy Assistant. I'll help you create a personalized content strategy based on your brand and goals. To get started, could you tell me about your main content creation goals?"
        };
        setMessages([welcomeMessage]);
      }
    };
    
    initializeChat();
  }, [user]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch message history for an existing thread
  const fetchMessageHistory = async (threadId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('thread_id', threadId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Map to our message format
        const formattedMessages = data.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          message: msg.content || "" // Use content field instead of message
        }));
        
        setMessages(formattedMessages);
        
        // Calculate rough progress based on message count
        const approxProgress = Math.min(Math.floor(formattedMessages.length / 10 * 100), 90);
        setProgress(approxProgress);
        if (onProgress) onProgress(approxProgress);
      } else {
        // No messages found for existing thread
        const welcomeMessage = {
          id: "welcome-back",
          role: "assistant" as const,
          message: "Welcome back to your Strategy Chat! Would you like to continue where we left off, or start a new strategy discussion?"
        };
        setMessages([welcomeMessage]);
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

  // Get a random waiting message
  const getWaitingMessage = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-waiting-message", {});
      
      if (error) throw error;
      
      return data.message || "Thinking...";
    } catch (error) {
      console.error('Error getting waiting message:', error);
      return "Thinking...";
    }
  };

  // Send message to the AI assistant
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user || isLoading) return;
    
    setErrorMessage(null);
    const userMessage = {
      role: "user" as const,
      message: inputMessage,
      id: `temp-${Date.now()}`
    };
    
    // Optimistically add user message
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    
    // Add temporary placeholder for assistant's response
    const waitingMessage = await getWaitingMessage();
    const tempAssistantId = `temp-assistant-${Date.now()}`;
    setMessages(prev => [...prev, { id: tempAssistantId, role: "assistant", message: waitingMessage }]);
    
    try {
      // Call the edge function with all necessary data
      const { data: onboardingData } = await supabase
        .from('onboarding_answers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const { data: strategyData } = await supabase
        .from('strategy_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      // Call the edge function
      const { data, error } = await supabase.functions.invoke("generate-strategy-chat", {
        body: {
          userId: user.id,
          userMessage: inputMessage,
          threadId: threadId,
          onboardingData: onboardingData || {},
          strategyData: strategyData || {}
        }
      });
      
      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || "An error occurred while processing your message.");
      }
      
      // Save or update thread ID
      if (data.threadId) {
        if (data.threadId !== threadId) {
          setThreadId(data.threadId);
          
          // If this is a new thread, save it to the database
          if (!threadId) {
            await supabase.from('assistant_threads').insert({
              user_id: user.id,
              thread_id: data.threadId,
              purpose: 'strategy',
              assistant_id: data.assistantId || null
            });
          }
        }
      }
      
      // Get assistant's response
      const assistantMessage = {
        role: "assistant" as const,
        message: data.message || "I'm having trouble responding right now. Let's continue.",
        id: `assistant-${Date.now()}`
      };
      
      // Replace the waiting message with the actual response
      setMessages(prev => prev.map(msg => 
        msg.id === tempAssistantId ? { ...assistantMessage } : msg
      ));
      
      // Update progress
      const newProgress = Math.min(progress + 10, 95);
      setProgress(newProgress);
      if (onProgress) onProgress(newProgress);
      
      // Check for completion and content ideas
      if (data.completed && data.contentIdeas?.length > 0) {
        setProgress(100);
        if (onProgress) onProgress(100);
        
        // If we have content ideas and a completion callback, call it
        if (onComplete) {
          onComplete(data.contentIdeas);
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Set error message and show toast
      setErrorMessage(error.message || "There was a problem sending your message. Please try again.");
      
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

  if (!user) {
    return <div>Please log in to access this feature.</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            role={message.role}
            message={message.message}
            isLoading={isLoading && message.id.includes('temp-assistant')}
          />
        ))}
        
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
      
      {/* Progress indicator */}
      {progress > 0 && progress < 100 && (
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Building your strategy...
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#22B573] to-[#4C9F85] transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Input area */}
      <div className="border-t border-border/20 p-3">
        <div className="relative">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="resize-none min-h-[60px] pr-12 focus-visible:ring-[#22B573]/30"
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
            size="sm"
            className="absolute bottom-2 right-2 bg-[#22B573] hover:bg-[#1a9c5e] h-8 w-8 p-0"
          >
            <Sparkles className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
