
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { calculateLevelProgress, getXpForNextLevel } from "@/utils/xpUtils";
import { ReminderConfetti } from "./ReminderConfetti";

interface LevelProgressCardProps {
  loading?: boolean;
  progress?: any;
}

interface ProfileData {
  level: number;
  xp: number;
  strategist_persona?: string;
}

export const LevelProgressCard = ({ loading: initialLoading, progress: progressProp }: LevelProgressCardProps) => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(initialLoading || true);
  const [showCelebration, setShowCelebration] = useState<boolean>(false); // Fixed: Changed to boolean

  useEffect(() => {
    if (user && !progressProp) {
      fetchProfileData();
    } else if (progressProp) {
      setProfileData({
        level: progressProp.current_level || 1,
        xp: progressProp.current_xp || 0,
        strategist_persona: progressProp.level_tag
      });
      setIsLoading(false);
    }
  }, [user, progressProp]);

  useEffect(() => {
    if (profileData?.level) {
      const lastSeen = parseInt(localStorage.getItem("socialmize_last_seen_level") || "1");
      if (profileData.level > lastSeen) {
        setShowCelebration(true);
        localStorage.setItem("socialmize_last_seen_level", profileData.level.toString());
      }
    }
  }, [profileData?.level]);

  const fetchProfileData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('level, xp, strategist_persona')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfileData(data);
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Level Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted animate-pulse rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!profileData) {
    return null;
  }

  const currentLevel = profileData.level || 1;
  const currentXP = profileData.xp || 0;
  const nextLevelXP = getXpForNextLevel(currentLevel);
  const xpNeeded = Math.max(0, nextLevelXP - currentXP);
  const xpPercentage = calculateLevelProgress(currentXP, currentLevel);

  const getNextLevelReward = (level: number): string => {
    switch (level) {
      case 1: return "Unlock Custom Design Templates";
      case 2: return "Unlock Skit Templates";
      case 3: return "Unlock Advanced Analytics";
      case 4: return "Unlock AI Content Remixer";
      case 5: return "Unlock Calendar Integration";
      default: return "Unlock Special Templates";
    }
  };

  const nextLevelReward = getNextLevelReward(currentLevel);

  return (
    <Card className="mb-6">
      {showCelebration && (
        <div className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 px-6 rounded-xl shadow-xl flex items-center justify-between mb-4 animate-in fade-in slide-in-from-top-4">
          <div>
            <p className="text-xl font-bold">🎉 You reached Level {currentLevel}!</p>
            <p className="text-sm mt-1">Unlocked: {getNextLevelReward(currentLevel)}</p>
          </div>
          <button
            onClick={() => setShowCelebration(false)} // Now correctly passing boolean
            className="bg-white text-black rounded px-3 py-1 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}
      {showCelebration && <ReminderConfetti active={true} />}

      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Star className="h-5 w-5 mr-2 text-yellow-500" />
          Level {currentLevel} Creator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-socialmize-light-purple p-2 rounded-full">
            <Trophy className="h-6 w-6 text-socialmize-purple" />
          </div>
          <div>
            <h3 className="font-medium">Next: Level {currentLevel + 1}</h3>
            <p className="text-sm text-muted-foreground">{nextLevelReward}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>You're {xpNeeded} XP away from Level {currentLevel + 1}</span>
            <span>{currentXP}/{nextLevelXP}</span>
          </div>
          <Progress value={xpPercentage} className="h-2" />
        </div>

        <p className="text-sm text-center mt-3">
          Post content regularly to earn more XP!
        </p>
      </CardContent>
    </Card>
  );
};
