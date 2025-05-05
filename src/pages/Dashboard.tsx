
// pages/Dashboard.tsx

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart2, Calendar, Sparkles, AlertTriangle, RefreshCw } from "lucide-react";
import { CreatorSummaryHeader, StrategyPlanSection } from "@/components/dashboard";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { DashboardPlanner } from "@/components/dashboard/DashboardPlanner";
import { DashboardAnalytics } from "@/components/dashboard/DashboardAnalytics";
import { StrategyGenerationState } from "@/components/dashboard/StrategyGenerationState";
import { QueryClient } from "@tanstack/react-query";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { showNotification } from "@/components/ui/notification-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  const [queryClient] = useState(() => new QueryClient());
  const [showContent, setShowContent] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'analytics' | 'planner'>('content');
  const [hasAttemptedRetry, setHasAttemptedRetry] = useState(false);
  
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
    retryCount
  } = useDashboardData();

  // Display error toast on generation error, but only once
  useEffect(() => {
    if (generationStatus === 'error' && generationError && !hasAttemptedRetry && retryCount >= 3) {
      showNotification({
        title: "Strategy Generation Issue",
        description: "We encountered an issue while creating your strategy. Please try again manually.",
        type: "error",
        duration: 8000,
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              resetRetryCount();
              fetchUserData();
              setHasAttemptedRetry(true);
            }}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        ),
      });
    }
  }, [generationStatus, generationError, hasAttemptedRetry, fetchUserData, resetRetryCount, retryCount]);

  // Toggle visibility of content after initial load
  useEffect(() => {
    if (!showContent) {
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showContent]);

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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-background">
      <main className="flex-grow container py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <>
              <CreatorSummaryHeader user={user} progress={progress} loading={loading} />
              
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

              {planConfirmed ? (
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
                        progress={progress}
                        reminder={reminder}
                        loading={loading}
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
                  <Button onClick={() => fetchUserData()}>Refresh Status</Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
