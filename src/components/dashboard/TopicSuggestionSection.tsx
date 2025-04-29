import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

interface TopicSuggestionSectionProps {
  onSelectTopic: (topic: string) => void;
}

export const TopicSuggestionSection = ({ onSelectTopic }: TopicSuggestionSectionProps) => {
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const fetchTopics = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch strategy profile to get topic ideas
      const { data, error } = await supabase
        .from('strategy_profiles')
        .select('topic_ideas, niche_topic')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        console.error("Error fetching topics:", error);
        setTopics([]);
      } else if (data) {
        const topicIdeas = data.topic_ideas || [];
        // If we have a niche topic, add it to the list
        if (data.niche_topic && !topicIdeas.includes(data.niche_topic)) {
          topicIdeas.unshift(data.niche_topic);
        }
        
        try {
          // Get used topics to filter them out
          const { data: usedTopics } = await supabase
            .from('used_topics')
            .select('topic')
            .eq('user_id', user.id);
            
          if (usedTopics) {
            const usedTopicsList = usedTopics.map(item => item.topic);
            // Filter out used topics but keep a few of them (max 3)
            const unusedTopics = topicIdeas.filter(topic => !usedTopicsList.includes(topic));
            const someUsedTopics = topicIdeas
              .filter(topic => usedTopicsList.includes(topic))
              .slice(0, 3);
            
            setTopics([...unusedTopics, ...someUsedTopics]);
          } else {
            setTopics(topicIdeas);
          }
        } catch (e) {
          console.error("Error fetching used topics:", e);
          setTopics(topicIdeas);
        }
      }
    } catch (error) {
      console.error("Error in fetchTopics:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshTopics = async () => {
    setRefreshing(true);
    try {
      // Call the edge function to regenerate topics
      if (user) {
        const { data, error } = await supabase.functions.invoke('refresh-topics', {
          body: { user_id: user.id }
        });
        
        if (error) {
          throw error;
        }
        
        if (data.success) {
          toast({
            title: "Topics Refreshed",
            description: "New topic ideas have been generated for you!",
          });
          await fetchTopics();
        }
      }
    } catch (error: any) {
      toast({
        title: "Failed to Refresh Topics",
        description: error.message || "An error occurred refreshing topics",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [user]);

  const handleSelectTopic = (topic: string) => {
    onSelectTopic(topic);
    toast({
      title: "Topic Selected",
      description: `Your content will now be about: ${topic}`,
    });
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Suggested Topics</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">Loading topic suggestions...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Suggested Topics</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshTopics}
          disabled={refreshing}
        >
          {refreshing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {topics.length === 0 ? (
          <p className="text-center text-muted-foreground">No topic suggestions available.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {topics.map((topic, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="px-3 py-1 cursor-pointer hover:bg-accent"
                onClick={() => handleSelectTopic(topic)}
              >
                <Plus className="h-3 w-3 mr-1" /> {topic}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
