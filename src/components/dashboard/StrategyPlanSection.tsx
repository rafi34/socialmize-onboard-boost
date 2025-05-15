
import { useState, useEffect } from "react";
import { useStrategyData } from "@/hooks/useStrategyData";
import { StrategyOverviewCard } from "./StrategyOverviewCard";
import { FullStrategyModal } from "./FullStrategyModal";
import { RegeneratePlanModal } from "./RegeneratePlanModal";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CalendarDays, AlertTriangle, CheckCircle, MessageCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

export const StrategyPlanSection = () => {
  const [isFullPlanOpen, setIsFullPlanOpen] = useState(false);
  const [isRegeneratePlanOpen, setIsRegeneratePlanOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const { toast } = useToast();
  
  const { 
    strategy, 
    loading, 
    error, 
    regenerateStrategy, 
    fetchStrategyData,
    confirmStrategyPlan 
  } = useStrategyData();
  
  const { user } = useAuth();

  // Add effect to refresh strategy data when component mounts
  useEffect(() => {
    if (user?.id) {
      console.log("StrategyPlanSection - Fetching strategy data");
      fetchStrategyData();
    }
  }, [user?.id, fetchStrategyData]);

  const handleOpenFullPlan = () => {
    setIsFullPlanOpen(true);
  };
  
  const handleOpenRegenerate = () => {
    setIsRegeneratePlanOpen(true);
  };

  const handleRegenerateSuccess = () => {
    setIsRegeneratePlanOpen(false);
    // Add a longer delay before fetching to ensure the database has updated
    setTimeout(() => {
      fetchStrategyData();
    }, 2500);
  };
  
  const handleConfirmStrategy = async () => {
    console.log("Confirming strategy plan...");
    const success = await confirmStrategyPlan();
    if (success) {
      console.log("Strategy confirmed successfully, fetching updated data");
      toast({
        title: "Strategy Confirmed",
        description: "Your strategy plan has been confirmed successfully.",
      });
      fetchStrategyData();
    } else {
      console.error("Failed to confirm strategy");
      toast({
        title: "Error",
        description: "Failed to confirm strategy. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRetryFetch = async () => {
    setIsRetrying(true);
    try {
      await fetchStrategyData();
      toast({
        title: "Refresh Complete",
        description: "Your strategy data has been refreshed.",
      });
    } catch (err) {
      console.error("Error retrying strategy fetch:", err);
      toast({
        title: "Error",
        description: "Failed to refresh data. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsRetrying(false);
    }
  };

  // Use confirmed_at as the primary indicator of whether a strategy is confirmed
  const isConfirmed = !!strategy?.confirmed_at;
  
  console.log("Strategy plan status:", {
    hasStrategy: !!strategy,
    strategyId: strategy?.id,
    hasWeeklyCalendar: strategy?.weekly_calendar ? Object.keys(strategy.weekly_calendar).length > 0 : false,
    isConfirmed,
    confirmedAt: strategy?.confirmed_at,
    isActive: strategy?.is_active
  });

  return (
    <div className="mb-6 flex flex-col md:flex-row items-start gap-4">
      <div className="flex-grow w-full md:w-auto">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error loading strategy</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <p>{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 self-start"
                onClick={handleRetryFetch}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </>
                )}
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {strategy && isConfirmed && (
          <Alert variant="default" className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Strategy Confirmed</AlertTitle>
            <AlertDescription className="text-gray-600">
              {strategy.confirmed_at && 
                `You confirmed this ${strategy.strategy_type || 'starter'} strategy plan ${formatDistanceToNow(new Date(strategy.confirmed_at))} ago.`}
            </AlertDescription>
          </Alert>
        )}
        
        <StrategyOverviewCard 
          onRegenerateClick={handleOpenRegenerate}
          fullPlanText={strategy?.full_plan_text}
          onViewFullPlan={handleOpenFullPlan}
          isConfirmed={isConfirmed}
          onConfirmClick={handleConfirmStrategy}
          strategyType={strategy?.strategy_type || "starter"}
        />
      </div>
      
      <div className="flex-shrink-0 w-full md:w-auto mt-2 md:mt-0 flex gap-2 flex-col sm:flex-row">
        {isConfirmed && (
          <Button asChild variant="outline" className="w-full md:w-auto flex items-center gap-2">
            <Link to="/weekly-calendar">
              <CalendarDays className="h-4 w-4" />
              View Calendar
            </Link>
          </Button>
        )}
        
        <Button asChild variant="outline" className="w-full md:w-auto flex items-center gap-2">
          <Link to="/strategy-chat">
            <MessageCircle className="h-4 w-4" />
            Strategy Chat
          </Link>
        </Button>
      </div>
      
      <FullStrategyModal 
        isOpen={isFullPlanOpen} 
        onClose={() => setIsFullPlanOpen(false)}
        fullPlanText={strategy?.full_plan_text || ""}
        onRegenerateClick={handleOpenRegenerate}
      />
      
      <RegeneratePlanModal
        isOpen={isRegeneratePlanOpen}
        onClose={() => setIsRegeneratePlanOpen(false)}
        userId={user?.id || ""} 
        onSuccess={handleRegenerateSuccess}
        onGenerationStart={() => setIsRegeneratePlanOpen(false)} // Close modal when generation starts
      />
    </div>
  );
}
