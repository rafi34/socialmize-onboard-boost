
import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Wrench, TrendingUp, Package, Megaphone, RefreshCw, CheckCircle, FileText, List } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { RegeneratePlanModal } from "./RegeneratePlanModal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { strategyJsonToText, parseFullStrategyJson } from "@/utils/parseFullStrategyJson";

interface StrategyPhase {
  title: string;
  goal: string;
  tactics: string[];
  content_plan?: {
    weekly_schedule: Record<string, number>;
    example_post_ideas: string[];
  };
}

interface StrategyPlan {
  id: string;
  user_id: string;
  summary: string | null;
  phases: StrategyPhase[] | null;
  created_at: string | null;
  confirmed: boolean;
  full_plan_text?: string | null;
}

export const StrategyPlanSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [isFirstGeneration, setIsFirstGeneration] = useState(false);
  const [planConfirmed, setPlanConfirmed] = useState(false);
  const [humanReadableStrategy, setHumanReadableStrategy] = useState<string | null>(null);

  // Setup React Query for fetching the strategy plan
  const { data: strategyPlan, isLoading: loading, refetch } = useQuery({
    queryKey: ['strategyPlan', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      console.log("Fetching strategy plan for user:", user.id);
      
      // Fetch from the strategy_profiles table - use order by created_at and limit 1
      // to always get the most recent strategy plan
      const { data, error } = await supabase
        .from('strategy_profiles')
        .select('id, user_id, summary, phases, created_at, full_plan_text')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        console.error("Error fetching strategy plan:", error);
        toast({
          title: "Error",
          description: "Unable to load your strategy plan. Please try again.",
          variant: "destructive",
        });
        return null;
      } 
      
      if (!data) {
        console.log("No strategy plan found");
        setIsFirstGeneration(true);
        return null;
      }
      
      console.log("Strategy plan data:", data);
      
      // Parse the full plan text if available
      let parsedJson = null;
      if (data.full_plan_text) {
        parsedJson = parseFullStrategyJson(data.full_plan_text);
        
        // Generate human-readable strategy text
        const readableText = strategyJsonToText(parsedJson);
        setHumanReadableStrategy(readableText);
      }
      
      // Convert the JSON data to the proper type with proper type casting
      const phasesData = data.phases as unknown;
      const parsedData: StrategyPlan = {
        ...data,
        phases: Array.isArray(phasesData) 
          ? phasesData.map(phase => ({
              title: phase.title || "",
              goal: phase.goal || "",
              tactics: Array.isArray(phase.tactics) ? phase.tactics : [],
              content_plan: phase.content_plan ? {
                weekly_schedule: phase.content_plan.weekly_schedule || {},
                example_post_ideas: Array.isArray(phase.content_plan.example_post_ideas) 
                  ? phase.content_plan.example_post_ideas 
                  : []
              } : undefined
            }))
          : null,
        confirmed: false // Default to not confirmed
      };
      
      setIsFirstGeneration(false);
      return parsedData;
    },
    enabled: !!user,
  });

  // Check if plan has been confirmed - fix the query to handle multiple rows
  const { data: confirmationStatus } = useQuery({
    queryKey: ['planConfirmation', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      try {
        // Check if weekly_calendar exists to determine if plan has been confirmed
        // Get only the most recent strategy profile
        const { data, error } = await supabase
          .from('strategy_profiles')
          .select('weekly_calendar')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (error) {
          console.error("Error checking plan confirmation:", error);
          return false;
        }
        
        // If weekly_calendar exists and is not null, plan has been confirmed
        const confirmed = !!(data?.weekly_calendar && 
          typeof data.weekly_calendar === 'object');
          
        setPlanConfirmed(confirmed);
        console.log("Plan confirmation status:", confirmed);
        return confirmed;
      } catch (error) {
        console.error("Error in checkPlanConfirmation:", error);
        return false;
      }
    },
    enabled: !!user,
  });
  
  useEffect(() => {
    if (confirmationStatus !== undefined) {
      setPlanConfirmed(confirmationStatus);
    }
  }, [confirmationStatus]);

  const handleGenerateClick = () => {
    if (user) {
      setShowRegenerateModal(true);
    }
  };

  const handleConfirmPlan = async () => {
    if (!user || !strategyPlan) return;
    
    try {
      toast({
        title: "Confirming plan...",
        description: "We're unlocking your starter scripts and weekly calendar.",
      });
      
      // Call edge function to generate scripts and calendar
      const { data, error } = await supabase.functions.invoke('confirm-strategy-plan', {
        body: { 
          userId: user.id,
          strategyPlanId: strategyPlan.id 
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
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['planConfirmation', user.id]
      });

      // Navigate to strategy chat page
      navigate('/strategy-chat');
      
    } catch (error) {
      console.error("Error in handleConfirmPlan:", error);
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
      <Card className="mb-6" id="strategyPlanSection">
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
  if (!strategyPlan) {
    return (
      <Card className="mb-6" id="strategyPlanSection">
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

  return (
    <>
      <Card className="mb-6" id="strategyPlanSection">
        <CardHeader className="pb-2 flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-lg">Your Strategy Plan (Tailored for You)</CardTitle>
          </div>
          <div className="flex items-center space-x-1">
            {planConfirmed ? (
              <div className="flex items-center text-green-500 text-xs font-medium bg-green-100 rounded-full py-1 px-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                <span>Plan Confirmed</span>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Human-readable strategy text */}
          {humanReadableStrategy ? (
            <div className="p-4 bg-socialmize-light-purple/20 rounded-lg border border-socialmize-light-purple/30 whitespace-pre-wrap">
              {humanReadableStrategy}
            </div>
          ) : strategyPlan.summary ? (
            <div className="p-4 bg-socialmize-light-purple/50 rounded-lg border border-socialmize-light-purple flex gap-4">
              <FileText className="h-6 w-6 text-socialmize-purple shrink-0 mt-1" />
              <p className="text-sm">{strategyPlan.summary}</p>
            </div>
          ) : null}

          {/* Only show phases section if no human-readable text is available */}
          {!humanReadableStrategy && strategyPlan.phases && (
            <>
              <div className="flex items-center gap-2">
                <List className="h-5 w-5 text-socialmize-purple" />
                <h3 className="font-medium text-base">Strategy Phases</h3>
              </div>

              {/* Phases section */}
              {strategyPlan.phases.map((phase, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-socialmize-light-purple p-2 rounded-full">
                      {getPhaseIcon(index)}
                    </div>
                    <div>
                      <h3 className="font-bold">{phase.title}</h3>
                      <p className="text-sm text-muted-foreground">{phase.goal}</p>
                    </div>
                  </div>

                  {/* Tactics */}
                  {phase.tactics && phase.tactics.length > 0 && (
                    <div className="mb-4">
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
                      <h4 className="text-sm font-medium mb-2">Content Plan:</h4>
                      
                      {/* Weekly Schedule */}
                      {phase.content_plan.weekly_schedule && 
                      Object.keys(phase.content_plan.weekly_schedule).length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-xs font-medium text-muted-foreground mb-2">Weekly Schedule:</h5>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
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
                            {phase.content_plan.example_post_ideas.slice(0, 5).map((idea, i) => (
                              <li key={i} className="text-sm">{idea}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between gap-4 flex-wrap">
          {!planConfirmed ? (
            <Button 
              onClick={handleConfirmPlan}
              variant="default"
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Confirm Plan
            </Button>
          ) : (
            <Button 
              onClick={() => navigate('/strategy-chat')}
              variant="default"
            >
              Use This Strategy
            </Button>
          )}
          <Button 
            onClick={handleGenerateClick}
            variant="outline" 
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Regenerate Strategy
          </Button>
        </CardFooter>
      </Card>

      {/* Regenerate/Generate confirmation modal */}
      {showRegenerateModal && user && (
        <RegeneratePlanModal
          isOpen={showRegenerateModal}
          onClose={() => setShowRegenerateModal(false)}
          userId={user.id}
          onSuccess={() => {
            // Refetch strategy plan data after regeneration
            refetch();
            // Also invalidate the plan confirmation status
            queryClient.invalidateQueries({
              queryKey: ['planConfirmation', user.id]
            });
          }}
          isFirstGeneration={isFirstGeneration}
          onGenerationStart={() => {
            // This will be called when generation starts
            // We'll setup a retry mechanism to check for the new plan
            const checkForNewPlan = () => {
              refetch();
            };
            
            // Check after a reasonable timeout to allow for generation
            setTimeout(checkForNewPlan, 30000);
          }}
        />
      )}
    </>
  );
};

// Helper function to get phase icon
const getPhaseIcon = (index: number) => {
  const icons = [
    <Brain className="h-5 w-5 text-socialmize-purple" />,
    <Wrench className="h-5 w-5 text-socialmize-purple" />,
    <TrendingUp className="h-5 w-5 text-socialmize-purple" />,
    <Package className="h-5 w-5 text-socialmize-purple" />,
    <Megaphone className="h-5 w-5 text-socialmize-purple" />
  ];
  return icons[index % icons.length];
};
