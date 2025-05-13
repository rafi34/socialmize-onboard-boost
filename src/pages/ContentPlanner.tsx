import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/hooks/use-toast';
import {
  CheckCircle, Clock, Loader2, MessageSquare, SendHorizontal, User, AlertCircle, Info,
  FileCheck, Calendar
} from 'lucide-react';
import {
  Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
  ScrollArea, Separator, Avatar, AvatarFallback, Badge, Input, Tabs, TabsContent, TabsList, TabsTrigger,
  Alert, AlertDescription, AlertTitle
} from '@/components/ui';
import Markdown from 'react-markdown';
import { StrategyData } from '@/types/dashboard';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface ContentIdea {
  id: string;
  day: number;
  title: string;
  contentType: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface ContentPlan {
  id: string;
  userId: string;
  month: string;
  summary: string;
  mission: string;
  weeklyObjective: string;
  contentSchedule: Record<string, string[]>;
  contentIdeas: ContentIdea[];
  createdAt: string;
  updatedAt: string;
}

const ContentPlanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(() => {
    const savedThreadId = localStorage.getItem('content_planner_thread_id');
    return savedThreadId || null;
  });
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [contentPlan, setContentPlan] = useState<ContentPlan | null>(null);
  const [starterStrategy, setStarterStrategy] = useState<StrategyData | null>(null);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [statusMessage, setStatusMessage] = useState<null | { type: 'info' | 'error' | 'success' | 'warning'; title: string; message: string }>(null);
  const [error, setError] = useState<null | { title: string; message: string }>(null);
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const markIdeaComplete = async (ideaId: string) => {
    if (!contentPlan) return;
    const updatedIdeas = contentPlan.contentIdeas.map(idea =>
      idea.id === ideaId ? { ...idea, status: 'completed' as const } : idea
    );
    setContentPlan({ ...contentPlan, contentIdeas: updatedIdeas });
    await supabase
      .from('content_plans')
      .update({ contentIdeas: updatedIdeas })
      .eq('id', contentPlan.id);
  };

  const loadUserData = async () => {
    if (!user) return navigate('/auth');
    setLoading(true);
    try {
      const { data: strategyData } = await supabase
        .from('strategy_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .not('confirmed_at', 'is', null)
        .maybeSingle();
      setStarterStrategy(strategyData);

      const { data: planData } = await supabase
        .from('content_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', new Date().toISOString().slice(0, 7))
        .maybeSingle();
      if (planData) setContentPlan(planData);

      const { data: configData } = await supabase
        .from('app_config')
        .select('config_value')
        .eq('config_key', 'CONTENT_PLAN_ASSISTANT_ID')
        .maybeSingle();
      
      if (!configData?.config_value) {
        console.warn("No assistant ID found in app_config. ChatBot functionality may be limited.");
      }
      
      setAssistantId(configData?.config_value || null);
    } catch (err) {
      console.error("Error loading user data:", err);
      setStatusMessage({
        type: 'error',
        title: 'Load Failed',
        message: 'Could not load user data.'
      });
    } finally {
      setLoading(false);
      setDataLoaded(true);
    }
  };

  useEffect(() => {
    if (user && !dataLoaded) loadUserData();
  }, [user, dataLoaded]);

  // Fallback response generator when API fails
  const generateFallbackResponse = (userMessage: string): string => {
    // Simple fallback responses
    const responses = [
      "I'm currently having trouble connecting to my knowledge base. Here are some general content planning tips: focus on consistency, engage with your audience, and repurpose successful content across platforms.",
      "Sorry, I'm experiencing connectivity issues. In the meantime, consider planning content that addresses your audience's pain points and questions.",
      "While I'm reconnecting, remember that a good content plan should include a mix of educational, inspirational, and promotional content.",
      "Temporary connection issues. For content planning, try the 80/20 rule: 80% valuable content that helps your audience, 20% promotional content.",
      "I'm working on restoring my connection. Remember to align your content with your overall business goals and audience needs."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user) return;
    
    setInputValue('');
    setSending(true);
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // Check if backend is available
      if (!backendAvailable) {
        console.log('Using mock data');
        // Add simulated response for mock mode
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: 'This is a simulated response. In a real environment, I would provide insights about your content strategy.',
            timestamp: new Date().toISOString()
          }]);
          setSending(false);
        }, 1000);
        return;
      }

      // Add a loading message while we wait for the response
      setMessages(prev => [...prev, {
        id: 'loading',
        role: 'assistant' as const,
        content: 'Thinking...',
        timestamp: new Date().toISOString()
      }]);
      
      // Get the current thread ID if available
      let currentThreadId = threadId;
      
      console.log('Using thread ID:', currentThreadId || 'New thread will be created');
      console.log('Sending message:', userMessage.content);
      
      // Single call to generate-content-plan that handles everything: thread creation, message sending, and response
      const { data, error } = await supabase.functions.invoke('generate-content-plan', {
        body: { 
          userId: user.id,
          threadId: currentThreadId,
          userMessage: userMessage.content
        }
      });
      
      if (error) {
        console.error('Error with content plan generation:', error);
        throw new Error('Failed to generate content plan');
      }
      
      if (!data?.success) {
        console.error('API returned error:', data?.error);
        throw new Error(data?.error || 'Unknown error');
      }
      
      // Save the thread ID if it's new
      if (data.threadId && data.threadId !== currentThreadId) {
        console.log('Setting thread ID:', data.threadId);
        setThreadId(data.threadId);
        localStorage.setItem('content_planner_thread_id', data.threadId);
      }
      
      // Check if we received a valid response with a message
      if (data.message) {
        console.log('Received assistant response:', data.message);
        
        // Replace the loading message with the actual response
        setMessages(prev => prev.filter(m => m.id !== 'loading').concat({
          id: data.message.id,
          role: 'assistant' as const,
          content: data.message.content,
          timestamp: data.message.created_at
        }));
      } else {
        throw new Error('No response message received');
      }
    } catch (err) {
      console.error('Assistant error:', err);
      
      // Remove any loading message
      setMessages(prev => prev.filter(m => m.id !== 'loading'));
      
      // Add fallback response
      setMessages(prev => [...prev, {
        id: `fallback-${Date.now()}`,
        role: 'assistant',
        content: generateFallbackResponse(userMessage.content),
        timestamp: new Date().toISOString()
      }]);
      
      toast({
        title: 'Connection Issue',
        description: 'Failed to reach assistant. Using fallback mode.',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <h1 className="text-3xl font-bold mb-4">30-Day Content Planner</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat">Chat with AI</TabsTrigger>
          <TabsTrigger value="plan">View Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <Card>
            <CardHeader>
              <CardTitle>Talk to your strategist</CardTitle>
              <CardDescription>This AI assistant helps you generate your content plan.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
                    <div className="bg-muted px-4 py-2 rounded shadow text-sm max-w-[80%]">
                      <Markdown>{m.content}</Markdown>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <form onSubmit={e => { e.preventDefault(); handleSendMessage(); }} className="flex w-full gap-2">
                <Input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Ask your assistant..." disabled={sending} />
                <Button disabled={sending || !inputValue.trim()} type="submit">
                  {sending ? <Loader2 className="animate-spin h-4 w-4" /> : <SendHorizontal className="h-4 w-4" />}
                </Button>
              </form>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="plan">
          {contentPlan ? (
            <>
              <div className="mb-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Mission</CardTitle>
                  </CardHeader>
                  <CardContent>{contentPlan.mission}</CardContent>
                </Card>
              </div>
              <div className="mb-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Objective</CardTitle>
                  </CardHeader>
                  <CardContent>{contentPlan.weeklyObjective}</CardContent>
                </Card>
              </div>
              <div className="grid gap-4">
                {contentPlan.contentIdeas.map(idea => (
                  <Card key={idea.id}>
                    <CardHeader className="flex justify-between items-center">
                      <div>
                        <CardTitle>{idea.title}</CardTitle>
                        <CardDescription>{idea.contentType} - Day {idea.day}</CardDescription>
                      </div>
                      <Badge>{idea.status}</Badge>
                    </CardHeader>
                    <CardContent>{idea.description}</CardContent>
                    <CardFooter className="justify-end">
                      <Button onClick={() => markIdeaComplete(idea.id)} size="sm" variant="outline">
                        <FileCheck className="h-4 w-4 mr-2" /> Mark Complete
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Alert>
              <AlertTitle>No Plan Yet</AlertTitle>
              <AlertDescription>Talk with the assistant in the Chat tab to generate your plan.</AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentPlanner;
