
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy } from "lucide-react";
import { ProgressData } from "@/types/dashboard";

interface LevelProgressCardProps {
  progress: ProgressData | null;
  loading: boolean;
}

export const LevelProgressCard = ({ progress, loading }: LevelProgressCardProps) => {
  if (loading) {
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

  if (!progress) {
    return null;
  }

  // Calculate XP needed for next level (in a real app, this would be more dynamic)
  const currentXP = progress.current_xp || 0;
  const nextLevelXP = progress.xp_next_level || (progress.current_level * 100);
  const xpNeeded = nextLevelXP - currentXP;
  const xpPercentage = (currentXP / nextLevelXP) * 100;

  const nextLevelReward = progress.current_level === 1 
    ? "Unlock Custom Design Templates" 
    : progress.current_level === 2 
      ? "Unlock Skit Templates" 
      : "Unlock Advanced Analytics";

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Next Level Unlock</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-socialmize-light-purple p-2 rounded-full">
            <Trophy className="h-6 w-6 text-socialmize-purple" />
          </div>
          <div>
            <h3 className="font-medium">Level {progress.current_level + 1}</h3>
            <p className="text-sm text-muted-foreground">{nextLevelReward}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>You're {xpNeeded} XP away from Level {progress.current_level + 1}</span>
            <span>{currentXP}/{nextLevelXP}</span>
          </div>
          <Progress value={xpPercentage} className="h-2" />
        </div>
        
        <p className="text-sm text-center mt-3">
          Post 3 more times this week to level up!
        </p>
      </CardContent>
    </Card>
  );
};
