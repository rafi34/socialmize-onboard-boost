
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Star, TrendingUp } from "lucide-react";

interface BadgeSummaryProps {
  unlockedCount: number;
  totalCount: number;
  totalXp: number;
  level: number;
}

export const BadgeSummary = ({ unlockedCount, totalCount, totalXp, level }: BadgeSummaryProps) => {
  // Calculate completion percentage
  const completionPercentage = Math.round((unlockedCount / totalCount) * 100);
  
  return (
    <Card className="mb-8 bg-gradient-to-r from-socialmize-light-purple to-white border-socialmize-purple">
      <CardContent className="p-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-socialmize-purple text-white p-3 rounded-full">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{unlockedCount} of {totalCount}</h3>
              <p className="text-sm text-muted-foreground">Badges Unlocked</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-socialmize-purple text-white p-3 rounded-full">
              <Star className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">+{totalXp} XP</h3>
              <p className="text-sm text-muted-foreground">From Badges</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-socialmize-purple text-white p-3 rounded-full">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Level {level}</h3>
              <p className="text-sm text-muted-foreground">Current Progress</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">Badge Progress</span>
            <span>{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-socialmize-purple h-2 rounded-full" 
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
        
        {completionPercentage < 50 ? (
          <p className="mt-3 text-sm font-medium text-center">
            🚀 You're on your way! Keep going to unlock more badges.
          </p>
        ) : completionPercentage < 80 ? (
          <p className="mt-3 text-sm font-medium text-center">
            🔥 You're on fire! You've unlocked more than half the badges.
          </p>
        ) : completionPercentage < 100 ? (
          <p className="mt-3 text-sm font-medium text-center">
            🥇 Almost there! Just a few more badges to unlock.
          </p>
        ) : (
          <p className="mt-3 text-sm font-medium text-center">
            🏆 Amazing! You've unlocked all available badges!
          </p>
        )}
      </CardContent>
    </Card>
  );
};
