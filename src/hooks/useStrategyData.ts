
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { StrategyData } from "@/types/dashboard";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { trackUserAction } from "@/utils/xpUtils";
import { parseFullStrategyJson, getStrategySummary } from "@/utils/parseFullStrategyJson";

export function useStrategyData() {
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;
  const { user } = useAuth();

  const fetchStrategyData = useCallback(async () => {
    if (!user) return;

    // Don't auto-retry too many times
    if (retryCount >= MAX_RETRIES && error) {
      console.log(`Reached max retries (${MAX_RETRIES}), stopping auto-refresh`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Fetching strategy data for user", user.id);
      
      const { data, error: fetchError } = await supabase
        .from("strategy_profiles")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;
      
      if (data) {
        console.log("Strategy data retrieved:", {
          id: data.id,
          confirmed_at: data.confirmed_at,
          is_active: data.is_active,
          strategy_type: data.strategy_type
        });
        
        // Process the strategy data
        const hasWeeklyCalendar = !!(data.weekly_calendar && 
          typeof data.weekly_calendar === 'object');
        
        const isConfirmed = !!data.confirmed_at;
        
        // Parse the full plan text to extract JSON data if possible
        const parsedData = parseFullStrategyJson(data.full_plan_text);
        const summary = getStrategySummary(parsedData, data.full_plan_text);
          
        setStrategy({
          id: data.id,
          experience_level: data.experience_level || "",
          content_types: data.content_types as string[] || [],
          weekly_calendar: data.weekly_calendar as Record<string, string[]> || {},
          posting_frequency: data.posting_frequency || "",
          creator_style: data.creator_style || "",
          content_breakdown: {},
          full_plan_text: data.full_plan_text,
          niche_topic: data.niche_topic,
          topic_ideas: data.topic_ideas as string[] || [],
          summary: summary || data.summary,
          strategy_type: data.strategy_type || "starter",
          is_active: data.is_active !== false,
          confirmed_at: data.confirmed_at
        });
        
        console.log("Strategy state updated:", {
          hasWeeklyCalendar,
          isConfirmed,
          id: data.id,
          confirmed_at: data.confirmed_at,
          strategy_type: data.strategy_type
        });
        
        // Reset retry counter on success
        setRetryCount(0);
      } else {
        console.log("No strategy data found");
        setStrategy(null);
      }
    } catch (err: any) {
      console.error("Error fetching strategy data:", err);
      setError(err.message || "Failed to fetch strategy data");
      // No toast here - we don't want to show errors to the user for background fetches
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
      setLastFetchTime(Date.now());
    }
  }, [user, error, retryCount]);

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
      
      // Determine strategy type based on experience level
      const strategyType = onboardingData.experience_level === "expert" ? "advanced" :
                          onboardingData.experience_level === "intermediate" ? "intermediate" : "starter";
      
      // Call the Supabase Edge Function to regenerate strategy
      const { data, error } = await supabase.functions.invoke("generate-strategy-plan", {
        body: {
          userId: user.id,
          onboardingData: {
            ...onboardingData,
            strategy_type: strategyType
          }
        }
      });
      
      if (error) throw error;
      
      // Reset retry counter
      setRetryCount(0);
      
      // Wait a bit longer before fetching the updated strategy data to ensure it's saved
      setTimeout(async () => {
        await fetchStrategyData();
        
        toast({
          title: "Strategy Regenerated",
          description: "Your content strategy has been updated successfully.",
        });
      }, 2000);
      
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

  // Reset retry mechanism
  const resetRetries = () => {
    setRetryCount(0);
    setError(null);
  };

  // Modified function to confirm a strategy plan
  const confirmStrategyPlan = async (): Promise<boolean> => {
    if (!user || !strategy) return false;
    
    try {
      setLoading(true);
      
      const now = new Date().toISOString();
      
      // Make sure we have the latest data
      const { data: latestStrategy, error: fetchError } = await supabase
        .from("strategy_profiles")
        .select("id")
        .eq("user_id", user.id)
        .eq("id", strategy.id)
        .maybeSingle();
        
      if (fetchError) throw fetchError;
      if (!latestStrategy) throw new Error("Strategy not found");
      
      console.log(`Confirming strategy plan (ID: ${strategy.id})...`);
      
      const { error } = await supabase
        .from("strategy_profiles")
        .update({ 
          confirmed_at: now,
          is_active: true,
          // Make sure strategy_type is set
          strategy_type: strategy.strategy_type || "starter"
        })
        .eq("user_id", user.id)
        .eq("id", strategy.id);
        
      if (error) throw error;
      
      // Track user action for confirming strategy
      await trackUserAction(user.id, 'strategy_confirmed', {
        strategy_id: strategy.id,
        strategy_type: strategy.strategy_type
      });
      
      // Update local state
      setStrategy({
        ...strategy,
        confirmed_at: now
      });
      
      // Refresh strategy data
      await fetchStrategyData();
      
      toast({
        title: "Strategy Confirmed",
        description: "Your content strategy has been confirmed!",
      });
      
      return true;
    } catch (err: any) {
      console.error("Error confirming strategy:", err);
      
      toast({
        title: "Error",
        description: err.message || "Failed to confirm strategy",
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
    lastFetchTime,
    resetRetries,
    retryCount,
    confirmStrategyPlan
  };
}
