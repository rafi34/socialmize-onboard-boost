
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/components/ui/use-toast';

// Define the types for our onboarding data
export type CreatorMission = string;
export type CreatorStyle = string;
export type ContentFormat = string;
export type PostingFrequency = string;
export type ShootingPreference = string;
export type NicheTopic = string;

export interface OnboardingData {
  creator_mission?: CreatorMission;
  creator_style?: CreatorStyle;
  content_format_preference?: ContentFormat;
  posting_frequency_goal?: PostingFrequency;
  shooting_preference?: ShootingPreference;
  shooting_schedule?: Date | null;
  shooting_reminder?: boolean;
  existing_content?: boolean;
  niche_topic?: NicheTopic;
  profile_progress?: number;
}

interface UserProgress {
  xp: number;
  level: number;
  streak: number;
}

// Define the context type
export interface OnboardingContextType {
  data: OnboardingData;
  onboardingAnswers: OnboardingData; // Alias for data
  currentStep: number;
  totalSteps: number;
  xpEarned: number;
  isLoading: boolean;
  userProgress: UserProgress;
  updateAnswer: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K] | ((prevValue: OnboardingData[K]) => OnboardingData[K])) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  nextStep: () => void; // Alias for goToNextStep
  previousStep: () => void; // Alias for goToPreviousStep
  completeOnboarding: () => Promise<void>;
  setCurrentStep: (step: number) => void;
}

// Create the context with a default value
const OnboardingContext = createContext<OnboardingContextType>({
  data: {},
  onboardingAnswers: {},
  currentStep: 1,
  totalSteps: 7,
  xpEarned: 0,
  isLoading: false,
  userProgress: { xp: 0, level: 1, streak: 0 },
  updateAnswer: () => {},
  goToNextStep: () => {},
  goToPreviousStep: () => {},
  nextStep: () => {},
  previousStep: () => {},
  completeOnboarding: async () => {},
  setCurrentStep: () => {}
});

// Create the provider component
export const OnboardingProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [data, setData] = useState<OnboardingData>({ profile_progress: 0 });
  const [currentStep, setCurrentStep] = useState(1);
  const [xpEarned, setXpEarned] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [userProgress, setUserProgress] = useState<UserProgress>({ xp: 0, level: 1, streak: 0 });
  const totalSteps = 7;
  const { user } = useAuth();

  // Update a specific answer
  const updateAnswer = <K extends keyof OnboardingData>(
    key: K, 
    value: OnboardingData[K] | ((prevValue: OnboardingData[K]) => OnboardingData[K])
  ) => {
    setData(prevData => {
      const newValue = typeof value === 'function' 
        ? (value as Function)(prevData[key]) 
        : value;
      
      // Update the progress when an answer is provided
      const updatedProgress = Math.min(100, (Object.keys(prevData).length / 7) * 100);
      
      return { ...prevData, [key]: newValue, profile_progress: updatedProgress };
    });
  };

  // Navigate to the next step
  const goToNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Navigate to the previous step
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Complete the onboarding process
  const completeOnboarding = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Save onboarding data to Supabase
      const { error } = await supabase
        .from('onboarding_answers')
        .upsert({
          user_id: user.id,
          creator_mission: data.creator_mission,
          creator_style: data.creator_style,
          content_format_preference: data.content_format_preference,
          posting_frequency_goal: data.posting_frequency_goal,
          shooting_preference: data.shooting_preference,
          shooting_schedule: data.shooting_schedule,
          existing_content: data.existing_content,
          niche_topic: data.niche_topic,
        });

      if (error) {
        throw error;
      }

      // Update user profile to mark onboarding as complete
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_complete: true })
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      // Award XP for completing onboarding
      try {
        const { error: xpError } = await supabase.functions.invoke('award-xp', {
          body: { userId: user.id, amount: 100, type: 'onboarding_complete' }
        });

        if (xpError) {
          console.error("Error awarding XP:", xpError);
        } else {
          setXpEarned(100);
        }
      } catch (xpErr) {
        console.error("Failed to award XP:", xpErr);
      }

      toast({
        title: "Onboarding Complete!",
        description: "Your profile has been updated successfully.",
      });
      
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Provide the context value
  const value: OnboardingContextType = {
    data,
    onboardingAnswers: data, // Alias for backwards compatibility
    currentStep,
    totalSteps,
    xpEarned,
    isLoading,
    userProgress,
    updateAnswer,
    goToNextStep,
    goToPreviousStep,
    nextStep: goToNextStep, // Alias for backwards compatibility
    previousStep: goToPreviousStep, // Alias for backwards compatibility
    completeOnboarding,
    setCurrentStep
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

// Custom hook for using the onboarding context
export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
