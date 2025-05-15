
import { useCallback, useEffect, useRef, useState } from "react";
import { useUserProfile } from "./dashboard/useUserProfile";
import { useStrategy } from "./dashboard/useStrategy";
import { useProgressTracking } from "./dashboard/useProgressTracking";
import { useReminders } from "./dashboard/useReminders";
import { useScripts } from "./dashboard/useScripts";
import { useNotifications } from "./dashboard/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

export function useDashboardData() {
  const { user } = useAuth();
  const userProfile = useUserProfile();
  const strategyState = useStrategy();
  const progressState = useProgressTracking();
  const remindersState = useReminders();
  const scriptsState = useScripts();
  const notifications = useNotifications();
  const fetchingRef = useRef(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Compute loading state by combining all loading states
  const loading = 
    userProfile.loading || 
    progressState.loading ||
    remindersState.loading ||
    scriptsState.loading;

  // Function to fetch all dashboard data
  const fetchUserData = useCallback(async () => {
    // Prevent duplicate fetches
    if (fetchingRef.current || !user?.id) {
      console.log("Skipping fetch - already fetching or no user");
      return;
    }
    
    try {
      fetchingRef.current = true;
      console.log("Fetching all dashboard data...");
      
      // Add a small delay to avoid race conditions
      const fetchWithDelay = async (fn: Function, name: string) => {
        try {
          await fn();
          console.log(`${name} fetch complete`);
          return true;
        } catch (err) {
          console.error(`Error fetching ${name}:`, err);
          // Continue with other fetches even if one fails
          return false;
        }
      };
      
      // Check if onboarding data exists and sync with strategy profile if needed
      const checkOnboardingData = async () => {
        try {
          const { data: onboardingData, error } = await supabase
            .from('onboarding_answers')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (error) {
            if (error.code !== 'PGRST116') { // Not found
              console.error("Error checking onboarding data:", error);
            }
            return;
          }
          
          if (onboardingData) {
            // If data exists, make sure it's synced with strategy profile
            const { error: syncError } = await supabase.functions.invoke("sync-creator-settings", {
              body: { userId: user.id }
            });
            
            if (syncError) {
              console.error("Error syncing creator settings:", syncError);
            }
          }
        } catch (err) {
          console.error("Error in checkOnboardingData:", err);
        }
      };
      
      // First check and sync onboarding data
      await checkOnboardingData();
      
      // Then fetch all the data sequentially to avoid race conditions
      await fetchWithDelay(userProfile.fetchProfileData, "Profile");
      await fetchWithDelay(strategyState.fetchStrategyData, "Strategy");
      await fetchWithDelay(progressState.fetchProgressData, "Progress");
      await fetchWithDelay(remindersState.fetchReminders, "Reminders");
      await fetchWithDelay(scriptsState.fetchScripts, "Scripts");
      
      notifications.resetErrorState();
      console.log("All dashboard data fetched");
      
      // Only show initial load completed message on first successful load
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error("Error in fetchUserData:", error);
      
      if (isInitialLoad) {
        toast({
          title: "Dashboard Loading Issue",
          description: "There was a problem loading your dashboard data. Retrying...",
          variant: "destructive",
        });
      }
    } finally {
      // Ensure we reset the fetching flag to allow future fetches
      setTimeout(() => {
        fetchingRef.current = false;
      }, 2000); // Add a small cooldown period
    }
  }, [
    user?.id,
    userProfile.fetchProfileData,
    strategyState.fetchStrategyData, 
    progressState.fetchProgressData,
    remindersState.fetchReminders,
    scriptsState.fetchScripts,
    notifications.resetErrorState,
    isInitialLoad
  ]);

  // Fetch data when the hook is initialized
  useEffect(() => {
    if (user?.id && !fetchingRef.current) {
      console.log("useDashboardData - Initial data fetch");
      fetchUserData();
    }
  }, [user?.id, fetchUserData]);

  // Create a combined object with all the data and functions
  return {
    user: userProfile.user,
    strategy: strategyState.strategy,
    progress: progressState.progress,
    reminder: remindersState.reminder,
    scripts: scriptsState.scripts,
    loading,
    profileComplete: userProfile.profileComplete,
    isGeneratingStrategy: strategyState.isGeneratingStrategy,
    waitingMessage: strategyState.waitingMessage,
    planConfirmed: strategyState.planConfirmed,
    generationStatus: strategyState.generationStatus,
    generationError: strategyState.generationError,
    fetchUserData,
    generateStrategy: strategyState.generateStrategy,
    generateWaitingMessage: strategyState.generateWaitingMessage,
    resetRetryCount: strategyState.resetRetryCount,
    retryCount: strategyState.retryCount,
    errorShown: notifications.errorShown,
    hasAttemptedRetry: notifications.hasAttemptedRetry,
    showErrorNotification: notifications.showErrorNotification
  };
}
