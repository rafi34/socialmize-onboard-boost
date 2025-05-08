import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  StrategyData,
  ProgressData,
  ReminderData,
  GeneratedScript,
} from "@/types/dashboard";

export function useDashboardData() {
  const { user } = useAuth();
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [reminder, setReminder] = useState<ReminderData | null>(null);
  const [scripts, setScripts] = useState<GeneratedScript[] | null>(null);

  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
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
      await fetchUserData();
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

  const fetchUserData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    errorToastShown.current = false;

    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", user.id)
        .single();

      const onboarded = profileData?.onboarding_complete || false;
      setProfileComplete(onboarded);
      if (!onboarded) return;

      const { data: strategyData } = await supabase
        .from("strategy_profiles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (strategyData && strategyData.weekly_calendar) {
        const confirmed = typeof strategyData.weekly_calendar === "object";
        setPlanConfirmed(confirmed);

        setStrategy({
          experience_level: strategyData.experience_level,
          content_types: Array.isArray(strategyData.content_types) 
            ? strategyData.content_types as string[]
            : [],
          weekly_calendar: strategyData.weekly_calendar as Record<string, string[]> || {},
          posting_frequency: strategyData.posting_frequency || "3-5x per week",
          creator_style: strategyData.creator_style || "Authentic",
          content_breakdown: {},
          full_plan_text: strategyData.full_plan_text,
          niche_topic: strategyData.niche_topic,
          topic_ideas: Array.isArray(strategyData.topic_ideas) 
            ? strategyData.topic_ideas as string[]
            : [],
        });

        setGenerationStatus("success");
        setRetryCount(0);
        return;
      }

      const { data: onboardingData } = await supabase
        .from("onboarding_answers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (onboardingData) {
        await generateStrategy(onboardingData);
      }
    } catch (err) {
      console.error("Error in fetchUserData:", err);
      if (!errorToastShown.current) {
        toast({
          title: "Dashboard Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
        errorToastShown.current = true;
      }
    } finally {
      setLoading(false);
    }
  }, [user, generateStrategy]);

  // Initial fetch
  useEffect(() => {
    if (user) fetchUserData();
  }, [user]);

  // Exponential backoff while waiting
  useEffect(() => {
    if (generationStatus === "pending" && retryCount < MAX_RETRIES) {
      const timeout = setTimeout(() => {
        console.log(`Retry ${retryCount + 1}/${MAX_RETRIES}`);
        setRetryCount((prev) => prev + 1);
        fetchUserData();
      }, 3000 * Math.pow(2, retryCount));
      return () => clearTimeout(timeout);
    }
  }, [generationStatus, retryCount]);

  const resetRetryCount = () => {
    setRetryCount(0);
    setGenerationError(null);
    errorToastShown.current = false;
  };

  return {
    user,
    strategy,
    progress,
    reminder,
    scripts,
    loading,
    profileComplete,
    isGeneratingStrategy,
    waitingMessage,
    planConfirmed,
    generationStatus,
    generationError,
    fetchUserData,
    generateStrategy,
    generateWaitingMessage,
    resetRetryCount,
    retryCount,
  };
}
