
import React, { createContext, useContext, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { OnboardingAnswers, UserProgress, ONBOARDING_STEPS } from "@/types/onboarding";

interface OnboardingContextType {
  currentStep: number;
  onboardingAnswers: OnboardingAnswers;
  userProgress: UserProgress;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateAnswer: <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => void;
  gainXP: (amount: number) => void;
  completeOnboarding: () => void;
}

const initialOnboardingAnswers: OnboardingAnswers = {
  creator_mission: null,
  creator_style: null,
  content_format_preference: null,
  posting_frequency_goal: null,
  existing_content: null,
  shooting_preference: null,
  shooting_schedule: null,
  shooting_reminder: null,
  onboarding_complete: false,
  profile_progress: 0
};

const initialUserProgress: UserProgress = {
  xp: 0,
  level: 0,
  streak: 0,
  badges: [],
  last_post_date: null
};

export const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingAnswers, setOnboardingAnswers] = useState<OnboardingAnswers>(initialOnboardingAnswers);
  const [userProgress, setUserProgress] = useState<UserProgress>(initialUserProgress);
  const { toast } = useToast();

  const nextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      const nextStepValue = currentStep + 1;
      setCurrentStep(nextStepValue);
      
      // Update progress
      const progress = ONBOARDING_STEPS[nextStepValue].progress;
      setOnboardingAnswers(prev => ({
        ...prev,
        profile_progress: progress
      }));

      // Award XP
      const xpGain = ONBOARDING_STEPS[nextStepValue].xpGain;
      if (xpGain > 0) {
        gainXP(xpGain);
      }
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateAnswer = <K extends keyof OnboardingAnswers>(
    key: K, 
    value: OnboardingAnswers[K]
  ) => {
    setOnboardingAnswers(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const gainXP = (amount: number) => {
    setUserProgress(prev => ({
      ...prev,
      xp: prev.xp + amount
    }));

    // Show XP gain toast
    if (amount > 0) {
      // Create a random position for the XP gain animation
      const xPos = Math.floor(Math.random() * 50) + 25; // 25-75% of screen width
      
      // Create the XP gain element
      const xpElement = document.createElement('div');
      xpElement.className = 'xp-gain';
      xpElement.style.left = `${xPos}%`;
      xpElement.innerText = `+${amount} XP`;
      document.body.appendChild(xpElement);
      
      // Remove the element after animation completes
      setTimeout(() => {
        document.body.removeChild(xpElement);
      }, 1000);

      toast({
        title: `+${amount} XP Gained!`,
        description: "Keep going to level up your creator journey!",
        variant: "default",
      });
    }
  };

  const completeOnboarding = () => {
    setOnboardingAnswers(prev => ({
      ...prev,
      onboarding_complete: true,
      profile_progress: 100
    }));

    // Award OG Creator badge
    setUserProgress(prev => ({
      ...prev,
      badges: [...prev.badges, "og_creator"]
    }));

    // In a real app, we would save all data to the database here
    console.log("Onboarding complete! Answers:", onboardingAnswers);
    console.log("User progress:", userProgress);
  };

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        onboardingAnswers,
        userProgress,
        setCurrentStep,
        nextStep,
        previousStep,
        updateAnswer,
        gainXP,
        completeOnboarding
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};
