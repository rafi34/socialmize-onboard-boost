
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { XPDisplay } from "@/components/onboarding/XPDisplay";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { CreatorMission } from "@/types/onboarding";
import { ONBOARDING_STEPS } from "@/types/onboarding";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const OPTIONS: { value: CreatorMission; label: string; icon: string }[] = [
  { value: "gain_followers", label: "Gain 10K+ followers", icon: "🚀" },
  { value: "get_leads", label: "Get Leads for my Business", icon: "💼" },
  { value: "grow_personal_brand", label: "Grow my Personal Brand", icon: "👤" },
  { value: "go_viral", label: "Go Viral and Build Momentum", icon: "🔥" },
  { value: "build_community", label: "Build a Loyal Community", icon: "👥" },
];

export const CreatorMissionStep = () => {
  const { onboardingAnswers, updateAnswer, nextStep, previousStep, currentStep } = useOnboarding();
  const [selected, setSelected] = useState<CreatorMission | null>(onboardingAnswers.creator_mission);

  const currentStepData = ONBOARDING_STEPS[currentStep];

  const handleSelect = (value: CreatorMission) => {
    setSelected(value);
    updateAnswer("creator_mission", value);
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

      <h2 className="text-2xl font-bold mt-4 mb-6">What's your main goal as a creator?</h2>
      
      <div className="space-y-3 mb-6">
        {OPTIONS.map((option) => (
          <Badge
            key={option.value}
            variant={selected === option.value ? "default" : "outline"}
            className={`
              w-full py-3 px-4 cursor-pointer flex items-center
              ${selected === option.value 
                ? "bg-socialmize-purple text-white" 
                : "bg-background hover:bg-accent"}
              transition-all text-sm font-medium
            `}
            onClick={() => handleSelect(option.value)}
          >
            <span className="text-2xl mr-3">{option.icon}</span>
            <span className="font-medium">{option.label}</span>
            {selected === option.value && <Check className="h-4 w-4 ml-auto" />}
          </Badge>
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
