
import { Progress } from "@/components/ui/progress";
import { Flame } from "lucide-react";
import { ProgressData } from "@/types/dashboard";

interface CreatorSummaryHeaderProps {
  user: any;
  progress: ProgressData | null;
  loading: boolean;
}

export const CreatorSummaryHeader = ({ user, progress, loading }: CreatorSummaryHeaderProps) => {
  if (loading) {
    return <div className="h-20 bg-muted animate-pulse rounded-lg"></div>;
  }

  const userName = user?.email ? user.email.split('@')[0] : 'Creator';
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);
  const levelTag = progress?.level_tag || 'Creator';
  const xpNextLevel = progress?.xp_next_level || 100;
  const xpPercentage = progress ? (progress.current_xp / xpNextLevel) * 100 : 0;

  return (
    <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm mb-6">
      <h1 className="text-xl font-bold mb-2">Welcome back, {displayName}!</h1>
      
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-sm">
          Level {progress?.current_level || 1} – {levelTag}
        </div>
        <div className="flex items-center gap-1 text-sm">
          {Array.from({ length: progress?.streak_days || 0 }).map((_, i) => (
            <Flame key={i} className="h-4 w-4 text-orange-500" />
          ))}
          {progress?.streak_days ? (
            <span className="text-sm font-medium">{progress.streak_days}-Day Streak</span>
          ) : (
            <span className="text-sm text-muted-foreground">Start your streak!</span>
          )}
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>XP Progress</span>
          <span>{progress?.current_xp || 0}/{xpNextLevel} XP</span>
        </div>
        <Progress value={xpPercentage} className="h-2" />
      </div>
    </div>
  );
};
