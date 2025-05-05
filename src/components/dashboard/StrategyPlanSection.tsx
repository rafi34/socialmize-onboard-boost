
import { useState } from "react";
import { useStrategyData } from "@/hooks/useStrategyData";
import { StrategyOverviewCard } from "./StrategyOverviewCard";
import { FullStrategyModal } from "./FullStrategyModal";
import { RegeneratePlanModal } from "./RegeneratePlanModal";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CalendarDays, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const StrategyPlanSection = () => {
  const [isFullPlanOpen, setIsFullPlanOpen] = useState(false);
  const [isRegeneratePlanOpen, setIsRegeneratePlanOpen] = useState(false);
  const { strategy, loading, error, regenerateStrategy, fetchStrategyData } = useStrategyData();

  const handleOpenFullPlan = () => {
    setIsFullPlanOpen(true);
  };
  
  const handleOpenRegenerate = () => {
    setIsRegeneratePlanOpen(true);
  };

  const handleRegenerateSuccess = () => {
    setIsRegeneratePlanOpen(false);
    fetchStrategyData();
  };

  // Check if we have a valid strategy with a weekly calendar
  const hasWeeklyCalendar = !!(strategy?.weekly_calendar && 
    Object.keys(strategy.weekly_calendar).length > 0);

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
        
        <StrategyOverviewCard 
          onRegenerateClick={handleOpenRegenerate}
          fullPlanText={strategy?.full_plan_text}
          onViewFullPlan={handleOpenFullPlan}
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
        userId={localStorage.getItem("userId") || ""}
        onSuccess={handleRegenerateSuccess}
      />
    </div>
  );
};
