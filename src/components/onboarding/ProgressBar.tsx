
import { useOnboarding } from "@/contexts/OnboardingContext";

export const ProgressBar = () => {
  const { onboardingAnswers } = useOnboarding();
  const progress = onboardingAnswers.profile_progress;

  return (
    <div className="progress-bar">
      <div 
        className="progress-fill animate-progress-fill" 
        style={{ width: `${progress}%`, transition: 'width 0.5s ease-out' }}
      />
    </div>
  );
};
