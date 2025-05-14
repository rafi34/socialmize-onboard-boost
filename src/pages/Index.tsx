
import React from 'react';
import { OnboardingProvider, useOnboarding } from "@/contexts/OnboardingContext";
import { Onboarding } from "@/components/onboarding/Onboarding";

export const Index = () => {
  return (
    <OnboardingProvider>
      <Onboarding />
    </OnboardingProvider>
  );
};
