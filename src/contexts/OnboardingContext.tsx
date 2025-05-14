
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

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
  shooting_schedule?: Date;
  existing_content?: boolean;
  niche_topic?: NicheTopic;
}

// Define the context type
export interface OnboardingContextType {
  data: OnboardingData;
  currentStep: number;
  totalSteps: number;
  xpEarned: number;
  isLoading: boolean;
  updateAnswer: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K] | ((prevValue: OnboardingData[K]) => OnboardingData[K])) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  completeOnboarding: () => Promise<void>;
  setCurrentStep: (step: number) => void;
}

// Create the context with a default value
const OnboardingContext = createContext<OnboardingContextType>({
  data: {},
  currentStep: 1,
  totalSteps: 7,
  xpEarned: 0,
  isLoading: false,
  updateAnswer: () => {},
  goToNextStep: () => {},
  goToPreviousStep: () => {},
  completeOnboarding: async () => {},
  setCurrentStep: () => {}
});

// Create the provider component
export const OnboardingProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [data, setData] = useState<OnboardingData>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [xpEarned, setXpEarned] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
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
      
      return { ...prevData, [key]: newValue };
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
    currentStep,
    totalSteps,
    xpEarned,
    isLoading,
    updateAnswer,
    goToNextStep,
    goToPreviousStep,
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
