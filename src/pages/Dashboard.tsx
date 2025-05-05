
// pages/Dashboard.tsx

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart2, Calendar, Sparkles } from "lucide-react";
import { CreatorSummaryHeader, StrategyPlanSection } from "@/components/dashboard";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { DashboardPlanner } from "@/components/dashboard/DashboardPlanner";
import { DashboardAnalytics } from "@/components/dashboard/DashboardAnalytics";
import { StrategyGenerationState } from "@/components/dashboard/StrategyGenerationState";
import { QueryClient } from "@tanstack/react-query";
import { useDashboardData } from "@/hooks/useDashboardData";

export default function Dashboard() {
  const { user } = useAuth();
  const [queryClient] = useState(() => new QueryClient());
  const [showContent, setShowContent] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'analytics' | 'planner'>('content');
  
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
  } = useDashboardData();

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

  if (isGeneratingStrategy && !showContent) {
    return (
      <StrategyGenerationState 
        isGeneratingStrategy={isGeneratingStrategy}
        waitingMessage={waitingMessage}
        generationStatus={generationStatus}
        generationError={generationError}
        onRetry={fetchUserData}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-background">
      <main className="flex-grow container py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <CreatorSummaryHeader user={user} progress={progress} loading={loading} />
          
          <StrategyPlanSection />

          {planConfirmed && (
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
          )}
        </div>
      </main>
    </div>
  );
}
