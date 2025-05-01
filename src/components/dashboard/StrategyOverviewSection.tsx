import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, RefreshCw, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { RegeneratePlanModal } from "./RegeneratePlanModal";
import { StrategyOverviewCard } from "./StrategyOverviewCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface StrategyOverviewSectionProps {
  onPlanConfirmed?: (confirmed: boolean) => void;
}

export const StrategyOverviewSection = ({ onPlanConfirmed }: StrategyOverviewSectionProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [hasStrategy, setHasStrategy] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [isFirstGeneration, setIsFirstGeneration] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fullPlanText, setFullPlanText] = useState<string | null>(null);
  const [strategyId, setStrategyId] = useState<string | null>(null);
  const [isPlanConfirmed, setIsPlanConfirmed] = useState(false);

  useEffect(() => {
    if (user) {
      checkForStrategy();
    }
  }, [user]);

  const checkForStrategy = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('strategy_profiles')
        .select('id, weekly_calendar, full_plan_text')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error("Error checking for strategy:", error);
        toast({
          title: "Error",
          description: "Could not check for strategy plan. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      const hasExistingStrategy = !!data;
      setHasStrategy(hasExistingStrategy);
      setIsFirstGeneration(!hasExistingStrategy);
      
      if (data) {
        if (data.full_plan_text) {
          setFullPlanText(data.full_plan_text);
        }
        
        // Store strategy ID for confirmation
        setStrategyId(data.id);
        
        // Check if plan is confirmed by looking for weekly_calendar
        const confirmed = !!(data.weekly_calendar && 
          typeof data.weekly_calendar === 'object');
          
        setIsPlanConfirmed(confirmed);
        
        if (onPlanConfirmed) {
          onPlanConfirmed(confirmed);
        }
      }
    } catch (error) {
      console.error("Error in checkForStrategy:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateClick = () => {
    if (user) {
      setShowRegenerateModal(true);
    }
  };

  const handleGenerationStart = () => {
    setIsGenerating(true);
  };

  const handleConfirmPlan = async () => {
    if (!user || !strategyId) {
      toast({
        title: "Error",
        description: "Unable to confirm plan. User or strategy ID not found.",
        variant: "destructive",
      });
      return;
    }
    
    setConfirmLoading(true);
    try {
      toast({
        title: "Confirming plan...",
        description: "We're generating your weekly calendar.",
      });
      
      // Call the confirm-strategy-plan edge function
      console.log("Confirming strategy plan with userId:", user.id, "and strategyId:", strategyId);
      const { data, error } = await supabase.functions.invoke('confirm-strategy-plan', {
        body: { 
          userId: user.id,
          strategyPlanId: strategyId 
        }
      });
      
      if (error) {
        console.error("Error confirming strategy plan:", error);
        throw new Error(error.message || "Failed to confirm your strategy plan");
      }
      
      console.log("Confirm plan response:", data);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['strategy_profiles']
      });
      
      // Refresh the strategy check
      await checkForStrategy();
      
      toast({
        title: "Plan confirmed!",
        description: "Your weekly calendar is now available.",
      });
      
    } catch (error: any) {
      console.error("Error in handleConfirmPlan:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  // Show loading state when generating
  if (isGenerating) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-socialmize-purple mb-4"></div>
            <h3 className="text-xl font-medium mb-2">Generating Your Strategy Plan</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Our AI is analyzing your profile and creating a tailored content strategy.
              This takes about 15-30 seconds.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-socialmize-purple mb-4"></div>
            <h3 className="text-xl font-medium mb-2">Loading Your Strategy Plan</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Please wait while we retrieve your content strategy...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state - No strategy plan yet
  if (!hasStrategy) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Your Strategy Plan (Tailored for You)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <Brain className="h-12 w-12 text-socialmize-purple mb-4" />
            <h3 className="text-xl font-medium mb-2">No Strategy Plan Yet</h3>
            <p className="text-center text-muted-foreground mb-4">
              Generate a tailored content strategy plan based on your creator profile.
            </p>
            <Button 
              onClick={handleGenerateClick}
              className="flex items-center gap-2"
            >
              <Brain className="h-4 w-4" />
              Generate My Strategy Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Has a strategy plan but not confirmed yet
  if (hasStrategy && !isPlanConfirmed) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Your Strategy Plan (Tailored for You)</CardTitle>
        </CardHeader>
        <CardContent>
          {fullPlanText && (
            <div className="p-4 bg-socialmize-light-purple/50 rounded-lg border border-socialmize-light-purple mb-6">
              <p className="text-sm whitespace-pre-wrap">{fullPlanText}</p>
            </div>
          )}
          
          <div className="flex flex-col items-center justify-center py-4">
            <h3 className="text-xl font-medium mb-2">Ready to Implement Your Strategy?</h3>
            <p className="text-center text-muted-foreground mb-4">
              Confirm your strategy plan to unlock your weekly calendar.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                onClick={handleConfirmPlan}
                disabled={confirmLoading}
                className="flex items-center gap-2"
              >
                {confirmLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Confirm Plan
                  </>
                )}
              </Button>
              <Button 
                onClick={handleGenerateClick}
                variant="outline" 
                disabled={confirmLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate Strategy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default view - Has a confirmed strategy plan
  return (
    <>
      <StrategyOverviewCard 
        onRegenerateClick={handleGenerateClick}
        fullPlanText={fullPlanText}
      />
      
      {/* Regenerate/Generate confirmation modal */}
      {showRegenerateModal && user && (
        <RegeneratePlanModal
          isOpen={showRegenerateModal}
          onClose={() => setShowRegenerateModal(false)}
          userId={user.id}
          onSuccess={checkForStrategy}
          isFirstGeneration={isFirstGeneration}
          onGenerationStart={handleGenerationStart}
        />
      )}
    </>
  );
};
