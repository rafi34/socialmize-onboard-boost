import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, CalendarCheck, Flame } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subDays, differenceInDays } from "date-fns";

interface WeeklyXPResponse {
  success?: boolean;
  xp: number;
  source?: string;
  error?: string;
}

export const WeeklyConsistencyCard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState({
    completedTasks: 0,
    totalTasks: 7,
    currentStreak: 0,
    bestStreak: 0,
    weeklyXP: 0
  });

  useEffect(() => {
    const fetchConsistencyData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const startOfWeek = subDays(new Date(), 7);

        const { data: completedReminders, error: remindersError } = await supabase
          .from('reminders')
          .select('id')
          .eq('user_id', user.id)
          .eq('completed', true)
          .gte('updated_at', startOfWeek.toISOString());

        if (remindersError) throw remindersError;

        // Remove the explicit generic type parameter to avoid the excessive type depth error
        const { data: xpData, error: xpError } = await supabase.functions.invoke('get-weekly-xp', {
          body: { 
            userId: user.id, 
            startDate: startOfWeek.toISOString()
          }
        });

        if (xpError) throw xpError;

        const { data: progressData, error: progressError } = await supabase
          .from('progress_tracking')
          .select('streak_days, last_activity_date')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (progressError) throw progressError;

        let currentStreak = 0;
        if (progressData?.last_activity_date) {
          const lastActivity = new Date(progressData.last_activity_date);
          const daysSince = differenceInDays(new Date(), lastActivity);
          if (daysSince <= 1) currentStreak = progressData.streak_days || 0;
        }

        setWeeklyData({
          completedTasks: completedReminders?.length || 0,
          totalTasks: 7,
          currentStreak,
          bestStreak: currentStreak,
          weeklyXP: xpData?.xp || 0
        });
      } catch (err) {
        console.error("WeeklyConsistency error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConsistencyData();
  }, [user]);

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Weekly Consistency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const completionPercentage = Math.min(
    100,
    (weeklyData.completedTasks / weeklyData.totalTasks) * 100
  );

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Weekly Consistency</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-socialmize-purple" />
              <span className="font-medium">Tasks Completed</span>
            </div>
            <span className="text-sm">
              {weeklyData.completedTasks}/{weeklyData.totalTasks}
            </span>
          </div>

          <Progress value={completionPercentage} className="h-2" />

          <div className="grid grid-cols-2 gap-4 mt-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-socialmize-orange" />
              <div>
                <div className="text-sm text-muted-foreground">Current Streak</div>
                <div className="font-bold">{weeklyData.currentStreak} days</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-socialmize-purple" />
              <div>
                <div className="text-sm text-muted-foreground">Weekly XP</div>
                <div className="font-bold">{weeklyData.weeklyXP} XP</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
