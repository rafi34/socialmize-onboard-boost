
import { useCallback, useEffect } from "react";
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
  
  // Compute loading state by combining all loading states
  const loading = 
    userProfile.loading || 
    progressState.loading ||
    remindersState.loading ||
    scriptsState.loading;

  // Function to fetch all dashboard data
  const fetchUserData = useCallback(async () => {
    console.log("Fetching all dashboard data...");
    await userProfile.fetchProfileData();
    await strategyState.fetchStrategyData();
    await progressState.fetchProgressData();
    await remindersState.fetchReminders();
    await scriptsState.fetchScripts();
    notifications.resetErrorState();
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
    if (user?.id) {
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
