
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { StrategyData } from "@/types/dashboard";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { trackUserAction } from "@/utils/xpUtils";
import { parseFullStrategyJson, getStrategySummary } from "@/utils/parseFullStrategyJson";
import { ToastAction } from "@/components/ui/toast";

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
      
      // Only fetch active strategies
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
        console.log("Strategy data retrieved:", data);
        console.log("Strategy confirmed_at:", data.confirmed_at);
        console.log("Strategy is_active:", data.is_active);
        
        // Process the strategy data
        const hasWeeklyCalendar = !!(data.weekly_calendar && 
          typeof data.weekly_calendar === 'object');
        
        // IMPORTANT: Use confirmed_at to determine if strategy is confirmed
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
        
        // Reset retry counter on success
        setRetryCount(0);
      } else {
        console.log("No active strategy data found");
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

  // State for tracking strategy generation progress
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // Function to regenerate strategy
  const regenerateStrategy = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      setLoading(true);
      setError(null);
      setIsGeneratingStrategy(true);
      setGenerationStatus('pending');
      setGenerationError(null);
      
      toast({
        title: "Regenerating your strategy...",
        description: "This might take a moment. You'll be notified when it's ready.",
      });
      
      // Retrieve the onboarding data
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
      
      // Generate a unique job ID for tracking
      const jobId = `strategy-${user.id}-${Date.now()}`;
      
      // Call the improved Supabase Edge Function that uses Assistants API
      const { data, error } = await supabase.functions.invoke("generate-strategy-plan", {
        body: {
          userId: user.id,
          jobId,
          strategyType,
          isRegen: true,
          onboardingData
        }
      });
      
      if (error) throw error;
      
      if (!data?.success) {
        throw new Error(data?.error || "Failed to start strategy regeneration");
      }
      
      // Poll for strategy completion
      const pollForCompletion = async () => {
        try {
          // Check if the job metadata table exists
          const { error: checkError } = await supabase
            .from('strategy_generation_jobs')
            .select('count')
            .limit(1);
          
          // If the table doesn't exist, use the old timeout method
          if (checkError) {
            console.log("Strategy generation jobs table may not exist, using timeout method instead");
            await new Promise(resolve => setTimeout(resolve, 5000));
            await fetchStrategyData();
            setGenerationStatus('success');
            setIsGeneratingStrategy(false);
            
            toast({
              title: "Strategy Regenerated",
              description: "Your content strategy has been updated successfully.",
            });
            
            return;
          }
          
          // Start polling with exponential backoff
          let attempt = 0;
          const maxAttempts = 15;
          
          const checkStatus = async (): Promise<boolean> => {
            const { data: jobData, error: jobError } = await supabase
              .from('strategy_generation_jobs')
              .select('status')
              .eq('job_id', jobId)
              .maybeSingle();
              
            if (jobError) {
              console.error("Error checking job status:", jobError);
              return false;
            }
            
            if (!jobData) {
              console.log("No job data found, falling back to checking for strategy directly");
              
              // Try to check if the strategy was created directly
              const { data: strategyData } = await supabase
                .from('strategy_profiles')
                .select('id')
                .eq('user_id', user.id)
                .eq('job_id', jobId)
                .maybeSingle();
                
              if (strategyData) {
                return true; // Strategy exists
              }
              
              return false;
            }
            
            console.log(`Strategy generation status: ${jobData.status}`);
            
            if (jobData.status === 'completed') {
              return true;
            } else if (['failed', 'cancelled', 'expired'].includes(jobData.status)) {
              throw new Error(`Strategy generation ${jobData.status}`);
            }
            
            return false;
          };
          
          while (attempt < maxAttempts) {
            const isComplete = await checkStatus();
            if (isComplete) {
              await fetchStrategyData();
              setGenerationStatus('success');
              setIsGeneratingStrategy(false);
              
              toast({
                title: "Strategy Regenerated",
                description: "Your content strategy has been updated successfully.",
              });
              
              return;
            }
            
            // Wait with exponential backoff (1s, 2s, 4s, 8s, etc. up to 10s max)
            const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
            await new Promise(resolve => setTimeout(resolve, delay));
            attempt++;
          }
          
          throw new Error("Strategy generation timed out. Please try again later.");
        } catch (err: any) {
          console.error("Error during strategy generation polling:", err);
          setGenerationStatus('error');
          setGenerationError(err.message || "Strategy generation failed");
          setIsGeneratingStrategy(false);
          
          toast({
            title: "Regeneration Failed",
            description: err.message || "An unexpected error occurred. Please try again.",
            variant: "destructive",
          });
        }
      };
      
      // Start polling in the background without awaiting
      pollForCompletion();
      
      // Return true to indicate the process has started
      return true;
    } catch (err: any) {
      console.error("Error regenerating strategy:", err);
      setGenerationStatus('error');
      setGenerationError(err.message || "An unexpected error occurred");
      setIsGeneratingStrategy(false);
      
      toast({
        title: "Regeneration Failed",
        description: err.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      // Just mark loading as false, but keep isGeneratingStrategy true
      // until the polling completes
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
      
      // Update only the active strategy
      const { error } = await supabase
        .from("strategy_profiles")
        .update({ 
          confirmed_at: now,
          is_active: true,
          // Make sure strategy_type is set
          strategy_type: strategy.strategy_type || "starter"
        })
        .eq("user_id", user.id)
        .eq("id", strategy.id)
        .eq("is_active", true); // Only update if it's active
        
      if (error) throw error;
      
      // Track user action for confirming strategy
      await trackUserAction(user.id, 'strategy_confirmed', {
        strategy_id: strategy.id,
        strategy_type: strategy.strategy_type
      });
      
      // Refresh strategy data
      await fetchStrategyData();
      
      // Show success toast
      toast({
        title: "Strategy Confirmed",
        description: `Your ${strategy.strategy_type === "starter" ? "Starter" : ""} content strategy has been confirmed! +100 XP`,
      });
      
      // Navigate to content planner for 30-day detailed strategy
      setTimeout(() => {
        toast({
          title: "Ready for the next step?",
          description: "Create a detailed 30-day plan with custom content ideas.",
        });
        
        // Show a button to navigate to content planner in UI instead of toast action
      }, 1500);
      
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
    isGeneratingStrategy,
    generationStatus,
    generationError,
    fetchStrategyData,
    regenerateStrategy,
    resetRetries,
    confirmStrategyPlan,
    planConfirmed: strategy ? !!strategy.confirmed_at : false
  };
}
