
// pages/Dashboard.tsx

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import {
  StrategyData,
  ProgressData,
  ReminderData,
  GeneratedScript,
} from "@/types/dashboard";

import {
  CreatorSummaryHeader,
  WeeklyCalendarGrid,
  ContentGeneratorSection,
  TodaysMissionCard,
  ScriptPreviewsSection,
  ReminderCard,
  LevelProgressCard,
  ScriptsSection,
} from "@/components/dashboard";

import { StrategyOverviewSection } from "@/components/dashboard/StrategyOverviewSection";
import { Navigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [reminder, setReminder] = useState<ReminderData | null>(null);
  const [scripts, setScripts] = useState<GeneratedScript[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [waitingMessage, setWaitingMessage] = useState("");
  const [planConfirmed, setPlanConfirmed] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [lastFetchAttempt, setLastFetchAttempt] = useState<number>(0);

  const fetchUserData = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        setLoading(false);
        return;
      }

      setProfileComplete(profileData.onboarding_complete);
      if (!profileData.onboarding_complete) {
        setLoading(false);
        return;
      }

      const { data: strategyData, error: strategyError } = await supabase
        .from("strategy_profiles")
        .select(
          "id, user_id, experience_level, content_types, weekly_calendar, full_plan_text, niche_topic, topic_ideas, posting_frequency, creator_style"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (strategyError) {
        console.error("Error fetching strategy:", strategyError);
      }

      if (strategyData && !strategyError) {
        // Check if plan is confirmed by looking for weekly_calendar
        const confirmed = !!(strategyData.weekly_calendar && 
          typeof strategyData.weekly_calendar === 'object');

        setPlanConfirmed(confirmed);

        const processedStrategy: StrategyData = {
          experience_level: strategyData.experience_level,
          content_types: strategyData.content_types as string[],
          weekly_calendar: strategyData.weekly_calendar as Record<
            string,
            string[]
          >,
          posting_frequency: strategyData.posting_frequency || "3-5x per week",
          creator_style: strategyData.creator_style || "Authentic",
          content_breakdown: {
            Duet: 2,
            Meme: 1,
            Carousel: 2,
            Voiceover: 1,
          },
          full_plan_text: strategyData.full_plan_text,
          niche_topic: strategyData.niche_topic,
          topic_ideas: strategyData.topic_ideas as string[],
        };

        setStrategy(processedStrategy);
        setIsGeneratingStrategy(false);
        setGenerationStatus('success');
        // Auto-display content if we have valid strategy data
        setShowContent(true);
      } else {
        const { data: onboardingData, error: onboardingError } =
          await supabase
            .from("onboarding_answers")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

        if (onboardingError) {
          console.error("Error fetching onboarding data:", onboardingError);
        }

        if (onboardingData) {
          setIsGeneratingStrategy(true);
          setGenerationStatus('pending');
          await generateStrategy(onboardingData);
        }

        const storedStrategy = localStorage.getItem("userStrategy");
        if (storedStrategy) {
          try {
            setStrategy(JSON.parse(storedStrategy));
          } catch (error) {
            console.error("Error parsing strategy from localStorage:", error);
          }
        }
      }

      const { data: progressData, error: progressError } = await supabase
        .from("progress_tracking")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!progressError && progressData) {
        setProgress({
          current_xp: progressData.current_xp || 0,
          current_level: progressData.current_level || 1,
          streak_days: progressData.streak_days || 0,
          last_activity_date:
            progressData.last_activity_date || new Date().toISOString(),
          xp_next_level: (progressData.current_level + 1) * 100,
          level_tag:
            progressData.current_level === 1
              ? "Beginner"
              : progressData.current_level === 2
              ? "Explorer"
              : "Creator",
        });
      }

      const { data: reminderData, error: reminderError } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("reminder_time", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!reminderError && reminderData) {
        setReminder(reminderData as ReminderData);
      }

      const { data: scriptsData, error: scriptsError } = await supabase.rpc(
        "get_generated_scripts",
        { user_id_param: user.id }
      );

      if (!scriptsError && scriptsData) {
        setScripts(scriptsData as GeneratedScript[]);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Error loading data",
        description: "There was a problem loading your dashboard data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLastFetchAttempt(Date.now());

      // Always show content after fetching, even if still generating
      // This ensures users don't get stuck at loading screen
      if (!showContent) {
        setTimeout(() => {
          setShowContent(true);
        }, 1000);
      }
    }
  }, [user]);

  const generateWaitingMessage = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-waiting-message",
        {
          body: { userId: user.id },
        }
      );

      if (data?.message) setWaitingMessage(data.message);
    } catch (error) {
      console.error("Error generating waiting message:", error);
    }
  }, [user]);

  const generateStrategy = async (onboardingData: any) => {
    if (!user || !onboardingData) return;

    try {
      await generateWaitingMessage();
      setGenerationStatus('pending');

      try {
        // Direct fetch to the Supabase Function
        const response = await fetch("/functions/generate-strategy-plan", {
          method: "POST",
          body: JSON.stringify({ 
            userId: user.id, 
            onboardingData 
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Strategy generation failed");
        }
        
        const data = await response.json();
        
        if (data.mock) {
          console.log("Using mock strategy data (OpenAI assistant not configured)");
        }
        
        // Invalidate queries to refresh strategy data
        queryClient.invalidateQueries({
          queryKey: ['strategy_profiles']
        });
        
        toast({
          title: "Strategy Generated",
          description: "Your personalized content strategy is ready!",
        });
        
        setGenerationStatus('success');
        setIsGeneratingStrategy(false);
        // Immediately fetch user data after successful generation
        await fetchUserData();
        // Force show content after successful generation
        setShowContent(true);
      } catch (error: any) {
        console.error("Fetch error:", error);
        setGenerationError(error.message);
        setGenerationStatus('error');
        throw error;
      }
    } catch (error: any) {
      console.error("Error generating strategy:", error);
      setGenerationStatus('error');
      setGenerationError(error.message || "Unexpected error occurred");
      toast({
        title: "Strategy Generation Failed",
        description: "Unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Always stop showing the loading UI after some time
      setTimeout(() => {
        setIsGeneratingStrategy(false);
        setShowContent(true);
      }, 2000);
    }
  };

  // Initial data loading
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Auto-refresh after 5 seconds if we're still in pending state
  useEffect(() => {
    if (generationStatus === 'pending') {
      const refreshTimer = setTimeout(() => {
        console.log("Auto-refreshing data due to pending generation...");
        fetchUserData();
      }, 5000);
      
      return () => clearTimeout(refreshTimer);
    }
  }, [generationStatus, fetchUserData, lastFetchAttempt]);

  // Additional recovery attempt for errors
  useEffect(() => {
    // If generation was pending but there was an error, try once more after a timeout
    if (generationStatus === 'error' && generationError) {
      const retryTimeout = setTimeout(async () => {
        // Retry fetching the strategy in case it was generated despite the error
        console.log("Retrying strategy fetch after error...");
        
        const { data: strategyData } = await supabase
          .from("strategy_profiles")
          .select("id")
          .eq("user_id", user?.id)
          .maybeSingle();
          
        if (strategyData) {
          console.log("Strategy found on retry, refreshing data");
          fetchUserData();
        }
      }, 10000); // Wait 10 seconds before retrying
      
      return () => clearTimeout(retryTimeout);
    }
  }, [generationStatus, generationError, fetchUserData, user?.id]);

  if (profileComplete === false) return <Navigate to="/" replace />;

  if (isGeneratingStrategy && !showContent) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-background">
        <main className="flex-grow flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md text-center space-y-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-socialmize-purple mx-auto"></div>
            <h1 className="text-2xl font-bold">Generating Your Content Strategy</h1>
            <p className="text-lg">{waitingMessage || "Our AI is analyzing your profile..."}</p>
            <p className="text-sm text-muted-foreground">
              This takes about 15–30 seconds. You'll be redirected automatically when it's ready.
            </p>
            {generationStatus === 'error' && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">There was an issue generating your strategy. We're retrying...</p>
                <button 
                  onClick={fetchUserData}
                  className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md text-sm"
                >
                  Retry Now
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-background">
      <main className="flex-grow container py-6 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <CreatorSummaryHeader user={user} progress={progress} loading={loading} />
          
          <StrategyOverviewSection 
            strategy={strategy} 
            loading={loading} 
            onRegenerateClick={fetchUserData}
            onPlanConfirmed={setPlanConfirmed} 
          />

          {planConfirmed && (
            <>
              <WeeklyCalendarGrid strategy={strategy} loading={loading} />
              <ContentGeneratorSection
                strategy={strategy}
                loading={loading}
                refetchScripts={fetchUserData}
              />
              <TodaysMissionCard strategy={strategy} loading={loading} />
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Your Scripts</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScriptsSection strategy={strategy} loading={loading} />
                </CardContent>
              </Card>
              <ScriptPreviewsSection scripts={scripts} loading={loading} />
            </>
          )}

          <ReminderCard reminder={reminder} loading={loading} />
          <LevelProgressCard progress={progress} loading={loading} />
        </div>
      </main>
    </div>
  );
}
