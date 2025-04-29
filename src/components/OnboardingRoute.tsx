
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface OnboardingRouteProps {
  children: React.ReactNode;
}

export const OnboardingRoute = ({ children }: OnboardingRouteProps) => {
  const { user, loading } = useAuth();
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_complete')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching onboarding status:', error);
        } else {
          setIsOnboarded(data.onboarding_complete);
        }
      } catch (error) {
        console.error('Error in checkOnboardingStatus:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    if (user) {
      checkOnboardingStatus();
    } else if (!loading) {
      setCheckingStatus(false);
    }
  }, [user, loading]);

  // Show loading while checking auth and onboarding status
  if (loading || (user && checkingStatus)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-socialmize-purple"></div>
      </div>
    );
  }

  // If not authenticated, redirect to auth page
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If onboarded, redirect to dashboard
  if (isOnboarded) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not onboarded and checked, show onboarding
  return <>{children}</>;
};
