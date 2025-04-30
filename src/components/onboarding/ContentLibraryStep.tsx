
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { XPDisplay } from "@/components/onboarding/XPDisplay";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { ONBOARDING_STEPS } from "@/types/onboarding";

export const ContentLibraryStep = () => {
  const { onboardingAnswers, updateAnswer, nextStep, previousStep, currentStep } = useOnboarding();
  const [selected, setSelected] = useState<boolean | null>(onboardingAnswers.existing_content);
  
  const currentStepData = ONBOARDING_STEPS[currentStep];

  const handleSelect = (value: boolean) => {
    setSelected(value);
    updateAnswer("existing_content", value);
  };

  const handleNext = () => {
    if (selected !== null) {
      nextStep();
    }
  };

  return (
    <div className="onboarding-card">
      <div className="flex justify-between items-center">
        <div className="text-xl font-semibold">{currentStepData.title}</div>
        <XPDisplay />
      </div>

      <h2 className="text-2xl font-bold mt-4 mb-6">Do you already have content?</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div
          className={`option-card flex flex-col items-center justify-center py-8 transition-all duration-200 hover:shadow-md ${selected === true ? "selected bg-socialmize-light-purple border-socialmize-purple" : "bg-white"}`}
          onClick={() => handleSelect(true)}
        >
          <div className="text-4xl mb-2">📚</div>
          <div className="font-medium text-lg">Yes, I do</div>
          <div className="text-sm text-muted-foreground">I have content ready</div>
        </div>
        
        <div
          className={`option-card flex flex-col items-center justify-center py-8 transition-all duration-200 hover:shadow-md ${selected === false ? "selected bg-socialmize-light-purple border-socialmize-purple" : "bg-white"}`}
          onClick={() => handleSelect(false)}
        >
          <div className="text-4xl mb-2">🆕</div>
          <div className="font-medium text-lg">No, I don't</div>
          <div className="text-sm text-muted-foreground">Starting fresh</div>
        </div>
      </div>
      
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={previousStep}
        >
          Back
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={selected === null}
          className="bg-socialmize-purple hover:bg-socialmize-dark-purple text-white"
        >
          Next
        </Button>
      </div>
      
      <ProgressBar />
    </div>
  );
};
