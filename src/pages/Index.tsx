
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { Onboarding } from "@/components/onboarding/Onboarding";

const Index = () => {
  return (
    <OnboardingProvider>
      <Onboarding />
    </OnboardingProvider>
  );
};

export default Index;
