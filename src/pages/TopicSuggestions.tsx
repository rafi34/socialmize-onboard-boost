
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { TopicSuggestionGrid } from "@/components/topic-suggestions/TopicSuggestionGrid";
import { TopicExplainer } from "@/components/topic-suggestions/TopicExplainer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const TopicSuggestions = () => {
  const [topics, setTopics] = useState<string[]>([]);
  const [usedTopics, setUsedTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const [creatorStyle, setCreatorStyle] = useState<string>("educational");

  useEffect(() => {
    if (user) {
      fetchTopics();
      fetchUsedTopics();
      fetchCreatorStyle();
    }
  }, [user]);

  const fetchCreatorStyle = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("strategy_profiles")
        .select("creator_style")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data?.creator_style) {
        setCreatorStyle(data.creator_style);
      }
    } catch (err) {
      console.error("Error fetching creator style:", err);
    }
  };

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
        setTopics(data.topics);
      } else {
        setTopics([]);
      }
    } catch (err) {
      console.error("Error in fetchTopics:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsedTopics = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("used_topics")
        .select("topic")
        .eq("user_id", user.id);
        
      if (error) throw error;
      
      if (data) {
        setUsedTopics(data.map(item => item.topic.toLowerCase()));
      }
    } catch (err) {
      console.error("Error fetching used topics:", err);
    }
  };
  
  const refreshTopics = async () => {
    setRefreshing(true);
    await fetchTopics();
    await fetchUsedTopics();
    setRefreshing(false);
    
    toast({
      title: "Topics refreshed",
      description: "New topic suggestions are ready for you!",
    });
  };

  const markTopicAsUsed = async (topic: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("used_topics")
        .insert({
          user_id: user.id,
          topic: topic,
          content_type: "manual_selection"
        });
        
      if (error) throw error;
      
      // Update local state
      setUsedTopics([...usedTopics, topic.toLowerCase()]);
      
      toast({
        title: "Topic marked as used",
        description: `"${topic}" has been marked as used`,
      });
    } catch (err) {
      console.error("Error marking topic as used:", err);
      toast({
        title: "Error",
        description: "Failed to mark topic as used",
        variant: "destructive",
      });
    }
  };

  // Get appropriate background gradient based on creator style
  const getBackgroundGradient = () => {
    switch (creatorStyle) {
      case "educational":
        return "from-blue-50 to-indigo-50";
      case "entertaining":
        return "from-purple-50 to-pink-50";
      case "inspirational":
        return "from-amber-50 to-yellow-50";
      case "authoritative":
        return "from-emerald-50 to-teal-50";
      default:
        return "from-gray-50 to-slate-50";
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${getBackgroundGradient()} p-4 md:p-8`}>
        <PageHeader title="Topic Suggestions" description="Find your next content inspiration" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-socialmize-purple animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBackgroundGradient()} p-4 md:p-8`}>
      <PageHeader 
        title="Topic Suggestions" 
        description="Find your next content inspiration"
      />
      
      <TopicExplainer />
      
      <TopicSuggestionGrid 
        topics={topics}
        usedTopics={usedTopics}
        onRefresh={refreshTopics}
        onMarkAsUsed={markTopicAsUsed}
        refreshing={refreshing}
        creatorStyle={creatorStyle}
      />
    </div>
  );
};

export default TopicSuggestions;
