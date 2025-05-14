import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "./AuthContext";

export interface OnboardingContextType {
  // Add missing properties
  onboardingAnswers: {
    creator_mission?: string;
    creator_style?: string;
    content_format_preference?: string;
    posting_frequency_goal?: string;
    shooting_preference?: string;
    existing_content?: string;
    niche_topic?: string;
    [key: string]: string | undefined;
  };
  setOnboardingAnswers: (answers: any) => void;
  currentStep: number;
  nextStep: () => void;
  previousStep: () => void;
  setCurrentStep: (step: number) => void;
  isStepComplete: (step: number) => boolean;
  userProgress: {
    level: number;
    xp: number;
  };
  resetOnboarding: () => void;
  completeOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error(
      "useOnboarding must be used within a OnboardingContextProvider"
    );
  }
  return context;
};

interface OnboardingContextProviderProps {
  children: React.ReactNode;
}

export const OnboardingContextProvider: React.FC<
  OnboardingContextProviderProps
> = ({ children }) => {
  const [onboardingAnswers, setOnboardingAnswers] = useState<any>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [userProgress, setUserProgress] = useState({ level: 1, xp: 0 });
  const { user } = useAuth();
  const navigate = useNavigate();

  const totalSteps = 5;

  useEffect(() => {
    fetchOnboardingData();
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("level, xp")
        .eq("id", user?.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        return;
      }

      if (data) {
        setUserProgress({ level: data.level, xp: data.xp });
      }
    } catch (err) {
      console.error("Error in fetchUserProfile:", err);
    }
  };

  // Update the fetch function to handle the case where last_completed_step might not exist
  const fetchOnboardingData = async () => {
    try {
      const { data, error } = await supabase
        .from("onboarding_answers")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching onboarding data:", error);
        return;
      }

      if (data) {
        setOnboardingAnswers(data);
        // Use optional chaining to safely access last_completed_step
        const lastStep = (data as any).last_completed_step;
        if (lastStep !== undefined) {
          setCurrentStep(lastStep + 1);
        }
      }
    } catch (err) {
      console.error("Error in fetchOnboardingData:", err);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepComplete = useCallback(
    (step: number) => {
      if (!onboardingAnswers) return false;

      switch (step) {
        case 1:
          return !!onboardingAnswers.creator_mission;
        case 2:
          return !!onboardingAnswers.creator_style;
        case 3:
          return !!onboardingAnswers.content_format_preference;
        case 4:
          return !!onboardingAnswers.posting_frequency_goal;
        case 5:
          return !!onboardingAnswers.niche_topic;
        default:
          return false;
      }
    },
    [onboardingAnswers]
  );

  const resetOnboarding = () => {
    setCurrentStep(1);
    setOnboardingAnswers({});
  };

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      // Ensure all required fields are present before submission
      if (
        !onboardingAnswers.creator_mission ||
        !onboardingAnswers.creator_style ||
        !onboardingAnswers.content_format_preference ||
        !onboardingAnswers.posting_frequency_goal ||
        !onboardingAnswers.niche_topic
      ) {
        console.warn("Not all onboarding fields are filled.");
        return;
      }

      const { data, error } = await supabase
        .from("onboarding_answers")
        .upsert(
          [
            {
              user_id: user.id,
              creator_mission: onboardingAnswers.creator_mission,
              creator_style: onboardingAnswers.creator_style,
              content_format_preference:
                onboardingAnswers.content_format_preference,
              posting_frequency_goal: onboardingAnswers.posting_frequency_goal,
              shooting_preference: onboardingAnswers.shooting_preference,
              existing_content: onboardingAnswers.existing_content,
              niche_topic: onboardingAnswers.niche_topic,
              last_completed_step: currentStep,
            },
          ],
          { onConflict: "user_id" }
        )
        .select()

      if (error) {
        console.error("Error saving onboarding answers:", error);
        return;
      }

      console.log("Onboarding completed and data saved:", data);
      navigate("/dashboard");
    } catch (err) {
      console.error("Error in completeOnboarding:", err);
    }
  };

  // Make sure the context provider properly includes all the required values
  const contextValue: OnboardingContextType = {
    onboardingAnswers,
    setOnboardingAnswers,
    currentStep,
    nextStep,
    previousStep,
    setCurrentStep,
    isStepComplete,
    userProgress,
    resetOnboarding,
    completeOnboarding,
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
};
