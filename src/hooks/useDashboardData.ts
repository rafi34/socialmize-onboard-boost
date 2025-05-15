
import { useCallback, useEffect, useRef } from "react";
import { useUserProfile } from "./dashboard/useUserProfile";
import { useStrategy } from "./dashboard/useStrategy";
import { useProgressTracking } from "./dashboard/useProgressTracking";
import { useReminders } from "./dashboard/useReminders";
import { useScripts } from "./dashboard/useScripts";
import { useNotifications } from "./dashboard/useNotifications";
import { useAuth } from "@/contexts/AuthContext";

export function useDashboardData() {
  const { user } = useAuth();
  const userProfile = useUserProfile();
  const strategyState = useStrategy();
  const progressState = useProgressTracking();
  const remindersState = useReminders();
  const scriptsState = useScripts();
  const notifications = useNotifications();
  const fetchingRef = useRef(false);
  
  // Compute loading state by combining all loading states
  const loading = 
    userProfile.loading || 
    progressState.loading ||
    remindersState.loading ||
    scriptsState.loading;

  // Function to fetch all dashboard data
  const fetchUserData = useCallback(async () => {
    // Prevent duplicate fetches
    if (fetchingRef.current) return;
    
    try {
      fetchingRef.current = true;
      console.log("Fetching all dashboard data...");
      
      // Add a small delay to avoid race conditions
      const fetchWithDelay = async (fn: Function, name: string) => {
        try {
          await fn();
          console.log(`${name} fetch complete`);
        } catch (err) {
          console.error(`Error fetching ${name}:`, err);
        }
      };
      
      // Fetch data sequentially to avoid potential race conditions
      await fetchWithDelay(userProfile.fetchProfileData, "Profile");
      await fetchWithDelay(strategyState.fetchStrategyData, "Strategy");
      await fetchWithDelay(progressState.fetchProgressData, "Progress");
      await fetchWithDelay(remindersState.fetchReminders, "Reminders");
      await fetchWithDelay(scriptsState.fetchScripts, "Scripts");
      
      notifications.resetErrorState();
      console.log("All dashboard data fetched");
    } finally {
      // Ensure we reset the fetching flag to allow future fetches
      setTimeout(() => {
        fetchingRef.current = false;
      }, 2000); // Add a small cooldown period
    }
  }, [
    userProfile.fetchProfileData,
    strategyState.fetchStrategyData, 
    progressState.fetchProgressData,
    remindersState.fetchReminders,
    scriptsState.fetchScripts,
    notifications.resetErrorState
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
