
import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Wrench, TrendingUp, Package, Megaphone, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
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

interface StrategyPlan {
  id: string;
  user_id: string;
  assistant_id: string | null;
  summary: string | null;
  phases: StrategyPhase[] | null;
  created_at: string | null;
}

export const StrategyPlanSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [strategyPlan, setStrategyPlan] = useState<StrategyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);

  // Define fetchStrategyPlan function before using it
  const fetchStrategyPlan = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('strategy_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching strategy plan:", error);
        toast({
          title: "Error",
          description: "Unable to load your strategy plan. Please try again.",
          variant: "destructive",
        });
      } else if (data) {
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
            : null
        };
        setStrategyPlan(parsedData);
      }
    } catch (error) {
      console.error("Error in fetchStrategyPlan:", error);
    } finally {
      setLoading(false);
    }
  };

  // Use useEffect instead of useState for initializing data fetching
  useEffect(() => {
    fetchStrategyPlan();
  }, [user]); // Add user as dependency

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
  if (!strategyPlan) {
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
              onClick={() => {
                if (user) {
                  setShowRegenerateModal(true);
                }
              }}
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
        <CardHeader>
          <CardTitle className="text-lg">Your Strategy Plan (Tailored for You)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary section */}
          {strategyPlan.summary && (
            <div className="p-4 bg-socialmize-light-purple/50 rounded-lg border border-socialmize-light-purple">
              <p className="text-sm">{strategyPlan.summary}</p>
            </div>
          )}

          {/* Phases section */}
          {strategyPlan.phases && strategyPlan.phases.map((phase, index) => (
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
                  {phase.content_plan.weekly_schedule && (
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
                  {phase.content_plan.example_post_ideas && phase.content_plan.example_post_ideas.length > 0 && (
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
        </CardContent>
        <CardFooter className="flex justify-between gap-4 flex-wrap">
          <Button 
            onClick={() => navigate('/strategy-chat')}
            variant="default"
          >
            Use This Strategy
          </Button>
          <Button 
            onClick={() => setShowRegenerateModal(true)} 
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
        />
      )}
    </>
  );
};
