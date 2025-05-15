
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart2, Calendar, Sparkles, AlertTriangle, RefreshCw, MessageCircle } from "lucide-react";
import { CreatorSummaryHeader, StrategyPlanSection } from "@/components/dashboard";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { DashboardPlanner } from "@/components/dashboard/DashboardPlanner";
import { DashboardAnalytics } from "@/components/dashboard/DashboardAnalytics";
import { StrategyGenerationState } from "@/components/dashboard/StrategyGenerationState";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";

export default function Dashboard() {
  const navigate = useNavigate();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [hasOnboardingAnswers, setHasOnboardingAnswers] = useState<boolean | null>(null);
  const { user } = useAuth();
  const [showContent, setShowContent] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'analytics' | 'planner'>('content');
  const [isRetrying, setIsRetrying] = useState(false);
  
  const {
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
    resetRetryCount,
    retryCount,
    showErrorNotification,
    errorShown,
    hasAttemptedRetry
  } = useDashboardData();

  // Check if user has completed onboarding
  useEffect(() => {
    const checkOnboardingAnswers = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('onboarding_answers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (error) {
          console.error('Error checking onboarding answers:', error);
          setHasOnboardingAnswers(false);
          setOnboardingChecked(true);
          return;
        }
        
        if (!data) {
          console.log("No onboarding data found - redirecting to onboarding");
          setHasOnboardingAnswers(false);
          setOnboardingChecked(true);
          navigate('/onboarding');
          return;
        }
        
        setHasOnboardingAnswers(true);
        setOnboardingChecked(true);
      } catch (err) {
        console.error("Failed to check onboarding status:", err);
        setOnboardingChecked(true);
      }
    };
    
    if (user && user.id && !onboardingChecked) {
      checkOnboardingAnswers();
    }
  }, [user, navigate, onboardingChecked]);

  // Debug logging - using a stable reference to avoid re-renders
  useEffect(() => {
    console.log('Dashboard debug:', {
      user: user?.id,
      hasStrategy: !!strategy,
      loading,
      profileComplete,
      isGeneratingStrategy,
      planConfirmed,
      generationStatus,
      generationError,
      retryCount,
      errorShown,
      hasOnboardingAnswers,
      onboardingChecked
    });
    
    // Add detailed strategy confirmation logging
    if (strategy) {
      console.log('Strategy confirmation details:', {
        strategyId: strategy.id,
        confirmedAt: strategy.confirmed_at,
        isActive: strategy.is_active,
        strategyType: strategy.strategy_type,
        hasWeeklyCalendar: !!strategy.weekly_calendar && Object.keys(strategy.weekly_calendar).length > 0
      });
    }
  }, [loading, generationStatus, strategy, user, hasOnboardingAnswers, onboardingChecked]); 

  // Display error toast on generation error, but only once
  useEffect(() => {
    if (generationStatus === 'error' && generationError && !hasAttemptedRetry && retryCount >= 3 && !errorShown) {
      showErrorNotification(
        "Strategy Generation Issue",
        "We encountered an issue while creating your strategy. Please try again manually.",
        () => {
          resetRetryCount();
          fetchUserData();
        }
      );
    }
  }, [generationStatus, generationError, hasAttemptedRetry, fetchUserData, resetRetryCount, retryCount, errorShown, showErrorNotification]);

  // Toggle visibility of content after initial load
  useEffect(() => {
    if (!showContent) {
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showContent]);

  const handleGoToStrategyChat = () => {
    navigate('/strategy-chat');
  };
  
  // Manual refresh handler with loading state
  const handleManualRefresh = async () => {
    setIsRetrying(true);
    try {
      await fetchUserData();
      toast({
        title: "Dashboard Refreshed",
        description: "Your dashboard data has been refreshed.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "There was a problem refreshing your dashboard data.",
        variant: "destructive",
      });
    } finally {
      setIsRetrying(false);
    }
  };
  
  // Immediately fetch data when the component mounts
  useEffect(() => {
    if (user && user.id) {
      console.log('Fetching user data on Dashboard mount');
      fetchUserData();
    }
  }, [user, fetchUserData]);

  if (!onboardingChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-socialmize-purple mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (hasOnboardingAnswers === false) return null;
  if (profileComplete === false) return <Navigate to="/" replace />;

  // Display a more informative generation state with better error handling
  if (isGeneratingStrategy && !showContent) {
    return (
      <StrategyGenerationState 
        isGeneratingStrategy={isGeneratingStrategy}
        waitingMessage={waitingMessage}
        generationStatus={generationStatus}
        generationError={generationError}
        onRetry={() => {
          resetRetryCount();
          fetchUserData();
        }}
      />
    );
  }

  // Check if strategy is confirmed by looking at the confirmed_at field directly
  const isStrategyConfirmed = !!(strategy && strategy.confirmed_at);
  
  // Log the confirmation status for debugging
  console.log('Strategy confirmation status check:', {
    hasStrategy: !!strategy,
    isStrategyConfirmed,
    confirmedAt: strategy?.confirmed_at,
    planConfirmed
  });

  // Function to determine if the dashboard content should be shown
  const shouldShowDashboardContent = () => {
    // If loading, don't make a decision yet
    if (loading) return false;
    
    // If no strategy, don't show content
    if (!strategy) return false;
    
    // Show content if strategy is confirmed, regardless of weekly_calendar
    return isStrategyConfirmed;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-background">
      <main className="flex-grow container py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <Button 
                  onClick={handleManualRefresh} 
                  variant="outline" 
                  size="sm"
                  disabled={isRetrying}
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </>
                  )}
                </Button>
              </div>
              
              <CreatorSummaryHeader user={user} progress={progress} loading={loading} />
              
              {/* Only show error alert if there's a persistent error after multiple attempts */}
              {generationStatus === 'error' && generationError && retryCount >= 3 && (
                <Alert variant="destructive" className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Strategy Generation Error</AlertTitle>
                  <AlertDescription>
                    {generationError}
                    <Button 
                      onClick={() => {
                        resetRetryCount();
                        fetchUserData();
                      }}
                      className="mt-2 inline-flex items-center"
                      size="sm"
                      variant="outline"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Try again manually
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
              <StrategyPlanSection />

              {shouldShowDashboardContent() ? (
                <>
                  <Tabs 
                    value={activeTab} 
                    onValueChange={(value) => setActiveTab(value as 'content' | 'analytics' | 'planner')}
                    className="my-6"
                  >
                    <TabsList className="grid grid-cols-3 mb-4">
                      <TabsTrigger value="content" className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Content
                      </TabsTrigger>
                      <TabsTrigger value="planner" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Planner
                      </TabsTrigger>
                      <TabsTrigger value="analytics" className="flex items-center gap-2">
                        <BarChart2 className="h-4 w-4" />
                        Analytics
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="content">
                      <DashboardContent 
                        strategy={strategy} 
                        scripts={scripts} 
                        loading={loading} 
                        refetchScripts={fetchUserData} 
                      />
                    </TabsContent>
                    
                    <TabsContent value="planner">
                      <DashboardPlanner 
                        strategy={strategy}
                        reminder={reminder}
                        loading={loading}
                        progress={progress}
                      />
                    </TabsContent>
                    
                    <TabsContent value="analytics">
                      <DashboardAnalytics 
                        scripts={scripts}
                        loading={loading}
                      />
                    </TabsContent>
                  </Tabs>
                </>
              ) : (
                <div className="text-center py-12 bg-muted rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Complete Your Strategy Plan</h3>
                  <p className="text-muted-foreground mb-4">Confirm your content strategy plan to access the dashboard features</p>
                  <div className="flex flex-col gap-3 items-center justify-center sm:flex-row">
                    <Button onClick={handleManualRefresh} disabled={isRetrying}>
                      {isRetrying ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh Status
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleGoToStrategyChat} className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Go to Strategy Chat
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
