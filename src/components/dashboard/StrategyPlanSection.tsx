
import { useState, useEffect } from "react";
import { useStrategyData } from "@/hooks/useStrategyData";
import { StrategyOverviewCard } from "./StrategyOverviewCard";
import { FullStrategyModal } from "./FullStrategyModal";
import { RegeneratePlanModal } from "./RegeneratePlanModal";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CalendarDays, AlertTriangle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { trackUserAction } from "@/utils/xpUtils";

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
    const success = await confirmStrategyPlan();
    if (success && user) {
      // Add XP reward for confirming strategy
      await trackUserAction(user.id, 'strategy_confirmed', {
        strategy_id: strategy?.id,
        strategy_type: strategy?.strategy_type || 'starter'
      });
      
      // Award +100 XP directly to xp_progress
      if (user.id) {
        try {
          await supabase.from('xp_progress').insert({
            user_id: user.id,
            event: 'strategy_confirmed',
            xp_earned: 100
          });
        } catch (err) {
          console.error("Error awarding strategy confirmation XP:", err);
        }
      }
      
      fetchStrategyData();
    }
  };

  // Check if we have a valid strategy with a weekly calendar and if it's confirmed
  const hasWeeklyCalendar = !!(strategy?.weekly_calendar && 
    Object.keys(strategy.weekly_calendar).length > 0);
  const isConfirmed = !!strategy?.confirmed_at;
  const isStarterStrategy = strategy?.strategy_type === 'starter';

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
        
        {/* Title adjusted based on strategy type */}
        {strategy && (
          <h2 className="text-xl font-semibold mb-4">
            {isStarterStrategy ? "Your Starter Strategy" : "Your Monthly Strategy"}
            {isConfirmed && <span className="ml-2 text-green-500">✅</span>}
          </h2>
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
      
      {hasWeeklyCalendar && (
        <div className="flex-shrink-0 w-full md:w-auto mt-2 md:mt-0">
          <Button asChild variant="outline" className="w-full md:w-auto flex items-center gap-2">
            <Link to="/weekly-calendar">
              <CalendarDays className="h-4 w-4" />
              View Full Calendar
            </Link>
          </Button>
        </div>
      )}
      
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
};
