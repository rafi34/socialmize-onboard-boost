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

export const CelebrationScreen = () => {
  const { completeOnboarding, isLoading, onboardingAnswers } = useOnboarding();
  const [showConfetti, setShowConfetti] = useState(true);
  const [generatingStrategy, setGeneratingStrategy] = useState(false);
  const navigate = useNavigate();

  const handleComplete = async () => {
    try {
      setGeneratingStrategy(true);
      
      // First, save the onboarding data
      await completeOnboarding();
      
      // Then generate the user's strategy with OpenAI
      const { data: generatedStrategy, error } = await supabase.functions.invoke('generate-strategy', {
        body: { onboardingAnswers }
      });
      
      if (error) {
        console.error("Error generating strategy:", error);
        toast({
          title: "Strategy generation failed",
          description: "We couldn't generate your content strategy. Please try again later.",
          variant: "destructive"
        });
        
        // Still navigate to dashboard even if strategy generation fails
        navigate('/dashboard');
      } else {
        console.log("Strategy generated successfully:", generatedStrategy);
        
        // Store the strategy in local storage temporarily
        // In a real implementation, you would store this in the database
        if (generatedStrategy?.strategy) {
          localStorage.setItem('userStrategy', JSON.stringify(generatedStrategy.strategy));
          toast({
            title: "Strategy ready!",
            description: "Your personalized content strategy has been created!",
          });
          
          // Navigate to dashboard with the new strategy
          navigate('/dashboard');
        } else {
          console.error("Generated strategy has unexpected format:", generatedStrategy);
          toast({
            title: "Strategy generation incomplete",
            description: "Your strategy was created but may be missing some details.",
            variant: "default"
          });
          navigate('/dashboard');
        }
      }
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
};
