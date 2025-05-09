
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { StrategyData } from "@/types/dashboard";

export function useStrategy() {
  const { user } = useAuth();
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [waitingMessage, setWaitingMessage] = useState("");
  const [planConfirmed, setPlanConfirmed] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const errorToastShown = useRef(false);

  const MAX_RETRIES = 3;

  const generateWaitingMessage = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke("generate-waiting-message", {
        body: { userId: user.id },
      });
      if (error) {
        console.warn("generate-waiting-message failed:", error.message);
        return;
      }
      if (data?.message) setWaitingMessage(data.message);
    } catch (err) {
      console.warn("Waiting message request failed", err);
    }
  }, [user]);

  const generateStrategy = async (onboardingData: any) => {
    if (!user || !onboardingData) return;

    setIsGeneratingStrategy(true);
    setGenerationStatus("pending");

    await generateWaitingMessage();

    try {
      // First, deactivate all existing strategies for this user
      const { error: deactivateError } = await supabase
        .from("strategy_profiles")
        .update({ is_active: false })
        .eq("user_id", user.id);
        
      if (deactivateError) {
        console.error("Error deactivating existing strategies:", deactivateError);
        // Continue anyway - we'll create a new active one
      }
      
      const res = await fetch("/functions/generate-strategy-plan", {
        method: "POST",
        body: JSON.stringify({ userId: user.id, onboardingData }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Strategy generation failed");
      }

      const data = await res.json();
      if (data.mock) console.log("Using mock strategy");

      toast({
        title: "Strategy Generated",
        description: "Your personalized content strategy is ready!",
      });

      setGenerationStatus("success");
      setRetryCount(0);
      await fetchStrategyData();
    } catch (err: any) {
      console.error("Strategy generation error:", err);
      setGenerationError(err.message);
      setGenerationStatus("error");

      if (!errorToastShown.current) {
        toast({
          title: "Strategy Generation Failed",
          description: err.message || "Unexpected error occurred",
          variant: "destructive",
        });
        errorToastShown.current = true;
      }
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  const fetchStrategyData = useCallback(async () => {
    if (!user) return;

    try {
      const { data: strategyData } = await supabase
        .from("strategy_profiles")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true) // Only fetch active strategies
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (strategyData) {
        console.log("Strategy data retrieved in useStrategy:", strategyData);
        console.log("Strategy confirmed_at:", strategyData.confirmed_at);
        
        // IMPORTANT: Use confirmed_at to determine if strategy is confirmed
        const confirmed = !!strategyData.confirmed_at;
        setPlanConfirmed(confirmed);

        const contentTypes = Array.isArray(strategyData.content_types)
          ? strategyData.content_types as string[]
          : [];

        const weeklyCalendar = typeof strategyData.weekly_calendar === 'object'
          ? strategyData.weekly_calendar as Record<string, string[]>
          : {};

        const topicIdeas = Array.isArray(strategyData.topic_ideas)
          ? strategyData.topic_ideas as string[]
          : [];

        setStrategy({
          experience_level: strategyData.experience_level || '',
          content_types: contentTypes,
          weekly_calendar: weeklyCalendar,
          posting_frequency: strategyData.posting_frequency || "3-5x per week",
          creator_style: strategyData.creator_style || "Authentic",
          content_breakdown: {},
          full_plan_text: strategyData.full_plan_text,
          niche_topic: strategyData.niche_topic,
          topic_ideas: topicIdeas,
          summary: strategyData.summary,
          confirmed_at: strategyData.confirmed_at,
          is_active: strategyData.is_active !== false,
          id: strategyData.id,
          strategy_type: strategyData.strategy_type || "starter"
        });

        setGenerationStatus("success");
        setRetryCount(0);
        return;
      }
    } catch (err) {
      console.error("Error fetching strategy data in useStrategy:", err);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchStrategyData();
  }, [user, fetchStrategyData]);

  useEffect(() => {
    if (generationStatus === "pending" && retryCount < MAX_RETRIES) {
      const timeout = setTimeout(() => {
        console.log(`Retry ${retryCount + 1}/${MAX_RETRIES}`);
        setRetryCount((prev) => prev + 1);
        fetchStrategyData();
      }, 3000 * Math.pow(2, retryCount));
      return () => clearTimeout(timeout);
    }
  }, [generationStatus, retryCount, fetchStrategyData]);

  const resetRetryCount = () => {
    setRetryCount(0);
    setGenerationError(null);
    errorToastShown.current = false;
  };

  return {
    strategy,
    isGeneratingStrategy,
    waitingMessage,
    planConfirmed,
    generationStatus,
    generationError,
    retryCount,
    fetchStrategyData,
    generateStrategy,
    generateWaitingMessage,
    resetRetryCount
  };
}
