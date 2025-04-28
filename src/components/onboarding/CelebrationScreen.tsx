
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { XPDisplay } from "@/components/onboarding/XPDisplay";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { Confetti } from "@/components/onboarding/Confetti";
import { useNavigate } from "react-router-dom";

export const CelebrationScreen = () => {
  const { completeOnboarding, userProgress } = useOnboarding();
  const navigate = useNavigate();

  useEffect(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  const handleContinue = () => {
    navigate("/dashboard");
  };

  return (
    <div className="onboarding-card text-center relative">
      <Confetti particleCount={100} />
      
      <XPDisplay />
      
      <div className="my-8 animate-scale-in">
        <div className="inline-block bg-gradient-to-r from-socialmize-purple to-socialmize-blue p-3 rounded-full mb-4">
          <div className="bg-white rounded-full p-4 flex items-center justify-center">
            <div className="text-4xl">👑</div>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-2">
          You're Officially an OG Creator!
        </h1>
        
        <div className="font-medium text-xl text-socialmize-purple mb-2">
          +100 XP Earned
        </div>
        
        <div className="text-lg mb-6">
          Your customized content strategy is ready!
        </div>
      </div>
      
      <div className="bg-socialmize-light-purple rounded-xl p-4 mb-6">
        <div className="text-lg font-semibold mb-2">🏆 OG Creator Badge Unlocked</div>
        <div className="text-sm">
          You've just joined the founding members of SocialMize!
          Your customized scripts are now ready.
        </div>
      </div>
      
      <Button 
        onClick={handleContinue}
        className="bg-socialmize-purple hover:bg-socialmize-dark-purple text-white font-semibold text-lg py-6 px-8 rounded-xl"
        size="lg"
      >
        Let's Build Your First Viral Moment
      </Button>
      
      <ProgressBar />
    </div>
  );
};
