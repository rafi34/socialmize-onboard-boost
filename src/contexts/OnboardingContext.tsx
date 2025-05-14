
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

// Types for onboarding state
interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  answers: Record<string, any>;
  completed: boolean;
  skipped: boolean;
}

// Context type definition
interface OnboardingContextType {
  onboardingState: OnboardingState;
  updateAnswer: (questionId: string, answer: any) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  completeOnboarding: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
  isLoading: boolean;
}

// Default context state
const defaultOnboardingState: OnboardingState = {
  currentStep: 1,
  totalSteps: 10, // Update this based on your actual number of steps
  answers: {},
  completed: false,
  skipped: false,
};

// Create context
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Provider component
export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(defaultOnboardingState);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Load existing onboarding state when component mounts
  useEffect(() => {
    if (user) {
      loadOnboardingState();
    }
  }, [user]);

  // Function to load onboarding state from backend
  const loadOnboardingState = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Check if user has already completed onboarding
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      // If onboarding is complete, set state accordingly
      if (profileData?.onboarding_complete) {
        setOnboardingState({
          ...defaultOnboardingState,
          completed: true,
        });
        return;
      }

      // Load saved answers if any
      const { data: answersData, error: answersError } = await supabase
        .from("onboarding_answers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (answersError) throw answersError;

      if (answersData) {
        // Filter out the metadata fields like user_id and created_at
        const { user_id, created_at, id, ...savedAnswers } = answersData;
        
        // We might need to convert some answers back to their original form
        // e.g. converting string arrays back from PostgreSQL format
        
        setOnboardingState({
          ...onboardingState,
          answers: savedAnswers,
          currentStep: answersData.last_completed_step ? answersData.last_completed_step + 1 : 1
        });
      }
    } catch (error) {
      console.error("Error loading onboarding state:", error);
      toast({
        title: "Error",
        description: "Failed to load your onboarding progress.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update a specific answer
  const updateAnswer = (questionId: string, answer: any) => {
    setOnboardingState(prevState => ({
      ...prevState,
      answers: {
        ...prevState.answers,
        [questionId]: answer
      }
    }));
  };

  // Move to the next step
  const goToNextStep = () => {
    if (onboardingState.currentStep < onboardingState.totalSteps) {
      setOnboardingState(prevState => ({
        ...prevState,
        currentStep: prevState.currentStep + 1
      }));
    }
  };

  // Move to the previous step
  const goToPreviousStep = () => {
    if (onboardingState.currentStep > 1) {
      setOnboardingState(prevState => ({
        ...prevState,
        currentStep: prevState.currentStep - 1
      }));
    }
  };

  // Complete onboarding process
  const completeOnboarding = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Save final answers
      const { error: saveError } = await supabase
        .from("onboarding_answers")
        .upsert({
          user_id: user.id,
          ...onboardingState.answers,
          last_completed_step: onboardingState.totalSteps
        });

      if (saveError) throw saveError;

      // Mark onboarding as complete
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ 
          onboarding_complete: true,
          profile_progress: 100 // Set to 100% when onboarding is complete
        })
        .eq("id", user.id);

      if (updateError) throw updateError;
      
      // Generate initial content strategy
      await supabase.functions.invoke('generate-initial-strategy', {
        body: { userId: user.id }
      });

      // Update local state
      setOnboardingState(prevState => ({
        ...prevState,
        completed: true
      }));

      toast({
        title: "Onboarding Complete!",
        description: "Your personalized dashboard is ready.",
      });

      // Redirect to dashboard
      navigate("/dashboard");

    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Skip onboarding process
  const skipOnboarding = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Mark onboarding as skipped but complete
      const { error } = await supabase
        .from("profiles")
        .update({ 
          onboarding_complete: true,
          profile_progress: 50 // Set to 50% when onboarding is skipped
        })
        .eq("id", user.id);

      if (error) throw error;
      
      // Update local state
      setOnboardingState(prevState => ({
        ...prevState,
        completed: true,
        skipped: true
      }));

      toast({
        title: "Welcome to your dashboard!",
        description: "You can complete your profile anytime in settings.",
      });

      // Redirect to dashboard
      navigate("/dashboard");

    } catch (error) {
      console.error("Error skipping onboarding:", error);
      toast({
        title: "Error",
        description: "Failed to skip onboarding. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: OnboardingContextType = {
    onboardingState,
    updateAnswer,
    goToNextStep,
    goToPreviousStep,
    completeOnboarding,
    skipOnboarding,
    isLoading
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
};

// Hook for using the onboarding context
export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};
