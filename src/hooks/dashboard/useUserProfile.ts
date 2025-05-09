
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

export function useUserProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);

  const fetchProfileData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      
      const onboarded = profileData?.onboarding_complete || false;
      setProfileComplete(onboarded);
    } catch (err) {
      console.error("Error fetching profile data:", err);
      setProfileComplete(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfileData();
  }, [user, fetchProfileData]);

  return {
    profileComplete,
    fetchProfileData,
    loading,
    user
  };
}
