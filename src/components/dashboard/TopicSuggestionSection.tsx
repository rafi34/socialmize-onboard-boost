
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RefreshCw, Sparkles } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface TopicSuggestionSectionProps {
  onSelectTopic: (topic: string) => void;
}

export const TopicSuggestionSection = ({ onSelectTopic }: TopicSuggestionSectionProps) => {
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTopics();
    }
  }, [user]);

  const fetchTopics = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("refresh-topics", {
        body: { userId: user.id }
      });
      
      if (error) {
        console.error("Error fetching topics:", error);
        toast({
          title: "Error",
          description: "Failed to load topic suggestions",
          variant: "destructive",
        });
        return;
      }
      
      if (data.topics && data.topics.length > 0) {
        // Get a random selection of 3 topics
        const shuffled = [...data.topics].sort(() => 0.5 - Math.random());
        setTopics(shuffled.slice(0, 3));
      } else {
        setTopics([]);
      }
    } catch (err) {
      console.error("Error in fetchTopics:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const refreshTopics = async () => {
    setRefreshing(true);
    await fetchTopics();
    setRefreshing(false);
  };

  const handleSelectTopic = (topic: string) => {
    onSelectTopic(topic);
    toast({
      title: "Topic selected",
      description: `"${topic}" has been selected as your content topic`,
    });
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Topic Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-socialmize-purple"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (topics.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Topic Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">No topic suggestions available</p>
            <Button 
              onClick={refreshTopics} 
              className="bg-socialmize-purple hover:bg-socialmize-dark-purple"
              disabled={refreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Get Topic Ideas'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Topic Suggestions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {topics.map((topic, index) => (
              <Button
                key={index}
                variant="outline"
                className="justify-start h-auto py-3 text-left"
                onClick={() => handleSelectTopic(topic)}
              >
                <Sparkles className="h-4 w-4 mr-2 text-socialmize-purple" />
                <span className="truncate">{topic}</span>
              </Button>
            ))}
          </div>
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshTopics}
              disabled={refreshing}
              className="text-muted-foreground"
            >
              <RefreshCw className={`mr-2 h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh topics'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
