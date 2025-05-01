
import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { RegeneratePlanModal } from "./RegeneratePlanModal";
import { StrategyOverviewCard } from "./StrategyOverviewCard";
import { supabase } from "@/integrations/supabase/client";

interface StrategyOverviewSectionProps {
  onPlanConfirmed?: (confirmed: boolean) => void;
}

export const StrategyOverviewSection = ({ onPlanConfirmed }: StrategyOverviewSectionProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasStrategy, setHasStrategy] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [isFirstGeneration, setIsFirstGeneration] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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
        .select('id, first_five_scripts')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error("Error checking for strategy:", error);
        return;
      }
      
      const hasExistingStrategy = !!data;
      setHasStrategy(hasExistingStrategy);
      setIsFirstGeneration(!hasExistingStrategy);
      
      // Check if plan is confirmed by looking for first_five_scripts
      const isPlanConfirmed = !!(data?.first_five_scripts && 
        Array.isArray(data.first_five_scripts) && 
        data.first_five_scripts.length > 0);
        
      if (onPlanConfirmed) {
        onPlanConfirmed(isPlanConfirmed);
      }
    } catch (error) {
      console.error("Error in checkForStrategy:", error);
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

  // Empty state - No strategy plan yet
  if (!isLoading && !hasStrategy) {
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

  // Default view - Has a strategy plan
  return (
    <>
      <StrategyOverviewCard 
        onRegenerateClick={handleGenerateClick} 
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
