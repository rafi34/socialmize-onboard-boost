
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { XPDisplay } from "@/components/onboarding/XPDisplay";
import { useOnboarding } from "@/contexts/OnboardingContext";

export const WelcomeScreen = () => {
  const { nextStep } = useOnboarding();

  return (
    <div className="onboarding-card text-center">
      <div className="flex justify-end">
        <XPDisplay />
      </div>
      
      <div className="animate-fade-in">
        <h1 className="mt-8 text-4xl font-bold bg-gradient-to-r from-socialmize-purple to-socialmize-blue bg-clip-text text-transparent">
          Welcome to SocialMize
        </h1>
        
        <div className="my-10 space-y-4">
          <div className="text-2xl font-semibold">
            It's time to stop consuming and start creating.
          </div>
          <div className="text-3xl font-bold text-socialmize-purple">
            Let's unlock your power ⚡️
          </div>
        </div>
        
        <Button 
          onClick={nextStep}
          className="bg-gradient-to-r from-socialmize-purple to-socialmize-dark-purple text-white font-semibold text-lg py-6 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 animate-bounce"
          size="lg"
        >
          Let's Start
        </Button>
      </div>
      
      <ProgressBar />
    </div>
  );
};
