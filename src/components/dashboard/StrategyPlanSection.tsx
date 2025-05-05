
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { StrategyData } from "@/types/dashboard";
import { StrategyOverviewCard } from "./StrategyOverviewCard";
import { FullStrategyModal } from "./FullStrategyModal";
import { Card } from "@/components/ui/card";
import { RegeneratePlanModal } from "./RegeneratePlanModal";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";

export const StrategyPlanSection = () => {
  const [isFullPlanOpen, setIsFullPlanOpen] = useState(false);
  const [isRegeneratePlanOpen, setIsRegeneratePlanOpen] = useState(false);
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchStrategyData();
    }
  }, [user]);

  const fetchStrategyData = async () => {
    setLoading(true);
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
        const hasWeeklyCalendar = !!(data.weekly_calendar && 
          typeof data.weekly_calendar === 'object');
          
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
      }
    } catch (error) {
      console.error("Error fetching strategy data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenFullPlan = () => {
    setIsFullPlanOpen(true);
  };
  
  const handleOpenRegenerate = () => {
    setIsRegeneratePlanOpen(true);
  };

  if (loading) {
    return (
      <Card className="p-4 mb-6">
        <div className="h-36 bg-muted animate-pulse rounded"></div>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <StrategyOverviewCard 
          strategy={strategy} 
          loading={loading}
          onViewFullPlan={handleOpenFullPlan}
          onRegeneratePlan={handleOpenRegenerate}
        />
        
        <div className="flex-shrink-0 ml-4">
          <Button asChild variant="outline" className="flex items-center gap-2">
            <Link to="/weekly-calendar">
              <CalendarDays className="h-4 w-4" />
              View Full Calendar
            </Link>
          </Button>
        </div>
      </div>
      
      <FullStrategyModal 
        open={isFullPlanOpen} 
        onOpenChange={setIsFullPlanOpen}
        strategy={strategy}
      />
      
      <RegeneratePlanModal
        open={isRegeneratePlanOpen}
        onOpenChange={setIsRegeneratePlanOpen}
        onSuccess={fetchStrategyData}
      />
    </>
  );
};
