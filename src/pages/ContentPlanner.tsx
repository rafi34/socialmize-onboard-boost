
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
  const [threadId, setThreadId] = useState<string | null>(null);
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
      setAssistantId(configData?.config_value || null);
    } catch (err) {
      setStatusMessage({ type: 'error', title: 'Load Failed', message: 'Could not load user data.' });
    } finally {
      setLoading(false);
      setDataLoaded(true);
    }
  };

  useEffect(() => {
    if (user && !dataLoaded) loadUserData();
  }, [user, dataLoaded]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user || sending) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setSending(true);

    try {
      if (!threadId && assistantId) {
        const { data } = await supabase.functions.invoke('create-assistant-thread', {
          body: { userId: user.id, purpose: 'content_planning', assistantId }
        });
        if (!data?.threadId) throw new Error('Failed to create thread');
        setThreadId(data.threadId);
      }
      const { data: sendData } = await supabase.functions.invoke('send-assistant-message', {
        body: { threadId, userId: user.id, message: userMessage.content }
      });

      if (sendData?.assistantMessage) {
        setMessages(prev => [...prev, {
          id: sendData.assistantMessage.id,
          role: 'assistant',
          content: sendData.assistantMessage.content,
          timestamp: sendData.assistantMessage.created_at
        }]);
      } else {
        throw new Error('Assistant did not respond');
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to reach assistant. Using fallback.', variant: 'destructive' });
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
