
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { XPDisplay } from "@/components/onboarding/XPDisplay";

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
  const { onboardingAnswers, updateAnswer, nextStep, previousStep } = useOnboarding();
  const [selectedNiche, setSelectedNiche] = useState<string | null>(
    onboardingAnswers.niche_topic || null
  );
  const [customNiche, setCustomNiche] = useState<string>("");
  const [isOtherSelected, setIsOtherSelected] = useState<boolean>(false);

  const handleNicheSelect = (niche: string) => {
    if (niche === "other") {
      setIsOtherSelected(true);
      setSelectedNiche("other");
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
    } else if (!isOtherSelected && selectedNiche && selectedNiche !== "other") {
      updateAnswer("niche_topic", selectedNiche);
    }
    nextStep();
  };

  const isNextDisabled = isOtherSelected 
    ? customNiche.trim() === "" 
    : !selectedNiche;

  return (
    <div className="onboarding-step flex flex-col h-full">
      <div className="mb-4">
        <ProgressBar />
      </div>
      
      <div className="text-center mb-6">
        <XPDisplay />
        <h1 className="text-2xl font-bold mb-2">What's your content focus?</h1>
        <p className="text-gray-600 mb-6">
          Choose the niche or topic you'll be creating content about. This helps us generate tailored strategy, topics, and scripts for your audience.
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-6">
        {NICHE_OPTIONS.map((option) => (
          <Badge
            key={option.id}
            variant={selectedNiche === option.label ? "default" : "outline"}
            className={`
              py-3 px-4 cursor-pointer text-center flex items-center justify-center
              ${selectedNiche === option.label 
                ? "bg-primary text-white" 
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
      
      <div className="mt-auto flex justify-between">
        <Button 
          variant="outline" 
          onClick={previousStep}
        >
          Back
        </Button>
        <Button 
          onClick={handleNext}
          disabled={isNextDisabled}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};
