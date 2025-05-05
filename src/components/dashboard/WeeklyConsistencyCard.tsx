
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Flame, Trophy, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ConsistencyStats {
  weeklyXp: number;
  streak: number;
  target: number;
  totalScripts: number;
}

export const WeeklyConsistencyCard = () => {
  const [stats, setStats] = useState<ConsistencyStats>({
    weeklyXp: 0,
    streak: 0,
    target: 100,
    totalScripts: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when day is sunday
  const weekStart = new Date(today.setDate(diff));
  
  useEffect(() => {
    if (user) {
      fetchConsistencyStats();
    }
  }, [user]);

  const fetchConsistencyStats = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch weekly XP and streak
      const { data: xpData, error: xpError } = await supabase.functions.invoke('get-weekly-xp', {
        body: { 
          userId: user.id,
          startDate: weekStart.toISOString()
        }
      });
      
      if (xpError) throw xpError;
      
      // Fetch total scripts count
      const { count, error: countError } = await supabase
        .from('generated_scripts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
        
      if (countError) throw countError;
      
      // Update stats
      setStats({
        weeklyXp: xpData?.xp || 0,
        streak: xpData?.streak || 0,
        target: 100, // Weekly target XP
        totalScripts: count || 0
      });
    } catch (err) {
      console.error('Error fetching consistency stats:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate progress percentage, capped at 100%
  const progressPercentage = Math.min(100, (stats.weeklyXp / stats.target) * 100);
  
  // Get message based on progress
  const getMotivationalMessage = () => {
    if (stats.weeklyXp >= stats.target) return "Goal achieved! Great work! 🎉";
    if (progressPercentage >= 75) return "Almost there! Keep going! 💪";
    if (progressPercentage >= 50) return "Halfway to your goal! 👍";
    if (progressPercentage >= 25) return "Good progress! 👌";
    return "Just getting started! 🌱";
  };

  // Get streak color class based on streak length
  const getStreakColorClass = () => {
    if (stats.streak >= 7) return "text-orange-500";
    if (stats.streak >= 3) return "text-yellow-500";
    return "text-muted-foreground";
  };

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Weekly Consistency
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-muted-foreground">Weekly XP</span>
                <span className="text-sm font-medium">{stats.weeklyXp} / {stats.target} XP</span>
              </div>
              <Progress 
                value={progressPercentage} 
                className={cn(
                  "h-2",
                  progressPercentage >= 100 ? "bg-green-100" : "bg-slate-100"
                )}
                indicatorClassName={cn(
                  progressPercentage >= 100 ? "bg-green-500" : "bg-socialmize-purple"
                )}
              />
              <p className="text-xs mt-1 text-muted-foreground">{getMotivationalMessage()}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center bg-accent/30 rounded-md p-3">
                <Flame className={cn("h-5 w-5 mb-1", getStreakColorClass())} />
                <span className={cn("text-xl font-bold", getStreakColorClass())}>{stats.streak}</span>
                <span className="text-xs text-muted-foreground">Day Streak</span>
              </div>
              
              <div className="flex flex-col items-center bg-accent/30 rounded-md p-3">
                <Trophy className="h-5 w-5 mb-1 text-blue-500" />
                <span className="text-xl font-bold text-blue-500">{stats.totalScripts}</span>
                <span className="text-xs text-muted-foreground">Total Scripts</span>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                <Target className="h-3 w-3 inline mr-1" />
                Weekly goal: {stats.target} XP
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
