
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StrategyOverviewCard } from "@/components/strategy/StrategyOverviewCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { StrategyData } from "@/types/dashboard";

const StrategyOverview = () => {
  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [usedTopicsCount, setUsedTopicsCount] = useState(0);
  const [totalTopicsCount, setTotalTopicsCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchStrategyData();
      fetchTopicsData();
    }
  }, [user]);

  const fetchStrategyData = async () => {
    try {
      const { data, error } = await supabase
        .from("strategy_profiles")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setStrategy({
          experience_level: data.experience_level || "",
          content_types: data.content_types as string[] || [],
          weekly_calendar: data.weekly_calendar as Record<string, string[]> || {},
          posting_frequency: data.posting_frequency || "",
          creator_style: data.creator_style || "",
          content_breakdown: {},
          full_plan_text: data.full_plan_text,
          niche_topic: data.niche_topic,
          topic_ideas: data.topic_ideas as string[],
          summary: data.summary
        });

        // Update total topics count
        setTotalTopicsCount(data.topic_ideas ? (data.topic_ideas as string[]).length : 0);
      }
    } catch (error) {
      console.error("Error fetching strategy data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopicsData = async () => {
    try {
      const { count, error } = await supabase
        .from("used_topics")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user?.id);

      if (error) throw error;
      
      setUsedTopicsCount(count || 0);
    } catch (error) {
      console.error("Error fetching used topics count:", error);
    }
  };

  const handleEditStrategy = () => {
    // Here you would navigate to the onboarding process or a dedicated edit page
    console.log("Edit strategy clicked");
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      <PageHeader 
        title="Strategy Overview" 
        description="View and manage your content creation strategy"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <StrategyOverviewCard 
          strategy={strategy}
          loading={loading}
          onEditClick={handleEditStrategy}
          usedTopicsCount={usedTopicsCount}
          totalTopicsCount={totalTopicsCount}
        />
        
        <div className="space-y-6">
          {/* This space can be used for additional strategy-related components */}
          {/* For example, a WeeklyCalendarPreview or TopicIdeasPreview */}
        </div>
      </div>
    </div>
  );
};

export default StrategyOverview;
