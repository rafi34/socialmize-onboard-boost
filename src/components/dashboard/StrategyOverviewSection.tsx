
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, CheckCircle, RefreshCw } from "lucide-react";
import { RegeneratePlanModal } from "./RegeneratePlanModal";

interface StrategyPhase {
  title: string;
  goal: string;
  tactics: string[];
  content_plan?: {
    weekly_schedule: Record<string, number>;
    example_post_ideas: string[];
  };
}

interface StrategyData {
  id: string;
  user_id: string;
  summary: string | null;
  phases: StrategyPhase[] | null;
  first_five_scripts: any[] | null;
}

export const StrategyOverviewSection = ({ 
  onPlanConfirmed 
}: { 
  onPlanConfirmed?: (confirmed: boolean) => void 
}) => {
  const { user } = useAuth();
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [planConfirmed, setPlanConfirmed] = useState(false);

  const fetchStrategyPlan = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log("Fetching strategy plan for user:", user.id);
      
      const { data, error } = await supabase
        .from('strategy_profiles')
        .select('id, user_id, summary, phases, first_five_scripts')
        .eq('user_id', user.id)
        .limit(1)
        .single();
      
      if (error) {
        console.error("Error fetching strategy plan:", error);
        toast({
          title: "Error",
          description: "Unable to load your strategy plan. Please try again.",
          variant: "destructive",
        });
      } else if (data) {
        console.log("Strategy plan data:", data);
        
        // Type cast the data properly to our StrategyData interface
        const typedStrategy: StrategyData = {
          id: data.id,
          user_id: data.user_id,
          summary: data.summary,
          phases: data.phases as unknown as StrategyPhase[],
          first_five_scripts: data.first_five_scripts as any[]
        };
        
        setStrategy(typedStrategy);
        
        // Check if plan has been confirmed (first_five_scripts exist)
        const confirmed = !!(data.first_five_scripts && 
          Array.isArray(data.first_five_scripts) && 
          data.first_five_scripts.length > 0);
          
        setPlanConfirmed(confirmed);
        if (onPlanConfirmed) {
          onPlanConfirmed(confirmed);
        }
      } else {
        console.log("No strategy plan found");
        setStrategy(null);
        setPlanConfirmed(false);
        if (onPlanConfirmed) {
          onPlanConfirmed(false);
        }
      }
    } catch (error) {
      console.error("Error in fetchStrategyPlan:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategyPlan();
  }, [user]);

  const handleRegenerate = () => {
    setShowRegenerateModal(true);
  };

  const handleConfirm = async () => {
    if (!user || !strategy) return;
    
    try {
      toast({
        title: "Confirming plan...",
        description: "We're unlocking your starter scripts and weekly calendar.",
      });
      
      // Call edge function to generate scripts and calendar
      const { data, error } = await supabase.functions.invoke('confirm-strategy-plan', {
        body: { 
          userId: user.id,
          strategyPlanId: strategy.id 
        }
      });
      
      if (error) {
        console.error("Error confirming strategy plan:", error);
        toast({
          title: "Error",
          description: "Unable to confirm your strategy plan. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      // Show success message
      toast({
        title: "Plan confirmed!",
        description: "Your starter scripts and weekly calendar are now available.",
      });
      
      // Refresh data
      setPlanConfirmed(true);
      if (onPlanConfirmed) {
        onPlanConfirmed(true);
      }
      fetchStrategyPlan();
    } catch (error) {
      console.error("Error in handleConfirm:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Your Strategy Plan (Tailored for You)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-socialmize-purple mb-4"></div>
            <p className="text-center text-muted-foreground">Your strategy plan is loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!strategy || !strategy.phases) {
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
              onClick={handleRegenerate}
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

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="pb-2 flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-lg">Your Strategy Plan (Tailored for You)</CardTitle>
          </div>
          {planConfirmed && (
            <div className="flex items-center text-green-500 text-xs font-medium bg-green-100 rounded-full py-1 px-2">
              <CheckCircle className="h-3 w-3 mr-1" />
              <span>Plan Confirmed</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary paragraph */}
          {strategy.summary && (
            <div className="p-4 bg-socialmize-light-purple/50 rounded-lg border border-socialmize-light-purple">
              <p className="text-sm">{strategy.summary}</p>
            </div>
          )}

          {/* Phase breakdown */}
          <div className="space-y-4">
            {strategy.phases && strategy.phases.map((phase, index) => (
              <Card key={index} className="border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-md">Phase {index + 1}: {phase.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{phase.goal}</p>
                </CardHeader>
                <CardContent>
                  {/* Tactics */}
                  {phase.tactics && phase.tactics.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Tactics:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {phase.tactics.map((tactic, i) => (
                          <li key={i} className="text-sm">{tactic}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Content Plan */}
                  {phase.content_plan && (
                    <div className="mt-4">
                      {/* Weekly Schedule */}
                      {phase.content_plan.weekly_schedule && 
                       Object.keys(phase.content_plan.weekly_schedule).length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-xs font-medium text-muted-foreground mb-2">Weekly Schedule:</h5>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {Object.entries(phase.content_plan.weekly_schedule).map(([format, count], i) => (
                              <div key={i} className="bg-muted p-2 rounded text-xs">
                                <span className="font-medium">{format}</span>: {count}x/week
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Example Post Ideas */}
                      {phase.content_plan.example_post_ideas && 
                       phase.content_plan.example_post_ideas.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-muted-foreground mb-2">Example Post Ideas:</h5>
                          <ul className="list-disc pl-5 space-y-1">
                            {phase.content_plan.example_post_ideas.slice(0, 3).map((idea, i) => (
                              <li key={i} className="text-sm">{idea}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {!planConfirmed ? (
            <Button 
              onClick={handleConfirm}
              variant="default"
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Confirm Plan
            </Button>
          ) : (
            <Button 
              onClick={() => window.location.href = '/strategy-chat'}
              variant="default"
            >
              Use This Strategy
            </Button>
          )}
          <Button 
            onClick={handleRegenerate}
            variant="outline" 
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Regenerate Strategy
          </Button>
        </CardFooter>
      </Card>

      {/* Regenerate confirmation modal */}
      {showRegenerateModal && user && (
        <RegeneratePlanModal
          isOpen={showRegenerateModal}
          onClose={() => setShowRegenerateModal(false)}
          userId={user.id}
          onSuccess={fetchStrategyPlan}
          isFirstGeneration={!strategy}
        />
      )}
    </>
  );
};
