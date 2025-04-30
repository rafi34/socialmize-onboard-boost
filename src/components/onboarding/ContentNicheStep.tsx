
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { XPDisplay } from "@/components/onboarding/XPDisplay";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { ONBOARDING_STEPS } from "@/types/onboarding";

const NICHE_OPTIONS = [
  { id: "credit_funding", label: "Credit & funding" },
  { id: "fitness_moms", label: "Fitness for busy moms" },
  { id: "mens_fashion", label: "Men's fashion" },
  { id: "real_estate", label: "Real estate & investing" },
  { id: "spiritual", label: "Spiritual wellness" },
  { id: "productivity", label: "Productivity hacks" },
  { id: "career", label: "Career & job search" },
  { id: "other", label: "Other" },
];

export const ContentNicheStep = () => {
  const { onboardingAnswers, updateAnswer, nextStep, previousStep, currentStep } = useOnboarding();
  const [selectedNiche, setSelectedNiche] = useState<string | null>(
    onboardingAnswers.niche_topic || null
  );
  const [customNiche, setCustomNiche] = useState<string>("");
  const [isOtherSelected, setIsOtherSelected] = useState<boolean>(false);
  
  const currentStepData = ONBOARDING_STEPS[currentStep];

  const handleNicheSelect = (niche: string) => {
    if (niche === "Other") {
      setIsOtherSelected(true);
      setSelectedNiche("Other");
    } else {
      setIsOtherSelected(false);
      setSelectedNiche(niche);
      updateAnswer("niche_topic", niche);
    }
  };

  const handleCustomNicheChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomNiche(e.target.value);
  };

  const handleNext = () => {
    // If "Other" is selected, use the custom niche text
    if (isOtherSelected && customNiche.trim() !== "") {
      updateAnswer("niche_topic", customNiche.trim());
    } else if (!isOtherSelected && selectedNiche && selectedNiche !== "Other") {
      updateAnswer("niche_topic", selectedNiche);
    }
    nextStep();
  };

  const isNextDisabled = isOtherSelected 
    ? customNiche.trim() === "" 
    : !selectedNiche;

  return (
    <div className="onboarding-card">
      <div className="flex justify-between items-center">
        <div className="text-xl font-semibold">{currentStepData.title}</div>
        <XPDisplay />
      </div>
      
      <h2 className="text-2xl font-bold mt-4 mb-6">What's your content focus?</h2>
      
      <div className="grid grid-cols-2 gap-3 mb-6">
        {NICHE_OPTIONS.map((option) => (
          <Badge
            key={option.id}
            variant={selectedNiche === option.label ? "default" : "outline"}
            className={`
              py-3 px-4 cursor-pointer text-center flex items-center justify-center
              ${selectedNiche === option.label 
                ? "bg-socialmize-purple text-white" 
                : "bg-background hover:bg-accent"}
              transition-all text-sm font-medium
            `}
            onClick={() => handleNicheSelect(option.label)}
          >
            {selectedNiche === option.label && <Check className="h-4 w-4 mr-1" />}
            {option.label}
          </Badge>
        ))}
      </div>
      
      {isOtherSelected && (
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Enter your content niche (e.g., Pet care, Digital art)"
            value={customNiche}
            onChange={handleCustomNicheChange}
            className="w-full"
            autoFocus
          />
        </div>
      )}
      
      <div className="flex justify-between mt-8">
        <Button 
          variant="outline" 
          onClick={previousStep}
        >
          Back
        </Button>
        <Button 
          onClick={handleNext}
          disabled={isNextDisabled}
          className="bg-socialmize-purple hover:bg-socialmize-dark-purple text-white"
        >
          Next
        </Button>
      </div>
      
      <ProgressBar />
    </div>
  );
};
