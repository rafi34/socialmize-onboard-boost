
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { calculateLevelProgress, getXpForNextLevel } from "@/utils/xpUtils";

interface LevelProgressCardProps {
  loading?: boolean;
  progress?: any; // Allow progress to be passed optionally
}

interface ProfileData {
  level: number;
  xp: number;
  strategist_persona?: string;
}

export const LevelProgressCard = ({ loading: initialLoading, progress: progressProp }: LevelProgressCardProps) => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(initialLoading || true);

  useEffect(() => {
    if (user && !progressProp) {
      fetchProfileData();
    } else if (progressProp) {
      // If progress is directly passed as prop, use it
      setProfileData({
        level: progressProp.current_level || 1,
        xp: progressProp.current_xp || 0,
        strategist_persona: progressProp.level_tag
      });
      setIsLoading(false);
    }
  }, [user, progressProp]);

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

  // Calculate progress to next level
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
