
import { useState, useEffect } from "react";
import { useStrategyData } from "@/hooks/useStrategyData";
import { StrategyOverviewCard } from "./StrategyOverviewCard";
import { FullStrategyModal } from "./FullStrategyModal";
import { RegeneratePlanModal } from "./RegeneratePlanModal";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CalendarDays, AlertTriangle, CheckCircle, MessageCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

export const StrategyPlanSection = () => {
  const [isFullPlanOpen, setIsFullPlanOpen] = useState(false);
  const [isRegeneratePlanOpen, setIsRegeneratePlanOpen] = useState(false);
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
      fetchStrategyData();
    } else {
      console.error("Failed to confirm strategy");
    }
  };

  // Check if we have a valid strategy with a weekly calendar and if it's confirmed
  // A strategy is confirmed if confirmed_at is set, regardless of weekly_calendar
  const hasWeeklyCalendar = !!(strategy?.weekly_calendar && 
    Object.keys(strategy.weekly_calendar).length > 0);
  const isConfirmed = !!strategy?.confirmed_at;
  
  console.log("Strategy plan status:", {
    hasStrategy: !!strategy,
    strategyId: strategy?.id,
    hasWeeklyCalendar,
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
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={fetchStrategyData}
              >
                Retry
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
