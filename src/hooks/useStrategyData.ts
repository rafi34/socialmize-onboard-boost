
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StrategyData } from "@/types/dashboard";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export function useStrategyData() {
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const { user } = useAuth();

  const fetchStrategyData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      console.log("Fetching strategy data for user", user.id);
      
      const { data, error: fetchError } = await supabase
        .from("strategy_profiles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;
      
      if (data) {
        console.log("Strategy data retrieved:", data);
        
        // Process the strategy data
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
          topic_ideas: data.topic_ideas as string[] || [],
          summary: data.summary
        });
      } else {
        console.log("No strategy data found");
        setStrategy(null);
      }
    } catch (err: any) {
      console.error("Error fetching strategy data:", err);
      setError(err.message || "Failed to fetch strategy data");
      // No toast here - we don't want to show errors to the user for background fetches
    } finally {
      setLoading(false);
      setLastFetchTime(Date.now());
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchStrategyData();
    }
  }, [user, fetchStrategyData]);

  // Function to regenerate strategy
  const regenerateStrategy = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      setLoading(true);
      
      toast({
        title: "Regenerating your strategy...",
        description: "This might take a moment. You'll be notified when it's ready.",
      });
      
      const { data: onboardingData, error: onboardingError } = await supabase
        .from("onboarding_answers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
        
      if (onboardingError) throw onboardingError;
      if (!onboardingData) throw new Error("Onboarding data not found");
      
      // Call the Supabase Edge Function to regenerate strategy
      const { data, error } = await supabase.functions.invoke("generate-strategy-plan", {
        body: {
          userId: user.id,
          onboardingData
        }
      });
      
      if (error) throw error;
      
      // Fetch the updated strategy data
      await fetchStrategyData();
      
      toast({
        title: "Strategy Regenerated",
        description: "Your content strategy has been updated successfully.",
      });
      
      return true;
    } catch (err: any) {
      console.error("Error regenerating strategy:", err);
      
      toast({
        title: "Regeneration Failed",
        description: err.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    strategy,
    loading,
    error,
    fetchStrategyData,
    regenerateStrategy,
    lastFetchTime
  };
}
