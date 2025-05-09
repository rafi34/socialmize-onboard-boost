
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { ProgressData } from "@/types/dashboard";

export function useProgressTracking() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const fetchProgressData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log("Fetching progress data for user:", user.id);
      
      // Get the most recent progress_tracking entry
      const { data, error } = await supabase
        .from("progress_tracking")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      // If we have progress data, calculate next level values
      if (data) {
        const nextLevelXP = (data.current_level + 1) * 100;
        
        setProgress({
          current_xp: data.current_xp || 0,
          current_level: data.current_level || 1,
          streak_days: data.streak_days || 0,
          last_activity_date: data.last_activity_date || new Date().toISOString(),
          xp_next_level: nextLevelXP,
          level_tag: getLevelTag(data.current_level || 1)
        });
        
        console.log("Progress data loaded:", {
          xp: data.current_xp,
          level: data.current_level,
          nextLevelXP
        });
      } else {
        console.log("No progress data found for user");
      }
    } catch (err) {
      console.error("Error fetching progress data:", err);
    } finally {
      setLoading(false);
      setLastFetchTime(Date.now());
    }
  }, [user]);

  // Fetch on component mount and when user changes
  useEffect(() => {
    fetchProgressData();
  }, [user, fetchProgressData]);

  // Helper function to get level tag based on level number
  const getLevelTag = (level: number): string => {
    const levelTags = [
      "Rookie Creator",
      "Content Apprentice",
      "Social Builder",
      "Content Specialist",
      "Engagement Expert",
      "Creator Pro"
    ];
    
    return levelTags[Math.min(level - 1, levelTags.length - 1)];
  };

  return {
    progress,
    loading,
    fetchProgressData,
    lastFetchTime
  };
}
