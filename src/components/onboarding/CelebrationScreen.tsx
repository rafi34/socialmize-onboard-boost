
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { XPDisplay } from "@/components/onboarding/XPDisplay";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { Confetti } from "@/components/onboarding/Confetti";
import { useState } from "react";
import { Icons } from "@/components/Icons";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const CelebrationScreen = () => {
  const { completeOnboarding, isLoading, onboardingAnswers } = useOnboarding();
  const { user } = useAuth();
  const [showConfetti, setShowConfetti] = useState(true);
  const [generatingStrategy, setGeneratingStrategy] = useState(false);
  const navigate = useNavigate();

  const handleComplete = async () => {
    if (!user) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to complete onboarding.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setGeneratingStrategy(true);
      
      // First, save the onboarding data
      await completeOnboarding();
      
      console.log("Calling generate-strategy-plan with userId:", user.id);
      console.log("Onboarding answers:", onboardingAnswers);
      
      // Generate the user's strategy plan
      const { data: generatedStrategy, error } = await supabase.functions.invoke('generate-strategy-plan', {
        body: { 
          userId: user.id,
          onboardingData: onboardingAnswers 
        }
      });
      
      if (error) {
        console.error("Error generating strategy plan:", error);
        toast({
          title: "Strategy generation failed",
          description: "We couldn't generate your content strategy. Please try again later.",
          variant: "destructive"
        });
      } else {
        console.log("Strategy plan generated successfully:", generatedStrategy);
        toast({
          title: "Strategy ready!",
          description: "Your personalized content strategy has been created!",
        });
        
        // Create initial progress tracking entry
        const { error: progressError } = await supabase.from('progress_tracking').insert({
          user_id: user.id,
          current_xp: 100,
          current_level: 1,
          streak_days: 1,
          last_activity_date: new Date().toISOString()
        });
        
        if (progressError) {
          console.error("Error creating progress tracking:", progressError);
        }
      }
      
      // Always navigate to dashboard, even with errors
      // The dashboard will handle showing the strategy or generation UI
      navigate('/dashboard');
      
    } catch (error) {
      console.error("Error in handleComplete:", error);
      toast({
        title: "Error completing onboarding",
        description: "There was a problem completing your onboarding. Please try again.",
        variant: "destructive"
      });
      
      // Still navigate to dashboard even if there's an error
      navigate('/dashboard');
    } finally {
      setGeneratingStrategy(false);
    }
  };

  return (
    <div className="onboarding-card text-center">
      {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}
      
      <XPDisplay />
      
      <div className="mt-8 mb-10">
        <div className="badge-unlock mb-4">
          <div className="badge-icon text-4xl">🏆</div>
          <div className="badge-label text-sm font-medium text-socialmize-purple">OG Creator Badge Unlocked!</div>
        </div>
        
        <h1 className="text-3xl font-bold mb-3">You're an OG Creator!</h1>
        <p className="text-lg">Ready for your first viral moment?</p>
      </div>
      
      <div className="mb-8">
        <p className="text-muted-foreground mb-6">
          Your personalized strategy and first 5 content scripts are ready
        </p>
        
        <Button 
          onClick={handleComplete}
          className="bg-socialmize-purple hover:bg-socialmize-dark-purple text-white font-semibold text-lg py-6 px-8 rounded-xl w-full"
          size="lg"
          disabled={isLoading || generatingStrategy}
        >
          {isLoading || generatingStrategy ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              {isLoading ? "Processing..." : "Creating Your Strategy..."}
            </>
          ) : (
            "Let's Build Your First Viral Moment"
          )}
        </Button>
      </div>
      
      <ProgressBar />
    </div>
  );
}
