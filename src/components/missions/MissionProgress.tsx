
import { Progress } from "@/components/ui/progress";

interface MissionProgressProps {
  completedCount: number;
  totalCount: number;
  currentLevel?: number;
  xpToNextLevel?: number;
  currentXp?: number;
}

export const MissionProgress = ({
  completedCount,
  totalCount,
  currentLevel = 1,
  xpToNextLevel = 100,
  currentXp = 0
}: MissionProgressProps) => {
  const percentComplete = (completedCount / totalCount) * 100;
  const xpPercent = (currentXp % xpToNextLevel) / xpToNextLevel * 100;
  
  return (
    <div className="glass-panel rounded-xl p-4 mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col w-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium flex items-center gap-1">
              <span className="inline-flex items-center justify-center bg-socialmize-purple text-white text-xs rounded-full h-5 w-5">
                {currentLevel}
              </span>
              Missions Completed
            </span>
            <span className="text-sm text-muted-foreground">
              {completedCount}/{totalCount}
            </span>
          </div>
          <Progress value={percentComplete} className="h-2 bg-gray-200" />
          
          <div className="flex items-center justify-between mt-3 mb-1">
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center bg-socialmize-orange text-white text-xs rounded-full h-5 w-5">
                XP
              </span>
              <span className="text-sm font-medium">
                Progress to Level {currentLevel + 1}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {currentXp % xpToNextLevel}/{xpToNextLevel} XP
            </span>
          </div>
          <Progress value={xpPercent} className="h-2 bg-gray-200 text-socialmize-orange" />
        </div>
      </div>
    </div>
  );
};
