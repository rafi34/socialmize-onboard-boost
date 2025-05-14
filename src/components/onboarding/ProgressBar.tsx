
import { useOnboarding } from "@/contexts/OnboardingContext";

export const ProgressBar = () => {
  const { onboardingAnswers } = useOnboarding();
  const progress = onboardingAnswers.profile_progress;

  return (
    <div className="mt-8 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-socialmize-purple to-socialmize-blue animate-progress-fill" 
        style={{ width: `${progress}%`, transition: 'width 0.5s ease-out' }}
      />
    </div>
  );
};
