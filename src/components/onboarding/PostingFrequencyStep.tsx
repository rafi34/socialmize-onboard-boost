
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { XPDisplay } from "@/components/onboarding/XPDisplay";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { PostingFrequency } from "@/types/onboarding";
import { ONBOARDING_STEPS } from "@/types/onboarding";

const OPTIONS: { value: PostingFrequency; label: string; icon: string }[] = [
  { value: "multiple_daily", label: "Multiple posts/day", icon: "⚡" },
  { value: "daily", label: "Daily", icon: "📆" },
  { value: "three_to_five_weekly", label: "3-5x a week", icon: "🔄" },
  { value: "one_to_two_weekly", label: "1-2x a week", icon: "🗓️" },
  { value: "warming_up", label: "Just warming up", icon: "🔥" },
];

export const PostingFrequencyStep = () => {
  const { onboardingAnswers, updateAnswer, nextStep, previousStep, currentStep } = useOnboarding();
  const [selected, setSelected] = useState<PostingFrequency | null>(onboardingAnswers.posting_frequency_goal);
  
  const currentStepData = ONBOARDING_STEPS[currentStep];

  const handleSelect = (value: PostingFrequency) => {
    setSelected(value);
    updateAnswer("posting_frequency_goal", value);
  };

  const handleNext = () => {
    if (selected) {
      nextStep();
    }
  };

  return (
    <div className="onboarding-card">
      <div className="flex justify-between items-center">
        <div className="text-xl font-semibold">{currentStepData.title}</div>
        <XPDisplay />
      </div>

      <h2 className="text-2xl font-bold mt-4 mb-6">How often will you post content?</h2>
      
      <div className="space-y-3 mb-6">
        {OPTIONS.map((option) => (
          <div
            key={option.value}
            className={`option-card flex items-center ${selected === option.value ? "selected" : ""}`}
            onClick={() => handleSelect(option.value)}
          >
            <div className="text-2xl mr-3">{option.icon}</div>
            <div className="font-medium">{option.label}</div>
          </div>
        ))}
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
          disabled={!selected}
          className="bg-socialmize-purple hover:bg-socialmize-dark-purple text-white"
        >
          Next
        </Button>
      </div>
      
      <ProgressBar />
    </div>
  );
};
