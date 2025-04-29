
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { XPDisplay } from "@/components/onboarding/XPDisplay";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { Confetti } from "@/components/onboarding/Confetti";
import { useState } from "react";
import { Icons } from "@/components/Icons";

export const CelebrationScreen = () => {
  const { completeOnboarding, isLoading } = useOnboarding();
  const [showConfetti, setShowConfetti] = useState(true);

  const handleComplete = async () => {
    await completeOnboarding();
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
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              Processing...
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
