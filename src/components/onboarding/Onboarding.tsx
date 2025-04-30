
import { useOnboarding } from "@/contexts/OnboardingContext";
import { WelcomeScreen } from "@/components/onboarding/WelcomeScreen";
import { CreatorMissionStep } from "@/components/onboarding/CreatorMissionStep";
import { CreatorStyleStep } from "@/components/onboarding/CreatorStyleStep";
import { ContentFormatStep } from "@/components/onboarding/ContentFormatStep";
import { PostingFrequencyStep } from "@/components/onboarding/PostingFrequencyStep";
import { ContentLibraryStep } from "@/components/onboarding/ContentLibraryStep";
import { ShootingModeStep } from "@/components/onboarding/ShootingModeStep";
import { CelebrationScreen } from "@/components/onboarding/CelebrationScreen";

export const Onboarding = () => {
  const { currentStep } = useOnboarding();

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeScreen />;
      case 1:
        return <CreatorMissionStep />;
      case 2:
        return <CreatorStyleStep />;
      case 3:
        return <ContentFormatStep />;
      case 4:
        return <PostingFrequencyStep />;
      case 5:
        return <ContentLibraryStep />;
      case 6:
        return <ShootingModeStep />;
      case 7:
        return <CelebrationScreen />;
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <div className="onboarding-container">
      {renderStep()}
    </div>
  );
};
