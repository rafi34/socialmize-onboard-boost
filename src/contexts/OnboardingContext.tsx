
import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { OnboardingAnswers, UserProgress, ONBOARDING_STEPS, CreatorMission, CreatorStyle, ContentFormat, PostingFrequency, ShootingPreference } from "@/types/onboarding";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OnboardingContextType {
  currentStep: number;
  onboardingAnswers: OnboardingAnswers;
  userProgress: UserProgress;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateAnswer: <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => void;
  gainXP: (amount: number) => void;
  completeOnboarding: () => Promise<void>;
  isLoading: boolean;
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
  profile_progress: 0,
  niche_topic: null
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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Load existing onboarding answers if available
  useEffect(() => {
    if (user) {
      fetchOnboardingAnswers();
    }
  }, [user]);

  const fetchOnboardingAnswers = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      console.log("Fetching onboarding answers for user:", user.id);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('onboarding_complete, profile_progress')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        // Don't return early, try to proceed with other data
      } else if (profile) {
        // Update onboarding status from profile
        setOnboardingAnswers(prev => ({
          ...prev,
          onboarding_complete: profile.onboarding_complete,
          profile_progress: profile.profile_progress
        }));

        // If onboarding is already complete, redirect to dashboard
        if (profile.onboarding_complete) {
          navigate('/dashboard');
          return; // Stop further processing
        }
      }

      // Try to fetch answers, but handle case where table might not exist yet
      try {
        const { data: answers, error: answersError } = await supabase
          .from('onboarding_answers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (answersError) {
          console.log('No existing onboarding answers or error fetching:', answersError.message);
          
          // If the table doesn't exist or there's another error, we'll create new answers later
          if (answersError.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine
            console.warn(`Error fetching onboarding answers (${answersError.code}):`, answersError.message);
          }
        } else if (answers) {
          console.log("Found existing onboarding answers:", answers);
          
          // Update answers from database
          setOnboardingAnswers(prev => ({
            ...prev,
            creator_mission: answers.creator_mission as CreatorMission | null,
            creator_style: answers.creator_style as CreatorStyle | null,
            content_format_preference: answers.content_format_preference as ContentFormat | null,
            posting_frequency_goal: answers.posting_frequency_goal as PostingFrequency | null,
            existing_content: answers.existing_content === 'true' ? true : 
                           answers.existing_content === 'false' ? false : null,
            shooting_preference: answers.shooting_preference as ShootingPreference | null,
            shooting_schedule: answers.shooting_schedule ? new Date(answers.shooting_schedule) : null,
            niche_topic: answers.niche_topic || null
          }));
        }
      } catch (error) {
        console.error('Unexpected error in fetchOnboardingAnswers:', error);
      }
    } catch (error) {
      console.error('Error in fetchOnboardingAnswers:', error);
      toast({
        title: "Error loading onboarding data",
        description: "There was a problem loading your progress. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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

      // Save progress to database
      if (user) {
        updateProfileProgress(progress);
      }

      // Award XP
      const xpGain = ONBOARDING_STEPS[nextStepValue].xpGain;
      if (xpGain > 0) {
        gainXP(xpGain);
      }
    }
  };

  const updateProfileProgress = async (progress: number) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ profile_progress: progress })
        .eq('id', user.id);
        
      if (error) {
        console.error('Error updating profile progress:', error);
      }
    } catch (error) {
      console.error('Error in updateProfileProgress:', error);
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

  const completeOnboarding = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Update profile to mark onboarding as complete
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          onboarding_complete: true,
          profile_progress: 100
        })
        .eq('id', user.id);
        
      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }
      
      // Convert boolean and Date to appropriate string format for Supabase
      const existingContent = onboardingAnswers.existing_content !== null 
        ? String(onboardingAnswers.existing_content) 
        : null;
        
      const shootingSchedule = onboardingAnswers.shooting_schedule 
        ? onboardingAnswers.shooting_schedule.toISOString() 
        : null;
      
      // Check if onboarding_answers table exists and try to save the answers
      try {
        // Try to save answers to the onboarding_answers table
        const { data: existingAnswers, error: checkError } = await supabase
          .from('onboarding_answers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking existing answers:', checkError);
          // Continue anyway, we'll use the data in-memory for strategy generation
        }

        const answerData = {
          creator_mission: onboardingAnswers.creator_mission,
          creator_style: onboardingAnswers.creator_style,
          content_format_preference: onboardingAnswers.content_format_preference,
          posting_frequency_goal: onboardingAnswers.posting_frequency_goal,
          existing_content: existingContent,
          shooting_preference: onboardingAnswers.shooting_preference,
          shooting_schedule: shootingSchedule,
          niche_topic: onboardingAnswers.niche_topic,
        };
          
        // Either update or insert based on whether answers already exist
        if (existingAnswers) {
          const { error: updateError } = await supabase
            .from('onboarding_answers')
            .update({
              ...answerData,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingAnswers.id);
            
          if (updateError) {
            console.error('Error updating onboarding answers:', updateError);
            // Continue anyway, we'll use the data in-memory for strategy generation
          }
        } else {
          const { error: insertError } = await supabase
            .from('onboarding_answers')
            .insert({
              user_id: user.id,
              ...answerData
            });
            
          if (insertError) {
            console.error('Error saving onboarding answers:', insertError);
            // Continue anyway, we'll use the data in-memory for strategy generation
          }
        }
      } catch (error) {
        console.error('Error saving to onboarding_answers:', error);
        // Continue anyway, we'll use the data in-memory for strategy generation
      }

      // When onboarding completes, always sync settings to strategy_profile
      try {
        await supabase.functions.invoke('sync-creator-settings', {
          body: { userId: user.id }
        });
      } catch (error) {
        console.error('Error syncing creator settings:', error);
        // Not critical, continue
      }

      // Update local state
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

      // Navigate to dashboard on completion
      navigate('/dashboard');
      
      toast({
        title: "Onboarding Complete!",
        description: "Welcome to SocialMize! You're ready to start creating viral content.",
      });
      
    } catch (error) {
      console.error('Error in completeOnboarding:', error);
      toast({
        title: "Error Completing Onboarding",
        description: "There was a problem saving your information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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
        completeOnboarding,
        isLoading
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
